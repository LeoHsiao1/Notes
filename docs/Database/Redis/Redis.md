# Redis

：一个键值对数据库，基于C语言。

- 采用C/S架构。
- 服务器将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中。
- 很轻量级，一个空的Redis进程几乎不占系统资源。
- 单线程工作，只能使用CPU的一个核。但是采用IO多路复用技术，可以以单线程处理高并发请求。

## 安装

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
                /etc/redis/redis.conf  # 使用某个配置文件启动
    ```

- 不安装，而是运行docker镜像：
    ```shell
    docker pull redis:5.0.5
    docker run -d --name redis -p 6379:6379 redis:5.0.5
    ```

## 客户端

```shell
redis-cli              # 启动客户端（默认连接到本地6379端口的服务器）
          -h 127.0.0.1 # 指定服务器的IP地址
          -p 6379      # 指定服务器的端口
          -a ******    # 指定密码
```
  - Redis默认没有密码。如果设置了密码，却没有在启动Redis客户端时输入密码，也可以进入其终端，只是无权进行任何操作。
  - Redis只存在root权限，没有细致的权限划分。用户要么无法进行任何操作，要么可以进行任何操作。因此，如果要让多个应用使用的Redis相互隔离，应该给它们分别启动一个Redis实例。
- 命令：
auth ******     # 填入密码，进行认证
ping        # 测试能否连接到Redis服务器（如果没通过密码认证，就不能执行ping）
client list    # 显示与Redis服务器连接的所有客户端
client kill 127.0.0.1:59372  # 关闭一个客户端的链接

info        # 显示Redis服务器的详细信息
monitor      # 实时显示Redis服务器收到的所有命令
shutdown      # 终止服务器
  - 命令名不区分大小写。
  - 单个命令的执行都是原子性的。
- 可以把连续的多个命令声明为一个事务。
multi  # 声明一个事务的开始
...命令
exec    # 开始执行该事务
  - 在执行exec之前，可以用discard取消执行剩下的命令（但已执行的命令并不能回滚）。
  - Redis的事务不能保证原子性。
- 关于备份。
save        # 将所有数据保存到Redis安装目录下的dump.rdb文件（在前台执行）
bgsave      # 在后台执行
  - 恢复数据时，把dump.rdb文件放到Redis工作目录下即可。
## 当Redis终止时，内存中的数据都会丢失。可采用以下方法持久化保存数据：
- RDB模式：如果在n秒内至少有m个key被改动，则将此时Redis的所有数据保存为Redis安装目录下的dump.rdb文件。
  - 默认使用该该模式。
  - Redis会先保存成一个临时文件，再用它替换dump.rdb文件，因此保存失败也不会影响原来的备份。
  - 备份开销小、精度低，但是恢复速度快。
  - 配置RDB模式的规则：
config set save "3600 1 300 100 60 10000"。
  - 可主动生成dump.rab文件：
save        # 在前台执行
bgsave      # 在后台执行
- AOF模式：把Redis服务器执行的每条写命令都保存到appendonly.aof文件中。
  - 备份精度高，但是备份开销大、恢复速度慢，因为要逐条执行命令。
  - 输入config set appendonly yes可启用AOF模式。
  - 配置AOF模式的策略：
config set appendfsync always    # 每执行一条命令就保存一次（最慢、最安全）
config set appendfsync everysec  # 每隔一秒保存一次
config set appendfsync = no    # 由Redis自己决定什么时候保存（间隔时间可能达几十秒）

  - Redis在启动时会读取工作目录下的dump.rdb，将其中的数据载入内存。
如果appendonly为yes，则Redis只会载入appendonly.aof。
  - 如果要恢复数据，将dump.rdb或appendonly.aof拷贝到Redis安装目录下，然后重启Redis服务器即可。
  - 执行`bgrewriteaof`，会在后台fork一个Redis实例去简化aof文件，去掉重复、冗余的命令。
Redis默认配置了以下参数，进行自动重写：
auto-aof-rewrite-min-size 67108864      # aof文件考虑自动重写的最小体积
auto-aof-rewrite-percentage 100      # aof文件超过最小体积时，每增大100%就重写一次
- 混合模式：每隔一段时间就用RDB模式做一次全量备份，期间用AOF模式做增量备份。
生成的备份文件按`dump.aof`的格式命名，文件的开头存储rdb的内容（以REDIS开头），然后存储aof的内容。

先开启AOF模式，再开启混合模式：
config set aof-use-rdb-preamble yes

在混合模式下，每次重写aof文件，都会将aof文件的内容全部重写为rdb形式。

## Redis分区：用于将数据分散保存到多个Redis实例。
- 分区的优点。
  - 横向扩容。
  - 构成集群。
- 分区的方式。
  - 按value值的范围分区。
  - 按key的hash值的范围分区。
## Redis支持发布-订阅模式，可用用作简单的消息队列。
## 
## 
## 
 
数据库
## Redis中，一个数据库相当于Python中的一个字典，可以存储很多个键值对。
- 每个数据库从0开始编号，默认使用0号数据库。默认创建了16个数据库。
- key只能是string类型，value可以是多种类型。
## 关于数据库的命令。
select n      # 切换到第n个数据库
move key db    # 将当前数据库的一个key移动到指定数据库
dbsize      # 返回当前数据库的key总数
flushdb      # 删除当前数据库的所有key
flushall      # 删除所有数据库的所有key
## 关于key的命令。
- keys pattern
  - 功能：查看匹配pattern的所有key。
  - 例：
127.0.0.1:6379> keys key*
1) "key1"
2) "key2"
- exists key [key ...]
  - 功能：判断key是否存在。
  - 例：
127.0.0.1:6379> exists key1 key2
(integer) 2
- del key [key ...]
  - 功能：删除key。
  - 例：
127.0.0.1:6379> get key1
"hello"
127.0.0.1:6379> del key1
(integer) 1        # 返回生效的key的数量
127.0.0.1:6379> get key1
(nil)          # 如果键值对不存在，则返回nil
  - 大部分命令会返回生效的key的数量，如果为0则说明执行失败。
- rename key newkey
  - 功能：重命名一个key。如果newkey已存在，则覆盖它。
- renamenx key newkey
  - 功能：重命名一个key。如果newkey已存在，则不执行操作。
- type key
  - 功能：返回key的value的数据类型。
  - 例：
127.0.0.1:6379> type key1
string
- dump key
  - 功能：返回key的序列化后的值。
  - 例：
127.0.0.1:6379> dump key1
"\x00\x05hello\t\x00\xb3\x80\x8e\xba1\xb2C\xbb"
## 关于过期时间。
- expire key seconds
  - 功能：设置key在几秒后过期。
  - 例：
127.0.0.1:6379> expire key1 2
(integer) 1            # 返回生效的key数量
127.0.0.1:6379> get key1
(nil)              # 过期之后key就会被删除
- pexpire key milliseconds
  - 功能：设置key在几毫秒后过期。
- expireat key timestamp
  - 功能：设置key在某个时间戳（单位为秒）之后过期。
- pexpireat key milliseconds-timestamp
  - 功能：设置key在某个时间戳（单位为毫秒）之后过期。
- ttl key
  - 功能：返回key还剩几秒过期（time to live）。
  - 例：
127.0.0.1:6379> ttl key1
(integer) -1      # 返回值为-1，说明不会过期
- pttl key
  - 功能：返回key还剩几毫秒过期（time to live）。
- persist key
  - 功能：取消key的过期时间。
## 
## 
## 
 
数据类型
## string：字符串。
- string是基于二进制存储的，可以存储任何类型的值，比如图片、序列化的对象。
  - 每个string的存储容量为512MB。
- 命令：
set key value          # 给一个key设置string类型的值
setnx key value          # 当该key不存在时才设置它的值
mset key value [key value ...]    # 给多个key设置string类型的值
msetnx key value [key value ...]  # 当指定的所有key都不存在时才设置它们的值

get key              # 返回一个key的string类型的值
strlen key1            # 返回一个key的string类型的长度
append key value          # 附加一个string类型的值到key的末尾，并返回该key的总长度
  - 例：
127.0.0.1:6379> set key1 hello
OK
127.0.0.1:6379> get key1
"hello"
127.0.0.1:6379> set key1 'hello world'    # 如果字符串常量中包含空格，就要用双引号包住
OK
- 如果key储存的值是数字类型（可以为负数），还可进行以下运算。
incr key          # 将key的值加一
incrby key increment    # 将key的值加上指定量，并返回key的当前值
decr key          # 将key的值减一
decrby key decrement    # 将key的值减去指定量
  - 例：
127.0.0.1:6379> set key1 1
OK
127.0.0.1:6379> incrby key1 2
(integer) 3
127.0.0.1:6379> get key1
"3"
- 创建一个key之后，它的数据类型就固定了，不能再使用其它类型的命令进行操作，否则会报错。
127.0.0.1:6379> set key1 hello
O，K
127.0.0.1:6379> lpush key1 a 
(error) WRONGTYPE Operation against a key holding the wrong kind of value
127.0.0.1:6379> lrange key1 0 10
(error) WRONGTYPE Operation against a key holding the wrong kind of value
## list：列表，包含多个字符串。
- 列表中的元素从右到左倒序排列，后插入的元素位于列表左端。
  - 每个list最多可以存储232 -1个元素。
  - 列表属于队列结构，增、删速度快。
- 命令：
lpush key value [value ...]    # 在名为key的列表左端插入元素
rpush key value [value ...]    # 在名为key的列表右端插入元素
lpop key              # 取出列表左端的一个元素
rpop key              # 取出列表右端的一个元素
blpop key [key ...] timeout    # 设置超时时间为timeout秒
brpop key [key ...] timeout
blpoplpush source destination timeout  # 取出一个列表左端的一个元素，插入另一个列表
brpoplpush source destination timeout

llen key              # 返回列表的长度
lindex key index          # 返回指定位置的元素（index从0开始编号，必须小于列表长度）
lset key index value        # 设置指定位置的元素的值
lrange key start stop        # 返回列表中的切片[start, stop)，stop的值可以大于列表长度
ltrim key start stop    # 修剪列表，只保存[start, stop)范围内的元素，其余的都删除
  - 例：
127.0.0.1:6379> lpush list1 a
(integer) 1            # 每次插入时会返回列表当前的长度
127.0.0.1:6379> lpush list1 b c
(integer) 3
127.0.0.1:6379> lrange list1 0 3
1) "c"
2) "b"
3) "a"
127.0.0.1:6379> blpop list1 1
1) "list1"
2) "c"
## set：集合，可以包含多个字符串，会自动去重。
- 每个set最多可以存储232 -1个元素。
- 命令：
sadd key member [member ...]  # 往名为key的集合中插入元素
scard key          # 返回集合的成员数量
smembers key          # 返回集合的所有元素
sismember key member      # 判断集合中是否包含某个元素
spop key [count]        # 随机取出集合中的count个元素

sinter key [key ...]          # 返回多个集合的交集
sinterstore destination key [key ...]  # 返回多个集合的交集并储存在destination集合中
sdiff key [key ...]          # 差集
sdiffstore destination key [key ...]
sunion key [key ...]          # 并集
sunionstore destination key [key ...]
  - 例：
127.0.0.1:6379> sadd set1 a
(integer) 1            # 返回集合当前的长度
127.0.0.1:6379> sadd set1 b c
(integer) 2
127.0.0.1:6379> sadd set1 a
(integer) 0            # 如果该元素已存在，则不执行插入，而是返回0
127.0.0.1:6379> smembers set1
1) "c"
2) "b"
3) "a"
## zset：有序集合，包含多个字符串，按score进行排序。
- 命令：
zadd key score member [score member ...]  # 插入score和元素（如果元素已存在则覆盖它的score）
zcard key                # 返回有序集合的成员数量
zcount key min max            # 返回score在[min, max)范围内的成员的数量
zrange key start stop [WITHSCORES]      # 返回score在[start, sto)范围内的所有元素
  - 每个元素有一个score，用于排序。score是double型数字，取值范围为，，，
  - 例：
127.0.0.1:6379> zadd zset1 1 a
(integer) 1
127.0.0.1:6379> zadd zset1 10 b 100 c
(integer) 2
127.0.0.1:6379> zrange zset1 1 100
1) "b"
2) "c"
## hash：哈希表。
- 每个hash是一个字典，里面最多可以存储232 -1对field和value。
  - hash表适合对象存储。
  - hash表基于哈希映射的关系进行存储，因此增、删、查的时间复杂度是O(1)。
- 命令：
hset key field value            # 给名为key的哈希表设置一个field的值
hsetnx key field value          # 当该field不存在时才设置它的值
hmset key field value [field value ...]  # 设置多个field的值
hget key field              # 返回某个field的值
hmget key field [field ...]        # 返回某些field的值

hlen key          # 返回field的数量
hkeys key        # 返回所有field的名字
hvals key        # 返回所有value的值
hgetall key        # 返回所有field-value
hexists key field      # 查看某个field是否存在
hdel key field [field ...]  # 删除哈希表中的field
  - 例：
127.0.0.1:6379> hmset hash1 field1 hello field2 world
OK
127.0.0.1:6379> hget hash1 field1
"hello"
## HyperLogLog：Redis 2.8.9新增的数据类型，用于计算基数。
## 
## 
## 
 
配置
## Redis的配置文件通常保存为/etc/redis/redis.conf文件。
- Redis服务器每次启动时，会从配置文件中加载各个配置项。
  - 如果Redis服务器不是用配置文件启动的，则会使用默认配置。
  - 可以在Redis终端用CONFIG命令进行配置，但这些配置在Redis重启之后就会失效。
  - 修改Redis的配置文件redis.conf可实现永久的配置，但需要重启Redis才会生效。
- 在终端配置：
127.0.0.1:6379> config get requirepass      # 查看密码
1) "requirepass"
2) ""                    # 默认没有密码
127.0.0.1:6379> config set requirepass 123456  # 设置密码
OK


config get *    # 显示所有配置项
config rewrite  # 将当前的配置写入到配置文件中
## 
## 配置文件示例。

bind 0.0.0.0
port 6379
daemonize yes       # 在后台运行（默认是在前台运行）
dir /etc/redis/     # 工作目录
logfile /var/log/redis.log
pidfile /var/run/redis.pid
dbfilename dump.rdb
requirepass ******


## 
## 
## 
## 
## 
## 
 
高级功能
## 当MySQL等数据库的读操作远多于写操作时，可以用Redis作为读缓存。
- 缓存机制：当用户查询某个Key时，先到Redis缓存中查询，如果查询不到再到数据库查询。这样可以降低数据库的压力。
  - 如果在数据库查询到了该key的值，则放入缓存，设置几分钟的过期时间。如果查询到的值为空，则不放入缓存。
- 缓存穿透：有恶意请求不断地查询一些不存在的key，绕过缓存，直接冲向数据库。
  - 解决方案：
即使查询到的值为空，也把该key放入缓存。
在查询缓存之前，先过滤掉明显不正常的查询请求。
- 缓存击穿：大量请求一直频繁地查询某个key，而该key在某一时刻缓存过期，导致这些请求直接冲向数据库。
  - 解决方案：
让热点key在缓存中永不过期。
- 缓存雪崩：在某一时刻，大量的key都缓存过期，导致它们的请求直接冲向数据库。
  - 解决方案：
给不同类型的key设置不同的缓存时长，给同一类型的key设置缓存时长时加上随机数，尽量分散缓存周期。
将这些key存储在多个Redis上，分散查询请求。
## 
## 
## 
## Cluster架构的Redis集群如下：
 
- 原理：
  - 将整个集群空间划分成16384个slot，将每个写入的key随机分配到一个slot中。
给key分配slot的算法是CRC16[key]%16384，即：先计算key的CRC16哈希值，再对16384取模，结果就是要分配的slot序号。
客户端可以访问集群中的任一node，如果读取的key不存在，则请求会被转到正确的node。
  - 集群中的每个node存储一部分slot。
如果一个node挂掉，则它存储的所有slot都会丢失。因此通常把每个node部署成主从架构，以保证高可用。
当集群中的node增加或减少时，就需要重新给每个节点分配slot，导致key的迁移。
- 优点。
  - 容易横向扩展。
  - 
- 缺点。
  - 操作多个Key时，它们可能存储在不同的Redis中，导致不能进行mset等批量操作、不能实现事务的原子性。
  - 只能使用0号数据库
  - 
## 
## 
 
测试
## 
## redis-benchmark：Redis官方提供的测试工具。
redis-benchmark
-h 127.0.0.1    # redis服务器的IP地址
-p 6379      # redis服务器的端口号
-a ******    # 密码
-c 50      # 模拟连接的client数
-n 100000    # 模拟发出的请求数
-d 3        # 每个包的大小（单位bytes）
-r        # 写入随机的value
-l        # 循环测试，不停止
-t  set,lpush  # 只执行某些测试用例
  - redis-benchmark -h 192.168.1.1 -p 6379 -c 20 -n 100000
## 
## 
## 

