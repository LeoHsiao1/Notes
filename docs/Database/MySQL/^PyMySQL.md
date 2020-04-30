# ♢ PyMySQL

：Python 的标准库，提供了 MySQL 客户端的功能。
- 通过直接执行 SQL 命令的方式进行操作。

## 用法示例

连接到 MySQL 服务器：
```python
>>> import pymysql
>>> client = pymysql.Connect(host='localhost', port=3306, user='root', passwd='******', db='db1', charset='utf8mb4')
```
- 默认的 connect_timeout 是 10 秒。

创建游标：
```python
>>> cursor = client.cursor()
```
- 游标用于执行 SQL 命令。

执行一条 SQL 命令：
```python
>>> cursor.execute('show tables;')     # 执行一条 SQL 命令
5                                      # 返回查询结果的行数
>>> cursor.fetchone()                  # 提取一行（这会使游标下移一行）
('auth_group',)
>>> cursor.fetchmany(3)                # 提取多行
(('auth_permission',), ('auth_user',), ('auth_user_groups',))
>>> cursor.fetchall()                  # 提取所有行
>>> cursor.scroll(-1, mode='relative') # 将游标从当前位置上移一行
>>> cursor.scroll(2, mode='absolute')  # 将游标从起始位置下移两行
```

其它操作：
```python
client.executemany(...)     # 执行多条 SQL 命令

client.commit()             # 提交修改
cursor.close()              # 关闭游标
client.close()              # 关闭连接
```
