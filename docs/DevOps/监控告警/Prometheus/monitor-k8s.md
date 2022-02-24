# 监控 k8s

- k8s 本身集成了 exporter 格式的 API ，还可部署额外的监控工具。

## k8s 内置指标

### 配置

- 用 Prometheus 监控 k8s 时，需要在 k8s 中创建一个 RBAC 角色：
  ```yml
  apiVersion: v1
  kind: ServiceAccount
  metadata:
    name: prometheus
    namespace: ops
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: prometheus
  rules:
  - apiGroups: [""]
    resources:
    - nodes
    - nodes/metrics
    - services
    - endpoints
    - pods
    verbs:
    - get
    - list
    - watch
  - apiGroups:
    - networking.k8s.io
    resources:
    - ingresses
    verbs:
    - get
    - list
    - watch
  - nonResourceURLs:
    - /metrics
    verbs:
    - get
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: prometheus
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: prometheus
  subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: ops
  ```
  然后获取 ServiceAccount 对应的 secret 中的 ca.crt 和 token ：
  ```sh
  secret=`kubectl get secrets --namespace=ops | grep prometheus-token | awk '{print $1}'`
  kubectl get secrets --namespace=ops $secret -o yaml | yq '.data.token' | base64 -d > token
  ```
  尝试访问 API ：
  ```sh
  curl https://apiserver/metrics -H "Authorization: Bearer $(cat token)" -k
  ```

- 然后在 prometheus.yml 中添加配置：
  ```yml
  scrape_configs:
  - job_name: k8s-apiserver
    kubernetes_sd_configs:        # 从 k8s 的 HTTP API 获取配置
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
    # 通过 kubernetes_sd_configs 获取 target 之后，以下配置用于采集这些 target
    scheme: https
    authorization:
      credentials_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    tls_config:
      insecure_skip_verify: true
    relabel_configs:
    - source_labels:
        [
          __meta_kubernetes_namespace,
          __meta_kubernetes_service_name,
          __meta_kubernetes_endpoint_port_name,
        ]
      action: keep
      regex: default;kubernetes;https # 从所有 endpoints 中，筛选出 apiserver

  - job_name: k8s-node
    kubernetes_sd_configs:
    - role: node                      # 将 node_ip:kubelet_port 作为 target
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

    # - role: pod                     # 将 pod_ip:expose_port 作为 target
    # - role: service                 # 将 service_ip:expose_port 作为 target
    # - role: ingress                 # 将每个 ingress path 作为 target
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
  kubelet_evictions{eviction_signal="xx"}                                   # 发出的各种驱逐 pod 信号的次数
  kubelet_http_requests_total                                               # 各种 HTTP 请求的次数
  kubelet_http_requests_duration_seconds_sum
  kubelet_cgroup_manager_duration_seconds_count{operation_type="create"}    # Cgroup Manager 各种操作的次数
  kubelet_cgroup_manager_duration_seconds_sum
  kubelet_runtime_operations_duration_seconds_count{operation_type="xx"}    # 各种操作的次数
  kubelet_runtime_operations_duration_seconds_sum{operation_type="xx"}
  kubelet_runtime_operations_errors_total{operation_type="xx"}              # 各种操作出错的次数
  kubelet_running_pod_count
  kubelet_running_container_count{container_state="xx"}
  ```
