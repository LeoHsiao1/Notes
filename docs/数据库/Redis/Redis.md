# Redis

：一个键值对数据库，基于C语言。

- 采用C/S架构。
- 以键值对的形式存储数据。
- Redis服务器将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中。
- 很轻量级，一个空的Redis进程几乎不占系统资源。
- 单线程工作，只能使用CPU的一个核。但是采用IO多路复用技术，可以以单线程处理高并发请求。

## 服务器

### 启动

- 从源代码安装：
    ```shell
    redis_version=redis-5.0.6
    curl -O http://download.redis.io/releases/${redis_version}.tar.gz
    tar -zxvf ${redis_version}.tar.gz
    cd ${redis_version}
    yum install -y make gcc
    make install MALLOC=libc
    ```

- 启动服务器：
    ```shell
    redis-server                       # 启动Redis服务器
                /etc/redis/redis.conf  # 使用配置文件启动
    ```
    - 以daemon方式启动时，出现报错也不会在终端显示。

- 不安装，而是运行docker镜像：
    ```shell
    docker run -d --name redis -p 6379:6379 redis:5.0.5
    ```

### 配置

启动Redis服务器时，默认没有配置文件，使用默认配置。
- 如果使用配置文件启动Redis服务器，Redis会应用配置文件中的各个配置项，覆盖掉默认配置。
- 每次修改配置文件之后，要使用该配置文件重启Redis才会生效。
- 配置文件示例：
  ```conf
  bind 0.0.0.0
  port 6379
  daemonize yes               # 在后台运行（默认是在前台运行）
  dir /etc/redis/             # 工作目录
  logfile /var/log/redis.log
  pidfile /var/run/redis.pid
  dbfilename dump.rdb         # 保存备份数据的文件名
  requirepass ******          # Redis服务器的密码
  ```

Redis服务器默认没有设置密码，不安全。
- Redis只存在root权限，没有细致的权限划分。用户要么无法进行任何操作，要么可以进行任何操作。因此，如果要让多个用户使用的Redis相互隔离，应该给它们分别启动一个Redis实例。

Redis服务器启动之后，可以修改运行时的配置项。
- 在客户端中，执行 `config get/set <name>` 可以查看、修改一个配置项。如下：
    ```
    127.0.0.1:6379> config get requirepass         # 查看密码
    1) "requirepass"
    2) ""                                          # 默认没有密码
    127.0.0.1:6379> config set requirepass 123456  # 设置密码
    OK
    ```
- 执行 `config get *` 会显示所有配置项。
- 执行 `config rewrite` 会将运行时的配置项保存到配置文件中，否则当Redis服务器终止时就会丢失被修改的配置。

## 客户端

### 启动

```shell
redis-cli               # 启动客户端（默认连接到本地6379端口的服务器，使用0号数据库）
          -h 127.0.0.1  # 指定服务器的IP地址
          -p 6379       # 指定服务器的端口
          -a ******     # 指定密码
          [command]     # 不打开客户端，只是执行一条命令
```
- 执行redis-cli命令时，即使不能连接到Redis服务器，也会进入客户端的终端。
- 启动客户端时，默认不会进行密码认证。如果服务器设置了密码，就无权进行任何操作（连ping都不行），必须用 auth 命令完成密码认证。

### 常用命令

```
auth ******     # 填入密码，进行认证
ping            # 测试能否连接到Redis服务器

client list                  # 显示与服务器连接的所有客户端
client kill 127.0.0.1:59372  # 关闭一个客户端的连接

info            # 显示服务器的详细信息
monitor         # 实时显示服务器收到的所有命令
shutdown        # 终止服务器
```
- 命令名不区分大小写。
- 单个命令的执行都具有原子性。
- 可以把连续的多个命令声明为一个事务，如下：
    ```
    multi        # 声明一个事务的开始
    ...命令...
    exec         # 开始执行该事务
    ```
  - 在执行 exec 之前，可以用 discard 取消执行剩下的命令（但已执行的命令并不能回滚）。
  - Redis的事务不能保证原子性。
