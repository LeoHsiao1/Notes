# Kafka

：一个消息队列。
- [官方文档](http://kafka.apache.org/documentation/)
- 基于 Scala 开发。
- 由 LinkedIn 公司开源，捐献给了 ASF 。
- 容易横向扩展，吞吐量的上限很高。

## 原理

- 基本架构：
  - 运行一些 broker 服务器组成 Kafka 集群。
  - 用户运行客户端程序，连接到 broker ，作为 Producer 生产消息，或者作为 Consumer 消费消息。
- Kafka 在逻辑上根据 topic 对消息进行分组，在存储时将每个 topic 分成多个 partition ，并且每个 partition 会存储多个 replica 。
  - Kafka 会尽量将同一 Topic 的各个 partition、同一 partition 的各个 replica 存储到不同的 broker 上，从而抵抗单点故障。\
    而客户端只需要连接 broker 就能生产、消费消息，不需要关注消息的实际存储位置。

### broker

- `broker` ：代理服务器，负责存储、管理消息。
  - broker 会将消息以日志文件的形式存储，存放在 `logs/<topic>-<partition>/` 目录下，因此会受到文件系统的影响。
  - 增加 broker 的数量，就可以提高 Kafka 集群的吞吐量。
  - `Group Coordinator` ：在每个 broker 上都运行的一个进程，主要负责管理 Consumer Group、Consumer Rebalance、消息的 offset 。

- `topic` ：主题，用于对消息进行分组管理。
  - 不同 topic 之间的消息相互独立。

- `partition` ：分区，broker 存储消息的基本容器。
  - broker 每收到一条新消息时，先看它属于哪个 topic ，然后考虑分配到哪个 partition 中存储。
  - partition 内的消息按先入先出的顺序存储。
  - 当一个 partition 较大时，broker 会将它分成多个 LogSegment（日志段）存储，如下：
    ```sh
    [root@Centos ~]# ls /tmp/kafka-logs/quickstart-events-0
    00000000000000000000.index    # 第一个 LogSegment 的索引文件（采用稀疏索引），其中第一个消息的 offset 为 0
    00000000000000000000.log      # 第一个 LogSegment 的数据日志文件
    00000000000000367814.index
    00000000000000367814.log
    ```

### replica

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

### offset

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

### Consumer

- `Producer` ：生产者，即生产消息的客户端，负责发布消息到 broker（push 方式）。
  - Producer 向某个 topic 发布消息时，默认会将消息随机分配到不同的 partition 。可以指定 partition ，也可以指定均衡策略来自动选择 partition 。

- `Consumer` ：消费者，即消费消息的客户端，负责从 broker 订阅消息（push 方式）、消费消息（pull 方式）。

- `Consumer Group` ：消费者组，包含多个 Consumer 。
  - 单个 consumer 同时只能消费一个 partition ，因此一般用一组 Consumer 同时消费一个 topic 下的不同 partition ，通过并行消费来提高消费速度。
  - Consumer Group 之间是相互隔离的，可以同时消费同一个 topic 下的同一个 partition ，不会冲突。
  - 当一个 Consumer Group 消费一个 topic 时，如果 partition 的数量小于 Consumer 的数量，就会有 Consumer 空闲。
    因此，最好将 partition 的数量设置成与 Consumer 的数量相同，或者为 Consumer 的数量的整数倍。
  - 当 group 中有 consumer 新增或退出时，或者当前消费的 topic 的 partition 数量变化时，就会触发一次 Consumer Rebalance ，重新分配每个 consumer 消费的 partition 。

### Zookeeper

Kafka 采用 Zookeeper 作为分布式底层框架，它提供的主要功能如下：
- 注册 broker ：每个 broker 启动时，都会到 Zookeeper 登记自己的 IP 地址和端口。
- 注册 topic ：记录 topic 的每个 partition 存储在哪些 broker 上。
- 注册 Consumer
- Producer 的负载均衡：给 Producer 分配 broker 。
- Consumer 的负载均衡：给 Consumer 分配 partition 。
- 记录 offset

## 部署

- 下载二进制版：
  ```sh
  wget https://mirrors.tuna.tsinghua.edu.cn/apache/kafka/2.6.0/kafka_2.13-2.6.0.tgz
  ```
  解压后运行：
  ```sh
  bin/zookeeper-server-start.sh config/zookeeper.properties # 启动 zookeeper 服务器
  bin/kafka-server-start.sh config/server.properties        # 启动 kafka broker 服务器
  ```
  - 部署 Kafka 集群时，需要先部署 Zookeeper 集群，然后让每个 broker 服务器连接到 Zookeeper ，即可相互发现，组成集群。

- 新增的 broker 加入 Kafka 集群之后，可能被自动用于存储新创建的 topic ，但不会影响已有的 topic 。可以采取以下两种措施：
  - 用官方脚本 bin/kafka-reassign-partitions.sh 将指定 topic 的所有分区迁移到指定 broker 上。
  - 在 Kafka Manager 网页上迁移 topic 。
    - 需要到 Topic 列表页面，点击 Generate Partition Assignments ，设置某个 topic 允许分配到哪些 broker 上的策略。然后点击 Run Partition Assignments ，执行自动分配的策略。
    - 可以到 Reassign Partitions 页面，查看正在执行的自动分配策略。
    - 如果该 topic 已经分配到这些 broker 上，则不会再重新分配。

- 停止 Kafka broker 时，可以使用官方脚本 `bin/kafka-server-stop.sh` 。
  - 它会查找本机上的所有 kafka 进程，发送 SIGTERM 信号。
  - Kafka 进程收到终止信号后，会将所有数据保存到磁盘中，才退出，该过程需要几秒甚至几十秒。
  - 如果强制杀死 Kafka 进程，可能导致数据丢失。重启时会发出警告：
    ```sh
    WARN  Found a corrupted index file, xxxx/0000000000000000xxxx.index, deleting and rebuilding index... (kafka.log.Log)
    ```

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

server.properties 的配置示例：
```sh
broker.id=0                             # broker 在 Kafka 集群中的唯一标识符，是一个非负整数
listeners=PLAINTEXT://10.0.0.1:9092     # broker 监听的地址

log.dirs=/tmp/kafka-logs                # broker 的数据日志目录，如果有多个目录则用逗号分隔
log.segment.bytes=1014*1024*1024        # 单个 LogSegment 的最大大小，超过该值则会创建一个新的 LogSegment 用于写入
log.roll.hours=24*7                     # 单个 LogSegment 的最长写入时间，超过该值则会创建一个新的 LogSegment 用于写入
log.retention.bytes=-1                  # 单个 partition 的最大大小，超过该值则会删除其中最旧的 LogSegment
log.retention.hours=24*7                # 单个 LogSegment 的最长保存时间，超过该值之后就会删除它
log.retention.check.interval.ms=300000  # 每隔多久检查一次各个数据日志文件是否应该删除

num.partitions=1                        # 新建 topic 时默认的 partition 数
num.network.threads=3                   # broker 处理网络请求的线程数
num.io.threads=8                        # broker 处理磁盘 IO 的线程数，应该不小于磁盘数

replica.lag.time.max.ms=30000           # replica 的最大滞后时间

zookeeper.connect=10.0.0.1:2181,10.0.0.2:2181         # 要连接的 zookeeper 节点，如果有多个地址则用逗号分隔
zookeeper.connection.timeout.ms=18000
```
 
- 如果一个 follower 的滞后时间超过 `replica.lag.time.max.ms` ，或者连续这么长时间没有收到该 follower 的 fetch 请求，则认为它失去同步，从 IRS 中移除。
  - 例如：IO 速度过慢，使得 follower 从 leader 复制数据的速度，比 leader 新增数据的速度慢，就会导致 lastCaughtUpTimeMs 一直没有更新，最终失去同步。

## ♢ kafka-Python

：Python 的第三方库，提供了 Kafka 客户端的功能。
- [官方文档](https://kafka-python.readthedocs.io/en/master/index.html)
- 安装：`pip install kafka-python`


生产消息的示例代码：
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

消费消息的示例代码：
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
