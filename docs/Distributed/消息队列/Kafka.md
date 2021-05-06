# Kafka

：一个消息队列。
- [官方文档](http://kafka.apache.org/documentation/)
- 基于 Scala 开发。
- 由 LinkedIn 公司开源，捐献给了 ASF 。
- 容易横向扩展，吞吐量的上限很高。

## 架构

- 基本架构：
  - 运行一些 broker 服务器组成 Kafka 集群。
  - 用户运行客户端程序，连接到 broker ，作为 Producer 生产消息，或者作为 Consumer 消费消息。

### Broker

：代理服务器，是组成 Kafka 集群的节点，负责存储、管理消息。
- broker 会将消息以日志文件的形式存储，存放在 `logs/<topic>-<partition>/` 目录下，因此会受到文件系统的影响。
- 增加 broker 的数量，就可以提高 Kafka 集群的吞吐量。
- `Group Coordinator` ：在每个 broker 上都运行的一个进程，主要负责管理 Consumer Group、Consumer Rebalance、消息的 offset 。

### Producer

：生产者，即生产消息的客户端，负责发布消息到 broker（push 方式）。
- Producer 向某个 topic 发布消息时，默认会将消息随机分配到不同的 partition 。可以指定 partition ，也可以指定均衡策略来自动选择 partition 。

### Consumer

：消费者，即消费消息的客户端，负责从 broker 订阅消息（push 方式）、消费消息（pull 方式）。

### Consumer Group

：消费者组，包含多个 Consumer 。
- 单个 consumer 同时只能消费一个 partition ，因此一般用一组 Consumer 同时消费一个 topic 下的不同 partition ，通过并行消费来提高消费速度。
- Consumer Group 之间是相互隔离的，可以同时消费同一个 topic 下的同一个 partition ，不会冲突。
- 当一个 Consumer Group 消费一个 topic 时，如果 partition 的数量小于 Consumer 的数量，就会有 Consumer 空闲。
  因此，最好将 partition 的数量设置成与 Consumer 的数量相同，或者为 Consumer 的数量的整数倍。
- 当 group 中有 consumer 新增或退出时，或者当前消费的 topic 的 partition 数量变化时，就会触发一次 Consumer Rebalance ，重新分配每个 consumer 消费的 partition 。

### Zookeeper

Kafka 采用 Zookeeper 作为分布式底层框架，它提供的主要功能如下：
- 注册 broker ：每个 broker 启动时，都会到 zk 登记自己的 IP 和端口。
  - 根据 broker.id 识别每个 broker ，即使 IP、端口变化也会在 zk 中自动发现。
- 注册 topic ：记录 topic 的每个 partition 存储在哪些 broker 上。
- 注册 Consumer
- Producer 的负载均衡：给 Producer 分配 broker 。
- Consumer 的负载均衡：给 Consumer 分配 partition 。
- 记录 offset

## 消息

- Kafka 处理的消息称为 message、record 。

### Topic

：主题，用于对消息进行分组管理。
- 不同 topic 之间的消息相互独立。
- Kafka 在逻辑上根据 topic 对消息进行分组，在存储时将每个 topic 分成多个 partition ，并且每个 partition 会存储多个 replica 。
- Kafka 会尽量将同一 Topic 的各个 partition、同一 partition 的各个 replica 存储到不同的 broker 上，从而抵抗单点故障。
  - 客户端只需要连接 broker 就能生产、消费消息，不需要关注消息的实际存储位置。

### Partition

：分区，是 broker 存储消息的基本容器。
- broker 每收到一条新消息时，先看它属于哪个 topic ，然后考虑分配到哪个 partition 中存储。
- partition 内的消息按先入先出的顺序存储。
- 当一个 partition 较大时，broker 会将它分成多个 LogSegment（日志段）存储，如下：
  ```sh
  [root@Centos ~]# ls /data/kafka-logs/quickstart-events-0
  00000000000000000000.index    # 第一个 LogSegment 的索引文件（采用稀疏索引），其中第一个消息的 offset 为 0
  00000000000000000000.log      # 第一个 LogSegment 的数据日志文件
  00000000000000367814.index
  00000000000000367814.log
  ```

### Replica

每个 partition 会存储多个副本（replica），从而备份数据。
- Kafka 会选出其中一个副本作为 `leader replica` ，而其它副本称为 `follower replica` 。
  - leader 可以进行读写操作，负责处理用户的访问请求。
  - follower 只能进行读操作，负责与 leader 的数据保持一致，从而备份数据。
  - 用户访问 partition 时看到的总是 leader ，看不到 follower 。
- `Assigned Replicas` ：指一个 partition 拥有的所有 replicas 。
- `preferred replica` ：指 assigned replicas 中的第一个 replica 。
  - 新建一个 partition 时，preferred replica 一般就是 leader replica ，但是之后可能发生选举，改变 leader 。
- `In-sync Replicas Set`（IRS）：指一个 partition 中与 leader 保持同步的所有 replicas 。
  - leader 本身也属于 IRS 。
  - 只有 IRS 中的 replica 可以被选举为 leader 。
- `Under-replicated Replicas Set` ：指一个 partition 中与 leader 没有同步的 replicas 。
  - 当一个 follower 将 leader 的最后一条消息（Log End Offset）之前的日志全部成功复制之后，则认为该 follower 已经赶上了 leader ，记录此时的时刻作为该 follower 的 `lastCaughtUpTimeMs` 。
  - Kafka 的 ReplicaManager 会定期计算每个 follower 的 lastCaughtUpTimeMs 与当前时刻的差值，作为该 follower 对 leader 的滞后时间。

### Offset

partition 内存储的每个消息都有一个唯一的偏移量（offset），用于索引。
- offset 的值采用 Long 型变量存储，容量为 64 bit 。
- `Log Start Offset` ：partition 中第一个消息的偏移量。刚创建一个 topic 时，该值为 0 。每次 broker 清理消息日志之后，该值会增大一截。
- `Log End Offset`（LEO）：partition 中最新一个消息的偏移量。
- `High Watemark`（HW）：partition 允许被 consumer 看到的最高偏移量。
  - partition 的 leader 新增一个消息时，会更新 LEO 的值，并传给 follower 进行同步。因此 HW 的值总是小于等于 LEO 。
  - consumer 只能看到 HW ，不知道 LEO 的值。
- `Consumer Current Offset` ：某个 consumer 在某个 partition 中下一次希望消费的消息的偏移量。
  - 由 consumer 自己记录，用于 poll() 方法。
  - 它可以保证 consumer 在多次 poll 时不会重复消费。
- `Consumer Committed Offset` ：某个 consumer 在某个 partition 中最后一次消费的消息的偏移量。
  - 由 broker 记录在 topic ：`__consumer_offsets` 中。
  - 它可以用于保证 Consumer Rebalance 之后 consumer 不会重复消费。
  - consumer 每次消费消息之后，必须主动调用 commitAsync() 方法，提交当前的 offset ，否则 Consumer Committed Offset 的值会一直为 0 。
- `Consumer Lag` ：consumer 在消费某个 partition 时的滞后量，即还有多少个消息未消费。
  - 它的值等于 HW - Consumer Committed Offset 。

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
  - broker 在 zk 注册自己的 IP、端口时，会尝试获取本机主机名对应的 IP ，因此需要先在 /etc/hosts 中添加 DNS 记录。

- 或者用 docker-compose 部署 Kafka ：
  ```yml
  version: '3'

  services:
    kafka:
      container_name: kafka
      image: wurstmeister/kafka:2.12-2.0.1
      restart: unless-stopped
      network_mode:
        host
      environment:
        CUSTOM_INIT_SCRIPT: cd /opt/kafka_2.12-2.0.1/config/ && cp server.properties.bak server.properties
      volumes:
        - ./config:/opt/kafka_2.12-2.0.1/config
        - ./data:/data
  ```
  - Kafka 官方没有提供 Docker 镜像，这里采用社区提供的一个镜像。
    - 该镜像会根据环境变量配置 server.properties 文件，这里直接挂载配置目录，通过 CUSTOM_INIT_SCRIPT 执行命令还原配置文件。

### 版本

- v0.7.0 ：于 2012 年发布。
- v0.10.0.0 ：于 2016 年发布。
  - 引入了 Kafka Stream 。
- v0.11.0.0 ：于 2017 年发布。
  - 改进了消息格式。
  - 提供幂等性的 Producer API 。
  - 支持事务。
- v1.0.0 ：于 2017 年底发布。
- v2.0.0 ：于 2018 年发布。

总结：
- 例如 kafka_2.13-2.6.0.tgz ，前面的 2.13 是指 Scala 编译器的版本，后面的 2.6.0 是指 Kafka 的版本。
- 使用 Kafka 时，应该尽量让客户端与服务器的版本一致。

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

- server.properties 的配置示例：
  ```sh
  broker.id=0                               # 该 broker 在 Kafka 集群中的唯一标识符，默认为 -1 ，必须赋值为一个非负整数
  listeners=PLAINTEXT://10.0.0.1:9092       # broker 监听的 Socket 地址
  # advertised.listeners=PLAINTEXT://10.0.0.1:9092  # 当前 broker 供其它 broker 访问的地址，它会在 zk 中公布，默认采用 listeners 的值
  inter.broker.listener.name
  security.inter.broker.protocol

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
  # replica.fetch.max.bytes=1048576         # 限制 partition 的副本之间拉取消息的最大大小，默认为 1M
  # replica.lag.time.max.ms=30000           # replica 的最大滞后时间

  # 关于数据日志
  log.dirs=/data/kafka-logs                 # broker 存放数据日志的目录，如果有多个目录则用逗号分隔
  # log.roll.hours=168                      # 单个 LogSegment 的最长写入时间，超过该值则会创建一个新的 LogSegment 用于写入。默认为 7*24h
  # log.segment.bytes=1073741824            # 单个 LogSegment 的最大大小，超过该值则会创建一个新的 LogSegment 用于写入。默认为 1G
  # log.cleanup.policy=delete               # LogSegment 的清理策略，可以是 delete、compact
  # log.retention.bytes=-1                  # 单个 partition 的最大大小，超过该值则会删除其中最旧的 LogSegment 。默认为 -1 ，即不限制
  # log.retention.hours=168                 # 单个 LogSegment 的保存时长，超过该值之后就会删除它。默认为 7*24h
  # log.retention.check.interval.ms=300000  # 每隔多久检查一次各个 LogSegment 是否应该清理。默认为 5min
  # log.flush.interval.messages=10000       # 每接收多少个消息，就 flush 一次，即将内存中数据保存到磁盘
  # log.flush.interval.ms=1000              # 每经过多少毫秒，就 flush 一次

  # 关于 zk
  zookeeper.connect=10.0.0.1:2181,10.0.0.2:2181   # 要连接的 zk 节点，多个地址之间用逗号分隔
  zookeeper.connection.timeout.ms=6000
  ```
  - 如果一个 follower 的滞后时间超过 `replica.lag.time.max.ms` ，或者连续这么长时间没有收到该 follower 的 fetch 请求，则认为它失去同步，从 IRS 中移除。
    - 例如：IO 速度过慢，使得 follower 从 leader 复制数据的速度，比 leader 新增数据的速度慢，就会导致 lastCaughtUpTimeMs 一直没有更新，最终失去同步。

- producer.properties 的配置示例：
  ```sh
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

### 命令行工具

bin 目录下提供了多个 shell 脚本，可用于管理 Kafka 。
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
    ./kafka-topics.sh  --zookeeper localhost:2181  --list
    ```
  - 例：连接到 zk ，请求创建 topic ，并指定分区数、每个分区的副本数。
    ```sh
    ./kafka-topics.sh \
        --zookeeper localhost:2181 \
        --create \
        --topic topic-1 \
        --partitions 1 \
        --replication-factor 1
    ```
  - 例：连接到 zk ，请求删除 topic 。
    ```sh
    ./kafka-topics.sh \
        --zookeeper localhost:2181 \
        --delete \
        --topic topic-1
    ```
    - 这里将 --delete 选项改为 --describe ，就是查询 topic 的状态。

- 运行生产者终端，从 stdin 读取消息并发送到 broker ：
  ```sh
  ./kafka-console-producer.sh \
      --broker-list localhost:9092 \
      --topic topic-1
  ```

- 运行消费者终端，读取消息并输出到 stdout ：
  ```sh
  ./kafka-console-consumer.sh \
      --bootstrap-server localhost:9092 \
      --topic topic-1 \
      --from-beginning    # 从第一条消息开始消费
  ```

- 运行生产者的性能测试：
  ```sh
  ./kafka-producer-perf-test.sh \
      --topic topic-1 \
      --num-records 10000 \         # 发送多少条消息
      --record-size 1024 \          # 每条消息的大小
      --throughput 10000 \          # 限制每秒种发送的消息数
      --producer.config ../config/producer.properties
  ```

- 给 Kafka 集群新增 broker 之后，可能被自动用于存储新创建的 topic ，但不会影响已有的 topic 。可以采取以下两种措施：
  - 使用 `kafka-reassign-partitions.sh` 脚本，将指定 topic 的所有分区迁移到指定 broker 上。
  - 使用 Kafka Manager ，在网页上迁移 topic ，更方便。
    - 需要到 Topic 列表页面，点击 Generate Partition Assignments ，设置某个 topic 允许分配到哪些 broker 上的策略。然后点击 Run Partition Assignments ，执行自动分配的策略。
    - 可以到 Reassign Partitions 页面，查看正在执行的自动分配策略。
    - 如果该 topic 已经分配到这些 broker 上，则不会再重新分配。

## ♢ kafka-Python

：Python 的第三方库，提供了 Kafka 客户端的功能。
- [官方文档](https://kafka-python.readthedocs.io/en/master/index.html)
- 安装：`pip install kafka-python`

- 生产消息的代码示例：
  ```py
  from kafka import KafkaProducer

  # 创建一个 Producer ，连接到 broker
  producer = KafkaProducer(bootstrap_servers='localhost:9092')

  # 发送一个消息到指定的 topic
  future = producer.send(topic='test666', value='Hello'.encode(), partition=0)
  # 消息要转换成 bytes 类型才能发送
  # 不指定 partition 时会自动分配一个 partition

  try:
      record_data = future.get(timeout=10)  # 等待服务器的回复
  except Exception as e:
      print(str(e))

  print('sent: ', msg)
  print('offset: ', record_data.offset)
  ```

- 消费消息的代码示例：
  ```py
  from kafka import KafkaConsumer
  from kafka import TopicPartition

  # 创建一个 Consumer ，连接到 broker ，并指定 topic
  consumer = KafkaConsumer('topic_1',                       # topic 名
                          # bootstrap_servers='localhost:9092',
                          # sasl_mechanism='PLAIN',
                          # security_protocol='SASL_PLAINTEXT',
                          # sasl_plain_username='admin',
                          # sasl_plain_password='admin-secret123',
                          # client_id='client_1',          # 客户端的名称，可以自定义
                          # group_id='test2_g',            # 消费组的名称，没有它就不能提交偏移量
                          # consumer_timeout_ms=5000,      # 未收到新消息时迭代等待的时间
                          # enable_auto_commit=True,       # 自动提交偏移量
                          # auto_commit_interval_ms=5000,  # 自动提交偏移量的间隔时长（单位为 ms ）
                          )

  # Consumer 对象支持迭代，当队列中没有消息时会阻塞，一直等待读取
  for i in consumer:
      print('got : ', i.value.decode())
      print('offset: ', i.offset)
  ```
