## ZooKeeper

：一个分布式服务框架，简称为 zk 。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 采用 Java 开发，用 Maven 构建。
- 原本是 Hadoop 的子项目，现在已成为一个独立的顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 主要功能：
  - 作为注册中心，登记分布式系统中的各个客户端、服务。
  - 协调各节点之间的通信，维护分布式系统的一致性。
  - 可以存储少量数据。

## 原理

- 将集群中的各个 server 分为以下三种角色：
  - leader ：由 follower 选举产生，负责处理 client 的读请求和写请求，更新系统的状态并推送给 follower、observer 。
  - follower ：负责处理 client 的读请求，参与 leader 选举。
  - observer ：负责处理 client 的读请求，扩展系统的读取速度。

- 采用 Zab （Zookeeper atomic broadcast protocol ，与 Raft 类似）协议实现一致性：
  - 如果多数 server 写入数据成功，则数据为真。
  - server 数为 3 时，最多允许 1 个 server 挂掉。server 数为 4 时，也是最多允许 1 个 server 挂掉。
    因此， server 数最好为奇数，为偶数时可靠性并不会提升。部署 3 个 server 就可以组成一个最小的 zk 集群。

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
#   - <host>:<port1> 是该 server 与其它 server 通信的地址，port2 是 leader 选举的端口
#   - [<external_host>:]<external_port> 是供客户端访问的地址
# 例如：当前 server id 为 1 时，会根据 server.1 的配置来监听 Socket ，根据其它 server 的配置去通信
server.1=10.0.0.1:2888:3888;2181  # 监听的 IP 地址 10.0.0.1 如果不属于本机网卡，则可以监听 0.0.0.0
server.2=10.0.0.2:2888:3888;2181
server.3=10.0.0.3:2888:3888;2181
```
