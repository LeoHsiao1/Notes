# Istio

：一个 Service Mesh 框架，通常部署在 k8s 集群中。
- [官方文档](https://istio.io/latest/docs/)
- 发音为 `/iss-tee-oh/` 。
- 原生的 k8s 缺乏管理 Pod 网络流量的能力，而 Istio 提供了动态路由、熔断、TLS 加密通信、权限控制、可观测性等功能，更擅长微服务架构。

## 原理

- Istio 系统包含以下组件：
  - envoy ：一个代理软件，担任数据平面（data plane）。
    - 在每个 k8s Pod 中添加一个 init 类型的容器，名为 istio-init 。负责设置 iptables 规则，将服务的出入流量转发到 Envoy 。
    - 在每个 k8s Pod 中添加一个 sidecar 类型的容器，名为 istio-proxy 。负责运行 envoy 和 pilot-agent ，以透明代理的方式转发当前 Pod 收发的网络包。
  - istiod ：担任控制平面（control plane），包含以下组件：
    - pilot ：负责配置、引导启动 envoy 。
    - citadel ：负责颁发证书、轮换证书。
    - galley ：负责管理、分发 Istio 的配置。
  - istioctl ：命令行客户端。
  - kiali ：提供了对 Istio 的 Web 管理页面。还支持显示流量图表、链路追踪，此时采用 Prometheus、jaeger 作为数据源。
  - jaeger ：一个 Web 服务器，用于链路追踪。可以不安装。Istio 也支持用 Zipkin 作为链路追踪的后端。

<!--
不会管理 DaemonSet 类型的 Pod ？
 -->

- k8s 集群安装 Istio 之后，Istio 提供了多种 CRD ，用户可创建这些 CRD 来控制 Istio 。

## 部署

1. 查看 Istio 的 [兼容列表](https://istio.io/latest/docs/releases/supported-releases/#support-status-of-istio-releases) ，找到与当前 k8s 版本兼容的 Istio 版本。然后下载：
    ```sh
    VERSION=1.13.9
    wget https://github.com/istio/istio/releases/download/$VERSION/istio-$VERSION-linux-amd64.tar.gz
    tar -xf istio-$VERSION-linux-amd64.tar.gz
    cp istio-$VERSION/bin/istioctl /usr/bin/istioctl
    chmod +x /usr/bin/istioctl
    ```
2. 安装 Istio ：
    ```sh
    export KUBECONFIG=/root/.kube/config
    istioctl install --set profile=demo -y      # 采用 demo 配置来安装，这会启用 istiod、ingressGateways、egressGateways
    # istioctl install --set profile=default -y # 采用 default 配置来安装，这不会启用 egressGateways ，减少开销
    ```
    - 这会在 k8s 中创建一个 istio-system 命名空间，以 Deployment 方式部署 istiod 等应用。
    - 卸载 Istio 的命令：
      ```sh
      istioctl uninstall --purge
      kubectl delete namespace istio-system
      ```

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

4. 如下，给一个 k8s 命名空间添加 label ，指示 istio 管理该命名空间。这样以后新建每个 Pod 时会自动添加 istio-proxy 。
    ```sh
    kubectl label namespace default istio-injection=enabled
    ```

## 流量管理

### Gateway

- 网关（Gateway）
  - ：Istio 的一种 CRD ，用于管理 Istio 整个服务网格接收、发出的网络流量。
  - 用法：
    1. 创建 Gateway 对象，可配置第 4~6 层的网络，比如 TCP 负载均衡、TLS 。
    2. 创建 VirtualService 对象，绑定到 Gateway 对象。这样就会根据 VirtualService 路由规则，处理网关出入的流量。
  - 安装 Istio 时，可选择启用 ingressGateways、egressGateways 两个方向的网关。
  - 创建了 Gateway 之后，用户可使用安装 Istio 附带的 Istio Ingress 暴露服务到 k8s 集群外，也可使用 APISIX 等其它类型的 Ingress 。
    - 虽然 Istio 使得访问 Pod 的流量要经过多层代理转发，但一般只增加了几毫秒耗时。

- 例：
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: Gateway
  metadata:
    name: test-gateway
  spec:
    selector:
      istio: ingressgateway   # 采用默认的 Istio Controller
    servers:
    - hosts:
      - *
      port:
        number: 31400
        name: tcp
        protocol: TCP         # TCP 协议
    - hosts:
      - *.test.com
      port:
        name: http
        number: 80
        protocol: HTTP        # HTTP 协议
    - hosts:
      - *.test.com
      port:
        name: https
        number: 443
        protocol: HTTPS       # HTTPS 协议
      tls:
        mode: SIMPLE
        credentialName: test-cert
  ```

### VirtualService

- 虚拟服务（Virtual Service）
  - ：Istio 的一种 CRD ，用于配置路由规则，将某请求流量路由到某 upstream 。
  - k8s 原生的 Service 不支持配置路由规则，会将流量均匀分配给每个 EndPoints 。而 VirtualService 提供了复杂的路由规则。
  - 详细配置见 [官方文档](https://istio.io/latest/docs/reference/config/networking/virtual-service/)

- 例：根据 HTTP 请求的 uri 取值，路由到不同 upstream
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: VirtualService
  metadata:
    name: test-route
  spec:
    hosts:              # 如果请求流量的目标地址匹配该 hosts 数组，则采用该 VirtualService 的路由规则
    - 10.0.0.1          # 该数组中的 host 不必是一个实际可访问的地址。格式可以是 IP 地址、DNS 名称，还可以使用通配符 *
    - nginx.default     # k8s 创建的 DNS 名称可以用 FQDN 格式，或短域名。如果省略命名空间，则会在 VirtualService 所在命名空间寻址
    - test.com
    - *.test.com
    gateways:           # 将 VirtualService 绑定到网关。使得这些网关处理流量时，采用该 VirtualService 的路由规则
    - ingress-gateway
    http:               # 如果请求流量是 HTTP 报文，且 headers 包含 username: test ，则路由到 v1 服务，否则路由到 v2 服务
    - match:
      - uri:
          prefix: /api/v1
      route:
      - destination:
          host: nginx
          subset: v1
    - route:
      - destination:
          host: nginx
          subset: v2
  ```
  - 每个虚拟服务可以定义一组 route 规则。
    - 处理流量时，会从上到下检查各个 route 规则。如果流量匹配一个 route 规则，则立即生效，否则继续检查后面的 route 规则。
  - 如果一个 route 规则没有 match 条件，则会匹配所有流量，除非这些流量先匹配了前面的 route 规则。
    - 建议在每个虚拟服务的最后定义一个没有 match 条件的 route 规则，作为默认路由。

- VirtualService 可对 http、tls、tcp 三种流量进行路由：
  ```yml
  tls:
  - match:
    - port: 443
      sniHosts:
      - test.com
    route:
    - destination:
        host: nginx
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

- match 匹配条件的详细示例：
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
      username:             # 选择 headers 中的一个字段，进行匹配，匹配语法为 StringMatch
        exact: test
  - queryParams:
      version:              # 选择 queryParams 中的一个字段，进行匹配
        exact: v1
  ```

### DestinationRule

- 目标规则（Destination Rule）
  - ：Istio 的一种 CRD ，用于给 upstream 定义多个子集（subset），即分组。
  - 如果一个 VirtualService 将流量路由到某个 destination 的 subset ，则需要事先创建 DestinationRule 对象。

- 例：
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: DestinationRule
  metadata:
    name: test-destination-rule
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

- 添加以下配置，可在负载过大时自动熔断服务，让 Envoy 返回 HTTP 503 响应：
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



<!--
    访问 Service IP 时，Istio 会取代 kube-proxy 来实现反向代理？
-->



### ServiceEntry

- 服务条目（Service Entry）
  - ：Istio 的一种 CRD ，用于将自定义的服务注册到 Istio 。
  - Istio 会利用 k8s 的服务发现机制，自动发现所有 Service、EndPoints 并注册到 Istio ，可作为 destination 管理。而其它服务，比如 k8s 集群内的非网格服务、k8s 集群外的服务，则需要以 Service entries 的方式注册到 Istio 。
- 例：创建 ServiceEntry
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: ServiceEntry
  metadata:
    name: test2
  spec:
    hosts:
    - *.test2.com
    ports:
    - name: https
      number: 443
      protocol: HTTPS
    location: MESH_EXTERNAL   # 添加一个在服务网格外部的服务，通过 DNS 解析地址
    resolution: DNS
  ```
  然后创建相关的 DestinationRule ：
  ```yml
  apiVersion: networking.istio.io/v1alpha3
  kind: DestinationRule
  metadata:
    name: test2
  spec:
    host: *.test2.com
    trafficPolicy:            # 注册了外部服务之后，可像网格内服务一样添加配置
      connectionPool:
        tcp:
          connectTimeout: 2s
  ```

### Sidecar

- 边车（Sidecar）
  - ：Istio 的一种 CRD ，用于配置每个 Pod 中的 istio-proxy 代理。
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
      - ./*                 # 允许发送到同一命名空间的任意服务
      - default/*           # 允许发送到 default 命名空间的任意服务
  ```
  - 每个 k8s 命名空间只能有 0 或 1 个 Sidecar 配置生效。
    - Istio 的 rootNamespace 默认为 istio-config 。在此命名空间创建的 Sidecar 配置，默认会作用于所有命名空间，除非专门给某个命名空间创建了 Sidecar 配置。

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
        - *                 # 通配符 * 表示任意通过 TLS 身份认证的 source
    to:
    - operation:
        methods:            # 允许 HTTP 流量
        - GET
        paths:
        - /api/*
    - operation:
        ports:              # 允许 TCP 流量
        - 3306
  ```
  - 请求流量被 AuthorizationPolicy 拒绝时，会导致 TLS 握手失败。
  - 如果一个 Pod 不存在 ALLOW 策略，则默认允许所有请求。如果存在 ALLOW 策略，则只允许满足条件的请求。
  - 一个请求同时匹配多种策略时，DENY 策略的优先级高于 ALLOW 策略。

