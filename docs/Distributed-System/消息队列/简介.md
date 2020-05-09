消息队列
## 消息队列（message queue，MQ）是一种应用程序之间的通信方法：发送方把消息放到一个中间件上，接收方从消息队列中拿取消息。
- MQ的优点。
  - 解耦    ：每个应用程序只需要考虑对中间件的访问，解除与其它应用程序的代码耦合。
  - 异步    ：消息的发送方和接收方异步工作，减少调用业务功能的等待时间。
  - 削峰    ：将消息暂存到中间件上，削弱用户的并发请求高峰。
- MQ的缺点。
  - 增加了系统的规模，需要多考虑一个中间件。
  - 需要考虑一致性问题，保证消息不会被重复发布、消费。
  - 如何保证消息队列的顺序。
  - 如何保证消息队列的高可用、可靠传输。
- MQ的实现参照了JMS规范。JMS（Java Message Service，Java消息服务）是Java平台上面向消息中间件的API规范，它的定义包括：
  - 提供者    ：实现JMS规范的中间件服务器。
  - 客户端    ：发送或者接收消息的应用程序。
  - 发布者/生产者    :发送消息的客户端。
  - 订阅者/消费者    :接收消息的客户端。
  - 消息        ：应用程序之间的通信内容。
  - 消息模式    ：JMS定义了主题和队列两种传输消息的模式。
  - 主题模式    ：一个subscriber在订阅了某个topic后，可以获得此后publisher在这个topic发布的所有消息（不能得到订阅之前发布的消息）。
  - 队列模式    ：多个consumer共同从某个消息队列中获得消息，一个消息只能被一个consumer消费，队列空了之后就不能再消费。
## 
## 
## 
 
ActiveMQ
## ActiveMQ：基于Java语言，采用主从架构。。
## ActiveMQ的集群主要有两种部署方式：
- Master-Slave集群：一个节点为Master，其它节点为slave，只有Master节点提供服务。当Master节点宕机后，选出一个Slave节点作为新的Master节点，继续提供服务。
  - 优点是可以保证服务的高可用性，缺点是不能解决负载均衡和分布式的问题。
- Broker Cluster集群：各个broker互相连通，共享消息队列，同时提供服务。
  - 优点是可以解决负载均衡和分布式的问题，缺点是不能保证服务的高可用性。
- 一般将Master-Slave和Broker Cluster两种方式结合使用，同时实现集群的高可用和负载均衡。
## 
## 
## 

 
RabbitMQ
## RabbitMQ：基于erlang语言，并发能力强，延迟极低。采用主从架构。
- 生产者不能直接发送消息到队列中，要由exchange（交换机）将消息转发到某个或某些队列。
- RabbitMQ提供的API主要分为以下几类：
  - ConnectionFactory
  - Connection：建立client到RabbitMQ服务器的TCP连接。
  - Channel：在TCP连接之上建立虚拟连接（这样创建和关闭channel的代价低），用于处理消息。
## exchange Type有四种：
- fanout    ：将消息转发到所有与exchange绑定的queue中。
  - 一个exchange可以绑定多个queue，一个queue也可以绑定到多个exchange。
  - 使用fanout类型的exchange时需要事先绑定queue，生产者发送消息时不需要携带Routing Key。
- direct    ：将消息转发到那些与消息的Routing Key名字相同的queue中（如果没有就丢弃该消息）。
  - 生产者发送消息时要携带一个Routing Key。
- topic    ：将消息转发到那些与消息的Routing Key名字匹配的queue中。
  - 一个queue可以订阅一些topic，当生产者发送的消息属于它订阅的topic时，该queue就会收到该消息。
  - topic的语法：
每个topic的字符串用小数点 . 分隔成多个关键词
星号 * 表示匹配一个关键词
井号 # 表示匹配零个或任意个关键词，例如 # .log.# 表示匹配所有包含关键词log的topic。
- headers    ：将消息转发到那些与消息的headers（一个键值对）匹配的queue中。
## 
## 
## 
 
♢ pika
## pika：Python的第三方库，提供了RabbitMQ客户端的功能。在终端输入命令pip install pillow即可安装。
## 
## 
## 
## 
## 
## 
## 
## 
## 
## 
 
RocketMQ
## RocketMQ：基于Java语言。
- 优点。
  - 采用分布式架构，因此可用性高。
  - 吞吐量很高。
  - 具有完善的MQ功能。
- 
## 
## 
## 
## 
 
Kafka
## Kafka：基于scala语言。
- 优点。
  - 采用分布式架构，因此可用性高。
  - 吞吐量很高，并且容易横向扩展。
  - 适合收集大量数据，比如日志采集。
- 缺点。
  - 只有基本的MQ功能。
- 基于C/S架构。
- 基于发布/订阅（publish/subscribe）模式。
- 基于Zookeeper集群。
## Kafka的运行原理。
- broker：代理服务器，负责存储、管理消息。
  - 增加broker的数量，就可以提高Kafka集群的吞吐量。（不过会引发一次rebalance）
- partition：broker存储消息的基本单位。
  - Kafka存储数据时会分成多个topic，每个topic又分成一个或多个partition。
  - 每个partition内的消息按顺序存储，先入先出。
  - 每个partition有一个offset值，记录了当前被消费的偏移量。
  - 每个partition有多个副本，存储在不同的broker上（Consumer并不需要关心其存储位置）。
Kafka会选出其中一个副本作为leader，其它的副本称为follower。leader负责接受用户的访问，follower负责与leader的数据保持一致。
- Producer：生产者，负责将消息发布到broker（push方式）。
  - Producer发布消息时，默认会将消息随机发布到不同的partition。可以指定partition，也可以指定均衡策略来自动选择partition。
  - 
- Consumer：消费者，负责从broker订阅消息（push方式）、消费消息（pull方式）。
  - partition越多，Kafka的吞吐量也就越大，但是消耗的系统资源也越大。
- Consumer Group：包含多个Consumer。
  - 多个Group可以同时消费同一个topic，互相隔离。
  - 同一个Group中的多个Consumer不能同时消费同一个partition。
  - 当一个Group消费一个topic时，
如果partition的数量小于Consumer的数量，就会有Consumer空闲。
因此，最好将partition的数量设置成与Consumer的数量相同，或者为Consumer的数量的整数倍。
## 
## 
## 
## 

正常情况下，消费者在消费消息时候，消费完毕后，会发送一个确认信息给消息队列，消息队列就知道该消息被消费了，就会将该消息从消息队列中删除。只是不同的消息队列发送的确认信息形式不同,例如RabbitMQ是发送一个ACK确认消息，RocketMQ是返回一个CONSUME_SUCCESS成功标志，kafka实际上有个offset的概念，简单说一下(如果还不懂，出门找一个kafka入门到精通教程),就是每一个消息都有一个offset，kafka消费过消息后，需要提交offset，让消息队列知道自己已经消费过了。那造成重复消费的原因?，就是因为网络传输等等故障，确认信息没有传送到消息队列，导致消息队列不知道自己已经消费过该消息了，再次将该消息分发给其他的消费者。


保证消息不被重复消费、幂等性：
比如给每条消息分配一个唯一ID，消费者收到消息后检查一下数据库是否已存在该ID。

保证消息不被少消费：需要考虑生产者弄丢数据、消息队列弄丢数据、消费者弄丢数据三种情况。


用docker运行kafka：https://www.cnblogs.com/alaska1131/articles/9755646.html



## 
## 
## 
 
♢ kafka-Python
## kafka-Python：Python的第三方库，提供了Kafka客户端的功能。
## 发布消息。
import time
import traceback

from kafka import KafkaProducer

# 创建一个连接到指定broker的Producer
producer = KafkaProducer(bootstrap_servers="10.124.130.10:9092")

# 进入发送消息的循环
for _ in range(10):
    current_time = time.strftime("%Y%m%d-%H:%M:%S", time.localtime())
    msg = "test " + str(current_time)

    # 发送一个消息到指定topic
    future = producer.send(topic="test666", value=msg.encode(), partition=0)
    # 其定义为def send(topic, value=None, key=None, headers=None, partition=None, timestamp_ms=None)
    # 将消息转换成bytes类型才能发出
    # 不指定partition时kafka会自动将这些消息分配到几个partition中

    try:
        record_data = future.get(timeout=10)  # 等待服务器成功接受消息，超过10秒还没回应就抛出异常
    except:
        traceback.print_exc()

    print("sent: ", msg)
    print("offset: ", record_data.offset)

## 订阅消息。
from kafka import KafkaConsumer
from kafka import TopicPartition


# 创建一个连接到指定broker的指定topic的consumer
consumer = KafkaConsumer(client_id="12",  # 消费者自己取的名字
                         # sasl_mechanism="PLAIN",
                         # security_protocol='SASL_PLAINTEXT',
                         # sasl_plain_username="admin",
                         # sasl_plain_password="admin-secret123",
                         consumer_timeout_ms=5000,  # 未收到新消息时迭代等待的时间
                         enable_auto_commit=True,  # 自动提交偏移量，含有组信息才生效
                         auto_commit_interval_ms=500,  # 自动提交周期
                         # "latest",#没有组信息时从topic最末尾消费（默认latest）,earliest则从topic最早开始消费
                         auto_offset_reset="latest",
                         #  group_id="test2_g",  # 组信息,没有组信息不能提交偏移量
                         #  bootstrap_servers="172.31.32.39:9092"
                         #  bootstrap_servers="10.124.130.10:9092"
                         bootstrap_servers="10.124.128.56:9092"
                         )
# 指定消费者topic与partition（与consumer定义参数topic互斥）
consumer.assign([TopicPartition("test1", 0)])
# consumer.seek(TopicPartition(topic='test33333',partition=0),170)#手动指定TopicPartition的提取偏移量（要与assign方法一起用）

print("consuming start.")

with open("received_msg.log", 'a') as f:
    # consumer对象支持迭代，当队列中没有消息时会一直等待读取
    for i in consumer:
        print("fetching ...")
        msg = i.value.decode()
        print("got : ", msg)
        print("offset: ", i.offset)
        f.write(msg + '\n')
        f.flush()

print("consuming end.")

