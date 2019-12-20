# ♢ PyMySQL

：Python的标准库，用于连接到MySQL服务器，通过直接执行SQL语句的方式进行操作。

- def Connect(host, user, passwd, db: str, port: int, unix_socket, charset: str,...)
  - 功能：创建MySQL客户端。
  - 默认的connect_timeout是10秒。
  - 例：
>>> client = pymysql.Connect("localhost", "root", "******", "db1", 3306, charset="utf8mb4")
>>> cursor = client.cursor()      # 创建一个游标来执行SQL命令

- 查：
>>> cursor.execute("show tables;")    # 执行一条SQL命令
5              # 返回查询结果的行数
>>> cursor.fetchone()      # 提取一行（这会使游标下移一行）
('auth_group',)
>>> cursor.fetchmany(3)    # 提取多行
(('auth_permission',), ('auth_user',), ('auth_user_groups',))
>>> cursor.fetchall()      # 提取所有行
>>> cursor.scroll(-1, mode='relative')    # 将游标从当前位置上移一行
>>> cursor.scroll(2, mode='absolute')    # 将游标从起始位置下移两行


client.executemany(...)

client.commit()     # 提交修改
cursor.close()  # 关闭游标
client.close()      # 关闭连接
