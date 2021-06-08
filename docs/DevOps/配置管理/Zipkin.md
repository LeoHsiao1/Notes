# Zipkin

：一个用于分布式链路跟踪的服务器。
- [官方文档](https://github.com/openzipkin/zipkin/blob/master/zipkin-server/README.md)
- 由 Twitter 公司开源，基于 Java 开发。
- 提供了 Restful API 和 Web UI 。

## 原理

- 运行流程：
  1. 用户发出一个请求。
  2. 业务系统收到请求，依次传递给后端 n 个服务处理。每个服务在处理时，都将调用记录发送到 Zipkin 。
  3. Zipkin 可以实时跟踪请求的调用情况，进行树形图分析。

- Zipkin 会为每个调用链路分配一个全局唯一的 traceId ，对应一个树形图。
  - 为链路中中的每个请求分配一个 spanId ，对应树形图中的一个节点。

- Zipkin 提供了多种编程语言的检测库，供业务进程调用，用于记录调用信息。
- 业务进程将数据发送到 Zipkin 时，负责发送、接收的模块分别称为 Reporter、Collector。
  - Reporter 有几种通信方式可选：
    - HTTP ：默认方式。
    - Kafka ：适合传输大量数据。
    - Scribe ：用于收集日志。

- Zipkin 默认将数据存储在内存中，没有持久化保存。并且默认最多存储 `MEM_MAX_SPANS=500000` 条记录，超过则删除旧记录。
  - 可以采用 Cassandra、ES、MySQL 等外部存储后端。

- Zipkin 默认每天执行一个 Spark Job ，绘制当天（UTC 时区）的 dependencies 依赖图。
  - 采用外部存储后端时，不会自动执行该 Job 。用户可以主动执行 zipkin-dependencies.jar 进程。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    zipkin:
      container_name: zipkin
      image: openzipkin/zipkin:2.23
      restart: unless-stopped
      environment:
        # QUERY_PORT: 9411
        # QUERY_TIMEOUT: 11s              # 查询的超时时间，设置为 0 则不限制
        # QUERY_LOG_LEVEL: INFO
        # COLLECTOR_SAMPLE_RATE: 1.0      # 采样率，默认为 1.0 ，表示 100%
        SELF_TRACING_ENABLED: 'true'      # 是否启用 Zipkin 的自身跟踪，默认为 false
        SELF_TRACING_SAMPLE_RATE: 0.001   # 自身跟踪的采样率

        STORAGE_TYPE: elasticsearch       # 存储后端的类型，默认为 mem ，存储在内存中
        ES_HOSTS: http://10.0.0.1:9200
        # ES_USERNAME:
        # ES_PASSWORD:
        # ES_INDEX: zipkin                # 索引名的前缀，实际创建的索引名会加上日期后缀
        # ES_INDEX_SHARDS: 5
        # ES_INDEX_REPLICAS: 0
        # ES_ENSURE_TEMPLATES: true       # 是否自动创建索引模板
      ports:
        - 9411:9411

    denpendencies:                        # 用于定时执行 denpendencies job
      container_name: zipkin_dependencies
      image: openzipkin/zipkin-dependencies:2.6
      entrypoint: crond -f
      environment:
        STORAGE_TYPE: elasticsearch
        ES_HOSTS: http://10.0.0.1:9200

  ```
