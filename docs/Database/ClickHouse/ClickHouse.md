# ClickHouse

：一个 NewSQL 数据库，采用 MPP 架构、列式存储，擅长 OLAP 。
- [官方文档](https://clickhouse.com/docs/)
- 2016 年，由俄罗斯的 Yandex 公司开源。
- 不支持事务。
- 架构分为两个模块：
  - clickhouse-server ：服务器。
  - clickhouse-client ：客户端。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    clickhouse:
      container_name: clickhouse
      image: yandex/clickhouse-server:21.11
      restart: unless-stopped
      ports:
        - 8123:8123
        - 9000:9000
        - 9004:9004
      volumes:
        - /etc/localtime:/etc/localtime:ro
        - ./config:/etc/clickhouse-server
        - ./data:/var/lib/clickhouse
  ```
  - 需要调整挂载目录的权限：
    ```sh
    chown -R 101 .
    ```

## 配置

- 配置文件采用 XML 或 YAML 格式。
- config.xml 示例：
  ```xml
  <?xml version="1.0"?>
  <clickhouse>
      <http_port>8123</http_port>
      <tcp_port>9000</tcp_port>
      <mysql_port>9004</mysql_port>
      <listen_host>127.0.0.1</listen_host>  <!-- 默认只允许本机访问 -->
  </clickhouse>
  ```
<!-- - users.xml 示例：
  - 默认用户名为 default ，默认密码为空。 -->


## 客户端

- ClickHouse 监听了多个端口，供不同类型的客户端访问：
  - http_port ：提供 HTTP API 。访问 /play 页面会显示一个 Web UI ，可以执行命令。
  - tcp_port ：供 clickhouse 原生客户端访问。
  - mysql_port ：供 MySQL 客户端访问的兼容端口。

- 例：使用 HTTP API
  ```sh
  [root@CentOS]# curl 10.0.0.1:8123
  Ok.
  [root@CentOS]# curl '10.0.0.1:8123/?user=default&password=xxx' -d 'show databases'
  INFORMATION_SCHEMA
  default
  information_schema
  system
  ```

- 例：使用原生客户端
  ```sh
  docker run -it --rm yandex/clickhouse-client:21.11
        # --host localhost
        # --port 9000
        # --user default
        # --password ''
  ```
