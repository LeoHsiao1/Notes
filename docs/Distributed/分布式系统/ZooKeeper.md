# ZooKeeper

：一个用于协调分布式系统的服务，简称为 zk 。采用 Java 开发。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 原本是 Apache Hadoop 的子项目，现在已成为一个独立的 Apache 顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 常见用途：
  - 同步分布式系统中各节点的数据，实现一致性。
  - 作为注册中心，记录分布式系统中各个服务的信息。
  - 实现分布式锁。

## 用法

### znode

- zk 的命名空间中可以创建多个存储数据的寄存器，称为 znode 。
  - 所有 znode 按树形结构相关联，通过从 / 开始的绝对路径进行定位。
  - 每个 znode 可以存储一段文本数据，通常为键值对格式、JSON 格式。
    - znode 的主要优点是能实现分布式的数据一致性，应该只存储很少量的数据，低于 1 kB 。
    - znode 的读写操作具有原子性。
  - zk 将 znode 数据存储在内存中，因此读取速度快。每次对 znode 进行写操作时，会备份写操作到事务日志中。

- 用 `create -e` 会创建临时节点（Ephemeral）。
  - 客户端连接到 zk server 时，会创建一个会话（session）。当 session 过期时，它创建的临时节点就会被删除。
  - 临时节点不支持创建子节点。

- 用 `create -s` 会自动给 znode 名称添加一个编号作为后缀。
  - 此编号为 10 位十进制数，从 0 开始递增。
    - 编号与当前父节点关联，分配给各个子节点使用。
    - 即使子节点被删除，编号也会继续递增。
  - 可以与临时节点搭配使用，创建一组按顺序编号的临时节点：
    ```sh
    [zk: localhost:2181(CONNECTED) 0] create -e -s /test/a
    Created /test/a0000000000
    [zk: localhost:2181(CONNECTED) 1] create -e -s /test/a
    Created /test/a0000000001
    [zk: localhost:2181(CONNECTED) 2] create -e -s /test/b
    Created /test/b0000000002
    ```

- 支持给 znode 设置配额（quota），限制节点数量、大小。
  - quota 并不具有强制性，超过限制时只会打印一条 WARN 级别的日志：`Quota exceeded`
  - 给一个节点设置了 quota 之后，不允许再给它的祖先节点或子孙节点设置 quota 。
  - 所有节点的 quota 信息都记录在 `/zookeeper/quota/<path>/zookeeper_limits` 中。
    - 当节点被删除时，其 quota 信息并不会自动删除。

### zkCli

- zk 的 bin 目录下自带了多个 shell 脚本。执行以下脚本可进入 zk 的命令行终端：
  ```sh
  bin/zkCli.sh
      -server [host][:port]   # 连接到指定的 zk server 。默认是 localhost:2181
  ```

- 常用命令：
  ```sh
  connect [host][:port]       # 连接到指定的 zk server
  version                     # 显示 zkCli 的版本

  ls <path>                   # 显示指定路径下的所有 znode 。path 中不支持通配符 *
    -R                        # 递归显示子节点

  create <path> [data] [acl]  # 创建 znode
        -e                    # 创建临时节点
        -s                    # 给 znode 名称添加一个编号作为后缀
  delete <path>               # 删除 znode 。存在子节点时不允许删除，会报错：Node not empty
  deleteall <path>            # 删除 znode 及其所有子节点

  get    <path>               # 读取 znode 中的数据
  set    <path> <data>        # 设置 znode 中的数据
  stat   <path>               # 显示 znode 的状态

  listquota <path>            # 查看某个节点的配额
  setquota  <path>            # 设置配额
      -b <bytes>              # 限制该节点及子孙节点的总大小
      -n <num>                # 限制该节点及子孙节点的总数
  delquota  <path>            # 删除配额
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
  ephemeralOwner = 0x0                    # 对于临时节点，该参数用于存储 Session ID 。对于其它节点，该参数的值为 0
  dataLength = 0                          # 该节点中的数据长度
  numChildren = 0                         # 子节点的数量
  ```

### watch

- zk 提供了 watch 机制，用于当某个节点发生某种事件时，通知客户端。
  - 用法：
    1. 客户端定义一个 watcher 类，注册到 zk ，监听某个事件。
    2. zk 记录了所有 watcher 。当相应的事件发生时，就通知客户端，并删除 watcher 。
  - 用 Python 的 kazoo 库注册 watcher 的示例：
    ```py
    @client.DataWatch('/test')  # 注册一个 watcher ，当目标节点的数据变化时，调用该函数
    def fun1(data, stat):
        print('data changed: {}'.format(data))
    ```

- 一种基于 zk 实现分布式锁的方案：
  1. 在 zk 中创建一些代表某种资源的 znode ，比如 /mysql/table1/write 。
  2. 多个业务程序同时申请占用某种资源时，需要分别作为客户端连接到 zk ，在相应的 znode 下创建一个子节点，带顺序编号。比如 create -s /mysql/table1/write 。
  3. 每个客户端检查目标 znode 下的所有子节点：
     - 如果自己创建的子节点编号最小，则代表自己获得了锁，有权占用资源。等使用完资源之后，再删除自己的子节点，代表释放锁。
     - 否则，注册 watcher ，监听前一个编号的子节点，等它被删除时，代表自己获得了锁。

## 部署

- 下载二进制版：
  ```sh
  wget https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/zookeeper-3.7.0/apache-zookeeper-3.7.0-bin.tar.gz
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
      image: zookeeper:3.7.0
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
  - 于 2011 年发布。
  - 增加 autopurge 配置参数，用于自动清理数据目录。
- v3.5.0
  - 于 2014 年发布。
  - 增加 AdminServer 模块，通过内置的 Jetty 服务器提供 HTTP API 。
    - 比如访问 URL `/commands` 可获取可用的命令列表，访问 URL `/commands/stats` 可获取 zk 的状态。
    - 建议用 AdminServer 代替以前的四字母命令。
- v3.6.0
  - 于 2020 年发布。
  - 增加 sessionRequireClientSASLAuth 配置参数，强制客户端进行 SASL 认证。
- v3.7.0
  - 于 2021 年发布。
  - 增加 enforeQuota 配置参数，让 quota 具有强制性。

### 配置

配置文件 `conf/zoo.cfg` 示例：
```ini
# clientPort=2181               # 监听一个供客户端连接的端口
dataDir=/data                   # 数据快照的存储目录
# dataLogDir=/datalog           # 事务日志的存储目录，默认与 dataDir 一致。可采用不同的磁盘设备，从而避免竞争磁盘 IO ，提高 zk 的速度、吞吐量
# snapCount=100000              # 记录多少条事务日志时就保存一次快照。实际上会根据随机数提前保存快照，避免多个 zk 节点同时保存快照
autopurge.purgeInterval=24      # 每隔 n 小时，自动清理一次快照文件、事务日志文件。默认值为 0 ，禁用该功能
# autopurge.snapRetainCount=3   # 每次 autopurge 时，每种文件只保留 Count 数量。默认值、最小值都为 3

# tickTime=2000                 # 时钟间隔，用作 zk 的基本时间单位，单位为 ms 。也是向其它 server 、client 发送心跳包的时间间隔
# initLimit=5                   # 各个 server 初始化连接到 leader 的超时时间，单位为 tickTime
# syncLimit=2                   # 各个 server 与 leader 之间通信（请求、回复）的超时时间，单位为 tickTime 。超过该时间则视作失去同步
# admin.enableServer=true       # 是否启用 AdminServer
# admin.serverPort=8080         # AdminServer 监听的端口
# 4lw.commands.whitelist=srvr,stat  # 一个白名单，声明允许使用哪些四字母命令，可通过 telnet 连接发送命令
metricsProvider.className=org.apache.zookeeper.metrics.prometheus.PrometheusMetricsProvider # 启用 Prometheus Metrics Provider
# metricsProvider.httpPort=7000

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
  ```ini
  peerType=observer
  ```
  然后在所有 server 的配置文件中声明：
  ```ini
  server.1:1=10.0.0.1:2888:3888;2181:observer
  ```

#### ACL

- znode 默认允许任何客户端读写。可以给单个 znode 设置 ACL 规则，控制其访问权限。
  - znode 的 ACL 规则不支持递归设置，也不支持继承，因此并不方便，不建议使用。

- 相关命令：
  ```sh
  getAcl <path>               # 读取 znode 的 ACL 规则
  setAcl <path>  <acl>        # 设置 znode 的 ACL 规则（只能设置一次，再次设置则不生效）
        -R                    # 递归处理子节点
  addauth <scheme> <user:pwd> # 创建用户
  ```

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
    Admin     # 允许设置 ACL
    Create    # 允许创建子节点
    Delete    # 允许删除当前节点
    Read      # 允许读取
    Write     # 允许写
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

#### SASL

- zk server 支持通过 JASS 框架启用 SASL 认证。
  - 默认不要求身份认证，可以被其它 server、client 直接连接，因此不安全。
  - 可启用以下 SASL 认证机制：
    - DIGEST-MD5
    - Kerberos

- 例：启用 DIGEST-MD5 认证

  1. 在 zoo.cfg 中加入：
      ```ini
      quorum.auth.enableSasl=true           # server 之间连接时是否启用 SASL 认证。默认为 false
      quorum.auth.learnerRequireSasl=true
      quorum.auth.serverRequireSasl=true    # 强制要求其它 server 连接到当前 server 时进行 SASL 认证。默认为 false

      authProvider.1=org.apache.zookeeper.server.auth.SASLAuthenticationProvider  # 在被 client 连接时启用 SASL 认证
      sessionRequireClientSASLAuth=true     # 强制要求 client 连接到当前 server 时进行 SASL 认证。默认为 false
      ```
      - 如果启用了客户端 SASL 认证，但不强制要求认证，则未通过认证的客户端依然可以访问 zk ，读写数据。除非节点设置了 ACL 规则，只允许 SASL 用户访问。

  2. 创建一个 jaas.conf 配置文件：
      ```sh
      # 定义一些用户。在当前 server 被其它 server 连接时，允许对方使用这些用户
      QuorumServer {
            org.apache.zookeeper.server.auth.DigestLoginModule required
            # user_test="******"    # 按 user_<NAME>=<PASSWORD> 的格式定义用户
            user_server="******";
      };
      # 指定当前 server 连接其它 server 时使用的用户
      QuorumLearner {
            org.apache.zookeeper.server.auth.DigestLoginModule required
            username="server"
            password="******";
      };
      # 定义一些用户。在当前 server 被 client 连接时，允许对方使用这些用户
      Server {
          org.apache.zookeeper.server.auth.DigestLoginModule required
          user_client="******";
      };
      ```

  3. 将 jaas.conf 拷贝到每个 zk 的配置目录下，并添加 java 启动参数来启用它：
      ```sh
      export SERVER_JVMFLAGS="-Djava.security.auth.login.config=/conf/jaas.conf"
      ```

  4. 客户端连接 zk 时，需要使用以下 JAAS 配置文件：
      ```sh
      Client {
          org.apache.zookeeper.server.auth.DigestLoginModule required
          username="client"
          password="******";
      };
      ```
      可以声明以下环境变量，再执行 zkCli.sh ，试试能否作为客户端连接 zk ：
      ```sh
      export CLIENT_JVMFLAGS="-Djava.security.auth.login.config=/conf/jaas.conf"
      ```

## 集群

### 架构

- zk server 可以只部署单实例，也可以部署多个实例，组成集群。
  - 每个 server 都拥有整个集群的数据副本，客户端连接到任一 server 即可访问集群。
    - 客户端发出读请求时，server 会使用本机的数据副本作出回复。
    - 客户端发出写请求时，server 会转发给 leader 。

  - 假设部署 N 个 zk server ，需要超过半数的节点正常工作，才能组成集群。
    - 即集群的必需成员数为 Quorum = (N+1)/2 ，为小数时向上取整。
    - 如果允许 Quorum 等于集群半数，甚至小于半数，则集群可能对半分为两个小集群，甚至分为更多小集群。每个小集群各有一个 leader ，就会发生脑裂。
      - 因此 zk 要求 Quorum 必须超过半数。

  - 部署的 server 数量建议为奇数，为偶数时并不会提高可用性。
    - 部署 1 个 server 时，不能组成集群，只能工作在 standalone 模式。
    - 部署 2 个 server 时，能组成一个最小的 zk 集群，但存在单点故障的风险。
      - 任一 server 故障时，剩下的 server 不超过集群的半数，不能投票决策。
    - 部署 3 个 server 时，组成的 zk 集群最多允许 1 个 server 故障。
    - 部署 4 个 server 时，组成的 zk 集群也是最多允许 1 个 server 故障。

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

### 事务

- 每个事务拥有一个十六进制编号，称为 zxid 。
  - zxid 用 long 型变量存储，长度为 64 位。
  - zxid 的前 32 位用于记录当前的 epoch 编号，后 32 位用于记录这是当前 epoch 中的第几个事务，从 0 开始递增。例如 zxid=0x2000004b2 。
- 当事务日志达到一定数量时，zk 会将当前全部 znode 的数据保存为磁盘中的一个快照文件，然后创建新的事务日志文件。
  - 创建快照文件、事务日志文件时，采用当前最新一个 zxid 作为文件后缀名。
  - 快照文件、事务日志文件默认一直不会删除，因此可以让 zk 数据回滚到历史状态。
- 保存快照的过程中，如果新产生了事务，也会被加入快照。
  - 此时事务日志文件的 zxid 会略大于快照文件的 zxid 。
  - 该快照称为模糊快照，不过 zk 依然可以根据它恢复数据。

### ZAB

- zk 采用 ZAB 协议实现各 server 的分布式一致性。ZAB（Zookeeper Atomic Broadcast）协议与 Raft 协议相似，特点如下：
  - 有且仅有一个节点作为 Leader ，有权作出决策。其它节点作为 Follower ，只能跟随决策。
    - 这里不考虑 observer 节点，因为它们不影响选举过程，只能旁观。
  - 如果 Leader 故障，则其它节点发起一轮投票，选举一个节点担任新 Leader 。
  - 默认采用 FastLeaderElection 选举算法。
    - 选举过程很快，一般低于 1 s 。
  - 每选出一个 Leader ，就开始一个任期，称为 epoch 。
    - 每个 epoch 拥有一个从 0 开始递增的数字编号。

- ZAB 协议为 zk server 划分了多个运行阶段：
  - 启动：每个 server 在启动时，不知道自己的角色，需要开始选举，直到选出 leader ，或者发现已有的 leader 。
  - election ：选举
  - discovery ：发现领导者
  - synchronization ：同步跟随者
  - broadcast ：广播事务

#### election

1. 有权投票的 server 进入 LOOKING 竞选状态。向其它 server 发送自己的投票，包含以下信息：
    - epoch ：本轮投票的编号。
    - zxid ：提议的 leader 的最新 zxid 。
    - leader ：提议的 leader 的 ID 。默认提议自己。
2. 每个 server 收到其它 server 的投票时，会与自己的投票进行对比。
    - 依次比较 epoch、zxid、leader 三种值的大小，取值越大则投票的权重越高。
    - 如果自己投票的权重更大，则发送给对方 server 。否则采用对方的投票作为自己的新投票。
    - 这样会尽量推举拥有最新事务的 server 作为 leader 。
3. 重复 1-2 步，直到一个 server 发现有超过半数的 server 推举自己为 leader ，则将 epoch 加 1 ，向所有 server 发送自己成为 leader 的消息。
4. 投票成功。各个 server 被分配了角色，进入 LEADING、FOLLOWING 或 OBSERVING 状态。
    - 但此时 follower 不一定能访问到 leader ，也尚未同步数据，要等到 broadcast 阶段才能供客户端访问。

#### discovery

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

#### synchronization

1. follower 连接到 leader ，加入 Learner 队列。
2. leader 给 follower 同步数据。有多种同步模式：
    - 如果 follower 落后少量事务，则 leader 发送 DIFF 消息，同步缺少的事务。
    - 如果 follower 落后太多事务，则 leader 发送 SNAP 消息，同步全部 znode 的快照。
    - 如果 follower 的 zxid 比 leader 还大，则发送 TRUNC 消息，丢弃多出的事务。
3. 当 follower 同步完数据之后，leader 向它发送 NEWLEADER(e) 消息，提议自己作为该 epoch 的 leader 。
4. follower 收到 NEWLEADER(e) 消息，停止同步，设置 currentEpoch = e ，然后回复 ACK 消息。
5. 等 Quorum 数量的 follower 回复 ACK 之后，leader 正式成为该 epoch 的 leader ，向所有 follower 发送 UPTODATE 消息，表示超过 Quorum 数量的 follower 已完成同步。
6. follower 收到 UPTODATE 消息，开始接受客户端连接。

#### broadcast

- 提交一个新事务的流程如下，类似于两阶段提交：
  1. leader 开始一个新事务，广播 PROPOSE 消息给所有 follower ，提议该事务。
  2. follower 收到 PROPOSE 消息，将事务写入磁盘的事务日志文件。然后回复 ACK(zxid) 消息给 leader ，表示直到该 zxid 的事务都已经被接受。
  3. 等 Quorum 数量的 follower 回复 ACK 之后， leader 正式提交该事务。然后广播 COMMIT(zxid) 消息给所有 follower ，表示直到该 zxid 的事务都已经被提交。
- leader 确保超过 Quorum 数量的 follower 同步了最新事务之后，才会开始下一个事务。
  - 尚未同步的 follower 必须按 zxid 顺序执行事务，即优先执行 zxid 最小的事务，且不允许跳过事务。
  - 如果 follower 与 PROPOSE 消息的 epoch 不同，则不会接受提议，而是先经历 discovery、synchronization 阶段。
- 如果 follower 在一定时间内没有收到 leader 的 PROPOSE 或 ping 消息，则认为 leader 故障，状态从 FOLLOWING 变为 LOOKING ，重新选举。
  - 此时原 leader 可能依然处于 LEADING 状态，可以被客户端连接，但它没有 Quorum 数量的 follower ，不能提交事务。
  - 因此，集群中可能同时存在多个 leader ，但最多只有一个 leader 能拥有 Quorum 数量的 follower ，不会发生脑裂。
- 如果 leader 在一定时间内没有等到 Quorum 数量的 follower 回复 ACK ，则状态从 LEADING 变为 LOOKING ，重新选举。

### 源代码

- QuorumPeer 类负责根据 ZAB 协议管理服务器，定义如下：
  ```java
  public class QuorumPeer extends ZooKeeperThread implements QuorumStats.Provider {
      public static class QuorumServer {    // 服务器对象
          public long id;
          public String hostname;
          public LearnerType type = LearnerType.PARTICIPANT;
          ...
      }
      public enum ServerState {   // 服务器的状态
          LOOKING,
          FOLLOWING,
          LEADING,
          OBSERVING
      }
      public enum ZabState {      // 服务器在 ZAB 协议中的运行阶段
          ELECTION,
          DISCOVERY,
          SYNCHRONIZATION,
          BROADCAST
      }
      public enum SyncMode {      // synchronization 阶段的同步模式
          NONE,
          DIFF,
          SNAP,
          TRUNC
      }
      public enum LearnerType {   // server 类型。Learner 类是 Followers 类和 Observers 类的父类，用于同步 leader 的数据
          PARTICIPANT,            // 参选者，在选举之后可以变成 leader 或 follower
          OBSERVER                // 观察者
      }
      public void run() {         // zk 会创建一个子线程去执行 QuorumPeer.run()
          LOG.debug("Starting quorum peer");
          try {
              while (running) {   // 循环体，根据 server 的状态执行一些操作
                  switch (getPeerState()) {
                      case LOOKING:               // LOOKING 状态要进行选举
                          LOG.info("LOOKING");
                          ...
                      case OBSERVING:
                          LOG.info("OBSERVING");
                          setObserver(makeObserver(logFactory));
                          observer.observeLeader();
                          ...
                      case FOLLOWING:
                          LOG.info("FOLLOWING");
                          setFollower(makeFollower(logFactory));
                          follower.followLeader();
                          ...
                      case LEADING:
                          LOG.info("LEADING");
                          setLeader(makeLeader(logFactory));
                          leader.lead();           // LEADING 状态则作为 leader 角色保持运行
                          ...
                  }
              }

          } finally {
              LOG.warn("QuorumPeer main thread exited");
              ...
          }
      }
      ...
  }
  ```

- QuorumCnxManager 类负责管理服务器之间的通信。
  - 通信的消息采用以下数据结构：
    ```java
    class QuorumPacket {
        int type;           // 消息的类型。例如取值为 3 时表示 ACK 类型
        long zxid;
        byte[] data;        // 消息的内容
        List<Id> authinfo;
    }
    ```
  - 收、发的消息会放在队列 recvQueue、queueSendMap 中，异步处理。
  - FastLeaderElection 选举算法的投票采用以下数据结构：
    ```java
    public static class Notification {
        public static final int CURRENTVERSION = 0x2;
        int version;        // 投票格式的版本

        long sid;           // 发送该投票的 server 的 id
        QuorumPeer.ServerState state;   // 发送该投票的 server 的状态
        QuorumVerifier qv;

        long leader;        // 提议的 leader
        long electionEpoch; // 本轮选举的 epoch
        long peerEpoch;     // 提议的 leader 的 epoch
        long zxid;          // 提议的 leader 的最新 zxid
    }
    ```

### 日志

- 在 3 节点的 zk 集群中，重启其中一个节点，日志示例如下：
  ```sh
  # 该 server 启动之后，默认监听 TCP 3888 端口，用于选举
  INFO  [ListenerHandler-/0.0.0.0:3888:QuorumCnxManager$Listener$ListenerHandler@1065] - 1 is accepting connections now, my election bind port: /0.0.0.0:3888
  # 启动之后处于 LOOKING 状态，发起一轮投票
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@1374] - LOOKING
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):FastLeaderElection@944] - New election. My id = 1, proposed zxid=0x500000342
  # 发送一个投票给其它节点。其中 my state 表示当前节点的状态， n.* 表示 Notification 中的信息
  INFO  [WorkerReceiver[myid=1]:FastLeaderElection$Messenger$WorkerReceiver@389] - Notification: my state:LOOKING; n.sid:1, n.state:LOOKING, n.leader:1, n.round:0x1, n.peerEpoch:0x5, n.zxid:0x500000342, message format version:0x2, n.config version:0x0
  # 投票时，各个 server 需要两两连接，但每对 server 之间只需建立一个 TCP 连接。因此只允许由 id 更大的 server 主动建立连接，断开其余连接
  INFO  [QuorumConnectionThread-[myid=1]-2:QuorumCnxManager@513] - Have smaller server identifier, so dropping the connection: (myId:1 --> sid:3)
  INFO  [QuorumConnectionThread-[myid=1]-1:QuorumCnxManager@513] - Have smaller server identifier, so dropping the connection: (myId:1 --> sid:2)
  INFO  [ListenerHandler-/0.0.0.0:3888:QuorumCnxManager$Listener$ListenerHandler@1070] - Received connection request from /10.0.0.2:46728
  INFO  [ListenerHandler-/0.0.0.0:3888:QuorumCnxManager$Listener$ListenerHandler@1070] - Received connection request from /10.0.0.3:35372
  # 收到其它 server 发来的投票。可见它们不处于 LOOKING 状态，已存在 leader
  INFO  [WorkerReceiver[myid=1]:FastLeaderElection$Messenger$WorkerReceiver@389] - Notification: my state:LOOKING; n.sid:3, n.state:LEADING, n.leader:3, n.round:0xa9, n.peerEpoch:0x5, n.zxid:0x400000000, message format version:0x2, n.config version:0x0
  INFO  [WorkerReceiver[myid=1]:FastLeaderElection$Messenger$WorkerReceiver@389] - Notification: my state:LOOKING; n.sid:2, n.state:FOLLOWING, n.leader:3, n.round:0xa9, n.peerEpoch:0
  x5, n.zxid:0x400000000, message format version:0x2, n.config version:0x0
  INFO  [WorkerReceiver[myid=1]:FastLeaderElection$Messenger$WorkerReceiver@389] - Notification: my state:LOOKING; n.sid:3, n.state:LEADING, n.leader:3, n.round:0xa9, n.peerEpoch:0x5
  , n.zxid:0x400000000, message format version:0x2, n.config version:0x0
  ...
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@857] - Peer state changed: following
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@1456] - FOLLOWING
  ...
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):Follower@75] - FOLLOWING - LEADER ELECTION TOOK - 23 MS
  # 该 server 结束选举，接着进入 discovery、synchronization 阶段
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@863] - Peer state changed: following - discovery
  INFO  [LeaderConnector-/10.0.0.3:2888:Learner$LeaderConnector@330] - Successfully connected to leader, using address: /10.0.0.3:2888
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@863] - Peer state changed: following - synchronization
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):Learner@511] - Getting a diff from the leader 0x500000342
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@868] - Peer state changed: following - synchronization - diff
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):Learner@677] - Learner received NEWLEADER message
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):Learner@661] - Learner received UPTODATE message
  INFO  [QuorumPeer[myid=1](plain=0.0.0.0:2181)(secure=disabled):QuorumPeer@863] - Peer state changed: following - broadcast
  ```
