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
    namespace: redis

  spec:
    type: ClusterIP
    clusterIP: 10.124.0.1
    selector:               # 通过 selector 选中一组 Pod ，进行反向代理
      app: redis

    ports:                  # 定义一组反向代理规则
    - name: redis
      port: 6379            # Service 供外访问的端口
      protocol: TCP         # 反向代理的协议，默认为 TCP ，还可以填 UDP
      targetPort: 6379      # 将访问 Service 该 port 的流量，转发到 Pod 的 targetPort 端口
      # targetPort: port1   # 可以指定 Pod 的端口名，而不是具体的端口号
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379
  ```
  - 该 Service 分配了一个 clusterIP ，映射了两个 port ，供用户访问。
  - 用户可以通过 `ClusterIP:Port` 访问该服务。
    - 也可以通过 `ServiceName:Port` 访问，但这需要将 ServiceName 解析到 ClusterIP 。

### NodePort

：使用 Node 主机的 IP ，并从 Node 的 30000~32767 端口中随机选取或指定一个端口。
- 访问 `NodeIP:Port` 的流量会被转发到 EndPoint 。
  - 不过 Pod 迁移到其它 Node 上时，NodeIP 会变化。
- 例：
  ```yml
  spec:
    type: NodePort
    clusterIP: 10.124.0.1
    selector:
      app: redis
    ports:
    - name: redis
      nodePort: 31533
      port: 6379
      protocol: TCP
      targetPort: 6379
  ```

### LoadBalancer

：给 Service 分配一个负载均衡 IP 。
- 访问 `loadBalancerIP:Port` 的流量会被转发到 EndPoint 。
- 一般需要购买公有云平台的负载均衡器，将其接收的流量代理到 Service。
  - LB 位于集群之外，不受防火墙限制。
  - LB 可以使用内网 IP 或公网 IP 。
- 例：
  ```yml
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

：添加一条neiw集群内的 DNS 规则，将 ServiceName 解析到指定的域名。
- 例：
  ```yml
  spec:
    type: ExternalName
    externalName: redis.test.com
  ```

### ExternalIPs

：给 Service 分配集群外的 IP ，此时 Service 可以是任意 type 。
- 例：
  ```yml
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
- 实现 Ingress 功能的 Controller 有多种，常见的是 Nginx Ingress Controller ，它基于 Nginx 实现 Ingress 功能。
- 配置示例：
  ```yml
  apiVersion: v1
  kind: Ingress
  metadata:
    name: test-ingress
  spec:
    rules:                        # Ingress 的入站规则列表
    - http:                       # 定义 http 协议的规则
        paths:
        - path: /login            # 将发往该 URL 的请求转发到后端（backend）的 Service
          backend:
            serviceName: nginx
            servicePort: 80
  ```

## 访问控制

- Service Account
- RBAC
- NetWorkPolicy ：管控 Pod 之间的网络流量，相当于第四层的 ACL 。
