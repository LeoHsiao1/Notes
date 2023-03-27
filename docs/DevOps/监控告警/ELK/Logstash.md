# Logstash

：一个数据处理程序。可以收集多种格式的数据，加工处理之后，写入多种数据库。
- 采用 Ruby 开发，通过 JRuby 解释器运行在 JVM 上。
- 2009 年，Jordan Sissel 发布了 Logstash ，成为了流行的日志采集工具，也可处理其它类型的数据。
- 2013 年，Logstash 被 Elastic 公司收购，组成了 ELK 系统。

## 部署

- 下载二进制版：
  ```sh
  wget https://artifacts.elastic.co/downloads/logstash/logstash-7.10.0-linux-x86_64.tar.gz
  ```
  然后启动：
  ```sh
  bin/logstash
                -f PATH                     # --path.config ，指定配置文件的目录，会加载其下所有 *.conf 文件
                -e STRING                   # --config.string ，传入一个字符串作为配置
                --log.level=info            # 指定日志等级
                -V                          # 显示版本号
                -r                          # --config.reload.automatic ，自动加载发生变化的配置文件
                --config.reload.interval 3  # 默认每隔 3 秒检查一次配置文件是否变化
  ```
  - 如果启用了 -r 选项，则 logstash 检查到配置文件发生变化时，会重新加载。
    - 重新加载时，logstash 会根据新的配置文件，尝试创建新管道并使用。如果新管道可以正常运行（比如语法没报错），则用新管道替换旧管道。否则，继续运行旧管道。
    - 用 `kill -SIGHUP` 发送信号，也会使其重新加载一次配置文件。
    - 插件不一定能重新加载，可能依然需要重启 logstash 。

- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    logstash:
      container_name: logstash
      image: logstash:7.10.1
      restart: unless-stopped
      ports:
        - 5044:5044
      volumes:
        - ./config:/usr/share/logstash/config
        - ./data:/usr/share/logstash/data
  ```
  - 容器内以非 root 用户运行服务，需要调整挂载目录的权限：
    ```sh
    mkdir -p  config data
    chown -R  1000 .
    ```

## 配置

- Logstash 的配置目录的结构如下：
  ```sh
  config/
  ├── conf.d/               # 存放一些管道的定义文件
  |   ├── a.conf
  |   └── b.conf
  ├── jvm.options           # JVM 的配置，比如限制内存 -Xmx
  ├── log4j2.properties     # Java 日志的配置
  ├── logstash.yml          # logstash 本身的配置
  ├── pipelines.yml         # 定义管道
  └── startup.options       # 自定义 logstash 启动命令的配置，供 systemd 读取
  ```
- logstash.yml 默认为空，配置示例：
  ```yml
  # path.data: /var/lib/logstash
  # path.logs: /var/log/logstash
  # log.level: info
  # log.format: plain

  # dead_letter_queue.enable: false    # 是否启用死信队列，默认为 false
  pipeline:
    batch:
      # size: 125 # input 阶段每接收指定数量的事件，才打包成一个 batch ，供 filter、output 阶段的一个 worker 处理。增加该值会提高处理速度
      # delay: 50 # 收集 batch 时，等待接收新事件的超时时间，单位 ms 。如果等待超时，则立即打包成一个 batch 。每个新事件会单独考虑超时时间，因此超时时间应该设置得小些
    workers: 4    # 处理 filter、output 阶段的线程数，默认等于 CPU 核数。可以大于 CPU 核数，因为输出阶段的 worker 会等待网络 IO 而不占用 CPU
  ```
  - pipeline 在内存中处理的 event 数量最大为 size * workers 。
  - 接收一个 batch 的最长耗时为 size * delay 。

- pipelines.yml 的配置示例：
  ```yml
  - pipeline.id: main                     # 创建一个管道
    path.config: "config/conf.d/*.conf"   # 导入配置文件
    # pipeline.output.workers: 1
  ```
  - pipelines.yml 可通过 - 创建多个管道，默认会继承 logstash.yml 全局作用域的配置。

## pipeline

### 原理

- Linux 系统上一般通过管道符筛选日志，比如 `cat test.log | grep ERROR'` 。而 Logstash 处理数据的机制也称为管道（pipeline），每条数据称为一个事件（event）。
- Logstash 可以运行多个管道，每个管道分为三个阶段：
  - input ：输入数据。
  - filter ：过滤、修改数据。该阶段可以省略。
  - output ：输出数据。

### 示例

通过命令行创建管道的示例：
1. 启动 Logstash ，运行一个简单的管道：
    ```sh
    bin/logstash -e 'input { stdin { } } output { stdout {} }'
    ```
    这里接收 stdin 输入的数据，没有 filter ，直接输出到 stdout 。

2. 此时在终端输入一个字符串 Hello ，按下回车，显示的输出如下：
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
        # codec => "plain"                      # 设置处理输入数据的格式。默认为 plain
        # include_codec_tag => true             # 是否给数据添加一个 tag ，记录 codec 信息。默认为 true ，使得每个 event 都有一个 beats_input_codec_plain_applied 标签
      }
      # kafka {             # 从 kafka 获取消息
      #   bootstrap_servers       => "localhost:9092"
      #   auto_commit_interval_ms => 5000
      #   auto_offset_reset       => "latest"
      #   codec                   => "json"
      #   consumer_threads        => 1
      #   group_id                => "logstash"
      #   topics_pattern          => "logstash.*"  # 根据正则表达式，订阅一些 topic
      # }
    }

    # filter {
    # }

    output {
      stdout {                                    # 输出到终端，便于调试
        # codec => rubydebug                      # 输出时默认采用 rubydebug 格式
        # codec => rubydebug { metadata => true } # 是否输出 @metadata 字段
      }
      # file {                                    # 输出到文件
      #   path  => "/tmp/logstash.log"
      #   codec => line {                                     # 逐行解析输入的文本
      #               format => "custom format: %{message}"   # 设置处理数据的格式。默认为 json_lines
      #               charset => "UTF-8"                      # 编码格式，默认为 UTF-8
      #            }
      # }
      elasticsearch {                             # 输出到 ES
        # 该插件会将 pipeline 的一组 batch event 放在一个 bulk 请求中发出，如果单个请求超过 20M 则拆分成多个请求
        hosts => "http://10.0.0.1:9200"
        # user                => "admin"
        # password            => "123456"
        # ssl_certificate_verification => true                            # 使用 HTTPS 连接时，是否验证 SSL 证书
        # http_compression    => false                                    # 是否对请求 body 进行 gzip 压缩
        # index               => "logstash-%{+yyyy.MM.dd}"                # 指定写入的索引名。可通过 %{} 插入变量，比如 %{[field]][sub_field]}
        # document_id         => "%{[@metadata][_id]}"                    # 指定写入的文档 id 。如果已存在相同 id 的文档，则会覆盖它
        # manage_template     => true                                     # Logstash 启动时，是否自动在 ES 中创建索引模板
        # template            => "/path/to/logstash/logstash-apache.json" # template 的配置文件，默认使用内置的模板
        # template_name       => "logstash"                               # template 的名称
        # template_overwrite  => false                                    # 如果 ES 中已存在同名 template ，是否覆盖它
        # retry_initial_interval  => 2                                    # 第 n 次重试之前等待 n*retry_initial_interval 秒
        # retry_max_interval      => 64                                   # 重试时的最大间隔时间
      }
    }
    ```
    - output 阶段，如果某个 event 输出失败，有几种处理措施：
      - 大部分情况下，会无限重试。
      - 如果 HTTP 响应码为 409 conflict ，则不会重试，丢弃 event 。
      - 如果 HTTP 响应码为 400 mapper_parsing_exception 或 404 ，表示不能重试，则打印报错日志，丢弃 event 。
        - 可启用死信队列，将这些 event 保存到 `data/dead_letter_queue/` 目录下，然后可通过 input.dead_letter_queue 插件读取。
      - 如果 HTTP 响应码为 403 pressure too high ，表示 ES 负载过大，拒绝了 bulk 请求。此时会自动重试，但这会导致 ES 的负载更大，可能返回 503 Unavailable ，最终导致 Logstash 放弃重试。因此建议增加 retry 的间隔。

2. 启动 Logstash ，运行指定的管道：
    ```sh
    bin/logstash -f config/pipeline.conf --log.level=debug
    ```

### 语法

pipeline 的语法与 Ruby 相似，特点如下：
- Hash 字典的键值对之间通过空格分隔，比如 `{"field1" => "A" "field2" => "B"}` 。
- 支持引用变量：
  - 用 `filed` 或 `[filed]` 的格式引用 event 的顶级字段。
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
    - `@metadata` 是一个内置字段，不会被 output 阶段输出，因此可以存储一些临时的子字段。
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
    ```sh
    if ![level] {                           # 如果字段不存在，则添加它
      add_field => { "level" => "DEBUG" }
    }
    ```

## 插件

### codec

- codec 类型的插件用于按特定的文本格式编码、解码数据，可以用于 pipeline 的 input 或 output 阶段。
- codec 插件举例：
  ```sh
  plain         # 纯文本，即不进行处理
  line          # 用于解码输入时，将每行文本视作一个 event 。用于编码输出时，将每个 event 保存成一行文本
  multiline     # 将连续的多行文本视作同一个 event 。不过该操作可以由 Beats 完成，减轻 Logstash 的工作量
  json          # 按 JSON 格式处理，忽略换行符、缩进
  json_lines    # 根据换行符 `\n` 将文本分成多行，每行视作一个 JSON 格式的 event
  rubydebug     # 按 Ruby 调试信息的格式处理
  ```

### grok

：一个 filter 插件，用于按正则表达式解析 event 中的某些字段。
- Kibana 网页上提供的开发工具包含了 grok debugger ，便于调试 grok pattern 。
- 例：
  1. 假设输入数据是一行纯文本格式的日志：
      ```sh
      2020-01-12 07:24:43.659+0000  INFO  10.0.0.1 User login successfully
      ```
  2. 编写一个 grok 表达式来解析：
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
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp}\s+(?<level>\S+)\s+(?<client_ip>\S+)\s+(?<message>.*)$" }  # 解析 message 字段，通过正则匹配提取内容另存为字段
      overwrite => [ "message" ]                        # 允许提取的这些字段覆盖 event 中已存在的字段
      # patterns_dir => ["config/patterns"]             # 加载 patterns 的定义文件
      # keep_empty_captures => false                    # 如果匹配到的字段为空，是否依然保留该字段
      # tag_on_failure => ["_grokparsefailure"]         # 如果匹配失败，则给 event 添加这些 tag
      # tag_on_timeout => ["_groktimeout"]              # 如果匹配超时，则给 event 添加这些 tag
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
  - 在 if 语句内可以调用 filter 插件，但反之不行。可以写成以下形式：
    ```sh
    if xxx {
      grok {}
      if xxx {
        grok {}
      }
    }
    ```
  - 如果输入数据的每行格式可能不同，则可以在 match 中指定多个表达式用于尝试匹配：
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

：一个 filter 插件，用于按 JSON 格式解析 event 的一个字段。
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

：一个 filter 插件，用于解析 event 的一个字段，获取时间。
- 例：
  ```sh
  if [timestamp] {
    date {
      match => ["timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSSZ", "UNIX", "UNIX_MS"]   # 指定源字段，然后可以指定多个尝试匹配的时间字符串格式
      remove_field => ["timestamp"]
      # target => "@timestamp"                      # 将解析之后的时间保存到该字段。如果该字段已存在，则覆盖它
      # tag_on_failure => ["_dateparsefailure"]
      timezone => "Asia/Shanghai"                   # 如果没有从源字段解析出时区，则采用该默认时区
    }
  }
  ```

### drop

：一个 filter 插件，用于丢弃一些 event 。
- 例：
  ```sh
  if [level] == "DEBUG" {
    drop {
      # percentage => 40      # 丢弃的概率大概为 40%
    }
  }
  ```

### mutate

：一个 filter 插件，用于修改 event 的一些字段。
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

：一个 filter 插件，用于查询 IP 地址对应地理位置，包括经纬度坐标、国家名、城市名等。
- 查询时的开销比较大。
- 例：
  ```sh
  geoip {
    source => "client_ip"                         # 存储 IP 地址的字段
    target => "geoip"                             # 存储查询结果的字段
    # database => "xx/xx/GeoLite2-City.mmdb"      # 用于查询的数据库文件。默认使用自带的免费 GeoLite2 数据库，并每天自动更新
    # cache_size => 1000                          # 缓存区的大小。查询一些重复 IP 或相邻 IP 时，使用缓存可以提高效率
    # tag_on_failure => ["_geoip_lookup_failure"]
  }
  ```

### ruby

：一个 filter 插件，用于嵌入 Ruby 代码。
- 例：
  ```sh
  ruby {
    code => "event.cancel if rand <= 0.90"    # 执行 Ruby 代码，这里是 90% 的概率取消 event
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

  def filter(event)           # 必须定义一个 filter(event) 函数，输入 event ，返回一个包含事件的数组
    if rand >= @drop_percentage
      return [event]
    else
      return []               # 返回一个空数组，这会取消 event
    end
  end
  ```
