# ActiveMQ

：一个消息队列服务器。
- [官方文档](http://activemq.apache.org/components/classic/documentation)

## 部署

### 单节点

- 先安装 JRE 1.7+ 环境，然后下载二进制版：
  ```sh
  wget https://archive.apache.org/dist/activemq/5.16.0/apache-activemq-5.16.0-bin.tar.gz
  ```
  解压后运行：
  ```sh
  bin/activemq
              console   # 启动（在前台运行）
              start     # 启动（以 daemon 方式运行）
              stop
              restart
              status    # 显示运行状态
  ```

### 集群

ActiveMQ 集群主要有两种架构：
- Master-Slave 集群
  - ：一个节点为 Master ，其它节点为 slave 。由 Master 节点提供服务。当 Master 节点宕机后，选出一个 Slave 节点作为新的 Master 节点。
  - 优点是可以保证服务的高可用性，缺点是不能解决负载均衡和分布式的问题。
- Broker Cluster 集群
  - ：各个 broker 互相连通，共享消息队列，同时提供服务。
  - 优点是可以解决负载均衡和分布式的问题，缺点是不能保证服务的高可用性。
  - 一般将 Master-Slave 和 Broker Cluster 两种方式结合使用。

## 配置

- ActiveMQ 会运行一个 jetty 服务器，提供 Web 管理页面。
  - 访问 <http://127.0.0.1:8161/admin/> 即可，默认账号、密码为 admin、admin 。
  - 在 `conf/jetty-realm.properties` 中可以自定义账号、密码：
    ```sh
    # username: password [,rolename ...]
    leo: 123456, admin
    ```

- 在 `conf/activemq.xml` 的 broker 区块中可以配置各种通信协议对应的 URI ：
  ```xml
  <transportConnectors>
      <transportConnector name="openwire" uri="tcp://0.0.0.0:61616?maximumConnections=1000&amp;wireFormat.maxFrameSize=104857600"/>
      <transportConnector name="amqp" uri="amqp://0.0.0.0:5672?maximumConnections=1000&amp;wireFormat.maxFrameSize=104857600"/>
      <transportConnector name="stomp" uri="stomp://0.0.0.0:61613?maximumConnections=1000&amp;wireFormat.maxFrameSize=104857600"/>
      <transportConnector name="mqtt" uri="mqtt://0.0.0.0:1883?maximumConnections=1000&amp;wireFormat.maxFrameSize=104857600"/>
      <transportConnector name="ws" uri="ws://0.0.0.0:61614?maximumConnections=1000&amp;wireFormat.maxFrameSize=104857600"/>
  </transportConnectors>
  ```
  通常使用 TCP 端口 61616 。
