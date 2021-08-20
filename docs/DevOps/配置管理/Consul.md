# Consul

：一个 Web 服务器，采用 Golang 开发，支持配置管理、服务发现。
- [官方文档](https://www.consul.io/docs)
- 发音为 `/ˈkɒnsl/` 。
- 主要功能：
  - 配置管理，支持键值对格式
  - 服务发现，支持健康检查

## 原理

- 架构：
  - 在每个主机上部署一个 Consul agent ，组成分布式集群
  - 任一 agent 可在启动时加上 -ui 选项，提供 Web 界面。

- Consul agent 有两种运行模式：
  - client
    - ：负责定时访问本机、本机的服务，进行健康检查。
    - 轻量级，不储存数据。收到查询请求时会转发给 server 。
  - server
    - ：比 client 多了维护分布式集群的责任。负责存储集群数据，并保证分布式一致性。
    - 采用 Raft 算法。
    - 多个 server 之间会自行选出 leader 。
    - 建议部署 3 或 5 个 server ，允许 1 或 2 个 server 故障，实现高可用。

- Consul 支持划分多个数据中心（Data Center）。
  - 数据中心表示一个低延迟的子网，包含一组主机。
  - 默认的数据中心名为 dc1 。

- Consul 的 Enterprise 版本支持划分 namespace 。

## 配置

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



