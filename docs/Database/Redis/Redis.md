# Redis

：一个键值对数据库，基于 C 语言开发。
- 发音相当于 red + diss
- 采用 C/S 工作模式。
- 以键值对的形式存储数据。
- Redis 服务器将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中。
- 很轻量级，一个空的 Redis 进程几乎不占系统资源。
- 单线程工作，只能使用 CPU 的一个核。但是采用 IO 多路复用技术，可以以单线程处理高并发请求。
- [官方文档](https://redis.io/documentation)

## 服务器

### 安装

- 下载源代码，编译后安装：
    ```sh
    redis_version=redis-5.0.6
    curl -O http://download.redis.io/releases/${redis_version}.tar.gz
    tar -zxvf ${redis_version}.tar.gz
    cd ${redis_version}
    yum install -y make gcc
    make install MALLOC=libc
    ```
  然后启动：
    ```sh
    redis-server                       # 启动 Redis 服务器
                /etc/redis/redis.conf  # 使用指定的配置文件
    ```
    - 以 daemon 方式启动时，出现报错也不会在终端显示。

- 或者运行 Docker 镜像：
    ```sh
    docker run -d --name redis -p 6379:6379 redis:5.0.5
    ```

### 配置

- 启动 Redis 服务器时，默认没有配置文件，会使用默认配置。
  - 可以将配置文件放在任意目录下，只要用配置文件启动 Redis ，Redis 就会读取并应用该配置文件的内容，决定运行时的配置。
  - 每次修改配置文件之后，要重启 Redis 才会生效。
- Redis 服务器启动之后，可以修改运行时的配置项。
  - 在客户端中，执行 `config get/set <name>` 可以查看、修改一个配置项。如下：
      ```
      127.0.0.1:6379> config get requirepass         # 查看密码
      1) "requirepass"
      2) ""                                          # 默认没有密码
      127.0.0.1:6379> config set requirepass 123456  # 设置密码
      OK
      ```
  - 执行 `config get *` 会显示所有配置项。
  - 执行 `config rewrite` 会将运行时的配置项保存到配置文件中，否则当 Redis 服务器终止时就会丢失被修改的配置。

配置文件示例：
```ini
bind 0.0.0.0
port 6379
daemonize yes                # 以 daemon 方式运行（默认是在前台运行）
dir /etc/redis/              # 工作目录
logfile /var/log/redis.log
pidfile /var/run/redis.pid
dbfilename dump.rdb          # 保存备份数据的文件名
requirepass ******           # Redis 服务器的密码

maxmemory 4G                 # 限制 Redis 使用的最大内存
maxmemory-policy allkeys-lru # 接近 maxmemory 时的删 key 策略

# 生产环境要禁用掉一些危险的命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
```
- Redis 服务器默认没有设置密码，不安全。
  - Redis 只存在 root 权限，没有细致的权限划分。用户要么无法进行任何操作，要么可以进行任何操作。因此，如果要让多个用户使用的 Redis 相互隔离，应该给它们分别启动一个 Redis 实例。
- 如果不设置 maxmemory 或设置成 0 ，当 Redis 占用的内存过多时会降低服务器的运行速度，甚至被 OOM 杀死。
  - maxmemory 建议设置成实际物理内存的 80% 左右，留有一定冗余。
- maxmemory-policy 有以下几种：
  - volatile-lru ：根据 LRU 算法删除任意一个设置了过期时间的 key 。
  - allkeys-lru ：根据 LRU 算法删除任意一个 key 。
  - volatile-random ：随机删除一个设置了过期时间的 key 。
  - allkeys-random ：随机删除任意一个 key 。
  - volatile-ttl ：删除 TTL 最短的 key 。
  - noeviction ：不删除 key ，而是在写操作时报错。

## 客户端

### 启动

```sh
redis-cli               # 启动客户端（默认连接到本地 6379 端口的服务器，使用 0 号数据库）
          -h 127.0.0.1  # 指定服务器的 IP 地址
          -p 6379       # 指定服务器的端口
          -a ******     # 指定密码
          -n 0          # 使用 0 号数据库
          [command]     # 不进入客户端的字段，只是执行一条命令
            -r 10       # 重复执行该命令 3 次
            -i 1.2      # 每次重复执行的间隔时长为 1.2s（可以使用小数）
```
- 执行 redis-cli 命令时，即使不能连接到 Redis 服务器，也会进入客户端的终端。
- 启动客户端时，默认不会进行密码认证。如果服务器设置了密码，就无权进行任何操作（连 ping 都不行），必须先完成密码认证。
- 例：
    ```sh
    redis-cli info                                       # 查询 redis 的信息
    redis-cli -r 100 -i 1 info | grep used_memory_human  # 轮序 Redis 占用的内存
    ```
- Redis 支持通过 Linux 管道一次传入多条命令来执行。如下：
    ```sh
    echo -e "dbsize\ndbsize" | redis-cli
    ```

### 常用命令

```
auth ******                  # 填入密码，进行认证
ping                         # 测试能否连接到 Redis 服务器

client list                  # 显示与服务器连接的所有客户端
client kill 127.0.0.1:59372  # 关闭一个客户端的连接

info                         # 显示服务器的详细信息
monitor                      # 实时显示服务器收到的所有命令
shutdown                     # 正常终止服务器（相当于发送 SIGTERM 信号）
```
- 命令名不区分大小写。
- 单个命令的执行都具有原子性。
- Redis 客户端可以一次发送多条命令（基于 pipeline），减少服务器的响应次数，提高效率。
- [info 的参数含义](https://redis.io/commands/info)
