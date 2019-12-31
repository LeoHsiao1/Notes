# ♢ pymongo

：Python的第三方库，用于连接到MongoDB服务器，通过ORM API进行操作。
- 安装：pip install pymongo

## 用法示例

创建MongoDB客户端：
```python
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
    比如选择MongoDB中的数据库、数据库中的集合、集合中的文档、文档中的键值对。

数据库的操作方法与MongoDB shell中的差不多，如下：
```python
db.c1.insert_one({"name": "leo", "age": 10})
db.c1.insert_many([{"age": 10}, {"age": 11}])

db.c1.find()
db.c1.find().limit(100)

id = db.c1.find_one({"name":"leo"})["_id"]
db.c1.deleteOne(id)
```
