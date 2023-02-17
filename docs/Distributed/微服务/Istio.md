# Istio

：一个 Service Mesh 框架，通常部署在 k8s 集群中。
- [官方文档](https://istio.io/latest/docs/)
- 发音为 `/iss-tee-oh/` 。
- 特点：
  - 原生的 k8s 可以编排大量容器，但缺乏管理 Pod 网络流量的能力。而 Istio 提供了动态路由、熔断、TLS 加密通信、权限控制、可观测性等功能，更擅长微服务架构。
  - Istio 擅长 HTTP、TCP 反向代理，且支持动态路由。不支持 UDP 流量。
  - Istio 给系统增加了一个代理层，出入流量需要经过多层代理转发，增加了几毫秒延迟。

## 原理

- 使用 Istio 的步骤：
  1. 在 k8s 集群安装 Istio 。
  2. 选择一些 Pod ，被 Istio 注入 Envoy 代理，从而加入 Service Mesh ，被 Istio 管理网络流量。
  3. Istio 提供了多种 CRD ，用户可创建这些 CRD 来控制 Istio 的网络流量。
- Istio 系统包含以下软件：
  - envoy ：一个代理软件，担任数据平面（data plane）。
  - istiod ：担任控制平面（control plane），包含多个软件：
    - pilot-discovery ：运行在 istiod 容器中，提供服务发现的功能。
    - pilot-agent ：运行在 istio-proxy 容器中，负责引导启动 envoy 、实时修改 envoy 的配置。
    - citadel ：负责颁发证书。
    - galley ：负责管理、分发 Istio 的配置。
  - istioctl ：命令行客户端。
  - cni ：可选插件。先在 k8s 集群安装一个主流的 CNI 插件，然后安装 Istio CNI 插件，可替代 istio-init 。
  - kiali ：提供了对 Istio 的 Web 管理页面。还支持显示流量图表、链路追踪，此时采用 Prometheus、jaeger 作为数据源。
  - jaeger ：一个 Web 服务器，用于链路追踪，可以不安装。Istio 也支持用 Zipkin 作为链路追踪的后端。
- 为 Envoy 开发插件时，有 C++、Lua、WebAssembly 等多种方式。
  - 目前最常见的方式是 WebAssembly ，即编译出 WASM 形式的插件。
  - 也可通过 EnvoyFilter 自定义 Envoy 配置。

## 部署

1. 查看 Istio 的 [兼容列表](https://istio.io/latest/docs/releases/supported-releases/#support-status-of-istio-releases) ，找到与当前 k8s 版本兼容的 Istio 版本。然后下载：
    ```sh
    VERSION=1.13.9
    wget https://github.com/istio/istio/releases/download/$VERSION/istio-$VERSION-linux-amd64.tar.gz
    tar -xf istio-$VERSION-linux-amd64.tar.gz
    install istio-$VERSION/bin/istioctl /usr/bin/
    ```
2. 安装 Istio ：
    ```sh
    export KUBECONFIG=/root/.kube/config
    istioctl install --set profile=demo -y      # 采用 demo 配置来安装，这会启用 istiod、ingressGateways、egressGateways
    # istioctl install --set profile=default -y # 采用 default 配置来安装，这不会启用 egressGateways ，减少开销
    ```
    - 这会在 k8s 中创建一个 istio-system 命名空间，以 Deployment 方式部署 istiod、ingressgateway 等应用。
    - 卸载 Istio 的命令：
      ```sh
      istioctl uninstall --purge
      kubectl delete namespace istio-system
      ```
    - 升级 Istio 的版本时，建议不要跨小版本升级，比如不要从 1.6.x 升级到 1.8.x 。详细的升级方式见 [官方文档](https://istio.io/latest/docs/setup/upgrade/canary/) 。

3. 安装 kiali 套件：
    ```sh
    kubectl apply -f istio-$VERSION/samples/addons/kiali.yaml
    kubectl apply -f istio-$VERSION/samples/addons/jaeger.yaml
    kubectl apply -f istio-$VERSION/samples/addons/prometheus.yaml
    kubectl apply -f istio-$VERSION/samples/addons/grafana.yaml
    ```
    - 需要在 kiali 的配置文件里指定依赖组件的地址：
      ```yml
      external_services:
        custom_dashboards:
          enabled: true
        istio:
          root_namespace: istio-system
        tracing:
          enabled: true
          in_cluster_url: http://tracing:16685/jaeger
          use_grpc: true
        prometheus:
          url: http://prometheus:9090/
        grafana:
          enabled: true
          in_cluster_url: http://grafana:3000/
      ```

## 代理

### 注入Pod

- 想让 Istio 管理某些 Pod 的网络流量时，需要满足以下条件：
  - 给 Pod 注入 Envoy 代理，从而加入 Service Mesh 。
  - 一个 Pod 应该至少绑定一个 k8s Service ，即使 Pod 不暴露端口。这样方便用作 destination 。
    - 如果一个 Pod 绑定多个 k8s Service ，则不能暴露同一个端口，即使通信协议不同。
  - 给 Pod 添加以下标签，方便被 Istio 监控、链路追踪：
    ```yml
    labels:
      app: xx
      version: xx
    ```
  - Pod 没有配置 `hostNetwork: true` 。
  - Pod 内保留 `15000~15100` 端口不使用，供 Sidecar 专用。

- 给 Pod 注入 Envoy 代理时，通常采用 Sidecar 方式，原理如下：
  - 在每个 Pod 中添加一个 init 类型的容器，名为 istio-init 。负责设置 iptables 规则，将 Pod 的出入流量转发到 Envoy 。
  - 在每个 Pod 中添加一个 sidecar 类型的容器，名为 istio-proxy 。负责担任透明代理，拦截当前 Pod 收发的网络包，过滤、修改之后再放行。
    - istio-proxy 容器内，采用 UID 为 1337 的普通用户，运行 envoy 和 pilot-agent 进程。
    - Pod 的出入流量都会经过 Sidecar 代理，相当于在 k8s 原生的 kube-proxy 网络层之上加了一个代理层。
    - Pod 内各容器之间的通信，不会经过 Sidecar 。

- Istio 支持自动给 Pod 注入 Envoy 代理。
  - 原理：用户新建一个 Pod 时，Istio 自动从一个名为 istio-sidecar-injector 的 ConfigMap 中读取 YAML 模板，据此修改 Pod 的配置，添加 istio-init、istio-proxy 容器和 volumes 等配置。
  - 方式一：给一个 k8s 命名空间添加以下 label ，就会让 Istio 自动注入该命名空间中所有新建的 Pod 。
    ```sh
    kubectl label namespace default istio-injection=enabled
    ```
  - 方式二：创建一个 Pod 时添加一个标签 `sidecar.istio.io/inject: "true"` ，就会单独注入该 Pod 。

- 例：在 k8s 内运行一个监听 80 端口的 Nginx 应用，然后在一个被注入 Envoy 代理的 Pod 内，测试访问 Nginx
  ```sh
  $ curl 10.42.0.10 -I        # Service Mesh 内的 Pod ，默认可以访问任意 IP ，不管目标 IP 是否在 Service Mesh 内、k8s 集群内
  HTTP/1.1 200 OK
  content-length: 612
  content-type: text/html
  server: envoy               # Pod 发出的流量都会经过 istio-proxy ，因此 HTTP 响应报文由当前 Pod 的 Sidecar 返回

  $ curl 10.42.0.10:443 -I    # 这里访问错误的端口，导致 TCP 连接失败，因此 Sidecar 返回 HTTP 503 响应
  HTTP/1.1 503 Service Unavailable
  content-length: 145
  content-type: text/plain
  server: istio-envoy

  $ curl 10.42.0.10:443       # 查看报错内容
  upstream connect error or disconnect/reset before headers. reset reason: connection failure, transport failure reason: delayed connect error: 111

  $ curl 1.1.1.1 -I           # 访问 k8s 集群外一个不可达的 IP ，Sidecar 也是返回 HTTP 503 响应
  HTTP/1.1 503 Service Unavailable
  ```

### istio-proxy

- Istio 转发 HTTP 流量时，是根据 headers 中的 Host 字段进行路由。
  - 比如 `curl 10.0.0.1 -H "Host: nginx.default"` 会被路由到 nginx.default 处，不考虑 IP 地址 10.0.0.1 。
  - 比如 `curl <pod_ip>` 直接访问 Pod 时，流量虽然会经过 istio-proxy ，但不会获得 Istio 路由等功能。
  - 转发 TCP、HTTPS 流量时，不知道 Host 字段，因此只能根据 IP 地址进行路由。

- Envoy 支持代理 TCP、UDP、HTTP、gRPC 等多种协议的流量，但 Istio 只会代理基于 TCP 的流量，比如 TCP、HTTP、gRPC 。
  - Istio 不会代理非基于 TCP 的流量，比如 UDP 。这些流量不会被 Sidecar 拦截，而是被 Pod 直接收发。同理，这些流量不会经过 ingressgateway、egressgateway 。
  - Istio 能自动检测网络流量采用的协议，比如 HTTP/1.0 和 HTTP/2 协议。如果检测不出，则当作原始 TCP 流量处理。
  - istio-proxy 收到客户端的 HTTP 请求时，默认采用 HTTP/1.1 协议转发 HTTP 请求给 upstream 。除非在 Pod 所属的 Service 中，声明端口采用的协议：
    ```yml
    apiVersion: v1
    kind: Service
    metadata:
      name: nginx
      namespace: default
    spec:
      ports:
      - appProtocol: http     # 可用 appProtocol 字段声明协议
        name: http-web        # 也可用 name: <protocol>-xx 的格式声明协议
        port: 80
      - appProtocol: https
        name: https-web
        port: 443
    ```
    - 声明 tcp 时，表示将 TCP 原始流量转发给 upstream 。
    - 声明 http 时，表示将 HTTP/1.1 明文流量转发给 upstream 。
    - 声明 http2 时，表示将 HTTP/2 明文流量转发给 upstream 。
    - 声明 https 时，表示将 TLS 加密流量转发给 upstream 。Sidecar 不会解密 TLS 流量，而 ingressgateway、egressgateway 可以解密 TLS 流量。

- 关于滚动部署：
  - k8s 滚动部署 Pod 时，新请求会交给新 Pod 处理，而旧请求依然交给旧 Pod 处理。需要采取一些措施避免中断旧请求，比如给业务容器添加 preStop 钩子，等准备好了才终止容器。
  - 使用 Istio 时，增加了一个问题：
    - 终止 Pod 时，k8s 会同时终止业务容器和 Sidecar 容器。即使业务容器因为 preStop 没有立即终止，Sidecar 也会立即终止，不再处理 Pod 的出入流量，导致旧请求中断。
  - 上述问题的解决方案：
    - 可以修改 istio-sidecar-injector 中的 Sidecar 模板，添加 preStop ，sleep 几秒再终止容器。
    - Istio v1.5 开始，当 Sidecar 被要求终止时，会进入一个优雅终止阶段。
      - 原理：调用 Envoy 的 `/drain_listeners?inboundonly` 接口，不再接受入方向的新连接，但入方向的现有连接、出方向的连接依然放通。
      - 该阶段会持续 `terminationDrainDuration: 5s` 时长，然后才终止 Sidecar 容器。该时长不能超过 Pod 的 terminationGracePeriodSeconds 。
  - Envoy 本身支持热重启（hot restart），流程如下：
    1. 使用新的代码、配置，运行一个新 Envoy 进程，处理新的网络连接。
    2. 旧 Envoy 进程不再接受新连接，并等待现有连接结束，该过程称为 Drain 。最后终止旧 Envoy 进程。
        - 保持现有连接的超时时间为 --drain-time-s=600s 。
        - 保持旧 Envoy 进程的超时时间为 --parent-shutdown-time-s=900s 。

## 流量管理

### VirtualService

- 虚拟服务（Virtual Service）
  - ：Istio 的一种 CRD ，用于配置路由规则，将某些请求流量路由到某些 upstream 。
  - k8s 原生的 Service 不支持配置路由规则，会将流量随机分配给每个 EndPoints 。而 VirtualService 提供了复杂的路由规则。
  - 详细配置见 [官方文档](https://istio.io/latest/docs/reference/config/networking/virtual-service/)

- 例：根据 HTTP 请求的 uri 取值，路由到不同 upstream
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: VirtualService
  metadata:
    name: test-route
    namespace: default
  spec:
    # gateways:         # 可选将 VirtualService 绑定到当前命名空间的某个网关。使得这些网关处理流量时，采用该 VirtualService 的路由规则
    # - test-gateway
    # exportTo:         # 将该 VirtualService 导出到指定命名空间
    # - "*"             # 默认为 * ，表示导出到所有命名空间，可被所有 Pod 访问。改为 . 则只导出到当前命名空间
    hosts:              # 如果请求流量的目标地址匹配该 hosts 数组，则采用该 VirtualService 的路由规则
    - 10.0.0.1          # 指定的 host 不必是一个实际可访问的地址。格式可以是 IP 地址、DNS 名称，还可以使用通配符 *
    - nginx.default     # k8s 创建的 DNS 名称可以用 FQDN 格式，或短域名。建议不要省略命名空间，否则会在 VirtualService 所在命名空间寻址
    - test.com
    - "*.test.com"
    http:
    - match:            # 如果请求流量是 HTTP 报文，且 uri 为指定前缀，则路由到 nginx 服务的 v1 分组
      - uri:
          prefix: /api/v1
      route:
      - destination:    # 这里 upstream 是一个 subset ，需要事先创建 DestinationRule 对象来定义 subset ，否则有请求路由到此时会返回 HTTP 503 响应
          host: nginx
          subset: v1
    - route:
      - destination:    # 这里 upstream 是一个名为 nginx 的域名，通常是 k8s Service
          host: nginx
  ```
  - 每个虚拟服务可以定义一组 route 规则。
    - 处理流量时，会从上到下检查各个 route 规则。如果流量匹配一个 route 规则，则立即生效，否则继续检查后面的 route 规则。
  - 如果一个 route 规则没有 match 条件，则会匹配所有流量，除非这些流量先匹配了前面的 route 规则。
    - 如果一个请求不匹配任何 route 规则，则会返回 HTTP 404 响应。
    - 建议在每个虚拟服务的最后定义一个没有 match 条件的 route 规则，作为默认路由。
  - 修改了路由规则之后，会立即同步到所有 istio-proxy 。集群很大时，同步耗时可能有几秒。
  - VirtualService 默认不绑定 Gateway ，因此路由规则会作用于 Service Mesh 中所有 Pod 出入的流量。
    - 如果将 VirtualService 绑定到 Gateway ，则只会作用于该 Gateway 出入的流量。
  - 例：在一个被注入 Envoy 代理的 Pod 内，测试访问上述 VirtualService
    ```sh
    $ curl 10.0.0.1/ -I     # 这里目标 IP 匹配上述 VirtualService 的 hosts 数组，因此按上述 VirtualService 的路由规则处理流量
    HTTP/1.1 200 OK

    $ curl nginx -I         # 这里会解析 nginx 域名，发现跟 nginx.default 指向同一个 k8s Service ，因此匹配上述 VirtualService
    HTTP/1.1 200 OK

    $ curl 10.0.0.2/ -I     # 这里目标 IP 不匹配上述 VirtualService ，也访问不到该 IP 地址，因此 Sidecar 返回 HTTP 503 响应
    HTTP/1.1 503 Service Unavailable

    curl test.com -I        # 这里会先解析 test.com 域名，指向 k8s 集群外的一个 IP ，然后建立 TCP 连接失败
    curl: (7) Failed to connect to test.com port 80 after 153 ms: Connection refused

    $ curl 10.0.0.2/ -H 'Host: test.com' -I   # 这里请求一个不存在的 IP ，但 Sidecar 会根据 Host 字段进行路由，因此匹配上述 VirtualService
    HTTP/1.1 200 OK
    ```

- VirtualService 可对 http、tls、tcp 三种流量进行路由，不过对 http 流量的路由规则最多样。
  ```yml
  http:
  - match:
    - uri:
        prefix: /api/v1
    route:
    - destination:
        host: nginx
  ```
  ```yml
  tls:
  - match:
    - port: 443
      sniHosts:
      - test.com
    route:
    - destination:
        host: nginx.default
  ```
  ```yml
  tcp:
  - match:
    - port: 27017
    route:
    - destination:
        host: mongo.default.svc.cluster.local
        port:
          number: 27017
  ```

- 路由规则的详细示例：
  ```yml
  - name: route-v1        # 可选给路由规则命名，会记录在访问日志中
    match:
    - uri:
        prefix: /api/v1
    rewrite:              # 可以在路由转发之前，修改 uri
      uri: /api/v2
    route:
    - destination:
        host: nginx
        subset: v1
      weight: 70          # 一个 route 规则可定义多个 destination ，按百分比权重分配流量
    - destination:
        host: nginx
        port:             # 如果 upstream 为 k8s service ，且只定义了一个端口，则可省略端口号
          number: 80
        subset: v2
      weight: 30
      headers:            # 用于修改请求报文、响应报文的 headers
        request:
          set:            # 动作可以是 set、add、remove
            version: v1
          add:
            version: v1
        response:
          remove:
          - version

    timeout: 5s           # 将 HTTP 请求路由转发给 upstream 时，如果超过一定时长未返回 HTTP 响应，则认为请求失败，Envoy 会返回 HTTP 503 响应。默认不限制超时
    retries:              # 路由转发给 upstream 时，如果转发 HTTP 请求失败，是否自动重试
      attempts: 3         # 最多重试几次。重试间隔大概为 25ms
      perTryTimeout: 3s   # 每次重试的超时时间。默认继承上级的 timeout
      retryOn: connect-failure,refused-stream,503 # 在这些情况下才自动重试

    fault:                # 故意注入故障，用于测试系统的稳定性。此时不能配置 timeout、retries
      delay:              # delay 类型的故障。按 percentage 百分比选取一些 HTTP 请求，增加它们的延迟
        percentage:
          value: 0.1
        fixedDelay: 5s
      abort:              # abort 类型的故障。按 percentage 百分比选取一些 HTTP 请求，返回表示失败的状态码
        percentage:
          value: 50
        httpStatus: 500
  ```
  - match 匹配条件有多种：
    ```yml
    match:                # match 数组中可包含多组条件，它们是 OR 的关系。流量只要满足其中一组条件，就会采用当前 route 规则
    - name: v1            # 可选给匹配条件命名，会记录在访问日志中
      uri:                # 这组条件包含了 uri、headers 两个条件，它们是 AND 的关系。流量需要同时满足它们，才算满足这组条件
        prefix: /api/v1
      headers:
        username:
          exact: test

    - uri:                    # 对 uri 进行匹配。匹配语法为 StringMatch ，可选 exact、prefix、regex 三种匹配方式
        exact: /index.html    # 字符串完全匹配
        # prefix: /index      # 字符串前缀匹配
        # regex: /index.*     # 字符串正则匹配，采用 Google RE2 语法
      # ignoreUriCase: false  # 是否不区分 uri 的大小写，默认为 false

    - port: 80

    - method:                 # 对 HTTP 请求方法进行匹配，匹配语法为 StringMatch
        exact: GET

    - headers:
        username:             # 选择 headers 中的一个字段，进行匹配，匹配语法为 StringMatch 。字段名采用小写
          exact: test

    - queryParams:
        version:              # 选择 queryParams 中的一个字段，进行匹配
          exact: v1
    ```
  - 处理流量时，可选的操作除了 route ，还有 redirect 等：
    ```yml
    redirect:         # 返回重定向报文
      uri: /api/v1/
      # redirectCode: 301
    ```
    ```yml
    directResponse:   # 返回自定义的 HTTP 响应
      status: 503
      body:
        string: "{\"error\": \"unknown error\"}"
    headers:
      response:
        set:
          content-type: appliation/json
    ```
    ```yml
    delegate:         # 委托，将流量交给另一个 VirtualService 处理
      name: test-route
      namespace: default
    ```
    ```yml
    mirror:           # 将流量拷贝一份，发送到另一个地址，方便调试。同时该流量依然会被非 mirror 路由规则处理
      host: nginx
      subset: v2
    mirrorPercentage: # 按百分比将流量发送到 mirror ，取值范围为 0.0~100.0
      value: 100.0    # 默认为 100.0
    ```

- 关于动态路由：
  - 存在多个 upstream 时，可通过 weight 实现灰度发布。
    - 不过 weight 是控制客户端访问不同 upstream 的概率。同一个客户端重复发出请求时，可能访问到不同的 upstream ，因此不能隔离访问流量。
  - 如果想让某些客户端固定访问某个 upstream ，可根据 uri、headers 等取值选择 upstream ，实现标签路由。

### DestinationRule

- 目标规则（Destination Rule）
  - ：Istio 的一种 CRD ，用于给 upstream 添加一些配置参数。比如划分多个子集（subset），即分组。

- 例：
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: DestinationRule
  metadata:
    name: test-destination-rule
    namespace: default
  spec:
    host: nginx             # upstream 地址，通常填一个 k8s Service 的 DNS 名称，这会自动发现其下所有 Pod Endpoints
    # trafficPolicy:        # 设置所有 subsets 的负载均衡策略
    #   loadBalancer:
    #     simple: RANDOM    # 默认为 RANDOM
    subsets:                # 将 upstream 分成多组
    - name: v1              # 第一组 upstream ，组名为 v1 ，指向 k8s 中匹配以下 labels 的 Pod
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
      trafficPolicy:
        loadBalancer:       # 给该 subset 单独设置负载均衡策略
          simple: ROUND_ROBIN
        connectionPool:
          tcp:
            connectTimeout: 2s
  ```

- 可选添加以下关于熔断的配置：
  ```yml
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100           # 限制 TCP 并发连接数
      http:
        http1MaxPendingRequests: 10   # 限制等待建立 TCP 连接的 HTTP 请求数，超过则返回熔断响应。默认为 1024
        http2MaxRequests: 1024        # 限制同时活动的请求数，适用于 http/1.1 和 http/2
        maxRequestsPerConnection: 0   # 限制每个 TCP 连接可传输的 HTTP 请求数。默认为 0 ，表示不限制
        idleTimeout: 1h               # 如果一个 TCP 长时间没有活动的 HTTP 请求，则关闭连接
    # outlierDetection:               # 用于自动从负载均衡池弹出不健康实例
    #   consecutive5xxErrors: 5       # 如果某个实例连续多少次返回的响应是 HTTP 5xx ，则将该实例从负载均衡池弹出。默认为 5
    #   interval: 10s                 # 每隔多久检查一次所有实例。默认为 10s
    #   baseEjectionTime: 30s         # 从负载均衡池弹出不健康实例时，至少弹出多久。默认为 30s
    #   maxEjectionPercent: 10        # 最多允许弹出负载均衡池中多少百分比的实例。默认为 10%
  ```
  - 综上，Istio 可以限制并发连接数，也可以在 upstream 未通过健康检查时触发熔断，让 Envoy 返回 HTTP 503 响应。

### ServiceEntry

- 服务条目（Service Entry）
  - ：Istio 的一种 CRD ，用于将自定义的服务注册到 Istio 。
  - Istio 会利用 k8s 的服务发现机制，自动发现所有 Service、EndPoints 并注册到 Istio ，可作为 destination 管理。而其它服务，比如 k8s 集群内的非网格服务、k8s 集群外的服务，则需要以 Service entries 的方式注册到 Istio 。
- 例：创建 ServiceEntry
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: ServiceEntry
  metadata:
    name: test1
    namespace: default
  spec:
    hosts:
    - mongodb.default
    addresses:
    - 192.168.0.1
    ports:
    - name: mongodb
      number: 27017
      protocol: tcp
    location: MESH_EXTERNAL # upstream 是否位于 Service Mesh 内
    resolution: STATIC      # 服务发现方式。这里表示 upstream 的 endpoints 地址是固定值
    endpoints:
    - address: 10.0.0.1
    # - address: 10.0.0.2
    # exportTo:
    # - "*"
  ```
  - 此时执行 `curl 192.168.0.1:27017` ，流量会被路由到 `10.0.0.1:27017` ，即使 192.168.0.1 并不属于 k8s 的 Cluster IP 。
  - 此时可创建 VirtualService 对象，调用这个名为 mongodb 的 destination 。或者创建 DestinationRule 对象，给该 destination 添加一些配置参数。
  - upstream 除了指向 IP 地址，也可指向域名并自动 DNS 解析，也可通过 workloadSelector 指向一些 Pod 。详见 [官方文档](https://istio.io/latest/docs/reference/config/networking/service-entry/) 。

### Gateway

- 网关（Gateway）
  - ：Istio 的一种 CRD ，用于管理 Istio 服务网格与外部之间的网络流量。
  - 为了将 k8s 集群内服务暴露到集群外，用户可使用 Istio Ingress Gateway ，也可使用 APISIX 等其它类型的 Ingress 。

- 使用步骤：
  1. 安装 Istio 时，可附带安装 ingressgateway、egressgateway 两个方向的网关程序。
  2. 创建 Gateway 对象，控制 ingressgateway、egressgateway 如何处理第 4~6 层的网络流量，比如 TCP 负载均衡、TLS 。
  3. 创建 VirtualService 对象，绑定到 Gateway 对象。这样就会根据 VirtualService 路由规则，处理网关出入的流量。

- 例：创建一个 Gateway 对象
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: Gateway
  metadata:
    name: test-gateway
    namespace: default
  spec:
    selector:
      istio: ingressgateway   # 选择具有该 label 的 Pod ，即选择该 Gateway 对象绑定的网关程序
    servers:
    - hosts:
      - "*"
      port:
        number: 31400
        name: tcp
        protocol: TCP         # TCP 协议
    - hosts:                  # Gateway 收到网络包时，如果目的地址匹配这些 hosts ，则放通。否则拒绝，返回 HTTP 404 响应
      - "*.test.com"
      port:
        name: http
        number: 80
        protocol: HTTP        # HTTP 协议
    - hosts:
      - "*.test.com"
      port:
        name: https
        number: 443
        protocol: HTTPS       # HTTPS 协议
      tls:
        mode: SIMPLE
        credentialName: test-cert
  ```
  - 以上示例是使用 ingressgateway ，处理入方向的流量。用户也可使用 egressgateway ，处理出方向的流量，比如禁止访问公网地址。

- Gateway 是一种 k8s CRD 对象，而 ingressgateway、egressgateway 才是实际运行的网关程序。
  - 它们分别以 Deployment 方式部署，Pod 内只运行了一个 istio-proxy 容器。
  - 它们分别绑定一个 LoadBalancer 类型的 Service ，监听 80、443 等多个端口，供集群外主机访问。例如通过以下方式访问：
    ```sh
    curl $loadBalancerIP:$port -H "Host: test.com"
    curl $nodeIP:$nodePort     -H "Host: test.com"
    ```

### Sidecar

- 边车（Sidecar）
  - ：Istio 的一种 CRD ，用于配置每个 Pod 中的 Sidecar 。
  - 每个 k8s 命名空间只能有 0 或 1 个 Sidecar 配置生效。
  - Istio 的 rootNamespace 默认为 istio-config 。在此命名空间创建的 Sidecar 配置，会作用于所有命名空间，除非专门给某个命名空间创建了 Sidecar 配置。
- 例：
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: Sidecar
  metadata:
    name: default
    namespace: istio-config # 该 Sidecar 配置所处的命名空间
  spec:
    egress:                 # 管理该命名空间中所有 Pod 的出流量，只允许发送到这些地址
    - hosts:
      - "./*"               # 允许发送到同一命名空间的任意服务
      - "default/*"         # 允许发送到 default 命名空间的任意服务
  ```

### EnvoyFilter

- EnvoyFilter
  - ：Istio 的一种 CRD ，用于给 Envoy 添加一些过滤器，从而自定义 Envoy 配置。
  - 每个 k8s 命名空间可以有多个 EnvoyFilter 生效。

## 通信安全

### PeerAuthentication

- PeerAuthentication 是 Istio 的一种 CRD ，用于在 Pod 之间启用双向 TLS 认证，实现很安全的通信，不过会大幅增加系统的复杂度、运维难度。
- 原理：
  - 每个 Pod 中的 istio-proxy 在启动时，会从 istiod 申请 TLS 证书。还会自动轮换 TLS 证书，从而避免过期。
  - 两个 Pod 相互通信时，双方的 istio-proxy 先进行 TLS 握手，验证双方的身份、访问权限，然后通过 TLS 连接进行加密通信。

- 例：
  ```yml
  apiVersion: security.istio.io/v1beta1
  kind: PeerAuthentication
  metadata:
    name: test
    namespace: default  # 指定该 PeerAuthentication 作用于哪个命名空间
  spec:
    selector:           # 如果不选择 Pod ，则作用于该命名空间的所有 Pod
      matchLabels:
        app: nginx
    mtls:               # mtls 是 Mutual TLS 的缩写，即双向 TLS
      mode: STRICT
  ```
  - 通信模式有多种：
    - STRICT ：严格模式。Pod 只准接收 TLS 加密流量。
    - PERMISSIVE ：宽容模式。Pod 允许接收 TLS 加密流量、 TCP 明文流量。
    - DISABLE ：禁用双向 TLS 认证。

### AuthorizationPolicy

- AuthorizationPolicy 是 Istio 的一种 CRD ，用于控制对服务的访问权限。
- 例：
  ```yml
  apiVersion: security.istio.io/v1beta1
  kind: AuthorizationPolicy
  metadata:
    name: test-deny
    namespace: default
  spec:
  selector:
    matchLabels:
      app: nginx
      version: v1
  action: DENY
  rules:
  - from:                 # 如果不指定 from 流量来源，则默认选中所有来源
    - source:
        notNamespaces:    # 拒绝非 default 命名空间发来的请求
        - default
  ```
  ```yml
  apiVersion: security.istio.io/v1beta1
  kind: AuthorizationPolicy
  metadata:
    name: test-allow
    namespace: default
  spec:
  selector:
    matchLabels:
      app: nginx
      version: v1
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces:         # 允许来自指定 namespace 的请求
        - default
    - source:
        principals:         # 允许来自指定 Service Account 的请求
        - cluster.local/ns/default/sa/test
        - "*"               # 通配符 * 表示任意通过 TLS 身份认证的 source
    to:
    - operation:
        methods:            # 允许 HTTP 流量
        - GET
        paths:
        - "/api/*"
    - operation:
        ports:              # 允许 TCP 流量
        - 3306
  ```
  - 请求流量被 AuthorizationPolicy 拒绝时，会导致 TLS 握手失败。
  - 如果一个 Pod 不存在 ALLOW 策略，则默认允许所有请求。如果存在 ALLOW 策略，则只允许满足条件的请求。
  - 一个请求同时匹配多种策略时，DENY 策略的优先级高于 ALLOW 策略。
