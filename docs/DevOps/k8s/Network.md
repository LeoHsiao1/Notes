# Network

k8s 中常用的几种 IP 地址：
- Node IP ：集群中一个主机节点的 IP 地址。
- Pod IP ：一个 Pod 的 IP 地址。
- Service IP ：不管一个应用运行了多少个 Pod 实例，都是暴露一个 Service IP 供用户访问。
  - 一个服务访问外部时，源地址是 Pod IP；外部访问一个服务时，目的地址是 Service IP 。
- Ingress IP ：服务通过该 IP 暴露到集群外，供集群外的主机访问。

k8s 中主要研究的网络通信：
- 同一个 Pod 内，容器之间的通信
- 同一个服务内，Pod 之间的通信
- 同一个集群内，Pod 到服务的通信
- 集群内与集群外的通信

## Service

：提供服务发现、反向代理、负载均衡的功能。

Service 的配置文件通常命名为 service.yaml ，内容示例如下：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: redis
spec:
  type: ClusterIP
  clusterIP: 10.124.0.1
  selector:
    app: redis
  ports:
  - name: redis
    port: 6379
    protocol: TCP
    targetPort: 6379
  - name: sentinel
    port: 26379
    protocol: TCP
    targetPort: 26379
```
- 该 Service 有一个 clusterIP、两个 port ，供用户访问。
  - 用户可以通过“ServiceIP:Port”、“ServiceName:Port”的方式访问该服务。
  - 该 Service 通过 selector 选中符合条件的 Pod（可能有多个），用 Pod IP 和 port 合并成 EndPoint（比如 10.124.0.1:6379 ，可能有多个），将用户的访问流量转发到 EndPoint 。
  - protocol 默认为 TCP ，还可以填 UDP 。
  - targetPort 是指流量被转发到的 Pod 端口。

### 主要分类

- `type: ClusterIP` ：默认类型，给 Service 分配一个集群内的虚拟 IP ，可以被集群内节点访问。
- `type: NodePort` ：从 Node 的 30000~32767 端口中随机选取或指定一个端口，供用户访问。访问 NodeIP:Port 的流量会被转发到 EndPoint 。如下：
    ```yaml
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
    - NodePort 类型的 Service 可以被集群外同网段的主机访问。
- `type: LoadBalancer` ：给 Service 分配一个负载均衡 IP ，供集群外访问。访问 loadBalancerIP:Port 的流量会被转发到 EndPoint 。如下：
    ```yaml
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
- `ExternalName` ：将 Service 名解析到 spec.externalName 指定的域名（要被 DNS 解析，不能是 IP 地址）。如下：
    ```yaml
    spec:
      type: ExternalName
      externalName: redis.test.com
    ```
- `externalIPs` ：给 Service 分配集群外的 IP ，此时 Service 可以是任意 type 。如下：
    ```yaml
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
- `Headless Service` ：配置 `clusterIP: None` 。此时 Service 没有自己的 IP ，必须通过 selector 选中一个 Pod ，Service 名会被解析到 Pod IP 。

## Ingress

：提供集群外部的访问入口，转发到集群内部的某个服务。
- 相当于第七层的反向代理。

配置示例：
```yaml
apiVersion: v1
kind: Ingress
metadata:
  name: test-ingress
spec:
  rules:                        # Ingress 的入站规则列表
  - http:                       # 定义 http 协议的规则
      paths:
      - path: /login            # 将发往该 URL 的请求转发到后端（backend）
        backend:
           serviceName: nginx   # 后端的 Service
           servicePort: 80
```

## 访问控制

- Service Account
- RBAC ：基于角色的访问控制
- NetWorkPolicy ：管控 Pod 之间的网络流量，相当于第四层的 ACL 。
