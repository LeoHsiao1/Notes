# Network

## 原理

k8s 常见的几种 IP 地址：
- Node IP
  - ：集群中一个主机节点的 IP 地址。
  - Node IP 一般绑定在物理机或虚拟机的 eth 网卡上，固定不变。
- Pod IP
  - ：一个 Pod 的 IP 地址。
  - k8s 创建每个 Pod 时，会给它分配一个独立的虚拟 IP 。
  - 一个应用可以部署多个 Pod 实例，拥有不同的 Pod IP ，而且重新部署时 Pod IP 还会变化。因此使用 Pod IP 不方便访问，建议用 Service IP 或 Ingress IP 。
- Service IP
  - 用户可以创建一个 Service ，反向代理某些 Pod 。向 Service IP 发送的网络流量，会被自动转发到对应的 Pod IP 。
    - 此时，外部访问应用时，目的地址是 Service IP 。而应用访问外部时，源地址是 Pod IP 。
- Ingress IP

k8s 常见的几种网络通信：
- 同一个 Pod 内，容器之间的通信
- 同一个服务内，Pod 之间的通信
- 同一个集群内，Pod 到服务的通信
- 集群内与集群外的通信

允许 Pod 被 k8s 集群外主机访问的几种方式：
- 给 Pod 创建 LoadBalancer 类型的 Service ，绑定内网或公网 IP 。
- 给 Pod 创建 NodePort 类型的 Service 。
- 给 Pod 绑定 HostPort ，并固定调度到某个 Node 。
- 给 Pod 启用 `hostNetwork: true` ，采用宿主机的网卡。

## Service

：一种管理逻辑网络的对象，用于对某些 Pod 进行 TCP、UDP 反向代理，常用于实现服务发现、负载均衡。
- Service 分为 ClusterIP、NodePort、LoadBalancer 等多种类型。

<!-- 当您创建一个服务时，它会创建一个相应的DNS 条目。此条目的形式为<service-name>.<namespace-name>.svc.cluster.local，这意味着如果容器仅使用<service-name>，它将解析为命名空间本地的服务。
考虑到云平台提供的 LoadBalancer 会收费，用户也可自行部署一个 Nginx ，根据不同的 DNS 子域名或端口，转发到不同的 Service ClusterIP

不同 namespace 下的 pod、service 相互隔离，因此不能 dns 解析其它命名空间的 service ，但可以通过 Pod IP、 clusterIP 访问。
-->

### ClusterIP

：默认的 Service 类型，是给 Service 分配一个集群内的虚拟 IP 。
- 访问 ClusterIP:Port 的流量会被转发到 EndPoint 。
  - 在集群内节点上，才能访问 ClusterIP 。从集群外则访问不到，需要使用 LoadBalancer 等类型的 Service 。
- Service 的配置文件通常命名为 service.yml ，内容示例如下：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: redis
    namespace: default
  spec:
    type: ClusterIP
    clusterIP: 10.124.0.1
    selector:               # 通过 selector 选中一些 Pod ，进行反向代理
      app: redis
    ports:                  # 定义一组反向代理规则
    - name: redis
      port: 6379            # Service 监听的端口，供外部访问
      protocol: TCP         # 反向代理的协议，默认为 TCP ，还可以填 UDP
      targetPort: 6379      # 将访问 clusterIP:port 的流量，转发到 Pod_IP:targetPort
      # targetPort: port1   # 可以指定 Pod 的端口名，而不是具体的端口号
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379
  ```
  - 该 Service 分配了一个 clusterIP ，映射了两个 port ，供用户访问。
  - 此时可以通过 3 种地址访问 Pod 端口：
    ```sh
    service_name:port   # 访问者与 service 在同一命名空间时，service_name 会被自动 DNS 解析到 service_ip 。在不同命名空间时，则不支持
    service_ip:port     # 在不同命名空间时，也可以通过 service_ip 访问 service
    pod_ip:targetPort   # 也可以直接访问 Pod
    ```

### NodePort

：在所有 Node 上监听一个 Port ，将访问 `NodeIP:Port` 的流量转发到 EndPoint 。
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

：给 Service 绑定一个内网或公网的负载均衡 IP ，将访问该 IP 的流量转发到 Service 的 clusterIP 。
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

### Headless Service

：配置 `clusterIP: None` 。此时 Service 没有自己的 IP ，必须通过 selector 选中一个 Pod ，Service 名会被解析到 Pod IP 。

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
