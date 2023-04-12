# ELK

：一个对大量数据（通常是日志）进行采集、存储、展示的系统，又称为 ELK Stack 或 Elastic Stack ，由 Elastic 公司发布。
- [官方文档](https://www.elastic.co/guide/index.html)
- [下载页面](https://www.elastic.co/cn/downloads/)

## 原理

### 组件

ELK 系统主要由以下软件组成：
- ElasticSearch
  - 用于存储数据，并支持查询。
- Logstash
  - 用于收集日志数据，解析成格式化数据之后，发送到 ES 中存储。
- Kibana
  - 一个基于 node.js 运行的 Web 服务器，用于查询、管理 ES 。

ELK 系统还可以选择加入以下软件：
- Beats
  - 采用 Golang 开发，用于采集日志数据。比 Logstash 更轻量级，但功能较少。
  - Beats 程序有多种类型：
    - Filebeat ：用于采集日志文件。
    - Packetbeat ：用于采集网络数据包的日志。
    - Winlogbeat ：用于采集 Windows 的 event 日志。
    - Metricbeat ：用于采集系统或软件的性能指标。
    - Auditbeat ：用于采集 Linux Audit 进程的日志。
  - 用户也可以基于 Beats 框架开发自定义的 Beats 程序。
- Elastic Agent
  - v7.8 版本新增的软件，用于采集日志数据。它集成了不同类型的 Beats 的功能。
- Observability
  - 为 Kibana 扩展了一些日志可视化的功能，比如实时查看日志、设置告警规则。
- Security
  - 用于监控一些安全事项。
- APM（Application Performance Monitoring）
  - 用于采集、监控应用程序的性能指标。
- Enterprise Search
  - 提供搜索功能，可以集成到业务网站的搜索栏中。

总结：
- 上述软件都是由 Elastic 公司开发。
- 这些软件运行时可能需要 JDK、node.js 等环境，不过从 v7.0 版本开始，二进制发行版都已经自带了。
- 部署时，ELK 系统中各个软件的版本应该尽量一致，否则可能不兼容。

### 工作流程

- ELK 的主要工作流程：
  1. 在每个主机上部署 Beats 进程，自动采集日志，然后发送到 Logstash 。
  2. Logstash 将日志解析成 JSON 格式，然后发送到 ES 中存储。
  3. 用户使用 Kibana ，从 ES 中查询日志数据并展示。

- 考虑到整个工作流程的耗时、Kibana 网页刷新的耗时，用户查看最新日志大概有几秒的延迟。

- 关于 Logstash 与 Beats ：
  - 早期，是用 Logstash 采集日志然后发送到 ES 中存储。
  - 后来，由于 Logstash 消耗内存较多，采集日志的效率较低，因此开发了轻量级的 Beats 程序来取代 Logstash 。
    - Beats 不擅长解析日志文本。因此通常不会让 Beats 直接将原始日志发送到 ES ，而是先发送到 Logstash 进行解析，再由 Logstash 发送到 ES 。
    - 如果日志的并发量太大，可以让 Beats 将采集的日志先发送到 Kafka 缓冲，然后让 Logstash 从 Kafka 获取数据。

## 相关概念

- Flume
  - ：一个命令行工具，用于日志采集。类似于 Logstash ，但功能较少。
  - 由 Cloudera 公司采用 Java 开发，2012 年成为 ASF 的顶级项目。
  - 通过 tail -f 的方式采集日志文件的内容，因此重启采集进程之后会重复采集。

- Fluentd
  - ：一个命令行工具，用于日志采集。类似于 Logstash ，也有丰富的插件。
  - 2011 年由 Treasure Data 公司发布，采用 Ruby 开发。
  - 采集的数据解析为 JSON 对象，可以输出到 ES、MongoDB、Kafka 等。
  - 可以替换 ELK 系统中的 Logstash ，组成 EFK 。

- Loki
  - ：一个包括日志采集、存储、展示的系统，由 Grafana Labs 公司发布。包括以下组件：
    - Promtail ：用于采集日志文件。
    - Loki ：用于存储日志数据。
    - Grafana ：用于展示日志数据。
  - 借鉴了 Prometheus 的工作方式，给日志数据添加一些键值对格式的标签，从而筛选日志。比 ELK 的查询、显示速度快很多，但不支持全文搜索。
