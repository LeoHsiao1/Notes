# Redis

：一个键值对数据库，基于C语言。
- 发音相当于 red + diss
- 采用C/S工作模式。
- 以键值对的形式存储数据。
- Redis服务器将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中。
- 很轻量级，一个空的Redis进程几乎不占系统资源。
- 单线程工作，只能使用CPU的一个核。但是采用IO多路复用技术，可以以单线程处理高并发请求。
- [官方文档](https://redis.io/documentation)

## 服务器

### 启动

- 从源代码安装：
    ```sh
    redis_version=redis-5.0.6
    curl -O http://download.redis.io/releases/${redis_version}.tar.gz
    tar -zxvf ${redis_version}.tar.gz
    cd ${redis_version}
    yum install -y make gcc
    make install MALLOC=libc
    ```

- 启动：
    ```sh
    redis-server                       # 启动Redis服务器
                /etc/redis/redis.conf  # 使用指定的配置文件
    ```
    - 以daemon方式启动时，出现报错也不会在终端显示。

- 不安装，而是运行docker镜像：
    ```sh
    docker run -d --name redis -p 6379:6379 redis:5.0.5
    ```

### 配置

- 启动Redis服务器时，默认没有配置文件，会使用默认配置。
  - 可以将配置文件放在任意目录下，只要用配置文件启动Redis，Redis就会读取并应用该配置文件的内容，决定运行时的配置。
  - 每次修改配置文件之后，要重启Redis才会生效。
- Redis服务器启动之后，可以修改运行时的配置项。
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

配置文件示例：
```ini
bind 0.0.0.0
port 6379
daemonize yes                # 在后台运行（默认是在前台运行）
dir /etc/redis/              # 工作目录
logfile /var/log/redis.log
pidfile /var/run/redis.pid
dbfilename dump.rdb          # 保存备份数据的文件名
requirepass ******           # Redis服务器的密码

maxmemory 4G                 # 限制Redis使用的最大内存
maxmemory-policy allkeys-lru # 接近maxmemory时的删key策略

# 生产环境要禁用掉一些危险的命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
```
- Redis服务器默认没有设置密码，不安全。
  - Redis只存在root权限，没有细致的权限划分。用户要么无法进行任何操作，要么可以进行任何操作。因此，如果要让多个用户使用的Redis相互隔离，应该给它们分别启动一个Redis实例。
- 如果不设置maxmemory或设置成0，当Redis占用的内存过多时会降低服务器的运行速度，甚至被OOM杀死。
  - maxmemory建议设置成实际物理内存的 80% 左右，留有一定冗余。
- maxmemory-policy有以下几种：
  - volatile-lru ：根据LRU算法删除任意一个设置了过期时间的key。
  - allkeys-lru ：根据LRU算法删除任意一个key。
  - volatile-random ：随机删除一个设置了过期时间的key。
  - allkeys-random ：随机删除任意一个key。
  - volatile-ttl ：删除TTL最短的key。
  - noeviction ：不删除key，而是在写操作时报错。

## 客户端

### 启动

```sh
redis-cli               # 启动客户端（默认连接到本地6379端口的服务器，使用0号数据库）
          -h 127.0.0.1  # 指定服务器的IP地址
          -p 6379       # 指定服务器的端口
          -a ******     # 指定密码
          -n 0          # 使用0号数据库
          [command]     # 不进入客户端的字段，只是执行一条命令
            -r 10       # 重复执行该命令3次
            -i 1.2      # 每次重复执行的间隔时长为1.2s（可以使用小数）
```
- 执行redis-cli命令时，即使不能连接到Redis服务器，也会进入客户端的终端。
- 启动客户端时，默认不会进行密码认证。如果服务器设置了密码，就无权进行任何操作（连ping都不行），必须先完成密码认证。
- 例：
    ```sh
    redis-cli info                                       # 查询redis的信息
    redis-cli -r 100 -i 1 info | grep used_memory_human  # 轮序Redis占用的内存
    ```
- Redis支持通过Linux管道一次传入多条命令来执行。如下：
    ```sh
    echo -e "dbsize\ndbsize" | redis-cli
    ```

### 常用命令

```
auth ******                  # 填入密码，进行认证
ping                         # 测试能否连接到Redis服务器

client list                  # 显示与服务器连接的所有客户端
client kill 127.0.0.1:59372  # 关闭一个客户端的连接

info                         # 显示服务器的详细信息
monitor                      # 实时显示服务器收到的所有命令
shutdown                     # 正常终止服务器（相当于发送SIGTERM信号）
```
- 命令名不区分大小写。
- 单个命令的执行都具有原子性。
- Redis客户端可以一次发送多条命令（基于pipeline），减少服务器的响应次数，提高效率。
- [info的参数含义](https://redis.io/commands/info)
