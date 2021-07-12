# ZooKeeper

：一个分布式服务框架，简称为 zk 。采用 Java 开发。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 原本是 Hadoop 的子项目，现在已成为一个独立的顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 主要功能：
  - 作为注册中心，登记分布式系统中的各个客户端、服务。
  - 协调各节点之间的通信，维护分布式系统的一致性。
  - 可以存储少量数据。

## 原理

- zk 采用 Zab （Zookeeper atomic broadcast protocol ，与 Raft 类似）协议实现一致性：
  - 如果超过半数的 server 写入数据成功，则数据为真。

- 部署多个 zk server 实例即可组成集群。
  - 只部署 1 个 server 时，不能进行 leader 选举。部署 2 个 server 时，会相互通信，开始 leader 选举。
  - server 数最好为奇数，为偶数时可靠性并不会提升。
    - 例如 server 数为 3、4 时，都是最多允许 1 个 server 挂掉。
    - 部署 3 个 server 就可以组成一个最小的 zk 集群。

- server 分为三种角色：
  - leader
    - ：由 follower 选举产生，负责处理 client 的读请求和写请求，更新系统的状态并推送给 follower、observer 。
    - 当 leader 不可用时，其它 server 会开始一轮投票，选举出新的 leader 。

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
    - ：负责处理 client 的读请求，参与 leader 选举。
  - observer
    - ：负责处理 client 的读请求，扩展系统的读取速度。

- zk 存储数据时，可以按树形结构创建多个命名空间，称为 znode 。
  - 每个 znode 中可以存储文本格式的数据，通常为键值对格式、JSON 格式。

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
  - 每个 zkServer 启动时，会根据 `$dataDir/myid` 的值确定自己的 server 编号。因此初次部署时需要创建 myid 文件，如下：
    ```sh
    echo 1 > $dataDir/myid
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
        - ./log:/datalog
  ```

### 版本

- v3.5.0
  - 新增了 AdminServer ，通过内置的 Jetty 服务器提供 HTTP API 。
    - 比如访问 URL `/commands` 可获取可用的命令列表，访问 URL `/commands/stats` 可获取 zk 的状态。

### 配置

配置文件 `conf/zoo.cfg` 示例：
```sh
# clientPort=2181               # 供客户端连接的端口
# admin.enableServer=true
# admin.serverPort=8080         # AdminServer 监听的端口
dataDir=/zk/data                # 数据目录
dataLogDir=/zk/log              # 日志目录

# tickTime=2000                 # 向其它 server 、client 发送心跳包的时间间隔（ms）
# initLimit=5                   # server 初始化连接到 leader 的超时时间，单位为 tickTime
# syncLimit=2                   # server 与 leader 之间通信（请求、应答）的超时时间，单位为 tickTime

# 声明 zk 集群的 server 列表，每行的格式为 server.<id>=<host>:<port1>:<port2>[:role];[<external_host>:]<external_port>
#   - id 是一个数字编号，不可重复
#   - host 是各个 server 的 IP 地址
#   - port1 是 server 之间通信的端口，port2 是用于 leader 选举的端口
#   - [<external_host>:]<external_port> 是另一个监听的 Socket ，供客户端访问
# 例如：当前 server id 为 1 时，会根据 server.1 的配置来监听 Socket ，根据其它 server 的配置去通信
server.1=10.0.0.1:2888:3888;2181  # 对于当前 server 而言，该 IP 地址会用于绑定 Socket ，可改为 0.0.0.0
server.2=10.0.0.2:2888:3888;2181
server.3=10.0.0.3:2888:3888;2181
```

## 命令行工具

zk 的 bin 目录下自带了多个 shell 脚本。
- 执行以下脚本可进入 zk 的命令行终端。
  ```sh
  bash bin/zkCli.sh
          -server localhost
  ```
  常用命令：
  ```sh
  version           # 显示版本

  ls <path>         # 显示指定路径下的所有 znode
    -R              # 递归显示子目录

  get <path>        # 读取 znode 中的数据
  set <path> <data> # 设置 znode 中的数据
  stat <path>       # 显示 znode 的状态

  create <path>     # 创建 znode
  delete <path>     # 删除 znode
  ```

