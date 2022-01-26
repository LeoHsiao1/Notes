# MySQL

：一个关系型数据库。
- [官方文档](https://dev.mysql.com/doc/refman/5.7/en/)
- 采用 C++ 开发。
- 采用 C/S 架构、TCP 通信。

## 版本

MySQL 存在多个分支：
- MySQL
  - v1.0
    - 1995 年由 MySQL 公司发布。
    - 2008 年 MySQL 公司被 Sun 公司收购，2010 年 Sun 公司被 Oracle 公司收购。
  - v5.5
    - 2010 年发布。
    - 将默认的数据库引擎从 MyISAM 改为 InnoDB 。
    - 支持半同步复制。
    - 增加字符集 utf16、utf32、utf8mb4 。
  - v5.6
    - 2013 年发布。
    - 支持全文索引。
    - 增加 Online DDL 功能。
  - v5.7
    - 2015 年发布。
    - 增加 JSON 数据类型。
  - v8.0
    - 2018 年发布，跳过了 v6、v7 版本。
    - 默认字符集从 latin1 改为 utf8mb4 。utf8mb4 的默认字符序从 utf8mb4_general_ci 改为更新版本的 utf8mb4_0900_ai_ci 。
    - 实现 DDL 操作的原子性。
    - 密码的存储方式从 mysql_native_password 改为 caching_sha2_password 。老版本的客户端可能不兼容，导致不能登录。可以修改存储方式：
      ```sh
      ALTER USER test@'%' IDENTIFIED WITH mysql_native_password BY '******';
      ```

- MariaDB
  - 2010 年，因为抗议 Oracle 公司的收购，MySQL 的创始人之一 Monty Widenius 从 MySQL v5.5 分叉出 MariaDB ，作为开源项目。
- Percona
  - 与 MySQL 完全兼容，还提供了 XtraDB 引擎。
- Drizzle
  - 与 MySQL 的差异较大。
