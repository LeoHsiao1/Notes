# 监控 k8s

- k8s 的 apiserver、kubelet 等组件本身集成了 exporter 格式的 API 。
- 用户也可部署额外的 exporter 服务：
  - cAdvisor ：kubelet 已经集成了 cadvisor ，可通过 /metrics/cadvisor 路径访问。
  - Heapster ：已淘汰。
  - metrics-server ：借鉴了 Heapster ，从 apiserver 获取 CPU、内存使用率等指标，供 HPA 调用。
  - kube-state-metrics ：从 apiserver 获取 node、pod 等资源的状态，生成 Metrics 。
- 相关工具：
  - Prometheus Operator ：用于在 k8s 中自动安装 Prometheus、Alertmanager、node_exporter 堆栈。
  - kube-prometheus ：调用 Prometheus Operator ，还会安装 kube-state-metrics、Grafana 。

## 集成指标

### 配置

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
  - job_name: k8s-apiserver
    kubernetes_sd_configs:        # 从 k8s 的 HTTP API 发现配置
    - role: endpoints             # 将每个 service endpoints 作为 target
      api_server: https://apiserver
      authorization:
        credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      tls_config:
        # ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        insecure_skip_verify: true
      # namespaces:               # 要监控的 namespace ，默认监控所有 namespace
      #   names:
      #   - default
    # - role: pod                 # 将 pod_ip:expose_port 作为 target
    # - role: service             # 将 service_ip:expose_port 作为 target
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
        [
          __meta_kubernetes_namespace,
          __meta_kubernetes_service_name,
          __meta_kubernetes_endpoint_port_name,
        ]
      regex: default;kubernetes;https
    # - action: replace             # 将 __meta* 标签重命名，从而被 Prometheus 保存
    #   source_labels: [__meta_kubernetes_pod_ip]
    #   target_label: pod_ip

  - job_name: k8s-node
    kubernetes_sd_configs:
    - role: node                  # 将 node_ip:kubelet_port 作为 target
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

  - job_name: k8s-cadvisor
    kubernetes_sd_configs:
    - role: node                  # 将 node_ip:kubelet_port 作为 target
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
  ```

### 指标

- 指标示例：
  ```sh
  # 关于 apiserver
  apiserver_request_duration_seconds_count      # 各种 HTTP 请求的次数
  apiserver_request_duration_seconds_sum        # 各种 HTTP 请求的耗时
  etcd_request_duration_seconds_count
  etcd_request_duration_seconds_sum

  # 关于 node
  kubernetes_build_info                                                     # k8s 版本信息
  kubelet_node_name{job="k8s-node", instance="10.0.0.1", node="10.0.0.1"}   # 在 label 中记录该 kubelet 所在的 node
  kubelet_container_log_filesystem_used_bytes                               # 每个 container 的日志占用的磁盘空间
  kubelet_cgroup_manager_duration_seconds_count{operation_type="create"}    # Cgroup Manager 各种操作的次数
  kubelet_cgroup_manager_duration_seconds_sum
  kubelet_evictions{eviction_signal="xx"}                                   # 发出的各种驱逐 pod 信号的次数
  kubelet_http_requests_total                                               # 各种 HTTP 请求的次数
  kubelet_http_requests_duration_seconds_sum
  kubelet_pleg_relist_duration_seconds_count                                # PLEG relist 的次数
  kubelet_pleg_relist_duration_seconds_sum
  kubelet_runtime_operations_duration_seconds_count{operation_type="xx"}    # 各种操作的次数
  kubelet_runtime_operations_duration_seconds_sum{operation_type="xx"}
  kubelet_runtime_operations_errors_total{operation_type="xx"}              # 各种操作出错的次数
  kubelet_running_pod_count
  kubelet_running_container_count{container_state="xx"}

  # 关于 cadvisor 的指标略
  ```

## kube-state-metrics

- [GitHub](https://github.com/kubernetes/kube-state-metrics)

### 部署

- 用官方配置文件部署：
  ```sh
  version=2.2.4
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

### 指标

- 指标示例：
  ```sh
  # 几种资源都存在的指标
  *_created                     # 资源的创建时间，取值为 Unix 时间戳
  *_metadata_resource_version   # 资源的 resourceVersion
  *_annotations
  *_labels

  # 各种资源
  kube_node_spec_unschedulable    # Node 是否不可调度
  kube_node_status_condition{condition="xx", status="true"}       # 是否处于某种状态
  kube_node_status_capacity{resource="cpu", unit="core"}          # node 各种资源的容量
  1 - kube_node_status_allocatable / kube_node_status_capacity    # 各种资源的使用率

  kube_pod_info
  kube_pod_owner{owner_kind="ReplicaSet", owner_name="xx"}  # 父资源
  kube_pod_status_scheduled{condition="true"} # Pod 是否已被调度
  kube_pod_status_scheduled_time              # Pod 被调度的时刻
  kube_pod_status_unschedulable               # 不能被调度的 Pod
  kube_pod_start_time
  kube_pod_completion_time
  kube_pod_status_phase{phase="xx"}           # Pod 是否处于某个生命周期
  kube_pod_status_ready{condition="true"}     # Pod 是否就绪
  kube_pod_status_reason{reason="xx"}         # Pod 处于当前状态的原因

  kube_pod_container_info{pod="xx", container="xx", image="xx"}     # Pod 中容器信息
  kube_pod_container_resource_requests{resource="cpu", unit="core"} # Pod 中容器的资源需求
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

  kube_daemonset_status_desired_number_scheduled    # 期待运行的实例数
  kube_daemonset_status_number_available            # 实际可用的实例数

  kube_job_owner{owner_kind="CronJob", owner_name="xx"}  # 父资源
  kube_job_complete{condition="true"}         # 是否结束执行
  kube_job_failed{condition="true"}           # 结果是否失败
  kube_job_status_start_time                  # 开始时刻
  kube_job_status_completion_time             # 结束时刻
  kube_job_status_active                      # 正在运行的 Pod 实例数

  kube_cronjob_status_last_schedule_time      # 上次触发的时刻
  kube_cronjob_status_active                  # 正在运行的 Pod 实例数

  kube_endpoint_address_available             # 可用的 endpoint 数量
  kube_endpoint_address_not_ready             # 不可用的 endpoint 数量

  kube_service_info
  kube_service_spec_type
  kube_service_status_load_balancer_ingress

  kube_horizontalpodautoscaler_status_current_replicas
  kube_horizontalpodautoscaler_status_desired_replicas
  kube_horizontalpodautoscaler_spec_min_replicas
  kube_horizontalpodautoscaler_spec_max_replicas
  kube_horizontalpodautoscaler_status_condition
  kube_horizontalpodautoscaler_spec_target_metric{metric_name="k8s_pod_mem_usage_bytes", metric_target_type="average"}
  ```
