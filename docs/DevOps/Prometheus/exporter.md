# exporter

- [官方及社区的 exporter 列表](https://prometheus.io/docs/instrumenting/exporters/)
- 主流软件大多提供了自己的 exporter 程序，比如 mysql_exporter、redis_exporter 。有的软件甚至本身就提供了 exporter 风格的 HTTP API 。

## Prometheus

- 本身提供了 exporter 风格的 API ，默认的 metrics_path 为 `/metrics` 。
- 在 Grafana 上显示指标时，可参考 Prometheus 数据源自带的 "Prometheus Stats" 仪表盘。
- 常用指标：
  ```sh
  prometheus_build_info{branch="HEAD", goversion="go1.14.2", instance="10.0.0.1:9090", job="prometheus", revision="ecee9c8abfd118f139014cb1b174b08db3f342cf", version="2.18.1"}  # 版本信息

  time() - process_start_time_seconds                             # 运行时长（s）
  irate(process_cpu_seconds_total[5m])                            # 占用 CPU 核数
  process_resident_memory_bytes                                   # 占用内存
  prometheus_tsdb_storage_blocks_bytes                            # tsdb block 占用的磁盘空间
  sum(increase(prometheus_http_requests_total[1m])) by (code)     # 每分钟收到 HTTP 请求的次数
  sum(increase(prometheus_http_request_duration_seconds_sum[1m])) # 每分钟处理 HTTP 请求的耗时（s）

  count(up == 1)                                                  # target 在线数
  sum(scrape_samples_scraped)                                     # scrape 的指标数
  sum(scrape_duration_seconds)                                    # scrape 的耗时（s）
  sum(increase(prometheus_rule_evaluations_total[1m])) without (rule_group)          # rule 每分钟的执行次数
  sum(increase(prometheus_rule_evaluation_failures_total[1m])) without (rule_group)  # rule 每分钟的执行失败次数
  irate(prometheus_rule_evaluation_duration_seconds_sum[5m])                         # rule 每分钟的执行耗时（s）

  ALERTS{alertname="xxx", alertstate="pending|firing"}            # 存在的警报
  ALERTS_FOR_STATE{alertname="xxx"}                               # 警报开始的时间戳（这是 pending 状态的开始时间，不能区分 firing 状态）
  ```

## Alertmanager

- 本身提供了 exporter 风格的 API ，默认的 metrics_path 为 `/metrics` 。
- 常用指标：
  ```sh
  alertmanager_build_info{branch="HEAD", goversion="go1.13.5", instance="10.0.0.1:9093", job="alertmanager", revision="f74be0400a6243d10bb53812d6fa408ad71ff32d", version="0.20.0"}   # 版本信息

  time() - process_start_time_seconds       # 运行时长（s）
  irate(process_cpu_seconds_total[5m])      # 占用 CPU 核数
  process_resident_memory_bytes             # 占用内存
  sum(increase(alertmanager_http_request_duration_seconds_sum[1m])) # 处理 HTTP 请求的耗时（s）

  alertmanager_alerts                       # 存在的警报数（包括激活的、被抑制的）
  alertmanager_silences{state="active"}     # Silences 数量
  alertmanager_notifications_total          # 发送的消息数
  alertmanager_notifications_failed_total   # 发送失败的消息数
  ```
  - 如果重启 Alertmanager ，则会使一些计数的指标归零。

## Grafana

- 本身提供了 exporter 风格的 API ，默认的 metrics_path 为 `/metrics` 。
  - 访问时不需要身份认证，但只提供了关于 Grafana 运行状态的指标。
- 在 Grafana 上显示指标时，可参考 Prometheus 数据源自带的 "Grafana metrics" 仪表盘。
- 常用指标：
  ```sh
  grafana_build_info{branch="HEAD", edition="oss", goversion="go1.14.1", instance="10.0.0.1:3000", job="grafana", revision="aee1438ff2", version="7.0.0"}  # 版本信息

  time() - process_start_time_seconds                        # 运行时长（s）
  irate(process_cpu_seconds_total[5m])                       # 占用 CPU 核数
  process_resident_memory_bytes                              # 占用内存
  sum(increase(http_request_total[1m])) by (statuscode)      # 每分钟收到 HTTP 请求的次数
  sum(increase(http_request_duration_milliseconds_sum[1m]))  # 每分钟处理 HTTP 请求的耗时（ms）

  grafana_alerting_active_alerts                             # Alert Rule 的数量
  increase(grafana_alerting_result_total[1h])                # 每小时的 Alert Rule 状态
  increase(grafana_alerting_notification_sent_total[1h])     # 每小时发出的告警次数
  ```

## Jenkins

- 安装插件 "Prometheus metrics" 可提供 exporter 风格的 API ，默认的 metrics_path 为 `/prometheus/` 。
  - 在 Jenkins 的 "Configure System" 页面可以对 "Prometheus" 栏进行配置。
  - 不能统计到安装该插件以前的 Jenkins 指标。
- 常用指标：
  ```sh
  time() - process_start_time_seconds     # 运行时长（s）
  irate(process_cpu_seconds_total[5m])    # 占用 CPU 核数
  process_resident_memory_bytes           # 占用内存
  increase(http_requests_count[1m])       # 每分钟收到 HTTP 请求的次数
  http_requests{quantile=~"0.5|0.99"}     # 每分钟处理 HTTP 请求的耗时（s）

  jenkins_node_count_value                # node 总数
  jenkins_node_online_value               # node 在线数
  jenkins_executor_count_value            # 执行器的总数
  jenkins_executor_in_use_value           # 执行器正在使用的数量
  jenkins_node_builds_count               # Jenkins 本次启动以来的构建总次数

  jenkins_job_count_value                 # Job 总数
  jenkins_queue_size_value                # 构建队列中的 Job 数（最好为 0 ）
  default_jenkins_builds_duration_milliseconds_summary_count{, jenkins_job='xxx'}  # Job 的构建总次数（当构建结束时才记录）
  default_jenkins_builds_duration_milliseconds_summary_sum{jenkins_job='xxx'}      # Job 的构建总耗时（包括被阻塞的时长）
  default_jenkins_builds_success_build_count{jenkins_job='xxx'}                    # Job 构建成功的次数
  default_jenkins_builds_failed_build_count{jenkins_job='xxx'}                     # Job 构建失败的次数
  default_jenkins_builds_last_build_start_time_milliseconds{jenkins_job='xxx'}     # Job 最后一次构建的开始时间
  default_jenkins_builds_last_build_duration_milliseconds{jenkins_job='xxx'}       # Job 最后一次构建的持续时长
  default_jenkins_builds_last_build_result{jenkins_job='xxx'}                      # Job 最后一次构建的结果（ 1 代表 success 、0 代表其它状态）
  ```
  - 如果删除某个 Job 的构建记录，则会使其总的构建次数减少。

## node_exporter

：用于监控类 Unix 主机的状态。
- [GitHub 页面](https://github.com/prometheus/node_exporter)
- 下载后启动：
  ```sh
  ./node_exporter
                 # --web.listen-address=":9100"
                 # --web.telemetry-path="/metrics"
  ```
  默认的访问地址为 <http://localhost:9100/metrics>

- 常用指标：
  ```sh
  node_exporter_build_info{branch="HEAD", goversion="go1.13.8", instance="10.0.0.1:9100", job="node_exporter", revision="ef7c05816adcb0e8923defe34e97f6afcce0a939", version="1.0.0-rc.0"}  # 版本信息
  node_uname_info{domainname="(none)", instance="10.0.0.1:9100", job="node_exporter", machine="x86_64", nodename="Centos-1", release="3.10.0-862.el7.x86_64", sysname="Linux", version="#1 SMP Fri Apr 20 16:44:24 UTC 2018"}  # 主机信息

  node_boot_time_seconds                      # 主机的启动时刻
  node_time_seconds                           # 主机的当前时间（Unix 时间戳）
  node_time_seconds - node_boot_time_seconds  # 主机的运行时长（s）
  node_time_seconds - time() + T              # 主机的时间误差，其中 T 是估计每次抓取及传输的耗时

  node_load1                                                                    # 每分钟的平均负载
  count(node_cpu_seconds_total{mode='idle'})                                    # CPU 核数
  avg(irate(node_cpu_seconds_total[5m])) without (cpu) * 100                    # CPU 各模式占比（%）
  (1 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) without(cpu)) * 100  # CPU 使用率（%）

  node_memory_MemTotal_bytes                  # 内存总量，单位 bytes
  node_memory_MemAvailable_bytes              # 内存可用量，CentOS 7 以上版本才支持该指标
  node_memory_SwapTotal_bytes                 # swap 内存总量
  node_memory_SwapFree_bytes                  # swap 内存可用量

  sum(node_filesystem_size_bytes{fstype=~`ext\d|xfs`, mountpoint!~`/boot`}) without(device, fstype, mountpoint)  # 磁盘总量
  sum(node_filesystem_avail_bytes{fstype=~`ext\d|xfs`, mountpoint!~`/boot`}) without(device, fstype, mountpoint) # 磁盘可用量

  sum(irate(node_disk_read_bytes_total[5m]))                         # 磁盘每秒读取量
  sum(irate(node_disk_written_bytes_total[5m]))                      # 磁盘每秒写入量

  irate(node_network_receive_bytes_total{device!~`lo|docker0`}[5m])  # 网卡每秒接收量
  irate(node_network_transmit_bytes_total{device!~`lo|docker0`}[5m]) # 网卡每秒发送量

  node_network_info{address="00:60:F6:71:20:18",broadcast="ff:ff:ff:ff:ff:ff",device="eth0",duplex="full",ifalias="",operstate="up"} # 网卡的信息（broadcast 是广播地址，duplex 是双工模式，）
  node_network_up                             # 网卡的状态（取值 1、0 表示是否正在启用）
  node_network_mtu_bytes                      # MTU 大小

  # 关于 IP 协议
  node_network_receive_packets_total          # 网卡接收的数据包数
  node_network_receive_errs_total             # 网卡接收的错误包数
  node_network_receive_drop_total             # 网卡接收时的丢弃包数
  node_network_receive_compressed_total       # 网卡接收的压缩包数
  node_network_receive_multicast_total        # 网卡接收的多播包数
  node_network_transmit_packets_total         # 网卡发送的数据包数
  node_network_transmit_errs_total
  node_network_transmit_drop_total
  node_network_transmit_compressed_total
  node_netstat_Icmp_InMsgs                    # 接收的 ICMP 包数
  node_netstat_Icmp_InErrors                  # 接收的 ICMP 错误包数
  node_netstat_Icmp_OutMsgs                   # 发送的 ICMP 包数

  # 关于 Socket
  node_sockstat_sockets_used                  # 使用的 Socket 数
  node_sockstat_TCP_inuse                     # 监听的 TCP Socket 数
  node_sockstat_TCP_tw


  # 关于 TCP/UDP 协议
  node_netstat_Tcp_CurrEstab                  # ESTABLISHED 加 CLOSE_WAIT 状态的 TCP 连接数
  node_netstat_Tcp_InSegs                     # 接收的 TCP 包数（包括错误的）
  node_netstat_Tcp_InErrs                     # 接收的 TCP 错误包数（比如校验和错误）
  node_netstat_Tcp_OutSegs                    # 发送的 TCP 包数
  node_netstat_Udp_InDatagrams                # 接收的 UDP 包数
  node_netstat_Udp_InErrors                   # 接收的 UDP 错误包数
  node_netstat_Udp_OutDatagrams               # 发送的 UDP 包数
  ```

## process-exporter

：用于监控 Linux 主机上的进程、线程的状态。
- [GitHub 页面](https://github.com/ncabatoff/process-exporter)
- 它主要通过读取 `/proc/<pid>/` 目录下的信息，来收集进程指标。
- 下载后启动：
  ```sh
  ./process-exporter -config.path=process-exporter.yml
                    # -web.listen-address :9256
                    # -web.telemetry-path /metrics
                     -children=false             # 采集每个进程的指标时，是否包含其所有子进程的指标（默认为 true）
                     -threads=false              # 是否采集每个线程的指标（默认为 true）
  ```

- 在配置文件中定义要监控的进程：
    ```yaml
    process_names:
    - exe:                            # 定义多行条件，每个条件可能匹配零个、一个或多个进程
      - top
      - /bin/ping

    - comm:
      - bash

    - name: "{{.ExeBase}}"            # 这里使用可执行文件的基本名作为 name
      cmdline:
      - prometheus --config.file

    - name: "{{.Matches.name}}"       # 这里使用正则匹配的元素组作为 name
      cmdline:
      - ping www.(?P<name>\S*).com    # 用 ?P<name> 的格式命名正则匹配的元素组
    ```
    - 关于匹配规则：
      - exe 是对进程的 `/proc/<PID>/exe` 指向的可执行文件名进行匹配（必须完全相同）。
      - comm 是对进程的 `/proc/<PID>/comm` 进行匹配（必须完全相同）。
      - cmdline 是对进程的 `/proc/<PID>/cmdline` 进行正则匹配（只要匹配部分字符串即可，与 grep 类似）。
      - exe、comm 可以同时定义多行匹配条件，而 cmdline 同时只能定义一行条件，否则不会被执行。
      - exe、comm 会自动使用匹配条件作为被匹配的进程的名称，并用作监控指标的 groupname 。而 cmdline 需要手动设置 name 。
    - 已经被匹配的进程不会被之后的条件重复匹配。
    - 执行以下命令可查看当前监控的进程：
      ```sh
      curl 127.0.0.1:9256/metrics | grep num_procs
      ```
- 常用指标：
  ```sh
  namedprocess_scrape_errors                                                # 抓取时的错误数

  namedprocess_namegroup_num_procs                                          # 进程数（统计属于同一个 groupname 的进程实例数量）
  timestamp(namedprocess_namegroup_oldest_start_time_seconds) - (namedprocess_namegroup_oldest_start_time_seconds>0)  # 同一个 groupname 中最老的那个进程的运行时长（ s ）
  sum(irate(namedprocess_namegroup_cpu_seconds_total[5m])) without (mode)   # 进程占用的 CPU 核数
  namedprocess_namegroup_memory_bytes{memtype="resident"}                   # 进程占用的内存
  irate(namedprocess_namegroup_read_bytes_total[5m])                        # 进程的磁盘每秒读取量
  irate(namedprocess_namegroup_write_bytes_total[5m])                       # 进程的磁盘每秒写入量

  namedprocess_namegroup_num_threads                                        # 进程包含的线程数
  namedprocess_namegroup_states{state="Sleeping"}                           # Sleeping 状态的线程数
  namedprocess_namegroup_open_filedesc                                      # 打开的文件描述符数量

  namedprocess_namegroup_thread_count{groupname="python", threadname="thread-1"}  # 指定进程包含的，同一名称的线程数
  sum(irate(namedprocess_namegroup_thread_cpu_seconds_total[5m])) without (mode)  # 线程占用的 CPU 核数
  irate(namedprocess_namegroup_thread_io_bytes_total{iomode="read"}[5m])          # 线程的磁盘每秒读取量
  irate(namedprocess_namegroup_thread_io_bytes_total{iomode="write"}[5m])         # 线程的磁盘每秒写入量
  ```
  - 当 process-exporter 发现进程 A 之后，就会一直记录它的指标。即使进程 A 停止，也会记录它的 namedprocess_namegroup_num_procs 为 0 。
    - 但是如果重启 process-exporter ，则只会发现此时存在的进程，不会再记录进程 A 。\
      例如：如果主机重启之后，进程没有启动，则它不能发现进程没有恢复，不会发出警报。
  - 不能监控进程的网络 IO 。

## windows_exporter

：用于监控 Windows 主机的状态，也可监控其进程的状态。
- [GitHub 页面](https://github.com/prometheus-community/windows_exporter)
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

- 常用指标：
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
  irate(windows_logical_disk_read_bytes_total[5m])                        # 磁盘每秒读取量
  irate(windows_logical_disk_write_bytes_total[5m])                       # 磁盘每秒写入量

  # net collector
  irate(windows_net_bytes_received_total{nic="xxx"}[5m])                  # 网卡每秒接收量
  irate(windows_net_bytes_sent_total{nic="xxx"}[5m])                      # 网卡每秒发送量

  # process collector
  timestamp(windows_process_start_time) - (windows_process_start_time>0)  # 进程的运行时长
  sum(irate(windows_process_cpu_time_total[5m])) without (mode)           # 进程占用的 CPU 核数
  windows_process_private_bytes                                           # 进程独占的内存，即进程总共提交的内存，包括物理内存、虚拟内存
  windows_process_working_set                                             # 进程可用的内存，包括独占的内存、与其它进程的共享内存
  windows_process_thread_count                                            # 进程的线程数
  windows_process_io_bytes_total                                          # 进程的 handle 数量
  ```
  - 当 windows_exporter 发现进程 A 之后，就会一直记录它的指标。但是如果进程 A 停止，则不会再记录它的指标。
  - 不能监控进程的网络 IO 。
  - 不能通过启动命令区分相同名字的进程，只能通过 PID 区分。

## cAdvisor

：用于监控容器的状态。
- [GitHub 页面](https://github.com/google/cadvisor)
- 该工具由 Google 公司开发，支持将监控数据输出到 Prometheus、InfluxDB、Kafka、ES 等存储服务。
- 下载后启动：
  ```sh
  ./cadvisor
            # --listen_ip 0.0.0.0
            # --port 8080
            # --prometheus_endpoint  /metrics
            --docker_only=true    # 不输出 raw cgourp 的指标，除了 root gourp ，即 id="/"
  ```
- 它提供了 Web 监控页面，默认只允许从 localhost 访问，可以加上 HTTP Basic Auth 后公开：
  ```sh
  htpasswd -cb passwd admin 123456
  ./cadvisor --http_auth_file passwd --http_auth_realm 0.0.0.0
  ```
  访问地址为 `127.0.0.1:8080/containers/` 。
- 常用指标：
  ```sh
  container_start_time_seconds{container_label_maintainer="NGINX Docker Maintainers <docker-maint@nginx.com>", id="/docker/e2b21f73d372c59a5cc6c5180ae1325c9d8c3e9a211087db036228ffa5b54b43",
  image="nginx:latest", instance="10.0.0.1:8080", job="cadvisor", name="nginx"}   # 容器的创建时刻（不是启动时刻），采用 Unix 时间戳

  container_cpu_usage_seconds_total         # 容器占用 CPU 的累计时长
  container_cpu_load_average_10s            # 容器占用 CPU 的 10 秒平均负载

  container_memory_rss                      # 容器占用的 rss 内存大小
  container_memory_swap                     # 容器占用的 swap 大小

  container_fs_reads_total                  # 磁盘读的累计字节数
  container_fs_read_seconds_total           # 磁盘读的累计耗时
  container_fs_writes_bytes_total           # 磁盘写的累计字节数
  container_fs_write_seconds_total          # 磁盘写的累计耗时

  container_network_receive_bytes_total     # 网卡接收的累计字节量
  container_network_receive_packets_total   # 网卡接收的累计数据包数
  container_network_transmit_bytes_total    # 网卡发送的累计字节量
  container_network_transmit_packets_total  # 网卡发送的累计数据包数
  ```

## blackbox_exporter

：相当于探针（probe），可以监控 DNS、ICMP、TCP、HTTP 状态，以及 SSL 证书过期时间。
- [GitHub 页面](https://github.com/prometheus/blackbox_exporter)
- 下载后启动：
  ```sh
  ./blackbox_exporter
                # --config.file blackbox.yml
                # --web.listen-address :9115
  ```
- HTTP 请求示例：
  使用 icmp 模块，检测目标主机能否 ping 通（同时也会检测出 DNS 耗时）
  ```sh
  curl 'http://localhost:9115/probe?module=icmp&target=baidu.com'
  ```

  使用 tcp_connect 模块，检测目标主机的 TCP 端口能否连接
  ```sh
  curl 'http://localhost:9115/probe?module=tcp_connect&target=baidu.com:80'
  ```

  使用 http_2xx 模块，检测目标网站的 HTTP 响应是否为 200
  ```sh
  curl 'http://localhost:9115/probe?module=http_2xx&target=http://baidu.com'
  ```

- 在 Prometheus 中的配置示例：
  ```yml
  - job_name: blackbox_exporter
    metrics_path: /probe
    params:
      module: [icmp]
    static_configs:
      - targets: ['10.0.0.2']
        labels:
          instance: '10.0.0.2'
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - target_label: __address__
        replacement: '10.0.0.1:9115'  # 填入 blackbox_exporter 的 IP 和端口
  ```
  Prometheus 会将 scrape_timeout 用作探测的超时时间。

- 常用指标：
  ```sh
  probe_success                   # 是否探测成功（取值 1、0 分别表示成功、失败）
  probe_duration_seconds          # 本次探测的耗时
  probe_dns_lookup_time_seconds   # 查找 DNS 的耗时

  probe_http_status_code          # HTTP 响应报文的状态码
  probe_http_content_length       # HTTP 响应报文的长度（bytes）
  ```

## kafka_exporter

：用于监控 Kafka 的状态。
- [GitHub 页面](https://github.com/danielqsj/kafka_exporter)
- 下载后启动：
  ```sh
  ./kafka_exporter
                --web.listen-address :9308
                --web.telemetry-path /metrics
                --kafka.server kafka:9092
                --sasl.username xx
                --sasl.password ******
                --topic.filter  .*    # 通过正则表达式筛选要监控的 topic
                --group.filter  .*
  ```
- 常用指标：
  ```sh
  kafka_brokers                                                               # 该 Kafka 集群的 broker 数量
  kafka_topic_partitions{topic="xx"}                                          # partition 数量
  kafka_topic_partition_replicas{topic="xx", partition="x"}                   # partition 的副本数
  kafka_topic_partition_in_sync_replica{topic="xx", partition="x"}            # partition 的已经同步的副本数
  kafka_topic_partition_under_replicated_partition{topic="xx", partition="x"} # partition 是否有没有同步的副本

  kafka_topic_partition_leader{topic="xx", partition="x"}                     # partition 的 leader 的 ID
  kafka_topic_partition_leader_is_preferred{topic="xx", partition="x"}        # partition 的 leader 是否为 preferred replica
  kafka_topic_partition_current_offset{topic="xx", partition="x"}             # partition 的当前偏移量
  kafka_topic_partition_oldest_offset{topic="xx", partition="x"}              # partition 的最后偏移量
  kafka_consumergroup_current_offset{consumergroup="xx", topic="xx", partition="x"}   # 某个 consumergroup 在某个 partition 的偏移量
  kafka_consumergroup_lag{consumergroup="xx", topic="xx", partition="x"}      # 某个 consumergroup 在某个 partition 的滞后量
  ```

## elasticsearch_exporter

：用于监控 ES 服务器的状态。
- [GitHub 页面](https://github.com/justwatchcom/elasticsearch_exporter)
- 下载后启动：
  ```sh
  ./elasticsearch_exporter
                --web.listen-address :9114
                --web.telemetry-path /metrics
                --es.uri http://localhost:9200  # ES 的 URL
                --es.all false                  # 是否采集 ES 集群中所有节点的信息（默认只采集当前节点）
                --es.cluster_settings false     # 是否采集集群的设置信息
                --es.indices false              # 是否采集 index 的信息
                --es.indices_settings false     # 是否采集 index 的设置信息
                --es.shards false               # 是否采集 shard 的信息
                --es.snapshots false            # 是否采集 snapshot 的信息
                --es.timeout 5s                 # 从 ES 采集信息的超时时间
  ```
- 常用指标：
  ```sh
  elasticsearch_exporter_build_info{branch="master", goversion="go1.12.3", instance="10.0.0.1:9114", job="elasticsearch_exporter", revision="fe20e499ffdd6053e6153bac15eae494e08931df", version="1.1.0"}  # 版本信息

  elasticsearch_cluster_health_status{color="green"}        # 集群状态是否为 green
  # 详见 Github 页面上的说明
  ```
