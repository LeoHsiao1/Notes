# etcd

：一个分布式键值对数据库，与 Zookeeper 类似。
- [官方文档](https://etcd.io/docs/v3.5/)
- etcd 是 etc directory 的简称，表示存储配置文件的目录。
- 2013 年，由 CoreOS 公司开源，采用 Golang 开发。
- 与 Zookeeper 相比，etcd 更轻量级。
- 与 Consul 相比，etcd 擅长存储键值对数据，但缺少服务发现等功能。

## 原理

- etcd 允许客户端读写 key-value 形式的数据，采用 B+ tree 结构存储数据。
  - etcd 默认会保存每个 key 所有历史版本的 value ，可通过 compaction 操作只保留最近的历史版本。
- etcd 会将执行的事务记录到日志文件。
  - 为了避免日志文件无限增长，etcd 会定期生成快照，保留当前时刻的全部数据，并删除旧日志。

- etcd 以 gRPC 方式提供了多种 API ：
  - KV
    - ：读写键值对。
  - Watch
    - ：监控键值对的变化。
  - Lease
    - ：租约，用于自动删除过期的 key 。
    - 客户端可以向服务器申请一个租约，有 ID、TTL 。然后用租约创建并绑定某些 key 。
    - 客户端需要定期向服务器发送 keep-alive 消息，如果超过 TTL 未发送，服务器会撤销租约，并删除其绑定的 key 。

- etcd 集群采用 Raft 算法实现分布式一致性，建议部署 3 或 5 个节点，实现高可用。
  - 首次启动 etcd 集群时，会生成一个随机的 cluster UUID ，避免与其它 etcd 集群混合通信。
  - 因为 Raft 算法，etcd 希望每个节点都能很快将事务写入磁盘。
    - 如果 etcd 网络延迟较大、写磁盘较慢，建议增加 election-timeout 。
    - 给 etcd 使用 SSD 磁盘可以显著提高速度。相反，使用远程存储会拖慢速度。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    etcd:
      container_name: etcd
      image: bitnami/etcd:3.5
      restart: unless-stopped
      environment:
        ETCD_ROOT_PASSWORD: ***
      ports:
        - 2379:2379     # grpc 端口
        - 2380:2380     # HTTP 端口
      volumes:
        - ./conf:/opt/bitnami/etcd/conf
        - ./data:/bitnami/etcd/data
  ```
  - etcd 服务器的推荐资源配额为 2 核 CPU 、2GB 内存。

## 配置

- 配置文件 etcd.yml 示例：
  ```sh
  name: node-1                  # 该 etcd 节点的名称，默认为 default
  # log-level: info
  # data-dir: ${name}.etcd      # 数据目录
  # wal-dir: ''                 # wal 日志文件目录
  # snapshot-count: 10000       # 每记录多少个事务，就生成一次快照
  # max-snapshots: 5            # 最多保留多少个快照，取值为 0 则不限制
  # max-wals: 5                 # 最多保留的 wal 日志文件数量
  # max-txn-ops: 128            # 单个事务中最多包含多少个操作
  # max-request-bytes: 1572864  # 客户端单个请求的最大体积，超过则不接受。默认为 1.5MB
  # heartbeat-interval: 100     # 心跳间隔，单位为 ms 。Leader 会定期发送心跳包给其它 Follower 节点。建议通过 ping 命令测得网络 RTT ，用作心跳间隔
  # election-timeout: 1000      # 选举超时，单位为 ms 。如果 Follower 节点超过一定时长没有收到心跳包，则选举一个节点担任新 Leader
  # grpc-keepalive-min-time: 5s
  # grpc-keepalive-interval: 2h
  # grpc-keepalive-timeout: 20s

  auto-compaction-retention: 1    # 保留每个 key 多少历史版本的 value 。默认为 0 ，即不限制
  auto-compaction-mode: periodic  # compaction 的模式。默认为周期性（periodic），即保留最近 n 个小时的历史版本。可选为 revision ，即保留最近 n 个历史版本

  listen-client-urls: http://0.0.0.0:2379               # 监听的地址，供客户端连接。默认为 localhost
  listen-peer-urls: http://0.0.0.0:2380                 # 监听的地址，供集群其它 etcd 节点连接
  advertise-client-urls: http://10.0.0.1:2379           # 建议客户端通过该地址访问该节点
  initial-advertise-peer-urls: http://10.0.0.1:2380     # 建议其它 etcd 节点通过该地址访问该节点

  # 启动 etcd 节点时，如果集群尚未初始化，则会引导集群
  # initial-cluster: default=http://localhost:2380      # 引导集群时，要连接的 etcd 节点地址。例如 node-1=https://10.0.0.1:2380,node-2=https://10.0.0.2:2380
  # initial-cluster-token: etcd-cluster                 # 引导集群时的 token 。设置一个独特的字符串，可避免与其它集群混合通信
  # initial-cluster-state: new                          # 引导集群时，集群的状态。取值为 new 表示初次启动集群，取值为 existing 表示已有集群
  # discovery: ''                                       # 指定一个 URL ，通过它自动发现其它 etcd 节点，适合节点经常变化的情况
  # discovery-srv: ''                                   # 通过 DNS srv domain 来自动发现其它 etcd 节点

  # etcd 通信时默认不启用 SSL 认证
  # client-cert-auth: false
  # peer-client-cert-auth: false
  # cert-file: ...
  # key-file: ...
  ```

## 命令

- etcdctl 是 etcd 的命令行客户端，用法如下：
  ```sh
  etcdctl
      # 通用选项
      --endpoints localhost:2379    # 指定 etcd 服务器的地址
      --user ""                     # 指定账号密码，默认为空
      --password ""
      --dial-timeout 2s             # 连接到服务器的超时时间
      --command-timeout 5s          # 连接到服务器之后，执行命令的超时时间
      --write-out simple            # 命令的输出格式。默认为 simple ，还可选 fields、json、protobuf、table

      # 关于服务器
      member list         # 列出所有 etcd 节点。该操作不需要登录
      endpoint health     # 检查 --endpoints 所指的服务器是否健康
      check perf          # 执行一次性能测试
      compaction <int>    # 执行一次压缩，只保留最近 n 个历史版本
      defrag              # 清理 compaction 之后产生的磁盘碎片空间，这会导致服务器暂停读写数据
          --cluster       # 作用于集群所有节点。默认只作用于 --endpoints 所指的服务器

      # 关于键值对
      get <key>           # 读取键名等于 key 的键值对
          --prefix        # 读取键名以 key 开头的键值对
          --from-key      # 读取键名的二进制值大于等于 key 的键值对
          --rev 0         # 查看距离现在第 n 个历史版本的 value 。如果不存在，则报错：required revision is a future revision
          --limit 0       # 限制读取的键值对数量
          --count-only    # 只是返回键值对的数量
          --keys-only
          --print-value-only
      put <key> <value>   # 写入一个键值对
          --lease ''      # 绑定租约
          --prev-kv       # 返回前一个版本的 value
      del <key>           # 删除键值对，并返回删除的数量
          --prefix
      compaction
      watch <key>         # 监听 key ，返回与之相关的事务的内容
          --prefix
      txn                 # 创建一条事务，可在其中编写多个操作

      lease
          list            # 列出所有租约
          grant 60        # 申请一个 TTL 为 60s 的租约，返回其 ID
          keep-alive <id> # 续订一个租约。如果不存在，则报错：lease expired or revoked
          revoke <id>     # 立即撤销一个租约

      snapshot save    <filename>   # 生成快照，保存为指定文件
      snapshot status  <filename>   # 查看快照文件的状态
      snapshot restore <filename>   # 导入快照文件中的数据
  ```
  - etcd 不支持按目录划分 key 。比如 `put key1/key2 Hello` 命令会创建一个名为 `key1/key2` 的键值对。
  - etcd v3 版本没有 ls 命令，可用 `get '' --prefix --keys-only` 命令列出所有 key 。

- 例：
  ```sh
  [root@CentOS ~]# etcdctl put key1 Hello
  OK
  [root@CentOS ~]# etcdctl get key1
  key1
  Hello
  ```
  ```sh
  etcdctl get / --prefix --keys-only    # 查看所有 key
  ```
