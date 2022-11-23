# ♢ PyMySQL

：Python 的第三方库，提供了 MySQL 客户端的功能，直接执行 SQL 命令。
- [GitHub](https://github.com/PyMySQL/PyMySQL)
- 安装：`pip install PyMySQL`

## 用法

- 连接到 MySQL 服务器：
  ```py
  >>> import pymysql
  >>> client = pymysql.Connect(host='localhost', port=3306, user='root', passwd='******', db='db1', charset='utf8mb4')
  ```
  - 默认的 connect_timeout 是 10 秒。

- 创建游标：
  ```py
  >>> cursor = client.cursor()
  ```
  - 游标用于执行 SQL 命令。

- 执行一条 SQL 命令：
  ```py
  >>> cursor.execute('SHOW TABLES;')     # 执行一条 SQL 命令
  5                                      # 返回查询结果的行数
  >>> cursor.fetchone()                  # 提取一行（这会使游标下移一行）
  ('auth_group',)
  >>> cursor.fetchmany(3)                # 提取多行
  (('auth_permission',), ('auth_user',), ('auth_user_groups',))
  >>> cursor.fetchall()                  # 提取所有行
  >>> cursor.scroll(-1, mode='relative') # 将游标从当前位置上移一行
  >>> cursor.scroll(2, mode='absolute')  # 将游标从起始位置下移两行
  ```

- 其它操作：
  ```py
  client.executemany(...)     # 执行多条 SQL 命令

  client.commit()             # 提交修改
  cursor.close()              # 关闭游标
  client.close()              # 关闭连接
  ```

## 相关概念

### ♢ SQLAlchemy

：Python 的第三方库，是一个实现 SQL 操作的 ORM 框架。
- [GitHub](https://github.com/sqlalchemy/sqlalchemy)
- 安装：`pip install SQLAlchemy`
- 对象关系映射（Object Relational Mapping ，ORM）：将数据库的结构化数据用对象表示，将数据表映射到类。
