# APISIX

- ：一个 API 网关。
- [官方文档](https://apisix.apache.org/docs/)
- 2019 年由深圳支流科技公司开源，后来交给 ASF 基金会管理。企业版称为 API7 。
- 特点：
  - 基于 openresty 管理网络流量，支持 TCP、UDP、HTTP 等多种协议的反向代理，不过最常用的是 HTTP 。
  - 提供了动态路由、负载均衡、限流、身份认证等功能。
  - 支持动态更新，可在运行时更新配置、插件，不需重启。

## 架构

- APISIX 系统需要部署以下软件：
  - apisix ：一个 HTTP 服务器，包含以下模块：
    - openresty ：APISIX 基于它来收发、管理网络流量。因此部署 apisix 进程时，实际上是运行多个 Nginx 进程。
    - core ：APISIX 的核心代码。
    - plugin runtime ：插件的运行时。
      - APISIX 内置了缓存、限流、身份认证、可观测性等插件，用户也可添加其它插件，实现丰富的功能。
      - 插件可采用 Lua、Java、Golang、Python、JS 等语言开发，还支持 WASM 插件。
  - dashboard ：一个 Web 服务器，提供对 APISIX 的 Web 管理页面。
    - 默认监听 9000 端口，账号密码为 admin、admin 。
    - 可在 Web 页面嵌入 Grafana 图表。
  - etcd ：APISIX 默认将配置文件等数据存储在自身，可以改为存储到 etcd 数据库，从而可部署多个 apisix 实例，实现高可用。
- apisix 进程通常监听多个 TCP 端口：
  - 9080 ：用于接收一般的 HTTP 请求。
  - 9443 ：用于接收一般的 HTTPS 请求。
  - 9180 ：提供 HTTP 协议的 admin API ，用于修改 APISIX 的配置，客户端需要使用 key 进行身份认证。详见 [官方文档](https://apisix.apache.org/docs/apisix/admin-api/) 。
  - 9090 ：提供 HTTP 协议的 control API ，用于查询 APISIX 的配置、运行状态。
  - 9091 ：提供 exporter 接口，供 Prometheus 采集监控指标，URI 为 /apisix/prometheus/metrics 。

## 部署

APISIX 有多种部署方式：
- 下载二进制程序，直接部署在主机上。这样比较麻烦。
- 通过 Docker 容器部署：
  ```sh
  docker run -d --name apisix \
      -p 9080:9080 \
      -e APISIX_STAND_ALONE=true \
      apache/apisix:2.15.1-debian
  ```
- 通过 docker-compose 部署，参考 [官方示例](https://github.com/apache/apisix-docker/blob/master/example/docker-compose.yml) 。
- 在 k8s 集群安装 APISIX Ingress Controller ：
  ```sh
  wget https://github.com/apache/apisix-helm-chart/releases/download/apisix-0.12.1/apisix-0.12.1.tgz
  helm install apisix apisix-0.12.1.tgz \
      --create-namespace --namespace ingress-apisix \
      --set gateway.type=NodePort \
      --set ingress-controller.enabled=true \
      --set ingress-controller.config.apisix.serviceNamespace=ingress-apisix

  wget https://github.com/apache/apisix-helm-chart/releases/download/apisix-dashboard-0.7.0/apisix-dashboard-0.7.0.tgz
  helm install apisix-dashboard apisix-dashboard-0.7.0.tgz \
      --create-namespace --namespace ingress-apisix
  ```
  - 这会在 ingress-apisix 命名空间部署以下 Pod ：
    ```sh
    apisix                      # Deployment 类型
    apisix-dashboard            # Deployment 类型
    apisix-ingress-controller   # Deployment 类型
    apisix-etcd                 # StatefulSet 类型，有 3 个实例，挂载 PVC 。如果当前 k8s 不支持 PVC ，则可改为其它类型的 volume
    ```
  - 这会创建多个 Service ：
    ```sh
    apisix-admin                # ClusterIP 类型，反向代理 apisix ，供管理员调用 admin API
    apisix-dashboard            # ClusterIP 类型，反向代理 dashboard
    apisix-etcd                 # ClusterIP 类型，反向代理 etcd
    apisix-gateway              # NodePort 类型（也可改成 LoadBalancer 类型），反向代理 apisix ，供一般客户端访问
    apisix-ingress-controller   # ClusterIP 类型，反向代理 ingress-controller
    ```

### 版本

- v2.0
- v3.0
  - 2022 年发布。
  - 有很多不向下兼容的改动，因此建议旧版本先升级到 v2.15 ，再升级到 v3.0 。

## 用法

- Nginx 处理 HTTP 请求时主要使用 server、location 等配置，而 APISIX 设计了以下对象：
  - route
    - ：表示路由规则，类似于 Nginx 的 location 。
  - upstream
    - ：表示被 APISIX 反向代理的上游服务，类似于 Nginx 的 upstream 。
    - 创建一个 upsteam 对象之后，可以被多个 route 反向代理。
  - service
    - ：表示一个抽象的服务，可绑定多个 route 路由规则。类似于 Nginx 的 server 。
  - consumer
    - ：用于标识一个客户端。允许给不同 consumer 的客户端发来的 HTTP 请求，采用不同的插件配置。
    - Nginx 可通过 HTTP 请求的 client_ip、headers 分辨客户端的类型，返回不同的 HTTP 响应。而 APISIX 除了这些功能，还可根据插件过滤 HTTP 请求。
  - consumer group
    - ：用于标识一组客户端，使它们采用相同的插件配置。

- 有多种修改 APISIX 配置的方式：
  - 向 admin API 发送 HTTP 请求。例：
    ```sh
    curl -X PUT http://127.0.0.1:9180/apisix/admin/routes/1 -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" -d '
    {
      "name": "route-1",
      "methods": ["GET"],
      "host": "test.com",
      "uri": "/*",
      "upstream": {
        "type": "roundrobin",
        "nodes": {
          "httpbin.org:80": 1
        }
      }
    }'
    ```
    - 这会创建一个 id 为 1 的 route ，规则为：当收到 HTTP 请求时，如果 methods、host、uri 符合描述，则将该 HTTP 请求转发给 upstream 。
    - 测试访问：
      ```sh
      curl 127.0.0.1:9080/get -H "Host: test.com"
      ```
  - 在 Dashboard 的 Web 页面上配置。不过目前 Web 页面尚未覆盖所有 admin API 。
  - 在 k8s 集群安装 APISIX Ingress Controller 之后，除了上述两种配置方式，也可创建 ApisixRoute、ApisixUpstream 等 CRD 对象。
    - APISIX CRD 对象的语法与 k8s Ingress 相似，但功能更多。
    - apisix-ingress-controller 会通过 kube-apiserver 监视所有 APISIX CRD 对象的变化。发现变化时，自动将 CRD 对象转换成 APISIX 原生配置，并通过 admin API 导入 APISIX ，但不支持导出。
    - 例：
      ```yml
      apiVersion: apisix.apache.org/v2
      kind: ApisixRoute
      metadata:
        name: route-1
        namespace: default
      spec:
        http:
        - name: rule-1
          match:
            hosts:
            - test.com
            paths:
            - /*
          upstreams:                    # 收到请求流量时，反向代理到 ApisixUpstream
          - name: upstream-1
          # plugins:
          #   ...
      ---
      apiVersion: apisix.apache.org/v2
      kind: ApisixUpstream
      metadata:
        name: upstream-1
        namespace: default
      spec:
        externalNodes:
        - type: Domain
          name: httpbin.org
      ```
