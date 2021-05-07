## ZooKeeper

：一个分布式服务框架，简称为 zk 。
- [官方文档](https://zookeeper.apache.org/doc/r3.6.2/index.html)
- 基于 Java 开发，用 Maven 构建。
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
- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    zookeeper:
      container_name: zookeeper
      image: zookeeper:3.6.2
      restart: unless-stopped
      network_mode:
        host
      volumes:
        - ./conf:/conf
        - ./data:/data
        - ./log:/datalog
  ```

### 配置

配置文件 `conf/zoo.cfg` 示例：
```sh
clientPort=2181                 # 供客户端连接的端口
dataDir=/zk/data                # 数据目录
dataLogDir=/zk/log              # 日志目录

tickTime=2000                   # 向其它 server 、client 发送心跳包的时间间隔（ms）
initLimit=5                     # server 初始化连接到 leader 的超时时间，单位为 tickTime
syncLimit=2                     # server 与 leader 之间通信（请求、应答）的超时时间，单位为 tickTime

# 以下声明 Zookeeper 集群的所有 server
server.0=10.0.0.1:2888:3888     # 一个 server 的 IP 地址、与其它 server 通信的端口、用于 leader 选举的端口
server.1=10.0.0.2:2888:3888
server.2=10.0.0.3:2888:3888
```
- 每个 server 启动之后，会根据 `$dataDir/myid` 的值确定自己的 server 编号。因此初次部署时需要创建 myid 文件，如下：
  ```sh
  echo 0 > $dataDir/myid
  ```
