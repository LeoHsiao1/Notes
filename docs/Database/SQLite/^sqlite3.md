# ♢ sqlite3

：Python 的标准库，用于连接到 SQLite 数据库，通过直接执行 SQL 命令的方式进行操作。

## 用法示例

连接到数据库：
```python
>>> import sqlite3
>>> 
>>> db = sqlite3.connect("db.sqlite3")      # 连接到一个 SQLite 数据库，如果该文件不存在则自动创建
>>> # db = sqlite3.connect(":memory:")      # 在内存中打开一个数据库
>>> 
>>> db.execute("CREATE table table1(id INTEGER PRIMARY KEY, name TEXT)") # 执行一条 SQL 命令
<sqlite3.Cursor object at 0x000001715CB4BCE0>
```

增：
```python
>>> db.execute("INSERT INTO table1 (id,name) VALUES (1,'one')")          # 直接输入一条 SQL 命令去执行
<sqlite3.Cursor object at 0x000001715CBDB9D0>
>>> db.execute("INSERT INTO table1 (id,name) VALUES (?, ?)", (2, 'two')) # 输入 SQL 模板和参数
<sqlite3.Cursor object at 0x000001715CB4BCE0>
>>> 
>>> datas = [(i, str(id(i))) for i in range(3, 10)]
>>> db.executemany("INSERT INTO table1 (id, name) VALUES (?, ?)", datas) # 插入多行数据
<sqlite3.Cursor object at 0x000001715CBDB9D0>
```
- SQLite 的 text 类型字段采用 utf-8 编码，因此可以直接传入 str 或 bytes 类型的参数。

查：
```python
>>> ret = db.execute("select * FROM table1")    # 查询数据，返回一个可迭代对象
>>> ret
<sqlite3.Cursor object at 0x000001715CB4BCE0>
>>> for line in ret:        # 每次迭代返回一行数据（tuple 类型）
...     print(line)
...
(1, 'one')
(2, 'two')
(3, '140708040237776')
...etc...
>>> 
>>> ret = db.execute("select * FROM table1 WHERE id=? AND name=?", (1, "one"))   # 输入 SQL 模板和参数
>>> ret
<sqlite3.Cursor object at 0x000001715CBDB9D0>
>>> list(ret)
[(1, 'one')]
```

改：
```python
db.execute("UPDATE table1 set name=? where id=?", ("one", 1))
```

删：
```python
db.execute("DELETE FROM table1 WHERE id=1")
```

关闭数据库：
```python
db.commit()    # 提交对数据库的修改
# db.rollback()  # 将数据库回滚到上一次 commit()时的状态

db.close()    # 关闭数据库
```
