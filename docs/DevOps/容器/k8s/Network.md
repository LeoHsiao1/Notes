# Network

## IP

- k8s 集群内会建立一些虚拟子网，使用一些虚拟 IP ，称为 Virtual IP、VIP、Cluster IP 。
- 部署 k8s 集群时，通常需要创建两个 CIDR 子网：
  - service_cidr ：比如 `10.43.0.0/16`，从中选取 Cluster IP 分配给各个 Service 使用。
  - pod_cidr ：比如 `10.42.0.0/16` ，从中选取 Cluster IP 分配给各个 Pod 使用。
    - k8s 会先将 pod_cidr 拆分成一些小的 CIDR 子网，比如 `10.42.0.0/24`、`10.42.1.0/24` ，分配给各个 Node 。然后每当一个 Pod 调度到一个 Node 时，从该 Node 的 CIDR 中选取一个 Cluster IP ，绑定到该 Pod 的虚拟网卡。
    - 假设一个 Node 管理的 CIDR 子网为 `10.42.1.0/24` ，则可将 10.42.1.1、10.42.1.2 等 Cluster IP 分配给 Pod 。
      - 调度到该 Node 的 Pod 数量，不能超过 Pod CIDR 子网容量。
      - Pod CIDR 的网络号 10.42.1.0 会分配给该 Node 本身使用，因此在 k8s 集群内访问该 IP 的网络流量会被转发到该 Node 。

- k8s 几种资源对象的 IP ：
  - Node IP
    - ：k8s 集群中主机节点的 IP ，可以是 eth0 IP 或 Cluster IP 。
    - 每个 Node 原本有一个 eth0 物理网卡，其上绑定一个内网 IP ，用于与 k8s 集群外的主机通信。
    - 部署 kube-proxy 之后，每个 Node 会增加一个虚拟网卡，其上绑定当前 Pod CIDR 的网络号，属于 Cluster IP ，用于与 k8s 集群内的其它 Cluster IP 通信。
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
  主机名    eth0 IP     Pod CIDR
  node1    10.0.0.1    10.42.0.0/24
  node2    10.0.0.2    10.42.1.0/24
  node3    10.0.0.3    不在 k8s 集群中，但与 node1、node2 在同一内网
  ```
  - 在 node2 上执行 `ssh 10.0.0.1` 可以登录到 node1 ，此时网络流量的源 IP 为 10.0.0.2 。
  - 在 node2 上执行 `ssh 10.42.0.0` 也可以登录到 node1 ，此时网络流量的源 IP 为 10.42.1.0 ，即 node2 的 Pod CIDR 的网络号。
  - 在 node3 上执行 `ssh 10.0.0.2` 可以访问到 node2 ，但执行 `ssh 10.42.1.0` 会找不到路由。

k8s 常见的几种网络通信：
- node 之间的通信
  - 假设从 node1 访问 node2 ，发送 IP 协议的数据包：
    - 如果访问 node2 的 eth0 IP ，则数据包不进入 k8s 的虚拟子网，源 IP 为 node1 的 eth0 IP 。
    - 如果访问 node2 的 Cluster IP ，则数据包会进入 k8s 的虚拟子网，源 IP 为 node1 的 Cluster IP 。

- 同一个 Pod 中，容器之间的通信
  - 同一个 Pod 中的所有容器共用一个虚拟网卡、network namespace、Pod IP ，像同一主机内运行的多个进程。
  - 假设从 container1 访问 container2 ，则数据包的源 IP 、目标 IP 都是当前 Pod IP 。
  - 假设 container2 监听 TCP 80 端口，则在 container1 中可执行 `curl 127.0.0.1:80` 访问到 container2 的端口。

- Pod 之间的通信
  - 每个 Pod 绑定了一个 Cluster IP ，因此可通过 Cluster IP 相互访问，像一个个独立的主机。
  - 假设从 Pod1 访问 Pod2 ，则流程如下：
    1. Pod1 中某个容器，从该 Pod 的 eth0 网口发出数据包，被传输到宿主机的 veth 网口。
        - Pod 与宿主机之间通过 veth pair 虚拟网口传输数据包，详见 Docker 网络。
        - 此时数据包的源 IP 为 Pod1 的 Cluster IP ，目标 IP 为 Pod2 的 Cluster IP 。
    2. Pod1 的宿主机收到数据包，路由转发给 Pod2 的宿主机。
        - kube-proxy 事先配置了路由规则：如果数据包的目标 IP 是属于某 Pod CIDR 子网的 Cluster IP ，则路由转发到管理该 Pod CIDR 子网的那个 Node 。
        - 如果 Pod1 与 Pod2 位于同一宿主机，则不需要路由转发。
        - Pod 之间通信时，不会进行 NAT ，因此数据包的源 IP 、目标 IP 一直为 Pod IP 。
    3. Pod2 的宿主机收到数据包，通过 veth 网口传输给 Pod2 。
    4. Pod2 中某个容器，从该 Pod 的 eth0 网口收到数据包。

- 访问 Service 的通信
  - 假设从 Pod1 访问 ClusterIP 类型的 Service ，则流程如下：
    1. Pod1 发出数据包，被传输到宿主机的 veth 网口。
        - 此时数据包的源 IP 为 Pod1 的 Cluster IP ，目标 IP 为 Service 的 Cluster IP 。
    2. Pod1 的宿主机收到数据包，kube-proxy 发现数据包的目标 IP 指向 Service ，于是经过 DNAT 之后转发到 Service 的 EndPoints 中的某个 Pod 端点（假设为 Pod2 ）。
        - 此时数据包的源 IP 不变，目标 IP 变为 pod2_ip 。
    3. kube-proxy 将数据包路由转发到 Pod2 所在的 Node 。
    4. Pod2 收到数据包。
  - 假设 node1 上有一个 client 进程（不在 Pod 内），需要访问一个 Pod ，或访问一个 Service 时反向代理到一个 Pod ：
    - 如果目标 Pod 位于当前 node ，则直接传输数据包，源 IP 为 node1 的 eth0 IP 。
    - 如果目标 Pod 位于其它 node ，则先将数据包路由转发到目标主机，源 IP 变为 node1 的 Cluster IP 。
  - 假设有一个 NodePort 类型的 Service ，监听 node1 的 80 端口，然后在任一主机（包括 k8s 集群外主机）上有一个 client 进程（不在 Pod 内）。则 client 访问 Service 的流程如下：
    1. client 向 Service 发送数据包。
        - 此时数据包的源 IP 为 client_ip ，目标 IP 为 node1_ip 。
    2. node1 收到数据包，经过 DNAT 之后转发到 Service 的 EndPoints 中的某个 Pod 端点（假设为 Pod2 ）。
        - 此时数据包的目标 IP 改为 pod_ip 。
        - 同时会通过 iptables 规则进行 SNAT ，将数据包的源 IP 改为 node1_ip 。
    3. Pod2 收到数据包，回复另一个数据包给 node1 。
        - 此时数据包的源 IP 为 pod_ip ，目标 IP 为 node1_ip 。
        - 如果不进行 SNAT ，Pod2 就会直接回复数据包给客户端，跳过了 node1 的反向代理。client 预期收到来自 node1_ip 的回复，却收到来自 pod2_ip 的数据包，导致不能建立 TCP 连接。
    4. node1 收到数据包，发送给 client 。
        - 此时数据包的目标 IP 改为 client_ip 。
        - 同时会通过 iptables 规则进行 SNAT ，将数据包的源 IP 改为 node1_ip 。

- Pod 与集群外主机的通信
  - 假设从 Pod1 访问集群外主机 node3 ，则流程如下：
    1. Pod1 发出数据包，被传输到宿主机的 veth 网口。
        - 此时数据包的源 IP 是 Pod1 的 Cluster IP 。
    2. Pod1 的宿主机收到数据包，路由转发给 node3 。
        - 因为 node3 是集群外主机，会通过 iptables 规则进行 SNAT ，将数据包的源 IP 改为宿主机的 eth0 IP 。否则 node3 回复数据包时，会找不到路由而失败。
  - 默认不能从 k8s 集群外主机访问 Pod ，有几种解决方案：
    - 修改 Pod 的配置，绑定 HostPort ，并固定调度到某个 Node 。
    - 修改 Pod 的配置，启用 `spec.hostNetwork: true` ，采用宿主机的 network namespace ，从而绑定宿主机的内网 IP 。
    - 给集群外主机添加路由，将访问 Cluster IP 的流量路由到任一 k8s 节点。例如：`ip route add 10.43.0.0/16 via 10.0.1.1`
    - 给 Pod 创建 NodePort 类型的 Service 。
    - 给 Pod 创建 LoadBalancer 类型的 Service ，绑定内网 IP 或公网 IP 。
    - 在 k8s 集群创建 Ingress 。
  - 如果 Pod 需要访问一些集群外地址，则可采用以下措施，将外部地址转换成 k8s Service 。这样便于像访问 k8s 内部 Service 一样访问 k8s 外部地址，外部地址变化时还只需修改 Service 配置。
    - 假设外部地址为域名，则可创建 externalName 类型的 Service 。
    - 假设外部地址为 IP ，则可创建指向该 IP 的 Endpoints 。

## Service

- Service 是一种管理逻辑网络的对象，用于对某些 Pod 进行 TCP/UDP 反向代理，常用于实现服务发现、负载均衡。
- 每个 Service 有一个 EndPoints 子对象，用于记录需要反向代理的 Pod 的 ip:port 。
  - 所有 k8s node 上的 kube-proxy 都会自动配置 iptables 规则，将访问 Service 的流量反向代理到 EndPoints 中的 Pod 。
- Service 表示一个抽象的服务，不是一个真实存在的服务器进程，不会在 Node 上监听端口，因此执行 `ss -tapn` 看不到 Service 监听的端口。
  - 特别地，NodePort 类型的 Service ，会让 kube-proxy 在 Node 上监听端口，因此可能与其它进程监听的端口冲突。
- Service 分为 ClusterIP、NodePort、LoadBalancer 等多种类型。

### ClusterIP

：给 Service 分配一个 Cluster IP ，将访问 `ClusterIP:port` 的流量反向代理到 EndPoints 。
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
    clusterIPs:
    - 10.43.0.1
    # ipFamilies:           # IP 协议，可以为 IPv4、IPv6
    # - IPv4
    # ipFamilyPolicy: SingleStack # IP 协议的策略。默认为 SingleStack ，只使用 ipFamilies 中的第一个协议栈，此时 ClusterIPs 只包含一个 IP 地址，与 clusterIP 相同

    # externalIPs:          # 可以给 Service 绑定集群外的多个 IP 。当 k8s node 收到指向 externalIPs 的数据包时，会转发给该 Service 处理
    # - None
    # externalTrafficPolicy: Cluster  # 从 k8s 外部访问 Service 时的路由策略。默认为 Cluster
    # internalTrafficPolicy: Cluster  # 从 k8s 内部访问 Servier 时的路由策略。默认为 Cluster

    ports:                  # 让 Service 的端口反向代理到 Pod 的端口
    - name: redis           # Service 的端口名。如果 Service 只监听一个端口，则可以省略 name
      port: 6379            # Service 监听的端口号
      protocol: TCP         # Service 监听端口时采用的协议。默认为 TCP ，还可选 UDP
      # appProtocol: tcp    # Service 将监听的流量转发给 Pod 时采用的协议。这是 k8s 1.18 增加的字段，偏向于注释，不会影响 kube-proxy 的行为，而是影响 Istio 等插件
      targetPort: 6379      # 将访问 service_ip:port 的流量，转发到 pod_ip:targetPort
      # targetPort: port1   # 可以指定 Pod 的端口名，而不是数字端口号
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379

    # publishNotReadyAddresses: false # 是否将非 Ready 状态的 Pod 端点加入 EndPoints 。默认为 false
    selector:                     # 通过 selector 选中一些 Pod
      k8s-app: redis
    # sessionAffinity: ClientIP   # 会话保持的方式。默认为 None ，会将数据包随机转发到各个 Pod IP
    # sessionAffinityConfig:
    #   clientIP:                 # 为每个 client IP 创建一个会话。在会话持续时间内，将来自同一个 client IP 的数据包总是转发到同一个 Pod IP
    #     timeoutSeconds: 10800
  ```

- 创建 Service 之后，用户可通过多种方式访问 Pod 的端口：
  ```sh
  pod_ip:targetPort     # 直接访问 Pod 。由于 pod_ip 可能变化，这样访问不方便
  service_ip:port       # 在 k8s 集群的任一 node 或 Pod 内，都可以通过 ClusterIP 访问到 Service ，然后流量会被反向代理到 Pod
  service_name:port     # 可通过 DNS 域名访问 Service ，会自动解析到 Service IP ，然后流量会被反向代理到 Pod
  ```

#### DNS

- 创建一个 Service 时，k8s 会自动创建一个 DNS 名称，全名为 `<service_name>.<namespace_name>.svc.cluster.local` ，解析到 service_ip 。例如：
  ```sh
  redis.default.svc.cluster.local  A  10.43.0.1
  ```
  因此可通过 DNS 名称访问 Service ：
  ```sh
  curl  redis:6379           # 客户端与 service 在同一命名空间时，可以直接访问 service_name ，会 DNS 解析到 service_ip
  curl  redis.default:6379   # 客户端与 service 在不同命名空间时，需要访问详细的 DNS 名称，才能查找到 service_ip
  ```

- 可以给 Service 配置 `clusterIP: None` ，不分配 clusterIP 。这样的 Service 称为 Headless 类型。
  - 此时只能通过 DNS 名称访问 Service ，会 DNS 解析到 EndPoints 中的某个 Pod IP 。
  - 组合使用 StatefulSet 与 Headless Service 时，会为每个 Pod 创建一个 DNS 子域名，格式为 `<pod_name>.<service_name>...` 。

#### 环境变量

- 创建一个 Pod 时，会自动在终端环境变量中加入当前 namespace 所有 Service 的地址。如下：
  ```sh
  REDIS_SERVICE_HOST=10.43.0.1
  REDIS_PORT_6379_TCP_PORT=6379
  REDIS_PORT_6379_TCP_PROTO=tcp
  REDIS_PORT_6379_TCP=tcp://10.43.0.1:6379
  ...
  ```
  - Serivce 变化时不会自动更新 Pod 的环境变量，因此不可靠。

#### TrafficPolicy

- kube-proxy 收到访问 Service 的数据包时，会反向代理到 EndPoints 中的某个 Pod 端点。可配置 externalTrafficPolicy、internalTrafficPolicy 路由策略。
- TrafficPolicy 的取值：
  - Cluster
    - ：默认策略，当 kube-proxy 收到指向 Service 的数据包时，可以转发给集群内任一 Ready 状态的 Pod 端点。
  - Local
    - ：当 kube-proxy 收到指向 Service 的数据包时，只能转发给与当前 kube-proxy 同主机的 Ready 状态的 Pod 端点。如果当前主机没有 Ready 状态的 Pod 端点，则丢弃数据包。
    - 优点：避免了跨主机路由转发数据包，耗时更短。而且对于 NodePort 类型的 Service ，能保留数据包的源 IP 。
    - 缺点：减少了 Service 的负载均衡效果。
- TrafficPolicy 的生效条件：
  - 如果数据包的源 IP 为 k8s 集群外主机的 IP ，并且目标 IP 为 Service 的 NodePort、loadBalancerIP、externalIP ，则视作 k8s 外部流量，会受 externalTrafficPolicy 影响。
  - 如果数据包的目标 IP 为 Service 的 clusterIP ，则视作 k8s 内部流量，会受 internalTrafficPolicy 影响。
  - 其它情况下，TrafficPolicy 不会生效，相当于采用 Cluster 策略。

### NodePort

：在所有 Node 上监听端口，将访问 `node_ip:port` 的流量交给 Service 处理。
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: NodePort
    clusterIP: 10.43.0.1    # NodePort 类型的 service 也要绑定一个 clusterIP 。如果不指定，则随机分配一个
    ports:
    - nodePort: 31017       # 在 Node 上监听的端口号。如果不指定，则随机分配一个。取值范围默认为 30000-32767
      port: 80
      protocol: TCP
      targetPort: 80
    selector:
      k8s-app: redis
  ```

#### HostPort

：与 NodePort 相似，但只监听 Pod 所在 Node 的端口。
- HostPort 不是一种 Service 对象，而是 Pod 的配置。如下：
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - name: redis
      image: redis:5.0.6
      ports:
      - containerPort: 6379
        hostPort: 6379      # 将访问 hostPort 的流量转发到 containerPort
        # hostIP: 0.0.0.0
        # protocol: TCP
  ```
  - HostPort 的取值范围不限。
  - 如果 HostPort 与 NodePort 监听同一个端口号，则依然可以创建，但优先级更高，因此发送到该端口的流量会交给 HostPort 处理。
- 缺点：
  - 当 Pod 迁移部署到其它节点时，节点 IP 会变化，因此通常将 Pod 固定调度到某个节点。
  - 同一节点上，不允许有两个 Pod 监听同样的 (hostIP, hostPort, protocol) 组合，否则会冲突而引发 evicted 。因此，以 DaemonSet 方式部署监听 HostPort 的 Pod ，比 Deployment 更稳妥。

### LoadBalancer

：给 Service 绑定 k8s 集群外的一个内网 IP 或公网 IP ，便于从集群外主机访问 Service 。
- 创建 LoadBalancer 类型的 Service 之前，需要在 k8s 安装负载均衡器，可以购买云平台的，也可以用 MetalLB 等工具自建。
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
    loadBalancerIP: 1.1.1.1
    ports:
      - name: redis
        nodePort: 31212
        port: 6379
        protocol: TCP
        targetPort: 6379
    selector:
      k8s-app: redis
  ```
- 客户端访问 loadBalancerIP 的流程：
  1. 客户端发出数据包，目标 IP 为 Service 的 loadBalancerIP 。
  2. 负载均衡器收到数据包，反向代理到 k8s 集群中随机一个 Node 的 nodePort ，并将目标 IP 改为 Service 的 clusterIP 。
  3. k8s Node 收到数据包，反向代理到 EndPoints 。
- 优点：
  - 使用 NodePort 类型的 Service 时，客户端通常访问固定一个 Node IP ，存在单点故障的风险。而使用 LoadBalancer 类型的 Service 时，客户端依然访问固定一个 loadBalancerIP ，但流量会被分散到所有 k8s Node ，实现负载均衡。因此 LoadBalancer 类型比 ClusterIP、NodePort 的功能更多，是它们的超集。
- 缺点：
  - 原生 k8s 没有提供 LoadBalancer 。
  - 客户端通过 TCP 长连接发起请求时， LoadBalancer 会一直转发到 EndPoints 中同一个端点，不能实现负载均衡。

### ExternalName

：将 Service 的 DNS 名称解析到一个集群外的域名。
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
  - k8s 会添加一条 CNAME 类型的 DNS 记录，将该 Service 的 DNS 名称解析到 externalName ，而不是 clusterIP 。
  - 因此上例中，执行 `ping redis.default` ，相当于执行 `ping redis.test.com` ，DNS 解析结果是 externalName 对应的 IP 。
  - externalName 字段必须填一个可被 DNS 解析的名称，不能填 IP 。
    - 如果是 k8s 内部的 DNS 名称，则必须为 FQDN 格式。
    - 如果该值不能被 DNS 解析，则创建该 Service 时会成功，但执行 `ping redis.default` 时会报错 bad address ，表示不能 DNS 解析。

## EndPoints

：端点，Service 的一种子对象，用于记录需要反向代理的 Pod 的 ip:port 。
- 创建 Service 时，会根据 selector 选中一些 Pod ，自动创建一个与 Service 同名的 EndPoints 对象。
  - EndPoints 会监听 Service 需要反向代理的所有 Pod ，实时记录其中 Ready 状态的 Pod 的 ip:port 端点地址，实现服务发现。
  - kube-proxy 会从 EndPoints 读取端点，将访问 Service 的流量转发到端点。
- 例：上文给 Redis 创建了 Cluster 类型的 Service ，可查看其 Service 以及自动创建的 EndPoints ：
  ```sh
  [root@CentOS ~]# kubectl get service redis
  NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)              AGE
  redis        ClusterIP   10.43.0.1    <none>        6379/TCP,26379/TCP   2h
  [root@CentOS ~]# kubectl get endpoints redis
  NAME         ENDPOINTS                            AGE
  redis        10.42.3.6:6379,10.42.3.6:26379,...   2h
  ```
  查看 EndPoints 的详细配置：
  ```yml
  apiVersion: v1
  kind: Endpoints
  metadata:
    name: redis
    namespace: default
  subsets:              # subsets 字段之下可包含多组端点 addresses
  - addresses:
    - ip: 10.42.3.6     # 每组 addresses 可包含多个 IP ，这里是 Ready 状态的 Pod IP ，这些 IP 暴露同样的一组 ports
      nodeName: node-1
      targetRef:
        kind: Pod
        name: redis-7a27dc4c5b-njf7b
        namespace: default
        uid: d24dddca-7362-424c-8740-284f693b86f5
    - ip: 10.42.3.7
      nodeName: node-2
      targetRef:
        kind: Pod
        name: redis-79c9c6bd9d-zcsvv
        namespace: default
        uid: d23f3d5e-7b46-4405-bd0c-ab21170d0c8e
    ports:                # 自动创建 EndPoints 时，会拷贝 Service 的 ports 配置
    - name: redis
      port: 6379
      protocol: TCP
    - name: sentinel
      port: 26379
      protocol: TCP
  ```
  - 上例的 Endpoints 有两个可用端点，因此执行 `curl 10.43.0.1:6379` 时，流量会被转发到 `10.42.3.6:6379` 或 `10.42.3.7:6379` 。

- 创建 Service 时，如果没有 selector ，则不会创建 EndPoints 对象，因此发向 service_ip:port 的数据包不会被转发，导致用户访问端口时无响应。
  - 此时用户可手动创建 Endpoints 对象，自定义端点地址，从而让 Service 反向代理到任意地址。
  - 虽然是手动创建的 Endpoints ，但删除 Service 时，会自动删除与它同名的 Endpoints 。
- 例：手动创建一个 Service 和 EndPoints ，反向代理到 k8s 集群外的 mysql
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: mysql
    namespace: default
  spec:
    clusterIP: 10.43.0.2
    ports:
    - port: 3306
      protocol: TCP
      targetPort: 3306
    type: ClusterIP
  ---
  apiVersion: v1
  kind: Endpoints
  metadata:
    name: mysql
    namespace: default
  subsets:
  - addresses:
    - ip: 10.0.0.5
    ports:
    - port: 3306
      protocol: TCP
  ```
  - 此时执行 `curl mysql:3306` ，首先 DNS 解析到 10.43.0.2 ，然后流量被转发到 `curl 10.0.0.5:3306` 。

### EndpointSlices

：端点分片，Service 的一种子对象，用于将大量端点分片存储。
- EndpointSlices 相比 Endpoints 的优点：
  - 增加端点容量：每个 EndPoints 对象最多记录 1000 个端点，超出的部分会截断。而每个 EndpointSlices 默认最多记录 100 个端点，并且容量满了时，k8s 会自动为 Service 添加 EndpointSlices 。
  - 降低同步开销：一个 Service 的 EndPoints 每次变化时，需要全量同步到所有节点的 kube-proxy ，开销较大。如果将单个 EndPoints 拆分成多个 EndpointSlice ，则可以降低同步开销。
  - 每个 Service 最多绑定一个 EndPoints 对象，两者同名。而每个 Service 可以绑定多个 EndpointSlices 对象，名称任意，通过 `kubernetes.io/service-name` 标签记录所属的 Service 。
- k8s v1.19 开始默认启用 EndpointSlices 功能，创建 Service 时会同时创建 EndPoints 和 EndpointSlices 对象，但实际使用的是 EndpointSlices 。

## Ingress

：一种管理逻辑网络的对象，用于对某些 Service 进行 HTTP、HTTPS 反向代理，常用于实现 URL 路由。
- 创建 Ingress 之前，需要在 k8s 安装 Ingress Controller ，有多种软件：
  - Nginx Ingress Controller
    - 原理：
      - 以 DaemonSet 方式部署 Pod ，每个 Pod 内运行一个 Nginx 服务器，默认监听 Node 的 80、443 端口。
      - 当用户修改了 Ingress 对象时，会自动更新 Nginx 配置文件，然后执行 nginx -s reload 。
    - 缺点：
      - nginx -s reload 加载大量配置时，可能耗时十几秒。
      - 除了路由功能，其它方面的功能少。
  - APISIX Ingress Controller ：功能更多。
  - Istio Ingress Gateway
- 优点：
  - 如果 k8s 集群内有大量服务需要暴露，供集群外主机访问。则与其为每个服务分别创建 NodePort、LoadBalancer ，不如创建一个 Ingress ，实现所有需求。有的 Ingress 还提供动态路由等额外功能。
- 例：
  ```yml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: test
    namespace: default
  spec:
    ingressClassName: nginx
    rules:                        # Ingress 的 URL 路由规则
    - host: test.com              # 如果 HTTP 请求的 request_host 匹配该 host ，则交给该 backend 处理，否则不处理。默认不指定 host ，可处理所有 HTTP 请求
      http:                       # 定义 http 类型的转发规则
        paths:
        - backend:                # 处理 HTTP 请求的后端（backend），这里采用一个 service
            service:
              name: nginx
              port:
                number: 80
          path: /                 # 如果 HTTP 请求的 request_path 匹配该 path ，则交给该 backend 处理，否则不处理
          pathType: Prefix
    # defaultBackend: ...
    # tls:                        # 启用 TLS 加密通信。这需要从一个 secret 对象获取 tls.crt 和 tls.key ，作用于某些 host
    # - hosts:
    #     - <host>
    #   secretName: <name>
  ```
  - 创建 Ingress 之后，客户端发送 HTTP 请求到任意节点的 NodePort ，就会按 Ingress 规则处理。例如：
    ```sh
    curl 10.0.0.1:80/get -H "Host: test.com"
    ```
  - Ingress 中可定义多个 backend 。如果 HTTP 请求的 request_host、request_path 匹配某个 backend ，则交给该 backend 处理，不交给其它 backend 处理。
    - 如果 HTTP 请求不匹配任何 backend ，则交给 defaultBackend 处理。

- rules[].host 中可使用通配符 * ，匹配任意内容的单个 DNS 字段。
  - 例如 `host: *.test.com` 匹配 `www.test.com` ，不匹配 `test.com`、`1.www.test.com` 。
  - 这与 Nginx 的 service_name 中通配符 * 的用法不同。

- pathType 有多种：
  - Exact
    - ：完全匹配。要求 request_path 与 path 相同。
    - 区分大小写。
    - 例如：
      - `path: /index` 只能匹配 `/index` ，不匹配 `/index/` 。
      - `path: /index/` 只能匹配 `/index/` ，不匹配 `/index` 。
  - Prefix
    - ：前缀匹配。这会将 request_path 以 / 分割为多个字段，然后检查前几个字段是否与 path 相同。
    - 例如：
      - `path: /` 匹配所有 request_path 。
      - `path: /index` 匹配 `/index`、`/index/`、`/index/1` ，不匹配 `/index.html` 。
      - `path: /index/` 与 `path: /index` 的匹配效果一样，后缀的 / 可忽略。
    - 如果 request_path 同时匹配多个 prefix path ，则采用最长的那个。
  - Nginx Ingress Controller 支持让 path 采用正则表达式。

## NetworkPolicy

：网络策略，用于管控 Pod IP 接收、发送的 TCP/UDP 流量，相当于第四层的防火墙。
- 每个 namespace 之下默认没有 NetworkPolicy ，因此放通所有出、入 Pod 的网络流量。
  - 如果入方向或出方向存在 NetworkPolicy ，则只会放通与 NetworkPolicy 匹配的网络包，其它网络包则 drop 。
  - 每个 Pod 内的容器之间总是可以相互通信，不受 NetworkPolicy 限制。
- 访问 apiserver 等 k8s 组件时，需要通过身份认证、鉴权策略，但没有管控网络流量。

- 例：
  ```yml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: test
    namespace: default
  spec:
    podSelector: {}   # 该 NetworkPolicy 作用于哪些 Pod 。如果不指定 Pod ，则作用于当前 namespace 的所有 Pod
    policyTypes:      # NetworkPolicy 的类型，包含 Ingress 则作用于入流量，包含 Egress 则作用于出流量
    - Ingress
    - Egress
    ingress:          # 当有网络包发向 Pod 时，如果源 IP、Port 匹配以下规则，则放通
      - from:
          - namespaceSelector:
              matchLabels:
                project: test
          - podSelector:
              matchLabels:
                k8s-app: nginx
          - ipBlock:
              cidr: 10.42.0.0/16
              except:
                - 10.42.1.0/24
        ports:
          - protocol: TCP
            port: 6379
    egress:             # 当 Pod 发出网络包时，如果目标 IP、Port 匹配以下规则，则放通
      - to:
          - ipBlock:
              cidr: 10.0.0.0/24
        # ports:
        #   - protocol: TCP
        #     port: 80
  ```

- 下例的 NetworkPolicy 作用于入流量，但不存在 ingress 规则，因此不会放通任何入流量。
  ```yml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: ingress-allow-none
    namespace: default
  spec:
    podSelector: {}
    policyTypes:
    - Ingress
  ```
- 下例的 NetworkPolicy 作用于入流量，且 ingress 规则为空时会匹配所有网络包，因此会放通任何入流量。
  ```yml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: ingress-allow-all
    namespace: default
  spec:
    podSelector: {}
    ingress:
    - {}
    policyTypes:
    - Ingress
  ```
