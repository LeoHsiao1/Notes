# ♢ redis

：Python的第三方库，提供了Redis客户端的功能。
- 通过ORM API进行操作。
- 安装：pip install redis

## 用法示例

创建Redis客户端：
```python
>>> import redis
>>> client = redis.Redis(host='127.0.0.1', port=6379, db=0, password='', decode_responses=True)
>>> client.ping()
True
```
- Redis服务器的响应消息默认是bytes类型，设置 decode_responses=True 会将它转换成str类型。
- 如果要创建多个Redis客户端，可以让它们共用一个连接池，避免重复建立连接的开销。如下：
    ```python
    >>> pool = redis.ConnectionPool(host='127.0.0.1', port=6379, db=0, password='', decode_responses=True)
    >>> client = redis.Redis(connection_pool=pool)
    ```

client提供了与Redis大部分命令同名的方法，例如：

- string类型的方法
  - `def set(name, value, ex=None, px=None, nx=False, xx=False)`
    - name表示key的名字。
    - ex（单位秒）、px（单位毫秒）表示过期时间。
    - 如果nx=True，则只有当该name不存在时，才执行该操作。
    - 如果xx=True，则只有当该name存在时，才执行该操作。
  - `def mset(mapping)`
  - `def get(name)`
  - `def mget(*names)`
  
- hash类型的方法
  - `def hset(name, key, value)`
  - `def hget(name, key)`
  - `def hgetall(name) -> dict`

，，，待续



## 连接到主从+哨兵集群

连接到哨兵：
```python
>>> from redis.sentinel import Sentinel
>>> sentinels = [('10.0.0.1', 26379), ('10.0.0.2', 26379), ('10.0.0.3', 26379)]
>>> sentinel = Sentinel(sentinels, socket_timeout=1)
```

连接到master：
```python
>>> master = sentinel.master_for('master1', socket_timeout=1, password='******', db=0)
>>> master
Redis<SentinelConnectionPool<service=master1(master)>
>>> master.set('key1', 'Hello')
True
```
- sentinel.master_for() 和 sentinel.slave_for() 返回的是一个连接池，在执行操作时会自动选择有效的Redis实例建立连接。
  - 如果连接断开，则尝试与有效的Redis建立连接。
  - 此时并没有建立连接，等到执行master.set()等实际操作时才会开始建立与Redis实例的连接，才能判断是否连接成功。

连接到slave：
```python
>>> slave = sentinel.slave_for('master1', socket_timeout=1, password='******', db=0)
>>> slave.get('key1')
b'Hello'
>>> slave.info()
{'redis_version': '5.0.6', 'redis_git_sha1': 0, 'redis_git_dirty': 0, ...}
```

发现master和slave：
```python
>>> sentinel.discover_master('master1')
('10.0.0.3', 6379)
>>> sentinel.discover_slaves('master1')
[('10.244.79.33', 6379), ('10.0.0.1', 6379), ('10.0.0.2', 6379)]
```

客户端与Redis实例建立连接之后，会保持并复用该连接。
- 当客户端执行操作时，如果master故障了，则执行操作时会抛出以下异常，表示与服务器的连接已断开：

  ```python
  >>> master.set('key1', 'Hello')
  redis.exceptions.ConnectionError: Connection closed by server
  ConnectionRefusedError: Connection refused
  ```

- 如果客户端继续尝试执行操作，则会抛出以下异常：

  ```python
  >>> master.set('key1', 'Hello')
  redis.sentinel.MasterNotFoundError: No master found for 'master1'
  ```

- 等哨兵选出新master之后，客户端才能成功执行操作

  ```python
  >>> master.set('key1', 'Hello')
  True
  ```
