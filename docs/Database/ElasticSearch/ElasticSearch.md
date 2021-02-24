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

## 安装

- 下载二进制版：
  ```sh
  wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.10.0-linux-x86_64.tar.gz
  ```
  解压后运行：
  ```sh
  bin/elasticsearch       # 在前台运行
                    -d    # 以 daemon 方式运行
  ```
  运行时需要 JDK 环境，不过二进制发行版自带了一个 JDK 。

- 或者运行 Docker 镜像：
  ```sh
  docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.10.0
  ```
  9200 端口供用户通过 HTTP 协议访问，9300 端口供 ES 集群的其它节点通过 TCP 协议访问。

## 配置

ES 服务器的配置文件是 `config/elasticsearch.yml` ，内容示例如下：
```yml
cluster.name: cluster-1           # 该 ES 所属的集群名
node.name: node-1                 # 该 ES 的节点名，默认为当前主机名
path.data: /var/data/elasticsearch
path.logs: /var/log/elasticsearch
network.host: 0.0.0.0             # 监听的 IP
http.port: 9200                   # 监听的端口
```

ES 启动时会检查以下环境条件是否满足，如果不满足则会发出警告。如果此时还配置了 `network.host` 参数，则 ES 会按生产环境严格要求，将这些警告升级为异常。
- 禁用 Swap 分区：
  - 需要执行命令 `swapoff -a` ，并且将 `/etc/fstab` 文件中的 swap 分区都注释。
- 增加进程虚拟内存的上限：
  - 需要执行命令 `sysctl vm.max_map_count=262144` ，并在 `/etc/sysctl.conf` 文件中永久修改该参数。
- 增加进程数量的上限：
  - 需要执行命令 `ulimit -u 4096` ，并在 `/etc/security/limits.conf` 文件中永久修改该参数。
- 增加文件描述符数量的上限：
  - 需要执行命令 `ulimit -n 65535` ，并在 `/etc/security/limits.conf` 文件中永久修改该参数。

## 用法示例

客户端向 ES 服务器的根路径发出 GET 请求，即可查看 ES 的基本信息。如下：
```sh
[root@Centos ~]# curl 127.0.0.1:9200
{
  "name" : "node-1",
  "cluster_name" : "cluster1",
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

客户端向 ES 服务器发出请求的标准格式如下：
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
- ES 返回的报文 body 是 JSON 格式的字符串。
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

