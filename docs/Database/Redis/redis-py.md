# ♢ redis-py

：Python 的第三方库，提供了 Redis 客户端的功能。
- [GitHub](https://github.com/andymccurdy/redis-py)
- 安装：`pip install redis`

## 用法示例

### 连接到单节点Redis

- 创建 Redis 客户端：
  ```py
  >>> import redis
  >>> client = redis.Redis(host='127.0.0.1', port=6379, password='******', db=0, decode_responses=True)
  >>> client.ping()
  True
  ```
  - Redis 服务器的响应消息默认是 bytes 类型，设置 decode_responses=True 会将它转换成 str 类型。
  - 如果要创建多个 Redis 客户端，则可让它们共用一个连接池，避免重复建立连接的开销。如下：
    ```py
    >>> pool = redis.ConnectionPool(host='127.0.0.1', port=6379, password='******', db=0, decode_responses=True)
    >>> client = redis.Redis(connection_pool=pool)
    ```

### 连接到主从+哨兵集群

- 连接到哨兵：
  ```py
  >>> from redis.sentinel import Sentinel
  >>> sentinels = [('10.0.0.1', 26379), ('10.0.0.2', 26379), ('10.0.0.3', 26379)]
  >>> sentinel = Sentinel(sentinels, sentinel_kwargs={'password': '******'})
  ```

- 通过哨兵连接到 master ：
  ```py
  >>> master = sentinel.master_for('master1', password='******', db=0, socket_timeout=1)
  >>> master
  Redis<SentinelConnectionPool<service=master1(master)>
  >>> master.set('key1', 'Hello')
  True
  ```
  - 调用 sentinel.master_for()、sentinel.slave_for() 会返回 ConnectionPool 。
    - 此时并没有建立连接，即使密码错误也不会报错。等到执行 master.set() 等操作时才会从 ConnectionPool 中自动选择一个有效的 Redis 服务器，建立连接。

- 通过哨兵连接到 slave ：
  ```py
  >>> slave = sentinel.slave_for('master1', password='******', db=0, socket_timeout=1)
  >>> slave.get('key1')
  b'Hello'
  >>> slave.info()
  {'redis_version': '5.0.6', 'redis_git_sha1': 0, 'redis_git_dirty': 0, ...}
  ```

- 通过哨兵发现 master 和 slave 的地址：
  ```py
  >>> sentinel.discover_master('master1')
  ('10.0.0.3', 6379)
  >>> sentinel.discover_slaves('master1')
  [('10.0.0.1', 6379), ('10.0.0.2', 6379)]
  ```

- 客户端与 Redis 服务器建立连接之后，会保持并复用该连接。
  - 当客户端执行操作时，如果 master 故障了，则执行操作时会抛出以下异常，表示与服务器的连接已断开：
    ```py
    >>> master.set('key1', 'Hello')
    redis.exceptions.ConnectionError: Connection closed by server
    ConnectionRefusedError: Connection refused
    ```
    然后客户端会尝试连接到 ConnectionPool 中其它有效的 Redis 服务器。
  - 如果客户端继续尝试执行操作，则会抛出以下异常：
    ```py
    >>> master.set('key1', 'Hello')
    redis.sentinel.MasterNotFoundError: No master found for 'master1'
    ```
  - 等哨兵选出新 master 之后，客户端才能成功执行操作：
    ```py
    >>> master.set('key1', 'Hello')
    True
    ```

### 读写数据

- client 提供了与 Redis 大部分命令同名的方法，例如：
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

- 例：拷贝一个 Redis 的所有 key 到另一个 Redis
  ```py
  client_old = redis.Redis(...)
  client_new = redis.Redis(...)
  # 遍历名称匹配 match 的 key ，每次获取 count 个
  for key in client_old.scan_iter(match='*', count=1000):
      key_type = client_old.type(key)
      # 根据 key 的数据类型，用不同的方法读取 key 的值
      if key_type == 'string':
          print(key, client_old.get(key))
          client_new.set(key, client_old.get(key))
      elif key_type == 'list':
          client_new.lpush(key, *client_old.lrange(key, start=0, end=-1))
      elif key_type == 'set':
          client_new.sadd(key, *client_old.smembers(key))
      elif key_type == 'hash':
          client_new.hmset(key, client_old.hgetall(key))
      else:
          raise TypeError(key_type, key)
      # 如果原 key 的 ttl 不为 -1 ，说明存在 ttl ，需要设置新 key 的 ttl
      key_ttl = client_old.ttl(key)
      if key_ttl != -1 :
          client_new.expire(key, key_ttl)
  ```
