# ELK

：一套日志采集及展示方案，又称为 ELK Stack 或 Elastic Stack 。由 Elastic 公司发布。
- [官方文档](https://www.elastic.co/guide/index.html)
- [下载页面](https://www.elastic.co/cn/downloads/)


## 架构

ELk 系统主要用到以下软件：
- ElasticSearch ：用于存储数据，并支持查询。
- Logstash ：用于采集日志数据，发送到 ES 中存储。
- Kibana ：一个 Web 服务器，用于查询、展示 ES 中存储的数据。

ELK 系统还可选择加入以下软件：
- Beats ：轻量级代理程序，用于采集日志数据。
- Elastic Agent ：v7.8 版本新增的软件，用于采集日志数据。它集成了不同类型的 Beats 的功能。
- Enterprise Search ：提供搜索功能，可以集成到网站的搜索栏中。
- Observability ：提供一些监控仪表盘。
- Security ：提供一些安全监控功能。

总结：
- 上述软件都是由 Elastic 公司开发。
- 部署时，ELk 系统中各个软件的版本应该一致，避免不兼容。

## Logstash

部署：
```sh
https://artifacts.elastic.co/downloads/logstash/logstash-7.10.1-linux-x86_64.tar.gz


```

## Kibana

- 可以显示多种分析日志的图表、仪表盘，还支持设置告警规则。

### 部署

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/kibana/kibana-7.10.1-linux-x86_64.tar.gz
    ```

2. 解压后，编辑配置文件 config/kibana.yml ：
    ```yml
    server.port: 5601           # Kibana 监听的端口
    server.host: "10.0.0.1"     # Kibana 监听的 IP

    elasticsearch.hosts: ["http://10.0.0.1:9200"]   # 连接到 ES
    # elasticsearch.username: "admin"
    # elasticsearch.password: "123456"

    # kibana.index: ".kibana"   # 在 ES 中创建该索引，存储 Kibana 的数据

    i18n.locale: "zh-CN"        # 让 Kibana 网站显示中文
    ```

3. 启动：
    ```sh
    bin/kibana
    ```

### 用法

- 访问 URL `/status` 可查看 Kibana 本身的状态。
- 除了使用 Logstash、Beats 等服务采集日志数据，还可以在 Kibana 网站上直接上传日志文件，解析后存储到 ES ，便于测试。

建议在 Kibana 网站上进行以下设置：
- 设置 Default 工作区，只显示 Kibana 的功能，没必要显示 Enterprise Search、Observability、Security 等功能模块。
- 将显示的日期格式设置为 `YYYY/MM/D HH:mm:ss` 。
- 在 Kibana 的管理页面，可以查看、配置索引、数据流、索引模板、组建模板、索引模式。

<!--
- 上传日志文件时，配置 Grok 模式的语法？
  - 上传时要创建索引，，，索引模式是什么？
- 上传日志数据时，需要选择保存到 ES 中的哪个索引（index）之下。
  - 建议给不同来源的日志创建不同的索引，以免产生冲突。比如按 `<日志类型>-<主机名>` 的格式给索引命名。
- Kibana 查询语言的语法？
-->


### Discover

- Kibana 的 Discover 页面原本名为 Logs UI ，用于查询、查看日志。但现在扩展了用途，提供通用的 ES 可视化查询功能。
- 页面示例：

  ![](./ELK_discover.png)

  - 页面上侧是搜索栏，默认使用 Kibana 查询表达式，支持设置时间范围。
  - 页面中央是一个时间轴，显示每个时刻命中的 document 数量。
  - 页面中下方是一个列表，显示所有查询结果。
    - 每行一条 document ，点击某个 document 左侧的下拉按钮，就会显示其详细信息。
    - 默认显示 Time 和 _source 字段，可以在左侧栏中指定其它字段用作显示。
  - 点击页面右上角的 Save 按钮，就会保存当前查询页面，以便日后再次查看。

### Dashboard

- Kibana 的 Dashboard 页面用于显示仪表盘。
- 添加 ActiveMQ、MySQL 等流行软件的日志时，可使用默认的仪表盘。

### Fleet

- Kibana 的 Fleet 页面原本名为 Ingest Manager ，用于查看、配置 Elastic Agent 。

## Beats

- Logstash 运行在 JVM 上，消耗内存较多，采集日志的效率较低，因此后来推出了 Beats 来取代 Logstash 。
  - 不过目前 Beats 只能发送原始日志，不擅长将日志文本转换成结构化数据，因此通常不让 Beats 直接将数据发送到 ES ，而是先发送给 Logstash 加工。
  - 日志的并发量太大时，可以将采集的数据先发送到 Kafka 等消息队列，然后让 Logstash 从消息队列拿取数据。
- Beats 进程有多种类型，例如：
  - Filebeat ：用于采集日志文件。
  - Packetbeat ：用于采集网络数据包的日志。
  - Winlogbeat ：用于采集 Windows 的 event 日志。
  - Metricbeat ：用于采集系统或软件的性能指标。
  - Auditbeat ：用于采集 Linux Audit 进程的日志。
- 使用 Beats 时需要在每个要监控的主机上部署 Beats 进程，且监控不同类型的日志时需要部署不同的 beats 进程，很麻烦。

### Filebeat

部署步骤：

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.10.1-linux-x86_64.tar.gz
    ```

2. 解压后，编辑配置文件 filebeat.yml ：
    ```yml
    setup.kibana:
      host: "10.0.0.1:5601"
    
    output.elasticsearch:
      hosts: ["10.0.0.1:9200"]
      # username: "admin"
      # password: "123456"
    ```

3. 初始化：
    ```sh
    ./filebeat modules enable system    # 启用 system 模块，用于采集系统日志
    ./filebeat setup                    # 连接到 Kibana ，创建索引、索引模板等
    ```

4. 启动：
    ```sh
    ./filebeat -e
    ```




