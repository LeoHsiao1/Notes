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
        - "ES_JAVA_OPTS=-Xms1G -Xmx1G"
      ports:
        - 9200:9200
      ulimits:
        memlock:
          soft: -1
          hard: -1

    oap:
      image: apache/skywalking-oap-server:9.0.0
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
      image: apache/skywalking-ui:9.0.0
      environment:
        SW_OAP_ADDRESS: http://oap:12800
      ports:
        - 8080:8080
  ```

## 原理

- SkyWalking 监控系统分为多个组件：
  - Probes ：探针，负责收集监控数据，格式化之后存储。
  - UI ：Web 前端。
  - backend ：Web 后端。
  - Storage ：负责存储监控数据。
    - 支持 ES、MySQL 等多种数据库。
    - 为了保证监控的实时性，这里不采用消息队列，当数据量过大时可以降低采样率。
