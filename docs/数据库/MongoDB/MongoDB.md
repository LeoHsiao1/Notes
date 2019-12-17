
# MongoDB

：一个文档型数据库，基于C++。
- 属于NoSQL数据库，但用法很像SQL型数据库。
- 以类似JSON的格式存储数据，结构灵活，容易增删字段。
- MongoDB不支持事务，只是保证了增删改等操作的原子性。

## 服务器

### 启动

运行docker镜像：
```shell
docker pull mongo:4
docker run -d --name mongo -p 27017:27017 mongo:4
```

### 配置

配置文件默认位于 /etc/mongod.conf 

## 客户端

MongoDB客户端的终端采用JavaScript的shell，因此：
- 可以执行JS代码、定义变量、定义函数。
- 执行一条语句时，不必以分号 ; 结尾。

### 启动

```
mongo                         # 启动客户端（默认连接到本机6379端口的服务器，使用test数据库）
      127.0.0.1:27017/test                            # 指定要连接的服务器、数据库
      username:password@127.0.0.1:27017/admin         # 再指定用户名、密码
      localhost,localhost:27018,localhost:27019/test  # 可以指定多个服务器
```
- 切换到admin数据库时，才能进行密码认证。
- 可以先启动客户端，再进行密码认证，如下：
    ```
    mongo 127.0.0.1:27017/admin
    db.auth('username', 'password')    # 用户名、密码要用单引号包住，表示为字符串
    ```

### 添加用户

MongoDB默认没有启用密码认证，可按以下步骤设置密码：
1.  添加用户：
    ```
    use admin
    db.createUser(
      {
        user: "admin",
        pwd: "*******",
        roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
      }
    )
    ```
2.  显示已存在的所有用户：
    ```
    show users
    ```
3.  重启MongoDB服务器，启用密码认证：
    ```
    mongod --db <path> --auth
    ```
