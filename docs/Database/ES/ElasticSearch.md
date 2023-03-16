# ElasticSearch

：简称为 ES ，一个搜索服务器，也可用作存储 JSON 格式数据的 NoSQL 数据库。
- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.6/index.html)
- 采用 Java 开发，基于 Lucene 实现。
- 采用 C/S 架构、TCP 通信。

## 原理

- ES 允许用户写入数据，并进行搜索。
  - 每条数据称为一个文档（document），采用 JSON 格式，可以包含多个字段（field）。
  - 容纳文档的集合称为索引（index）。

- 使用 ES 的一般流程：
  1. 在 ES 中创建索引，定义文档的数据结构。
  2. 在索引中写入一些文档。
  3. 在索引中搜索一些文档。

- ES 的每个索引由一个或多个分片（shard）组成。
  - 索引下新增的文档会平均分配到各个分片中，而各个分片可以存储在不同 ES 节点上。
    - 客户端发出查询请求时，不必知道文档存储在哪个分片、分片存储在哪个节，因为 ES 会自动完成查询。
  - 在 ES 索引中进行查询时，是先在它的每个分片中进行查询，然后合并它们的查询结果。
    - ES 会给每个分片创建一个线程进行查询，因此划分多个分片可以并行查询，减少查询耗时。但分片数过多也可能增加查询耗时，比如要打开很多文件。
    - 对于单个分片，体积过大则会增加查询耗时、故障后恢复耗时，体积过小则会增加冗余量。
      - 建议单个分片的体积控制在 10G~50G 。
      - 如果要存储海量数据，比如日志，建议每天创建一个新索引用于存储数据，比如 nginx_log-2020.01.01 。

### ES 与 Lucene

- ES 的每个分片是基于一个 Lucene 索引实现的。
- ES 对 Lucene 新增文档的流程做了改进，如下：
  1. 将新增的文档写入内存缓冲区（buffer），并备份到事务日志（translog）中。
      - translog 由多个 generation 文件组成。
      - 如果 ES 异常终止，则重启后会从 translog 中恢复未提交的数据。
      - 对 translog 文件的修改是存储在内存 dirty page 中，如果系统宕机，则 translog 中的数据依然会丢失。
      - ES 默认每隔 5s 调用一次操作系统的 fsync ，将内存 dirty page 中的文件写入磁盘。
  2. 当 buffer 满了，或者默认每隔 1s ，ES 会将 buffer 中的文档保存为一个新的 segment ，然后清空 buffer 。该过程称为 Refresh 。
      - 写入文档、删除文档时，都要等到 Refresh 之后才会生效，才能被查询到。
      - 如果 Refresh 的频率过高，则会消耗较多的系统资源，还会产生大量体积小的 segment 。
  3. 重复 1、2 步骤，继续新增文档，使得 translog 文件越来越大。
  4. 如果 translog 文件超过一定大小，ES 就会执行一次 fsync ，然后创建一个新的 translog 文件供写入。该过程称为 Flush 。
      - 如果 Flush 的频率过高，则会增加等待磁盘 IO 的耗时。
      - Refresh 与 Flush 是两种操作，不一定会同时执行。

- ES 支持将每个 shard 中一些较小的 segment 合并成较大的 segment ，并排除 deleted 文档。从而减少 segment 数量、清理 deleted 文档。
  - ES 会自动合并（normalMerge），用户也可以主动触发一次强制合并（forcemerge）。
  - 合并的大概流程如下：
    1. 根据算法，选取一些适合合并的 segment 。
    2. 创建一个新的 segment ，将旧 segment 中非 deleted 的文档拷贝进去。
    3. 将新的 segment 保存到磁盘，将旧的 segment 删除。此过程会占用两份磁盘空间。
  - 如果 segment 中的文档删除率达到 100% ，则自动删除该 segment 。
  - 合并时会占用较多磁盘 IO ，特别是强制合并。建议采取以下优化措施：
    - 降低 Refresh 的频率，避免产生大量体积小的 segment 而需要经常自动合并。
    - 避免在体积大的 segment 中删除文档，从而不需要合并大的 segment 。
    - 对于不再需要修改的 index ，可以执行一次 forcemerge ，永久优化。

## 客户端

- ES 服务器提供了 Restful API 供客户端访问。
- 客户端向 ES 服务器发出请求的标准格式如下：
  ```sh
  [root@CentOS ~]# curl -X GET 127.0.0.1:9200/_count?pretty -H 'content-Type:application/json' -d '
  > {
  >   "query": {
  >     "match_all": {}
  >   }
  > }'
  {
    "count" : 1,
    "_shards" : {
      "total" : 1,
      "successful" : 1,
      "skipped" : 0,
      "failed" : 0
    }
  }
  ```
  - curl 命令加上 `-H 'content-Type:application/json'` 之后，便可以发送 JSON 格式的查询参数。
  - 如果客户端发出的请求报文 body 不能按 JSON 格式正常解析，ES 就会返回 HTTP 400 报错。
  - ES 返回的响应报文 body 是 JSON 格式的字符串。
    - 如果在请求 URL 末尾加上 `?pretty` ，则会让 ES 返回经过缩进、换行的 JSON 字符串。
- 为了方便书写，下文将客户端的请求简记成如下格式：
  ```json
  GET /_count
  {
    "query": {
      "match_all": {}
    }
  }
  ```

## 相关概念

### Lucene

：一个全文搜索引擎，作为 Java 代码库发布。
- 2000 年由美国工程师 Doug Cutting 开源，后来交给 ASF 基金会管理。
- Lucene 将存储的每条数据称为文档（document），容纳文档的集合称为索引（index）。
  - 每个索引由一个或多个子索引组成。
  - 每个索引使用一个 int 型变量 MAX_DOCS 控制其容量，因此最多 2^31 个文档。
- 子索引（sub-index）又称为索引段（index segment）。
  - 每个 segment 中可以写入多个文档，并给它们分配在该 segment 中唯一的 DocId 。
  - 每个 segment 会单独建立索引，因此可以单独在其中搜素。
    - 在 Lucene 索引中进行查询时，是先依次在它的每个 segment 中进行查询，然后合并它们的查询结果。
  - 当客户端请求新增文档时，Lucene 会将文档写入内存缓冲区，然后返回响应给客户端。
    - 每隔一定时间，Lucene 会将内存缓冲区中的文档保存为一个新的 segment 。该过程称为 Commit 。
    - 在 Lucene Commit 之前，内存缓冲区中写入的文档不能被客户端查询到，并且会在 Lucene 异常终止时丢失。
  - segment 不支持修改，只能新增、删除。
    - 当客户端请求删除文档时，Lucene 只是将文档标记为 deleted ，但并不会改变已保存的 segment 。（除非删除整个索引）
    - 当客户端请求查询文档时，Lucene 会依次在每个 segment 中进行查询，依然会查询 deleted 文档，只是在返回查询结果时排除掉。（导致查询耗时增加）
      - 对于 ES 而言， deleted 文档消耗的查询时间比普通文档少很多，因为它会在 Lucene 查询结果中被排除，不会经过 ES 过滤、加工。
    - 当客户端请求修改文档时，Lucene 会先在原来的 segment 中，将该文档标记为 deleted 。然后在新的 segment 中，重新写入该文档。（导致开销比新增文档更大）

### Solr

：一个基于 Lucene 的搜索服务器，采用 Java 开发。
- 于 2006 年开源，由 ASF 基金会管理。
- 基于 zookeeper 运行分布式系统。
