# ♢ Redis

## 连接到主从+哨兵集群

```python
>>> from redis.sentinel import Sentinel

# 连接到哨兵
>>> sentinels = [('10.0.0.1', 26379), ('10.0.0.2', 26379), ('10.0.0.3', 26379)]
>>> sentinel = Sentinel(sentinels, socket_timeout=1)

# 连接到master
>>> master = sentinel.master_for('master1', socket_timeout=1, password='******', db=0)
>>> master
Redis<SentinelConnectionPool<service=master1(master)>
>>> master.set('key1', 'Hello')
True

# 连接到slave
>>> slave = sentinel.slave_for('master1', socket_timeout=1, password='******', db=0)
>>> slave.get('key1')
b'Hello'
>>> slave.info()
{'redis_version': '5.0.6', 'redis_git_sha1': 0, 'redis_git_dirty': 0, ...}

# 发现master和slave
>>> sentinel.discover_master('master1')
('10.0.0.3', 6379)
>>> sentinel.discover_slaves('master1')
[('10.244.79.33', 6379), ('10.0.0.1', 6379), ('10.0.0.2', 6379)]
```

- sentinel.master_for()和sentinel.slave_for()
  - 返回的是一个连接池，在执行操作时会自动选择有效的Redis实例建立连接。
  - 此时并没有建立连接，等到执行master.set()等实际操作时才会开始建立与Redis实例的连接，才能判断是否连接成功。

## 连接状态

- 客户端与Redis实例建立连接之后，会保持并复用该连接。

- 当客户端执行操作时，如果master突然挂掉了，则连接会断开，则会抛出以下异常，表示与服务器的连接已断开：

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
