# ClickHouse

：一个 NewSQL 数据库，采用 MPP 架构、列式存储，擅长 OLAP 。
- [官方文档](https://clickhouse.com/docs/)
- 2016 年，由俄罗斯的 Yandex 公司开源。
- 支持少量 SQL 语法，不支持事务操作。

## 用法

- 创建数据库的语法：
  ```sql
  CREATE DATABASE [IF NOT EXISTS] <db> [ON CLUSTER <cluster>] [ENGINE = Atomic]
  ```

- ClickHouse 提供了多种数据表引擎：
  - Atomic ：默认采用。
  - MySQL ：用于连接到 MySQL 服务器，可以将 ClickHouse 的 SQL 语句发送给 MySQL 。如下：
    ```sql
    CREATE DATABASE mysql_db ENGINE = MySQL('host:port', 'db', 'username', 'password')
    SHOW TABLES FROM mysql_db
    SELECT * FROM mysql_db.table1
    ```

- 例：创建表
  ```sql
  CREATE TABLE table1
  (
      name String,
      number UInt32,
      comments UInt32 TTL updated_at + INTERVAL 24 HOUR,  -- 声明字段及其 TTL
      created_at DateTime,
      updated_at DateTime
  )
  ENGINE = MergeTree                    -- 采用的数据表引擎
  ORDER BY (created_at, updated_at)     -- 根据哪些字段进行排序
  PARTITION BY toYYYYMM(created_at)     -- 根据哪些字段进行分区
  PRIMARY KEY name                      -- 主键。未声明则采用排序的字段
  TTL updated_at + INTERVAL 10 DAY      -- 表的 TTL
  SETTINGS                              -- 一些配置参数
      max_insert_threads: 0
      max_partitions_to_read: -1
  ;
  ```
  - 支持设置字段的 TTL 过期时间。
    - 如果某行数据的某个字段超过 TTL ，则将取值重置为该字段的默认值。
    - 如果所有行数据的该字段都超过 TTL ，则删除该列字段。
  - 支持设置表的 TTL 过期时间。
    - 如果某行数据超过 TTL ，则删除该行数据。

- ClickHouse 提供了多种数据表引擎：
  - MergeTree
    - ：存储结构类似于 LSM Tree 。适合低频率（大概每秒一次）写入大量数据，在后台异步合并、压缩，比逐行写入数据更快。
  - Log
    - ：适合快速写入大量小表并同时读取，每个表在 100 万行以内。
    - 写入的数据被顺序 append 到磁盘，不支持 update、delete 。
  - Distributed ：分布式表。
  - 集成表（Integrations）：用于连接其它数据源。如下：
    - MongoDB
    - MySQL
    - Kafka
    - RabbitMQ
    - S3

- 支持在集群中创建分布式表，相当于对多个本地表实例的反向代理，可进行分布式并发查询。如下：
  1. 在每个 server 实例上创建同一个本地表：
      ```sql
      CREATE TABLE local_table1 (...) ENGINE = MergeTree() ...
      ```
  2. 创建一个分布式表：
      ```sql
      CREATE TABLE distributed_table1 AS table1.local
          ENGINE = Distributed(cluster1,      -- 集群名
                               default,       -- 数据库名
                               local_table1,  -- 本地表名
                               rand()         -- 分发数据的策略
                               );
      ```
  3. 写入数据到分布式表，这会自动分发到各个本地表实例：
      ```sql
      INSERT INTO distributed_table1 SELECT * FROM table1;
      ```
