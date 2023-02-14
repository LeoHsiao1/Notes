# Consul

：一个 Web 服务器，提供了配置管理、服务发现、DNS 等功能。
- [官方文档](https://www.consul.io/docs)
- 发音为 `/ˈkɒnsl/` 。
- 2014 年由 HashiCorp 公司开源，采用 Golang 开发。

## 原理

- 架构：
  - 部署多个 Consul agent 进程，组成分布式集群。
  - 业务程序向任一 agent 发出请求，使用 Consul 的功能。

- agent 又称为 node ，有两种运行模式：
  - client
    - ：普通的 agent 。
  - server
    - ：比 client 多了维护集群的责任。
    - 一个 Consul 集群至少要有 1 个 server 节点，负责存储集群数据。
    - 集群采用 Raft 算法实现分布式一致性，建议部署 3 或 5 个 server 。
      - server 之间会自行选出一个 server 担任 leader ，负责引导集群。其它 server 则担任 follower 。
      - 每次修改集群数据时需要 quorum 个 server 同意。
      - client 可以部署上万实例，不影响集群的可用性。

- agent 的状态：
  - agent 进程启动，通过 join 命令加入集群，标记为 alive 状态。
  - 如果一个 agent 不能被其它 agent 访问到，则标记为 failed 状态。
    - 这可能是因为网络不通，或 agent 崩溃。
  - 如果一个 agent 通过 leave 命令退出集群，则标记为 left 状态。
    - 比如 agent 进程正常终止时，会主动退出集群。

- agent 采用多种通信协议，监听不同的端口：
  - agent 之间通过 RPC 协议进行通信，传输层协议为 TCP 。
  - agent 之间通过 Gossip 协议进行节点发现、服务发现，传输层协议同时采用 TCP、UDP 。
    - Gossip 协议：基于 Serf 库开发，用于在集群广播消息，比如节点状态。
    - agent 分别为 LAN、WAN 监听一个端口，提供 Gossip 服务。
  - agent 可以提供 HTTP、HTTPS、gRPC 端口供业务程序访问，传输层协议为 TCP 。
  - agent 可以提供 DNS 端口供业务程序访问，传输层协议同时采用 TCP、UDP 。

- Consul 支持在集群中划分多个数据中心（Data Center）。
  - 每个数据中心相当于一个子集群，各有一个 leader server 。
  - 每个数据中心代表一个局域网，包含一组 agent ，可以通过 LAN 通信。
    - 不同数据中心之间的 agent 通过 WAN 通信。
    - 每个数据中心拥有一个 Gossip LAN 节点池，记录该局域网的所有节点。
    - 整个集群拥有一个 Gossip WAN 节点池，记录集群的所有节点。
  - 用户可以向集群的任一 agent 发出请求，会被自动转发到正确的节点，基于 RPC 通信。
    - 如果 agent 收到指向数据中心的写请求，则会自动转发到 leader 节点。
    - 如果 agent 收到指向其它数据中心的请求，则会转发到该数据中心的任一节点。

- Consul 的 Enterprise 版本支持划分多个 namespace ，用于隔离 service、KV、ACL 数据。

- Consul 启用 Connect 功能时，会在服务之间启用 TLS 加密通信。
  - 支持透明代理服务的流量，实现 Service Mesh 。
  - 支持用 Intention 功能允许、禁止服务之间的网络连通。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    consul:
      container_name: consul
      image: consul:1.9.8
      command: agent
      restart: unless-stopped
      ports:
        - 8300:8300
        - 8301-8302:8301-8302
        - 8301-8302:8301-8302/udp
        - 8500:8500
        - 8600:8600
        - 8600:8600/udp
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

- agent 启动时的日志示例：
  ```sh
  ==> Found address '10.0.0.1' for interface 'eth0', setting bind option...   # 发现以太网接口的 IP 地址，绑定它
  ==> Starting Consul agent...
            Version: 'v1.6.1'
            Node ID: '2e5r747a-806a-a337-8a0f-7ac5o98d0cc4'
          Node name: 'node1'
          Datacenter: 'dc1' (Segment: '<all>')
              Server: true (Bootstrap: false)                                 # 是否采用 server 运行模式
        Client Addr: [0.0.0.0] (HTTP: 8500, HTTPS: -1, gRPC: -1, DNS: 8600)   # client_addr
        Cluster Addr: 10.0.0.1 (LAN: 8301, WAN: 8302)                         # bind_addr
  ```

## 配置

- Consul 支持多种配置方式，优先级从高到低如下：
  - 命令行参数
  - 配置文件：可以是 JSON 或 HCL 格式，文件扩展名为 .json 或 .hcl 。
  - 默认配置

- 配置文件示例：
  ```json
  {
      // 关于磁盘
      // "data_dir": "/consul/data" ,
      // "log_file": "/var/log/consul" ,
      // "log_level": "INFO",
      // "log_json": true,        // 是否让日志采用 JSON 格式，默认禁用

      // 关于节点
      // "datacenter": "dc1",     // 指定该 agent 所属的数据中心名称，默认为 dc1
      "node_name": "node1",       // 指定该节点的名称，在集群中唯一。默认采用主机名
      // "node_id": "xxxx",       // 指定该节点的 UUID 。 node 名称可以修改，但 node_id 不会变
      "server": true,             // agent 是否采用 server 运行模式。默认为 false ，采用 client 运行模式
      "ui_config": {
          "enabled": true         // 是否让 HTTP 端口提供 Web UI 。默认不提供，只提供 Restful API
      },

      // 关于 IP 地址
      // "bind_addr": "0.0.0.0",            // RPC 通信时绑定的地址，供其它 gent 访问，默认绑定 0.0.0.0
      // "serf_lan": "0.0.0.0",             // Gossip LAN 通信时绑定的地址，默认等于 bind_addr
      // "serf_wan": "0.0.0.0",             // Gossip WAN 通信时绑定的地址，默认等于 bind_addr
      "advertise_addr": "10.0.0.1",         // 公布一个地址，供其它 agent 访问。默认公布本机的 IPv4 地址，如果本机有多个地址则启动失败
      // "advertise_addr_wan": "10.0.0.1",  // 公布一个地址，供其它 agent 通过 WAN 访问。默认等于 advertise_addr
      "client_addr": "0.0.0.0",             // 该 agent 的 HTTP、HTTPS、DNS、gRPC 服务绑定的地址，供业务程序访问。默认绑定 localhost

      // 关于各服务监听的端口，-1 表示禁用
      // "ports": {
      //     "server":   8300,
      //     "serf-lan": 8301,
      //     "serf-wan": 8302,
      //     "http":     8500,
      //     "https":    -1  ,        // 默认为 -1 ，启用时建议为 8501
      //     "grpc":     -1  ,        // 默认为 -1 ，启用时建议为 8502
      //     "dns":      8600,
      // },

      // 关于加入集群
      // "bootstrap": false,          // 该 agent 启动之后是否直接担任 leader 。默认为 false ，避免与集群已有的 leader 冲突。集群只包含一个节点时，需要启用该参数
      "bootstrap_expect": 3,          // 当发现指定数量的 server 时，才开始引导集群，选出 leader 。应该设置成与实际 server 总数相同，以避免脑裂
      // "start_join": ["<IP>"],      // agent 启动时，连接到其它 agent 的 LAN 端口，加入其所属的集群。如果加入失败，则启动失败
      // "start_join_wan": ["<IP>"],  // 通过 WAN 端口加入集群
      "retry_join": ["<IP>"],         // 代替 start_join 方式，如果加入失败，则自动重试
      // "retry_interval": "30s",     // 重试的间隔时间
      // "retry_max": "0",            // 重试次数。默认为 0 ，即不限制
      // "retry_join_wan": ["<IP>"],  // 代理 start_join_wan 方式
      // "retry_interval_wan": "30s",
      // "retry_max_wan": "0",
      "rejoin_after_leave": true,         // agent 每次启动是否重新 join 。默认为 false ，只要成功 join 一次之后，重启时并不会重新 join ，导致该 agent 可能故障过久而被被集群删除
      // "reconnect_timeout": "72h",      // 删除集群中长时间无响应的 LAN 节点，包括 failed、left 状态
      // "reconnect_timeout_wan": "72h",  // 删除集群中长时间无响应的 WAN 节点
      // "limits": {
      //     "http_max_conns_per_client": 200  // 限制每个客户端 IP 的并发连接数
      // }

      // 关于 DNS
      // "domain": "consul",          // 让 agent 解析指向该域名的 DNS 查询请求，其它请求则转发给上游 DNS 服务器
      // "recursors": "<IP>",         // 添加上游 DNS 服务器
      // "dns_config": {
      //     "node_ttl": "0s",        // ttl ，默认为 0 ，即禁用缓存
      //     "service_ttl": "0s",
      //     "only_passing": false,   // DNS 结果中是否排除是否健康检查为 warning 或 critical 的节点。默认为 false ，只排除 failing 的节点
      // }
      }
  ```

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
    - 执行 consul 命令，加上参数 `-token=******` ，或者声明环境变量 `export CONSUL_HTTP_TOKEN=******` 。

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

#### 示例

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

## 用法

### 服务发现

- 服务发现的工作流程：
  1. 业务程序访问 agent ，将自己注册为一个服务实例。
  2. 业务程序访问 agent ，通过 HTTP 或 DNS 端口查询已注册的服务。

- Consul 集群将已注册的所有节点、服务的信息保存在一个称为 catalog 的命名空间中，可以通过 API 访问。
  - 注销一个对象，就会从 catalog 删除其存在。
  - Consul 的设计是在每个主机上部署一个 agent ，让每个主机上的业务程序访问本机的 agent 进行服务注册。
    - 一个 agent 变为 left 状态时，会自动注销该 agent 上注册的所有服务。
  - agent 会将自己注册为名为 consul 的服务，但不进行健康检查。

- 一个 service 的信息示例：
  ```json
  {
      "ID": "django",                 // 该服务在当前 agent 上的唯一 ID 。如果未指定，则采用服务名
      "Service": "django",            // 服务名。注册服务时只有该字段是必填的
      "Address": "10.0.0.1",          // 服务的 IP 地址或主机名。如果未指定，则采用当前 agent 的 IP 地址
      "Port": 80,
      "Datacenter": "dc1",            // 该服务所属的数据中心
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
      "checks": [],                   // 健康检查的任务，默认为空
      "Weights": {                    // 该服务存在其它实例时，指定其在 DNS SRV 响应中的权重，默认为 1
          "Passing": 1,
          "Warning": 1
      }
  }
  ```

#### 健康检查

- 每个 agent 会定期进行健康检查，并更新 catalog 中的信息。
- 健康检查的对象分为两种：
  - 节点：该 agent 本身，是否运行、可连接。
  - 服务：该 agent 上注册的各个服务。

- 健康检查的结果分为多种：
  - passing ：健康。
  - warning ：存在异常，但依然工作。
  - failing、critical ：不健康。

- 每个节点默认启用 Serf 类型的监控检查，而每个服务可启用以下类型的健康检查：
  - Script ：指定一个 shell 命令，定期执行一次。
    - 如果退出码为 0 则视作 passing ，为 1 则视作 warning ，为其它值则视作 failing 。
    - 执行时的 stdout、stderr 会被记录到检查结果的 output 字段，可在 Web UI 查看。
    ```json
    {
        "args": ["/usr/bin/curl", "127.0.0.1"],
        // "id": "xx",
        // "name": "xx",
        // "interval": "5s",                    // 每隔 interval 时间执行一次
        // "timeout": "10s",                    // 每次检查的超时时间
        // "status": "critical",                 // 在第一次健康检查之前，服务的默认状态
        // "deregister_critical_service_after": "30s"  // 如果服务实例变为 critical 状态超过一定时间，则注销。默认禁用该功能
    }
    ```
  - HTTP ：指定一个 URL ，定期发出一个 HTTP 请求。
    - 如果状态码为 200 则视作 passing ，为 429 则视作 warning ，为其它值则视作 failing 。
    ```json
    {
        "http": "http://localhost/health",
        "method": "POST",                       // 请求方法，默认为 GET
        "header": {"Content-Type": ["application/json"]},
        "body": "{\"check\": \"is_running\"}"
    }
    ```
  - TCP ：指定主机名和端口，定期尝试建立一次 TCP 连接。
    - 如果连接成功则视作 success ，否则视作 critical 。
    ```json
    {
        "tcp": "localhost:80"
    }
    ```
  - Alias ：指定另一个节点或服务，跟随其状态。
    ```json
    {
        "alias_node": "node1",    // 目标节点。默认为当前节点
        "alias_service": "web"    // 目标服务。如果不指定则跟随节点的状态
    }
    ```
  - Docker ：通过 docker exec 执行 shell 脚本。
  - TTL ：要求服务在一定时间内向 agent 的特定 URL 发送 HTTP 请求，超时则视作异常。
  - gRPC

- 一个服务要通过自身的健康检查（如果要求检查），并且所在 agent 也通过健康检查，才标记为健康状态。
  - 非健康状态的服务不会被自动删除。

#### DNS

- Consul 支持通过 DNS 请求查询节点、服务的地址。
- 域名格式如下：
  ```sh
  <node>.node[.datacenter].<domain>               # 节点的域名
  [tag.]<service>.service[.datacenter].<domain>   # 服务的域名
  ```
  - 如果不指定数据中心，则默认采用当前 agent 的数据中心。
  - 查询服务时，可以加上 tag 进行筛选。
    - 如果有多个健康的服务实例，则根据权重随机选择一个，返回其地址。
    - 如果不存在健康的服务实例，则查询结果为空。
  - DNS 记录为 A 类型，查询服务时还支持 SRV 类型。
  - DNS 记录的 TTL 默认为 0 。
- 例：
  ```sh
  dig @10.0.0.1 -p 8600 +short node1.node.consul          # 查询节点
  dig @10.0.0.1 -p 8600 +short node1.node.dc2.consul      # 查询其它数据中心的节点
  dig @10.0.0.1 -p 8600 +short django.service.consul      # 查询服务
  dig @10.0.0.1 -p 8600 +short django.service.consul  SRV # 查询 DNS SRV 记录
  ```

### 配置管理

- Consul 提供了 Key/Value 形式的数据存储功能，常用于存储配置信息。
  - 如果 key 以 / 结尾，则会创建一个文件夹。
  - value 的长度不能超过 512KB 。

- Consul 集群的所有节点都拥有一份 KV 数据的副本，供用户访问。
  - server 节点才有权修改 KV 数据。如果用户向 client 节点发出写请求，则会被转发到 server 节点。

- 提供了 acquire、release 功能，用于锁定、解锁与 session 关联的 key 。

### watch

- Consul 提供了 watch 功能，用于监视某些事件，当事件发生时执行 handler 任务。
  - 可以监视节点、服务、KV 的变化，或者用户自定义的事件。
  - handler 有两种类型：
    - 执行 shell 脚本
    - 发送 HTTP 请求
- 例：在 Consul 配置文件中添加 watch 的配置
  ```json
  {
    "watches": [                  // 定义一组 watch
      {
        "type": "key",            // watch 类型为 key
        "key": "redis/config",    // 指定要监视的 key
        "handler_type": "script",
        "args": ["/usr/bin/my_handler.sh", "-redis"]
      },
      {
        "type": "service",        // watch 类型为 service
        "service": "redis",       // 指定要监视的服务名
        "passingonly": true,      // 添加筛选条件，只监视健康的服务
        "handler_type": "http",
        "http_handler_config": {
          "path": "http://10.0.0.1/watch/handler",
          "method": "POST"
        }
      }
    ]
  }
  ```

### CLI

- 使用 consul 命令行工具可以启动 agent 服务器，也可以作为客户端与 agent 交互。用法：
  ```sh
  consul
        agent                           # 启动 agent 进程，在前台运行
            -server                     # 采用 server 运行模式
            -config-file <file>         # 指定配置文件
            -config-dir /consul/config  # 指定配置目录，加载该目录下的配置文件

        members                         # 列出所有节点
        force-leave <node>              # 强制让一个节点 leave ，进入 left 状态。但如果它依然运行，则可能重新加入集群
            --prune                     # 删除节点。默认会等待 reconnect_timeout 长时间无响应才删除
        operator
            raft                        # 操作 raft 协议
                list-peers              # 列出所有 raft 节点
                remove-peer -address="10.0.0.1:8300" # 删除一个 raft 节点

        catalog                   # 访问 catalog
            datacenters           # 列出所有数据中心
            nodes                 # 列出所有节点
              -service <service>  # 只显示指定服务所在的节点
              -detailed
            services              # 列出所有服务
              -node <node>        # 只显示指定节点上的服务
              -tags               # 增加显示 tags

        kv                        # 访问 KV 数据
            get <key>             # 读取一个 key ，返回其 value
              -keys               # 访问前缀匹配的所有 key ，不包括子 key
              -recurse            # 递归访问文件夹中的子 key
            put <key> [value]
            delete <key>
            export [prefix]       # 导出前缀匹配的所有 key ，包括子 key 。返回值为 JSON 格式
            import [data]         # 导入 key 。输入必须为 JSON 格式
              -prefix [prefix]    # 只导入前缀匹配的 key

        snapshot                  # 访问 snapshot 功能
            save    <file>        # 保存一个快照文件，包含集群当前的 catalog、kv、acl 等数据
            restore <file>        # 导入一个快照文件
            inspect <file>        # 查看快照的信息
  ```

### API

- agent 提供了一些 Restful API ：
  ```sh
  # 关于 agent
  GET   /v1/agent/members           # 获取所有 agent 的信息
  PUT   /v1/agent/reload            # 让当前 agent 重新加载其配置文件
  PUT   /v1/agent/leave             # 让当前 agent 正常退出集群
  GET   /v1/agent/checks            # 获取当前 agent 上所有健康检查的结果信息
  GET   /v1/agent/services                        # 获取当前 agent 上注册的所有服务的信息
  GET   /v1/agent/service/<serivce.id>            # 获取当前 agent 上注册的指定服务的信息
  PUT   /v1/agent/service/register                # 注册服务，这会调用 /v1/catalog/register
  PUT   /v1/agent/service/deregister/<serivce.id> # 注销服务，这会调用 /v1/catalog/deregister

  # 关于 catalog
  PUT   /v1/catalog/register        # 在 catalog 中注册对象
  PUT   /v1/catalog/deregister      # 在 catalog 中注销对象
  GET   /v1/catalog/nodes           # 列出所有节点
  GET   /v1/catalog/services        # 列出所有服务

  # 关于 Key/Value
  GET     /v1/kv/<key>              # 获取指定的 key 的信息，包括 key、value
  PUT     /v1/kv/<key>              # 创建 key ，如果该 key 已存在则更新它
  DELETE  /v1/kv/<key>              # 删除 key
  ```
