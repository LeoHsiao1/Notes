# Prometheus

：一个 Web 服务器，用于采集大量对象的监控指标，然后供用户查询。
- [官方文档](https://prometheus.io/docs/introduction/overview/)
- 采用 Golang 开发。
- 由 SoundCloud 公司的前 Google 员工于 2015 年发布，它起源于 Google 内部用于监控 Borg 系统的 Borgmon 系统。
- 特点：
  - 采集文本格式的监控指标。每条数据包含一个指标名、一些键值对格式标签。
  - 可监控主机、进程、容器等多种对象。

## 原理

- 架构：
  - 在每个需要监控的主机上运行一个负责采集监控指标的程序，称为 exporter 。它能通过 HTTP API 输出纯文本格式的监控指标，称为 metrics 。
  - Prometheus 定期向每个 exporter 发送 HTTP GET 请求，获取 metrics ，然后存储到自己的时序数据库 TSDB 中。。
      - Prometheus 属于离散采样，可能有遗漏、有延迟、有误差。
      - exporter 一般收到 HTTP 请求时才采集一次当前时刻的 metrics ，不负责存储数据。

- Prometheus 采集 metrics 的方式有多种：
  - exporter
    - ：最基础的方式。让程序监听一个符合 exporter 格式的 HTTP 端口，然后 Prometheus 定期发送 GET 请求到该端口，采集 metrics 。
  - pushgateway
    - ：程序将 metrics 通过 POST 请求发送到 pushgateway ，然后 Prometheus 定期从 pushgateway 采集 metrics 。
  - 第三方媒介
    - ：程序将 metrics 定期写入文件、数据库等媒介，然后 node_exporter 等工具收集这些 metrics ，加入自己 exporter 端口的响应中。

- Prometheus 的时序数据库 TSDB 默认存储在 `${prometheus}/data/` 目录下，目录结构如下：
  ```sh
  data/
  ├── 01E728KFZWGDM7HMY6M2D26QJD/   # 一个 block 目录
  │   ├── chunks
  │   │   └── 000001                # 压缩后的数据文件
  │   ├── index
  │   ├── meta.json
  │   └── tombstones
  ├── 01BKGTZQ1HHWHV8FBJXW1Y3W0K/
  ├── lock
  ├── queries.active
  └── wal/
      ├── 00000003                  # 预写日志文件
      ├── 00000004
      └── checkpoint.000002/        # 最近一个转存到 chunks 的预写日志的编号
  ```

- Prometheus 处理 metrics 数据的流程：
  1. 采集到一批 metrics 数据，暂时保存在内存中，同时写入 wal/ 目录下的预写日志文件。
      - wal/ 目录下可能存在多个预写日志文件，每个文件最大为 128 MB 。
      - 如果 Prometheus 重启，则会读取预写日志文件，重新将数据载入内存。
  2. 每隔两个小时，创建一个随机编号的 block 目录，将 wal/ 目录下两小时范围内的数据，压缩之后转存到 `${block}/chunks/` 目录下。
      - 如果转存成功，则更新 checkpoint ，并删除 wal/ 目录下编号不超过 checkpoint 的预写日志文件。
      - chunks/ 目录下可能存在多个数据文件，每个文件最大为 512 MB ，一段时间后可能被进一步压缩，时间相邻的文件还可能被合并。
      - 如果用户请求删除 chunks 中的数据，则会将待删除的数据记录在 tombstones 文件中，等下一次压缩、合并数据文件时才实际删除。

- Prometheus 的图表功能很少，建议将它的数据交给 Grafana 显示。
- Prometheus 及其插件都采用 UTC 时间，不支持修改时区。用户可自行将查询结果中的时间字符串改成本地时区。

## 部署

### 单节点

- 下载二进制版：
  ```sh
  wget https://github.com/prometheus/prometheus/releases/download/v2.42.0/prometheus-2.42.0.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  ./prometheus
              --config.file /etc/prometheus/prometheus.yml  # 使用指定的配置文件
              # --web.config.file=web.yml
              # --web.listen-address 0.0.0.0:9090           # 监听的地址
              # --web.external-url http://10.0.0.1:9090/    # 供外部访问的 URL
              # --web.enable-admin-api                      # 启用管理员的 HTTP API ，比如删除数据
              # --web.enable-lifecycle                      # 启用 reload、quit 等 HTTP API
              # --web.enable-remote-write-receiver

              # --storage.tsdb.retention.time=15d           # chunks/ 目录下数据文件的最大保存时长
              # --storage.tsdb.retention.size=500GB         # TSDB 的最大保存体积
              # --query.timeout=2m                          # 每次查询的超时时间
              # --query.max-samples=50000000                # 每次查询时最多将多少个指标载入内存，如果超过该数量，则查询失败
              --log.format=json
  ```
  - 配置文件 prometheus.yml 主要用于控制 Prometheus 的监控任务，而 Prometheus 自身的运行状态只能通过命令行参数控制。
  - 配置文件 web.yml 用于启用身份认证，如下：
    ```yml
    basic_auth_users:
      <username>: <password>   # 这里需要填密码的哈希值，可用命令 htpasswd -nbB <username> <password> 生成
    ```

- 或者用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    prometheus:
      container_name: prometheus
      image: prom/prometheus:v2.42.0
      restart: unless-stopped
      command:
        - --web.external-url=http://10.0.0.1:9090
      ports:
        - 9090:9090
      volumes:
        - .:/prometheus
  ```
  需要调整挂载目录的权限：
  ```sh
  mkdir data
  chown -R 65534 .
  ```

### 集群

Prometheus 集群有多种部署方案：
- federate
  - 原理：
    1. 按普通方式部署一些 Prometheus ，担任子节点。
    2. 部署一个 Prometheus ，担任父节点，添加 scrape_configs 配置：通过 federate 接口，抓取各个 Prometheus 子节点已采集的 metrics 。
  - 配置示例：
    ```yml
    scrape_configs:
    - job_name: federate
      honor_labels: true        # 设置 true ，以保存原指标中的 job 、instance 标签
      metrics_path: /federate   # 抓取的路由
      params:
        match[]:                # 指定筛选表达式。至少需要指定一个，如果指定多个则取并集
          - "{job!=''}"
          - go_goroutines
      static_configs:
        - targets:              # 目标 Prometheus 的地址
          - 10.0.0.2:9090
          - 10.0.0.3:9090
    ```
    - 只能抓取目标 Prometheus 最新采集的 metrics 。如果目标 Prometheus 掉线一段时间，则重新连接之后，并不会抓取掉线期间的 metrics 。
  - 假设在多个机房存在 exporter ，用一个 Prometheus 通过公网采集 metrics 。则可能存在一些问题：网速慢、偶尔超过 scrape_timeout 、偶尔断网。
    - 此时建议在每个机房部署一个 Prometheus 子节点，通过内网采集 metrics ，然后汇总到 Prometheus 父节点。

- remote write
  - 原理：
    1. 部署一个 Prometheus ，担任父节点，加上命令行选项 --web.enable-remote-write-receiver 。
    2. 部署一些 Prometheus ，担任子节点，添加 remote_write 配置：将本机采集到的 metrics ，发送到 Prometheus 父节点的 /api/v1/write 路由。
  - remote write 与 federate 相似，都是将 metrics 汇总存储到一个 Prometheus ，但 remote write 更可靠：
    - federate 方式可能重复采集某个时刻的 metrics ，也可能遗漏采集某个时刻的 metrics 。
    - remote write 方式会为每个 remote 创建一个 metrics 推送队列（queue）。
      - 如果队列中的 metrics 推送失败，则自动重试。除非持续失败 2 小时，WAL 预写日志文件被压缩。
      - 每个 queue 分成多个分片（shard），可以并发推送。
      - 普通部署方案，会在 scrape 瞬间对 Prometheus 造成很大负载。而通过队列推送，负载很平稳。
  - 配置示例：
    ```yml
    scrape_configs: ...
    remote_write:
      - url: https://prometheus.test.com/api/v1/write
        # enable_http2: true
        # remote_timeout: 30s     # 每次发送 HTTP 请求给 remote 的超时时间
        # basic_auth:
        #   username: ***
        #   password: ***
        write_relabel_configs:    # 在发送 metrics 之前，修改 label
          - <relabel_config>
        # queue_config:           # 配置推送队列
          # capacity: 2500        # 从 WAL 读取 metrics 到 queue 时，每个 shard 最多缓冲多少条 metrics ，如果缓冲区满了则暂停读取 WAL
          # max_shards: 200       # 当前 queue 最多划分多少个 shard
          # min_shards: 1         # 当前 queue 启动时初始有多少个 shard 。如果 Prometheus 认为推送速度慢，则会自动增加 shard 数量
          # max_samples_per_send: 500   # 每个 shard 每次最多推送多少条 metrics 。建议将 capacity 设置为 max_samples_per_send 的几倍
          # batch_send_deadline: 5s     # 每个 shard 等待缓冲了 max_samples_per_send 条 metrics 才推送一次，如果等待超时，即使数量不足也推送一次
          # min_backoff: 30ms           # 连续推送失败时，重试间隔从 min_backoff 开始增加，每次倍增，最大为 max_backoff
          # max_backoff: 5s
    ```
    - 整个 queue 占用的内存大概为 `number_of_shards * (capacity + max_samples_per_send)` 。1K 条 metrics 大概占用 50KB 内存。

- remote read
  - 原理：
    1. 按普通方式部署一些 Prometheus ，担任子节点。
    2. 部署一个 Prometheus ，担任父节点，添加 remote_read 配置：当本机需要查询 metrics 时，允许发送查询请求到各个 Prometheus 子节点的 /api/v1/read 路由，然后汇总它们查询到的 metrics 。
  - 向 Prometheus 子节点发送的查询请求，不是 PromQL 格式，而是 protobuf 格式，只能根据时间范围、标签查询 metrics 。
  - 警报和记录规则评估仅使用本​​地 TSDB 。

- agent
  - Prometheus v2.32.0 增加了 agent 工作模式，起源于 Grafana agent ，原理如下：
    1. 按 remote_write 方案部署 Prometheus 。
    2. 给 Prometheus 子节点加上命令行选项 --enable-feature=agent 。
  - agent 与 remote write 相比，优点如下：
    - agent 禁用了本地存储 TSDB ，因此占用磁盘更少。采集到的 metrics 会先缓存在 `data-agent/wal/` 目录，只要转发成功，就立即删除。
    - agent 禁用了查询、警报功能，因此占用内存更少。

- [Thanos](https://github.com/thanos-io/thanos)
  - ：一套第三方软件，基于 Prometheus 搭建分布式监控系统。包含多个组件：
    - Sidecar ：为每个 Prometheus 部署一个 Sidecar ，将该 Prometheus 采集的 metrics 发送到 S3 云存储。
    - Receiver ：接收 Prometheus 通过 remote write 发送的 metrics ，然后保存到云存储。
    - Compactor ：压缩云存储中的 metrics 数据。
    - Ruler ：对云存储中的 metrics 执行 recording rules 和 alerting rules 。
    - Query ：实现 Prometheus 的查询 API ，被 Query Frontend 调用。
    - Query Frontend ：供用户访问，执行 PromQL 查询表达式。
  - federate 等集群方案主要用于横向扩容 Prometheus 集群，依然存在单点故障的风险。而 thanos 可给每个组件部署多实例，实现高可用。
    - 不过 Prometheus 单节点就有很高性能，一般不需要用到 thanos 。

- [VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics)
  - ：一个监控工具。可完全替代 Prometheus ，也可用作 Prometheus 的存储层，通过 remote write 写入数据，并且兼容 Prometheus 的查询 API 。
  - 与 Prometheus 相比，优点如下：
    - 采集、查询基数很大的 metrics 时，性能比 Prometheus 更好。
    - 除了单节点部署，也支持集群部署，可通过部署多实例来实现高可用。

## 配置

### 示例

下例是让 Prometheus 监控自身的步骤：
1. 在配置文件 prometheus.yml 中加入监控任务：
    ```yml
    global:
      scrape_interval: 30s          # 每隔多久采集一次指标，默认为 1m（这是全局值，可以被局部值覆盖）
      scrape_timeout: 10s           # 每次采集的超时时间。默认为 10s ，不允许超过 scrape_interval
      evaluation_interval: 30s      # 每隔多久执行一次 rules ，默认为 1m
      # external_labels:            # 与 Alertmanager 等外部组件通信时，会加上这些标签
      #   monitor: codelab-monitor

    # rule_files:                   # 导入 rules 文件
    # - rules_1.yml

    scrape_configs:                 # 配置需要监控的对象，称为 targets
    - job_name: prometheus          # 声明一个监控任务，常用于监控同一种 targets
      static_configs:
      - targets:                    # 可声明多个 targets 的地址
        - 10.0.0.1:9090
    ```

2. 重启 Prometheus 以重新加载配置文件，然后访问其 Web 页面。
   - 在 Status -> Targets 页面，可以看到所有监控对象及其状态。
   - 在 Graph 页面，执行一个查询表达式即可获得监控数据，比如 `go_goroutines` 。

### scrape_configs

- scrape_configs 的详细配置：
  ```yml
  scrape_configs:
  - job_name: prometheus
    # honor_labels: false
    # metrics_path: /metrics
    # follow_redirects: true          # 是否跟随状态码为 3xx 的重定向
    # scheme: http                    # 通信协议
    # scrape_interval: 30s
    # scrape_timeout: 10s
    # basic_auth:
    #   username: <string>
    #   password: <string>
    # proxy_url: <string>
    # tls_config:
    #   insecure_skip_verify: false   # 是否跳过认证 HTTPS 证书
    static_configs:
    - targets:                        # 一组监控对象的 IP:Port
      - 10.0.0.1:9090
      - 10.0.0.1:9091
      # labels:                       # 从 targets 采集 metrics 时，添加额外的标签
      #   nodename: CentOS-1
    - targets: ['10.0.0.2:9090']      # 第二组监控对象
    # relabel_configs:
    #  - <relabel_config>
    # metric_relabel_configs:
    #  - <relabel_config>

  - job_name: node_exporter
    file_sd_configs:                  # 从文件读取配置，这样修改配置时不必重启 Prometheus
    - files:
      - targets/node_exporter*.json   # 文件路径的最后一个字段可使用通配符 *
      # refresh_interval: 5m          # 每隔多久重新读取一次
  ```
- 通过 file_sd_configs 方式读取的文件可以是 YAML 或 JSON 格式，如下：
  ```yml
  - targets:
    - 10.0.0.1:9090
    labels:
      nodename: CentOS-1
  - targets:
    - 10.0.0.2:9090
    labels:
      nodename: CentOS-2
  ```
  ```json
  [{
      "targets": [
          "10.0.0.1:9100"
      ],
      "labels": {
          "nodename": "CentOS-1"
      }
  }, {
      "targets": [
          "10.0.0.2:9100"
      ],
      "labels": {
          "nodename": "CentOS-2"
      }
  }]
  ```
- Prometheus 会将采集到的 metrics 加工之后再保存。假设 targets 的原 metrics 如下：
  ```sh
  http_requests_total{code="200"} 162
  http_requests_total{code="500"} 0
  ```
  则 Prometheus 最终保存的 metrics 如下：
  ```sh
  # Prometheus 默认会为每个 metrics 添加 job: "$job_name"、instance: "$target" 两个标签
  http_requests_total{code="200", job="prometheus", instance="10.0.0.1:9090"} 162
  http_requests_total{code="500", job="prometheus", instance="10.0.0.1:9090"} 0

  # Prometheus 会为每个 targets 添加如下三个 metrics
  up{job="prometheus", instance="10.0.0.1:9090"} 1                          # 该监控对象是否在线。取值 1、0 分别代表在线、离线
  scrape_samples_scraped{job="prometheus", instance="10.0.0.1:9090"} 2      # 本次抓取的指标数
  scrape_duration_seconds{job="prometheus", instance="10.0.0.1:9090"} 0.01  # 本次抓取的耗时
  ```
  - 原 metrics 中的 label 如果以 __ 开头，则采集之后不会保存。
  - 用户可通过 static_configs[].labels 添加额外的标签。比如 instance 中的 IP 地址不方便记忆，可添加 nodename 标签。
  - 给 metrics 添加 label 时，如果原 metrics 中已存在同名的 label ，则根据 honor_labels 进行处理：
    - `honor_labels: false` ：默认值，将原 label 改名为 `exported_<label_name>` ，再添加新 label 。
    - `honor_labels: true` ：保留原 label 不变，不添加新 label 。
  - 用户可通过 relabel_configs 在采集之前修改 label ，通过 metric_relabel_configs 在采集之后修改 label 。例：
    ```sh
    metric_relabel_configs:
    - replacement: test
      target_label: project   # 添加一个 label ，名称为 project ，取值为 test
    - action: replace   # action 默认为 replace ，是将 source_labels 多个标签的值用 separator 拼接成一个字符串，然后正则匹配，生成字符串 replacement ，最后保存到 target_label
      source_labels: [<label>, ...]
      separator: ;
      regex: (.+)
      replacement: $1
      target_label: <label>
    - action: keep      # keep 动作：如果 source_labels 的值与 regex 完全正则匹配，则保留该 label ，否则不保留
      source_labels: [nodename]
      regex: .*test.*
    ```

### rules

- Prometheus 可配置两种规则：
  - Recording Rules ：用于将某个查询表达式的结果保存为新指标。这样可以避免在用户查询时才计算，减少开销。
  - Alerting Rules ：用于在满足某个条件时进行告警。（它只是产生警报，需要由 Alertmanager 加工之后转发给用户）
- 用户可在 prometheus.yml 中导入自定义的 rules.yml 文件，格式如下：
  ```yml
  groups:
  - name: recording_rules               # 规则组的名称
    # interval: 15s                     # 每隔多久执行一次该 rules
    rules:
    - record: go_goroutines:sum_by_job  # 定义一个新指标
      expr: sum(go_goroutines) by (job) # 查询表达式

  - name: alerting_rules                # 规则组的名称
    rules:
    - alert: 测试告警-1                  # 定义一个告警规则
      expr: go_goroutines > 100         # 设置告警条件。只要表达式的执行结果是矢量，就视作满足条件
      for: 5m                           # 如果持续满足告警条件 5 分钟，则触发告警
      # keep_firing_for: 1m             # Prometheus v2.42.0 增加的配置参数，表示触发告警之后，如果不再满足告警条件，则告警至少持续多久才能关闭。这样可以避免告警轰炸
      # labels:
      #   severity: error
      annotations:
        summary: "节点地址：{{$labels.instance}}, 协程数：{{$value}}"
  ```
  - 可以重复定义同样内容的 rules ，但最终输出时，多个重复的数据会合并为一个。
  - Prometheus 会在每次抓取指标时自动检查一次 Alerting Rules ，因此不需要设置 interval 。
  - 默认会将 expr 计算结果中的所有 label 添加到告警信息中。
    - 可以通过 labels 子句添加一些标签到告警信息中，但是如果与已有的 label 重名则不会生效。
    - 可以通过 annotations 子句添加一些标签作为注释。
    - 给这些标签赋值时允许引用变量（基于 Golang 的模板语法）。
  - 上例中，最终生成的警报包含以下信息：
    ```json
    {
        "status": "firing",
        "labels": {
            "alertname": "进程数归零",
            "instance":"10.0.0.1:9090",
            "job":"prometheus",
        },
        "annotations": {
            "summary":"节点地址：10.0.0.1:9090, 协程数：90",
        },
        "startsAt": "2020-07-09T01:23:22.627587301Z",
        "endsAt": "0001-01-01T00:00:00Z"
    }
    ```
- 当异常开始时，Prometheus 会产生 `"status": "firing"` 的警报。当异常结束时，还会产生 `"status": "resolved"` 的警报。
  - startsAt 参数表示警报的开始时间。根据 alerting_rules ，可能等 metrics 持续异常一段时间之后才产生警报。
  - resolved 类型的警报中，会增加一个 endsAt 参数。

- 在 Web 页面上可以看到 Alerting Rules 的状态：
  - 不满足告警条件时，属于 Inactive 状态。
  - 满足告警条件时，属于 Active 状态。
    - 如果不超过阙值时间，则属于 Pending 状态。
    - 如果超过阙值时间，则属于 Firing 状态。

- 可参考的告警规则：[awesome-prometheus-alerts](https://github.com/samber/awesome-prometheus-alerts)

## metrics

- Prometheus 采集的监控指标称为 metrics ，它是纯文本格式，每条数据是如下格式的字符串：
  ```sh
  <metric_name>{<label_name>=<label_value>, ...}     metric_value
  ```
  例如：
  ```sh
  go_goroutines{instance="10.0.0.1:9090", job="prometheus"}    80
  go_goroutines{instance="10.0.0.2:9090", job="prometheus"}    90
  ```
  - metric_name 必须匹配正则表达式 `[a-zA-Z_:][a-zA-Z0-9_:]*` ，一般通过 Recording Rules 定义的指标名称才包含冒号 : 。
  - 存在多条用途相同的监控数据时，可使用同一个 metric_name 、不同的标签（label），然后通过 labels 来筛选。
  - label_value 可包含 Unicode 字符。
  - 一个监控对象 exporter 可能输出多种名称的 metrics 。而每个 metrics 可能存在 labels 集合值不同的多个实例 samples ，又称为指标样本。

- Prometheus 采集 metrics 时，会进行以下处理：
  - exporter 输出的 metrics 没有时间戳，而 Prometheus 采集 metrics 时会自动记录当前的时间戳。而采集通常有几秒的延迟，因此记录的时间戳不是很准确。
  - 将 metric_name 记录到内置标签 `__name__` ，比如 `go_goroutines{instance="10.0.0.1:9090", job="prometheus"}` 会记录成 `{__name__="go_goroutines", instance="10.0.0.1:9090", job="prometheus"}` ，因此 samples 完全是通过 labels 来标识的。
  - 对于一条 sample ，比如 `go_goroutines{instance="10.0.0.1:9090", job="prometheus"}` ，在不同时刻采集一次，就得到了它在不同时刻的取值，组成一个时间序列（time series），可用于监控 sample 取值随时间变化的趋势。
  - 对每条 sample 的 labels 集合值计算哈希，然后将该哈希值记作 seriesId ，用作该 time series 在 TSDB 数据库的主键。
    - 新增一条 sample 时，如果它的 seriesId 在 TSDB 已存在，则添加到已有的 time series 。
    - 同一 seriesId 之下的各个 sample ，拥有相同的 labels 集合值，只能通过时间戳区分。
    - Prometheus 定义了一种数据结构 memSeries ，用于存储某个 seriesId 在一段时间范围内的全部 sample 数据。
    - seriesId 的数量称为基数。采集、查询时涉及的基数越大，则处理的 memSeries 越多，占用的 CPU、内存越多。
  - 从 labels 向 seriesId 建立倒排索引，因此根据 labels 查询 metrics 的速度很快。例如记录含有 `job="prometheus"` 标签的 seriesId 有 11、22、33 等。

- 根据用途的不同对 metrics 分类：
  - Counter
    - ：计数器，数值单调递增。
  - Gauge
    - ：仪表，数值可以任意加减变化。
  - Histogram
    - ：直方图。将时间平均分成一段段区间，将每段时间内的多个采样点取平均值再返回（由 Server 计算），相当于从散点图变成直方图。
    - 例如 `prometheus_http_request_duration_seconds_count{}  10` 表示 HTTP 请求的样本总数有 10 个。
    - 例如 `prometheus_http_request_duration_seconds_sum{}  0.1` 表示 HTTP 请求的耗时总和为 0.1s 。
    - 例如 `prometheus_http_request_duration_seconds_bucket{le="60"}  10` 表示 HTTP 请求中，耗时低于 60s 的有 10 个。
  - Summary
    - ：汇总。将所有采样点按数值从小到大排列，然后返回其中几个关键位置的采样点的值（由 exporter 计算），相当于正态分布图。
    - 例如 `..._count`、`..._sum` 后缀。
    - 例如 `http_request_duration_microseconds{handler="prometheus",quantile="0.5"}  3246.518` 表示 HTTP 请求中，排在 50% 位置处的耗时（即中位数）。
    - 例如 `http_request_duration_microseconds{handler="prometheus",quantile="0.9"}  3525.421` 表示 HTTP 请求中，排在 90% 位置处的耗时。
    - 例如  `http_request_duration_microseconds{handler="prometheus",quantile="0.99"}  3657.138` 表示 HTTP 请求中，排在 99% 位置处的耗时。
  - exemplar
    - ：在 metrics 之后附加 traceID 等信息，便于链路追踪。
    - 该功能默认禁用。

- 根据是否随时间变化对 metrics 分类：
  - 标量（scalar）
    - ：包含一个或一些散列的值。
  - 矢量（vector）
    - ：包含一系列随时间变化的值。
    - 一个矢量由 n≥1 个时间序列组成，显示成曲线图时有 n 条曲线，在每个时刻处最多有 n 个数据点（又称为元素），不过也可能缺少数据点（为空值）。

## PromQL

- Prometheus 提供了一种查询语言 PromQL ，用于编写查询 metrics 的表达式，还可进行加工计算。
  - 用户在 Graph 页面执行一个查询表达式之后，默认会将查询到的数据显示成表格（Table），用户也可以切换显示成曲线图（Graph）。
  - 显示曲线图的开销要大得多，可能导致 Web 页面卡顿。
  - 大部分标量都不支持显示成曲线图。

- 查询表达式中，选取指标的语法如下：
  ```sh
  go_goroutines                                   # 查询具有该名称的指标
  {job="prometheus"}                              # 查询具有指定标签值的指标
  {job!~'_.*', job!~'prometheus'}                 # 支持查询重复的指标名
  {__name__="go_goroutines", job='prometheus'}    # 通过内置标签 __name__ 可匹配指标名

  go_goroutines{job ="prometheus"}                # 查询该名称、该标签值的指标
  go_goroutines{job!="prometheus"}                # 要求具有 job 标签，且值不等于 prometheus
  go_goroutines{job =""}                          # 要求 job 标签的值为空字符串（这等价于不具有 job 标签）
  go_goroutines{job!=""}                          # 要求具有 job 标签且值不为空
  go_goroutines{job=~`prometheu\w`}               # 要求标签的值匹配正则表达式
  go_goroutines{job!~`prometheu\w`}               # 要求标签的值不匹配正则表达式

  go_goroutines{job="prometheus"}[1m]             # 查询 1 分钟以内的数据
  go_goroutines{job="prometheus"}[30m:1m]         # 查询 30 分钟以内、1 分钟以前的数据

  go_goroutines{job="prometheus"} offset 1m       # 相当于在 1 分钟之前查询
  sum(go_goroutines{job="prometheus"} offset 1m)  # 使用函数时，offset 符号要放在函数括号内
  ```
  - 用 # 声明单行注释。
  - 将字符串用反引号包住时，不会让反斜杠转义。
  - 查询表达式不能为空的 `{}` ，同理也不能使用 `{__name__=~".*"}` 选中所有指标。

- 可以使用以下时间单位：
  - s ：秒
  - m ：分钟
  - h ：小时
  - d ：天
  - w ：周
  - y ：年

### 运算符

- 运算符的优先级从高到低如下，同一优先级的采用左结合性：
  ```sh
  ^
  * /  %
  + -
  == != <= < >= >
  and unless
  or
  ```

- 可以进行如下算术运算：
  ```sh
  go_goroutines + 1   # 加
  1 - 2               # 减
  1 * 2               # 乘
  1 / 3               # 除法（小数点后会保留十多位）
  1 % 3               # 取模
  2 ^ 3               # 取幂
  ```
  - 只能对指标的值进行运算，不能对标签的值进行运算。
  - 关于 0 的除法运算：
    ```sh
    0 / 任意正数    # 结果为 0
    0 / 任意负数    # 结果为 -0
    0 / 0          # 结果为 NaN
    任意正数 / 0    # 结果为 +Inf
    任意负数 / 0    # 结果为 -Inf
    ```
    - 对于特殊值，可以用 expression > 0 等方式过滤掉。

- 可以进行如下比较运算：
  ```sh
  go_goroutines == 2
  go_goroutines != 2
  go_goroutines >  2  # 返回大于 2 的部分曲线
  go_goroutines <  2
  go_goroutines >= 2
  go_goroutines <= 2
  ```
  - 比较运算默认是过滤掉不符合条件的数据。
  - 如果在比较运算符之后加上关键字 bool ，比如 `1 == bool 2` ，就会返回比较运算的结果，用 1、0 分别表示 true、flase 。

- 矢量之间可以进行如下集合运算：
  ```sh
  go_goroutines{job='prometheus'} and     go_goroutines                     # 交集（返回两个矢量中标签列表相同的时间序列，取第一个矢量中的值）
  go_goroutines{job='prometheus'} or      go_goroutines{job='prometheus'}   # 并集（将两个矢量中的所有时间序列合并，如果存在标签列表重复的时间序列，则取第一个矢量中的值）
  go_goroutines{job='prometheus'} unless  go_goroutines{job!='prometheus'}  # 补集（返回在第一个矢量中存在、但在第二个矢量中不存在的时间序列）
  ```

- 矢量之间进行运算时，默认只会对两个矢量中标签列表相同的时间序列（即标签名、标签值完全相同）进行运算。如下：
  ```sh
  go_goroutines - go_goroutines
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines                            # 两个矢量中存在匹配的时间序列，可以进行运算
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines{instance="10.0.0.2:9100"}  # 两个矢量中不存在匹配的时间序列，因此运算结果为空
  go_goroutines{instance="10.0.0.1:9100"} - go_gc_duration_seconds_sum{instance="10.0.0.1:9100"}  # 指标名不同，但标签列表相同，依然可以运算
  ```
  可以按以下格式，将两个只有部分标签匹配的时间序列进行运算：
  ```sh
  go_goroutines{instance="10.0.0.1:9100"} - on(job) go_goroutines{instance="10.0.0.2:9100"}             # 只考虑 job 标签，则能找到匹配的时间序列
  go_goroutines{instance="10.0.0.1:9100"} - ignoring(instance) go_goroutines{instance="10.0.0.2:9100"}  # 忽略 instance 标签，则能找到匹配的时间序列
  go_goroutines{instance="10.0.0.1:9100"} and on() hour() == 8                                          # 只获取 8 点时的时间序列
  ```
  以上只是对时间序列进行一对一匹配，可以按下格式进行一对多的匹配：
  ```sh
  go_goroutines - on() group_left vector(1)       # 不考虑任何标签，用右边的一个时间序列匹配左边的多个时间序列，分别进行运算，相当于 go_goroutines - 1
  vector(1)     + on() group_right go_goroutines  # group_right 表示用左边的一个时间序列匹配右边的多个时间序列，group_left 则相反
  ```

### 函数

- 矢量与标量的转换：
  ```sh
  vector(1)                 # 输入标量，返回一个矢量
  scalar(vector(1))         # 输入一个单时间序列的矢量，以标量的形式返回当前时刻处的值
  ```

- 关于时间：
  ```sh
  time()                    # 返回当前的 Unix 时间戳（标量），单位为秒
  timestamp(vector(1))      # 返回矢量中每个数据点的时间戳（矢量）

  # 以下函数用于获取某个时间信息（注意为 UTC 时区）。可以输入一个时间矢量，不输入时默认采用当前时间，比如 hour( timestamp(vector(1)) )
  minute([vector])          # 分钟，取值为 0~59
  hour  ([vector])          # 小时，取值为 0~23
  month ([vector])          # 月份，取值为 1~31
  year  ([vector])          # 年份
  day_of_month([vector])    # 该月中的日期，取值为 1~31
  day_of_week ([vector])    # 周几，取值为 0~6 ，其中 0 表示周日
  ```
  例：
  ```sh
  hour() == 16 and minute() < 5   # 仅在 UTC+8 时区每天的前 5 分钟，表达式结果不为空，采取第一段的值，即 16
  ```

- 关于排序：
  ```sh
  sort(go_goroutines)       # 按指标值升序排列
  sort_desc(go_goroutines)  # 按指标值降序排列
  ```
  - 在 Prometheus 的 Table 视图中，显示的指标默认是无序的，只能通过 sort() 函数按指标值排序。不支持按 label 进行排序。
  - 在 Graph 视图中，显示的图例是按第一个标签的值进行排序的，且不受 sort() 函数影响。

- 修改矢量的标签：
  ```sh
  label_join(go_goroutines, "new_label", ",", "instance", "job")               # 给矢量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance、job 标签的值的组合，用 , 分隔
  label_replace(go_goroutines, "new_label", "$1-$2", "instance", "(.*):(.*)")  # 正则匹配。给矢量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance 标签的值的正则匹配的结果
  ```
  - 如果 new_label 与已有标签同名，则会覆盖它。

#### 算术函数

- 矢量可以使用以下算术函数：
  ```sh
  abs(go_goroutines)                    # 返回每个时刻处，数据点的绝对值
  round(go_goroutines)                  # 返回每个时刻处，数据点四舍五入之后的整数值
  absent(go_goroutines)                 # 在每个时刻处，如果矢量为空（不存在任何数据点），则返回 1 ，否则返回空值
  absent_over_time(go_goroutines[1m])   # 在每个时刻处，如果过去 1m 以内矢量一直为空，则返回 1 ，否则返回空值
  changes(go_goroutines[1m])            # 返回每个时刻处，最近 1m 以内数值变化的次数
  resets(go_goroutines[1m])             # 返回每个时刻处，过去 1m 以内数值减少的次数

  delta(go_goroutines[1m])              # 返回每个时刻处，该数据点减去 1m 之前数据点的差值（可能为负），适合计算变化量
  idelta(go_goroutines[1m])             # 返回每个时刻处，过去 1m 以内最后两个数据点的差值（可能为负）
  deriv(go_goroutines[1m])              # 通过简单线性回归，计算每秒的导数（可能为负）

  # 以下算术函数只适用于 Counter 类型，即单调递增的矢量
  rate(go_goroutines[1m])               # 返回每个时刻处，过去 1m 以内的每秒平均增量（时间间隔越长，曲线越平缓）
  irate(go_goroutines[1m])              # 返回每个时刻处，过去 1m 以内最后两个数据点之间的每秒平均增量（不会为负）
  increase(go_goroutines[1m])           # 返回每个时刻处，过去 1m 以内的数值增量（不会为负）
  ```
  - 使用函数时，时间间隔 `[t]` 至少应该是 scrape_interval 的两倍，否则容易缺少采样点，导致计算结果为空。
  - 例：正常情况下 node_time_seconds 的值是每秒加 1 ，因此：
    - `delta(node_time_seconds[1m])` 计算结果的每个数据点的值都是 60 。
    - `rate(node_time_seconds[1m])` 每个点的值都是 1 。
    - `irate(node_time_seconds[xx])` 每个点的值也都是 1 。
    - 如果 scrape_interval 为 30s ，则 `idelta(node_time_seconds[xx])` 每个点的值都是 30 。
  - increase() 实际上是 rate() 乘以时间间隔的语法糖。
    - 如果矢量为 Counter 类型，即单调递增，
      - 则 increase() 与 delta() 的计算结果几乎相同，但可能存在轻微的误差，因为要先计算 rate() 。
    - 如果矢量先增加，然后减少，
      - 则 delta() 的计算结果可能为负，可以只取 >= 0 部分的值。
      - 而 rate() 只会计算出第一段单调递增部分的增长率 k ，然后认为该矢量在 t 时间内的增量等于 k × t ，最终得到的 increase() 值比 delta() 大。因此 rate() 只适合计算 Counter 类型的矢量。
      - Counter 类型的矢量不能保证总是单调递增，比如服务重启时会重新计算，称为计数器重置。因此 rate() 计算 Counter 类型的矢量时，也可能出错。
    - 综上，计算增量时，使用 delta() 比 increase() 更好。
  - 关于 idelta()、irate() ：
    - 应该尽量使用大一些的时间间隔，因为时间间隔过大时不影响计算精度，但时间间隔过小时可能缺少数据点。
    - 曲线比 delta()、rate() 更尖锐，更接近瞬时值。但是只考虑到最近的两个数据点，更容易产生误差。

#### 聚合函数

- 如果矢量包含多个时间序列，用算术函数会分别对这些时间序列进行运算，而用聚合函数会将它们合并成一个或多个时间序列。
- 矢量可以使用以下聚合函数：
  ```sh
  # 基本统计
  count(go_goroutines)                  # 返回每个时刻处，该矢量的数据点的数量（即包含几个时间序列）
  count_values("value", go_goroutines)  # 返回每个时刻处，各种值的数据点的数量，并按 {value="x"} 的命名格式生成多个时间序列
  sum(go_goroutines)                    # 返回每个时刻处，所有数据点的总和（即将曲线图中所有曲线叠加为一条曲线）
  min(go_goroutines)                    # 返回每个时刻处，数据点的最小值
  max(go_goroutines)                    # 返回每个时刻处，数据点的最大值
  avg(go_goroutines)                    # 返回每个时刻处，数据点的平均值

  # 高级统计
  stddev(go_goroutines)                 # 返回每个时刻处，数据点之间的标准差
  stdvar(go_goroutines)                 # 返回每个时刻处，数据点之间的方差
  topk(3, go_goroutines)                # 返回每个时刻处，最大的 3 个数据点
  bottomk(3, go_goroutines)             # 返回每个时刻处，最小的 3 个数据点
  quantile(0.5, go_goroutines)          # 返回每个时刻处，大小排在 50% 位置处的数据点

  # 修改数据点的值
  last_over_time(go_goroutines[1m])     # 返回每个时刻处，过去 1m 内最新数据点的值
  group(go_goroutines)                  # 将每个数据点的取值置为 1
  sgn(go_goroutines)                    # 判断每个数据点取值的正负。如果为正数、负数、0 ，则分别置为 1、-1、0
  clamp(go_goroutines, 0, 10)           # 限制每个数据点取值的最小值、最大值，语法为 clamp(vector, min, max)
  clamp_min(go_goroutines, 0)           # 限制最小值
  clamp_max(go_goroutines, 10)          # 限制最大值
  ```
  - 聚合函数默认不支持输入有限时间范围内的矢量，需要使用带 `_over_time` 后缀的函数，如下：
    ```sh
    sum_over_time(go_goroutines[1m])    # 返回每个时刻处，过去 1m 内数据点的总和（分别计算每个时间序列）
    avg_over_time(go_goroutines[1m])    # 返回每个时刻处，过去 1m 内的平均值
    ```
  - 聚合函数可以与关键字 by、without 组合使用，如下：
    ```sh
    sum(go_goroutines) by(job)          # 将所有曲线按 job 标签的值分组，分别执行 sum() 函数
    sum(go_goroutines) without(job)     # 将所有曲线按除了 job 以外的标签分组，分别执行 sum() 函数
    sum(go_goroutines) by(Time)         # Time 是隐式 label ，这里相当于 sum(go_goroutines)
    ```

## HTTP API

- 用于管理 Prometheus 的 HTTP API ：
  ```sh
  GET   /-/healthy  # 用于健康检查，总是返回 Code 200
  GET   /-/ready    # 返回 Code 200 则代表可以处理 HTTP 请求
  POST  /-/reload   # 重新加载配置文件
  POST  /-/quit     # 终止
  ```

- 关于数据的 API ：
  ```sh
  GET   /api/v1/query?query=go_goroutines{instance='10.0.0.1:9090'}&time=1589241600               # 查询 query 表达式在指定时刻的值。如果不指定时刻，则采用当前时刻
  GET   /api/v1/query_range?query=go_goroutines{instance='10.0.0.1:9090'}&start=1589241600&end=1589266000&step=1m  # 查询一段时间内的所有值
  POST  /api/v1/admin/tsdb/delete_series?match[]=go_goroutines&start=1589241600&end=1589266000    # 删除数据。如果不指定时间，则删除所有时间的数据
  POST  /api/v1/admin/tsdb/clean_tombstones                                                       # 让 TSDB 立即释放被删除数据的磁盘空间
  ```
