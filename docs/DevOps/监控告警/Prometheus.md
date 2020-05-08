# Prometheus

：一个目前流行的监控系统，基于 Golang 开发。
- 源于 Google Borg 系统的监控系统，2016 年作为一个独立项目交给 CNCF 托管。
- 擅长从大量节点上采集指标数据，且提供了 Web 管理页面。
- 与 Zabbix 相比，更轻量级、可扩展性更高，而且特别适合监控容器。
- 建议先用 Prometheus 采集指标数据，再把数据交给 Grafana 显示监控页面。
- [官方文档](https://prometheus.io/docs/introduction/overview/)

## 安装

- 下载二进制版然后运行：
    ```sh
    wget https://github.com/prometheus/prometheus/releases/download/v2.17.2/prometheus-2.17.2.linux-amd64.tar.gz
    tar -zxvf prometheus-2.17.2.linux-amd64.tar.gz
    cd prometheus-2.17.2.linux-amd64/
    ./prometheus --config.file /etc/prometheus/prometheus.yml
    ```

- 或者运行 Docker 镜像：
    ```sh
    docker run -d --name prometheus -p 9090:9090 \
            -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \    # 挂载配置文件（可选项）
            prom/prometheus
    ```

## 示例

以下是用 Prometheus 监控自身的步骤：
1. 在 Prometheus 的配置文件中加入监控任务：
    ```yaml
    global:
      scrape_interval: 10s          # 每隔多久采集一次指标（这是全局值，可以被局部值覆盖）
      scrape_timeout: 10s           # 每次采集的超时时间
      evaluation_interval: 10s      # 每隔多久执行一次 rules
      # external_labels:            # 与 Alertmanager 等外部组件通信时，加上这些标签
      #   monitor: 'codelab-monitor'

    # rule_files:                   # 导入 rule 文件
    #   - "rules_1.yml"

    scrape_configs:
      - job_name: 'prometheus'      # 一项监控任务的名字
        # metrics_path: /metrics
        # scheme: http
        # scrape_interval: 1s
        # scrape_timeout: 1s
        static_configs:
          - targets: 
            - '10.0.0.1:9090'       # 监控对象的 URL
    ```

2. 重启 Prometheus ，访问其 Web 页面。
   在 Status -> Targets 页面，可以看到所有监控对象及其状态。
   在 Graph 页面，执行一个查询表达式即可获得监控数据，比如 `go_goroutines` 。

## 架构

- 用户需要在每个被监控对象的主机上运行一个 exporter 进程，当用户访问该主机的 `http://localhost:9090/metrics` 时，就会触发 exporter 采集一次指标数据，放在 HTTP 响应报文中回复给用户。
  - exporter 一般只负责采集当前时刻的指标数据，不负责存储数据。
  - [官方的 exporter 列表](https://prometheus.io/docs/instrumenting/exporters/) 主流软件都提供了自己的 exporter 程序，例如：mysql_exporter、redis_exporter 。有的软件甚至提供了 exporter 风格的 API ，可以直接访问。

- Prometheus Server 会定时向各个 exporter 发出 HTTP 请求，获得指标数据，并存储到自己的时序数据库中。
  - 它属于离散采样，可能有遗漏、有延迟、有误差。
  - 数据默认保存在 `${prometheus}/data` 目录下，最多保存 15 天。目录结构如下：
    ```
    data/
    ├── 01E728KFZWGDM7HMY6M2D26QJD/   # 每隔两个小时就创建一个随机名字的子目录来存储数据
    │   ├── chunks
    │   │   └── 000001                # 数据保存为二进制文件
    │   ├── index
    │   ├── meta.json
    │   └── tombstones
    ├── 01BKGTZQ1HHWHV8FBJXW1Y3W0K/
    ├── lock
    ├── queries.active
    └── wal/                          # 临时保存最新一段时间的数据
        ├──00000003
        └──checkpoint.000002/
    ```

- Prometheus 本身没有权限限制，不需要密码登录。

## 指标

- 每条指标数据是如下格式的字符串：
    ```
    <metric_name>{<label_name>=<label_value>, ...}     metric_value
    ```
  例如：
    ```
    go_goroutines{instance="10.0.0.1:9090", job="prometheus"}    80
    ```
  - metric_name 必须匹配正则表达式`[a-zA-Z_:][a-zA-Z0-9_:]*`，一般通过 Recording Rules 定义的指标名称才包含冒号 : 。
  - label 是对 metric_name 的补充，方便筛选指标。
  - label_value 可以包含 Unicode 字符。

- 根据用途的不同对指标分类：
  - Counter ：计数器，数值单调递增。
  - Gauge ：仪表，数值可以任意加减变化。
  - Histogram ：直方图。将时间平均分成一段段区间，将每段时间内的多个采样点取平均值再返回（由 Server 计算），相当于从散点图变成直方图。例如：
    - `prometheus_http_request_duration_seconds_count{}  10` 表示 HTTP 请求的样本总数有 10 个。
    - `prometheus_http_request_duration_seconds_sum{}  1.103` 表示 HTTP 请求的耗时总和为 10s 。
    - `prometheus_http_request_duration_seconds_bucket{le="60"}  10` 表示 HTTP 请求中，耗时低于 60s 的有 10 个。
  - Summary ：汇总。将所有采样点按数值从小到大排列，然后返回其中几个关键位置的采样点的值（由 exporter 计算），相当于正态分布图。例如：
    - `..._count`
    - `..._sum`
    - `http_request_duration_microseconds{handler="prometheus",quantile="0.5"}  3246.518` 表示 HTTP 请求中，排在 50% 位置处的耗时（即中位数）。
    - `http_request_duration_microseconds{handler="prometheus",quantile="0.9"}  3525.421` 表示 HTTP 请求中，排在 90% 位置处的耗时。
    - `http_request_duration_microseconds{handler="prometheus",quantile="0.99"}  3657.138` 表示 HTTP 请求中，排在 99% 位置处的耗时。

- 根据是否随时间变化对指标分类：
  - 标量（scalar）：包含一个或一些散列的值。
  - 矢量（vector）：包含一系列随时间变化的值。

## 查询

- Prometheus 提供了一种查询语言 PromQL ，使得用户可以通过一个查询表达式，就查询到指标数据，还可以进行加工计算。
  - 用户在 Graph 页面执行一个查询表达式之后，默认会将查询到的数据显示成表格（Table），用户也可以切换显示成曲线图（Graph）。
  - 显示曲线图的开销要大得多，可能会导致 Web 页面卡顿。
  - 大部分标量都不支持显示成曲线图。

- 查询表达式中，选取指标的语法如下：
  ```sql
  go_goroutines                                   # 查询具有该名称的指标
  {job="prometheus"}                              # 查询具有该标签值的指标
  go_goroutines{job="prometheus"}                 # 查询该名称、该标签值的指标
  go_goroutines{job!="prometheus"}                # 要求不具有该标签值
  go_goroutines{job=~`prometheu\w`}               # 要求标签的值匹配正则表达式
  go_goroutines{job!~`prometheu\w`}               # 要求标签的值不匹配正则表达式
  {__name__="go_goroutines", job=~`.*`}           # 通过内置的 __name__ 标签，可以匹配指标名

  go_goroutines{job="prometheus"}[5m]             # 查询 5 分钟以内的数据
  go_goroutines{job="prometheus"}[30m:5m]         # 查询 30 分钟以内、5 分钟以前的数据

  go_goroutines{job="prometheus"} offset 5m       # 相当于在 5 分钟之前查询
  sum(go_goroutines{job="prometheus"} offset 5m)  # 使用函数时，offset 符号要放在函数括号内
  ```
  - 可以用 # 声明单行注释。
  - 将字符串用反引号包住时，不会让反斜杠转义。

- 可以使用以下时间单位：
  - s ：秒
  - m ：分钟
  - h ：小时
  - d ：天
  - w ：周
  - y ：年

- 可以进行如下算术运算：
  ```sql
  go_goroutines + 1   # 加
  1 - 2               # 减
  1 * 2               # 乘
  1 / 3               # 除法（小数点后会保留十多位）
  1 % 3               # 取模
  2 ^ 3               # 取幂
  ```
  - 只能对查询到的数据的值进行运算，不能对标签的值进行运算。

- 可以进行如下比较运算：
  ```sql
  go_goroutines == 2
  go_goroutines != 2
  go_goroutines > 2
  go_goroutines < 2
  go_goroutines >= 2
  go_goroutines <= 2
  ```
  - 比较运算默认是过滤掉不符合条件的数据。
  - 如果在比较运算符之后加上关键字 bool ，比如 `1 == bool 2` ，就会返回比较运算的结果，用 1、0 分别表示 true、flase 。

- 矢量之间可以进行如下集合运算：
  ```sql
  vector1 and vector2     # 交集
  vector1 or vector2      # 并集
  vector1 unless vector2  # 补集，即在 vector1 中存在、在 vector2 中不存在的数据点
  ```

- 矢量可以使用以下聚合函数：
  ```sql
  sum(go_goroutines)                    # 计算每个时刻处，全部矢量的数据点的总和（相当于将所有曲线叠加为一条曲线）
  min(go_goroutines)                    # 计算每个时刻处，全部矢量的数据点中的最小值
  max(go_goroutines)                    # 计算每个时刻处，全部矢量的数据点中的最大值
  avg(go_goroutines)                    # 计算每个时刻处，全部矢量的数据点的平均值
  stdvar(go_goroutines)                 # 计算每个时刻处，全部矢量的数据点之间的标准方差
  count (go_goroutines)                 # 计算每个时刻处，全部矢量中数据点的数量
  count_values("value", go_goroutines)  # 计算每个时刻处，全部矢量中各种值的数据点的数量，新曲线的命名格式为{value="xx"}
  topk(3, go_goroutines)                # 计算每个时刻处，全部矢量中最大的 3 个数据点
  bottomk(3, go_goroutines)             # 计算每个时刻处，全部矢量中最小的 3 个数据点
  quantile(0.5, go_goroutines)          # 计算每个时刻处，全部矢量中排在 50% 位置处的数据点
  ```
  聚合函数可以与关键字 by、without 组合使用，如下：
  ```sql
  sum(go_goroutines) by(job)            # 将所有曲线按 job 标签的值分组，分别执行 sum() 函数
  sum(go_goroutines) without(job)       # 将所有曲线按除了 job 以外的标签分组，分别执行 sum() 函数
  ```
  聚合函数默认不支持输入有限时间范围内的矢量，需要使用带 _over_time 后缀的函数，如下：
  ```sql
  sum_over_time(go_goroutines[10s])     # 在每个时刻处，计算过去 5 分钟之内数据点的总和
  ```

- 矢量可以使用以下算术函数：
  ```sql
  abs(go_goroutines)                    # 在每个时刻处，将数据点的值转换为绝对值
  round(go_goroutines)                  # 在每个时刻处，计算数据点四舍五入后的整数值
  absent(go_goroutines)                 # 在每个时刻处，如果不存在数据点则返回 1 ，否则返回空值
  absent_over_time(go_goroutines[5m])   # 在每个时刻处，如果过去 5 分钟以内不存在数据点则返回 1 ，否则返回空值
  changes(go_goroutines[5m])            # 在每个时刻处，计算过去 5 分钟以内数据点变化的次数
  delta(go_goroutines[5m])              # 在每个时刻处，计算该数据点减去 5 分钟之前数据点的差值（可能为负）
  idelta(go_goroutines[5m])             # 在每个时刻处，计算过去 5 分钟以内最后两个数据点的差值（可能为负）
  vector(1)                             # 返回一个矢量
  ```
  以下算数函数适用于计数器类型的矢量：
  ```sql
  resets(go_goroutines[5m])             # 在每个时刻处，计算过去 5 分钟以内计数器重置（即数值减少）的次数
  increase(go_goroutines[5m])           # 在每个时刻处，计算过去 5 分钟以内的数值增量
  rate(go_goroutines[5m])               # 在每个时刻处，计算过去 5 分钟以内平均的数值增长率
  irate(go_goroutines[5m])              # 在每个时刻处，计算过去 5 分钟以内，最后两个数据点的增长率（结果曲线比 rate() 尖锐）
  ```

## Rules

- 用户可以导入自己定义的 rule 文件，在其中定义规则。
- 规则分为两类：
  - Recording Rules ：用于将某个查询表达式的结果保存为新指标。这样可以避免在用户查询时才计算，减少开销。
  - Alerting Rules ：用于在满足某个条件时进行告警。
- 下例是一个 rules.yml 文件的内容：
  ```yaml
  groups:
  - name: recording_rules               # 规则组的名称
    # interval: 10s                     # 每隔多久执行一次该 rules
    rules:
    - record: sum:job:go_goroutines     # 定义一个新指标
      expr: sum(go_goroutines) by (job) # 查询表达式

  - name: alerting_rules                # 规则组的名称
    rules:
    - alert: Go协程数太多                # 定义一个告警规则
      expr: go_goroutines > 100         # 设置告警条件（只要表达式的执行结果是矢量，就会报警）
      for: 5m                           # 连续满足条件 5 分钟之后才告警
      # labels:
      #   severity: small
      annotations:
        summary: "节点地址：{{$labels.instance}}"
  ```
  - 用户可以通过 labels、annotations 子句添加一些标签到告警信息中，并且这些标签的值中允许引用变量（基于 Golang 的模板语法）。

- 在 Web 页面上可以看到 Alerting Rules 的状态：
  - 不满足告警条件时，标为 Inactive 状态。
  - 满足告警条件但不超过阙值时间时，标为 Pending 状态。
  - 满足告警条件且超过阙值时间时，标为 Firing 状态。

## 分布式

Prometheus 支持抓取其它 Prometheus 的数据，因此可以分布式部署。
- 只能抓取当前时刻的指标数据，就像抓取 exporter 。
- 在配置文件中按如下格式定义一个 job ，即可抓取其它 Prometheus 的数据：
    ```yaml
    scrape_configs:
      - job_name: 'federate'
        honor_labels: true              # 保护当前 Prometheus 的标签不被覆盖
        metrics_path: '/federate'
        params:
          'match[]':                    # 抓取匹配这些表达式的指标
            - '{__name__=~"go_.*"}'
            - 'go_goroutines'
        static_configs:
          - targets:                    # 目标 Prometheus 的地址
            - '10.0.0.2:9090'
            - '10.0.0.3:9090'
    ```

## 插件

- Alertmanager ：用于提供告警功能。
- Push Gateway ：允许 exporter 主动推送数据到这里，相当于一个缓存，会被 Prometheus 定时拉取。

### node_exporter

：用于监控主机的一般状态。
- [GitHub 页面](https://github.com/prometheus/node_exporter)

，，，







### process-exporter

：用于监控进程的一般状态。
- [GitHub 页面](https://github.com/ncabatoff/process-exporter)
- 下载二进制版然后运行：
    ```
    wget https://github.com/ncabatoff/process-exporter/releases/download/v0.6.0/process-exporter-0.6.0.linux-amd64.tar.gz
    tar -zxvf process-exporter-0.6.0.linux-amd64.tar.gz
    cd process-exporter-0.6.0.linux-amd64/
    ./process-exporter --config.path exporter.yml
    ```
    默认的访问地址是 <http://localhost:9256/metrics>

- 在配置文件中定义要监控的进程：
    ```yaml
    process_names:
      - exe:                          # exe 是根据进程的可执行文件的名称（即 argv[0]）进行匹配
        - top                         # 可以定义多行 exe 条件，每个条件可能匹配零个、一个或多个进程
        - /bin/ping

      - name: "{{.ExeBase}}"          # 定义一个要匹配的进程（该 name 会用作监控指标的 groupname，这里使用可执行文件的基本名作为 name ）
        cmdline:                      # cmdline 是基于正则匹配（此时只能定义一行条件）
        - prometheus --config.file

      - name: "{{.Matches.name}}"     # 定义一个要匹配的进程（这里使用正则匹配的元素组作为 name ）
        cmdline:                      # cmdline 是基于正则匹配
        - ping www.(?P<name>.*).com   # 用 ?P<name> 的格式命名正则匹配的元素组
    ```
    - 已经被匹配的进程不会被之后的条件重复匹配。
    - 如果进程 A 的数量变为 0 ，process-exporter 也会一直记录。但如果重启 process-exporter ，就只会发现此时存在的进程，不会再记录进程 A 。

- 常用指标：
  - process_cpu_seconds_total ：进程占用的 CPU 时长。
  - process_virtual_memory_bytes ：进程申请的虚拟内存大小。
  - process_resident_memory_bytes ：进程实际使用的内存大小。
  - namedprocess_namegroup_states ：进程的状态。
  - namedprocess_namegroup_num_procs ：（各个条件匹配的）进程数。
  - namedprocess_namegroup_num_threads ：（各个进程下的）线程数。


### mysqld_exporter

，，，

