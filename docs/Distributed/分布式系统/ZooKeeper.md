# ZooKeeper

：一个用于协调分布式系统的服务，简称为 zk 。采用 Java 开发。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 原本是 Apache Hadoop 的子项目，现在已成为一个独立的 Apache 顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 常见用途：
  - 同步分布式系统中各节点的数据，实现一致性。
  - 作为注册中心，记录分布式系统中的各个服务。

## 原理

- zk 采用 Zab （Zookeeper atomic broadcast protocol ，与 Raft 类似）协议实现各 server 的数据一致性：
  - 每次投票时，如果超过半数的 server 支持某个决策，则采用该决策。

- 部署多个 zk server 即可组成集群。
  - 每个 server 都拥有整个集群的数据副本，客户端连接到任一 server 即可访问集群。
    - 客户端发出读请求时，server 会使用本机的数据副本作出回复。
    - 客户端发出写请求时，server 会转发给 leader 。
  - 部署 2xF+1 个 server 时，最多允许 F 个 server 故障，从而提高集群的可用性。
    - 部署 2xF+2 个 server 时，也是最多允许 F 个 server 故障，剩下的 server 才超过集群的半数，可以投票成功。因此部署的 server 数量建议为奇数，为偶数时并不会提高可用性。
    - 部署 1 个 server 时，不能构成集群，只能工作在 standalone 模式。
    - 部署 2 个 server 时，能组成一个最小的 zk 集群，但存在单点故障的风险。
      - 任一 server 故障时，剩下的 server 不超过集群的半数，不能投票决策。
    - 部署 3 个 server 时，组成的 zk 集群最多允许 1 个 server 故障。

- server 分为三种角色：
  - leader
    - ：负责更新集群的数据，并推送给其它 server 。可以处理客户端的读取器、写请求。
    <!-- - 更新系统的状态并推送给 follower、observer 。 -->
    - 当 leader 不可用时，其它 server 会开始一轮投票，选举出新的 leader 。选举过程很快，一般低于 1 s 。

<!--
针对每一次投票，服务器都需要将其他服务器的投票和自己的投票进行对比，对比规则如下：
a. 优先比较 epoch 。每轮投票之后，epach 会递增。
  如果收到的消息的 epoch 低于本机的，则将本机的消息发给对方
  如果高于本机的，则用它更新本机的消息
  如果等于本机的，则对比下一条规则
b. 检查 zxid，zxid 比较大的服务器优先作为 leader
c. 如果 zxid 相同，那么就比较 myid，myid 较大的服务器作为 leader 服务器
-->

  - follower
    - ：负责复制 leader 的数据到本机。可以处理客户端的读请求，可以参与 leader 选举。
  - observer
    - ：负责处理客户端的读请求，提高集群的读取速度。不能参与 leader 选举。


- zk 的命名空间中可以创建多个存储数据的寄存器，称为 znode 。
  - 所有 znode 按树形结构相关联，通过以 / 分隔的绝对路径进行定位，类似于标准文件系统。
  - 每个 znode 可以存储一段文本数据，通常为键值对格式、JSON 格式。
    - znode 的主要优点是能实现分布式的数据一致性，应该只存储很少量的数据，低于 1 kB 。
    - znode 的读写操作具有原子性。
  - 支持给单个 znode 设置 ACL 规则，限制访问权限。

- zk 将 znode 数据存储在内存中，因此读取速度快。
  - 每次对 znode 进行写操作时，会备份写操作到事务日志中。
    - 每个事务拥有一个递增的 ID ，称为 zxid 。
  - 当事务日志达到一定数量时，zk 会将当前全部 znode 的数据保存为磁盘中的一个快照文件，然后创建新的事务日志文件。
    - 创建快照文件、事务日志文件时，采用当前最新一个 zxid 作为文件后缀名。
    - 快照文件、事务日志文件默认一直不会删除，因此可以让 zk 数据回滚到历史状态。
  - 保存快照的过程中，如果新产生了事务，也会被加入快照。
    - 此时事务日志文件的 zxid 会略大于快照文件的 zxid 。
    - 该快照称为模糊快照，不过 zk 依然可以根据它恢复数据。

<!-- ZooKeeper 也有临时节点的概念。只要创建 znode 的会话处于活动状态，这些 znode 就存在。当会话结束时，znode 被删除。
客户端每次连接会建立一个 session -->
<!-- 支持 watch ，客户端可以在 znode 上设置监视。当 znode 发生变化时，会触发并移除 watch。当 watch 被触发时，客户端会收到一个数据包，说 znode 已经改变了 -->


## 部署

- 下载二进制版：
  ```sh
  wget https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.6.2/apache-zookeeper-3.6.2-bin.tar.gz
  ```
  解压后运行：
  ```sh
  bin/zkServer.sh
                  start               # 在后台启动
                  start-foreground    # 在前台启动
                  stop
                  restart

                  status              # 显示状态
                  version             # 显示版本信息
  ```

- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    zookeeper:
      container_name: zookeeper
      image: zookeeper:3.6.2
      restart: unless-stopped
      environment:
        # JVMFLAGS: -Xmx1G -Xms1G
        ZOO_MY_ID: 1
      ports:
        - 2181:2181
        - 2888:2888
        - 3888:3888
        # - 8080:8080
      volumes:
        - ./conf:/conf
        - ./data:/data
  ```

### 版本

- v3.4.0
  - 增加了 autopurge 配置，用于自动清理数据目录。
- v3.5.0
  - 新增了 AdminServer ，通过内置的 Jetty 服务器提供 HTTP API 。
    - 比如访问 URL `/commands` 可获取可用的命令列表，访问 URL `/commands/stats` 可获取 zk 的状态。
    - 建议用 AdminServer 代替以前的四字母命令。

### 配置

配置文件 `conf/zoo.cfg` 示例：
```sh
# clientPort=2181               # 监听一个供客户端连接的端口
dataDir=/data                   # 数据快照的存储目录
# dataLogDir=/datalog           # 事务日志的存储目录，默认与 dataDir 一致。可采用不同的磁盘设备，从而避免竞争磁盘 IO ，提高 zk 的速度、吞吐量
# snapCount=100000              # 记录多少条事务日志时就保存一次快照。实际上会根据随机数提前保存快照，避免多个 zk 节点同时保存快照
autopurge.purgeInterval=1       # 每隔一段时间，自动清理快照文件、事务日志文件。默认值为 0 ，禁用该功能
# autopurge.snapRetainCount=3   # autopurge 时，每种文件只保留 Count 数量。默认值、最小值都为 3

# 4lw.commands.whitelist=srvr,stat  # 一个白名单，声明允许使用哪些四字母命令，可通过 telnet 连接发送命令
# admin.enableServer=true       # 是否启用 AdminServer
# admin.serverPort=8080         # AdminServer 监听的端口

# tickTime=2000                 # 时钟间隔，用作 zk 的基本时间单位，单位为 ms 。也是向其它 server 、client 发送心跳包的时间间隔
# initLimit=5                   # 各个 server 初始化连接到 leader 的超时时间，单位为 tickTime
# syncLimit=2                   # 各个 server 与 leader 之间通信（请求、回复）的超时时间，单位为 tickTime 。超过该时间则视作失去同步

# 声明 zk 集群的 server 列表，每行的格式为 server.<id>=<host>:<port1>:<port2>[:role];[<external_host>:]<external_port>
#   - id 是一个数字编号，不可重复
#   - host 是各个 server 的 IP 地址
#   - port1 是各个 server 连接到 leader 的目标端口，port2 是各个 server 之间进行 leader 选举的端口
#   - [<external_host>:]<external_port> 是另一个监听的 Socket ，供客户端访问
# 例如：当前 server id 为 1 时，会根据 server.1 的配置来监听 Socket ，根据其它 server 的配置去通信
server.1=10.0.0.1:2888:3888;2181  # 对于当前 server 而言，该 IP 地址会用于绑定 Socket ，可改为 0.0.0.0
server.2=10.0.0.2:2888:3888;2181
server.3=10.0.0.3:2888:3888;2181
```
- zk server 的目录结构示例：
  ```sh
  ├── conf
  │   ├── configuration.xsl
  │   ├── log4j.properties
  │   └── zoo.cfg
  ├── data
  │   ├── myid
  │   └── version-2
  │       ├── acceptedEpoch
  │       ├── currentEpoch
  │       ├── log.100000001       # 事务日志
  │       ├── log.200000001
  │       ├── log.2000004b3
  │       ├── snapshot.0          # 数据快照
  │       ├── snapshot.100000000
  │       ├── snapshot.100000230
  │       └── snapshot.2000004b2
  ```
  - 每个 zk server 启动时，会根据 `$dataDir/myid` 文件的值确定自己的 server 编号。因此初次部署时需要创建该文件：
    ```sh
    echo 1 > $dataDir/myid
    ```
  - 当 zk server 启动时，如果 dataDir 目录不存在，它会自动创建该目录，导致使用错误的 myid 、空的 znode ，可能发生脑裂。

## 命令行工具

zk 的 bin 目录下自带了多个 shell 脚本。
- 执行以下脚本可进入 zk 的命令行终端。
  ```sh
  bash bin/zkCli.sh
          -server [host][:port]   # 连接到指定的 zk server 。默认是 localhost:2181
  ```
  常用命令：
  ```sh
  connect [host][:port]   # 连接到指定的 zk server

  ls <path>               # 显示指定路径下的所有 znode
    -R                    # 递归显示子目录

  get <path>              # 读取 znode 中的数据
  set <path> <data>       # 设置 znode 中的数据
  stat <path>             # 显示 znode 的状态

  create <path>           # 创建 znode
  delete <path>           # 删除 znode
  ```
