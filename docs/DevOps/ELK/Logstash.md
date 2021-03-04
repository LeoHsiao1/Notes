# Logstash

- 2009 年，Jordan Sissel 发布了 Logstash ，成为了流行的日志采集工具。
- 2013 年，Logstash 被 Elastic 公司收购，组成了 ELK 系统。

## 部署

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/logstash/logstash-7.10.0-linux-x86_64.tar.gz
    ```

2. 启动：
    ```sh
    bin/logstash
                  -f CONFIG_FILE              # 指定配置文件的路径
                  -e CONFIG_STRING            # 传入一个字符串作为配置
                  --config.reload.automatic   # 发现配置文件变化时，自动重新加载
                  --log.level=info            # 指定日志等级
                  -V                          # 显示版本号
    ```

## pipeline

### 原理

- Linux 系统上通常通过管道符筛选日志，比如 `cat test.log | grep DEBUG'` 。而 Logstash 处理日志数据的机制也称为管道（pipeline）。
- 每个管道主要分为三个阶段：
  - input ：输入项，用于接收数据。
  - filter ：过滤器，用于过滤、修改数据。是可选阶段。
    - 通常使用 grok 插件将纯文本格式的日志数据转换成 JSON 格式的结构化数据。
    - 默认会给每个日志事件添加一个 `@timestamp` 字段。
      - 它采用 UTC 时区，默认取值为当前时刻。
      - 也可以从原始日志解析出时间。即使超过当前时间，也会生效。
  - output ：输出项，用于输出数据。

### 示例

通过命令行创建管道的示例：
1. 启动 Logstash ，运行一个简单的管道：
    ```sh
    bin/logstash -e 'input { stdin { } } output { stdout {} }'
    ```
    这里接收 stdin 输入的数据，转换成日志输出到 stdout 。

2. 此时在终端输入一个字符串 Hello ，按下回车，就会转换成一条日志。如下：
    ```sh
    {
        "@timestamp" => 2020-01-12T07:37:00.045Z,
              "host" => "CentOS-1",
            "message" => "Hello",
          "@version" => "1"
    }
    ```

通过配置文件创建管道的示例：
1. 创建一个配置文件 `config/pipeline.conf` ，定义一个管道：
    ```sh
    input {
      # file {              # 读取文件作为输入
      #   path => "/var/log/http.log"
      # }
      beats {               # 接收 beats 的输入
        port => "5044"      # 监听一个端口，供 beats 发送数据进来。这里采用 TCP 协议通信，而不是 HTTP 协议
        host => "0.0.0.0"
        # client_inactivity_timeout => 60       # 如果 beats 连续多久未活动，则关闭 TCP 连接，单位为秒
      }
    }

    # filter {
    # }

    output {
      stdout {                                  # 输出到终端，便于调试
        # codec => rubydebug                    # 输出时默认采用 rubydebug 格式
      }
      # file {                                  # 输出到文件
      #   path  => "/tmp/http.log"
      #   codec => line { format => "custom format: %{message}"}    # 指定数据的每行格式，默认每行一个 JSON 格式的日志事件
      # }
      elasticsearch {                           # 输出到 ES
        hosts => ["http://10.0.0.1:9200"]
        # user                => "admin"
        # password            => "123456"
        # ssl_certificate_verification => true                            # 使用 HTTPS 连接时，是否验证 SSL 证书
        # document_id         => "%{[@metadata][_id]}"                    # 用于存储日志事件的文档 id 。如果重复保存相同 id 的文档，则会覆盖旧的文档
        # index               => "logstash-%{+yyyy.MM.dd}-%{index_num}"   # 索引名
        # manage_template     => true                                     # 在 Logstash 启动时，是否在 ES 中创建索引模板
        # template            => "/path/to/logstash/logstash-apache.json" # 指定模板的定义文件，默认使用内置的模板
        # template_name       => "logstash"                               # 模板的名称
        # template_overwrite  => false                                    # 如果模板在 ES 中已存在，是否覆盖它。如果不覆盖，可能会一直使用老版本的内置模板
      }
    }
    ```

2. 启动 Logstash ，运行指定的管道：
    ```sh
    bin/logstash -f config/pipeline.conf --log.level=debug
    ```

### 语法

pipeline 的语法与 Ruby 相似，特点如下：
- Hash 字典的键值对之间通过空格分隔，比如 `{"field1" => "A" "field2" => "B"}` 。
- 支持引用变量：
  - 用 `filed` 或 `[filed]` 的格式引用日志事件的顶级字段。
  - 用 `[filed][sub_filed]...` 的格式引用子字段。
    - 引用子字段时，如果父字段不存在，则会自动创建它，因此应该先检查父字段是否存在。如下：
      ```sh
      if [json] and [json][version] == "null" {
        mutate {
          remove_field => [ "[json][version]" ]
        }
      }
      ```
  - 用 `%{filed}` 的格式获取字段的值。
  - 用 `${VAR}` 的格式获取终端环境变量的值。
  - 例：
    ```sh
    filter {
      if [agent_name] and [@metadata][time] {
        mutate {
          add_field {
            "port" => "${TCP_PORT}"
            "[@metadata][tmp_name]" => "%{agent_name} %{[@metadata][time]}"
          }
        }
      }
    }
    ```
    - `@metadata` 字段不会被 output 阶段输出，因此适合存储一些临时的子字段。
- 支持使用 if 语句：
  - 支持 `<`、`>`、`<=`、`>=`、`==`、`!=` 比较运算符。
  - 支持 `=~` `!~` 运算符，判断左侧的字符串是否匹配右侧的正则表达式。
  - 支持 `and`、`or`、`!`、`not`、`not in` 逻辑运算符。
  - 例：
    ```sh
    filter {
      if [level] == "DEBUG" {
        grok {...}
      }
      else if [level] == "WARN" {
        grok {...}
      }
      else {
        grok {...}
      }
    }
    ```
    ```sh
    if [level] =~ "DEBUG" or [level] =~ "WARN" or [level] =~ "ERROR"
    ```
    ```sh
    if [level] in ["DEBUG", "WARN", "ERROR"]
    ```
    ```sh
    if "_grokparsefailure" not in [tags]    # 判断一个 tag 是否在 tags 字段中存在
    ```
    ```sh
    if [level]                              # 判断一个字段是否存在，且取值不为 false、null
    ```

## 插件

### codec

- codec 类型的插件用于按特定的文本格式编码、解码数据，可以用于 pipeline 的 input 或 output 阶段。
- 常见的几种 codec 插件：
  - line ：用于解码输入时，将每行文本视作一条日志。用于编码输出时，将每条日志保存成一行文本。
  - multiline ：将连续的多行文本记录成同一条日志。不过该操作由 Beats 完成更方便。
  - json ：按 JSON 格式处理日志，忽略换行符、缩进。
  - json_lines ：根据换行符 `\n` 将文本分成多行，每行一条 JSON 格式的日志。

### grok

- grok 是一个 filter 插件，用于解析纯文本格式的日志数据，通过正则表达式提取一些字段，存储为 JSON 格式的日志事件中的顶级字段。
- Kibana 网页上提供的开发工具包含了 grok Debugger ，便于调试 grok pattern 。
- 例：
  1. 假设原始日志为：
      ```sh
      2020-01-12 07:24:43.659+0000  INFO  10.0.0.1 User login successfully
      ```
  2. 编写一个 grok 表达式来匹配日志：
      ```sh
      %{TIMESTAMP_ISO8601:timestamp}\s+(?<level>\S+)\s+(?<client_ip>\S+)\s+(?<message>.*)$
      ```
      - 可以按 `(?<field>pattern)` 的格式匹配字段。例如 `(?<level>\S+)` 表示使用正则表达式 `\S+` 进行匹配，将匹配结果赋值给名为 level 的字段。
      - 可以按 `%{NAME:field}` 的格式调用事先定义的正则表达式。例如 `%{TIMESTAMP_ISO8601:timestamp}` 表示使用一个名为 TIMESTAMP_ISO8601 的正则表达式进行匹配，将匹配结果赋值给名为 timestamp 的字段。

  3. grok 输出的结构化数据为：
      ```sh
      {
        "level": "INFO",
        "client_ip": "10.0.0.1",
        "message": "User login successfully",
        "timestamp": "2020-01-12 07:24:43.659+0000"
      }
      ```

- 可以事先定义一些正则表达式，然后通过名称调用它们。
  - 定义格式为：
    ```sh
    NAME  pattern
    ```
  - 例：
    ```sh
    INT         (?:[+-]?(?:[0-9]+))
    WORD        \b\w+\b
    SPACE       \s*
    NOTSPACE    \S+
    GREEDYDATA  .*
    ```
  - grok 内置了一些 [patterns](https://github.com/logstash-plugins/logstash-patterns-core/blob/master/patterns/ecs-v1/grok-patterns) 。
- 例：在 pipeline 的 filter 中使用 grok 插件
  ```sh
  filter {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp}\s+(?<level>\S+)\s+(?<client_ip>\S+)\s+(?<message>.*)$" }  # 解析 message 字段，通过正则匹配提取字段
      overwrite => [ "message" ]                        # 允许提取的这些字段覆盖日志事件中已存在的字段
      # patterns_dir => ["config/patterns"]             # 加载 patterns 的定义文件
      # keep_empty_captures => false                    # 如果匹配到的字段为空，是否依然保留该字段
      # tag_on_failure => ["_grokparsefailure"]         # 如果匹配失败，则给日志添加这些 tag
      # tag_on_timeout => ["_groktimeout"]              # 如果匹配超时，则给日志添加这些 tag
      # timeout_millis => 30000                         # 匹配的超时时间，单位 ms

      # 以下是所有 filter 插件通用的配置参数
      # add_field       => {                            # 添加字段
      #   "test_field"  => "Hello"
      #   "from_%{IP}"  => "this is from %{IP}"
      # }
      # add_tag         => ["test_tag", "from_%{IP}"]   # 添加标签
      # remove_field    => ["field_1" , "from_%{IP}"]   # 删除字段
      # remove_tag      => ["test_tag", "from_%{IP}"]   # 删除标签
      # id              => "ABC"                        # 该插件的唯一 id ，默认会自动生成
      # enable_metric   => true                         # 是否记录该插件的指标
    }
  }
  ```
  - 如果原始日志的每行格式可能不同，则可以在 match 中指定多个表达式用于尝试匹配：
    ```sh
    match => {
      "message" => [
        "DEBUG (?<message>.*)$",
        "INFO  (?<message>.*)$"
      ]
      # break_on_match => true    # 当表达式匹配成功时，不再尝试匹配之后的表达式
    }
    ```
    不过这样会多次执行正则表达式，比如第一个正则表达式总是会被执行，开销较大。不如通过 if 语句选择性地执行 grok 。

### json

- json 是一个 filter 插件，用于按 JSON 格式解析日志事件的一个字段。
- 例：
  ```sh
  json {
    source => "message"                         # 按 JSON 格式解析 message 字段的值
    # target => "json"                          # 将解析之后的 JSON 字典保存到该字段.如果该字段已存在，则覆盖它。如果不配置，则存储为顶级字段
    # skip_on_invalid_json => false             # 解析失败时，不发出警告
    # tag_on_failure => ["_jsonparsefailure"]
  }
  ```

### date

- date 是一个 filter 插件，用于解析日志事件的一个字段，获取时间。
- 例：
  ```sh
  if [timestamp] {
    date {
      match => ["timestamp", "UNIX", "UNIX_MS", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSSZ"]   # 指定源字段，然后可以指定多个尝试匹配的时间字符串格式
      remove_field => ["timestamp"]
      # target => "@timestamp"                      # 将解析之后的时间保存到该字段。如果该字段已存在，则覆盖它
      # tag_on_failure => ["_dateparsefailure"]
    }
  }
  ```

### drop

- drop 是一个 filter 插件，用于丢弃一些日志。
- 例：
  ```sh
  if [level] == "DEBUG" {
    drop {
      # percentage => 40      # 丢弃大概 40% 的这种日志
    }
  }
  ```

### mutate

- mutate 是一个 filter 插件，用于修改日志事件的一些字段。
- 例：
  ```sh
  mutate {
    copy       => { "field1" => "field2" }         # 拷贝一个字段的值，赋值给另一个字段
    rename     => { "field1" => "field2" }         # 重命名一个字段
    replace    => { "field1" => "new: %{field2}" } # 替换一个字段的值
    convert    => {                                # 转换字段的数据类型，默认都是字符串类型
      "field1" => "boolean"
      "field2" => "integer"                        # 可以按这种格式同时处理多个字段
    }
    lowercase  => [ "field1" ]                     # 将字段的值改为小写
    uppercase  => [ "field1" ]                     # 将字段的值改为大写
    strip      => [ "field1" ]                     # 删掉字段的值前后的空白字符
    split      => { "[json][version]" => "." }     # 根据指定的字符分割一个字段的值，保存为数组形式
    # tag_on_failure => ["_mutate_error"]
  }
  ```

### geoip

- geoip 是一个 filter 插件，用于查询 IP 地址对应地理位置，包括经纬度坐标、国家名、城市名等。
- 查询时的开销比较大。
- 例：
  ```sh
  geoip {
    source => "client_ip"                         # 存储 IP 地址的字段
    target => "geoip"                             # 存储查询结果的字段
    # database => "xx/xx/GeoLite2-City.mmdb"      # 用于查询的数据库文件
    # cache_size => 1000                          # 缓存区的大小。查询一些重复 IP 或相邻 IP 时，使用缓存可以提高效率
    # tag_on_failure => ["_geoip_lookup_failure"]
  }
  ```

### ruby

- ruby 是一个 filter 插件，用于嵌入 Ruby 代码。
- 例：
  ```sh
  ruby {
    code => "event.cancel if rand <= 0.90"    # 执行 Ruby 代码，这里是 90% 的概率取消日志事件
  }
  ```
- 可以导入一个 Ruby 脚本文件：
  ```sh
  ruby {
    path => "test_filter.rb"
    script_params => { "percentage" => 0.9 }
  }
  ```
  脚本的内容示例：
  ```ruby
  def register(params)        # 可以定义一个 register(params) 函数，接收传给脚本的参数
    @drop_percentage = params["percentage"]
  end

  def filter(event)           # 必须定义一个 filter(event) 函数，输入日志事件，返回一个包含事件的数组
    if rand >= @drop_percentage
      return [event]
    else
      return []               # 返回一个空数组，这会取消日志事件
    end
  end
  ```
