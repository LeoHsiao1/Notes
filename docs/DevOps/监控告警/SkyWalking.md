# SkyWalking

：一个 Web 服务器，支持分布式链路监控、应用性能监控（APM）。
- [官方文档](https://skywalking.apache.org/docs/main/latest/readme/)
- 2015 年由中国开发人员吴晟开源，2017 年底进入 Apache 孵化器。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    elasticsearch:
      image: elasticsearch:7.10.1
      environment:
        - discovery.type=single-node
        - bootstrap.memory_lock=true
        - "ES_JAVA_OPTS=-Xms2G -Xmx2G"
      ports:
        - 9200:9200
      ulimits:
        memlock:
          soft: -1
          hard: -1

    oap:
      image: apache/skywalking-oap-server:8.9.1
      environment:
        SW_STORAGE: elasticsearch
        SW_STORAGE_ES_CLUSTER_NODES: elasticsearch:9200
        SW_HEALTH_CHECKER: default
        SW_TELEMETRY: prometheus
        JAVA_OPTS: "-Xms2G -Xmx2G"
      ports:
        - 11800:11800
        - 12800:12800

    ui:
      image: apache/skywalking-ui:8.9.1
      environment:
        SW_OAP_ADDRESS: http://oap:12800
      ports:
        - 8080:8080
  ```

## 原理

- SkyWalking 监控系统分为多个组件：
  - UI ：Web 前端。
  - OAP ：Web 后端。
  - Storage ：负责存储监控数据。
    - 支持 ES、MySQL 等多种数据库。
    - 为了保证监控的实时性，这里不采用消息队列，当数据量过大时可以降低采样率。
  - agent ：采集业务服务的监控数据，发送给 OAP 。

## 用法

例：以非侵入方式监控 Python 进程
1. 安装 SkyWalking Python agent：`pip install apache-skywalking`
2. 配置环境变量：
    ```sh
    export SW_AGENT_NAME=test_service     # 监控的该服务名
    # export SW_AGENT_INSTANCE=           # 服务实例名，默认会自动生成
    export SW_AGENT_COLLECTOR_BACKEND_SERVICES=10.0.0.1:11800 # SkyWalking OAP 地址
    # export SW_AGENT_PROTOCOL=grpc       # 通信协议，默认为 grpc
    # export SW_AGENT_LOGGING_LEVEL=INFO  # agent 的日志级别
    ```
3. 用 agent 启动 Python 进程：
    ```sh
    sw-python run python test.py
    ```

例：以非侵入方式监控 Java 进程
1. 下载 agent 包，解压缩。
2. 在 Java 启动命令中添加 agent 参数，如下：
    ```sh
    java \
    -javaagent:skywalking-agent/skywalking-agent.jar \
    -Dskywalking.agent.service_name=test \
    -Dskywalking.collector.backend_service=10.0.0.1:11800 \
    -jar test.jar
    ```
    详情参考[官方文档](https://skywalking.apache.org/docs/main/v8.4.0/en/setup/service-agent/java-agent/readme/)

