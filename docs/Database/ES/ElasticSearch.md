# ElasticSearch

：简称为 ES ，一个搜索引擎，也可用作存储 JSON 格式数据的 NoSQL 数据库。
- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.6/index.html)
- 基于 Java 开发，基于 Lucene 实现。
- 采用 C/S 架构、TCP 通信。

## 版本

- v1.0 ：于 2010 年发布。最初由 Shay Banon 开发，后来由 Elastic 公司管理。
- v6.0 ：于 2017 年发布。
- v7.0 ：于 2019 年发布。

## 原理

- ES 将数据以 JSON 格式存储。
  - 每条数据称为一个文档（document）。
  - 存储文档的集合称为索引（index）。

- 使用 ES 的一般流程：
  1. 在 ES 中创建索引，定义文档的数据结构。
  2. 向索引中写入一些文档。
  3. 向索引中查询一些文档。

- ES 的每个索引由多个分片（shard）组成。
  - 在 ES 索引中进行搜索时，是先在它的每个分片中进行搜索，然后合并它们的搜索结果。
  - 索引下新增的文档会平均分配到各个分片中，而分片可以存储在不同 ES 节点上。
    - 用户发出查询请求时，不必知道文档存储在哪个分片、分片存储在哪个节，因为 ES 会自动完成查询。
  - 单个分片的存储容量理论上没有上限，但是存储的文档越多，则查询耗时越久。


## 客户端

- ES 服务器提供了 Restful API 供客户端访问。
- 客户端向 ES 服务器发出请求的标准格式如下：
  ```sh
  [root@Centos ~]# curl -X GET 127.0.0.1:9200/_count?pretty -H 'content-Type:application/json' -d '
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

- Lucene
  - ：一个 Java 库，提供了全文搜索、索引等 API 。
  - 于 2000 年开源，由 ASF 管理。

- Solr
  - ：一个基于 Lucene 的搜索引擎，基于 Java 开发。
  - 于 2006 年开源，由 ASF 管理。
  - 基于 zookeeper 运行分布式系统。
  - Solr 比 ES 的功能更丰富，但 ES 的实时性更强。

- 正排索引
  - 当用户搜索一个字符串时，搜索引擎会逐个查询已有的文档，找出包含该字符串的所有文档。\
    然后建立索引：某个字符串，对应某个文档。
  - 这样建立索引的过程简单，但搜索速度慢。

- 倒排索引
  - 事先建立索引：某个单词，对应某个文档的某个位置。\
    当用户搜索一个字符串时，先将它拆分成多个单词，然后根据索引定位文档。
  - 这样建立索引的过程复杂，但搜索速度快。
  - ES 等大部分搜索引擎都支持倒排索引，以大幅提高全文搜索的速度。
