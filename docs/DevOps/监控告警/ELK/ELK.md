# ELK

：一个包括日志采集、存储、展示的系统，又称为 ELK Stack 或 Elastic Stack 。由 Elastic 公司发布。
- [官方文档](https://www.elastic.co/guide/index.html)
- [下载页面](https://www.elastic.co/cn/downloads/)

## 原理

### 组件

ELk 系统主要由以下软件组成：
- ElasticSearch
  - 用于存储数据，并支持查询。
- Logstash
  - 用于采集日志数据，并解析成格式化数据，发送到 ES 中存储。
  - 采用 Ruby 开发，通过 JRuby 解释器运行在 JVM 上。
- Kibana
  - 一个基于 node.js 运行的 Web 服务器，用于查询、展示 ES 中存储的数据。

ELK 系统还可以选择加入以下软件：
- Beats
  - 采用 Golang 开发，用于采集日志数据。比 Logstash 更轻量级，但功能较少。
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
- 部署时，ELk 系统中各个软件的版本应该尽量一致，否则可能不兼容。

### 工作流程

ELK 的主要工作流程如下：
1. Beats 采集日志，然后发送到 Logstash 。
2. Logstash 将日志解析成结构化数据，然后发送到 ES 中存储。
3. 用户使用 Kibana ，从 ES 中查询日志数据并展示。

关于 Logstash 与 Beats ：
- 早期，是用 Logstash 采集日志然后发送到 ES 中存储。
- 后来，由于 Logstash 消耗内存较多，采集日志的效率较低，因此开发了轻量级的 Beats 程序来取代 Logstash 。
- 但是，Beats 不擅长解析日志文本。因此虽然 Beats 可以直接将原始日志发送到 ES ，但通常还是先发送到 Logstash 进行解析。

## 相关概念

- Flume
  - ：一个命令行工具，用于日志采集。类似于 Logstash ，但功能较少。
  - 由 Cloudera 公司采用 Java 开发，2012 年成为 ASF 的顶级项目。
  - 通过 tail -f 的方式采集日志文件的内容，因此重启采集进程之后会重复采集。

- Fluentd
  - ：一个命令行工具，用于日志采集。类似于 Logstash ，也有丰富的插件。
  - 2011 年首次发布，由 Treasure Data 公司采用 Ruby 开发。
  - 采集的数据解析为 JSON 对象，可以输出到 ES、MongoDB、Kafka 等。
  - 可以替换 ELK 系统中的 Logstash ，组成 EFK 。

- Loki
  - ：一个包括日志采集、存储、展示的系统，由 Grafana Labs 公司发布。包括以下组件：
    - Promtail ：用于采集日志文件。
    - Loki ：用于存储日志数据。
    - Grafana ：用于展示日志数据。
  - 借鉴了 Prometheus 的工作方式，给日志数据添加一些键值对格式的标签，从而便于快速筛选日志，但不支持索引。
