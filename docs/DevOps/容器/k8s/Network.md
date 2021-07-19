# Network

k8s 中常用的几种 IP 地址：
- Node IP ：集群中一个主机节点的 IP 地址。
- Pod IP ：一个 Pod 的 IP 地址。
  - Pod IP 每次重新部署时会变化，因此建议通过 Service、Ingress 来访问 Pod 。
- Service IP
- Ingress IP

k8s 中主要研究的网络通信：
- 同一个 Pod 内，容器之间的通信
- 同一个服务内，Pod 之间的通信
- 同一个集群内，Pod 到服务的通信
- 集群内与集群外的通信

## Service

：一个管理逻辑网络的对象，用于对一个或多个 Pod 进行 TCP、UDP 反向代理，常用于实现服务发现、负载均衡。
- Service 分为 ClusterIP、NodePort、LoadBalancer 等多种类型。
- 一个应用可以运行多个 Pod 实例，被一个 Service 反向代理，供用户访问。
  - 用户发到 Service 某个端口的流量，会被转发到 Pod 的相关端口。
  - Pod 访问外部时，源地址是 Pod IP 。
  - 外部访问一个 Pod 时，目的地址是 Service IP 。

### ClusterIP

：默认的 Service 类型。是给 Service 分配一个集群内的虚拟 IP 。
- 访问 ClusterIP:Port 的流量会被转发到 EndPoint 。
  - 只有在集群内节点上，才能访问 ClusterIP 。在集群外节点上，则访问不到，应该使用 LoadBalancer 等类型的 Service 。
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
      targetPort: 6379      # 访问 Service 的 port 的流量，会被转发到 Pod 的 targetPort 端口，又称为 EndPoint
    - name: sentinel
      port: 26379
      protocol: TCP
      targetPort: 26379
  ```
  - 该 Service 分配了一个 clusterIP ，映射了两个 port ，供用户访问。
  - 用户可以通过 `ClusterIP:Port` 访问该服务。
    - 也可以通过 `ServiceName:Port` 访问，但这需要将 ServiceName 解析到 ClusterIP 。

### NodePort

：从 Node 的 30000~32767 端口中随机选取或指定一个端口，映射到容器端口。
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
- 云平台通常为此提供了负载均衡器。
  - loadBalancerIP 可以是集群内 IP 或集群外 IP 、公网 IP 。
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

：一个管理逻辑网络的对象，用于对一个或多个 Service 进行 HTTP、HTTPS 反向代理，常用于实现路由转发。
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
- RBAC ：基于角色的访问控制
- NetWorkPolicy ：管控 Pod 之间的网络流量，相当于第四层的 ACL 。
