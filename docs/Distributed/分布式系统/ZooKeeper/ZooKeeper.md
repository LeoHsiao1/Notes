# ZooKeeper

：一个用于协调分布式系统的数据库，简称为 zk 。采用 Java 开发。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 原本是 Apache Hadoop 的子项目，现在已成为一个独立的 Apache 顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 常见用途：
  - 同步分布式系统中各节点的数据，实现一致性。
  - 作为注册中心，记录分布式系统中各个服务的信息。
  - 实现分布式锁。
