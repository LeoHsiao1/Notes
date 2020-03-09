# ElasticSearch

：简称为 ES ，是一个搜索引擎，也可当做存储 JSON 格式数据的 NoSQL 数据库。
- 基于 Java 开发，采用 Apache Lucene 搜索引擎作为核心。
- 采用 C/S 工作模式。客户端通过 Restful API 访问服务器，降低了使用难度。
- 实时性高，可以很快地存储、搜索数据。
- [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.6/index.html)
- 同类的搜索引擎：Apache Solr ，也是采用 Apache Lucene 搜索引擎作为核心。

## 启动

- 下载发行版并启动：
    ```sh
    curl -O https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.6.0-linux-x86_64.tar.gz
    tar -zxvf elasticsearch-7.6.0-linux-x86_64.tar.gz
    cd elasticsearch-7.6.0/bin/
    ./elasticsearch
    ```

- 用 Docker 运行：
    ```sh
    docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.6
    ```

## 配置

ES 服务器的配置文件是 config/elasticsearch.yml ，内容示例如下：
```yaml
cluster.name: my-application
node.name: node-1
path.data: /path/to/data
path.logs: /path/to/logs
network.host: 0.0.0.0
http.port: 9200
```
- ES 服务器默认监听的是 127.0.0.1:9200 。


## 入门示例

客户端向 ES 服务器的根路径发出 GET 请求，即可查看 ES 的基本信息。如下：
```sh
[root@Centos ~]# curl 127.0.0.1:9200
{
  "name" : "Leo",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "cDXF4mIeRqK4Dlj_YmSSoA",
  "version" : {
    "number" : "7.6.0",
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

客户端向 ES 服务器发出请求的标准格式如下：
```sh
[root@Centos ~]# curl -X GET 127.0.0.1:9200/_count?pretty -H 'content-Type:application/json' -d '
> {
>     "query": {
>         "match_all": {}
>     }
> }'
{
  "count" : 0,
  "_shards" : {
    "total" : 0,
    "successful" : 0,
    "skipped" : 0,
    "failed" : 0
  }
}
```
- ES 返回的报文 body 是 JSON 格式的字符串。如果在请求 URL 末尾加上 `?pretty` ，则会让 ES 返回经过缩进、换行的 JSON 字符串。
- 加上 `-H 'content-Type:application/json'` 之后，便可以发送 JSON 格式的查询参数。
- 为了方便书写，下文将客户端请求简记成如下格式：
    ```
    GET /_count
    {
        "query": {
            "match_all": {}
        }
    }
    ```
