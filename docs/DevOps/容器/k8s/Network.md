# Network

## IP

- k8s 集群内会使用一些虚拟 IP ，称为 Cluster IP、VIP 。
  - 在 k8s 集群内主机上能访问到 VIP ，在集群外主机上则访问不到。

- k8s 常见的几种 IP ：
  - Node IP
    - ：集群中一个主机节点的 IP 。
    - Node IP 一般采用宿主机的 eth0 网口的 IP ，不属于 VIP 。
  - Pod IP
    - ：分配给 Pod 使用的 VIP 。
    - k8s 会给每个 Node 分配一个虚拟 CIDR 子网，给每个 Pod 分配一个当前 CIDR 子网的 VIP 。
    - 一个应用可以部署多个 Pod 实例，拥有不同的 Pod IP 。而且重新部署时，会创建新 Pod ，分配新 Pod IP 。因此 Pod IP 不固定，不方便访问，建议通过 Service IP 或 Ingress IP 访问应用。
    - Pod IP 支持 ICMP 协议，因为绑定了一个虚拟网卡。而 Service IP 不支持 ICMP 协议，因为只负责端口转发。
  - Service IP
  - Ingress IP

- k8s 常见的几种网络通信：
  - 同一个 Pod 内，容器之间的通信
    - 这些容器共享同一个 network namespace、Pod IP 。
    - 假设容器 A 监听 80 端口，则容器 B 可通过 127.0.0.1:80 访问容器 A 。
  - Pod 之间的通信
    - 假设 Pod A 向 Pob B 发送数据包，流程如下：
      1. Pod A 从自己的 eth0 网口发出数据包，到达宿主机的 veth 网口。
      2. 宿主机找到数据包的目标 IP 所属的 CIDR 子网，路由转发到相应的 Node 。
      3. Pod B 从自己的 eth0 网口收到数据包。
  - Pod 访问 Service
    - Pod 向 Service 发送数据包时，源地址是 Pod IP ，目的地址是 Service IP 。
    - Service 返回数据包给 Pod 时，源地址是 Service IP ，目的地址是 Pod IP 。
  - Pod 访问集群外主机
    - 此时，宿主机会将 Pod 发出的数据包转发给集群外主机。并将数据包的源 IP 改为宿主机的 Node IP ，即 SNAT 。

- 允许 Pod 被 k8s 集群外主机访问的几种方式：
  - 给 Pod 创建 LoadBalancer 类型的 Service ，绑定内网或公网 IP 。
  - 给 Pod 创建 NodePort 类型的 Service 。
  - 给 Pod 绑定 HostPort ，并固定调度到某个 Node 。
  - 给 Pod 启用 `spec.hostNetwork: true` ，采用宿主机的 network namespace 。
  - 在集群外主机添加 route 规则：`ip route add 10.43.0.0/16 via 10.0.1.1`

## Service 类型

- Service 是一种管理逻辑网络的对象，用于对某些 Pod 进行 TCP、UDP 反向代理，代表一个抽象的应用服务，常用于实现服务发现、负载均衡。
- Service 分为 ClusterIP、NodePort、LoadBalancer 等多种类型。

### ClusterIP

：默认的 Service 类型，是给 Service 分配一个集群内的 VIP ，将访问 `ClusterIP:Port` 的流量转发到 EndPoints 。
- 配置文件示例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: ClusterIP
    clusterIP: 10.124.0.1   # 给该 Service 分配一个 clusterIP ，允许自行指定。在创建 Service 之后不允许修改，除非重建 Service
    selector:               # 通过 selector 选中一些 Pod ，进行反向代理
      app: redis
    ports:                  # 定义一组反向代理规则
    - name: redis
      port: 6379            # Service 监听的端口，供外部访问
      protocol: TCP         # 反向代理的协议，默认为 TCP ，还可以填 UDP
      targetPort: 6379      # 将访问 clusterIP:port 的流量，转发到 pod_ip:targetPort
      # targetPort: port1   # 可以指定 Pod 的端口名，而不是具体的端口号
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379
    # sessionAffinity: ClientIP   # 会话保持。默认为 None ，即将数据包随机转发到各个 Pod IP
    # sessionAffinityConfig:
    #   clientIP:                 # 为每个 client IP 创建一个会话。在会话持续时间内，将来自同一个 client IP 的数据包总是转发到同一个 Pod IP
    #     timeoutSeconds: 10800
  ```
  - 此时可以通过 3 种地址访问 Pod ：
    ```sh
    service_name:port   # 访问者与 service 在同一命名空间时，service_name 会被自动 DNS 解析到 service_ip 。在不同命名空间时，则不支持
    service_ip:port     # 在不同命名空间时，也可以通过 service_ip 访问 service
    pod_ip:targetPort   # 也可以直接访问 Pod
    ```

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
    clusterIP: 10.124.0.1   # NodePort 类型的 service 也会绑定一个 clusterIP
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
- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: LoadBalancer
    clusterIP: 10.124.0.1
    loadBalancerIP: 123.0.0.1
    selector:
      app: redis
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
      app: redis
    ports:
    - name: redis
      port: 6379
      protocol: TCP
      targetPort: 6379
    externalIPs:
    - 123.0.0.1
  ```

### Headless

：配置 `clusterIP: None` 。此时 Service 没有 VIP ，只是 Service 名会被 DNS 解析到 Pod IP 。


## Service 相关

<!-- ### DNS -->

<!-- 创建一个 Service 时，它会创建一个相应的 DNS 条目。此条目的形式为<service-name>.<namespace-name>.svc.cluster.local ，这意味着如果容器仅使用<service-name>，它将解析为命名空间本地的服务。
考虑到云平台提供的 LoadBalancer 会收费，用户也可自行部署一个 Nginx ，根据不同的 DNS 子域名或端口，转发到不同的 Service ClusterIP

不同 namespace 下的 pod、service 相互隔离，因此不能 dns 解析其它命名空间的 service ，但可以通过 Pod IP、 clusterIP 访问。
-->

### 环境变量

- 创建一个 Pod 时，会自动在终端环境变量中加入当前 namespace 所有 Service 的地址。如下：
  ```sh
  REDIS_SERVICE_HOST=10.43.2.2
  REDIS_PORT_6379_TCP_PORT=6379
  REDIS_PORT_6379_TCP_PROTO=tcp
  REDIS_PORT_6379_TCP=tcp://10.43.2.2:6379
  ...
  ```
  Serivce 变化时不会自动更新环境变量，因此不可靠。

### EndPoints

：端点，Service 的一种子对象，用于跟踪需要反向代理的 pod_ip:targetPort 地址。
- 每个 Service 最多存在一个 EndPoints 对象，两者同名。
- 如果一个 Service 不存在 EndPoints 对象，则向 service_ip:port 发送的数据包不会被转发，因此无响应。
- 创建一个 Service 时，如果指定了 selector ，则会自动创建一个 EndPoints 。如下：
  ```sh
  [root@CentOS ~]# kubectl get service redis
  NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)              AGE
  redis        ClusterIP   10.43.2.2    <none>        6379/TCP,26379/TCP   2h
  [root@CentOS ~]# kubectl get endpoints redis
  NAME         ENDPOINTS                        AGE
  redis        10.42.3.6:6379,10.42.3.6:26379   2h
  ```
  - EndPoints 会监听所有 Pod ，记录 Ready 状态的 Pod 的端点，实现服务发现。

### EndpointSlices

：端点分片，Service 的一种子对象，用于将大量端点分片存储。
- 每个 Service 可以绑定多个 EndpointSlices 对象。
  - 每个 EndpointSlices 默认最多记录 100 个端点。
- etcd 中单个对象的最大体积默认为 1.5MB ，因此一个 EndPoints 最多记录 5000 多个端点。并且一个 Service 的 EndPoints 每次变化时，需要全量同步到所有节点的 kube-proxy ，开销较大。
  - 如果将单个 EndPoints 拆分成多个 EndpointSlice ，则可以增加端点容量、降低同步开销。
  - k8s v1.19 开始默认启用 EndpointSlices 功能，让 kube-proxy 从 EndpointSlices 读取反向代理的端点，而不是 EndPoints 。

## Ingress

：一种管理逻辑网络的对象，用于对某些 Service 进行 HTTP、HTTPS 反向代理，常用于实现路由转发。
- 实现 Ingress 功能的 Controller 有多种，常见的是 Nginx Ingress Controller ，它基于 Nginx 实现 Ingress 功能，会在每个 node 上监听 80、443 端口。
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

## 访问控制

- Service Account
- RBAC
- NetWorkPolicy ：管控 Pod 之间的网络流量，相当于第四层的 ACL 。
