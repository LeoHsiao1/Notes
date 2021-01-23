# ELK

：一套日志采集及展示方案，又称为 ELK Stack 或 Elastic Stack 。由 Elastic 公司发布。
- [官方文档](https://www.elastic.co/guide/index.html)
- [下载页面](https://www.elastic.co/cn/downloads/)

## 架构

ELk 系统主要用到以下软件：
- ElasticSearch
  - 用于存储数据，并支持查询。
- Logstash
  - 一个命令行工具，用于采集日志数据，并解析成格式化数据，发送到 ES 中存储。
  - 基于 Ruby 开发，通过 JRuby 解释器运行在 JVM 上。
- Kibana
  - 一个基于 node.js 运行的 Web 服务器，用于查询、展示 ES 中存储的数据。支持显示简单的仪表盘。

ELK 系统还可选择加入以下软件：
- Beats
  - 基于 Golang 开发，用于采集日志数据。比 Logstash 更轻量级，但功能较少。
- Elastic Agent
  - v7.8 版本新增的软件，用于采集日志数据。它集成了不同类型的 Beats 的功能。
- Observability
  - 为 Kibana 扩展了一些日志可视化的功能，比如实时查看日志、设置告警规则。
- Security
  - 用于监控一些安全事项。
- APM（Application Performance Monitoring）
  - 用于采集、监控应用程序的性能指标。
- Enterprise Search
  - 提供搜索功能，可以集成到业务网站的搜索栏中。

总结：
- 上述软件都是由 Elastic 公司开发。
  - 这些软件运行时可能需要 JDK、node.js 等环境，不过二进制发行版都已经自带了。
- 部署时，ELk 系统中各个软件的版本应该尽量一致，否则可能不兼容。
- ELK 系统普通发行版称为 OSS ，收费版本称为 X-Pack ，增加了身份认证、用户权限控制、告警、机器学习等功能。

## Kibana

### 部署

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/kibana/kibana-7.10.1-linux-x86_64.tar.gz
    ```

2. 解压后，编辑配置文件 config/kibana.yml ：
    ```yml
    server.port: 5601           # Kibana 监听的端口
    server.host: '10.0.0.1'     # Kibana 监听的 IP

    elasticsearch.hosts: ['http://10.0.0.1:9200']   # 连接到 ES ，可以指定多个 host ，如果前一个不能访问则使用后一个
    # elasticsearch.username: 'admin'
    # elasticsearch.password: '123456'

    # kibana.index: '.kibana'   # 在 ES 中创建该索引，存储 Kibana 的数据

    i18n.locale: 'zh-CN'        # 让 Kibana 网站显示中文
    ```

3. 启动：
    ```sh
    bin/kibana
    ```

### 用法

- 访问 URL `/status` 可查看 Kibana 本身的状态。
- 除了使用 Logstash、Beats 等服务采集日志数据，还可以在 Kibana 网站上直接上传日志文件，解析后存储到 ES ，便于测试。

- 在 Kibana 的管理页面，可以管理索引、数据流、索引模板、组件模板、索引模式。
- 建议在 Kibana 网站上进行以下设置：
  - 设置 Default 工作区，只显示 Kibana、Observability 中需要用到的部分功能，没必要显示 Enterprise Search、Security 等功能模块。
  - 将显示的日期格式设置为 `YYYY/MM/D HH:mm:ss` 。

### Discover

- Kibana 的 Discover 页面原本名为 Logs UI ，用于查询、查看日志。但现在扩展了用途，提供通用的 ES 可视化查询功能。
- 页面示例：

  ![](./ELK_discover.png)

  - 页面上侧是搜索栏，支持筛选时间范围。
  - 页面左侧可选择索引模式、添加筛选字段。
    - 注意要选择正确的索引模式，否则查询到的结果可能为空。
  - 页面中央是一个时间轴，显示每个时刻命中的 document 数量。
  - 页面中下方是一个列表，显示所有查询结果。
    - 每行一条 document ，点击某个 document 左侧的下拉按钮，就会显示其详细信息。
    - 默认显示 Time 和 _source 字段，可以在左侧栏中指定其它字段用作显示。
  - 点击页面右上角的 Save 按钮，就会保存当前查询页面，以便日后再次查看。

- 搜索时，默认使用 Kibana 自带的查询语言 KQL ，语法如下：
  - 用 `:` 表示等于关系：
    ```sh
    _index : "filebeat-0001"    # _index 字段等于指定的值
    agent_* : "filebeat-00*"    # 支持在字段名、值中使用通配符
    agent_name: *               # agent_name 字段存在
    not agent_name: *           # agent_name 字段不存在
    ```
  - 支持使用 `<`、`>`、`<=`、`>=` 比较运算符。
  - 支持使用 and、or、not 逻辑运算符：
    ```sh
    status_code : (401 or 403 or 404)
    status_code : 200 and not (tags : (success and info))
    ```

### Fleet

- Kibana 的 Fleet 页面原本名为 Ingest Manager ，用于批量管理 Elastic Agent 。

## Beats

- Logstash 消耗内存较多，采集日志的效率较低，因此后来推出了 Beats 来取代 Logstash 。
  - 不过目前 Beats 不擅长解析日志文本。因此通常不让 Beats 直接将原始日志发送到 ES ，而是先发送给 Logstash 解析成结构化数据。
  - 使用 Beats 时需要在每个要监控的主机上部署 Beats 程序，且监控不同类型的日志时需要部署不同的 beats 程序，比较麻烦。
- Beats 程序有多种类型，例如：
  - Filebeat ：用于采集日志文件。
  - Packetbeat ：用于采集网络数据包的日志。
  - Winlogbeat ：用于采集 Windows 的 event 日志。
  - Metricbeat ：用于采集系统或软件的性能指标。
  - Auditbeat ：用于采集 Linux Audit 进程的日志。
- 用户也可以基于 Beats 框架开发自定义的 Beats 程序。
- Beats 采集日志数据之后，支持多种输出端：
  - ES
  - Logstash
  - Kafka
    - 比如日志的并发量太大时，可以将采集的数据先发送到 Kafka 消息队列，然后让 Logstash 从中拿取数据。
  - Redis
  - File
  - Console
- 采集的每条日志称为一个日志事件（event），通常存储为 JSON 格式的结构化数据。
  - 每个日志事件会自动添加一个 `@timestamp` 字段。它采用 UTC 时区，默认取值为当前时刻。

## Filebeat

### 原理

- Filebeat 的主要模块：
  - input ：输入端。
  - output ：输出端。
  - harvester ：收割机，负责采集日志。
- Filebeat 会定期扫描（scan）日志文件，如果发现其最后修改时间改变，则创建 harvester 去采集日志。
  - 每个日志文件创建一个 harvester ，逐行读取文本，转换成日志事件，发送到输出端。
    - 每行日志文本必须以换行符分隔，最后一行也要加上换行符才能视作一行。
  - harvester 开始读取时会打开文件描述符，读取结束时才关闭文件描述符。
    - 默认会一直读取到文件末尾，如果文件未更新的时长超过 close_inactive ，才关闭。

- Filebeat 每次采集时，都会通过 registry 记录日志文件的当前状态信息（State）。
  - 即使只有一个日志文件被修改了，也会在 registry 文件中写入一次所有日志文件的当前状态。
  - registry 保存在 `data/registry/` 目录下，如下：
    ```sh
    data/registry/filebeat/
    ├── 237302.json         # 快照文件，使用最后一次动作的编号作为文件名
    ├── active.dat          # 记录快照文件的路径
    ├── log.json            # 记录日志文件的状态。该文件体积超过 10 MB 时会自动清空，并将此时所有文件的状态保存到快照文件中
    └── meta.json           # 记录一些元数据
    ```
  - 单个日志文件的记录示例：
    ```json
    {"op":"set", "id":237302}                             // 本次动作的编号
    {
      "k": "filebeat::logs::native::778887-64768",        // key ，由 beat 类型、日志文件的 id 组成
      "v": {
        "id": "native::778887-64768",                     // 日志文件的 id ，由 identifier_name、inode、device 组成
        "prev_id": "",
        "ttl": -1,                                        // -1 表示永不失效
        "type": "log",
        "source": "/var/log/supervisor/supervisord.log",  // 日志文件的路径（文件被重命名之后，并不会更新该参数）
        "timestamp": [2061628216741, 1611303609],         // 日志文件最后一次修改的 Unix 时间戳
        "offset": 1343,                                   // 当前采集的字节偏移量，表示最后一次采集的日志行的末尾位置
        "identifier_name": "native",                      // 识别日志文件的方式，native 表示原生方式，即根据 inode 和 device 编号识别
        "FileStateOS": {                                  // 文件的状态
          "inode": 778887,                                // 文件的 inode 编号
          "device": 64768                                 // 文件所在的磁盘编号
        }
      }
    }
    ```
    - 根据 inode 和 device 编号识别日志文件。
      - 因此日志文件被重命名时，也可能继续采集原 inode 对应的磁盘空间，直到关闭文件。
    - 根据 bytes offset 确定最后一次采集的位置。
      - 如果文件的体积减少，则 Filebeat 会重新从 offset 0 处开始读取，可能导致重复采集。
      - 切割日志时可能使日志文件的 inode 或 bytes offset 变化，导致遗漏采集、重复采集。
    - 删除 `data/registry/` 目录就会重新采集所有日志文件。

- 假设将日志文件 A 重命名为 B ，在类 Unix 系统上这样并不会中断其它进程对文件 A 的操作。需要分析：
  - 如果 harvester 没打开文件 A ，则以后会一直找不到路径为 A 的文件，不会采集它。
  - 如果 harvester 打开了文件 A ，则会一直读取该 inode 对应的磁盘空间，直到文件末尾才判断是否关闭：
    - 默认启用 close_removed 配置，因此会因为路径为 A 的文件不存在，而立即关闭已打开的文件。
      - 关闭之后，以后会一直找不到路径为 A 的文件，不会采集它。
    - 如果禁用 close_removed 配置，则会继续读取该 inode ，相当于读取文件 B 。比如等到 close_inactive 超时才关闭。
      - 此时，如果又出现一个路径为 A 的文件，则 Filebeat 会再创建一个 harvester 同时采集它。两个文件都会记录在 registry 中，只是 inode 不同。

- Filebeat 每次发送日志事件到输出端时，也会记录发送状态。
  - 如果不能连接到输出端，会每隔几秒尝试连接。
  - 如果发送日志事件到输出端失败，会自动重试。直到发送成功，才更新记录。
  - 每个日志事件只有成功发送到输出端，且收到确认接收的回复，才视作发送成功。
    - 因此，采集到的日志事件至少会被发送一次。但如果在确认接收之前重启 Filebeat ，则可能重复发送。

### 相关源码

这里分析 [filebeat/input/log/log.go](https://github.com/elastic/beats/blob/master/filebeat/input/log/log.go) 中的部分源码：

- 记录日志文件的结构体如下：
    ```go
    type Log struct {
        fs           harvester.Source   // 指向日志文件的接口
        offset       int64              // 采集的偏移量
        config       LogConfig          // 配置参数
        lastTimeRead time.Time          // 最后修改时间
        backoff      time.Duration      // backoff 的时长
        done         chan struct{}      // 一个通道，用于判断文件是否被关闭
    }
    ```

- 读取日志文件的主要逻辑如下：
    ```go
    func (f *Log) Read(buf []byte) (int, error) {
        totalN := 0                           // 记录总共读取的字节数

        for {                                 // 循环读取日志文件，一直读取到装满 buf 缓冲区
            select {
            case <-f.done:
                return 0, ErrClosed
            default:
            }

            // 开始读取之前，先检查文件是否存在
            err := f.checkFileDisappearedErrors()
            if err != nil {
                return totalN, err
            }

            // 读取文件的内容，存储到 buf 缓冲区中
            n, err := f.fs.Read(buf)          // 最多读取 len(buf) 个字节，并返回实际读取的字节数 n
            if n > 0 {                        // 如果读取到的内容不为空，则更新偏移量、最后读取时间
                f.offset += int64(n)
                f.lastTimeRead = time.Now()
            }
            totalN += n                       // 更新 totalN 的值

            // 如果 err == nil ，则代表读取没有出错，此时要么 buf 读取满了，要么读取到了文件末尾 EOF
            if err == nil {
                f.backoff = f.config.Backoff  // 重置 backoff 的时长，以供下次读取
                return totalN, nil            // 结束读取，返回总共读取的字节数
            }
            buf = buf[n:]                     // 更新 buf 指向的位置，从而使用剩下的缓冲区

            // 检查 err 的类型，如果它是 EOF 则进行处理
            err = f.errorChecks(err)

            // 如果读取出错，或者 buf 满了，则结束读取
            if err != nil || len(buf) == 0 {
                return totalN, err
            }

            // 如果读取没出错，buf 也没满，只是读取到了文件末尾，则等待 backoff 时长再循环读取
            logp.Debug("harvester", "End of file reached: %s; Backoff now.", f.fs.Name())
            f.wait()
        }
    }
    ```

- `checkFileDisappearedErrors()` 方法的定义如下：
    ```go
    func (f *Log) checkFileDisappearedErrors() error {
        // 如果没启用 close_renamed、close_removed 配置，则不进行检查
        if !f.config.CloseRenamed && !f.config.CloseRemoved {
            return nil
        }

        // 获取文件的状态信息（State），包括文件名、大小、文件模式、最后修改时间、是否为目录等
        info, statErr := f.fs.Stat()
        if statErr != nil {                   // 如果不能获取状态，则结束执行
            logp.Err("Unexpected error reading from %s; error: %s", f.fs.Name(), statErr)
            return statErr
        }

        // 检查文件是否被重命名
        // 原理为：获取已打开的文件 f 的 State ，再获取磁盘中当前路径为 f.Name() 的文件的 State ，如果两者的 inode、device 不同，则说明文件 f 当前的路径已经不是 f.Name()
        if f.config.CloseRenamed {
            if !file.IsSameFile(f.fs.Name(), info) {
                logp.Debug("harvester", "close_renamed is enabled and file %s has been renamed", f.fs.Name())
                return ErrRenamed
            }
        }

        // 检查文件是否被删除
        // 原理为：执行 os.Stat(f.Name()) ，如果没报错则说明磁盘中路径为 f.Name() 的文件依然存在
        if f.config.CloseRemoved {
            if f.fs.Removed() {
                logp.Debug("harvester", "close_removed is enabled and file %s has been removed", f.fs.Name())
                return ErrRemoved
            }
        }

        // 如果检查没问题，则返回 nil ，表示没有错误
        return nil
    }
    ```

- `errorChecks()` 方法的定义如下：
    ```go
    func (f *Log) errorChecks(err error) error {
        // 处理 err 不是 EOF 的情况
        if err != io.EOF {
            logp.Err("Unexpected state reading from %s; error: %s", f.fs.Name(), err)
            return err
        }

        // 以下处理 err 是 EOF 的情况

        // 判断文件是否支持继续读取，比如 stdin 就不支持
        if !f.fs.Continuable() {
            logp.Debug("harvester", "Source is not continuable: %s", f.fs.Name())
            return err
        }

        // 如果启用了 close_eof 配置，则结束执行
        if f.config.CloseEOF {
            return err
        }

        // 获取文件的状态信息
        info, statErr := f.fs.Stat()
        if statErr != nil {
            logp.Err("Unexpected error reading from %s; error: %s", f.fs.Name(), statErr)
            return statErr
        }

        // 如果文件的体积小于采集的偏移量，则认为发生了日志截断，结束执行
        if info.Size() < f.offset {
            logp.Debug("harvester",
                "File was truncated as offset (%d) > size (%d): %s", f.offset, info.Size(), f.fs.Name())
            return ErrFileTruncate
        }

        // 如果最后一次读取日志的时间，距离现在的时长超过 close_inactive ，则结束执行
        age := time.Since(f.lastTimeRead)
        if age > f.config.CloseInactive {
            return ErrInactive
        }

        // 此时，忽略 EOF 的错误，从而继续读取
        return nil
    }
    ```

### 部署

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.10.1-linux-x86_64.tar.gz
    ```

2. 启动：
    ```sh
    ./filebeat          # 在前台运行
              -e        # 将 filebeat 本身的输出发送到 stderr ，而不是已配置的 output
    ```

### 配置

- 编辑配置文件 filebeat.yml ：
    ```yml
    setup.kibana:               # kibana 的配置
      host: '10.0.0.1:5601'

    output.elasticsearch:       # 输出到 ES 的配置
      hosts: ['10.0.0.1:9200']
      # username: 'admin'
      # password: '123456'
      # index: 'filebeat-%{[agent.version]}-%{+yyyy.MM.dd}-%{index_num}'   # 用于存储日志事件的索引名

    # output.logstash:          # 输出到 Logstash 的配置
    #   hosts: ['localhost:5044']

    # 索引模板的配置
    # setup.template.name: "filebeat-%{[agent.version]}"    # 索引模板的名称
    # setup.template.pattern: "filebeat-*"                  # 索引模式
    # setup.template.settings:
    #   index.number_of_shards: 1
    #   index.number_of_replicas: 1
    #   _source.enabled: true
    ```
    - Filebeat 同时只能启用一种输出。
    - 如果修改了默认的索引名，则相应地还需要配置 `setup.template.name` 和 `setup.template.pattern` 参数，并在 Kibana 页面上配置索引模板、索引模式。
    - 如果 Filebeat 直接输出到 ES ，则会自动创建默认的索引模板。如果 Filebeat 直接输出到 Logstash ，则 ES 中可能一直缺少合适的索引模板。此时建议先让 Filebeat 连接到 ES 一次，进行初始化：
      ```sh
      ./filebeat setup  # 初始化，先连接到 ES 创建索引模板，再连接到 Kibana 创建仪表盘
      ```

- 所有类型的 beats 都支持以下 General 配置项：
  ```yml
  name: 'filebeat-001'        # 该 Beat 的名称，默认使用当前主机名
  tags: ['json']              # 给每条日志加上标签，保存到一个名为 tags 的字段中，便于筛选日志
  fields:                     # 给每条日志加上字段，这些字段默认保存到一个名为 fields 的子字典中
    env: test
    level: debug
  fields_under_root: false    # 是否将 fields 的各个字段保存为日志的顶级字段，此时如果与已有字段重名则会覆盖
  ```

- 可以启用 filebeat 的一些内置模块，采集一些系统或流行软件的日志文件。
  - [模块列表](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-modules.html)
  - 用法：
    ```sh
    ./filebeat modules
                      enable  [module]...   # 启用一些模块
                      disable [module]...   # 禁用一些模块
                      list                  # 列出启用、禁用的所有模块
    ```

- 可以在配置文件中让 filebeat 采集一些指定的日志文件：
  ```yml
  filebeat.inputs:                  # 关于输入项的配置
  - type: log                       # 定义一个输入项，类型为一般的日志文件
    paths:                          # 指定日志文件的路径
    - /var/log/mysql.log
    - '/var/log/nginx/*'            # 可以使用通配符

  - type: log
    paths:
      - '/var/log/apache/*'

    # fields:                       # 可以覆盖全局的 General 配置项
    #   apache: true
    # fields_under_root: true

    # enabled: true                       # 是否启用该输入项
    # encoding: utf-8                     # 编码格式
    # exclude_files: ['\.tgz$']           # 排除一些文件，采用正则匹配
    # include_lines: ['^WARN', '^ERROR']  # 只采集日志文件中的指定行，采用正则匹配。默认采集所有非空的行
    # exclude_lines: ['^DEBUG', '^INFO']  # 排除日志文件中的指定行，采用正则匹配。该规则会在 include_lines 之后生效

    # 如果启用任何一个以 json 开头的配置项，则会将每行日志文本按 JSON 格式解析，解析的字段默认保存到一个名为 json 的子字典中
    # json.keys_under_root: true    # 是否将解析的字典保存为日志的顶级字段
    # json.add_error_key: true      # 如果解析出错，则加入 error.message 等字段

    # 默认将每行日志文本视作一个日志事件，可以通过 multiline 规则将连续的多行文本记录成同一个日志事件。multiline 规则会在 include_lines 之前生效。
    # multiline.type: pattern       # 采用 pattern 方式，根据正则匹配处理多行。也可以采用 count 方式，根据指定行数处理多行
    # multiline.pattern: '^\s\s'    # 如果一行文本与 pattern 正则匹配，则按 match 规则与上一行或下一行合并
    # multiline.negate: false       # 是否反向匹配
    # multiline.match: after        # 取值为 after 则放到上一行之后，取值为 before 则放到下一行之前
    # multiline.max_lines: 500      # 多行日志最多包含多少行，超过的行数不会采集

    # scan_frequency: 10s           # 每隔多久扫描一次日志文件，如果有变动则创建 harvester 进行采集
    # ignore_older: 0               # 不扫描最后修改时间在多久之前的文件，默认不限制，可使用 5m、2h 等值。其值应该大于 close_inactive
    # harvester_buffer_size: 16384  # 每个 harvester 在采集日志时的缓冲区大小，单位 bytes
    # max_bytes: 10485760           # 每条日志文本的最大字节数，超过的部分不会采集。默认为 10 MB
    # tail_files: false             # 是否从文件的末尾开始，倒序读取
    # backoff: 1s                   # 如果 harvester 读取到文件末尾，则每隔多久检查一次文件是否更新

    # 配置 close_* 参数可以让 harvester 尽早关闭文件，但不利于实时采集日志
    # close_timeout: 0              # harvester 每次读取文件的超时时间，超时之后立即关闭。默认不限制
    # close_eof: false              # 如果 harvester 读取到文件末尾，则立即关闭
    # close_inactive: 5m            # 如果 harvester 读取到文件末尾之后，超过该时长没有读取到新日志，则立即关闭
    # close_removed: true           # 如果 harvester 读取到文件末尾之后，日志文件被删除，则立即关闭
    # close_renamed: false          # 如果 harvester 读取到文件末尾之后，日志文件被重命名，则立即关闭

    # 配置 clean_* 参数可以自动清理 registry 文件，但可能导致遗漏采集，或重复采集
    # clean_removed: true           # 如果日志文件在磁盘中被删除，则从 registry 中删除它
    # clean_inactive: 0             # 如果日志文件长时间未活动，则从 registry 中删除它。默认不限制。可使用 5m、2h 等值。其值应该大于 scan_frequency + ignore_older

  - type: container                 # 采集容器的日志
    paths:
      - '/var/lib/docker/containers/*/*.log'
  ```

## Logstash

### 部署

1. 下载二进制版：
    ```sh
    wget https://artifacts.elastic.co/downloads/logstash/logstash-7.10.1-linux-x86_64.tar.gz
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

### pipeline

- Logstash 通过运行管道（pipeline）来处理数据。每个管道主要分为三个阶段：
  - input ：输入项，用于接收数据。
  - filter ：过滤器，用于过滤、修改数据。是可选阶段。
    - 通常通过 grok 插件将纯文本格式的日志数据转换成 JSON 格式。
  - output ：输出项，用于输出数据。

- 通过命令行创建管道的示例：
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

- 通过配置文件创建管道的示例：
  1. 创建一个配置文件 `config/pipeline.conf` ，定义一个管道：
      ```sh
      input {
        # file {              # 读取文件作为输入
        #   path => "/var/log/http.log"
        # }
        beats {               # 接收 beats 的输入
          port => "5044"      # 监听一个 TCP 端口，供 beats 发送数据进来
          host => "0.0.0.0"
          client_inactivity_timeout => 300     # 如果 beats 连续 n 秒未活动，则关闭 TCP 连接。默认是 60 秒
          # beats 与 logstash 之间的通信不是采用 HTTP 协议，因此不支持 Basic Auth 认证
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
          hosts => ["http://localhost:9200"]
          # user                => "admin"
          # password            => "123456"
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

pipeline 的语法与 Ruby 相似，特点如下：
- Hash 字典的键值对之间通过空格分隔，比如 `{"field1" => "A" "field2" => "B"}` 。
- 支持引用变量：
  - 可以通过 `filed` 或 `[filed]` 的格式引用日志事件的顶级字段，通过 `[filed][sub_filed]...` 的格式引用子字段。
  - 可以通过 `%{filed}` 的格式获取字段的值。
  - 可以通过 `${VAR}` 的格式获取终端环境变量的值。
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
    - `@metadata` 字段不会被 output 阶段输出，适合存储一些临时的子字段。
- 支持使用 if 语句：
  - 支持使用 `<`、`>`、`<=`、`>=`、`==`、`!=` 比较运算符。
  - 支持使用 `=~` `!~` 运算符，判断左侧的字符串是否匹配右侧的正则表达式。
  - 支持使用 `and`、`or`、`!`、`not`、`not in` 逻辑运算符。
  - 例：
    ```sh
    filter {
      if [loglevel] == "DEBUG" {
        grok {...}
      }
      else if [loglevel] == "WARN" {
        grok {...}
      }
      else {
        grok {...}
      }
    }
    ```
    ```sh
    if [loglevel] =~ "DEBUG" or [loglevel] =~ "WARN" or [loglevel] =~ "ERROR"
    ```
    ```sh
    if [loglevel] in ["DEBUG", "WARN", "ERROR"]
    ```
    ```sh
    if "_grokparsefailure" not in [tags]    # 判断一个 tag 是否在 tags 字段中存在
    ```
    ```sh
    if [loglevel]                           # 判断一个字段是否存在，且取值不为 false、null
    ```

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
      %{TIMESTAMP_ISO8601:timestamp}\s+(?<loglevel>\S+)\s+(?<client_ip>\S+)\s+(?<message>.*)$
      ```
      - 可以按 `(?<field>pattern)` 的格式匹配字段。例如 `(?<loglevel>\S+)` 表示使用正则表达式 `\S+` 进行匹配，将匹配结果赋值给名为 loglevel 的字段。
      - 可以按 `%{NAME:field}` 的格式调用事先定义的正则表达式。例如 `%{TIMESTAMP_ISO8601:timestamp}` 表示使用一个名为 TIMESTAMP_ISO8601 的正则表达式进行匹配，将匹配结果赋值给名为 timestamp 的字段。

  3. grok 输出的结构化数据为：
      ```sh
      {
        "loglevel": "INFO",
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
  - grok 内置了一些 [patterns](https://github.com/logstash-plugins/logstash-patterns-core/blob/master/patterns/grok-patterns) 。
- 例：在 pipeline 的 filter 中使用 grok 插件
  ```sh
  filter {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp}\s+(?<loglevel>\S+)\s+(?<client_ip>\S+)\s+(?<message>.*)$" }  # 指定用于匹配的表达式
      overwrite => [ "message" ]                        # 用提取的字段覆盖日志事件中的字段
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

### date

- date 是一个 filter 插件，用于解析日志事件的一个字段，获取时间，赋值给 `"@timestamp` 字段。
- [官方文档](https://www.elastic.co/guide/en/logstash/current/plugins-filters-date.html)
- 例：
  ```sh
  date {
    match => ["timestamp", "UNIX", "UNIX_MS", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSSZ"]   # 指定源字段，然后可以指定多个尝试匹配的时间字符串格式
    # target => "@timestamp"                              # 要赋值的目标字段
    # tag_on_failure => ["_dateparsefailure"]
  }
  ```

### drop

- drop 是一个 filter 插件，用于丢弃一些日志。
- 例：
  ```sh
  if [loglevel] == "DEBUG" {
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
    strip      => ["field1"]                       # 删掉字段的值前后的空白字符
    split      => { "field1" => "," }              # 根据指定的字符分割一个字段的值，保存为数组形式
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
