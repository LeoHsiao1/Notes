
MongoDB
## MongoDB：一个文档型数据库，基于C++。
- 属于NoSQL数据库，但用法很像关系型数据库。
- 存储结构与MySQL很相像，只是把table改名为collection，把每行数据称为document。
  - 一个document是一个BSON格式的文本，可用包含任意个键值对形式的字段，结构灵活、容易扩展。
- MongoDB不支持事务，只是保证了增删改等操作的原子性。
## 安装。
- 使用docker运行：
docker pull mongo:4
docker run -d --name mongo -p 27017:27017 mongo:4
docker exec -it mongo bash
## 使用mongo命令可启动MongoDB客户端，连接MongoDB服务器。
- 登录：
mongo            # 启动客户端
127.0.0.1:27017/test    # 指定某个服务器上的某个数据库（默认连接到本机的服务器的test数据库）
username:password@127.0.0.1:27017/admin      # 指定用户名、密码
localhost,localhost:27018,localhost:27019/test    # 可以指定多个服务器
  - 使用密码认证时，必须是连接到admin数据库。
  - 可以先启动客户端，再进行密码认证：
mongo 127.0.0.1:27017/admin
db.auth('username', 'password')    # 用户名、密码要用单引号包住，表示为字符串
- MongoDB默认没启用密码认证，可按以下步骤设置密码：
1.  添加用户：
use admin
db.createUser(
  {
    user: "admin",
    pwd: "556655",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)
2.  查看已有的用户：
show users
3.  重启MongoDB服务器：
mongod --db <path> --auth
- MongoDB客户端的终端是JavaScript的shell，可以执行JS代码、定义变量、定义函数。
- 
## 
## 
## 配置文件/etc/mongod.conf
## 
## 
## 
## 
## 
 
数据库
## 关于数据库。
- MongoDB有三个默认数据库。
  - admin  ：保存root用户的信息。
  - local  ：该数据库永远不会被复制，可以保存一些仅限本机使用的集合。
  - config  ：保存分片的配置信息。
## 管理数据库。
show dbs        # 显示所有数据库的名字
use <db>        # 切换到指定数据库（可以切换到一个不存在的数据库，往其中插入数据之后就会创建它）

db          # 显示当前数据库的名字
db.stats()      # 显示当前数据库的状态
db.dropDatabase()  # 删除当前数据库
db.getMongo()    # 显示当前数据库存储在哪个主机上

- 备份数据。
mongodump -h 127.0.0.1:27017 -o /root/    # 导出指定主机上的数据，保存到指定目录（这会生成多个文件）
    -d test              # 指定数据库（默认会导出所有数据库）
mongorestore -h 127.0.0.1:27017 /root/    # 导入指定目录下的备份数据
    -d test              # 导入数据后将数据库命名为test
## 
## 
## 
 
集合
## 管理集合。
- 命令：
show collections    # 显示当前数据库的所有集合（也可用show tables）

db.c1.drop()      # 删除集合c1

- 创建集合：
db.createCollection("c1")
db.createCollection("c1", {autoIndexId:true, max:1000})
 db.createCollection("c1", {capped:true, size:10000})
  - autoIndexId  ：可选参数，表示是否在_id字段创建索引。默认为false。
  - max      ：可选参数，表示集合中最多可以包含的文档数量。max的单位为个。
当集合满了时（达到max或size），会从第一个位置重新开始插入，覆盖之前的数据。
  - capped、size  ：一对搭配使用的可选参数，表示创建固定大小的集合。size的单位为KB。
固定集合的插入、查询速度很快，还会记住每个document的插入顺序，但是不能删除其中的document，只能删除整个集合。
## 
## 
## 
 
文档
## 文档采用BSON格式：与JSON类似，以二进制形式存储一组键值对。
- BSON中的键值对是有序存储的，区分大小写。
- key必须是字符串类型，而且不能重复。
  - 以下划线 _ 开头的key是保留的，不应该使用。
- value可以是以下类型。
  - JSON的Number、Boolean、String（采用utf-8编码）、Array、Object（嵌套另一个文档）、null。
  - ObjectId  ：文档ID，占12 bytes。
用4 bytes存储创建该文档的时间戳，用3 bytes存储该主机的ID，用2 bytes存储进程的PID，最后3 bytes是随机数。
通过文档ID，可以在一个字段中引用另一个文档。
  - Timestamp：时间戳（主要被MongoDB内部使用），占8 bytes。前4 bytes是UTC时间戳（精确到秒），后4 bytes是在该秒中的操作序号。
  - Date    ：日期（精确到毫秒），可用Date()函数获取。
## 管理文档。
- 增
db.集合名.insertOne({"name":"leo"})        # 往集合中插入一个文档
db.集合名.insertMany([{"age": 10}, {"age": 11}])    # 以数组的形式插入多个文档
  - 如果该集合不存在，会自动创建。
  - 如果没有输入_id字段，会自动添加。如果输入了_id字段，会覆盖原来的值。
  - 默认将_id字段设置成主键，并建立索引。
- 查
# 输入参数：[query], [projection]
db.c1.find()              # 返回所有匹配的文档
db.c1.findOne()            # 返回第一个匹配的文档
  - query参数用于查询符合描述的文档，相当于MySQL的where子句。如果query参数为{}，则匹配所有文档。
  - 查询条件的示例：
{"name":"leo"}        # 字段name等于"leo"
{"student.id":1}        # 选中students字段的子字段
{"students.1.id":1}      # 选中 students字段（它是array类型）的第一个子字段
{"name":{$type:"string"}}    # 字段name为string类型
{"age":{$gt:0, $lt:10}}    # 字段age大于0、小于10
{"age":{$gte:0, $lte:10}}    # 字段age大于等于0、小于等于10
{"age":{"$in":(10,11,12)}    # 字段age使用指定的某个值
{"tags":{"$all":[1,2,3]}}    # 字段tags是array类型，且包含指定的所有值

  - projection参数用于对返回的字段进行筛选，用1、0表示是否返回某个字段（多个字段只能同时为1或0）。如下：
db.c1.find({"name":"leo"}, {"_id": 1, "name":1})
db.c1.find({"name":"leo"}, {"_id": 0})
  - 查询结果的可用方法：
db.c1.find().pretty()    # 显示时进行换行、缩进
.sort({"_id":1})      # 按某个字段进行排序（1表示升序，-1表示降序）
.limit(100)        # 最多返回10个匹配的文档
- 改
# 输入参数：<query>, <update>
db.c1.updateOne({"name":"leo"}, {$set:{"name":"Leo"}})      # 修改第一个匹配的文档
db.c1.updateMany({"name":"leo"}, {$set:{"name":"Leo"}})      # 修改所有匹配的文档
  - <update>表示要执行的操作。常见的操作类型如下：
$set    ：设置字段。
$unset  ：删除字段。
$rename  ：修改字段的名称。例如：$rename:{"a":"b"}
$inc    ：对数字类型的字段进行加减。
$push  ：向array类型的字段中添加一个值。例如：$push:{"tags":"a"}
$pushAll  ：向array类型的字段中添加多个值。例如：$push:{"tags":[1,2,3]}
$pull  ：从array类型的字段中删除一个值。例如：$pull:{"tags":"a"}
$pullAll  ：从array类型的字段中删除多个值。例如：$pull:{"tags":[1,2,3]}
$pop    ：例如：$pop:{"tags":1}，1、-1分别表示删除最后一个值、第一个值。
- 删
# 输入参数：<query>
db.c1.deleteOne({"name":"leo"})    # 删除第一个匹配的文档
db.c1.deleteMany({"name":"leo"})    # 删除所有匹配的文档
db.c1.deleteMany({})          # 删除所有文档
## 
## 
## 
 
高级功能
## 索引。
- 增
# 输入参数：<keys>, [options]
db.c1.createIndex({"name":1})      # 对一个字段创建索引（1表示升序，-1表示降序）
db.c1.createIndex({"name":1, "description":-1})  # 对多个字段创建索引
  - options是可选参数，常见的设置项如下：
name      ：该索引的名称。未指定的话会自动命名。
unique    ：是否限制该字段的取值唯一。默认为false。
background  ：是否在后台创建索引。默认为false，会阻塞前台进程。
expireAfterSeconds：设置过期时间，过期之后一段时间内会自动删除该文档。（只能作用于Date类型的字段）
v      ：索引的版本号。
- 查
db.c1.getIndexes()      # 显示所有索引
db.c1.totalIndexSize()    # 显示全部索引的大小
- 删
db.c1.dropIndex("name_1")    # 删除指定索引
db.c1.dropIndexes()      # 删除所有索引
## MongoDB常见的部署架构。
- 单一服务器
- 副本集群：采用主从结构，实现数据备份、读写分离。
- 分片集群：将文档分散存储到多个服务器上，从而增加容量。
## 
## 
## 
## 
## 
## 
 
测试
## 可以用mongostat、mongostop查看MongoDB服务器的状态。
## 
## 

