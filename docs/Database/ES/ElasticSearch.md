# ElasticSearch

：简称为 ES ，一个搜索引擎，也可用作存储 JSON 格式数据的 NoSQL 数据库。
- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.6/index.html)
- 基于 Java 开发，基于 Lucene 实现。
- 采用 C/S 架构、TCP 通信。
  - 客户端通过 Restful API 访问服务器。

## 版本

- v1.0 ：于 2010 年发布。最初由 Shay Banon 开发，后来由 Elastic 公司管理。
- v6.0 ：于 2017 年发布。
- v7.0 ：于 2019 年发布。

## 用法示例

- 客户端向 ES 服务器的根路径发出 GET 请求，即可查看 ES 的基本信息。如下：
  ```sh
  [root@Centos ~]# curl 127.0.0.1:9200
  {
    "name" : "node-1",
    "cluster_name" : "cluster-1",
    "cluster_uuid" : "cDXF4mIeRqK4Dlj_YmSSoA",
    "version" : {
      "number" : "7.10.0",
      "build_flavor" : "default",
      "build_type" : "tar",
      "build_hash" : "7f634e9f44834fbc12724506cc1da681b0c3b1e3",
      "build_date" : "2020-02-06T00:09:00.449973Z",
      "build_snapshot" : false,
      "lucene_version" : "8.4.0",
      "minimum_wire_compatibility_version" : "6.8.0",
      "minimum_index_compatibility_version" : "6.0.0-beta1"
    },
    "tagline" : "You Know, for Search"
  }
  ```

- 客户端向 ES 服务器发出请求的标准格式如下：
  ```sh
  [root@Centos ~]# curl -X GET 127.0.0.1:9200/_count?pretty -H 'content-Type:application/json' -d '
  > {
  >     "query": {
  >         "match_all": {}
  >     }
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
  - ES 返回的报文 body 是 JSON 格式的字符串。\
    如果在请求 URL 末尾加上 `?pretty` ，则会让 ES 返回经过缩进、换行的 JSON 字符串。
  - 加上 `-H 'content-Type:application/json'` 之后，便可以发送 JSON 格式的查询参数。
  - 为了方便书写，下文将客户端请求简记成如下格式：
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
  - 当用户搜索一个字符串时，搜索引擎会逐个查询已有的文档，找出包含该字符串的所有文档。
    然后建立索引：某个字符串，对应某个文档。
  - 这样建立索引的过程简单，但搜索速度慢。

- 倒排索引
  - 事先建立索引：某个单词，对应某个文档的某个位置。
    当用户搜索一个字符串时，先将它拆分成多个单词，然后根据索引定位文档。
  - 这样建立索引的过程复杂，但搜索速度快。
  - ES 等大部分搜索引擎都支持倒排索引，以大幅提高全文搜索的速度。

