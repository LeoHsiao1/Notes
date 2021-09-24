# ♢ pymongo

：Python 的第三方库，提供了 MongoDB 客户端的功能。
- [官方文档](https://pymongo.readthedocs.io/en/stable/)
- 安装：`pip install pymongo`

## 用法示例

创建 MongoDB 客户端：
```py
>>> import pymongo
>>> client = pymongo.MongoClient('127.0.0.1', 27017)
>>> db = client.test    # 选择数据库
```
- 此时只是创建客户端，等执行实际操作时才会连接到数据库。
- 大部分成员关系都可以通过两种方式访问，如下：
    ```
    client.test
    client["test"]
    ```
    比如选择 MongoDB 中的数据库、数据库中的集合、集合中的文档、文档中的键值对。

数据库的操作方法与 MongoDB shell 中的差不多，如下：
```py
db.c1.insert_one({"name": "leo", "age": 10})
db.c1.insert_many([{"age": 10}, {"age": 11}])

db.c1.find()
db.c1.find().limit(100)

id = db.c1.find_one({"name":"leo"})["_id"]
db.c1.deleteOne(id)
```
