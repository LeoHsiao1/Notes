# kube-vip

：一个 k8s 插件，用于为 LoadBalancer Service 绑定内网 VIP 。
- [GitHub](https://github.com/kube-vip/kube-vip)
- k8s 原生创建的 Cluster IP 只能在 k8s 集群内访问，在 k8s 集群外主机找不到访问 Cluster IP 的路由。而 kube-vip 可创建一些 Virtual IP ，简称为 VIP ，并将 VIP 基于 ARP 或 BGP 模式暴露到 k8s 集群外。
- 公有云平台一般不支持传播 ARP、BGP 消息。因此在其中部署的 k8s 集群不能使用 kube-vip 。

## 原理

- ARP 模式
  - 工作在 OSI 第二层，类似于 keepalived ，原理如下：
    - kube-vip 会监听 k8s 里 LoadBalancer Service 的变化，如果配置了 `metadata.annotations["kube-vip.io/loadbalancerIPs"]` 或 `spec.loadBalancerIP` ，则为其绑定 VIP 。
    - leader 节点会广播 Gratuitous ARP 消息，将 VIP 解析到自己的 Mac 地址。用户访问 VIP 的流量，会先到达 leader 节点，然后交给 kube-proxy 路由转发。
  - 在多个主机上分别部署一个 kube-vip 节点，使用 k8s Lease 对象进行选举：谁持有 Lease 对象，谁就担任 leader 角色。
  - 默认情况下，kube-vip 会创建两个 Lease 对象，对应两个 leader 节点：
    - plndr-cp-lock ：持有它的 leader 节点会管理一个 VIP ，用于反向代理 apiserver 。此处的 plndr 是开发者的名称。
    - plndr-svcs-lock ：持有它的 leader 节点会管理所有 LoadBalancer service 的 VIP 。此时这些 VIP 的流量都经过该 leader 节点，容易遇到性能瓶颈、切换 leader 的耗时久。
  - 可配置环境变量 `svc_election=true` ，这会对于每个 LoadBalancer service ，分别选举一个 leader 节点，接收该 VIP 的流量。
    - 此时每个 kube-vip 节点都会监听所有 namespace 的 LoadBalancer Service 。如果发现某个 LoadBalancer Service 变化，则会在该 Service 所属的 namespace 中创建一个 Lease 对象，命名格式为 `	kubevip-<service>` ，成功获取该 Lease 对象的 kube-vip 节点会担任 leader 。
    - 此时还支持在 LoadBalancer Service 中配置 `externalTrafficPolicy: Local` ，只允许部署了相关 Pod 的节点参与 leader 选举。
  - 目前缺陷：
    - https://github.com/kube-vip/kube-vip/issues/590 删除 Service 时，不会自动删除对应的 Lease 对象
    - https://github.com/kube-vip/kube-vip/issues/563
    - https://github.com/kube-vip/kube-vip/issues/577

- BGP 模式
  - 工作在 OSI 第三层。
  - 部署多个 kube-vip 节点，每个节点担任一个路由器。
    - 每个节点都会将所有 VIP 绑定到宿主机的网口。
    - 每个节点都会对外通告 VIP 路由，不需要选举 leader 。
  - 目前缺陷：
    - 停止部署 kube-vip ，不会自动删除宿主机网口绑定的 VIP 。

## 部署

- 以 daemonset 方式部署 kube-vip ，采用 ARP 模式，配置示例：
  ```yml
  apiVersion: v1
  kind: ServiceAccount
  metadata:
    name: kube-vip
    namespace: kube-system

  ---

  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    annotations:
      rbac.authorization.kubernetes.io/autoupdate: "true"
    name: system:kube-vip-role
  rules:
    - apiGroups: [""]
      resources: ["services", "services/status", "nodes", "endpoints"]
      verbs: ["list","get","watch", "update"]
    - apiGroups: ["coordination.k8s.io"]
      resources: ["leases"]
      verbs: ["list", "get", "watch", "update", "create"]

  ---

  kind: ClusterRoleBinding
  apiVersion: rbac.authorization.k8s.io/v1
  metadata:
    name: system:kube-vip-binding
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: system:kube-vip-role
  subjects:
  - kind: ServiceAccount
    name: kube-vip
    namespace: kube-system

  ---

  apiVersion: apps/v1
  kind: DaemonSet
  metadata:
    name: kube-vip
    namespace: kube-system
  spec:
    revisionHistoryLimit: 10
    selector:
      matchLabels:
        name: kube-vip
    template:
      metadata:
        creationTimestamp: null
        labels:
          name: kube-vip
      spec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: node-role.kubernetes.io/controlplane
                  operator: Exists  # 将 kube-vip 部署在 k8s 每个控制平面节点上
        containers:
        - args:
          - manager
          env:
          - name: vip_interface   # 使用宿主机的哪个网口
            value: eth0
          - name: vip_cidr        # VIP 的子网掩码长度
            value: "32"

          - name: cp_enable       # 是否让 kube-vip 默认反向代理 control plane 即 apiserver ，访问地址为 10.0.0.10:6443
            value: "false"
          # - name: address       # 给 kube-vip 本身绑定一个 VIP ，主要用于反向代理 apiserver
          #   value: 10.0.0.10
          # - name: port          # 反向代理 apiserver 时，监听的端口
          #   value: "6443"

          - name: cp_namespace    # apiserver 所在的命名空间，默认在此创建 Lease 对象
            value: kube-system
          - name: svc_enable      # 是否让 kube-vip 反向代理 LoadBalancer Service
            value: "true"

          - name: vip_arp               # 采用 ARP 模式
            value: "true"
          - name: vip_leaderelection    # 对于 ARP 模式，开启 leader 选举
            value: "true"
          - name: svc_election          # 为每个 service 选举一个 leader ，目前该功能还有缺陷，因此不启用
            value: "false"

          # - name: vip_leaseduration   # 配置 Lease 对象的 LeaseDuration
          #   value: "5"
          # - name: vip_renewdeadline   # 配置 Lease 对象的 RenewDeadline
          #   value: "3"
          # - name: vip_retryperiod     # 配置 Lease 对象的 RetryPeriod
          #   value: "1"
          image: plndr/kube-vip:v0.6.1
          imagePullPolicy: IfNotPresent
          name: kube-vip
          securityContext:
            capabilities:
              add:
              - NET_ADMIN
              - NET_RAW
              - SYS_TIME
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
        dnsPolicy: ClusterFirst
        hostNetwork: true
        restartPolicy: Always
        schedulerName: default-scheduler
        serviceAccount: kube-vip
        serviceAccountName: kube-vip
        terminationGracePeriodSeconds: 30
    updateStrategy:
      rollingUpdate:
        maxSurge: 0
        maxUnavailable: 1
      type: RollingUpdate
  ```

  - kube-vip 启动时的日志示例：
    ```sh
    time="2023-08-12T06:28:03Z" level=info msg="Starting kube-vip.io [v0.6.0]"
    time="2023-08-12T06:28:03Z" level=info msg="namespace [kube-system], Mode: [ARP], Features(s): Control Plane:[true], Services:[true]"
    time="2023-08-12T06:28:03Z" level=info msg="prometheus HTTP server started"
    time="2023-08-12T06:28:03Z" level=info msg="Starting Kube-vip Manager with the ARP engine"
    time="2023-08-12T06:28:03Z" level=info msg="Beginning cluster membership, namespace [kube-system], lock name [plndr-cp-lock], id [node-1]"  # 开始反向代理 apiserver 的 leader 选举
    I0818 06:28:03.808814 1 leaderelection.go:245] attempting to acquire leader lease kube-system/plndr-cp-lock...      # 尝试获取 Lease 对象
    time="2023-08-12T06:28:03Z" level=info msg="new leader elected: node-2"   # 当选 leader 节点的是 node-2
    ```
  - 新建一个 LoadBalancer Service ：
    ```yml
    apiVersion: v1
    kind: Service
    metadata:
      annotations:
        kube-vip.io/loadbalancerIPs: 10.0.0.10
        # kube-vip.io/vipHost: node-1   # 管理该 VIP 的 leader 节点的主机名，每次 leader 选举之后会变化
      name: nginx
      namespace: default
    spec:
      ports:
      - name: http
        port: 80
        protocol: TCP
        targetPort: 80
      selector:
        k8s-app: nginx
      sessionAffinity: None
      type: LoadBalancer
    ```
    此时 leader 节点会打印日志：
    ```sh
    time="2023-08-12T06:32:20Z" level=info msg="[service] adding VIP [10.0.0.10] for [default/nginx]"
    time="2023-08-12T06:32:20Z" level=info msg="[service] synchronised in 37ms"
    ```
    在 leader 节点所在主机执行命令 `ip addr show eth0` ，可见 VIP 绑定到了宿主机网口。

- 让 kube-vip 采用 BGP 模式时，只需修改上例的环境变量：
  ```yml
  env:
  - name: vip_interface
    value: eth0
  - name: vip_cidr
    value: "32"
  - name: cp_enable
    value: "false"
  - name: cp_namespace
    value: kube-system
  - name: svc_enable
    value: "true"

  - name: bgp_enable            # 采用 BGP 模式
    value: "true"
  - name: bgp_routerinterface   # 参与 BGP 对等连接的每个 kube-vip 节点需要分配不同的 routerID ，这里采用宿主机网口的 IP
    value: eth0
  - name: bgp_as                # 当前 AS 域的编号
    value: "65001"
  - name: bgp_peeras            # 对等连接到另一个 AS 域，向它们通告 VIP 路由。比如连接到当前机房的路由器
    value: "65000"
  - name: bgp_peers             # 对等连接到另一个 AS 域的路由器
    value: 10.0.1.1:65000::false,10.0.1.2:65000::false
  ```
  - 在任一主机执行命令 `ip addr show eth0` ，可见 VIP 绑定到了宿主机网口。
