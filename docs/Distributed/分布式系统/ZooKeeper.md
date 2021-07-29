# ZooKeeper

：一个用于协调分布式系统的服务，简称为 zk 。采用 Java 开发。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 原本是 Apache Hadoop 的子项目，现在已成为一个独立的 Apache 顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 常见用途：
  - 同步分布式系统中各节点的数据，实现一致性。
  - 作为注册中心，记录分布式系统中各个服务的信息。
  - 实现分布式锁。

## 原理

### 集群架构

- zk server 可以只部署单实例，也可以部署多个实例，组成集群。
  - 每个 server 都拥有整个集群的数据副本，客户端连接到任一 server 即可访问集群。
    - 客户端发出读请求时，server 会使用本机的数据副本作出回复。
    - 客户端发出写请求时，server 会转发给 leader 。

  - 假设部署 N 个 zk server ，需要超过半数（不能是等于半数）的节点在线，才能组成集群。
    - 即集群的必需成员数为 Quorum = (N+1)/2 向上取整。

  - 部署的 server 数量建议为奇数，为偶数时并不会提高可用性。
    - 部署 1 个 server 时，不能组成集群，只能工作在 standalone 模式。
    - 部署 2 个 server 时，能组成一个最小的 zk 集群，但存在单点故障的风险。
      - 任一 server 故障时，剩下的 server 不超过集群的半数，不能投票决策。
    - 部署 3 个 server 时，组成的 zk 集群最多允许 1 个 server 故障。
    - 部署 4 个 server 时，组成的 zk 集群也是最多允许 1 个 server 故障。

  - 增加 F 的数量时，可以提高集群的可用性，但会增加每次投票的耗时。

- 集群中的 server 分为三种角色：
  - leader
    - ：领导者。
    - 负责更新集群的数据，并推送给其它 server 。
    - 可以处理客户端的读、写请求。
    - 可以参与投票。

  - follower
    - ：跟随者。
    - 会复制 leader 的数据到本机，因此可以处理客户端的读请求。
    - 收到客户端的写请求时，会转发给 leader ，相当于反向代理。
    - 可以参与投票。

  - observer
    - ：观察者。
    - 无权投票，只能听从投票结果，因此不会影响集群的可用性，可以允许故障。
    - 可以像 follower 一样接收客户端的读写请求，因此能提高集群的并发量。
    - leader、follower 是 zk 集群自动选举分配的角色，而 observer 是由用户指定的可选角色。

### 选举

- zk 采用 ZAB 协议实现各 server 的数据一致性。ZAB（Zookeeper Atomic Broadcast）协议与 Raft 协议相似，特点如下：
  - 有且仅有一个节点作为 Leader ，有权作出决策。其它节点作为 Follower ，只能跟随决策。
  - 如果 Leader 故障，则其它节点发起一轮投票，选举一个节点担任新 Leader 。
  - 每选出一个 Leader ，就开始一个任期，称为 epoch 。
    - 每个 epoch 拥有一个递增的数字编号。

- 当 leader 不可用时，所有 follower 会开始一轮投票，选举出新的 leader 。
  - 默认采用 FastLeaderElection 选举算法。
  - 集群启动时、leader 故障时，会触发一轮选举。
  - 选举过程很快，一般低于 1 s 。


<!-- - 
在很短时间内重启 leader ，则不会触发选举？
默认各个 server 会推举自己为 leader？
 -->


- leader 和 follower 之间通信的消息采用以下数据结构：
  ```java
  class QuorumPacket {
      int type;           // 消息的类型。例如取值为 3 时表示 ACK 类型
      long zxid;
      byte[] data;        // 消息的内容
      List<Id> authinfo;
  }
  ```

- 选举（election）的流程：
  1. 有权投票的 server 进入 LOOKING 竞选状态。向其它 server 发送自己的投票，包含以下信息：
     - epoch ：本轮投票的编号。
     - zxid ：本机最新的事务编号。
     - myid ：推举为新 leader 的节点的编号。
  2. 每个 server 收到其它 server 的投票时，会与自己的投票对比。
     - 依次比较 epoch、zxid、myid 三种值的大小，取值越大则投票的权重越高。
     - 如果自己投票的权重更大，则发送给对方 server 。否则采用对方的投票作为自己的新投票。
     - 这样会尽量推举拥有最新事务的 server 作为 leader 。
  3. 如果有一个 server 发现有超过半数的 server 推举自己为 leader ，则将 epoch 加 1 ，向所有 server 发送自己成为 leader 的消息。
     - 投票结束之后，各个 server 会根据自己的角色，进入 LEADING、FOLLOWING 或 OBSERVING 状态。

- zk 节点在运行时会经历以下阶段：

  <!-- - 选举 leader ，各节点被分配 leader、follower 身份。 -->

  - 阶段一：开始新 epoch
    1. follower 连接到 leader ，发送 FOLLOWERINFO 消息。
    2. 等 Quorum 数量的 follower 建立连接之后，leader 停止接受新连接。并向已有的 follower 发送 LEADERINFO(e) 消息，提议开始一个新的 epoch ，其 e 值大于这些 follower 的 acceptedEpoch 。
        - 统计 Quorum 数量时包括了 leader 。
    3. follower 收到 LEADERINFO(e) 消息，进行判断：
        - 如果 e > acceptedEpoch ，则设置 acceptedEpoch = e ，并回复 ACKEPOCH(e) ，表示接受新的 epoch 。
        - 如果 e == acceptedEpoch ，则跳到执行下一步。
        - 如果 e < acceptedEpoch ，则断开连接，重新开始选举。
    4. 等 Quorum 数量的 follower 回复 ACKEPOCH 之后，leader 开始下一阶段。
        - 所有 follower 都必须满足以下两个条件之一，否则 leader 断开连接，重新开始选举：
          ```sh
          follower.currentEpoch <  leader.currentEpoch
          follower.currentEpoch == leader.currentEpoch && follower.lastZxid <= leader.lastZxid
          ```
        - 如果上述过程失败或超时，则重新开始选举。

  - 阶段二：同步数据
    1. follower 连接到 leader 。
    2. leader 向 follower 发送 DIFF 消息，包含它缺少的事务。
    3. 当 follower 同步完数据之后，leader 向它发送 NEWLEADER(e) 消息，提议自己作为该 epoch 的 leader 。
    4. follower 收到 NEWLEADER(e) 消息，停止同步，设置 currentEpoch = e ，然后回复 ACK 消息。
    5. 等 Quorum 数量的 follower 回复 ACK 之后，leader 正式成为该 epoch 的 leader ，向所有 follower 发送 UPTODATE 消息。
    6. follower 收到 UPTODATE 消息，开始接受客户端连接。

  - 阶段三：广播事务
    - 每次开始一个新事务时：
      1. leader 广播 PROPOSE 消息给所有 follower ，提议该事务。
      2. follower 接受该事务，回复 ACK(zxid) 消息给 leader ，表示直到该 zxid 的事务都已经被接受。
      3. 等 Quorum 数量的 follower 回复 ACK 之后， leader 正式提交该事务。然后广播 COMMIT(zxid) 消息给所有 follower ，表示直到该 zxid 的事务都已经被提交。
          - 所有事务会按 zxid 顺序提交。
          - 保证超过 Quorum 数量的节点同步了最新事务。
    - 如果 leader 在一定时间内没有等到 Quorum 数量的 follower 回复 ACK ，则重新选举。
    - 如果 follower 在一定时间内没有收到 leader 的 PROPOSE 或 ping 消息，则认为 leader 故障，重新选举。

### 数据结构

- zk 的命名空间中可以创建多个存储数据的寄存器，称为 znode 。
  - 所有 znode 按树形结构相关联，通过从 / 开始的绝对路径进行定位。
  - 每个 znode 可以存储一段文本数据，通常为键值对格式、JSON 格式。
    - znode 的主要优点是能实现分布式的数据一致性，应该只存储很少量的数据，低于 1 kB 。
    - znode 的读写操作具有原子性。

- zk 将 znode 数据存储在内存中，因此读取速度快。
  - 每次对 znode 进行写操作时，会备份写操作到事务日志中。
    - 每个事务拥有一个 9 位的十六进制编号，从 0 开始递增，称为 zxid 。
  - 当事务日志达到一定数量时，zk 会将当前全部 znode 的数据保存为磁盘中的一个快照文件，然后创建新的事务日志文件。
    - 创建快照文件、事务日志文件时，采用当前最新一个 zxid 作为文件后缀名。
    - 快照文件、事务日志文件默认一直不会删除，因此可以让 zk 数据回滚到历史状态。
  - 保存快照的过程中，如果新产生了事务，也会被加入快照。
    - 此时事务日志文件的 zxid 会略大于快照文件的 zxid 。
    - 该快照称为模糊快照，不过 zk 依然可以根据它恢复数据。

<!-- ZooKeeper 也有临时节点的概念。只要创建 znode 的会话处于活动状态，这些 znode 就存在。当会话结束时，znode 被删除。
客户端每次连接会建立一个 session -->
<!-- 
客户端主动连接 zk server ，即可拉取数据
也可以用 watch 保持连接，当 znode 变化时，zk 会通知客户端，并移除该 watch 。-->


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

# admin.enableServer=true       # 是否启用 AdminServer
# admin.serverPort=8080         # AdminServer 监听的端口
# 4lw.commands.whitelist=srvr,stat  # 一个白名单，声明允许使用哪些四字母命令，可通过 telnet 连接发送命令
metricsProvider.className=org.apache.zookeeper.metrics.prometheus.PrometheusMetricsProvider # 启用 Prometheus Metrics Provider
# metricsProvider.httpPort=7000

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
  │       ├── acceptedEpoch       # 该文件记录上一次接受的 NEWEPOCH 消息的 epoch 编号。下一次收到 NEWEPOCH 消息时，其 epoch 编号必须更大，才会接受
  │       ├── currentEpoch        # 该文件记录上一次接受的 NEWLEADER 消息的 epoch 编号。下一次收到 NEWLEADER 消息时，其 epoch 编号必须更大，才会接受
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
- 如果想将一个 server 声明为 observer 角色，需要在其配置文件中加入：
  ```sh
  peerType=observer
  ```
  然后在所有 server 的配置文件中声明：
  ```sh
  server.1:1=10.0.0.1:2888:3888;2181:observer
  ```

## zkCli

- zk 的 bin 目录下自带了多个 shell 脚本。执行以下脚本可进入 zk 的命令行终端：
  ```sh
  bash bin/zkCli.sh
          -server [host][:port]   # 连接到指定的 zk server 。默认是 localhost:2181
  ```

- 常用命令：
  ```sh
  connect [host][:port]       # 连接到指定的 zk server

  ls <path>                   # 显示指定路径下的所有 znode 。path 中不支持通配符 *
    -R                        # 递归显示子节点

  create <path> [data] [acl]  # 创建 znode
  delete <path>               # 删除 znode 。存在子节点时不允许删除，会报错：Node not empty

  get    <path>               # 读取 znode 中的数据
  set    <path> <data>        # 设置 znode 中的数据
  stat   <path>               # 显示 znode 的状态

  getAcl <path>               # 读取 znode 的 ACL 规则
  setAcl <path>  <acl>        # 设置 znode 的 ACL 规则（只能设置一次，再次设置则不生效）
        -R                    # 递归处理子节点
  addauth <scheme> <user:pwd> # 创建用户
  ```

- 例：创建 znode
  ```sh
  [zk: localhost:2181(CONNECTED) 0] create /test
  Created /test
  [zk: localhost:2181(CONNECTED) 1] get /test
  null
  ```
  - 命令提示符 `[zk: localhost:2181(CONNECTED) 1]` 中的数字编号表示这是当前终端执行的第几条命令，从 0 开始递增。

- 例：查看 znode 的状态
  ```sh
  [zk: localhost:2181(CONNECTED) 0] stat /test
  cZxid = 0x1bd                           # 创建该节点时的事务编号
  ctime = Wed Jul 28 10:09:01 UTC 2021    # 创建该节点时的 UTC 时间
  mZxid = 0x1bd
  mtime = Wed Jul 28 10:09:01 UTC 2021
  pZxid = 0x1bd
  cversion = 0
  dataVersion = 0                         # 该节点中的数据版本。每次 set 都会递增，即使数据没有变化
  aclVersion = 0
  ephemeralOwner = 0x0                    # 对于临时节点，该参数用于存储 Session ID
  dataLength = 0                          # 该节点中的数据长度
  numChildren = 0                         # 子节点的数量
  ```

### ACL

- zk 默认允许任何客户端读写。
  - 支持给 znode 设置 ACL 规则，控制其访问权限。

- ACL 规则的格式为 `scheme:user:permissions`
  - scheme 表示认证模式，分为以下几种：
    ```sh
    world     # 只定义了 anyone 用户，表示所有客户端，包括未登录的
    auth      # 通过 addauth digest 创建的用户
    digest    # 与 auth 类似，但需要以哈希值形式输入密码，格式为 digest:<user>:<pwd_hash>:<permissions>
    ip        # 限制客户端的 IP 地址，比如 ip:10.0.0.0/8:r
    sasl      # 要求客户端通过 kerberos 的 SASL 认证
    super     # 超级管理员，需要在 zk server 的启动命令中声明
    ```
  - permissions 是一组权限的缩写：
    ```sh
    Admin   # 允许设置 ACL
    Create  # 允许创建子节点
    Delete  # 允许删除当前节点
    Read    # 允许读取
    Write   # 允许写
    ```

- 例：
  ```sh
  [zk: localhost:2181(CONNECTED) 0] getAcl /test    # 新建 znode 的 ACL 不会继承父节点，而是默认为 `world:anyone:cdrwa`
  'world,'anyone
  : cdrwa
  [zk: localhost:2181(CONNECTED) 1] setAcl /test world:anyone:a
  [zk: localhost:2181(CONNECTED) 2] get /test
  Insufficient permission : /test                   # 报错表示权限不足
  [zk: localhost:2181(CONNECTED) 3] addauth digest tester:123456    # 创建用户，如果已存在该用户则是登录
  [zk: localhost:2181(CONNECTED) 4] setAcl /test auth:tester:cdrwa
  [zk: localhost:2181(CONNECTED) 5] getAcl /test
  'digest,'tester:Sc9QxOxG72+Wzo/j15TxX5UOqQs=                      # 密码以哈希值形式保存
  : cdrwa
  ```
  - 创建一个新终端时，再次执行 addauth 命令，就会登录指定用户。
