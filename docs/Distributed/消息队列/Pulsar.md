# Pulsar

：一个消息队列服务器。
- [官方文档](https://pulsar.apache.org/docs)
- 发音为 `/ˈpʌlsɑː(r)/` 。
- 采用 Java 开发。
- 2016 年由 Yahoo 公司开源，后来交给 ASF 基金会管理。

## 原理

- Pulsar 的特点：
  - 采用发布-订阅模式，支持队列模型、流模型。
  - Pulsar 使用 Zookeeper 存储集群元数据、配置，协调分布式系统。
  - 生产者（Producer）负责将消息发送到 topic 。而消费者可以订阅多个 topic 。
  - Pulsar 可以创建多个租户（tenant），每个 tenant 可以创建多个 namespace ，每个 namespace 下可以创建多个 topic 。

- Kafka 的服务器只有 broker 一种角色，同时负责存储数据、处理客户端请求。而 Pulsar 将服务器分为两种角色：
  - broker ：负责处理客户端请求、代理 BookKeeper 集群。是无状态服务，可以随时增减。
  - bookie ：负责存储数据，又称为 BookKeeper 集群。

- Pulsar 像 Kafka 一样以追加日志的形式存储数据，并将日志以 Segment 为单位分段，分散存储到各个 Bookie 服务器上。
- topic 中的消息默认会持久保存，直到被所有订阅者确认消费（ACK）。
  - 如果 topic 不存在一个订阅，则消息不会保留，会在 segment rollover 时被删除。
  - 可选设置 TTL ，自动将超时的消息标记为确认消费，允许被删除。
  - 可选设置保留策略（Retention），将已确认消费的消息，保留一定大小或时长。

- 对比 Kafka 与 Pulsar ：
  - Kafka 增减 broker 数量时需要迁移 partition 、rebalance ，耗时久。而 Pulsar 以 Segment 为单位在服务器之间迁移数据。
  - Pulsar 软件还不成熟，架构较复杂，因此一般情况下还是推荐使用 Kafka 。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    pulsar:
      container_name: pulsar
      image: apachepulsar/pulsar:2.8.2
      restart: unless-stopped
      entrypoint:
        - sh
        - -c
        - "bin/apply-config-from-env.py conf/standalone.conf && bin/pulsar standalone"
      environment:
        PULSAR_MEM: -Xms2g -Xmx2g
      ports:
        - 6650:6650   # broker 监听的端口
        - 8080:8080   # HTTP 端口
      volumes:
        - ./conf:/pulsar/conf
        - ./data:/pulsar/data
  ```

## 命令

- pulsar 自带了一个命令行工具，用法如下：
  ```sh
  bin/pulsar-admin
          tenants
              list          # 列出所有租户

          namespaces
              list   <tenant>               # 列出租户的所有命名空间
              create <tenant>/<namespace>   # 创建一个命名空间
              delete <tenant>/<namespace>   # 删除一个命名空间

              get-message-ttl <tenant>/<namespace>                      # 查询命名空间的消息 TTL
              set-message-ttl <tenant>/<namespace> --messageTTL 3600    # 设置 TTL ，单位为秒。如果设置为 0 ，则禁用
              get-retention <tenant>/<namespace>                        # 查询命名空间的消息过期策略
              set-retention <tenant>/<namespace> --size 100M --time 1h  # 设置消息过期策略

          topics
              list <tenant>/<namespace>   # 列出命名空间下的所有 topic
              delete persistent://<tenant>/<namespace>/<topic>  # 删除一个 topic
                  --force   # 强制删除。默认不能删除有活跃的 producer 或 subscription 的 topic

          broker-stats
              topics        # 查询所有 topic 的状态
  ```
  - 例：
    ```sh
    [root@CentOS ~]# bin/pulsar-admin tenants list
    "public"
    "pulsar"
    "sample"
    [root@CentOS ~]# bin/pulsar-admin topics list public/functions
    "persistent://public/functions/metadata"
    "persistent://public/functions/assignments"
    "persistent://public/functions/coordinate"
    ```
