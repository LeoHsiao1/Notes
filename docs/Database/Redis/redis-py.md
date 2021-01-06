# ♢ redis-py

：Python 的第三方库，提供了 Redis 客户端的功能，通过 ORM API 进行操作。
- [GitHub 页面](https://github.com/andymccurdy/redis-py)
- 安装：`pip install redis`

## 用法示例

创建 Redis 客户端：
```py
>>> import redis
>>> client = redis.Redis(host='127.0.0.1', port=6379, db=0, password='', decode_responses=True)
>>> client.ping()
True
```
- Redis 服务器的响应消息默认是 bytes 类型，设置 decode_responses=True 会将它转换成 str 类型。
- 如果要创建多个 Redis 客户端，可以让它们共用一个连接池，避免重复建立连接的开销。如下：
    ```py
    >>> pool = redis.ConnectionPool(host='127.0.0.1', port=6379, db=0, password='', decode_responses=True)
    >>> client = redis.Redis(connection_pool=pool)
    ```

client 提供了与 Redis 大部分命令同名的方法，例如：

- string 类型的方法
  - `def set(name, value, ex=None, px=None, nx=False, xx=False)`
    - name 表示 key 的名字。
    - ex（单位秒）、px（单位毫秒）表示过期时间。
    - 如果 nx=True ，则只有当该 name 不存在时，才执行该操作。
    - 如果 xx=True ，则只有当该 name 存在时，才执行该操作。
  - `def mset(mapping)`
  - `def get(name)`
  - `def mget(*names)`
  
- hash 类型的方法
  - `def hset(name, key, value)`
  - `def hget(name, key)`
  - `def hgetall(name) -> dict`

> TODO:待补充



## 连接到主从+哨兵集群

连接到哨兵：
```py
>>> from redis.sentinel import Sentinel
>>> sentinels = [('10.0.0.1', 26379), ('10.0.0.2', 26379), ('10.0.0.3', 26379)]
>>> sentinel = Sentinel(sentinels, sentinel_kwargs={'password': '******'})
```

连接到 master ：
```py
>>> master = sentinel.master_for('master1', socket_timeout=1, password='******', db=0)
>>> master
Redis<SentinelConnectionPool<service=master1(master)>
>>> master.set('key1', 'Hello')
True
```
- sentinel.master_for() 和 sentinel.slave_for() 返回的是一个连接池，在执行操作时会自动选择有效的 Redis 实例建立连接。
  - 如果连接断开，则尝试与有效的 Redis 建立连接。
  - 此时并没有建立连接，等到执行 master.set()等实际操作时才会开始建立与 Redis 实例的连接，才能判断是否连接成功。

连接到 slave ：
```py
>>> slave = sentinel.slave_for('master1', socket_timeout=1, password='******', db=0)
>>> slave.get('key1')
b'Hello'
>>> slave.info()
{'redis_version': '5.0.6', 'redis_git_sha1': 0, 'redis_git_dirty': 0, ...}
```

发现 master 和 slave ：
```py
>>> sentinel.discover_master('master1')
('10.0.0.3', 6379)
>>> sentinel.discover_slaves('master1')
[('10.0.0.1', 6379), ('10.0.0.2', 6379)]
```

客户端与 Redis 实例建立连接之后，会保持并复用该连接。
- 当客户端执行操作时，如果 master 故障了，则执行操作时会抛出以下异常，表示与服务器的连接已断开：

  ```py
  >>> master.set('key1', 'Hello')
  redis.exceptions.ConnectionError: Connection closed by server
  ConnectionRefusedError: Connection refused
  ```

- 如果客户端继续尝试执行操作，则会抛出以下异常：

  ```py
  >>> master.set('key1', 'Hello')
  redis.sentinel.MasterNotFoundError: No master found for 'master1'
  ```

- 等哨兵选出新 master 之后，客户端才能成功执行操作

  ```py
  >>> master.set('key1', 'Hello')
  True
  ```
