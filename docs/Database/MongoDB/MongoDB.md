
# MongoDB

：一个文档型数据库，基于 C++。
- 采用 C/S 工作模式。
- 虽然属于 NoSQL 数据库，但用法很像 SQL 型数据库。
- 以类似 JSON 的格式存储数据，结构灵活，容易增删字段。
- MongoDB 不支持事务，只是保证了增删改等操作的原子性。
- [官方文档](https://docs.mongodb.com/v4.0/introduction/)

## 服务器

### 启动

- 用 yum 安装：
  ```
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-server-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-shell-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-tools-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-mongos-4.0.5-1.el7.x86_64.rpm
  yum install -y mongodb-org-*.rpm
  rm -f mongodb-org-*.rpm
  ```

- 启动：
  ```sh
  mongod                      # 启动 mongo 服务器
        -f /etc/mongod.conf   # 使用指定的配置文件
  ```
  - 启动服务器时，默认使用的配置文件是 /etc/mongod.conf ，在前台运行，监听端口 27017 ，

- 不安装，而是运行 docker 镜像：
  ```sh
  docker pull mongo:4
  docker run -d --name mongo -p 27017:27017 mongo:4
  ```

### 停止

停止服务器时，使用 kill 命令可能会导致服务器异常终止。
- 建议使用`mongod -f /etc/mongod.conf --shutdown`
- 或者在客户端执行：
  ```js
  use admin
  db.shutdownServer()
  ```

### 配置

旧版 MongoDB 的配置文件采用 ini 格式，从 2.6 版开始推荐采用 YAML 格式，分为 storage、systemLog、net 等多个大类。

例：
```yaml
storage:
  dbPath: /var/lib/mongo  # 存储数据的目录
  journal:
    enabled: true         # 启用日记功能

systemLog:
  destination: file       # 日志的输出方向，可以为 file 或 syslog ，默认输出到 stdout
  path: /var/log/mongo/mongod.log
  logAppend: true         # mongo 重启后，将日志以追加方式写入到之前的日志文件中，而不是从头覆盖

processManagement:
  fork: true              # 是否作为 daemon 进程运行
  pidFilePath: /var/run/mongod.pid

net:
  port: 27017
  bindIp: 0.0.0.0
  # bindIp: localhost,10.0.0.1,/tmp/mongod.sock   # 可以绑定多个访问 IP

security:
  authorization: enabled  # 启用身份认证
```

## 客户端

MongoDB 客户端的终端采用 JavaScript 的 shell ，因此：
- 可以执行 JS 代码、定义变量、定义函数。
- 执行一条语句时，不必以分号 ; 结尾。

### 启动

```sh
mongo                         # 启动客户端（默认连接到本机 6379 端口的服务器，使用 test 数据库）
      127.0.0.1:27017/test                            # 指定要连接的服务器、数据库
      username:password@127.0.0.1:27017/admin         # 再指定用户名、密码
      localhost,localhost:27018,localhost:27019/test  # 可以指定多个服务器
```
- 使用 admin 数据的用户进行登录时，必须要切换到 admin 数据库。
- 可以先启动客户端，再进行密码认证，如下：
    ```
    mongo 127.0.0.1:27017/admin
    db.auth('root', '******')
    ```

### 启用身份认证

MongoDB 默认没有启用身份认证，可按以下步骤启用：
1. 创建一个管理员用户：
    ```js
    use admin
    db.createUser(
      {
        user: 'root',
        pwd: '******',
        roles: [{role: 'root', db: 'admin'}]
      }
    )
    ```
    如果已启用身份认证，但是不知道管理员账号，可以先用`mongod ---noauth`重启服务器，再创建管理员账号。

2. 退出 MongoDB 终端，用`mongod --auth`重启 MongoDB 服务器，启用身份认证。
