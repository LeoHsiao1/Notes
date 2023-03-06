# Redis

：远程字典服务器（Remote Dictionary Server），一个键值对型数据库，存储在内存中。
- [官方文档](https://redis.io/documentation)
- 发音为 `/ˈrɪdɪs/` 。
- 采用 ANSI C 开发。
- 采用 C/S 架构、TCP 通信。
- 将数据保存在内存中，因此读写速度很快，常用作缓存。也可以将数据持久化保存到磁盘中，用作 NoSQL 数据库。
- 很轻量级，一个空的 Redis 进程几乎不占系统资源。
- 同类产品：
  - Memcached ：一个内存数据库。
    - 不支持持久化存储。
    - 除了缓存文本数据，也可以缓存二进制文件。
