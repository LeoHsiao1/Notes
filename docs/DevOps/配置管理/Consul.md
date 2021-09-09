# Consul

：一个 Web 服务器，用于配置管理、服务发现。
- [官方文档](https://www.consul.io/docs)
- 发音为 `/ˈkɒnsl/` 。
- 采用 Golang 开发。

## 原理

- 架构：
  - 部署多个 Consul agent 进程，组成分布式集群。
  - 业务程序向一个 agent 发出请求，注册服务。
    - Consul 的设计是在每个主机上部署一个 agent ，让每个主机上的业务程序访问本机的 agent 进行服务注册。

- Consul 支持划分多个数据中心（Data Center）。
  - 一个数据中心代表一个局域网（LAN），包含一组可以内网互联的主机。
  - 不同数据中心之间通过 WAN 通信。

- Consul 的 Enterprise 版本支持划分 namespace 。

### agent

- agent 又称为 node ，有两种运行模式：
  - client
    - ：普通的 agent 。
  - server
    - ：比 client 多了维护分布式集群的责任。负责存储集群数据，并保证分布式一致性。
    - 采用 Raft 算法，每次修改集群数据时需要 quorum 个 server 同意。
    - 多个 server 之间会自行选出 leader 。
    - 建议部署 3 或 5 个 server ，允许 1 或 2 个 server 故障，实现高可用。

- agent 的状态：
  - agent 进程启动，通过 join 命令加入集群，注册自己的信息，并发现其它 agent 。
  - 如果一个 agent 不能被其它 agent 访问到，则标记为 failed 状态。
    - 这可能是因为网络不通，或 agent 崩溃。
  - 如果一个 agent 主动退出集群，则标记为 left 状态，并且注销该 agent 上注册的所有服务。
    - 比如 agent 进程正常终止时，会主动退出集群。
  - 集群会定期从 catalog 删除 failed、left 状态的 agent 。


<!--
- server 之间会同步 Key/Value 数据，
  - 因为 

- 集群中的 agent 基于 gossip 协议维护自己的在线状态
- Intention ：用于允许、禁止服务之间的网络连通。 -->


- agent 提供了一些 Restful API ：
  ```sh
  GET   /v1/agent/members           # 获取所有 agent 的信息，这由当前 agent 从 cluster gossip pool 中获取
  PUT   /v1/agent/reload            # 让当前 agent 重新加载其配置文件
  PUT   /v1/agent/leave             # 让当前 agent 正常退出集群
  GET   /v1/agent/services                        # 获取当前 agent 上注册的所有服务的信息
  GET   /v1/agent/service/<serivce.id>            # 获取当前 agent 上注册的指定服务的信息
  PUT   /v1/agent/service/register                # 注册服务，这会调用 /v1/catalog/register
  PUT   /v1/agent/service/deregister/<serivce.id> # 注销服务，这会调用 /v1/catalog/deregister

  PUT   /v1/catalog/register        # 在 catalog 中注册对象
  PUT   /v1/catalog/deregister      # 在 catalog 中注销对象
  GET   /v1/catalog/nodes           # 列出所有节点
  GET   /v1/catalog/services        # 列出所有服务

  GET     /v1/kv/<key>              # 获取指定的 key 的信息，包括 value
  PUT     /v1/kv/<key>              # 创建 key ，如果该 key 已存在则更新它
  DELETE  /v1/kv/<key>              # 删除 key
  ```
  - 担任 server 的 agent 将数据存储在 catalog 目录下。

## 配置管理

- Key/Value 功能适合用于配置管理
  - key 如果以 / 结尾，则会创建一个文件夹
  - KV 存储中的值不能大于 512kb

## 服务发现

- 可通过 HTTP、DNS 请求实现服务发现
- service 的信息示例：
  ```json
  {
      "ID": "django",                 // 该服务在当前 agent 上的唯一 ID 。如果未指定，则采用服务名
      "Service": "django",            // 服务名。注册服务时只有该字段是必填的
      "Address": "10.0.0.1",          // 服务的 IP 地址或主机名。如果未指定，则采用当前 agent 的 IP 地址
      "Port": 80,
      "TaggedAddresses": {            // 可以给服务附加多个地址
          "lan": {                    // LAN 地址，供同一数据中心的其它服务访问。默认为 IPv4 类型
              "Address": "10.0.0.1",
              "Port": 80
          },
          "wan": {                    // WAN 地址，供其它数据中心的服务访问。默认为 IPv4 类型
              "Address": "10.0.0.1",
              "Port": 80
          }
      },
      "Tags": [                       // 可以给服务加上一些字符串类型的标签
          "test"
      ],
      "enable_tag_override": false,   // 是否允许其它 agent 修改该服务的 tag
      "Meta": {                       // 可以给服务加上一些键值对类型的元数据，默认为 false
          "description": "This is for test."
      },
      "checks": [],
      "Weights": {                    // 该服务在 DNS SRV 响应中的权重，默认为 1
        "Passing": 1,
          "Warning": 1
      },
      "Datacenter": "dc1"             // 该服务所属的数据中心
  }
  ```

- DNS
  - 如果服务未通过健康检查或节点有任何未通过的系统级检查，即为 critical 状态，则 DNS 接口将从任何服务查询中忽略该节点。

- agent 会定时进行健康检查：
  - 检查该 agent 所在主机的状态。
  - 检查该 agent 上注册的所有服务的状态。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    consul:
      container_name: consul
      image: consul:1.9.8
      command: agent -server -bootstrap-expect=3 -node=node1 -client=0.0.0.0 -ui
      restart: unless-stopped
      environment:
        CONSUL_BIND_INTERFACE: eth0
      network_mode:
        host
      volumes:
        - /etc/localtime:/etc/localtime:ro
        - ./config:/consul/config
        - ./data:/consul/data
  ```
  - 容器内以非 root 用户运行服务，需要调整挂载目录的权限：
    ```sh
    mkdir -p  config data
    chown -R  100 .
    ```

- 命令用法：
  ```sh
  consul agent                              # 启动 agent 进程，采用 client 运行模式，在前台运行
              -server                       # 采用 server 运行模式
              -bootstrap-expect=3           # 当发现指定数量的 server 时，才启动集群，选出 leader 。应该设置成与实际 server 总数相同，以避免脑裂
              
              -join=10.0.0.1                # 启动时，连接到另一个 agent 的 Serf LAN 端口，加入其所属的集群。如果加入失败，则启动失败。可以多次使用该选项，连接多个 agent
              # -retry-join=10.0.0.1        # 代替 -join 方式，如果加入失败，则自动重试
              # -retry-interval=30s         # 重试的间隔时间
              # -retry-max=0                # 重试次数。默认为 0 ，即不限制
              # -join-wan=10.0.0.1          # 启动时，连接到另一个 agent 的 Serf WAN 端口，加入其所属的集群
              # -retry-join-wan=10.0.0.1

              -node=node1                   # 指定该节点的名称，在集群中唯一。默认采用主机名
              # -ui                         # 是否让 HTTP 端口提供 Web UI 。默认不提供，只提供 Restful API
              # -datacenter dc1             # 指定该 agent 所属的数据中心名称，默认为 dc1
              # -bind 0.0.0.0               # 该 agent 的 LAN 服务绑定的地址，默认为 0.0.0.0
              # -advertise 10.0.0.1         # 公布一个地址，供其它 agent 访问。默认公布本机的 IPv4 地址，如果本机有多个地址则启动失败
              # -client 0.0.0.0             # 该 agent 的 HTTP、DNS 服务绑定的地址，供业务程序访问。默认绑定 localhost

              # -config-file <file>         # 指定配置文件
              # -config-dir /consul/config  # 指定配置目录，加载该目录下的配置文件
              # -data-dir /consul/data      # 指定数据目录
              # -log-file /var/log/consul   # 日志文件
              # -log-level info
              # -log-json                   # 让日志采用 JSON 格式，默认禁用

              # 可以监听多个端口，取值为 -1 则表示禁用
              # -server-port 8300       # RPC 端口，基于 TCP 协议
              # -serf_lan 8301          # Serf LAN 端口，基于 TCP、UDP 协议
              # -serf_wan 8302          # Serf WAN 端口，基于 TCP、UDP 协议
              # -http-port 8500         # HTTP 端口，基于 TCP 协议
              # -https-port -1          # HTTPS 端口。默认为 -1 ，启用时建议为 8501
              # -grpc-port -1           # gRPC 端口。默认为 -1 ，启用时建议为 8502
              # -dns-port 8600          # DNS 端口，基于 TCP、UDP 协议
  ```

- Consul agent 启动时的日志示例：
  ```sh
  ==> Found address '10.0.0.1' for interface 'eth0', setting bind option...   # 发现默认网卡的 IP 地址，绑定它
  ==> Starting Consul agent...
            Version: 'v1.6.1'
            Node ID: '2e5r747a-806a-a337-8a0f-7ac5o98d0cc4'
          Node name: 'node1'
          Datacenter: 'dc1' (Segment: '<all>')                                # 所属的数据中心名
              Server: true (Bootstrap: false)                                 # 是否工作在 server 模式
        Client Addr: [0.0.0.0] (HTTP: 8500, HTTPS: -1, gRPC: -1, DNS: 8600)   # 供业务程序访问的地址
        Cluster Addr: 10.0.0.1 (LAN: 8301, WAN: 8302)                         # 供集群中其它 agent 访问的地址
  ```



<!-- 支持通过命令行导入、导出配置：
consul kv import
consul kv export [PREFIX] -->

## 配置

- Consul 支持多种配置方式，优先级从高到低如下：
  - 命令行参数
  - 配置文件：可以是 JSON 或 HCL 格式，文件扩展名为 .json 或 .hcl 。
  - 默认配置

### ACL

Consul 支持为 HTTP、RPC 通信设置 ACL 规则，主要概念如下：

- Token
  - ：一个格式像 UUID 的十六进制字符串，由 Consul 随机生成，代表一个用户。
  - token 的属性：
    - AccessorID ：token 的标识符，不需要保密。
    - SecretID ：用户实际使用的 token 。
  - 访问 Consul 时，可使用 token 进行身份认证，有以下几种方法：
    - 访问 Web 页面，点击右上角的 Log in 按钮，输入 token 进行登录。
    - 客户端发送 HTTP 请求，在 URL 请求参数中包含 `?token=******` ，或者在 Header 中包含 `Authorization: Bearer ******` 。
    - 执行 consul 命令，加上参数 `-token=******` ，或者声明环境变量 `CONSUL_HTTP_TOKEN=******` 。

- Policy
  - ：访问策略，用于控制某个 token 的访问权限。
  - 格式如下：
    ```hcl
    <resource> "<name>" {
      policy = "<policy>"
    }
    ```
    - 语义：对 name 名称的 resource 资源，策略为 policy 。
    - resource 有多种取值，代表对不同类型资源的操作：
      ```sh
      agent     # Consul agent ，可执行 join、leave 等操作
      node      # 数据节点
      service
      key       # KV 资源
      ```
      - 上述 resource 还可扩展成 `<resource>_prefix` ，用于进行前缀匹配。如果指定的前缀为空，则匹配所有名称的该类资源。
    - policy 有多种取值，从高到低如下：
      ```sh
      deny      # 不允许读、写
      write     # 允许读、写、list
      list      # 只对 key 资源有效，允许递归读取当前 key 的子 key
      read      # 只允许读
      ```
      - 在 Web 界面，node、service 资源总是只读的，不支持修改。

  - 例：
    ```hcl
    service_prefix "" {     # 允许读取所有服务
      policy = "read"
    }
    service "service1" {    # 允许读写指定服务
      policy = "write"
    }
    ```
    ```hcl
    key "" {                          # 允许读取名为空的 key ，从而在 Web 端显示 Key/Value 页面
      policy = "read"
    }
    key_prefix "test_env/project1" {  # 允许读写某个路径开头的 key
      policy = "read"
    }
    ```
  - 内置了一个名为 Global Management 的策略，赋予对所有资源的访问权限。
  - 内置了 Service Identities 和 Node Identities ，作为服务、node 的策略模板。

- Role
  - ：角色。可以给某个角色分配一组 Policy ，然后让一组 token 采用该角色。

启用 ACL 的步骤：

1. 修改配置文件：
    ```json
    {
      "acl" : {
        "enabled" : true,           // 是否启用 ACL ，默认禁用
        "default_policy" : "deny",  // 当用户的操作不匹配已有的 ACL 规则时，默认采用的策略。默认为 allow
        "tokens": {
          // "default": "******",   // 如果设置了 default token ，则会取代 Anonymous token
          "agent": "******"         // 指定 agent 之间通信时采用的 token 。如果未指定，则采用 Anonymous token
        }
      }
    }
    ```

2. 执行以下命令，初始化 ACL ：
    ```sh
    consul acl bootstrap
    ```
    这会创建两个 token ：
    - 管理员 token ：分配 Global Management 策略。
    - Anonymous token ：不分配策略。当 agent 收到的请求不包含 token 时，会当作该 token 处理。

3. 访问 Web 页面，用管理员 token 登录，创建一个供 agent 使用的 token ，分配的 policy 如下：
    ```hcl
    node_prefix "" {
      policy = "write"
    }
    service_prefix "" {
      policy = "read"
    }
    ```
    将该 token 保存到配置文件的 acl.tokens.agent 中，重启 agent 即可生效。

4. 创建一个允许读取所有 node 的策略：
    ```hcl
    node_prefix "" {
      policy = "read"
    }
    ```
    DNS 请求不支持传递 token ，因此建议将该策略分配给 Anonymous token 。



