# 搜索

## 简单搜索

将 GET 请求的目标 URL 的最后一段设置成 _search ，则可进行搜索。
- 下例是直接搜索。默认最多返回 10 个文档。
    ```
    GET /student/_doc/_search
    ```
- 下例是在 URL 的查询字符串中加入 q 字段及查询参数。
    ```
    GET /student/_doc/_search?q=name:Leo
    ```
- 具体的请求示例：
    ```sh
    [root@Centos ~]# curl -X GET 127.0.0.1:9200/student/_doc/_search?pretty
    {
      "took" : 14,                  # 本次查询的耗时，单位为 ms
      "timed_out" : false,          # 本次查询是否超时
      "_shards" : {
        "total" : 1,                # 总共搜索了多少个分片
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
            "_score" : 1.0,         # 该文档与查询条件的相关性
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

## DSL 查询

发出搜索请求时，在请求报文 body 中加入 JSON 格式的查询参数，则可进行 DSL 查询。
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

- 使用 `bool` 关键字可进行布尔条件查询，如下：
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
                            ]
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
    - `must` 数组中的条件必须都匹配。`must_not` 数组中的条件必须都不匹配。`should` 数组中的条件只要匹配一个即可。
    - `should` 不能写在与 `must` 同一层级的位置，否则会失效。

- 使用 `filter` 关键字可添加过滤器，只返回过滤后的文档。如下：
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

