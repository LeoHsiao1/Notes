# ZooKeeper

：一个分布式键值对数据库，简称为 zk 。
- [官方文档](https://zookeeper.apache.org/doc/current/index.html)
- 于 2008 年发布，采用 Java 开发。
  - 原本是 Apache Hadoop 的子项目，后来成为了一个独立的 Apache 顶级项目。
  - 取名为 ZooKeeper 是因为 Yahoo 公司的 Pig 等项目都是以动物命名，ZooKeeper 可以协调它们。
- 擅长担任分布式系统的底层数据库，起协调作用：
  - 同步分布式系统中各节点的数据，实现一致性。
  - 提供了配置中心、服务注册功能。
  - 提供了 watch 机制，可用于实现分布式锁。
