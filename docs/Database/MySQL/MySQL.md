# MySQL

：一个关系型数据库。
- [官方文档](https://dev.mysql.com/doc/refman/5.7/en/)
- 采用 C++ 开发。
- 采用 C/S 架构、TCP 通信。

## 版本

MySQL 存在多个分支：
- MySQL
  - 于 1995 年由 MySQL 公司发布。2008 年 MySQL 公司被 Sun 公司收购，2010 年 Sun 公司被 Oracle 公司收购。
  - v5.5 ：于 2010 年发布。
    - 将默认的数据库引擎从 MyISAM 改为 InnoDB 。
    - 支持半同步复制。
    - 增加字符集 utf16、utf32、utf8mb4 。
  - v5.6 ：于 2013 年发布。
    - 支持全文索引。
  - v5.7 ：于 2015 年发布。
    - 增加 JSON 数据类型。
  - v8.0 ：于 2018 年发布。
- MariaDB
  - 2010 年，因为抗议 Oracle 公司的收购，MySQL 的创始人之一 Monty Widenius 在 MySQL 5.5 的基础上分叉出 MariaDB ，以开源的方式提供与 MySQL 兼容的功能。
- Percona
  - 与 MySQL 完全兼容，还提供了 XtraDB 引擎。
- Drizzle
  - 与 MySQL 的差异较大。
