# exporter

- [官方及社区的 exporter 列表](https://prometheus.io/docs/instrumenting/exporters/)
- 主流软件大多提供了自己的 exporter 程序，比如 mysqld_exporter、redis_exporter 。有的软件甚至本身就集成了 exporter 格式的 HTTP API 。
  - 没必要为所有软件部署 exporter 程序，因为有的监控指标较少，不如自制。
  - Prometheus 提供了多种编程语言的库，供用户开发 exporter 程序。例如 Python 的第三方库 prometheus-client 。

## 集成类型

### Alertmanager

- 本身集成了 exporter 格式的 API ，默认的 metrics_path 为 `/metrics` 。
- 指标示例：
  ```sh
  alertmanager_build_info{branch="HEAD", goversion="go1.13.5", instance="10.0.0.1:9093", job="alertmanager", revision="f74be0400a6243d10bb53812d6fa408ad71ff32d", version="0.20.0"}   # 版本信息

  time() - process_start_time_seconds       # 运行时长（s）
  irate(process_cpu_seconds_total[5m])      # 占用 CPU 核数
  process_resident_memory_bytes             # 占用内存
  sum(delta(alertmanager_http_request_duration_seconds_sum[1m]))  # 处理 HTTP 请求的耗时（s）

  alertmanager_alerts                       # 存在的警报数（包括激活的、被抑制的）
  alertmanager_silences{state="active"}     # Silences 数量
  alertmanager_notifications_total          # 发送的消息数
  alertmanager_notifications_failed_total   # 发送失败的消息数
  ```
  - 如果重启 Alertmanager ，则会使一些计数的指标归零。

### etcd

- 本身集成了 exporter 格式的 API ，默认的 metrics_path 为 `/metrics` 。

### Grafana

- 本身集成了 exporter 格式的 API ，默认的 metrics_path 为 `/metrics` 。
  - 访问时不需要身份认证，但只提供了关于 Grafana 运行状态的指标。
- 在 Grafana 上显示指标时，可参考 Prometheus 数据源自带的 "Grafana metrics" 仪表盘。
- 指标示例：
  ```sh
  grafana_build_info{branch="HEAD", edition="oss", goversion="go1.14.1", instance="10.0.0.1:3000", job="grafana", revision="aee1438ff2", version="7.0.0"}  # 版本信息

  time() - process_start_time_seconds       # 运行时长（s）
  irate(process_cpu_seconds_total[5m])      # 占用 CPU 核数
  process_resident_memory_bytes             # 占用内存

  grafana_alerting_active_configurations    # Alert Rule 的总数
  grafana_alerting_active_alerts            # Alert Rule 的激活数量
  grafana_emails_sent_total
  grafana_emails_sent_failed

  delta(grafana_http_request_duration_seconds_count{handler="/",method="GET",status_code="200"}[1m])  # 每分钟收到的 HTTP 请求数
  delta(grafana_http_request_duration_seconds_sum{handler="/",method="GET",status_code="200"}[1m])    # 每分钟处理 HTTP 请求的耗时
  ```

### Jenkins

- 安装插件 "Prometheus metrics" 可提供 exporter 格式的 API ，默认的 metrics_path 为 `/prometheus/` 。
  - 在 Jenkins 的 "Configure System" 页面可以对 "Prometheus" 栏进行配置。
  - 不能统计到安装该插件以前的 Jenkins 指标。
- 指标示例：
  ```sh
  time() - process_start_time_seconds     # 运行时长（s）
  irate(process_cpu_seconds_total[5m])    # 占用 CPU 核数
  process_resident_memory_bytes           # 占用内存
  delta(http_requests_count[1m])          # 每分钟收到 HTTP 请求的次数
  http_requests{quantile=~"0.5|0.99"}     # 每分钟处理 HTTP 请求的耗时（s）

  jenkins_node_count_value                # node 总数
  jenkins_node_online_value               # node 在线数
  jenkins_executor_count_value            # 执行器的总数
  jenkins_executor_in_use_value           # 执行器正在使用的数量
  jenkins_node_builds_count               # Jenkins 本次启动以来的累计构建次数

  jenkins_job_count_value                 # Job 总数
  jenkins_queue_size_value                # 构建队列中的 Job 数（最好为 0 ）
  default_jenkins_builds_duration_milliseconds_summary_count{jenkins_job='xx'} # Job 的构建总次数（当构建结束时才记录）
  default_jenkins_builds_duration_milliseconds_summary_sum{jenkins_job='xx'}   # Job 的构建总耗时（包括被阻塞的时长）
  default_jenkins_builds_success_build_count_total{jenkins_job='xx'}           # Job 构建成功的累计次数
  default_jenkins_builds_failed_build_count_total{jenkins_job='xx'}            # Job 构建失败的累计次数
  default_jenkins_builds_last_build_start_time_milliseconds{jenkins_job='xx'}  # Job 最近一次构建的开始时间
  default_jenkins_builds_last_build_duration_milliseconds{jenkins_job='xx'}    # Job 最近一次构建的持续时长
  default_jenkins_builds_last_build_result{jenkins_job='xx'}                   # Job 最近一次构建的结果（ 1 代表 success 、0 代表其它状态）
  ```
  - 如果删除某个 Job 的构建记录，则会使其总的构建次数减少。

### k8s

- k8s 的 apiserver、kubelet 等组件本身集成了 exporter 格式的 API ，不过只提供了少量的监控指标。
- 用户可以部署额外的 exporter 服务：
  - cAdvisor ：kubelet 已经集成了 cadvisor ，可通过 /metrics/cadvisor 路径访问。
  - Heapster ：已淘汰。
  - metrics-server ：借鉴了 Heapster ，从 apiserver 获取 CPU、内存使用率等指标，供 HPA 调用。
  - kube-state-metrics ：从 apiserver 获取 node、pod 等资源的状态，生成 Metrics 。
- 相关工具：
  - Prometheus Operator ：用于在 k8s 中自动安装 Prometheus、Alertmanager、node_exporter 堆栈。
  - kube-prometheus ：调用 Prometheus Operator ，还会安装 kube-state-metrics、Grafana 。

#### 配置

- 用 Prometheus 监控 k8s 时，需要在 k8s 中创建一个 RBAC 角色，参考 [官方配置](https://github.com/prometheus/prometheus/blob/main/documentation/examples/rbac-setup.yml) 。
  - 建议采用 `namespace: kube-system` 。
  - 然后获取 ServiceAccount 对应的 secret 中的 ca.crt 和 token ：
    ```sh
    secret=`kubectl get secrets -n kube-system | grep prometheus-token | awk '{print $1}'`
    kubectl get secrets -n kube-system $secret -o yaml | yq '.data.token' | base64 -d > token
    ```
    尝试访问 API ：
    ```sh
    curl https://apiserver/metrics -H "Authorization: Bearer $(cat token)" -k
    ```

- 在 prometheus.yml 中添加配置：
  ```yml
  scrape_configs:

  # 采集每个 apiserver 的监控指标
  - job_name: k8s-apiserver
    kubernetes_sd_configs:        # 从 k8s 的 HTTP API 发现配置
    - role: endpoints             # 将 service 的每个 endpoints 作为 target ，比如 __address__="10.42.1.1:8080"
      api_server: https://apiserver
      authorization:
        credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      tls_config:
        # ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: true
      # namespaces:               # 要监控的 namespace ，默认监控所有 namespace
      #   names:
      #   - default
    # - role: pod                 # 将每个 pod_ip:expose_port 作为 target ，比如 __address__="10.42.1.1:8080" 。如果 Pod 未声明 port ，则为 __address__="10.42.1.1"
    # - role: service             # 将每个 service_ip:expose_port 作为 target
    # - role: ingress             # 将每个 ingress path 作为 target
    # 通过 kubernetes_sd_configs 获取 target 之后，以下配置用于采集这些 target
    scheme: https
    authorization:
      credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    tls_config:
      insecure_skip_verify: true
    relabel_configs:              # 每个 target 有一些元数据标签 __meta* ，Prometheus 采集之后不会保存
    - action: keep                # 根据标签筛选 target ，保留匹配的 target ，丢弃其它 target
      source_labels:
      - __meta_kubernetes_namespace
      - __meta_kubernetes_service_name
      - __meta_kubernetes_endpoint_port_name
      regex: default;kubernetes;https   # 要求完全正则匹配

  # 采集每个 kubelet 的监控指标
  - job_name: k8s-node
    kubernetes_sd_configs:
    - role: node                  # 将每个 node_ip:kubelet_port 作为 target
      api_server: https://apiserver
      authorization:
        credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      tls_config:
        insecure_skip_verify: true
    scheme: https
    authorization:
      credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    tls_config:
      insecure_skip_verify: true

  # 访问每个 kubelet 集成的 cadvisor ，从而采集所有容器的监控指标
  - job_name: k8s-cadvisor
    kubernetes_sd_configs:
    - role: node
      api_server: https://apiserver
      authorization:
        credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      tls_config:
        insecure_skip_verify: true
    scheme: https
    metrics_path: /metrics/cadvisor
    authorization:
      credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    tls_config:
      insecure_skip_verify: true

  # 如果 service 中某个端口名称以 exporter 开头，则采集监控指标
  - job_name: k8s-service
    kubernetes_sd_configs:
    - role: service
    relabel_configs:
    - action: keep
      source_labels: [__meta_kubernetes_service_port_name]
      regex: exporter.*
    # __metrics_path__ 默认为 /metrics ，但允许在 annotation 中自定义路径 prometheus.io/path: 'xx'
    - action: replace
      source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
      target_label: __metrics_path__
      regex: (.+)
    - action: replace
      source_labels: [__meta_kubernetes_namespace]    # 将 __meta* 标签重命名为普通标签，才会被 Prometheus 保存
      target_label: namespace
    - action: replace
      source_labels: [__meta_kubernetes_service_name]
      target_label: service
    # 保存 k8s 对象的 label 到 Prometheus
    # - action: labelmap
    #   regex: __meta_kubernetes_pod_label_(.+)

  # 如果 Pod 中某个 containerPort 端口名称以 exporter 开头，则采集监控指标
  - job_name: k8s-pod
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - action: keep
      source_labels: [__meta_kubernetes_pod_phase]
      regex: Running
    - action: keep
      source_labels: [__meta_kubernetes_pod_container_port_name]
      regex: exporter.*
    - action: replace
      source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      target_label: __metrics_path__
      regex: (.+)
    - action: replace
      source_labels: [__meta_kubernetes_namespace]
      target_label: namespace
    - action: replace
      source_labels: [__meta_kubernetes_pod_name]
      target_label: pod
  ```

#### 指标

- 指标示例：
  ```sh
  # 关于 apiserver
  irate(process_cpu_seconds_total[1m])  # 占用 CPU 核数
  process_resident_memory_bytes         # 占用 RSS 内存
  sum(delta(apiserver_request_total{code=~"4.*|5.*"}[1m])) by(code, resource, verb) # 失败的 HTTP 请求数
  sum(delta(apiserver_request_duration_seconds_count[1m])) by(resource, verb)     # 各种 HTTP 请求的数量（每分钟）
  sum(delta(apiserver_request_duration_seconds_sum[1m])) by(resource, verb)       # 各种 HTTP 请求的耗时（每分钟）
  sum(delta(apiserver_response_sizes_sum[1m])) by(resource, verb)                 # 各种 HTTP 响应的体积（每分钟）
  sum(apiserver_current_inflight_requests) by(request_kind)   # 读/写请求的正在执行数量
  sum(apiserver_current_inqueue_requests) by(request_kind)    # 读/写请求的等待执行数量
  sum(apiserver_storage_objects) by(resource)                 # 各种 resource 的数量
  sum(apiserver_registered_watchers) by(kind)                 # 各种 watcher 的数量
  sum(delta(apiserver_watch_events_total[1m])) by(kind)       # 各种 watch event 的数量（每分钟）
  sum(delta(apiserver_watch_events_sizes_sum[1m])) by(kind)   # 各种 watch event 的体积（每分钟）

  # 关于 etcd
  etcd_request_duration_seconds_count
  etcd_request_duration_seconds_sum
  etcd_db_total_size_in_bytes

  # 关于 kubelet
  kubernetes_build_info                                                     # k8s 版本信息
  kubelet_node_name{job="k8s-node", instance="10.0.0.1", node="10.0.0.1"}   # 通过 node 标签记录该 kubelet 所在的 node ip
  kubelet_evictions{eviction_signal="xx"}                                   # 发出的各种驱逐 pod 信号的次数
  kubelet_http_requests_total                                               # 各种 HTTP 请求的次数
  kubelet_http_requests_duration_seconds_sum
  kubelet_pleg_relist_duration_seconds_count                                # PLEG relist 的次数
  kubelet_pleg_relist_duration_seconds_sum
  kubelet_runtime_operations_duration_seconds_count{operation_type="xx"}    # 各种操作的次数
  kubelet_runtime_operations_duration_seconds_sum{operation_type="xx"}
  kubelet_runtime_operations_errors_total{operation_type="xx"}              # 各种操作出错的次数
  kubelet_running_pods
  kubelet_running_containers{container_state="xx"}
  kubelet_container_log_filesystem_used_bytes                               # 每个 container 的日志占用的磁盘空间
  ```

### Prometheus

- 本身集成了 exporter 格式的 API ，默认的 metrics_path 为 `/metrics` 。
- 指标示例：
  ```sh
  prometheus_build_info{branch="HEAD", goversion="go1.14.2", instance="10.0.0.1:9090", job="prometheus", revision="ecee9c8abfd118f139014cb1b174b08db3f342cf", version="2.18.1"}  # 版本信息

  time() - process_start_time_seconds                             # 运行时长（s）
  irate(process_cpu_seconds_total[1m])                            # 占用 CPU 核数
  process_resident_memory_bytes                                   # 占用内存
  prometheus_tsdb_storage_blocks_bytes                            # tsdb block 占用的磁盘空间
  sum(delta(prometheus_http_requests_total[1m])) by (code)        # 每分钟收到 HTTP 请求的次数
  sum(delta(prometheus_http_request_duration_seconds_sum[1m]))    # 每分钟处理 HTTP 请求的耗时（s）

  count(up == 1)                                                  # target 在线数
  prometheus_tsdb_head_series                                     # head block 中的 series 数量
  sum(scrape_samples_scraped)                                     # 抓取的 sample 数
  sum(scrape_duration_seconds)                                    # 抓取的耗时（s）
  sum(delta(prometheus_rule_evaluations_total[1m])) without (rule_group)          # rule 每分钟的执行次数
  sum(delta(prometheus_rule_evaluation_failures_total[1m])) without (rule_group)  # rule 每分钟的执行失败次数
  delta(prometheus_rule_evaluation_duration_seconds_sum[1m])                      # rule 每分钟的执行耗时（s）

  ALERTS{alertname="xx", alertstate="pending|firing"}             # 存在的警报
  ALERTS_FOR_STATE{alertname="xx"}                                # 警报开始的时间戳（这是 pending 状态的开始时间，不能区分 firing 状态）

  count({job="xx"}) by(__name__)    # 列出所有指标名
  count({job="xx"}) by(__name__) unless on(__name__) count({job="xx"} offset 6h) by(__name__) # 找到比 6h 之前多出的指标（适合更新 exporter 版本时，发现指标的变化）
  ```

### ZooKeeper

- 可启用 exporter API ，默认监听 7000 端口， metrics_path 为 `/metrics` 。
- 指标示例：
  ```sh
  # 关于 zk 集群
  quorum_size               # 非 observer 的 server 数量。这取决于配置文件，不会监控在线的 server 数
  synced_observers          # observer 数量
  election_time_sum         # 最近一次选举的耗时，单位 ms
  uptime                    # leader 的任期时长，单位 ms

  # 关于 znode
  znode_count               # 节点的数量
  ephemerals_count          # 临时节点的数量
  write_per_namespace_sum{key="brokers"}    # 每个一级节点的写数据量
  read_per_namespace_sum{key="brokers"}     # 每个一级节点的读数据量
  readlatency_count         # 读操作的数量。仅统计当前 server 收到的请求
  readlatency_sum           # 读操作的耗时
  updatelatency_count       # 读操作的数量
  updatelatency_sum         # 写操作的耗时，包括等待 quorum 投票

  # 关于客户端
  connection_request_count  # 客户端发出连接请求的累计数量
  global_sessions           # 客户端会话数
  watch_count               # watch 的数量
  ```

## 通用类型

### blackbox_exporter

：提供探针（probe）的功能，可以通过 DNS、ICMP、TCP、HTTP 等通信监控服务的状态。
- [GitHub](https://github.com/prometheus/blackbox_exporter)

#### 配置

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    blackbox_exporter:
      container_name: blackbox_exporter
      image: prom/blackbox-exporter:v0.19.0
      restart: unless-stopped
      # command:
      #   - --web.listen-address=:9115
      #   - --config.file=/etc/blackbox_exporter/config.yml
      ports:
        - 9115:9115
      volumes:
        - /etc/localtime:/etc/localtime:ro
        # - ./config.yml:/etc/blackbox_exporter/config.yml
  ```

- 可以手动发出 HTTP 请求，调用探针：
  - 使用 icmp 模块，检测目标主机能否 ping 通，也会检测出 DNS 耗时：
    ```sh
    curl 'http://localhost:9115/probe?module=icmp&target=baidu.com'
    ```
  - 使用 tcp_connect 模块，检测目标主机的 TCP 端口能否连通：
    ```sh
    curl 'http://localhost:9115/probe?module=tcp_connect&target=baidu.com:80'
    ```
  - 使用 http_2xx 模块，检测目标网站的 HTTP 状态码是否为 2xx ：
    ```sh
    curl 'http://localhost:9115/probe?module=http_2xx&target=http://baidu.com'
    ```

- 在 Prometheus 中加入 job 配置，调用探针：
  ```yml
  - job_name: blackbox_exporter
    metrics_path: /probe
    params:
      module: [http_2xx]                # 使用的模块
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: '10.0.0.1:9115'    # blackbox_exporter 的地址
    static_configs:
      - targets: ['10.0.0.2']
  ```

- blackbox_exporter 的配置文件中默认定义了一些功能模块，可以在其中加入自定义的模块，如下：
  ```yml
  modules:
    http_2xx_example:                   # 定义一个功能模块
      prober: http                      # 探针的类型，可以是 dns、icmp、tcp、http
      timeout: 2m                       # 每次探测的超时时间，超过则放弃。默认为 2 m
      http:                             # 对应 prober 类型的配置参数
        # 关于每次探测时发出的 HTTP 请求
        method: GET                     # 请求方法，默认为 GET
        headers:
          <string>: <string>
        body: <string>
        basic_auth:
          username: <string>
          password: <string>
        proxy_url: <string>
        preferred_ip_protocol: ip6      # DNS 解析时，优先采用的 IP 协议，默认为 IPv6
        ip_protocol_fallback: true      # 当 preferred_ip_protocol 不可用时，是否允许另一种 IP 协议。默认为 true

        # 关于 HTTPS
        fail_if_ssl: false              # 如果采用 SSL ，是否探测失败
        fail_if_not_ssl: false          # 如果不采用 SSL ，是否探测失败
        tls_config:
          insecure_skip_verify: false   # 是否跳过检验证书

        # 关于每次探测时收到的 HTTP 响应
        valid_status_codes: <int>,...   # 有效的状态码，默认为 2xx 。如果出现其它值，则探测失败
        valid_http_versions:            # 有效的 HTTP 协议版本
          - HTTP/1.1
          - HTTP/2.0
        compression: 'gzip'             # 响应 body 的解压算法，默认为 ''
        follow_redirects: true          # 是否跟随重定向
        fail_if_body_matches_regexp:    # 如果响应 body 与正则表达式匹配，则探测失败
          - <regex>
        fail_if_body_not_matches_regexp:
          - <regex>
        fail_if_header_matches:         # 如果响应 header 与正则表达式匹配，则探测失败
          - header: <string>
            regexp: <regex>
            allow_missing: false
        fail_if_header_not_matches:
        # - header: Set-Cookie
        #   regexp: 'Test.*'
  ```

#### 指标

- 指标示例：
  ```sh
  probe_success                   # 是否探测成功（取值 1、0 分别表示成功、失败）
  probe_duration_seconds          # 探测的耗时

  # 关于 DNS
  probe_dns_lookup_time_seconds   # DNS 解析的耗时
  probe_ip_protocol               # IP 协议，取值为 4、6
  probe_ip_addr_hash              # IP 地址的哈希值，用于判断 IP 是否变化

  # 关于 HTTP
  probe_http_status_code          # HTTP 响应的状态码。如果发生重定向，则取决于最后一次响应
  probe_http_content_length       # HTTP 响应的 body 长度，单位 bytes
  probe_http_version              # HTTP 响应的协议版本，比如 1.1
  probe_http_ssl                  # HTTP 响应是否采用 SSL ，取值为 1、0
  probe_ssl_earliest_cert_expiry  # SSL 证书的过期时间，为 Unix 时间戳
  ```

### cAdvisor

：全名为 container Advisor ，用于监控容器。
- [GitHub](https://github.com/google/cadvisor)
- 该工具由 Google 公司开发，支持将监控数据输出到 Prometheus、InfluxDB、Kafka、ES 等存储服务。
- 下载后启动：
  ```sh
  ./cadvisor
            # --listen_ip 0.0.0.0
            # --port 8080
            # --prometheus_endpoint  /metrics
            --docker_only=true    # 不输出 raw cgourp 的指标，除了 root gourp ，即 id="/"
  ```
  - 它依赖版本较新的 glibc 库，因此建议运行官方 Docker 镜像。
- 它提供了 Web 监控页面，默认只允许从 localhost 访问，可以加上 HTTP Basic Auth 后公开：
  ```sh
  htpasswd -Bbc passwd admin 123456
  ./cadvisor --http_auth_file passwd --http_auth_realm 0.0.0.0
  ```
  访问地址为 `127.0.0.1:8080/containers/` 。
- 指标示例：
  ```sh
  container_start_time_seconds              # 容器的创建时刻（不是启动时刻），采用 Unix 时间戳
  container_last_seen                       # 最后一次监控该容器的时刻。cadvisor 不会监控已停止的容器，但会在容器停止之后的几分钟内依然记录该指标
  container_tasks_state{state="xx"}         # 容器是否处于某种状态
  container_processes                       # 进程数
  container_threads                         # 线程数

  container_cpu_usage_seconds_total         # 容器占用 CPU 的累计时长
  container_cpu_user_seconds_total          # 占用用户态 CPU 的时长
  container_cpu_system_seconds_total
  container_cpu_load_average_10s            # 容器占用 CPU 的 10 秒平均负载
  container_cpu_cfs_throttled_seconds_total # 容器超出 cpu.cfs_quota_us 限额之后申请的 CPU 时长

  container_memory_usage_bytes              # 容器占用的全部内存，读取自 Cgroup 的 memory.usage_in_bytes 文件，等于 rss + swap + cache
  container_memory_rss                      # 容器的 rss 内存，读取自 Cgroup 的 memory.stat 文件中的 total_rss 字段
  container_memory_swap                     # 容器占用的 swap 内存
  container_memory_cache                    # 容器占用的 Page Cache 内存
  container_memory_working_set_bytes        # 容器的工作集内存，等于 memory.usage_in_bytes - memory.stat.total_inactive_file

  container_file_descriptors                # 打开的文件数
  container_fs_usage_bytes                  # 容器占用的磁盘，包括 rootfs、终端日志，不包括挂载的 volume
  container_fs_reads_total                  # 磁盘读的累计次数
  container_fs_reads_bytes_total            # 磁盘读的累计字节量
  container_fs_read_seconds_total           # 磁盘读的累计耗时
  container_fs_writes_total{device="xx"}    # 磁盘写的累计次数，按 device 划分，包括 rootfs、volume ，不包括终端日志，不包括 Page Cache 缓冲区的数据
  container_fs_write_seconds_total
  container_fs_writes_bytes_total

  container_sockets                                       # 打开的 Socket 数
  container_network_receive_bytes_total{interface="xx"}   # 网络收的累计字节量
  container_network_receive_packets_total                 # 网络收的累计数据包数
  container_network_transmit_bytes_total                  # 网络发
  container_network_transmit_packets_total
  ```
  - 假设容器启动之后不断增加内存，则当 container_memory_usage_bytes 达到 Cgroup 限制的 memory.limit_in_bytes 时，不会触发 OOM ，而是停止增长。
    - 因为 `container_memory_usage_bytes = rss + swap + cache` ，在总和 container_memory_usage_bytes 不变的情况下，容器可以减少 container_memory_cache ，继续增加 container_memory_rss 。
    - 当 container_memory_working_set_bytes 达到 Cgroup 内存限制时，会触发 OOM ，杀死容器内进程。

### jmx_exporter

：用于从 JMX 端口获取监控指标。
- [GitHub](https://github.com/prometheus/jmx_exporter)
- 用法一：将 jmx_exporter 集成到待监控的 Java 进程中
  1. 下载 jmx_exporter 的 jar 文件。
  2. 编写 jmx_exporter 的配置文件 config.yaml ：
      ```yml
      rules:
      - pattern: "jvm.*"        # 这里只采集 JVM 的监控指标，不监控其它 bean
      ```
  3. 在 Java 程序的启动命令中加入 `-javaagent:jmx_prometheus_javaagent-0.17.2.jar=8081:config.yaml` ，即可在 8081 端口提供 exporter 指标。
      - jmx_exporter 作为 java agent 运行时几乎不会增加 Java 进程的 CPU 开销，除非 Prometheus 的采集间隔很短。
- 用法二：独立运行 jmx_exporter 进程，监控另一个 Java 进程
  1. 编写 jmx_exporter 的配置文件 config.yaml ：
      ```yml
      hostPort: 10.0.0.1:9999   # 访问另一个 Java 进程的 JMX 端口，从而采集监控指标
      rules:
      - pattern: "jvm.*"
      ```
  2. 启动 jmx_exporter ，作为 HTTP 服务器运行：
      ```sh
      java -jar jmx_prometheus_httpserver-0.18.0.jar 8081 config.yaml
      ```

- 指标示例：
  ```sh
  jvm_memory_bytes_max                        # JVM 内存允许的最大容量，分为 heap、nonheap 两块内存区域
  jvm_memory_bytes_committed{area="heap"}     # JVM 内存的当前容量，即从操作系统申请的内存量
  jvm_memory_bytes_used{area="heap"}          # JVM 内存的使用量，即当前容量中存放了有效数据的部分
  jvm_memory_bytes_used / jvm_memory_bytes_committed  # JVM 内存的使用量，占当前容量的百分比

  jvm_memory_pool_bytes_max                   # JVM 内存池，分为 Metaspace、Eden Space、Survivor Space 等区域
  jvm_memory_pool_bytes_committed
  jvm_memory_pool_bytes_used
  jvm_memory_pool_bytes_used / jvm_memory_pool_bytes_committed

  delta(jvm_gc_collection_seconds_count[1m])  # GC 次数（每分钟）
  delta(jvm_gc_collection_seconds_sum[1m])    # GC 耗时（每分钟）
  jvm_classes_loaded_total                    # JVM 累计加载的 class 数量
  jmx_scrape_duration_seconds                 # JMX 本次采集监控指标的耗时
  ```

### node_exporter

：用于监控类 Unix 主机。
- [GitHub](https://github.com/prometheus/node_exporter)
- 下载后启动：
  ```sh
  ./node_exporter
                 # --web.listen-address=":9100"
                 # --web.telemetry-path="/metrics"
                 # --log.level=info
                 # --log.format=logfmt
  ```
  默认的访问地址为 <http://localhost:9100/metrics>

- 指标示例：
  ```sh
  node_exporter_build_info{branch="HEAD", goversion="go1.15.8", instance="10.0.0.1:9100", job="node_exporter", revision="b597c1244d7bef49e6f3359c87a56dd7707f6719", version="1.1.2"}  # 版本信息
  node_uname_info{domainname="(none)", instance="10.0.0.1:9100", job="node_exporter", machine="x86_64", nodename="Centos-1", release="3.10.0-862.el7.x86_64", sysname="Linux", version="#1 SMP Fri Apr 20 16:44:24 UTC 2018"}  # 主机信息

  # 关于时间
  node_boot_time_seconds                        # 主机的启动时刻
  node_time_seconds                             # 主机的当前时间（Unix 时间戳）
  node_time_seconds - node_boot_time_seconds    # 主机的运行时长（s）
  node_time_seconds - time() + T                # 主机的时间误差，其中 T 是估计每次抓取及传输的耗时

  # 关于 CPU
  node_load1                                                                    # 每分钟的平均负载
  count(node_cpu_seconds_total{mode='idle'})                                    # CPU 核数
  avg(irate(node_cpu_seconds_total[5m])) without (cpu) * 100                    # CPU 各模式占比（%）
  (1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) without(cpu)) * 100  # CPU 使用率（%）

  # 关于内存
  node_memory_MemTotal_bytes                    # 内存总量，单位 bytes
  node_memory_MemAvailable_bytes                # 内存可用量，CentOS 7 以上版本才支持该指标
  1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes # 内存使用率
  node_memory_Buffers_bytes
  node_memory_Cached_bytes
  node_memory_SwapTotal_bytes                   # swap 内存总量
  node_memory_SwapFree_bytes                    # swap 内存可用量

  # 关于磁盘
  sum(node_filesystem_size_bytes{fstype=~`ext\d|xfs`, mountpoint!~`/boot`}) without(device, fstype, mountpoint)  # 磁盘总量
  sum(node_filesystem_avail_bytes{fstype=~`ext\d|xfs`, mountpoint!~`/boot`}) without(device, fstype, mountpoint) # 磁盘可用量
  sum(rate(node_disk_read_bytes_total[1m]))     # 磁盘每秒读取量
  sum(rate(node_disk_written_bytes_total[1m]))  # 磁盘每秒写入量
  node_filefd_maximum                           # 文件描述符的数量上限
  node_filefd_allocated                         # 文件描述符的使用数量

  # 关于网口
  node_network_info{address="00:60:F6:71:20:18",broadcast="ff:ff:ff:ff:ff:ff",device="eth0",duplex="full",ifalias="",operstate="up"} # 网口的信息（broadcast 是广播地址，duplex 是双工模式，）
  node_network_mtu_bytes                                              # MTU 大小
  node_network_up{device=~`eth\d`}                                    # 网口的状态，取值 1、0 表示是否启用
  rate(node_network_receive_bytes_total{device!~`lo|docker0`}[1m])    # 网口每秒接收量
  rate(node_network_transmit_bytes_total{device!~`lo|docker0`}[1m])   # 网口每秒发送量

  # 关于 IP 协议
  node_network_receive_packets_total        # 接收的数据包数
  node_network_receive_errs_total           # 接收的错误包数
  node_network_receive_drop_total           # 接收时的丢弃包数
  node_network_receive_compressed_total     # 接收的压缩包数
  node_network_receive_multicast_total      # 接收的多播包数
  node_network_transmit_packets_total       # 发送的数据包数
  node_network_transmit_errs_total
  node_network_transmit_drop_total
  node_network_transmit_compressed_total
  node_netstat_Icmp_InMsgs                  # 接收的 ICMP 包数
  node_netstat_Icmp_InErrors                # 接收的 ICMP 错误包数
  node_netstat_Icmp_OutMsgs                 # 发送的 ICMP 包数

  # 关于 Socket
  node_sockstat_sockets_used                # 使用的 Socket 数
  node_sockstat_TCP_inuse                   # 监听的 TCP Socket 数
  node_sockstat_TCP_tw

  # 关于 TCP/UDP 协议
  node_netstat_Tcp_CurrEstab                # ESTABLISHED 加 CLOSE_WAIT 状态的 TCP 连接数
  node_netstat_Tcp_InSegs                   # 接收的 TCP 包数（包括错误的）
  node_netstat_Tcp_InErrs                   # 接收的 TCP 错误包数（比如校验和错误）
  node_netstat_Tcp_OutSegs                  # 发送的 TCP 包数
  node_netstat_Udp_InDatagrams              # 接收的 UDP 包数
  node_netstat_Udp_InErrors                 # 接收的 UDP 错误包数
  node_netstat_Udp_OutDatagrams             # 发送的 UDP 包数
  ```

### process-exporter

：用于监控 Linux 主机上的进程、线程。
- [GitHub](https://github.com/ncabatoff/process-exporter)
- 它主要通过读取 `/proc/<pid>/` 目录下的信息，来收集进程指标。

#### 配置

- 下载后启动：
  ```sh
  ./process-exporter -config.path=process-exporter.yml
                    # -web.listen-address :9256
                    # -web.telemetry-path /metrics
                    -children=false                 # 是否将子进程占用的资源统计到父进程名下，默认为 true
                    -threads=false                  # 是否采集每个线程的指标，默认为 true
  ```

- 在配置文件中定义需要监控的进程：
  ```yml
  process_names:
  - exe:
    - top                           # 定义多行条件，匹配任一条件的进程都会被监控
    - /bin/ping

  - comm:
    - bash

  - name: "{{.ExeBase}}"            # 定义进程组的 name ，这里调用了模板变量
    cmdline:
    - /bin/ping localhost

  - name: "ping {{.Matches.name}}"  # 这里调用正则匹配的元素组作为 name
    cmdline:
    - ping www.(?P<name>\w*).com    # 用 ?P<name> 的格式命名正则匹配的元素组
  ```
  - process-exporter 运行时，会将主机上每个进程尝试匹配配置文件中的规则。
    - 如果匹配某个条件，则监控该进程。
    - 如果匹配多个条件，则只采用最先匹配的条件。
    - 如果所有条件都不匹配，则不监控该进程。
  - 匹配规则分为 3 种类型：
    - exe ：对进程启动命令中的可执行文件路径，即 `argv[0]` ，进行匹配（必须完全相同）。
    - comm ：对进程的可执行文件的文件名，即 `/proc/<PID>/comm` 进行匹配（必须完全相同）。
    - cmdline ：对进程的启动命令，即 `/proc/<PID>/cmdline` ， 进行正则匹配（只要匹配部分字符串即可）。
      - exe、comm 可以定义多行匹配条件，匹配任一条件的进程都会被监控。
      - cmdline 也可以定义多行匹配条件，只有同时匹配所有条件的进程才会被监控。
      - exe、comm 会自动使用匹配条件作为被监控进程的名称，即 groupname 。而 cmdline 需要手动定义 name 。
    - 可以将 cmdline 与一个 exe 或 comm 组合使用，既要求进程的启动命令匹配，也要求可执行文件匹配。如下：
      ```yml
      - name: jenkins
        comm:
          - java
        cmdline:
          - java .* -jar /usr/share/jenkins/jenkins.war
      ```
  - 定义 cmdline 的 name 时，可调用以下模板变量：
    ```sh
    .Comm         # 可执行文件的文件名，比如 ping
    .ExeBase      # 进程启动命令中的可执行文件的文件名，比如 ping
    .ExeFull      # 进程启动命令中的可执行文件路径，比如 /bin/ping
    .Username     # 启动进程的用户名
    .Matches      # 一个字典，存储 cmdline 正则匹配的结果
    .PID          # 进程的 PID
    .StartTime    # 进程的启动时刻，比如 2021-01-01 07:40:29.22 +0000 UTC
    ```

#### 指标

- 指标示例：
  ```sh
  process_exporter_build_info{branch="",goversion="go1.15.3",revision="",version="0.7.5"}   # 版本信息

  namedprocess_namegroup_num_procs                                                # 进程数（统计属于同一个 groupname 的进程实例数量）
  timestamp(namedprocess_namegroup_oldest_start_time_seconds) - (namedprocess_namegroup_oldest_start_time_seconds>0)  # 运行时长。如果同一个 groupname 中存在多个进程，则考虑最老的那个进程
  sum(irate(namedprocess_namegroup_cpu_seconds_total[5m])) without (mode)         # 进程占用的 CPU 核数
  namedprocess_namegroup_memory_bytes{memtype="virtual"}                          # 进程申请的虚拟内存
  namedprocess_namegroup_memory_bytes{memtype="resident"}                         # 进程占用的 RAM 内存
  namedprocess_namegroup_memory_bytes{memtype="swapped"}                          # 进程占用的 Swap 内存
  rate(namedprocess_namegroup_read_bytes_total[1m])                               # 进程的磁盘每秒读取量
  rate(namedprocess_namegroup_write_bytes_total[1m])                              # 进程的磁盘每秒写入量

  namedprocess_namegroup_num_threads                                              # 进程包含的线程数
  namedprocess_namegroup_states{state="Sleeping"}                                 # Sleeping 状态的线程数
  namedprocess_namegroup_open_filedesc                                            # 打开的文件描述符数量

  namedprocess_namegroup_thread_count{groupname="python", threadname="thread-1"}  # 指定进程包含的，同一名称的线程数
  sum(irate(namedprocess_namegroup_thread_cpu_seconds_total[5m])) without (mode)  # 线程占用的 CPU 核数
  rate(namedprocess_namegroup_thread_io_bytes_total{iomode="read"}[1m])           # 线程的磁盘每秒读取量
  rate(namedprocess_namegroup_thread_io_bytes_total{iomode="write"}[1m])          # 线程的磁盘每秒写入量
  ```
  - 当 process-exporter 发现进程 A 之后，就会一直记录它的指标。即使进程 A 停止，也会记录它的 namedprocess_namegroup_num_procs 为 0 。
    - 如果重启 process-exporter ，则只会发现此时存在的进程，不会再记录进程 A 。
    - 如果主机重启之后，进程没有启动，则它不能发现进程没有恢复，不会发出警报。
  - xx_total 之类的指标是累计值，当 process-exporter 重启时会清零，重新累计。
  - 不能监控进程的网络 IO 。
  - 启动 process-exporter 之后，可尝试执行以下命令，查看当前监控的进程：
    ```sh
    curl 127.0.0.1:9256/metrics | grep num_procs
    ```

### windows_exporter

：用于监控 Windows 主机，也可监控其进程。
- [GitHub](https://github.com/prometheus-community/windows_exporter)
- 下载 exe 版后启动：
  ```sh
  windows_exporter.exe
                      # --telemetry.addr :9182
                      # --telemetry.path /metrics
                      --collectors.enabled cpu,cs,logical_disk,net,os,process,system  # 启用指定的指标采集器
                      # --collector.process.whitelist="firefox|chrome"                # 指定要监控的进程的白名单（对进程名进行正则匹配）
                      # --collector.process.blacklist=""                              # 指定要监控的进程的黑名单
  ```
- 或者下载 msi 版。执行它会安装 windows_exporter ，并作为后台服务运行、自动开通防火墙。
  ```sh
  windows_exporter.msi
                      # LISTEN_ADDR 0.0.0.0
                      # LISTEN_PORT 9182
                      # METRICS_PATH /metrics
                      ENABLED_COLLECTORS=cpu,cs,logical_disk,net,os,process,system
                      EXTRA_FLAGS="--collector.process.whitelist=firefox|chrome"
  ```
- 指标示例：
  ```sh
  windows_exporter_build_info{branch="master", goversion="go1.13.3", instance="10.0.0.1:9182", job="windows_exporter", revision="c62fe4477fb5072e569abb44144b77f1c6154016", version="0.13.0"}  # 版本信息

  # os collector
  windows_os_info{instance="10.0.0.1:9182", job="windows_exporter", product="Microsoft Windows Server 2016 Standard", version="10.0.14393"} # 主机信息
  windows_os_time                           # 主机的当前时间（Unix 时间戳）
  windows_os_timezone{timezone="CST"}       # 采用的时区
  windows_os_visible_memory_bytes           # 可见的物理内存的总量，可能小于实际容量
  windows_os_physical_memory_free_bytes     # 物理内存的可用量
  windows_os_virtual_memory_bytes           # 虚拟内存的总量
  windows_os_virtual_memory_free_bytes      # 虚拟内存的可用量

  # cs collector
  windows_cs_logical_processors             # CPU 核数

  # system collector
  windows_system_system_up_time             # 主机的启动时刻

  # cpu collector
  windows_cpu_core_frequency_mhz                                                # CPU 频率
  avg(irate(windows_cpu_time_total[5m])) without(core) * 100                    # CPU 各模式占比（%）
  (1 - avg(irate(windows_cpu_time_total{mode="idle"}[5m])) without(core)) * 100 # CPU 使用率（%）

  # logical_disk collector 的指标
  sum(windows_logical_disk_size_bytes) without(volume)                    # 磁盘的总量
  windows_logical_disk_free_bytes{volume!~'HarddiskVolume.*'}             # 磁盘的可用量，磁盘分区 HarddiskVolume 一般是系统保留分区
  rate(windows_logical_disk_read_bytes_total[1m])                         # 磁盘每秒读取量
  rate(windows_logical_disk_write_bytes_total[1m])                        # 磁盘每秒写入量

  # net collector
  rate(windows_net_bytes_received_total{nic="xx"}[1m])                    # 接口每秒接收量
  rate(windows_net_bytes_sent_total{nic="xx"}[1m])                        # 接口每秒发送量

  # process collector
  timestamp(windows_process_start_time) - (windows_process_start_time>0)  # 进程的运行时长
  sum(rate(windows_process_cpu_time_total[1m])) without (mode)            # 进程占用的 CPU 核数
  windows_process_private_bytes                                           # 进程独占的内存，即进程总共提交的内存，包括物理内存、虚拟内存
  windows_process_working_set                                             # 进程可用的内存，包括独占的内存、与其它进程的共享内存
  windows_process_thread_count                                            # 进程的线程数
  windows_process_io_bytes_total                                          # 进程的 handle 数量
  ```
  - 当 windows_exporter 发现进程 A 之后，就会一直记录它的指标。但是如果进程 A 停止，则不会再记录它的指标。
  - 不能监控进程的网络 IO 。
  - 不能通过启动命令区分相同名字的进程，只能通过 PID 区分。

## 专用类型

### consul_exporter

：用于监控 Consul 服务器。
- [GitHub](https://github.com/prometheus/consul_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    consul_exporter:
      container_name: consul_exporter
      image: prom/consul-exporter:v0.7.1
      command:
        - --web.listen-address=:9107
        - --web.telemetry-path=/metrics
        - --consul.server=http://localhost:8500
        # - --kv.prefix=""  # 采集前缀匹配的 key 的 value
      restart: unless-stopped
      ports:
        - 9107:9107
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```
- 指标示例：
  ```sh
  # 关于节点
  consul_up                                       # 当前 agent 节点是否在线
  consul_raft_peers                               # 集群的 server 节点数
  consul_serf_lan_members                         # 集群的节点数
  consul_serf_lan_member_status{member="node1"}   # 各个节点的 gossip 状态，取值 1、2、3、4 分别表示 Alive、Leaving、Left、Failed

  # 关于服务
  consul_catalog_services                                                                           # 已注册的 service 总数，不考虑 service_id 实例数量
  consul_catalog_service_node_healthy{node="node1", service_id="xx", service_name="xx"}             # 某个 node 上的某个 service_id 是否健康，取值为 1 或 0
  consul_health_node_status{check="serfHealth", node="node1", status="passing"}                     # 某个 node 是否为 status 状态，取值为 1 或 0
  consul_health_service_status{node="node1", service_id="xx", service_name="xx", status="passing"}  # 某个 node 上的 service_id 是否为 status 状态，取值为 1 或 0
  ```

### elasticsearch_exporter

：用于监控 ES 服务器。
- [GitHub](https://github.com/prometheus-community/elasticsearch_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    elasticsearch_exporter:
      container_name: elasticsearch_exporter
      image: quay.io/prometheuscommunity/elasticsearch-exporter:v1.2.1
      command:
        # - --web.listen-address=:9114
        # - --web.telemetry-path=/metrics
        - --es.uri=http://<user>:<password>@elasticsearch:9200
        - --es.all                    # 是否监控集群的所有 node 。默认为 false ，只监控当前 node
        # - --es.cluster_settings     # 是否监控集群的配置
        # - --es.indices              # 是否监控所有 index
        # - --es.indices_settings
        # - --es.indices_mappings
        - --es.shards
        # - --es.snapshots
        # - --es.timeout  5s          # 从 ES 采集信息的超时时间
      restart: unless-stopped
      ports:
        - 9114:9114
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```
- 指标示例：
  ```sh
  elasticsearch_clusterinfo_version_info{build_date="2018-10-30T23:17:19.084789Z",build_hash="fe40335",cluster="cluster-1",lucene_version="8.7.0",version="7.10.2"}  # 版本信息

  # 关于集群
  elasticsearch_clusterinfo_up                          # 服务器是否在线，可以采集监控指标
  elasticsearch_cluster_health_status{color="green"}    # 集群的状态是否为 green
  elasticsearch_cluster_health_number_of_nodes          # node 数量
  elasticsearch_cluster_health_number_of_data_nodes     # data node 数量
  elasticsearch_cluster_health_number_of_pending_tasks  # 等待执行的 task 数量
  elasticsearch_cluster_health_active_shards            # shard 总数
  elasticsearch_cluster_health_active_primary_shards    # primary shard 数量
  elasticsearch_cluster_health_unassigned_shards        # unassigned shard 数量
  elasticsearch_cluster_health_initializing_shards
  elasticsearch_cluster_health_relocating_shards

  # 关于 Node
  elasticsearch_os_cpu_percent
  elasticsearch_os_load1
  elasticsearch_filesystem_data_size_bytes                            # 磁盘总量
  elasticsearch_filesystem_data_available_bytes{name="node-1", mount="/usr/share/elasticsearch/data (/dev/vdb)"}    # 磁盘可用大小
  elasticsearch_filesystem_io_stats_device_read_size_kilobytes_sum    # 磁盘累计读，单位为 KB
  elasticsearch_filesystem_io_stats_device_write_size_kilobytes_sum   # 磁盘累计写
  elasticsearch_transport_rx_size_bytes_total                         # 网络累计读
  elasticsearch_transport_tx_size_bytes_total
  elasticsearch_process_max_files_descriptors
  elasticsearch_process_open_files_count

  # 关于 JVM ，可参考 jmx_exporter
  elasticsearch_jvm_memory_used_bytes / elasticsearch_jvm_memory_max_bytes
  elasticsearch_jvm_memory_pool_used_bytes / elasticsearch_jvm_memory_pool_max_bytes
  delta(elasticsearch_jvm_gc_collection_seconds_count[1m])  # GC 次数（每分钟）
  delta(elasticsearch_jvm_gc_collection_seconds_sum[1m])    # GC 耗时（每分钟）

  # 关于 thread pool
  elasticsearch_thread_pool_threads_count
  elasticsearch_thread_pool_active_count
  elasticsearch_thread_pool_completed_count
  elasticsearch_thread_pool_largest_count
  elasticsearch_thread_pool_queue_count
  elasticsearch_thread_pool_rejected_count

  # 关于 index
  elasticsearch_indices_docs_total{index=".kibana"}     # index 的可见文档数，包括主分片、副分片的文档，不包括 delete 文档
  elasticsearch_indices_deleted_docs_total              # index 的 deleted 文档数
  elasticsearch_indices_store_size_bytes_total          # index 占用的磁盘空间，累计所有 node
  elasticsearch_index_stats_flush_total                         # index flush 的次数
  elasticsearch_index_stats_flush_time_seconds_total            # index flush 的耗时
  elasticsearch_index_stats_get_total                           # index GET 的次数
  elasticsearch_index_stats_get_time_seconds_total              # index GET 的耗时
  elasticsearch_index_stats_indexing_delete_total               # index delete 的次数
  elasticsearch_index_stats_indexing_delete_time_seconds_total
  elasticsearch_index_stats_indexing_index_total                # index 新增文档数
  elasticsearch_index_stats_indexing_index_time_seconds_total
  elasticsearch_index_stats_merge_total                         # index merge 的次数
  elasticsearch_index_stats_merge_time_seconds_total
  elasticsearch_index_stats_refresh_total                       # index refresh 的次数。这是累计该 index 下属所有 shard 的 refresh 次数
  elasticsearch_index_stats_refresh_time_seconds_total
  elasticsearch_index_stats_search_fetch_time_seconds_total     # search fetch 的次数
  elasticsearch_index_stats_search_fetch_total
  elasticsearch_index_stats_search_query_time_seconds_total     # search query 的次数
  elasticsearch_index_stats_search_query_total

  # 关于 shard
  elasticsearch_indices_shards_docs{index=".kibana", node="qA5eXtIwQU6kbVc-ly5IKg", primary="true", shard="0"}   # 某个 index 在某个 nodename 上，某个编号的 shard 的文档数

  # 关于 segment
  elasticsearch_indices_segment_count_total             # index 的 segment 数量
  ```

### kafka_exporter

：用于监控 Kafka 。
- [GitHub](https://github.com/danielqsj/kafka_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    kafka_exporter:
      container_name: kafka_exporter
      image: danielqsj/kafka-exporter:v1.6.0
      restart: unless-stopped
      command:
        # - --web.listen-address=:9308
        # - --web.telemetry-path=/metrics
        - --kafka.server=10.0.0.1:9092    # broker 的地址，可以多次使用该选项
        - --kafka.version=2.8.0

        # - --sasl.enabled                # 是否启用 SASL/PLAIN 认证，默认为 false
        # - --sasl.mechanism=plain
        # - --sasl.username=***
        # - --sasl.password=******

        # - --topic.filter=.*             # 通过正则表达式筛选要监控的 topic ，例如 filter=^[^_].*
        # - --group.filter=.*
      ports:
        - 9308:9308
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```
- 指标示例：
  ```sh
  kafka_exporter_build_info{goversion="go1.16", instance="10.0.0.1:9308", job="kafka_exporter"} # 版本信息
  kafka_brokers                                                              # Kafka 集群的 broker 数量

  kafka_topic_partitions{topic="x"}                                          # 某个 topic 的 partition 数量
  kafka_topic_partition_replicas{topic="x", partition="x"}                   # partition 的副本数
  kafka_topic_partition_in_sync_replica{topic="x", partition="x"}            # partition 的已经同步的副本数
  kafka_topic_partition_under_replicated_partition{topic="x", partition="x"} # partition 是否存在未同步的副本

  kafka_topic_partition_leader{topic="x", partition="x"}                     # partition 的 leader 的 ID
  kafka_topic_partition_leader_is_preferred{topic="x", partition="x"}        # partition 的 leader 是否为 preferred replica
  kafka_topic_partition_current_offset{topic="x", partition="x"}             # partition 的当前偏移量
  kafka_topic_partition_oldest_offset{topic="x", partition="x"}              # partition 的最早偏移量

  kafka_consumergroup_members{consumergroup="x"}                                    # 某个 consumergroup 的成员数
  kafka_consumergroup_current_offset{consumergroup="x", topic="x", partition="x"}   # 某个 consumergroup 在某个 partition 的偏移量
  kafka_consumergroup_lag{consumergroup="x", topic="x", partition="x"}              # 某个 consumergroup 在某个 partition 的滞后量
  ```
- 同类产品：
  - kafka_exporter 没有监控 Topic 占用的磁盘空间，而 kminion 提供了该监控指标。
  - 如果对性能有更高的追求，可给 Kafka 声明 JMX_PORT 环境变量，然后用 jmx_exporter 监控其 JVM 状态。

### kminion

：用于监控 Kafka 。
- [GitHub](https://github.com/redpanda-data/kminion)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    kminion:
      container_name: kminion
      image: vectorized/kminion:v2.2.1
      restart: unless-stopped
      environment:
        CONFIG_FILEPATH: /app/kminion.yml
      ports:
        - 8080:8080
      volumes:
        - /etc/localtime:/etc/localtime:ro
        - ./kminion.yml:/app/kminion.yml
  ```
  配置文件 kminion.yml 示例：
  ```yml
  kafka:
    brokers: ["10.0.0.1:9092"]
    sasl:
      enabled: true
      mechanism: PLAIN
      username: ***
      password: ******
  # minion:
  #   consumerGroups:
  #     allowedGroups: [".*"]   # 通过正则表达式筛选要监控的对象
  #     ignoredGroups: []
  #   topics:
  #     allowedTopics: [".*"]
  #     ignoredTopics: []
  #     infoMetric:
  #       configKeys: ["cleanup.policy"]  # 监控 topic 的一些配置参数
  ```
- 指标示例：
  ```sh
  # 关于 broker
  kminion_kafka_cluster_info{broker_count="x", cluster_id="***", cluster_version="xx", controller_id="x"}   # kafka 集群的信息
  kminion_kafka_broker_log_dir_size_total_bytes{broker_id="x"}    # broker 占用的磁盘空间

  # 关于 topic
  kminion_kafka_topic_info{topic_name="xx", cleanup_policy="delete", partition_count="6", replication_factor="1"} # topic 的信息
  kminion_kafka_topic_log_dir_size_total_bytes  # topic 在所有 broker 总共占用的磁盘空间，包括 replica
  kminion_kafka_topic_partition_high_water_mark{topic_name="xx", partition_id="x"}  # 单个分区的 HW 偏移量

  # 关于 consumer group
  kminion_kafka_consumer_group_info{group_id="xx", coordinator_id="xx", protocol="range", protocol_type="consumer", state="Stable"} # 消费组的信息
  kminion_kafka_consumer_group_members{group_id="xx"} # 消费组的成员数

  # 某个 consumer group 对于某个 topic 的监控指标
  kminion_kafka_consumer_group_topic_members{group_id="xx", topic_name="xx"}  # 被 assigned partitions 的成员数。如果低于该 group 的成员数，则说明有成员空闲
  kminion_kafka_consumer_group_topic_lag{group_id="xx", topic_name="xx"}  # 消费的滞后量，是所有分区的 lag 之和
  kminion_kafka_consumer_group_topic_partition_lag{group_id="xx", topic_name="xx", partition_id="x"}  # 单个分区的 lag
  kminion_kafka_consumer_group_topic_offset_sum # 消费的偏移量，是所有分区的 committed offset 之和
  ```

### kube-state-metrics

：用于监控 k8s 内部组件。
- [GitHub](https://github.com/kubernetes/kube-state-metrics)
- kube-state-metrics 只是采集 k8s 内部组件的监控指标，没有采集容器的监控指标，因此通常跟 cAdvisor 组合使用。
- kube-state-metrics 会缓存所有 k8s 对象的状态数据。并监听 k8s event ，在发生事件时更新相关的状态数据。
  - 优点：每次采集监控指标时，是增量采集而不是全量采集，减少了耗时。
  - 缺点：kube-state-metrics 进程需要占用更多内存，来缓存数据。
- cAdvisor 也使用了缓存，但没有监听 k8s event ，不能及时更新监控指标。
  - 如果用 `docker rm -f` 删除一个容器，则 cAdvisor 会根据缓存继续输出该容器的监控指标，大概 4 分钟之后才停止。
  - 假设 Pod 内某个容器因为 OOM 等原因终止，然后根据 restartPolicy 自动创建新容器。短时间内 cAdvisor 会根据缓存输出旧容器的监控指标，因此用 `sum(container_memory_xx_bytes{container!~"POD|", pod="xx"})` 会计算新容器、旧容器占用的内存之和，显得该 Pod 占用的内存异常多。
  - [相关 Issue](https://github.com/google/cadvisor/issues/2844)

#### 部署

- 先看 kube-state-metrics 的官方文档，找到与当前 k8s 版本兼容的 kube-state-metrics 版本。然后部署：
  ```sh
  version=2.4.2
  wget https://github.com/kubernetes/kube-state-metrics/archive/refs/tags/v${version}.tar.gz
  tar -xf v${version}.tar.gz
  cd kube-state-metrics-${version}/examples/standard
  sed -i "s#image: .*#image: bitnami/kube-state-metrics:${version}#g" deployment.yaml
  sed -i 's#clusterIP: None##g' service.yaml
  kubectl apply -f .
  ```

- 启动命令：
  ```sh
  kube-state-metrics
      --host=::
      --port=8080                   # metrics 端口
      --telemetry-port=8081         # 在该端口暴露 kube-state-metrics 自身的指标
      # --namespaces ''             # 监控的命名空间，默认监控所有
      # --namespaces-denylist ''    # 不监控的命名空间
      # --resources configmaps,cronjobs,daemonsets,deployments,...  # 监控哪几种资源，默认监控所有
      # --metric-annotations-allowlist namespaces=[kubernetes.io/*,...],pods=[*]  # 将哪些资源的哪些 annotations 加入监控指标，默认禁用
      # --metric-labels-allowlist pods=[k8s-app,...] # 将哪些资源的哪些 labels 加入监控指标，默认禁用
  ```

- 在 prometheus.yml 中添加配置：
  ```yml
  - job_name: kube-state-metrics
    static_configs:
    - targets:
      - kube-state-metrics:8080
  ```

#### 指标

- 指标示例：
  ```sh
  # 大部分类型的资源都存在的指标
  *_info
  *_created                       # 资源的创建时间，取值为 Unix 时间戳
  *_metadata_resource_version     # 资源的 resourceVersion
  *_annotations
  *_labels

  kube_node_role{role="worker"}                                           # node 节点类型
  kube_node_status_condition{condition="Ready", status="true"}            # node 是否处于 Ready 状态
  kube_node_status_condition{condition!~"Ready", status=~"true|unknown"}  # node 是否处于异常状态
  kube_node_status_allocatable{resource="cpu", unit="core"}               # node 各种资源的容量

  kube_pod_owner{owner_kind="ReplicaSet", owner_name="xx"}  # 父资源
  kube_pod_status_scheduled{condition="true"} # Pod 是否已被调度。这包括停止运行但未删除的 Pod
  kube_pod_status_scheduled_time              # Pod 被调度的时刻
  kube_pod_start_time
  kube_pod_completion_time
  kube_pod_status_phase{phase="xx"}           # Pod 是否处于某个生命周期
  kube_pod_status_ready{condition="true"}     # Pod 是否就绪
  kube_pod_status_reason{reason="xx"}         # Pod 处于当前状态的原因

  kube_pod_container_resource_requests{resource="cpu", unit="core"} # Pod 中容器的资源需求。这包括停止运行但未删除的 Pod
  kube_pod_container_resource_limits{resource="cpu", unit="core"}   # Pod 中容器的资源限制
  kube_pod_container_state_started            # Pod 中容器的启动时刻
  kube_pod_container_status_running           # Pod 中容器是否处于 Running 状态
  kube_pod_container_status_ready             # Pod 中容器是否就绪，即通过 readinessProbe 探针
  kube_pod_container_status_restarts_total    # Pod 中容器的重启次数

  kube_deployment_spec_replicas               # 期待运行的实例数
  kube_deployment_status_replicas_available   # 实际可用的实例数
  kube_deployment_status_replicas_updated     # 最新版本的实例数
  kube_deployment_status_condition{condition="xx", status="true"}  # 是否处于某种状态

  kube_statefulset_replicas                   # 期待运行的实例数
  kube_statefulset_status_replicas_available  # 实际可用的实例数
  kube_statefulset_status_replicas_updated    # 最新版本的实例数

  kube_daemonset_status_desired_number_scheduled  # 期待运行的实例数
  kube_daemonset_status_number_available          # 实际可用的实例数
  kube_daemonset_status_updated_number_scheduled  # 最新版本的实例数

  kube_job_owner{owner_kind="CronJob", owner_name="xx"}  # 父资源
  kube_job_complete{condition="true"}         # 是否结束执行
  kube_job_failed{condition="true"}           # 结果是否失败
  kube_job_status_start_time                  # 开始时刻
  kube_job_status_completion_time             # 结束时刻
  kube_job_status_active                      # 正在运行的 Pod 实例数

  kube_cronjob_status_last_schedule_time      # 上次触发的时刻
  kube_cronjob_status_active                  # 正在运行的 Pod 实例数

  kube_endpoint_ports                         # 某个 service endpoint 的端口信息，比如 {port_name="mysql", port_number="3306", port_protocol="TCP"}
  kube_endpoint_address_available             # endpoint 的可用端点数
  kube_endpoint_address_not_ready             # endpoint 的不可用端点数

  kube_service_spec_type
  kube_service_status_load_balancer_ingress

  kube_persistentvolume_status_phase
  kube_persistentvolume_claim_ref             # PV 的使用者
  kube_persistentvolume_capacity_bytes        # PV 的容量
  kubelet_volume_stats_capacity_bytes         # volume 的容量
  kubelet_volume_stats_used_bytes             # volume 的使用量
  kube_persistentvolumeclaim_status_phase
  kube_persistentvolumeclaim_resource_requests_storage_bytes

  kube_horizontalpodautoscaler_status_current_replicas
  kube_horizontalpodautoscaler_status_desired_replicas
  kube_horizontalpodautoscaler_spec_min_replicas
  kube_horizontalpodautoscaler_spec_max_replicas
  kube_horizontalpodautoscaler_status_condition
  kube_horizontalpodautoscaler_spec_target_metric{metric_name="k8s_pod_mem_usage_bytes", metric_target_type="average"}
  ```

### mongodb_exporter

：用于监控 MongoDB 服务器。
- [GitHub](https://github.com/percona/mongodb_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    mongodb_exporter:
      container_name: mongodb_exporter
      image: bitnami/mongodb-exporter:0.37.0
      command:
        # - --web.listen-address=:9216
        # - --web.telemetry-path=/metrics
        # - --log.level=error
        - --mongodb.uri=mongodb://127.0.0.1:27017/admin
        - --mongodb.collstats-colls=db1.col1,db1.col2   # 监控指定集合的状态，可以只指定库名
        - --mongodb.indexstats-colls=db1.col1,db1.col2  # 监控指定索引的状态
        - --collect-all                                 # 启用全部监控指标，包括 dbstats、collstats、indexstats、replicasetstatus 等
        - --discovering-mode                            # 自动发现 collstats-colls、indexstats-colls 的数据库的其它集合
      restart: unless-stopped
      ports:
        - 9216:9216
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```
- 指标示例：
  ```sh
  # 关于 server status
  mongodb_up                                              # 服务器是否在线
  mongodb_ss_ok{cl_id="", cl_role="mongod", rs_state="0"} # 服务器是否正常运行，取值为 1、0 。标签中记录了 Cluster、ReplicaSet 的信息
  mongodb_ss_uptime                                       # 服务器的运行时长，单位为秒
  mongodb_ss_connections{conn_type="current"}             # 客户端连接数

  # 关于主机
  mongodb_sys_cpu_num_cpus                                # 主机的 CPU 核数

  # 关于 WiredTiger
  mongodb_ss_wt_cache_bytes_currently_in_the_cache        # 缓存的总量
  1 - delta(mongodb_ss_wt_cache_pages_read_into_cache[1m]) / delta(mongodb_ss_wt_cache_pages_requested_from_the_cache[1m])  # 缓存的命中率
  mongodb_ss_wt_cache_tracked_dirty_bytes_in_the_cache    # 缓存的 dirty 量

  # 关于 collection
  mongodb_collstats_storageStats_count{database="xx", collection="xx"}  # collection 全部文档的数量，不包括已标记为 deleted 的文档
  mongodb_collstats_storageStats_size                     # collection 全部文档的体积，单位 bytes
  mongodb_collstats_storageStats_storageSize              # collection 全部文档占用的磁盘空间，默认会压缩
  delta(mongodb_collstats_latencyStats_reads_ops[1m])     # collection 读操作的数量（每分钟）
  delta(mongodb_collstats_latencyStats_reads_latency[1m]) # collection 读操作的延迟（每分钟），单位为微秒
  mongodb_collstats_latencyStats_write_ops
  mongodb_collstats_latencyStats_write_latency

  # 关于 index
  mongodb_collstats_storageStats_nindexes                 # collection 的 index 数量
  mongodb_collstats_storageStats_totalIndexSize           # collection 的 index 占用的磁盘空间
  delta(mongodb_indexstats_accesses_ops[1m])   # index 被访问次数

  # 关于操作
  delta(mongodb_ss_opcounters[1m])                        # 执行各种操作的数量
  delta(mongodb_ss_opLatencies_latency[1m])               # 执行各种操作的延迟，单位为微秒
  delta(mongodb_ss_metrics_document[1m])                  # 各种文档的变化数量

  # 关于锁
  delta(mongodb_ss_locks_acquireCount{lock_mode="w"}[1m]) # 新加锁的数量。R 表示共享锁，W 表示独占锁，r 表示意向共享锁，w 表示意向独占锁
  mongodb_ss_globalLock_currentQueue{count_type="total"}  # 被锁阻塞的操作数
  ```

### mysqld_exporter

：用于监控 MySQL 服务器。
- [GitHub](https://github.com/prometheus/mysqld_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    mysqld_exporter:
      container_name: mysqld_exporter
      image: prom/mysqld-exporter:v0.13.0
      restart: unless-stopped
      # command:
      #   - --web.listen-address=:9104
      #   - --web.telemetry-path=/metrics
      environment:
        DATA_SOURCE_NAME: user:password@(10.0.0.1:3306)/
      ports:
        - 9104:9104
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```
  - 需要在 MySQL 中创建一个 exporter 用户：
    ```sql
    CREATE USER exporter@'%' IDENTIFIED BY '******';
    GRANT PROCESS, REPLICATION CLIENT ON *.* TO exporter@'%';
    ```

- 指标示例：
  ```sh
  # 关于服务器
  mysql_up                                              # 服务器是否在线
  mysql_global_status_uptime                            # 运行时长，单位 s
  delta(mysql_global_status_bytes_received[1m])         # 网络接收的 bytes
  delta(mysql_global_status_bytes_sent[1m])             # 网络发送的 bytes

  # 关于客户端
  mysql_global_status_threads_connected                 # 当前的客户端连接数
  mysql_global_variables_max_connections                # 允许的最大连接数
  mysql_global_status_threads_running                   # 正在执行命令的客户端连接数，即非 sleep 状态
  delta(mysql_global_status_aborted_connects[1m])       # 客户端建立连接失败的连接数，比如登录失败
  delta(mysql_global_status_aborted_clients[1m])        # 客户端连接之后，未正常关闭的连接数

  # 关于命令
  delta(mysql_global_status_commands_total{command="xx"}[1m]) > 0     # 每分钟各种命令的次数
  delta(mysql_global_status_handlers_total{handler="xx"}[1m]) > 0     # 每分钟各种操作的次数
  delta(mysql_global_status_handlers_total{handler="commit"}[1m]) > 0 # 每分钟 commit 的次数
  delta(mysql_global_status_table_locks_immediate[1m])  # 请求获取锁，且立即获得的请求数
  delta(mysql_global_status_table_locks_waited[1m])     # 请求获取锁，但需要等待的请求数。该值越少越好

  # 关于查询
  delta(mysql_global_status_queries[1m])                # 每分钟的查询数
  delta(mysql_global_status_slow_queries[1m])           # 慢查询数。如果未启用慢查询日志，则为 0
  mysql_global_status_innodb_page_size                  # innodb 数据页的大小，单位 bytes
  mysql_global_variables_innodb_buffer_pool_size        # innodb_buffer_pool 的限制体积
  mysql_global_status_buffer_pool_pages{state="data"}   # 包含数据的数据页数，包括洁页、脏页
  mysql_global_status_buffer_pool_dirty_pages           # 脏页数
  ```
  - 这些监控指标主要从 MySQL 的 `SHOW GLOBAL STATUS` 和 `SHOW GLOBAL VARIABLES` 命令获得。

### redis_exporter

：用于监控 Redis 服务器。
- [GitHub](https://github.com/oliver006/redis_exporter)
- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    redis_exporter:
      container_name: redis_exporter
      image: oliver006/redis_exporter:v1.43.0
      restart: unless-stopped
      environment:
        # REDIS_EXPORTER_WEB_LISTEN_ADDRESS: 0.0.0.0:9121
        # REDIS_EXPORTER_WEB_TELEMETRY_PATH: /metrics
        # REDIS_EXPORTER_LOG_FORMAT: txt        # 日志格式，默认为 txt ，可改为 json

        REDIS_ADDR: redis://10.0.0.1:6379
        # REDIS_USER: ***
        REDIS_PASSWORD: ******
        # REDIS_EXPORTER_IS_CLUSTER: 'false'    # 目标 redis 是否为集群模式
        # REDIS_EXPORTER_CHECK_SINGLE_KEYS: db0=test,db1=test   # 在指定 db 中基于 SCAN 命令查找一些 key ，然后监控它们的 value 的 size
        # REDIS_EXPORTER_CHECK_KEYS: db0=test*                  # 通过通配符，监控多个 key 的 value 的 size
        # REDIS_EXPORTER_COUNT_KEYS: db0=test*                  # 通过通配符，监控多个 key 的数量
      ports:
        - 9121:9121
      volumes:
        - /etc/localtime:/etc/localtime:ro
  ```

- 指标示例：
  ```sh
  # 关于服务器
  redis_up                                    # 服务器是否在线
  redis_uptime_in_seconds                     # 运行时长，单位 s
  rate(redis_cpu_sys_seconds_total[1m]) + rate(redis_cpu_user_seconds_total[1m])  # 占用 CPU 核数
  redis_memory_used_bytes                     # 占用内存量
  redis_memory_max_bytes                      # 限制的最大内存，如果没限制则为 0
  delta(redis_net_input_bytes_total[1m])      # 网络接收的 bytes
  delta(redis_net_output_bytes_total[1m])     # 网络发送的 bytes

  # 关于客户端
  redis_connected_clients                     # 客户端连接数
  redis_connected_clients / redis_config_maxclients # 连接数使用率
  redis_rejected_connections_total            # 拒绝的客户端连接数
  redis_connected_slaves                      # slave 连接数

  # 关于命令
  delta(redis_commands_total{cmd="xx"}[1m])   # 每分钟各种 command 的次数
  delta(redis_commands_duration_seconds_total{cmd="xx"}[1m])   # 每分钟各种 command 的耗时
  delta(redis_keyspace_hits_total[1m])        # 每分钟查询 hits 的次数
  delta(redis_keyspace_misses_total[1m])      # 每分钟查询 miss 的次数，与 hits 结合可计算命中率

  # 关于 db
  redis_db_keys{db="xx"}                      # 各个 db 的 key 数量，包括 expiring 状态的
  redis_db_keys_expiring                      # 已过期，尚未删除的 key 数量
  redis_db_avg_ttl_seconds                    # 各个 db 的平均 TTL

  # 关于 key
  delta(redis_expired_keys_total[1m])         # 每分钟过期的 key 数量
  redis_evicted_keys_total                    # 被 maxmemory-policy 驱逐的 key 数量
  redis_keys_count{db="db0", key="test*"}     # 根据 REDIS_EXPORTER_COUNT_KEYS 监控的 key 数量
  redis_key_size{db="db0", key="test*"}       # 根据 REDIS_EXPORTER_CHECK_SINGLE_KEYS 监控的 value 的 size
  ```
  - 这些监控指标主要从 Redis 的 `INFO` 命令获得。
