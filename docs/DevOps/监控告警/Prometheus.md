# Prometheus

：一个目前流行的监控系统，基于 Golang 开发。
- 源于 Google Borg 系统的监控系统，2016 年作为一个独立项目交给 CNCF 托管。
- 擅长从大量节点上采集指标数据，且提供了 Web 管理页面。
- [官方文档](https://prometheus.io/docs/introduction/overview/)
- 对比：
  - Zabbix 只擅长监控主机，而且配置比较繁琐。
  - Prometheus 可监控主机、进程、容器等多种对象,可扩展性高，而且自带查询语言，配置比较灵活。

## 安装

- 下载二进制版：
  ```sh
  wget https://github.com/prometheus/prometheus/releases/download/v2.17.2/prometheus-2.17.2.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  ./prometheus
              --config.file /etc/prometheus/prometheus.yml   # 使用指定的配置文件
              --storage.tsdb.retention 15d                   # TSDB 保存数据的最长时间（默认为 15 天）
              --web.enable-admin-api                         # 启用管理员的 HTTP API
              --web.enable-lifecycle                         # 启用关于终止的 HTTP API 
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
      - job_name: 'prometheus'
        static_configs:
          - targets: ['10.0.0.1:9090']
    ```

2. 重启 Prometheus 以重新加载配置文件，然后访问其 Web 页面。
   - 在 Status -> Targets 页面，可以看到所有监控对象及其状态。
   - 在 Graph 页面，执行一个查询表达式即可获得监控数据，比如 `go_goroutines` 。

## 架构

- 用户需要在每个被监控对象的主机上运行一个特定的 HTTP 服务器作为 exporter ，当用户访问该主机的 `http://localhost:9090/metrics` 时，就会触发 exporter 采集一次指标数据，放在 HTTP 响应报文中回复给用户。
  - exporter 一般只负责采集当前时刻的指标数据，不负责存储数据。

- Prometheus Server 会定时向各个 exporter 发出 HTTP 请求，获得指标数据，并存储到自己的时序数据库中。
  - 它属于离散采样，可能有遗漏、有延迟、有误差。
  - 数据默认保存在 `${prometheus}/data` 目录下，目录结构如下：
    ```
    data/
    ├── 01E728KFZWGDM7HMY6M2D26QJD/   # 一个 block 目录
    │   ├── chunks
    │   │   └── 000001                # 压缩后的数据，是二进制文件
    │   ├── index
    │   ├── meta.json
    │   └── tombstones
    ├── 01BKGTZQ1HHWHV8FBJXW1Y3W0K/
    ├── lock
    ├── queries.active
    └── wal/
        ├──00000003
        └──checkpoint.000002/
    ```
  - 最新获得的数据尚未写入 tsdb ，会暂时保存在 wal/ 目录下，等待保存为 chunks 。
  - 每隔两个小时就会创建一个随机名字的 block 目录，将数据经过压缩之后保存到其中的 chunks 目录下。
    一段时间后这些 block 目录还会进一步压缩、合并。

- Prometheus 本身没有权限限制，不需要密码登录，不过可以用 Nginx 加上 HTTP Basic Auth 。
- Prometheus 的图表功能很少，建议将它的数据交给 Grafana 显示。

## 监控对象

用户必须在 Prometheus 的配置文件中描述需要监控的对象，格式如下：
```yaml
scrape_configs:
  - job_name: 'prometheus'            # 一项监控任务的名字（可以包含多组监控对象）
    # metrics_path: /metrics
    # scheme: http
    # scrape_interval: 1s
    # scrape_timeout: 1s
    static_configs:
      - targets:                      # 一组监控对象的 IP:Port
        - '10.0.0.1:9090'
        - '10.0.0.1:9091'
        # labels:                     # 为这些监控对象的数据加上额外的标签
        #   nodename: 'CentOS-1'
      - targets: ['10.0.0.2:9090']    # 下一组监控对象
  
  - job_name: 'node_exporter'
    file_sd_configs:                  # 从文件读取配置（这样不必让 Prometheus 重新加载配置文件）
    - files:
      - targets/node_exporter*.json
      refresh_interval: 1m            # 每隔 1m 重新读取一次
```
- Prometheus 从各个监控对象处抓取指标数据时，默认会加上 `job: "$job_name"`、`instance: "$targets"` 两个标签。
- 考虑到监控对象的 IP 地址不方便记忆，而且可能变化，所以应该添加 nodename 等额外的标签便于筛选。
- 通过 file_sd_configs 方式读取的文件格式如下：
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
    - 一个矢量由 n≥1 个时间序列组成，显示成曲线图时有 n 条曲线，在每个时刻处最多有 n 个数据点（又称为元素），不过也可能缺少数据点（为空值）。

## 查询

- Prometheus 提供了一种查询语言 PromQL ，使得用户可以通过一个查询表达式，就查询到指标数据，还可以进行加工计算。
  - 用户在 Graph 页面执行一个查询表达式之后，默认会将查询到的数据显示成表格（Table），用户也可以切换显示成曲线图（Graph）。
  - 显示曲线图的开销要大得多，可能会导致 Web 页面卡顿。
  - 大部分标量都不支持显示成曲线图。

- 查询表达式中，选取指标的语法如下：
  ```sh
  go_goroutines                                   # 查询具有该名称的指标
  {job="prometheus"}                              # 查询具有该标签值的指标
  {__name__="go_goroutines", job='prometheus'}    # 通过内置的 __name__ 标签，可以匹配指标名

  go_goroutines{job="prometheus"}                 # 查询该名称、该标签值的指标
  go_goroutines{job!="prometheus"}                # 要求不具有该标签值
  go_goroutines{job=~`prometheu\w`}               # 要求标签的值匹配正则表达式
  go_goroutines{job!~`prometheu\w`}               # 要求标签的值不匹配正则表达式

  go_goroutines{job="prometheus"}[5m]             # 查询 5 分钟以内的数据
  go_goroutines{job="prometheus"}[30m:5m]         # 查询 30 分钟以内、5 分钟以前的数据

  go_goroutines{job="prometheus"} offset 5m       # 相当于在 5 分钟之前查询
  sum(go_goroutines{job="prometheus"} offset 5m   # 使用函数时，offset 符号要放在函数括号内
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

### 运算符

- 可以进行如下算术运算：
  ```sh
  go_goroutines + 1   # 加
  1 - 2               # 减
  1 * 2               # 乘
  1 / 3               # 除法（小数点后会保留十多位）
  1 % 3               # 取模
  2 ^ 3               # 取幂
  ```
  - 只能对查询到的数据的值进行运算，不能对标签的值进行运算。

- 可以进行如下比较运算：
  ```sh
  go_goroutines == 2
  go_goroutines != 2
  go_goroutines > 2       # 返回大于 2 的部分曲线
  go_goroutines < 2
  go_goroutines >= 2
  go_goroutines <= 2
  ```
  - 比较运算默认是过滤掉不符合条件的数据。
  - 如果在比较运算符之后加上关键字 bool ，比如 `1 == bool 2` ，就会返回比较运算的结果，用 1、0 分别表示 true、flase 。

- 矢量之间可以进行如下集合运算：
  ```sh
  vector1 and vector2     # 交集
  vector1 or vector2      # 并集
  vector1 unless vector2  # 补集，即在 vector1 中存在、在 vector2 中不存在的数据点
  ```

### 函数

- 矢量与标量的转换：
  ```sh
  vector(1)                             # 输入标量，返回一个矢量
  scalar(vector(1))                     # 输入一个单时间序列的矢量，以标量的形式返回当前时刻处的值
  ```

- 关于时间：
  ```sh
  time()                                # 返回当前的时间戳（标量）
  timestamp(vector(1))                  # 返回矢量中每个数据点的时间戳（矢量）
  ```

- 修改矢量的标签：
  ```sh
  label_join(go_goroutines, "new_label", ",", "instance", "job")               # 给矢量 go_goroutines 添加一个标签 new_label ，其值为 instance、job 标签值的组合，用 , 分隔
  label_replace(go_goroutines, "new_label", "$1-$2", "instance", "(.*):(.*)")  # 给矢量 go_goroutines 添加一个标签 new_label ，其值为对 instance 标签值的正则匹配的结果
  ```

- 矢量可以使用以下聚合函数：
  ```sh
  count(go_goroutines)                  # 返回每个时刻处，该矢量包含的数据点的数量（即包含几个时间序列）
  count_values("value", go_goroutines)  # 返回每个时刻处，各种值的数据点的数量，并按 {value="x"} 的命名格式生成多个时间序列
  sum(go_goroutines)                    # 返回每个时刻处，所有数据点的总和（即将曲线图中所有曲线叠加为一条曲线）
  min(go_goroutines)                    # 返回每个时刻处，数据点的最小值
  max(go_goroutines)                    # 返回每个时刻处，数据点的最大值
  avg(go_goroutines)                    # 返回每个时刻处，数据点的平均值
  stdvar(go_goroutines)                 # 返回每个时刻处，数据点之间的标准方差
  topk(3, go_goroutines)                # 返回每个时刻处，最大的 3 个数据点
  bottomk(3, go_goroutines)             # 返回每个时刻处，最小的 3 个数据点
  quantile(0.5, go_goroutines)          # 返回每个时刻处，大小排在 50% 位置处的数据点
  ```
  聚合函数可以与关键字 by、without 组合使用，如下：
  ```sh
  sum(go_goroutines) by(job)            # 将所有曲线按 job 标签的值分组，分别执行 sum() 函数
  sum(go_goroutines) without(job)       # 将所有曲线按除了 job 以外的标签分组，分别执行 sum() 函数
  ```
  聚合函数默认不支持输入有限时间范围内的矢量，需要使用带 _over_time 后缀的函数，如下：
  ```sh
  sum_over_time(go_goroutines[10s])     # 返回每个时刻处，过去 5 分钟之内数据点的总和
  ```

- 矢量可以使用以下算术函数：
  ```sh
  abs(go_goroutines)                    # 返回每个时刻处，数据点的绝对值
  round(go_goroutines)                  # 返回每个时刻处，数据点四舍五入之后的整数值
  absent(go_goroutines)                 # 在每个时刻处，如果不存在数据点则返回 1 ，否则返回空值
  absent_over_time(go_goroutines[1m])   # 在每个时刻处，如果过去 1m 以内不存在数据点则返回 1 ，否则返回空值
  changes(go_goroutines[1m])            # 返回每个时刻处，最近 1m 以内的数据点变化的次数
  delta(go_goroutines[1m])              # 返回每个时刻处，该数据点减去 1m 之前数据点的差值（可能为负）
  idelta(go_goroutines[1m])             # 返回每个时刻处，过去 1m 以内最后两个数据点的差值（可能为负）
  ```
  以下算术函数适用于计数器类型的矢量：
  ```sh
  resets(go_goroutines[1m])             # 返回每个时刻处，过去 1m 以内计数器重置（即数值减少）的次数
  increase(go_goroutines[1m])           # 返回每个时刻处，过去 1m 以内的数值增量（时间间隔越短，曲线高度越低）
  rate(go_goroutines[1m])               # 返回每个时刻处，过去 1m 以内的平均增长率（时间间隔越短，曲线越尖锐）
  irate(go_goroutines[1m])              # 返回每个时刻处，过去 1m 以内最后两个数据点之间的增长率（更接近实时图像）
  ```

## Rules

- 用户可以导入自己定义的 rule 文件，在其中定义规则。
- 规则分为两类：
  - Recording Rules ：用于将某个查询表达式的结果保存为新指标。这样可以避免在用户查询时才计算，减少开销。
  - Alerting Rules ：用于在满足某个条件时进行告警。（它只是标出告警状态，需要对接 Alertmanager 才能发出告警消息）
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

## API

- 管理 Prometheus 的 HTTP API ：
  ```sh
  GET /-/healthy     # 用于健康检查
  PUT /-/reload      # 重新加载配置文件
  PUT /-/quit        # 终止
  ```

- 关于数据的 API ：
  ```sh
  GET /api/v1/query?query=go_goroutines{instance='10.0.0.1:9090'}&time=1589241600   # 查询 query 表达式在指定时刻的值（不指定时刻则为当前时刻）  
  GET /api/v1/query_range?query=go_goroutines{instance='10.0.0.1:9090'}&start=1589241600&end=1589256000&step=10s  # 查询一段时间内的所有值
  PUT /api/v1/admin/tsdb/delete_series?match[]=go_goroutines&start=1589241600&end=1589256000    # 删除数据（不指定时间则删除所有时间的数据）
  PUT /api/v1/admin/tsdb/clean_tombstones    # 让 TSDB 立即释放被删除数据的磁盘空间
  ```

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

## Alertmanager

：作为一个 HTTP 服务器运行，用于处理 Prometheus 生成的告警消息。
- [GitHub 页面](https://github.com/prometheus/alertmanager)
- 与 Grafana 的告警功能相比，Alertmanager 的配置比较麻烦，但是可以在 Web 页面上搜索告警记录、分组管理。
- 下载二进制版：
  ```sh
  wget https://github.com/prometheus/alertmanager/releases/download/v0.20.0/alertmanager-0.20.0.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  ./alertmanager --config.file=alertmanager.yml
  ```
  默认的访问地址为 <http://localhost:9093>
- 使用时，需要在 Prometheus 的配置文件中加入如下配置，让 Prometheus 将告警消息发给 Alertmanager 处理。
  ```yaml
  alerting:
    alertmanagers:
    - static_configs:
      - targets:
        - 10.0.0.1:9093
  ```
- Alertmanager 的配置文件示例：
  ```yaml
  global:
    smtp_smarthost: 'smtp.exmail.qq.com:465'
    smtp_from: '123456@qq.com'
    smtp_auth_username: '123456@qq.com'
    smtp_auth_password: '******'
    smtp_require_tls: false

  route:
    receiver: 'email_to_leo'
    
  receivers:
    - name: 'email_to_leo'
      email_configs:
        - to: '123456@qq.com'
  ```

## Push Gateway

：作为一个 HTTP 服务器运行，允许其它监控对象主动推送数据到这里，相当于一个缓存，可以被 Prometheus 定时拉取。
- [GitHub 页面](https://github.com/prometheus/pushgateway)
- 缺点：不能实时判断监控对象是否在线，而且 Push Gateway 挂掉时会导致这些监控对象都丢失。




## exporter


- [官方的 exporter 列表](https://prometheus.io/docs/instrumenting/exporters/) 
- 主流软件大多提供了自己的 exporter 程序，比如 mysql_exporter、redis_exporter 。有的软件甚至本身就提供了 exporter 风格的 HTTP API 。

### Prometheus

- 本身提供了 exporter 风格的 API ，默认的访问地址为 <http://localhost:9090/metrics> 。
- 在 Grafana 上显示指标时，可参考 Prometheus 数据源自带的 "Prometheus 2.0 Stats" 仪表盘。
- 常用指标：
  ```sh
  process_resident_memory_bytes{job="prometheus"} / 1024^3  # 占用的内存（GB）
  irate(process_cpu_seconds_total{job="prometheus"}[1m])    # 使用的 CPU 核数
  prometheus_tsdb_storage_blocks_bytes / 1024^3             # tsdb block 占用的磁盘空间（GB）

  time() - process_start_time_seconds{job="prometheus"}     # 运行时长
  sum(prometheus_sd_discovered_targets{job="prometheus"})   # 监控对象的在线数量
  topk(3, irate(scrape_duration_seconds[1m]))               # 耗时最久的几次数据采集

  prometheus_engine_query_duration_seconds
  prometheus_http_request_duration_seconds_bucket
  prometheus_rule_evaluation_duration_seconds
  prometheus_rule_group_duration_seconds
  ```

### Grafana

- 本身提供了 exporter 风格的 API ，默认的访问地址为 <http://localhost:3000/metrics> 。
- 在 Grafana 上显示指标时，可参考 Prometheus 数据源自带的 "Grafana metrics" 仪表盘。

### node_exporter

：用于监控主机（主要是 Linux ）的状态。
- [GitHub 页面](https://github.com/prometheus/node_exporter)
- 监控 Docker 容器时建议使用 cAdvisor ，监控 Windows 主机时建议使用 wmi_exporter 。
- 下载二进制版：
  ```sh
  wget https://github.com/prometheus/node_exporter/releases/download/v1.0.0-rc.0/node_exporter-1.0.0-rc.0.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  ./node_exporter
  ```
  默认的访问地址为 <http://localhost:9100/metrics>

- 常用指标：
  ```sh
  avg(irate(node_cpu_seconds_total{instance='10.0.0.1:9100'}[1m])) without (cpu) * 100                  # CPU 使用率（%）
  node_load1{instance='10.0.0.1:9100'}                                                                  # CPU 平均负载
  count(node_cpu_seconds_total{mode='steal', instance='10.0.0.1:9100'})                                 # CPU 核数

  node_time_seconds{instance='10.0.0.1:9100'} - node_boot_time_seconds{instance='10.0.0.1:9100'}        # 主机运行时长（s）
  node_time_seconds{instance='10.0.0.1:9100'} - time()          # 目标主机与监控主机的时间差值（在 [scrape_interval, 0] 范围内才合理）

  node_memory_MemTotal_bytes{instance='10.0.0.1:9100'} / 1024^3                                         # 内存总容量（GB）
  node_memory_MemAvailable_bytes{instance='10.0.0.1:9100'} / 1024^3                                     # 内存可用量（GB）
  node_memory_SwapCached_bytes{instance='10.0.0.1:9100'} / 1024^3                                       # swap 使用量（GB）

  sum(node_filesystem_size_bytes{fstype=~'xfs|ext4', instance='10.0.0.1:9100'}) / 1024^3                # 磁盘总容量（GB）
  sum(node_filesystem_avail_bytes{fstype=~'xfs|ext4', instance='10.0.0.1:9100'}) / 1024^3               # 磁盘可用量（GB）

  sum(irate(node_disk_read_bytes_total{instance='10.0.0.1:9100'}[1m])) / 1024^2                         # 磁盘读速率（MB/s）
  sum(irate(node_disk_written_bytes_total{instance='10.0.0.1:9100'}[1m])) / 1024^2                      # 磁盘写速率（MB/s）

  irate(node_network_receive_bytes_total{device!~`lo|docker0`, instance='10.0.0.1:9100'}[1m]) / 1024^2  # 网络下载速率（MB/s）
  irate(node_network_transmit_bytes_total{device!~`lo|docker0`, instance='10.0.0.1:9100'}[1m]) / 1024^2 # 网络上传速率（MB/s）
  
  node_uname_info{domainname="(none)", instance="10.0.0.1:9100", job="node_exporter", machine="x86_64", nodename="Centos-1", release="3.10.0-862.el7.x86_64", sysname="Linux", version="#1 SMP Fri Apr 20 16:44:24 UTC 2018"}        # 主机信息
  ```

### process-exporter

：用于监控进程的状态。
- [GitHub 页面](https://github.com/ncabatoff/process-exporter)
- 它主要通过读取 /proc/<pid>/ 目录下的信息，来收集进程指标。
- 下载二进制版：
  ```sh
  wget https://github.com/ncabatoff/process-exporter/releases/download/v0.6.0/process-exporter-0.6.0.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  ./process-exporter --config.path exporter.yml
  ```
  默认的访问地址为 <http://localhost:9256/metrics>

- 在配置文件中定义要监控的进程：
    ```yaml
    process_names:
      - exe:                          # exe 是对启动进程的可执行文件的名称（即 argv[0]）进行匹配
        - top                         # 可以定义多行 exe 条件，每个条件可能匹配零个、一个或多个进程
        - /bin/ping

      - name: "{{.ExeBase}}"          # 定义一个要匹配的进程（该 name 会用作监控指标的 groupname ，这里使用可执行文件的基本名作为 name ）
        cmdline:                      # cmdline 是对启动命令进行正则匹配（此时只能定义一行条件，否则不会采集数据）
        - prometheus --config.file

      - name: "{{.Matches.name}}"     # 定义一个要匹配的进程（这里使用正则匹配的元素组作为 name ）
        cmdline:
        - ping www.(?P<name>\S*).com   # 用 ?P<name> 的格式命名正则匹配的元素组
    ```
    - 已经被匹配的进程不会被之后的条件重复匹配。
    - 计算一个进程的指标时，默认会包含它的所有子进程的指标。
    - 如果进程 A 的数量变为 0 ，process-exporter 也会一直记录。但如果重启 process-exporter ，就只会发现此时存在的进程，不会再记录进程 A 。

- 常用指标：
  ```sh
  sum(irate(namedprocess_namegroup_cpu_seconds_total[1m])) without (mode)   # 进程使用的 CPU 核数
  namedprocess_namegroup_memory_bytes{memtype="resident"}                   # 进程实际使用的内存
  namedprocess_namegroup_num_procs                                          # 进程数（统计属于同一个 groupname 的所有进程）
  namedprocess_namegroup_num_threads                                        # 线程数
  namedprocess_namegroup_states{state="Sleeping"}                           # Sleeping 状态的线程数
  timestamp(namedprocess_namegroup_oldest_start_time_seconds) - (namedprocess_namegroup_oldest_start_time_seconds>0)  # 进程的运行时长（ s ）
  irate(namedprocess_namegroup_read_bytes_total[1m]) / 1024^2               # 磁盘读速率（MB/s）
  irate(namedprocess_namegroup_write_bytes_total[1m]) / 1024^2              # 磁盘写速率（MB/s）
  namedprocess_namegroup_open_filedesc                                      # 打开的文件描述符数量
  namedprocess_namegroup_major_page_faults_total
  namedprocess_namegroup_minor_page_faults_total
  ```

### mysqld_exporter

：用于监控 MySQL 的状态。
