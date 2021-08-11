# Kafka

：一个消息队列。
- [官方文档](http://kafka.apache.org/documentation/)
- 采用 Scala 开发。
- 2011 年由 LinkedIn 公司开源，后来捐献给了 ASF 。
  - 主要开发者离职后创建了 Confluent 公司，提供功能更多的 Kafka 发行版，分为开源版、企业版。
- 容易横向扩展，吞吐量的上限很高。

## 架构

- 基本架构：
  - 运行一些 Kafka 进程，组成集群。
  - 用户运行客户端程序，连接到 Kafka 服务器，作为 Producer 生产消息，或者作为 consumer 消费消息。

### Broker

：Kafka 服务器，负责存储、管理消息。
- broker 会将消息以日志文件的形式存储，存放在 `logs/<topic>-<partition>/` 目录下，因此会受到文件系统的影响。
- 增加 broker 的数量，就可以提高 Kafka 集群的吞吐量。
- Kafka 集群中会选出一个 broker 作为 Controller 。
  - 每个 broker 在启动之后，都会尝试到 zk 中创建 `/controller` 节点，创建成功则当选。
  - Controller 负责管理整个集群，比如会在每个 partition 的所有副本中选出一个作为 leader replica 。

### Producer

：生产者，即生产消息的客户端，负责发布消息到 broker（push 方式）。
- Producer 向某个 topic 发布消息时，默认会将消息随机分配到不同的 partition 。可以指定 partition ，也可以指定均衡策略来自动选择 partition 。

### Consumer

：消费者，即消费消息的客户端，负责从 broker 订阅消息（push 方式）、消费消息（pull 方式）。

### Consumer Group

：消费者组，用于在逻辑上对 consumer 分组管理。
- 客户端运行 consumer 实例时，可以指定其所属的 consumer group 。
  - 如果不指定，则该 consumer 的 group 为空，不会被 Coordinator 协调。
- 一个 consumer 同时只能消费一个 partition ，因此通常用一组 consumer 同时消费一个 topic 下的不同 partition ，通过并行消费来提高消费速度。
  - 当一个 group 消费一个 topic 时，如果 partition 的数量小于 consumer 的数量，就会有 consumer 空闲。
    - 因此，最好将 partition 的数量设置成与 consumer 数量相同，或者为 consumer 数量的整数倍。
  - 不同 group 之间相互独立，即使同时消费同一个 topic 下的同一个 partition 也互不影响。

### Coordinator

- Kafka 会根据 consumer group ID 的哈希值，分配 topic: __consumer_offsets 中的一个 partition ，用于存储该 group 的 offset 信息。
  - 该 partition 的 leader replica 所在的 broker 运行的 GroupCoordinator 类，负责管理该 group 的 consumer、offset 。
- Coordinator 管理的 consumer group 分为多个状态（group state）：
  ```sh
  PreparingRebalance    # 准备开始 Rebalance
  CompletingRebalance   # 即将完成 Rebalance ，正在发送分配方案
  Stable                # 已完成 Rebalance ，可以正常消费
  Empty                 # 组内没有成员
  Dead                  # 组内没有成员，且 offset 等 metadata 已删除，不能响应请求
  ```

- consumer 启动时，如果指定了所属的 consumer group ，则会发送带有 UNKNOWN_MEMBER_ID 标志的 JoinGroup 请求给 Coordinator ，请求加入指定的 group ，并请求分配 member id 。
  - GroupCoordinator 会给每个 consumer 分配一个 member id ，格式为 `client_id-UUID` ，其中 UUID 为随机生成的十六进制编号。
    - 第一个加入 group 的 consumer 会担任组长（Group Leader）。
    - 每个 consumer 会定时向 Coordinator 发送 Heartbeat 请求，以维持在线。否则 Coordinator 会从该 group 删除该 consumer 。
  - 组长负责分配各个 consumer 消费的 partition ，该过程称为 Consumer Rebalance 。流程如下：
    1. 组长从 Coordinator 获取该组的 consumer 列表，分配各个 consumer 消费的 partition 。
    2. 组长发送 SyncGroup 请求给 Coordinator ，告知分配方案。
    3. Coordinator 等收到 consumer 的 Heartbeat 请求时，在响应中告知已发生 Rebalance 。
    4. consumer 删掉内存中的 UUID 等成员信息，重新加入该 group ，进入新的 generation 。
  - 每次 Rebalance 时，group 就开始一个新时代（generation）。
    - 每个 generation 拥有一个从 0 递增的编号。
  - 每次 Rebalance ，，重新加入 group ，因此开销很大。

- Rebalance 期间，所有 consumer 都要暂停消费，因此应该尽量避免触发 Rebalance 。
  - 当 group 的 consumer 或 partition 数量变化时，都会自动触发一次 Rebalance 。
  - consumer 重启之后，会发送 JoinGroup 请求重新加入 group ，被分配一个新的 member id ， 触发一次 Rebalance 。
    - 而旧的 member id 不再使用，等到 Heartbeat 超时，又会触发一次 Rebalance 。
  - Kafka v2.3 开始，给 consumer 增加了配置参数 `group.instance.id` ，可以赋值一个非空字符串，作为当前 Group 下的 member 的唯一名称。
    - 此时 consumer 会从默认的 Dynamic Member 变成 Static Member ，重启之后发送 JoinGroup 请求时，Coordinator 会回复之前的 member id 、分配方案。因此不会触发 Rebalance ，除非 Heartbeat 超时。

- 日志示例：
  ```sh
  # broker 1 的 Coordinator 被分配了任务，开始管理 __consumer_offsets partition 对应的 consumer group
  INFO	[GroupCoordinator 1]: Elected as the group coordinator for partition 28
  INFO	[GroupCoordinator 1]: Elected as the group coordinator for partition 1
  # broker 1 的 Coordinator 被取消分配，停止管理一些 consumer group
  INFO	[GroupCoordinator 1]: Resigned as the group coordinator for partition 3
  INFO	[GroupCoordinator 1]: Resigned as the group coordinator for partition 0
  INFO	[GroupCoordinator 1]: Resigned as the group coordinator for partition 24
  ```
  ```sh
  # 一个成员加入 stable 状态的 consumer group ，被分配了 member id
  INFO	[GroupCoordinator 1]: Dynamic Member with unknown member id joins group test_group_1 in Stable state. Created a new member id consumer-1-5ee75316-16c0-474f-9u2d-6e57f4b238b3 for this member and add to the group.
  # 准备开始 rebalance ，原因是加入一个新成员，其 group instance id 为 None ，说明不是 Static Member
  INFO	[GroupCoordinator 1]: Preparing to rebalance group test_group_1 in state PreparingRebalance with old generation 38 (__consumer_offsets-21) (reason: Adding new member consumer-1-5ee75316-16c0-474f-9u2d-6e57f4b238b3 with group instance id None)
  # group 进入 stable 状态，开始一个新 generation ，拥有 3 个成员
  INFO	[GroupCoordinator 1]: Stabilized group test_group_1 generation 39 (__consumer_offsets-21) with 3 members
  # Coordinator 收到 leader 发来的分配方案
  INFO	[GroupCoordinator 1]: Assignment received from leader for group test_group_1 for generation 39. The group has 3 members, 0 of which are static.
  ```
  - Preparing to rebalance 的几种 reason 示例：
    ```sh
    Adding new member $memberId with group instance id $groupInstanceId     # 加入一个新成员
    removing member $memberId on LeaveGroup                                 # 一个成员发出 LeaveGroup 请求，主动离开 group
    removing member $memberId on heartbeat expiration                       # 一个成员因为 Heartbeat 超时，被移出 group
    ```

### Zookeeper

- Kafka 采用 Zookeeper 作为分布式框架，记录 broker、topic、consumer 等信息。
  - 每个 broker 启动时，会到 zk 记录自己的 IP 和端口，供其它 broker 发现和访问。
  - 根据 broker.id 识别每个 broker ，即使 IP 和端口变化也会自动发现。
  - Kafka 集群第一次启动时会生成一个随机的 cluster ID ，保存到 zk 中。
    - broker 每次连接 zk 时都会检查 cluster ID 是否一致，因此一个 zk 集群不能供多个 Kafka 集群使用。
- Kafka 在 zk 中使用的 znode 示例：
  ```sh
  /
  ├── admin               # 用于传递一些管理命令
  │   └── delete_topics   # 默认为 null
  ├── cluster
  │   └── id              # 记录 Kafka 集群的 id
  ├── brokers
  │   ├── ids             # 记录 broker 的信息。各个 broker 会在其下创建临时节点，当 broker 下线时会被自动删除
  │   ├── seqid
  │   └── topics          # 记录 topic 的信息
  ├── config
  ├── consumers
  ├── controller          # 记录当前的 controller ，这是一个临时节点
  ├── controller_epoch    # 记录 controller 当选的 epoch
  ...
  ```
  - 例：
    ```sh
    [zk: localhost:2181(CONNECTED) 0] get /brokers/ids/1
    {"listener_security_protocol_map":{"PLAINTEXT":"PLAINTEXT"},"endpoints":["PLAINTEXT://10.0.0.1:9092"],"jmx_port":-1,"features":{},"host":"10.0.0.1","timestamp":"1627960927890","port":9092,"version":5}
    [zk: localhost:2181(CONNECTED) 1] get /brokers/topics/__consumer_offsets/partitions/0/state
    {"controller_epoch":1,"leader":2,"version":1,"leader_epoch":0,"isr":[2,3,1]}
    [zk: localhost:2181(CONNECTED) 3] get /controller
    {"version":1,"brokerid":1,"timestamp":"1627960928034"}
    ```

## 消息

- Kafka 处理数据的基本单位为消息（message），又称为 record 。
- 消息采用 Kafka 自定的格式封装，类似于 TCP 报文。

### Topic

：主题，用于在逻辑上对消息分组管理。
- 不同 topic 之间相互独立，它们的消息互不影响。

### Partition

：分区。
- topic 在存储时会拆分成一个或多个 partition 。
  - 每个 partition 可以存储多个副本。
  - partition 存储到磁盘时，每隔一定时间或大小就划分出一个日志段（LogSegment）文件。
- broker 每收到一条新消息时，先看它属于哪个 topic ，然后考虑分配到哪个 partition 中存储。
  - Kafka 会尽量将同一 topic 的各个 partition 存储到不同的 broker 上，从而分散负载。
  - Kafka 会尽量将同一 partition 的各个 replica 存储到不同的 broker 上，从而抵抗单点故障。
  - 客户端只需要连接 broker 就能生产、消费消息，不需要关心消息的实际存储位置。

- Kafka 数据目录的结构如下：
  ```sh
  /data/kafka-logs/                     # 数据日志的存储目录，其下每个子目录的命名格式为 <topic>-<partition id>
  ├── test-0/                           # 该目录用于存储 test 主题的 0 号分区
  │   ├── 00000000000000000000.index    # 第一个 LogSegment 的索引文件，其中第一个消息的 offset 为 0
  │   ├── 00000000000000000000.log      # 第一个 LogSegment 的数据日志文件
  │   ├── 00000000000000367814.index    # 第二个 LogSegment 的索引文件，其中第一个消息的 offset 为 367814
  │   ├── 00000000000000367814.log
  │   ├── leader-epoch-checkpoint       # 记录每一任 leader 当选时的 epoch 和 offset
  │   └── partition.metadata
  ├── test-2/
  └── test-3/
  ```
  - partition 采用稀疏索引，避免单个索引文件的体积过大。读取某个 offset 的消息时，需要先找到它对应的 LogSegment ，再根据该 LogSegment 的 index 文件找到消息。

### Replica

- 每个 partition 会存储多个副本（replica），从而备份数据。
- Kafka 会自动在每个 partition 的所有副本中选出一个作为 `leader replica` ，而其它副本称为 `follower replica` 。
  - leader 可以进行读写操作，负责处理客户端的访问请求。
  - follower 只能进行读操作，负责与 leader 的数据保持一致，从而备份数据。
  - 客户端读写 partition 时看到的总是 leader ，看不到 follower 。

- `Assigned Replicas`
  - ：指一个 partition 拥有的所有 replica 。
- `Preferred replica`
  - ：指 assigned replicas 中的第一个 replica 。
  - 新建一个 partition 时，一般由 preferred replica 担任 leader replica 。
    - 当所在的 broker 故障时，会选出其它 replica 担任 leader 。
    - 当 preferred replica 恢复时，会担任普通的 replica 。但 kafka 会自动尝试让 preferred replica 重新担任 leader ，该过程称为 preferred-replica-election 。
- `In Sync Replicas (ISR)`
  - ：指一个 partition 中与 leader 保持同步的所有 replica 。
  - 如果一个 follower 的滞后时间超过 `replica.lag.time.max.ms` ，或者 leader 连续这么长时间没有收到该 follower 的 fetch 请求，则认为它失去同步，从 ISR 中移除。
    - 例如：IO 速度过慢，使得 follower 从 leader 复制数据的速度，比 leader 新增数据的速度慢，就会导致 lastCaughtUpTimeMs 一直没有更新，最终失去同步。
  - leader 本身也属于 ISR 。
  - 只有 ISR 中的 replica 可以被选举为 leader 。
- `Under-replicated Replicas Set`
  - ：指一个 partition 中与 leader 没有同步的 replica 。
  - 当一个 follower 将 leader 的最后一条消息（Log End Offset）之前的日志全部成功复制之后，则认为该 follower 已经赶上了 leader ，记录此时的时刻作为该 follower 的 `lastCaughtUpTimeMs` 。
  - Kafka 的 ReplicaManager 会定期计算每个 follower 的 lastCaughtUpTimeMs 与当前时刻的差值，作为该 follower 对 leader 的滞后时间。

### Offset

- partition 中存储的每个消息都有一个唯一的偏移量（offset），用于索引。
  - offset 的值采用 Long 型变量存储，容量为 64 bit 。
  - 生产者生产消息时、消费者消费消息时，offset 都会自动递增。因此，partition 类似于先入先出的队列，先生产的消息会先被消费。

- `Log Start Offset`
  - ：partition 中第一个消息的偏移量。刚创建一个 topic 时，该值为 0 。每次 broker 清理消息日志之后，该值会增大一截。
- `Log End Offset (LEO)`
  - ：partition 中最新一个消息的偏移量。
- `High Watemark (HW)`
  - ：partition 允许被 consumer 看到的最高偏移量。
  - partition 的 leader 新增一个消息时，会更新 LEO 的值，并传给 follower 进行同步。因此 HW 的值总是小于等于 LEO 。
  - consumer 只能看到 HW ，不知道 LEO 的值。
- `Consumer Committed Offset`
  - ：某个 consumer 在某个 partition 中最后一次消费的消息的偏移量。
  - 它由 Coordinator 记录，可以保证在 Rebalance 之后 consumer 不会重复消费。
    - consumer 每次消费消息之后，应该主动调用 commitAsync() 方法，提交当前的 offset ，否则 Consumer Committed Offset 的值会一直为 0 。
  - Kafka 能确保一个消息成功生产，但不能确保消息被消费，需要客户端主动提交当前消费的 offset 。
- `Consumer Current Offset`
  - ：某个 consumer 在某个 partition 中下一次希望消费的消息的偏移量。
  - 它由 consumer 自己记录，可以保证在多次调用 poll() 方法时不会重复消费。
    - 如果记录的 offset 偏小，就会重复消费。如果记录的 offset 偏大，就会遗漏消费。
- `Consumer Lag`
  - ：consumer 在消费某个 partition 时的滞后量，即还有多少个消息未消费。
  - 它的值等于 `HW - Consumer Committed Offset` 。

## 部署

- 下载二进制版：
  ```sh
  wget https://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.6.0/kafka_2.13-2.6.0.tgz
  ```
  解压后运行：
  ```sh
  bin/zookeeper-server-start.sh config/zookeeper.properties   # 启动 zookeeper 服务器
  bin/kafka-server-start.sh     config/server.properties      # 启动 kafka broker 服务器
  ```
  - 部署 Kafka 集群时，需要先部署 zk 集群，然后让每个 broker 服务器连接到 zk ，即可相互发现，组成集群。
    - Kafka 发行版包含了 zk 的可执行文件，可以同时启动 kafka、zk 服务器，也可以在其它地方启动 zk 服务器。

- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    kafka:
      container_name: kafka
      image: bitnami/kafka:2.8.0
      restart: unless-stopped
      environment:
        # KAFKA_HEAP_OPTS: -Xmx1G -Xms1G
        ALLOW_PLAINTEXT_LISTENER: 'yes'
      ports:
        - 9092:9092
      volumes:
        - ./config:/bitnami/kafka/config
        - ./data:/bitnami/kafka/data
  ```
  - Kafka 官方没有提供 Docker 镜像，这里采用社区提供的一个镜像。
    - 该镜像会根据环境变量配置 server.properties 文件，这里直接挂载配置目录，通过 CUSTOM_INIT_SCRIPT 执行命令还原配置文件。

### 版本

- [Kafka 的版本列表](https://kafka.apache.org/downloads)
  - 例如 kafka_2.13-2.6.0.tgz ，前面的 2.13 是指 Scala 编译器的版本，后面的 2.6.0 是指 Kafka 的版本。
  - 使用 Kafka 时，应该尽量让客户端与服务器的版本一致，避免不兼容。
- v0.10.0.0
  - ：于 2016 年发布。新增了 Kafka Streams API ，用于流处理。
- v0.11.0.0
  - ：于 2017 年发布。改进了消息格式。支持事务、幂等性。
- v1.0.0
  - ：于 2017 年发布。
- v2.0.0
  - ：于 2018 年发布。
- v2.8.0
  - ：于 2021 年发布。支持用内置的 KRaft 协议取代 zk 。

### 配置

- kafka 的配置目录示例：
  ```sh
  config/
  ├── consumer.properties       # 消费者的配置文件
  ├── log4j.properties          # Java 日志的配置文件
  ├── producer.properties       # 生产者的配置文件
  ├── server.properties         # broker 的配置文件
  └── zookeeper.properties      # zk 的配置文件
  ```
  - 启动 broker 时只需读取 server.properties、log4j.properties 文件。

#### server.properties

配置示例：
```ini
broker.id=0                               # 该 broker 在 Kafka 集群中的唯一标识符，默认为 -1 ，必须赋值为一个非负整数
listeners=PLAINTEXT://0.0.0.0:9092        # broker 监听的 Socket 地址
advertised.listeners=PLAINTEXT://10.0.0.1:9092  # 当前 broker 供其它 broker 访问的地址，它会在 zk 中公布，默认采用 listeners 的值

# 关于 zk
zookeeper.connect=10.0.0.1:2181,10.0.0.2:2181,10.0.0.3:2181   # 要连接的 zk 节点，多个地址之间用逗号分隔
zookeeper.connection.timeout.ms=6000

# 关于数据日志
log.dirs=/data/kafka-logs                 # broker 存放数据日志的目录，如果有多个目录则用逗号分隔
# log.roll.hours=168                      # 单个 LogSegment 的最长写入时间，超过该值则会创建一个新的 LogSegment 用于写入。默认为 7*24h
# log.segment.bytes=1073741824            # 单个 LogSegment 的最大大小，超过该值则会创建一个新的 LogSegment 用于写入。默认为 1G
# log.cleanup.policy=delete               # LogSegment 的清理策略，可以是 delete、compact
# log.retention.bytes=-1                  # 单个 partition 的最大大小，超过该值则会删除其中最旧的 LogSegment 。默认为 -1 ，即不限制
log.retention.hours=72                    # 单个 LogSegment 的保存时长，超过该值之后就会删除它。默认为 7*24h
# log.retention.check.interval.ms=300000  # 每隔多久检查一次各个 LogSegment 是否应该清理。默认为 5min
# log.flush.interval.messages=10000       # 每接收多少个消息，就 flush 一次，即将内存中数据保存到磁盘
# log.flush.interval.ms=1000              # 每经过多少毫秒，就 flush 一次

# 关于网络
# num.network.threads=3                   # broker 处理网络请求的线程数
# num.io.threads=8                        # broker 处理磁盘 IO 的线程数，应该不小于磁盘数
# socket.send.buffer.bytes=102400         # socket 发送消息的缓冲区大小，默认为 100K
# socket.receive.buffer.bytes=102400      # socket 接收消息的缓冲区大小
# socket.request.max.bytes=104857600      # socket 允许接收的单个消息的最大大小，默认为 100M

# 关于 topic
# auto.create.topics.enable=true          # 如果 producer 向不存在的 topic 生产消息，是否自动创建该 topic
# delete.topic.enable=false               # 是否允许删除 topic 。默认不允许，在 kafka 中删除 topic 时只是标记为删除状态，需要在 zk 中手动删除
# num.partitions=1                        # 新建 topic 时默认的 partition 数
# message.max.bytes=1048576               # 允许接收的生产者的每批消息的最大大小，默认为 1M 。该参数作用于所有 topic ，也可以对每个 topic 分别设置 max.message.bytes
# default.replication.factor=1            # 默认每个 partition 的副本数
# auto.leader.rebalance.enable=true       # 是否自动进行 preferred-replica-election
# replica.fetch.max.bytes=1048576         # 限制 partition 的副本之间拉取消息的最大大小，默认为 1M
# replica.lag.time.max.ms=30000           # replica 的最大滞后时间
# offsets.topic.num.partitions=50         # __consumer_offsets 主题的 partition 数
# offsets.topic.replication.factor=3      # __consumer_offsets 主题的每个 partition 的副本数。部署单节点时需要减少至 1
```
- 老版本的 Kafka 启动时会尝试解析本地主机名对应的 IP ，需要在 /etc/hosts 中添加 DNS 记录：
  ```sh
  127.0.0.1   hostname-1
  ```
- kafka-server-start.sh 中默认配置了以下环境变量，限制 Kafka 占用的内存：
  ```sh
  export KAFKA_HEAP_OPTS="-Xmx1G -Xms1G"
  ```
  - Kafka 会尽快将数据写入磁盘存储，因此占用的内存一般不超过 6G ，占用的 CPU 也少。
- 声明以下环境变量，即可让 broker 开启 JMX 监控，监听一个端口：
  ```sh
  export JMX_PORT=9093
  # export JMX_OPTS="-Dcom.sun.management.jmxremote=true -Dcom.sun.management.jmxremote.authenticate=false"
  ```

#### producer.properties

配置示例：
```ini
bootstrap.servers=10.0.0.1:9092,10.0.0.2:9092     # 要连接的 broker 地址，多个地址之间用逗号分隔

# request.timeout.ms=30000      # 发送请求时，等待响应的超时时间
# linger.ms=0                   # 生产者发送每个消息时，延迟多久才实际发送。调大该值，有助于让每个 batch 包含更多消息。特别是当新增消息的速度，比发送消息的速度更快时
# delivery.timeout.ms=120000    # 生产者调用 send() 方法发送消息的超时时间，该值应该不低于 request.timeout.ms + linger.ms
# max.block.ms=60000            # 生产者调用 send()、partitionsFor() 等方法时，如果 buffer.memory 不足或 metadata 获取不到，阻塞等待的超时时间

# max.request.size=1048576      # 限制生产者向 broker 发送的每个请求的大小
# batch.size=16384              # 限制每个 batch 的大小

# buffer.memory=33554432        # 限制生产者用于发送消息的缓冲区大小，默认为 32M
# acks=1                        # 判断消息发送成功的策略
  # 取值为 0 ，则不等待 broker 的回复，直接认为消息已发送成功
  # 取值为 1 ，则等待 leader replica 确认接收消息
  # 取值为 all ，则等待消息被同步到所有 replica
# retries=2147483647            # 发送消息失败时，如果不超过 delivery.timeout.ms 时长，则尝试重发多少次
```
- 生产者向每个 partition 发送消息时，会累积多个消息为一批（batch），再一起发送，从而提高效率。
  - 如果单个消息小于 batch.size ，生产者每批就可能发送多个消息。
  - 如果单个消息大于 batch.size ，依然会作为一批消息发送。但如果大于 max.request.size ，就不能发送。
  - 生产者的 batch.size 不能大于 max.request.size ，也不能大于 broker 的 message.max.bytes 。

#### SASL

- Kafka broker 支持通过 JAAS 框架启用 SASL 认证。
  - 默认不要求身份认证，可以被其它 broker、client 直接连接，因此不安全。
  - 可启用以下 SASL 认证机制：
    - PLAIN
    - GSSAPI (Kerberos)
    - OAUTHBEARER
    - SCRAM-SHA-256

- 对于通过身份认证的用户，Kafka 支持配置 ACL 规则，控制用户的访问权限。
  - 默认的 ACL 规则为空，因此不允许用户访问任何资源，除非是 super 用户。

- Kafka 的通信数据默认为 PLAINTEXT 形式，即未加密。
  - 可以启用 SSL 加密通信，但会增加通信延迟。
  - 是否启用 SSL ，与是否启用 SASL 认证无关。

- 例：启用 PLAIN 认证

  1. 修改 server.properties ，将通信协议从默认的 `PLAINTEXT://` 改为 `SASL_PLAINTEXT://` ，即采用 SASL 认证 + 未加密通信。
      ```ini
      listeners=SASL_PLAINTEXT://0.0.0.0:9092
      advertised.listeners=SASL_PLAINTEXT://10.0.0.1:9092

      security.inter.broker.protocol=SASL_PLAINTEXT     # broker 之间的通信协议。默认为 PLAINTEXT ，即不启用 SASL 认证 + 未加密传输
      sasl.mechanism.inter.broker.protocol=PLAIN        # broker 之间连接时的 SASL 认证机制，默认为 GSSAPI
      sasl.enabled.mechanisms=PLAIN                     # broker 启用的 SASL 认证机制列表
      authorizer.class.name=kafka.security.auth.SimpleAclAuthorizer # 开启 ACL
      super.users=User:broker;User:client               # 将一些用户声明为超级用户
      ```

  2. 创建一个 jaas.conf 配置文件：
      ```sh
      KafkaServer {
          org.apache.kafka.common.security.plain.PlainLoginModule required
          # 指定当前 broker 连接其它 broker 时使用的用户
          username="broker"
          password="******"
          # 按 user_<NAME>=<PASSWORD> 的格式定义用户。在当前 broker 被其它 broker 或 client 连接时，允许对方使用这些用户
          user_broker="******"
          user_client="******";   # 注意这是一条语句，末尾要加分号
      };
      ```

  3. 将 jaas.conf 拷贝到每个 broker 的配置目录下，并添加 java 启动参数来启用它：
      ```sh
      export KAFKA_OPTS='-Djava.security.auth.login.config=/kafka/config/jaas.conf'
      ```
      执行 kafka-server-start.sh、kafka-console-producer.sh 等脚本时会自动应用该配置。

  4. 客户端连接 broker 时，需要在 producer.properties、consumer.properties 中加入配置：
      ```ini
      security.protocol=SASL_PLAINTEXT
      sasl.mechanism=PLAIN
      sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required \
          username="client" \
          password="******";
      ```
      其中的账号密码也可以配置在 jaas.conf 中：
      ```sh
      KafkaClient {
          org.apache.kafka.common.security.plain.PlainLoginModule required
          username="client"
          password="******";
      };
      ```

- 上述为 broker 被其它 broker、client 连接时的身份认证。而 broker 连接到 zk 时，也可启用 SASL 认证，配置方法见 zk 文档。
  - 此时建议在 server.properties 中加入：
    ```ini
    zookeeper.set.acl=true  # 将 Kafka 在 zk 中存储的数据设置 ACL 规则：允许被所有用户读取，但只允许 Kafka 编辑
    ```

## 工具

### shell 脚本

kafka 的 bin 目录下自带了多个 shell 脚本，可用于管理 Kafka 。
- `kafka-server-stop.sh` 用于停止 broker 进程。
  - 它会查找本机上的所有 broker 进程，发送 SIGTERM 信号。
    - broker 进程收到终止信号后，会将所有数据保存到磁盘中，才退出，该过程需要几秒甚至几十秒。
  - 如果强制杀死 broker 进程，可能导致数据丢失。重启时会发出警告：
    ```sh
    WARN  Found a corrupted index file, xxxx/0000000000000000xxxx.index, deleting and rebuilding index... (kafka.log.Log)
    ```

- `kafka-topics.sh` 用于管理 topic 。
  - 例：连接到 zk ，查询 topic 列表。
    ```sh
    bin/kafka-topics.sh  --zookeeper localhost:2181  --list
    ```
  - 例：连接到 zk ，请求创建 topic ，并指定分区数、每个分区的副本数。
    ```sh
    bin/kafka-topics.sh \
        --zookeeper localhost:2181 \
        --create \
        --topic topic_1 \
        --partitions 1 \
        --replication-factor 1
    ```
  - 例：连接到 zk ，请求删除 topic 。
    ```sh
    bin/kafka-topics.sh \
        --zookeeper localhost:2181 \
        --delete \
        --topic topic_1
    ```
    - 这里将 --delete 选项改为 --describe ，就是查询 topic 的状态。

- 运行生产者终端，从 stdin 读取消息并发送到 broker ：
  ```sh
  bin/kafka-console-producer.sh \
      --broker-list localhost:9092
      --topic topic_1
      # --producer.config config/producer.properties
  ```

- 运行消费者终端，读取消息并输出到 stdout ：
  ```sh
  bin/kafka-console-consumer.sh \
      --bootstrap-server localhost:9092
      --topic topic_1
      # --group group_1     # 指定 consumer group 的 ID ，不指定则随机生成
      # --from-beginning    # 从第一条消息开始消费
      # --consumer.config config/consumer.properties
  ```

- 运行生产者的性能测试：
  ```sh
  bin/kafka-producer-perf-test.sh
      --producer.config config/producer.properties
      --topic topic_1
      --num-records 10000   # 发送多少条消息
      --record-size 1024    # 每条消息的大小
      --throughput 10000    # 限制每秒种发送的消息数
  ```

- 给 Kafka 集群新增 broker 之后，可能被自动用于存储新创建的 topic ，但不会影响已有的 topic 。可以采取以下两种措施：
  - 使用 `kafka-reassign-partitions.sh` 脚本，将指定 topic 的所有分区迁移到指定 broker 上。
  - 使用 Kafka Manager ，在网页上迁移 topic ，更方便。

### Kafka Manager

：一个管理 Kafka 的 Web 网站，由 Yahoo 公司开源。
- [GitHub 页面](https://github.com/yahoo/CMAK)
- 主要用于监控、管理 topic、partition ，不支持查看 Kafka 消息。
- 采用 Java 开发，占用大概 1G 内存。
- 2020 年，发布 v3 版本。为了避免与 Kafka 版权冲突而改名为 Cluster Manager for Apache Kafka ，简称为 CMAK 。

#### 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    kafka-manager:
      container_name: kafka-manager
      image: kafkamanager/kafka-manager:3.0.0.4
      restart: unless-stopped
      ports:
        - 9000:9000
      environment:
        ZK_HOSTS: 10.0.0.1:2181
        # JAVA_OPTS: -Djava.security.auth.login.config=/opt/jaas.conf
  ```
  - Kafka Manager 本身需要使用一个 zk 集群存储数据。

#### 用法

- 访问 Kafka Manager 的 Web 页面，即可创建一个 Cluster ，表示 Kafka 集群。
  - 需要指定该 Kafka 集群对应的 zk 集群的地址。
  - 可以勾选 "JMX Polling" ，连接到 Kafka 的 JMX 端口，监控消息的传输速度。
  - 可以勾选 "Poll consumer information"，监控消费者的 offset 。

- 支持查看、创建、配置 topic、partition 。
  - topic 的统计信息示例：
    ```sh
    Replication                 3       # 每个分区的的副本数
    Number of Partitions        3       # 该 topic 的分区数
    Sum of partition offsets    0
    Total number of Brokers     3       # Kafka 集群存在的 Broker 数
    Number of Brokers for Topic 2       # 该 topic 存储时占用的 Broker 数
    Preferred Replicas %        100     # Leader replica 为 Preferred replica 的分区，所占百分比
    Brokers Skewed %            0       # 存储的副本过多的 Broker 所占百分比
    Brokers Leader Skewed %     0       # 存储的 Leader replica 过多的 Broker 所占百分比
    Brokers Spread %            66      # 该 topic 占用的 Kafka 集群的 Broker 百分比，这里等于 2/3 * 100%
    Under-replicated %          0       # 存在未同步副本的那些分区，所占百分比
    ```
    - 上例中的 topic 总共有 3×3 个副本，占用 2 个 Broker 。为了负载均衡，每个 Broker 应该存储 3×3÷2 个副本，取整后可以为 4 或 5 。如果某个 Broker 实际存储的副本数超过该值，则视作 Skewed 。
  - Broker 的统计信息示例：
    ```sh
    Broker      # of Partitions     # as Leader     Partitions    Skewed?     Leader Skewed?
    0           3                   1               (0,1,2)       false       false
    1           3                   2               (0,1,2)       false       true
    2           3                   0               (0,1,2)       false       false
    ```
    每行表示一个 Broker 的信息，各列分别表示该 Broker 的：
    - ID
    - 存储的分区副本数
    - 存储的 Leader replica 数
    - 存储的各个分区 ID
    - 存储的副本是否过多
    - 存储的 Leader replica 是否过多

- 支持 preferred-replica-election 。

- 支持 Reassign Partitions 。用法如下：
  1. 在 topic 详情页面，点击 `Generate Partition Assignments` ，设置允许该 topic 分配到哪些 broker 上的策略。
  2. 点击 `Run Partition Assignments` ，执行自动分配的策略。
    - 如果不满足策略，则自动迁移 replica 到指定的 broker 上，并重新选举 leader 。
      - 迁移 replica 时会导致客户端短暂无法访问。
      - 同时迁移多个 replica 时，可能负载过大，导致 Kafka broker 卡死。
    - 如果已满足策略，则不会进行迁移。因此该操作具有幂等性。
    - 也可以点击 `Manual Partition Assignments` ，进行手动分配。
  3. 到菜单栏的 `Reassign Partitions` 页面，查看正在执行的分配操作。

### Kafka Eagle

：一个管理 Kafka 的 Web 网站。
- [GitHub 页面](https://github.com/smartloli/kafka-eagle)
- 与 Kafka Manager 相比，多了查询消息、生产消息、配置告警的功能，但缺少关于 Preferred Replica 的功能。
- 采用 Java 开发，占用大概 1G 内存。

### Kowl

：一个管理 Kafka 的 Web 网站。
- [GitHub 页面](https://github.com/cloudhut/kowl)
- 与 Kafka Manager 相比，页面更整洁，多了查看 topic 体积、查看消息内容、查看 consumer 详情的功能，但缺少 Brokers Skewed 等负载均衡的功能。
- 采用 Golang 开发，只占用几十 MB 内存。
- 用 Docker 部署：
  ```sh
  docker run -d --name kowl -p 8080:8080 -e KAFKA_BROKERS=10.0.0.1:9092 quay.io/cloudhut/kowl:v1.4.0
  ```

### Offset Explorer

：旧名为 Kafka Tool ，是一个 GUI 工具，可用作 Kafka 客户端。
- [官网](https://www.kafkatool.com/)
- 支持查看、管理 topic ，支持查看消息、生产消息，缺少关于监控的功能。

## ♢ kafka-python

：Python 的第三方库，提供了 Kafka 客户端的功能。
- [官方文档](https://kafka-python.readthedocs.io/en/master/index.html)
- 安装：`pip install kafka-python`

- 生产消息的代码示例：
  ```py
  from kafka import KafkaProducer

  # 创建一个 Producer ，连接到 broker
  producer = KafkaProducer(bootstrap_servers='localhost:9092')

  # 生产一个消息到指定的 topic
  msg = 'Hello'
  future = producer.send(topic='topic_1',
                         value=msg.encode(),  # 消息的内容，必须为 bytes 类型
                         # partition=None,    # 指定分区。默认为 None ，会自动分配一个分区
                         # key=None,          # 指定 key 。用于根据 key 的哈希值分配一个分区
                        )
  try:
      metadata = future.get(timeout=1)  # 等待服务器的回复
  except Exception as e:
      print(str(e))

  print('sent: ', msg)
  print('offset: ', metadata.offset)
  print('topic: ',  metadata.topic)
  print('partition: ', metadata.partition)
  ```

- 消费消息的代码示例：
  ```py
  from kafka import KafkaConsumer

  # 创建一个 Consumer ，连接到 broker ，订阅指定的 topic
  consumer = KafkaConsumer('topic_1', bootstrap_servers='localhost:9092')

  # Consumer 对象支持迭代。默认从最新 offset 处开始迭代，当没有收到消息时会一直阻塞，保持迭代，除非设置了 consumer_timeout_ms
  for msg in consumer:
      print('got: ', msg.value.decode())
      print('offset: ', msg.offset)
  ```
  ```py
  from kafka import TopicPartition

  consumer.subscribe('topic_1')
  consumer.seek(TopicPartition(topic='topic_1', partition=1), 0)    # 调整消费的 offset
  consumer.seek_to_beginning(TopicPartition(topic='topic_1', partition=0))
  msg_set = consumer.poll(max_records=10)
  ```

- KafkaConsumer 的定义：
  ```py
  class KafkaConsumer(six.Iterator):
      def __init__(self, *topics, **configs)
          """ 先输入要消费的 topics 。可用的 configs 参数如下：
          # 关于 broker
          bootstrap_servers='localhost',  # 可以指定一个列表，例如 ['10.0.0.1:9092', '10.0.0.2:9092']

          # 关于 SASL 认证
          sasl_mechanism='PLAIN',
          security_protocol='SASL_PLAINTEXT',
          sasl_plain_username='admin',
          sasl_plain_password='******',

          # 关于客户端
          client_id='client_1',           # 客户端的名称，默认为 kafka-python-$version
          group_id='group_1',             # 消费者组的名称，默认为 None ，即不加入消费者组
          fetch_min_bytes=1,              # 每次发出 fetch 请求时，broker 应该至少累积多少数据才返回响应
          fetch_max_bytes=52428800,       # 每次发出 fetch 请求时，broker 应该最多返回多少数据。默认为 50 MB
          max_poll_records=500,           # 每次调用 poll() 方法，最多拉取多少个消息
          consumer_timeout_ms=5000,       # 迭代消息时，持续一定时长未收到新消息则抛出异常 StopIteration 。默认无限制，会保持迭代
          enable_auto_commit=True,        # 是否自动在后台提交 Consumer Committed Offset
          auto_commit_interval_ms=5000,   # 每隔多久就自动提交一次 Consumer Committed Offset
          """

      def close(self, autocommit=True)

      def assign(self, partitions)
          """ 主动分配当前 consumer 消费的 TopicPartition 。
          此时不会被 Coordinator 处理，不会触发 Rebalance 。但不能与 subscribe() 同时使用，否则报错。
          例： consumer.assign([TopicPartition(topic='topic_1', partition=0), TopicPartition(topic='topic_1', partition=1)])
          """

      def assignment(self)
          """ 返回一个集合，包含当前 consumer 被分配的所有 TopicPartition """

      def poll(self, timeout_ms=0, max_records=None, update_offsets=True)
          """ 从当前 consumer 被分配的 partition 拉取消息，组成一个集合并返回。
          update_offsets：是否自动递增 offset 以便下一次拉取。
          """

      def seek(self, partition:TopicPartition, offset:int)
          """ 调整当前消费的 offset ，用于下一次 poll """

      def seek_to_beginning(self, *partitions)
          """ 将 offset 调整到可见的最老 offset """

      def seek_to_end(self, *partitions)
          """ 将 offset 调整到可见的最新 offset """

      def subscribe(self, topics=(), pattern=None, listener=None)
          """ 订阅一组 topics ，或者订阅与正则表达式匹配的 topics 。
          可以订阅不存在的 topic ，此时不会被分配 partition ，调用 poll() 的结果为空集合 。
          """

      def subscription(self)
          """ 返回一个集合，包含当前 consumer 订阅的所有 topic 的名称  """

      def topics(self)
          """ 返回一个集合，包含当前 consumer 有权访问的所有 topic 的名称 """

      ...
  ```
