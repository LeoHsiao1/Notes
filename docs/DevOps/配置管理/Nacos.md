# Nacos

：一个 Web 服务器，提供了配置管理、服务发现的功能。
- [官方文档](https://nacos.io/zh-cn/docs/quick-start.html)
- 发音为 `/nɑ:kəʊs/` 。
- 2018 年由阿里巴巴公司开源，采用 Java 开发。
- 优点：
  - 在中国比较流行，与 Spring Cloud 框架做了适配。
- 缺点：
  - 功能、性能不如 Consul 。
  - 启动慢，可能要几分钟。

## 部署

- 下载 Nacos 的二进制包并解压，然后以单机模式启动：
  ```sh
  sh startup.sh -m standalone
  ```

- 或者用 Docker 部署单机模式的 Nacos ：
  ```yml
  version: "3"

  services:
    nacos:
      container_name: nacos
      image: nacos/nacos-server:v2.2.2
      restart: unless-stopped
      environment:
        JVM_XMS: 1G
        JVM_XMX: 1G
        MODE: standalone
        NACOS_AUTH_ENABLE: 'true'
        NACOS_AUTH_TOKEN: ***         # 用于生成客户端的 accessToken
        NACOS_AUTH_IDENTITY_KEY: ***  # 用于 Nacos 集群节点之间的身份认证
        NACOS_AUTH_IDENTITY_VALUE: ***
      ports:
        - 8848:8848     # HTTP 端口，供客户端访问
        - 9848:9848     # gRPC 端口，供客户端访问
        # - 9849:9849   # gRPC 端口，供 Nacos 集群节点之间通信
        # - 7848:7848   # gRPC 端口，供 Nacos 集群节点之间 Raft 选举
  ```
  - Nacos 默认采用内置数据库 Derby ，将数据存储在本机目录中，可配置以下环境变量，将数据存储到 MySQL 中：
    ```yml
    SPRING_DATASOURCE_PLATFORM: mysql
    MYSQL_SERVICE_HOST: 10.0.0.1
    MYSQL_SERVICE_PORT: 3306
    MYSQL_SERVICE_USER: nacos
    MYSQL_SERVICE_PASSWORD: ******
    MYSQL_SERVICE_DB_NAME: nacos
    MYSQL_SERVICE_DB_PARAM: characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useSSL=false
    ```
  - 需要在 MySQL 中为 nacos 专门创建一个数据库、账号：
    ```sql
    create database nacos;
    create user nacos@'%' identified by '******';
    grant  all on nacos.* to nacos@'%';
    flush privileges;
    ```
    然后执行数据库的初始化脚本 [nacos-mysql.sql](https://github.com/alibaba/nacos/blob/2.2.2/distribution/conf/mysql-schema.sql)

- Nacos 启动慢，重启时容易导致所有微服务不可用，因此在生产环境建议部署集群模式的 Nacos ，参考 [官方示例](https://github.com/nacos-group/nacos-k8s) 。
  - Nacos 集群的各节点通过 Raft 协议实现分布式一致性。自动选出一个节点担任 leader ，其它节点担任 follower 。
  - Nacos v1.4.1 开始，用 sofa-jraft 库代替了自研的 Raft 实现，但存在一些 [issue](https://github.com/alibaba/nacos/issues/5343) 。
  - 可执行命令 `curl 127.0.0.1:8848/nacos/v1/core/cluster/self` 查看集群状态。

- Nacos 默认的安全性低，需要用户主动配置。
  - 访问 `http://127.0.0.1:8848/nacos/` 即可登录 Nacos 的 Web 页面，默认账号、密码为 nacos、nacos ，需要用户修改密码。
  - Nacos 的 Web 页面默认启用了密码认证，但 API 未启用密码认证，需要用户主动配置 NACOS_AUTH_ENABLE=true ，而很多用户会忽视这点。
    - 原理：每次客户端登录成功之后，Nacos 会根据 token.secret.key 生成一个 accessToken ，分配给客户端使用，并根据 token.expire.seconds 设置有效期。
    - 即使启用了 NACOS_AUTH_ENABLE ，但一些配置参数采用默认值的话，容易被爆破。因此 Nacos v2.2.0 取消了 token.secret.key、nacos.core.auth.server.identity.key、nacos.core.auth.server.identity.value 的默认值，需要用户主动配置。
  - 即使完成了上述安全措施，也不应该将 Nacos 暴露到公网。因为它可能存在其它安全漏洞，而且可能有人频繁尝试登录 Nacos ，造成很大 CPU 负载。

## 用法

### 配置管理

- Configuration Set ：配置集，即一个配置文件，包含一些配置参数。
- DataID ：每个配置集的 ID ，命名格式为 `${prefix}-${spring.profile.active}.${file-extension}` 。
- Namespace ：Nacos 支持创建多个命名空间，比如 default、test、prod ，用于隔离 service、DataID、Group 等资源。
- Group ：每个 Namespace 中可以创建多个分组，用于隔离配置集。

### 服务发现

- Nacos 将注册的服务分为两类，采用不同的健康检查方式：
  - 临时实例
    - ：不健康一段时间之后会被自动注销。
    - 临时实例会定期向 Nacos 发送一个 HTTP 请求，进行心跳检查。如果该实例尚未注册，则自动注册。
  - 持久实例
    - ：不健康时不会注销，只是不加入负载均衡。
    - Nacos 定期（默认间隔为 20 秒）向持久实例发送一个 TCP 或 HTTP 请求，如果响应失败则将它标记为不健康。

- Spring Boot 服务使用 Nacos 的配置示例：
  ```yml
  server:
    port: 80
  spring:
    application:
      name: demo
    profiles:
      active: test
    cloud:
      nacos:
        username: ***                               # 访问 Nacos API 的账号，默认无
        password: ***
        config:                                     # 关于配置管理
          server-addr: 10.0.0.1:8848                # Nacos 服务器的地址
          # enabled: true                           # 是否启用配置管理功能
          # namespace: public                       # 该服务所属的命名空间
          # group: DEFAULT_GROUP                    # 该服务所属的 group
          # prefix: ${spring.application.name}      # 根据 prefix 等参数确定 DataID ，找到对应的配置集，给该服务采用
          # file-extension: properties              # 配置文件的扩展名，比如 yaml
          # refresh:
          #   enabled: true                         # 是否自动从 Nacos 获取最新的配置，这样不必重启服务
        discovery:                                  # 关于服务发现
          server-addr: ${spring.cloud.nacos.config.server-addr}
          # register-enabled: true                  # 是否将当前进程注册到 Nacos ，作为一个服务实例。但依然会通过 Nacos 发现其它服务
          # namespace: public
          # group: DEFAULT_GROUP
          # service: ${spring.application.name}     # 注册的服务名
          # spring.cloud.nacos.discovery.ip: xxx    # 注册的 IP ，供其它服务调用。默认采用第一个网卡的 IP
          # spring.cloud.nacos.discovery.port: ${server.port}
          # ephemeral: true                         # 是否为临时实例
          # weight: 1                               # 该服务实例在负载均衡时的权重，取值范围为 1~100
          # metadata:                               # 添加一些该服务实例的元数据
          #   preserved.heart.beat.interval: 5000   # 发送心跳的间隔时长，单位为 ms
          #   preserved.heart.beat.timeout: 15000   # 如果该时长内无心跳，则 Nacos 将该服务实例标记为不健康
          #   preserved.ip.delete.timeout: 30000    # 如果该时长内无心跳，则 Nacos 将该服务实例注销
  ```

- 健康保护阈值：一个浮点数，取值范围为 0~1 。当一个服务的健康实例数占总数的比值小于阈值时，Nacos 会将不健康的实例加入负载均衡。这样会损失部分流量，但避免剩下的健康实例负载过大、服务雪崩。

### API

```sh
# 发布配置
curl -X POST "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=d1&group=test&content=HelloWorld"

# 获取配置
curl -X GET "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=d1&group=test"

# 注册服务
curl -X POST 'http://127.0.0.1:8848/nacos/v1/ns/instance?serviceName=nginx&ip=10.0.0.1&port=80'

# 发现服务
curl -X GET 'http://127.0.0.1:8848/nacos/v1/ns/instance/list?serviceName=nginx'
```
