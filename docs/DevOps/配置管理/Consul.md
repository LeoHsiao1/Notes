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

- Consul agent 有两种运行模式：
  - client
    - ：负责定时访问本机、本机的服务，进行健康检查。
    - 轻量级，不储存数据。收到 RPC 请求时会转发给 server 。
  - server
    - ：比 client 多了参与分布式投票的资格。负责存储数据，并维护分布式一致性。
    - 采用 Raft 算法。
    - 多个 server 之间会自行选出 leader 。

- Consul 支持划分多个数据中心（Data Center）。
  - 数据中心表示一个低延迟的子网，包含一组主机。
  - 默认的数据中心名为 dc1 。

- Consul 的 Enterprise 版本支持划分 namespace 。
