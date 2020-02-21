# SQLite

：一个很轻量级的关系型数据库，基于 C 语言开发。
- 不需要安装或配置就可以直接使用，使用简便，占用的计算机资源少。
- 支持 SQL 操作，支持简单的 CRUD 功能，还支持 ACID 事务。
- 可以存储在文件中，也可以存储在内存中。
- 不是采用 C/S 架构，而是让应用直接调用 SQLite 引擎的函数。
- 没有访问权限控制。只要用户能打开存储 SQLite 数据库的文件，就能读写数据库。
- 适用于嵌入式系统等简单的数据存储场景，是世界上使用量最大的一种数据库，甚至可能是使用量最大的软件库。
- [官网](https://www.sqlite.org/index.html)

版本：
- 2000 年，SQLite 1.0 版发布。
- 2001 年，SQLite 2.0 版发布。
- 2004 年，SQLite 3.0 版发布，维护至今。

## 管理单元

一个 SQLite 实例中只有一个数据库，其中可以创建多个数据表，每个数据表中可以存储多行数据。

例：创建数据表
```sql
CREATE TABLE "table1" (
    "id" INTEGER PRIMARY KEY,
    "name" text(100) NOT NULL
);

INSERT INTO "table1" VALUES(NULL, "one");
```
- 在 SQLite 中，声明为 INTEGER PRIMARY KEY 的字段会自动递增。如上，插入一行数据时，如果 id 字段为 NULL ，则 SQLite 会自动将该字段赋值为 max(id)+1 。

## 数据类型

SQLite 采用动态类型，插入数据时不会检查其数据类型，任何类型的数据一般都可以插入任何字段中。

常用的数据类型：
- NULL ：空值
- INTEGER ：带符号的整数
- REAL ：浮点数
- TEXT ：字符串，采用 utf-8 编码。
- BLOB ：直接存储插入的数据，不做改变。
