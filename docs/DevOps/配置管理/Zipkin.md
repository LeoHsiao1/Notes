# Zipkin

：一个用于分布式链路跟踪的服务器。
- [官方文档](https://github.com/openzipkin/zipkin/blob/master/zipkin-server/README.md)
- 由 Twitter 公司开源，基于 Java 开发。
- 提供了 Restful API 和 Web UI 。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    zipkin:
      container_name: zipkin
      image: openzipkin/zipkin:2.20
      restart: unless-stopped
      environment:
        # QUERY_PORT: 9411
        # QUERY_TIMEOUT: 11s              # 查询的超时时间，设置为 0 则不限制
        # QUERY_LOG_LEVEL: INFO
        # COLLECTOR_SAMPLE_RATE: 1.0      # 采样率，作用于全局。默认为 1.0 ，表示 100%
        SELF_TRACING_ENABLED: 'true'      # 是否启用 Zipkin 的自身跟踪，默认为 false
        SELF_TRACING_SAMPLE_RATE: 0.001   # 自身跟踪的采样率

        STORAGE_TYPE: elasticsearch       # 存储后端的类型，默认为 mem ，存储在内存中
        ES_HOSTS: http://10.0.0.1:9200
        # ES_USERNAME:
        # ES_PASSWORD:
        # ES_INDEX: zipkin                # 索引名的前缀，实际创建的索引名会加上日期后缀，比如 zipkin:span-2021-01-01
        # ES_INDEX_SHARDS: 5
        # ES_INDEX_REPLICAS: 0
        # ES_ENSURE_TEMPLATES: true       # 是否自动创建索引模板
      ports:
        - 9411:9411

    denpendencies:                        # 该镜像默认每小时执行一次 denpendencies job
      container_name: zipkin_dependencies
      image: openzipkin/zipkin-dependencies:2.6
      entrypoint: crond -f
      environment:
        STORAGE_TYPE: elasticsearch
        ES_HOSTS: http://10.0.0.1:9200
        ES_NODES_WAN_ONLY: 'true'         # 是否只使用 ES_HOSTS 中列出的 ES 地址。默认为 false ，会连接本机的 9200 端口

  ```
  - Zipkin 的 v2.21 版本更换了 UI ，并且支持的 ES 版本从 v6 改为 v7 。

## 原理

- 运行流程：
  1. 用户发出一个请求。
  2. 业务系统收到请求，依次传递给前端、后端多个服务处理。每个服务在处理时，都将调用记录发送到 Zipkin 。
  3. Zipkin 可以实时跟踪请求的调用情况，进行树形图分析。

- Zipkin 为每个调用链路分配一个全局唯一的 traceId ，对应一个树形图。
  - 为链路中中的每个请求分配一个 spanId ，对应树形图中的一个节点。
  - 支持给服务器、客户端分别设置采样率。

- Zipkin 提供了多种编程语言的客户端，供业务进程调用。
- 业务进程将数据发送到 Zipkin 时，负责发送、接收的模块分别称为 Reporter、Collector。
  - Reporter 有几种通信方式可选：
    - HTTP ：默认方式。
    - Kafka ：适合传输大量数据。
    - Scribe ：用于收集日志。

- Zipkin 默认将数据存储在内存中，没有持久化保存。并且默认最多存储 `MEM_MAX_SPANS=500000` 条记录，超过则删除旧记录。
  - 可以采用 Cassandra、ES、MySQL 等外部存储后端。

- Zipkin 默认每天执行一个 Spark Job ，绘制当天（UTC 时区）的 dependencies 依赖图。
  - 采用外部存储后端时，不会自动执行该 Job 。用户可以主动执行：
    ```sh
    java -jar zipkin-dependencies.jar
    ```
    配置参数通过环境变量传入。

## ♢ py-zipkin

：Python 的第三方库，用作 Zipkin 客户端。
- [GitHub 页面](https://github.com/Yelp/py_zipkin)
- 安装：`pip install py-zipkin`
- 例：
  ```py
  import requests
  from py_zipkin.zipkin import zipkin_span

  # 自定义一个函数，用于发送编码后的 span 数据到 Zipkin
  def http_transport(encoded_span):
      zipkin_url = "http://10.0.0.1:9411/api/v1/spans"
      headers = {"Content-Type": "application/x-thrift"}
      requests.post(zipkin_url, data=encoded_span, headers=headers)

  # 在业务代码中，采集 span 数据
  def func1():
      with zipkin_span(
          service_name='test_service',
          span_name='test_span',
          transport_handler=http_transport,
          sample_rate=100,  # 采样率，取值为 0.0 ~ 100.0
      ):
          pass

  ```
