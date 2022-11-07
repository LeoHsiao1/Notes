# Network

## IP

- k8s 集群内会使用一些虚拟 IP ，称为 Virtual IP、VIP、Cluster IP 。
- 部署 k8s 集群时，通常需要创建两个 CIDR 子网：
  - service_cidr ：比如 `10.43.0.0/16`，从中选取 Cluster IP 分配给各个 Service 使用。
  - pod_cidr ：比如 `10.42.0.0/16` ，从中选取 Cluster IP 分配给各个 Pod 使用。
    - k8s 会先将 pod_cidr 拆分成一些小的 CIDR 子网，比如 `10.42.0.0/24`、`10.42.1.0/24` ，分配给各个 Node 。然后每当一个 Pod 调度到一个 Node 时，从该 Node 的 CIDR 中选取一个 Cluster IP ，绑定到该 Pod 的虚拟网卡。
    - 假设一个 Node 管理的 CIDR 子网为 `10.42.1.0/24` ，则可将 10.42.1.1、10.42.1.2 等 Cluster IP 分配给 Pod 。
      - 调度到该 Node 的 Pod 数量，不能超过 Pod CIDR 子网容量。
      - Pod CIDR 的网络号 10.42.1.0 会分配给该 Node 本身使用，因此在 k8s 集群内访问该 IP 的网络流量会被转发到该 Node 。

- k8s 几种资源对象的 IP ：
  - Node IP
    - ：k8s 集群中主机节点的 IP 。
    - 每个 Node 原本有一个 eth0 物理网卡，其上绑定一个内网 IP ，用于与 k8s 集群外的主机通信。
    - 部署 kube-proxy 之后，每个 Node 会增加一个虚拟网卡，其上绑定当前 Pod CIDR 的网络号，用于与 k8s 集群内的 Cluster IP 通信。
    - 例：查看 Node 的网卡
      ```sh
      [root@CentOS ~]# ip addr
      2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
          link/ether 52:04:c0:02:93:ba brd ff:ff:ff:ff:ff:ff
          inet 10.0.0.2/24 brd 10.0.0.255 scope global eth0
            valid_lft forever preferred_lft forever
      38: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default
          link/ether 42:d8:57:9b:11:26 brd ff:ff:ff:ff:ff:ff
          inet 10.42.1.0/32 brd 10.42.1.0 scope global flannel.1
            valid_lft forever preferred_lft forever
      ...
      ```
  - Pod IP
    - ：分配给 Pod 使用的 Cluster IP 。
    - 一个应用可以部署多个 Pod 实例，每个 Pod 绑定不同的 Pod IP 。
      - 重新部署应用时，会创建新 Pod ，分配新 Pod IP 。因此 Pod IP 不固定，不方便访问，通常通过 Service 或 Ingress 访问应用。
    - Pod IP 支持 TCP/UDP 通信。也支持 ICMP 通信，因为绑定了一个虚拟网卡，能在一定程度上模拟一个主机。
    - 例：在 Pod 内查看网卡
      ```sh
      curl-7bc27a5d69-p62tl:/$ ip addr
      1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1000
          link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
          inet 127.0.0.1/8 scope host lo
            valid_lft forever preferred_lft forever
      3: eth0@if2311: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue state UP
          link/ether 56:b3:d8:40:13:c0 brd ff:ff:ff:ff:ff:ff
          inet 10.42.1.5/32 brd 10.42.1.5 scope global eth0
            valid_lft forever preferred_lft forever
      ```
  - Service IP
    - ：分配给 Service 使用的 Cluster IP 。
    - Service IP 支持 TCP/UDP 通信，然后反向代理到 Pod 。不支持 ICMP 通信，因此不能被 ping 通。

### 路由

- 在 k8s 集群的任一主机或容器内，都可以访问到 Cluster IP ，因为 kube-proxy 会自动路由转发网络流量，并进行 NAT 转换。
  - 在 k8s 集群外的主机上则访问不到 Cluster IP ，因为缺乏路由。

- 假设 k8s 集群有以下主机：
  ```sh
  主机名     eth0 IP     Pod CIDR
  node-1    10.0.0.1    10.42.0.0/24
  node-2    10.0.0.2    10.42.1.0/24
  node-3    10.0.0.3    不在 k8s 集群中，但与 node-1、node-2 在同一内网
  ```
  - 在 node-2 上执行 `ssh 10.0.0.1` 可以登录到 node-1 ，此时网络流量的源 IP 为 10.0.0.2 。
  - 在 node-2 上执行 `ssh 10.42.0.0` 也可以登录到 node-1 ，此时网络流量的源 IP 为 10.42.1.0 ，即 node-2 的 Pod CIDR 的网络号。
  - 在 node-3 上执行 `ssh 10.0.0.2` 可以访问到 node-2 ，但执行 `ssh 10.42.1.0` 会找不到路由。

k8s 常见的几种网络通信：
- 从 node 发起的通信
  - 假设从 node-1 访问 node-2 ，发送 IP 协议的数据包：
    - 如果访问 node-2 的 eth0 IP ，则数据包不经过 kube-proxy 转发，源 IP 为 node-1 的 eth0 IP 。
    - 如果访问 node-2 的 Cluster IP ，则数据包会经过 kube-proxy 转发，源 IP 为 node-1 的 Cluster IP 。
  - 假设从 node-1 访问一个 Pod 或 Service ：
    - 如果目标 Pod 或 Service 位于当前主机，则不必转发数据包，源 IP 不变。
    - 如果目标 Pod 或 Service 位于其它 k8s 主机，则先将数据包转发到目标主机，源 IP 变为 node-1 的 Cluster IP 。

- 同一个 Pod 中，容器之间的通信
  - 同一个 Pod 中的所有容器共用一个虚拟网卡、network namespace、Pod IP ，相当于在同一个主机上运行的多个进程。
  - 假设从 container-1 访问 container-2 ，则数据包的源 IP 、目标 IP 都是当前 Pod IP 。
  - 假设 container-2 监听 TCP 80 端口，则 container-1 可执行 `curl 127.0.0.1:80` 访问到 container-2 的端口。

- Pod 访问 Pod 的通信
  - 每个 Pod 绑定了一个 Cluster IP ，因此可通过 Cluster IP 相互访问。
  - 假设从 Pod A 访问 Pob B ，则流程如下：
    1. Pod A 中某个容器，从该 Pod 的 eth0 网口发出数据包，被传输到宿主机的 veth 网口。
        - Pod 与宿主机之间通过 veth pair 虚拟网口传递数据包，详见 Docker 网络。
    2. Pod A 的宿主机收到数据包，转发给 Pod B 的宿主机。
        - kube-proxy 事先配置了路由规则：如果数据包的目标 IP 是属于某 Pod CIDR 子网的 Cluster IP ，则路由转发到管理该 Pod CIDR 子网的那个 Node 。
        - 路由转发时，kube-proxy 会进行 NAT 转换，保持数据包的源 IP 为 Pod A 的 Cluster IP ，目标 IP 为 Pod B 的 Cluster IP 。
    3. Pod B 的宿主机收到数据包，通过 veth 网口传输给 Pod B 。
        - 综上，如果 Pod A 与 Pod B 位于不同宿主机，则数据包会经过两次路由转发。
    4. Pod B 中某个容器，从该 Pod 的 eth0 网口收到数据包。

- Pod 访问 Service 的通信
  - 假设从 Pod A 访问 Service A ，则流程如下：
    1. Pod A 发出数据包，传输到宿主机的 veth 网口。
        - 此时数据包的源 IP 为 Pod A 的 Cluster IP ，目标 IP 为 Service A 的 Cluster IP 。
    2. Pod A 的宿主机收到数据包，kube-proxy 会发现数据包的目标 IP 指向 Service ，于是从相应的 EndPoints 中找到一些可用的 Pod 端点，根据负载均衡算法选用一个 Pod 端点，然后将数据包反向代理到该 Pod 端点。
        - 该过程是反向代理，不是路由转发，因此数据包的源 IP 不变，目标 IP 变为 Pod IP 。
    3. kube-proxy 将数据包路由转发到 Pod 端点所在的 Node 。
    4. Pod 端点收到数据包。

- Pod 与集群外主机的通信
  - 假设从 Pod A 访问集群外主机 node-3 ，则流程如下：
    1. Pod A 发出数据包，传输到宿主机的 veth 网口。
        - 此时数据包的源 IP 是 Pod A 的 Cluster IP 。
    2. Pod A 的宿主机收到数据包，路由转发给 node-3 。
        - 因为 node-3 是集群外主机， kube-proxy 会自动将数据包的源 IP 改为宿主机的 eth0 IP ，即 SNAT 。否则 node-3 回复数据包时，会找不到路由而失败。
  - 默认不能从 k8s 集群外主机访问 Pod ，有几种解决方案：
    - 给 Pod 创建 LoadBalancer 类型的 Service ，绑定内网 IP 或公网 IP 。
    - 给 Pod 创建 NodePort 类型的 Service 。
    - 给 Pod 绑定 HostPort ，并固定调度到某个 Node 。
    - 给 Pod 启用 `spec.hostNetwork: true` ，采用宿主机的 network namespace ，从而绑定宿主机的内网 IP 。
    - 给集群外主机添加路由，将访问 Cluster IP 的流量路由到任一 k8s 节点。例如：`ip route add 10.43.0.0/16 via 10.0.1.1`

## Service 类型

- Service 是一种管理逻辑网络的对象，用于对某些 Pod 进行 TCP/UDP 反向代理，代表一个抽象的应用服务，常用于实现服务发现、负载均衡。
- Service 分为 ClusterIP、NodePort、LoadBalancer 等多种类型。

### ClusterIP

：给 Service 分配一个 Cluster IP ，将访问 `ClusterIP:Port` 的流量转发到 EndPoints 。
- 配置文件示例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    # type: ClusterIP       # Service 类型，默认为 ClusterIP
    clusterIP: 10.43.0.1    # 该 Service 绑定的 clusterIP 。如果创建 Service 时不指定 clusterIP ，则随机分配一个。创建 Service 之后不允许修改 clusterIP ，除非重建 Service
    ipFamilies:
      - IPv4
    ipFamilyPolicy: SingleStack
    # externalTrafficPolicy: Cluster  # 路由策略。默认为 Cluster
    selector:               # 通过 selector 选中一些 Pod
      k8s-app: redis
    ports:                  # 让 Service 的端口反向代理到 Pod 的端口
    - name: redis           # Service 的端口名。如果 Service 只监听一个端口，才可以省略 name
      port: 6379            # Service 监听的端口号
      protocol: TCP         # 反向代理的协议，默认为 TCP ，还可选 UDP
      targetPort: 6379      # 将访问 service_ip:port 的流量，转发到 pod_ip:targetPort
      # targetPort: port1   # 可以指定 Pod 的端口名，而不是数字端口号
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379
    # sessionAffinity: ClientIP   # 会话保持的方式。默认为 None ，会将数据包随机转发到各个 Pod IP
    # sessionAffinityConfig:
    #   clientIP:                 # 为每个 client IP 创建一个会话。在会话持续时间内，将来自同一个 client IP 的数据包总是转发到同一个 Pod IP
    #     timeoutSeconds: 10800
  ```
  - 用户可直接访问 Pod 的端口，也可通过 Service 来访问：
    ```sh
    pod_ip:targetPort       # 直接访问 Pod 。由于 pod_ip 可能变化，这样访问不方便
    service_ip:port         # 在 k8s 集群的任一主机或容器内，都可以通过 ClusterIP 访问到 service
    ```

- Service 反向代理流量到 Pod 时， externalTrafficPolicy 路由策略有两种：
  - Cluster
    - ：默认策略，当 kube-proxy 收到访问 Service 的流量时，可以转发给集群内任一 Ready 状态的 Pod 端点。
  - Local
    - ：当 kube-proxy 收到访问 Service 的流量时，只能转发给与当前 kube-proxy 同主机的 Ready 状态的 Pod 端点。
    - 与 Cluster 策略相比， Local 策略避免了跨主机路由转发数据包，耗时更短，而且能保留数据包的源 IP 。但是容易将负载压力集中在当前主机。





### NodePort

：在所有 Node 上监听一个 Port ，将访问 `NodeIP:Port` 的流量转发到 EndPoints 。
- NodePort 默认的取值范围为 30000~32767 ，以免与系统端口冲突。
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    clusterIP: 10.43.0.1    # NodePort 类型的 service 也会绑定一个 clusterIP
    ports:
    - nodePort: 31017       # 如果不指定 nodePort ，则随机选取一个端口
      port: 80
      protocol: TCP
      targetPort: 80
    selector:
      k8s-app: redis
  ```

### HostPort

：与 NodePort 相似，但只使用 Pod 所在节点的端口。
- HostPort 不属于 Service 对象，没有监听端口，只是添加 iptables 规则实现端口转发。
  - HostPort 的取值范围不限。
  - 如果 HostPort 与 NodePort 端口号相同，则依然可以创建，但优先级更高。
- 缺点：
  - 当 Pod 迁移部署到其它节点时，节点 IP 会变化，因此通常将 Pod 固定调度到某个节点。
  - 同一节点上不允许多个 Pod 使用同一个 HostPort ，否则会被 evicted ，因此以 DaemonSet 方式部署比 Deployment 更合适。
- HostPort 需要在 Pod 的 spec.containers 里配置，如下：
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - name: redis
      image: redis:5.0.6
      command: ["redis-server /opt/redis/redis.conf"]
      ports:
      - containerPort: 6379
        hostPort: 6379      # 将访问 hostPort 的流量转发到 containerPort
  ```

### LoadBalancer

：给 Service 绑定 k8s 集群外的一个内网或公网 IP ，将访问该 IP 的流量转发到随机一个 Node ，然后路由到 Pod IP 。
- 一般需要购买云平台的负载均衡器，也可以用 MetalLB 自建。
<!-- - 考虑到云平台提供的 LoadBalancer 会收费，用户可以自行部署一个 Nginx ，根据不同的 DNS 子域名或端口，转发到不同的 Service ClusterIP 。 -->
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: LoadBalancer
    clusterIP: 10.43.0.1
    loadBalancerIP: 12.0.0.1
    selector:
      k8s-app: redis
    ports:
      - name: redis
        port: 6379
        protocol: TCP
        targetPort: 6379
  ```

### ExternalName

：添加一条集群内的 DNS 规则，将 ServiceName 解析到指定的域名。
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: ExternalName
    externalName: redis.test.com
  ```

### ExternalIPs

：给 Service 分配集群外的 IP ，此时 Service 可以是任意 type 。
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    selector:
      k8s-app: redis
    ports:
    - name: redis
      port: 6379
      protocol: TCP
      targetPort: 6379
    externalIPs:
    - 123.0.0.1
  ```

### Headless

：配置 `clusterIP: None` 。此时 Service 没有 Cluster IP ，访问 Service 名会被 DNS 解析到随机一个 Pod IP 。
<!-- 组合使用 StatefulSet 与 Headless Service 时，会为每个 Pod 创建一个 DNS 域名 -->

## Service 相关

### DNS

- 创建一个 Service 时，k8s 会自动创建一个相应的 DNS 条目，全名为 `<service-name>.<namespace-name>.svc.cluster.local` 。因此可通过 service_name 访问 service ：
  ```sh
  service_name:port                   # 访问者与 service 在同一命名空间时，访问 service_name ，默认会 DNS 解析到 service_ip
  service_name.svc.cluster.local:port # 访问者与 service 在不同命名空间时，需要访问 service 的完整 DNS 名称，才能解析到 service_ip
  ```

### 环境变量

- 创建一个 Pod 时，会自动在终端环境变量中加入当前 namespace 所有 Service 的地址。如下：
  ```sh
  REDIS_SERVICE_HOST=10.43.2.2
  REDIS_PORT_6379_TCP_PORT=6379
  REDIS_PORT_6379_TCP_PROTO=tcp
  REDIS_PORT_6379_TCP=tcp://10.43.2.2:6379
  ...
  ```
  - Serivce 变化时不会自动更新 Pod 的环境变量，因此不可靠。

### EndPoints

：端点，Service 的一种子对象，用于跟踪需要反向代理的 Pod 地址。
- 创建 Service 时，会根据 selector 选中一些 Pod ，自动创建一个与 Service 同名的 EndPoints 对象。
  - EndPoints 会监听 Service 需要反向代理的所有 Pod 的 pod_ip:targetPort 地址，记录其中 Ready 状态的端点，实现服务发现。
  - kube-proxy 会从 EndPoints 读取端点，将访问 Service 的流量转发到端点。
- 创建 Service 时，如果没有 selector ，则不会创建 EndPoints 对象，因此发向 service_ip:port 的数据包不会被转发，导致用户访问端口时无响应。
  - 此时用户可手动创建 Endpoints 对象，自定义端点地址，从而让 Service 反向代理到任意地址。
- EndPoints 示例：
  ```sh
  [root@CentOS ~]# kubectl get service redis
  NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)              AGE
  redis        ClusterIP   10.43.2.2    <none>        6379/TCP,26379/TCP   2h
  [root@CentOS ~]# kubectl get endpoints redis
  NAME         ENDPOINTS                        AGE
  redis        10.42.3.6:6379,10.42.3.6:26379   2h
  ```

### EndpointSlices

：端点分片，Service 的一种子对象，用于将大量端点分片存储。
- EndpointSlices 相比 Endpoints 的优点：
  - 一个 Service 的 EndPoints 每次变化时，需要全量同步到所有节点的 kube-proxy ，开销较大。如果将单个 EndPoints 拆分成多个 EndpointSlice ，则可以增加端点容量、降低同步开销。
  - 每个 EndPoints 对象最多记录 1000 个端点，超出的部分会截断。而每个 EndpointSlices 默认最多记录 100 个端点，并且容量满了时，k8s 会自动为 Service 添加 EndpointSlices 。
  - 每个 Service 最多绑定一个 EndPoints 对象，两者同名。而每个 Service 可以绑定多个 EndpointSlices 对象，名称任意，通过 `kubernetes.io/service-name` 标签记录所属的 Service 。
- k8s v1.19 开始默认启用 EndpointSlices 功能，创建 Service 时会同时创建 EndPoints 和 EndpointSlices 对象，但实际使用的是 EndpointSlices 。

## Ingress

：一种管理逻辑网络的对象，用于对某些 Service 进行 HTTP、HTTPS 反向代理，常用于实现路由转发。
- 实现 Ingress 功能的 Controller 有多种，常见的是 Nginx Ingress Controller ，它基于 Nginx 实现 Ingress 功能，会在每个 node 上监听 80、443 端口。
<!-- - Ingress 不会绑定 Cluster IP ，用户需要将 HTTP 请求发送到 Node 的特定端口，即可访问 Ingress 。 -->
- 例：
  ```yml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: test
    namespace: default
  spec:
    ingressClassName: nginx
    rules:                        # Ingress 的入站规则表
    - host: test.com              # 处理发向该域名的请求
      http:                       # 定义 http 类型的转发规则
        paths:
        - backend:
            service:
              name: nginx
              port:
                number: 80
          path: /                 # 将发向该 URL 的请求转发到后端（backend）的 Service
          pathType: Prefix
  ```
  - 执行以下命令，即可访问该 ingress ：
    ```sh
    echo '10.0.0.1 test.com' >> /etc/hosts    # 将 ingress 域名解析到任一 k8s node
    curl test.com
    ```

<!-- ingress path 支持正则匹配 -->

## 访问控制

- Service Account
- RBAC
- NetWorkPolicy ：管控 Pod 之间的网络流量，相当于第四层的 ACL 。
