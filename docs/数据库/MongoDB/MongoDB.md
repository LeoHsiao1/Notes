
# MongoDB

：一个文档型数据库，基于C++。
- 采用C/S架构。
- 虽然属于NoSQL数据库，但用法很像SQL型数据库。
- 以类似JSON的格式存储数据，结构灵活，容易增删字段。
- MongoDB不支持事务，只是保证了增删改等操作的原子性。
- [官方文档](https://docs.mongodb.com/v4.0/introduction/)

## 服务器

### 启动

- 用yum安装：
  ```
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-server-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-shell-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-tools-4.0.5-1.el7.x86_64.rpm
  curl -O https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/RPMS/mongodb-org-mongos-4.0.5-1.el7.x86_64.rpm
  yum install -y mongodb-org-*.rpm
  rm -f mongodb-org-*.rpm
  ```

- 启动服务器：
  ```shell
  mongod                      # 启动mongo服务器
        -f /etc/mongod.conf   # 使用指定的配置文件
  ```
  - 启动服务器时，默认使用的配置文件是 /etc/mongod.conf ，在前台运行，监听端口27017，

- 不安装，而是运行docker镜像：
  ```shell
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

旧版MongoDB的配置文件采用ini格式，从2.6版开始推荐采用YAML格式，分为storage、systemLog、net等多个大类。

例：
```yaml
storage:
  dbPath: /var/lib/mongo  # 存储数据的目录
  journal:
    enabled: true         # 启用日记功能

systemLog:
  destination: file       # 日志的输出方向，可以为file或syslog，默认输出到stdout
  path: /var/log/mongo/mongod.log
  logAppend: true         # mongo重启后，将日志以追加方式写入到之前的日志文件中，而不是从头覆盖

processManagement:
  fork: true              # 是否作为daemon进程运行
  pidFilePath: /var/run/mongod.pid

net:
  port: 27017
  bindIp: 0.0.0.0
  # bindIp: localhost,10.0.0.1,/tmp/mongod.sock   # 可以绑定多个访问IP

security:
  authorization: enabled  # 启用身份认证
```

## 客户端

MongoDB客户端的终端采用JavaScript的shell，因此：
- 可以执行JS代码、定义变量、定义函数。
- 执行一条语句时，不必以分号 ; 结尾。

### 启动

```shell
mongo                         # 启动客户端（默认连接到本机6379端口的服务器，使用test数据库）
      127.0.0.1:27017/test                            # 指定要连接的服务器、数据库
      username:password@127.0.0.1:27017/admin         # 再指定用户名、密码
      localhost,localhost:27018,localhost:27019/test  # 可以指定多个服务器
```
- 使用admin数据的用户进行登录时，必须要切换到admin数据库。
- 可以先启动客户端，再进行密码认证，如下：
    ```
    mongo 127.0.0.1:27017/admin
    db.auth('root', '******')
    ```

### 启用身份认证

MongoDB默认没有启用身份认证，可按以下步骤启用：
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

2. 退出MongoDB终端，用`mongod --auth`重启MongoDB服务器，启用身份认证。

### 管理用户

MongoDB采用基于角色的访问控制。
- 可以在一个数据库中定义角色，然后分配给用户使用。
- 在普通数据库中定义的角色只在该数据库中有效，在admin数据库中定义的角色在所有数据库中都有效。
- 普通角色的分类：
  - read ：可以读取数据库
  - readWrite ：可以读写数据库
  - dbAdmin ：可以管理数据库
  - userAdmin ：可以管理用户
- admin数据库默认定义了以下角色：
  - readAnyDatabase
  - readWriteAnyDatabase
  - dbAdminAnyDatabase
  - userAdminAnyDatabase
  - clusterAdmin ：可以管理副本集
- 特殊角色：
  - root ：超级管理员，拥有所有权限
- 例：
  ```js
  show users                                     // 显示当前数据的所有用户
  db.createUser({user: 'user1', pwd: '******'})  // 创建用户
  db.dropUser("user1")                           // 删除用户

  db.grantRolesToUser('user1', [{role: 'readWrite', db: 'db1'}])    // 给用户分配权限
  db.revokeRolesFromUser('user1', [{role: 'readWrite', db: 'db1'}]) // 删除用户的权限
  ```
