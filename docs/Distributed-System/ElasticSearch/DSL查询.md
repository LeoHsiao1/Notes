# 查询

## 简单查询

将 GET 请求的目标 URL 的最后一段设置成 `_search` ，则可进行查询。

- 下例是直接查询。默认最多返回 10 个文档。
    ```
    GET /student/_doc/_search
    ```
- 下例是在 URL 的查询字符串中加入 q 字段及查询参数。
    ```
    GET /student/_doc/_search?q=name:Leo
    ```
- 对 ES 发出查询请求之后，收到的响应内容一般如下：
    ```sh
    [root@Centos ~]# curl -X GET 127.0.0.1:9200/student/_doc/_search?pretty
    {
      "took" : 14,                  # 本次查询的耗时，单位为 ms
      "timed_out" : false,          # 该请求的处理过程是否超时
      "_shards" : {
        "total" : 1,                # 总共查询了多少个分片
        "successful" : 1,           # 有多少个分片成功了
        "skipped" : 0,              # 有多少个分片跳过了
        "failed" : 0                # 有多少个分片失败了
      },
      "hits" : {
        "total" : {
          "value" : 8,              # 总共找到了多少个与查询条件相匹配的文档
          "relation" : "eq"         # 这些文档与查询条件的关系
        },
        "max_score" : 1.0,          # 这些文档的最大相关性
        "hits" : [                  # hits 字典 中的 hits 数组包含了 ES 实际返回给客户端的文档
          {
            "_index" : "student",
            "_type" : "_doc",
            "_id" : "ZhzMiXABzduhqPWX7mUX",
            "_score" : 1.0,         # 一个正浮点数，表示该文档与查询条件的相关性
            "_source" : {
              "name" : "Leo",
              "age" : 10,
              "interests" : [
                "sports",
                "music"
              ]
            }
          },
          ...
    ```
    - ES 默认将 hits 数组中的各个文档按 _score 的值进行排序。

## DSL 查询

发出查询请求时，在请求报文 body 中加入 JSON 格式的查询参数，则可进行 DSL 查询。

- 下例是查询 student 索引下，name 等于 Leo 的文档。
    ```
    GET /student/_doc/_search
    {
        "query" : {
            "match" : {
                "name" : "Leo"
            }
        }
    }
    ```
    - `{ "match" : { "name" : "Leo leo" } }` 是匹配 `name` 等于 `Leo` 或 `leo` 的文档。
    - `{ "match_phrase" : { "name" : "Leo Hsiao" } }` 是匹配 `name` 等于 `Leo Hsiao` 的文档。 
    - `{ "match_all" : { } }` 是匹配所有文档。

- 使用 `filter` 参数可添加过滤器，使得 ES 只返回过滤后的文档。如下：
    ```
    GET /student/_doc/_search
    {
        "query": {
            "bool": {
                "must": {
                    "match_all": {}
                },
                "filter": {
                    "range": {
                        "age": {
                            "gte": 10,
                            "lte": 20
                        }
                    }
                }
            }
        }
    }
    ```
    - `query` 参数传入的查询子句称为“查询上下文”，`filter`参数传入的查询子句称为“过滤器上下文”。
    - ES 只会返回同时匹配“查询上下文”和“过滤器上下文”的文档，不过文档的 _score 的值只由“查询上下文”决定，不受“过滤器上下文”影响。

- 使用 `bool` 参数可以进行布尔查询，如下：
    ```
    GET /student/_doc/_search
    {
        "query": {
            "bool": {
                "must": [
                    {
                        "range": {
                            "age": {
                                "gte": 10,
                                "lte": 20
                            }
                        }
                    },
                    {
                        "bool": {
                            "should": [{
                                    "match": {
                                        "name": "Leo"
                                    }
                                },
                                {
                                    "match": {
                                        "name": "leo"
                                    }
                                }
                            ],
                            "minimum_should_match" : 1
                        }
                    }
                ],
                "must_not": [{
                    "match": {
                        "age": "12"
                    }
                }]
            }
        }
    }
    ```
    - `bool` 字典中可以使用以下子句：
      - `must` 子句：是一个数组，文档必须符合其中列出的所有条件。
      - `must_not` 子句：是一个数组，文档必须不符合其中列出的所有条件。
      - `should` 子句：是一个数组，文档应该符合其中列出的条件。
      - `filter` 子句
    - `should` 不能写在与 `must` 同一层级的位置，否则会失效。
    - `minimum_should_match` 表示文档至少应该符合 `should` 数组中的几个条件。
      - 默认值为 1 。
      - 可以设置成任意正整数，比如 10 。不过实际生效的值不会超过 `should` 条件总数 n 。
      - 可以设置成任意负整数，比如 -2 ，这表示实际生效的值等于 n-2 。
      - 可以设置成百分比格式，比如 75% 、-25% ，这会向下取整。

- 下例是查询 student 索引下的所有文档，将它们按 age 的值升序排列，并且只从第 5 号文档开始返回（从 0 开始编号），最多返回 2 个文档。
    ```
    GET /student/_doc/_search
    {
        "query": {
            "match_all": {}
        },
        "sort": [{
            "age": "asc"
        }],
        "from": 5,
        "size": 2
    }
    ```



## 聚合

，，，待续

