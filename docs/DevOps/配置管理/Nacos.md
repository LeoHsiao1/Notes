# Nacos

：一个 Web 服务器，提供了配置管理、服务发现的功能。
- [官方文档](https://nacos.io/zh-cn/docs/quick-start.html)
- 发音为 `/nɑ:kəʊs/` 。
- 2018 年由阿里巴巴公司开源，采用 Java 开发。
- 优点：
  - 在中国比较流行，与 Spring Cloud 框架的搭配较好。
- 缺点：
  - 功能、性能不如 Consul 。
  - 启动慢，可能要几分钟。
  - Web 端、API 需要分别启用密码认证，而用户容易遗漏后者，留下安全隐患。

## 部署

- 下载二进制包，解压后以单机模式启动：
  ```sh
  sh startup.sh -m standalone
  ```
  - 访问 `http://127.0.0.1:8848/nacos/` 即可登录 Nacos 的 Web 页面，默认账号、密码为 nacos、nacos 。

- 或者用 Docker 部署：
  ```yml
  version: "3"

  services:
    nacos:
      container_name: nacos
      image: nacos/nacos-server:v2.0.4
      restart: unless-stopped
      environment:
        MODE: standalone
        NACOS_AUTH_ENABLE: 'true'   # Nacos 默认给 Web 端启用了密码认证，但 API 未启用密码认证，需要主动开启
        # JVM_XMS: 1G
        # JVM_XMX: 1G
      ports:
        - 8848:8848     # HTTP 端口，供客户端访问
        - 9848:9848     # gRPC 端口，供客户端访问
        # - 9849:9849   # gRPC 端口，供 Nacos 多实例之间访问
  ```
  - Nacos 默认将数据存储在自己目录中，可配置以下环境变量，将数据存储到 MySQL 中：
    ```yml
    SPRING_DATASOURCE_PLATFORM: mysql
    MYSQL_SERVICE_HOST: 10.0.0.1
    MYSQL_SERVICE_PORT: 3306
    MYSQL_SERVICE_USER: nacos
    MYSQL_SERVICE_PASSWORD: ******
    MYSQL_SERVICE_DB_NAME: nacos
    MYSQL_SERVICE_DB_PARAM: characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useSSL=false
    ```
    需要执行数据库的初始化脚本 [nacos-mysql.sql](https://github.com/alibaba/nacos/blob/master/distribution/conf/nacos-mysql.sql)

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
