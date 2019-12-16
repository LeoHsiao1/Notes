# Redis

：一个键值对数据库，基于C语言。

- 采用C/S架构。
- 服务器将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中。
- 很轻量级，一个空的Redis进程几乎不占系统资源。
- 单线程工作，只能使用CPU的一个核。但是采用IO多路复用技术，可以以单线程处理高并发请求。

## 启动服务器

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

## 配置服务器

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

## 启动客户端

命令：
```shell
redis-cli              # 启动客户端（默认连接到本地6379端口的服务器）
          -h 127.0.0.1 # 指定服务器的IP地址
          -p 6379      # 指定服务器的端口
          -a ******    # 指定密码
          [command]    # 不打开客户端，只是执行一条命令
```

- 执行redis-cli命令时，只要能连接到Redis服务器（网络连通且端口连通），就能启动客户端。
- 启动客户端时，默认不会进行密码认证。如果服务器设置了密码，就无权进行任何操作（连ping都不行），必须用 auth 命令完成密码认证。

## 使用客户端

命令：
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

## 保存数据

Redis服务器将数据保存在内存中，当Redis终止时，内存中的数据都会丢失。可采用以下方法持久化保存数据：

- **RDB模式**
  - ：默认模式，如果在n秒内至少有m个key被改动，则将此时Redis的所有数据保存到备份文件中。
  - 该备份文件通常是Redis工作目录下的 dump.rdb 文件。
  - 配置RDB模式的规则：
    ```
    config set save "3600 1 300 100 60 10000"
    ```
  - 可执行以下命令，立即将数据保存到dump.rdb文件中：
    ```
    save      # 将所有数据保存到备份文件中（在前台执行）
    bgsave    # 在后台执行save命令
    ```
  - RDB模式的备份开销小、精度低，但是恢复速度快。

- **AOF模式**
  - ：将Redis服务器执行的每条写命令都保存到备份文件中。
  - 该备份文件通常是Redis工作目录下的 appendonly.aof 文件。
  - 执行`config set appendonly yes`可启用AOF模式。
  - 配置AOF模式的策略：
    ```
    config set appendfsync always    # 每执行一条命令就保存一次（最慢、最安全）
    config set appendfsync everysec  # 每隔一秒保存一次
    config set appendfsync no        # 由Redis自己决定什么时候保存（间隔时间可能达几十秒）
    ```
  - 执行`bgrewriteaof`会在后台fork一个Redis实例去简化aof文件，去掉重复、冗余的命令。
  - Redis默认配置了以下参数，自动重写aof文件：
    ```
    auto-aof-rewrite-min-size 67108864    # aof文件考虑自动重写的最小体积
    auto-aof-rewrite-percentage 100       # aof文件超过最小体积时，每增大100%就重写一次
    ```
  - 如果要恢复数据，将dump.rdb或appendonly.aof拷贝到Redis工作目录下，然后重启Redis服务器即可。
    - Redis启动时会读取工作目录下的dump.rdb，将其中的数据载入内存。
    - 如果appendonly为yes，则Redis只会载入appendonly.aof。
  - AOF模式的备份精度高，但是备份开销大、恢复速度慢，因为要逐条执行命令。

- **混合模式**
  - ：每隔一段时间就用RDB模式做一次全量备份，期间用AOF模式做增量备份。
  - 先开启AOF模式，再执行`config set aof-use-rdb-preamble yes`可开启混合模式。
  - 生成的备份文件按 dump.aof 的格式命名，文件中先存储rdb的内容（以REDIS开头），然后存储aof的内容。
  - Redis会先将数据保存到一个临时文件中，再用它替换dump.aof文件，因此保存失败也不会影响原来的备份。
  - 在混合模式下，每次重写aof文件，都会将aof文件的内容全部重写为rdb形式。

## 分区

：用于将数据分散保存到多个Redis实例。

- 分区的优点。
  - 合并多个Redis实例。
- 分区的方式。
  - 按value值的范围分区。
  - 按key的hash值的范围分区。

## 发布-订阅

Redis提供了发布-订阅功能，可用用作简单的消息队列。
