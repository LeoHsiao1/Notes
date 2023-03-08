# Filebeat

## 原理

### 采集日志

- Filebeat 每采集一条日志文本，都会保存为 JSON 格式的对象，称为日志事件（event）。
- Filebeat 的主要模块：
  - input ：输入端。
  - output ：输出端。
  - harvester ：收割机，负责采集日志。
- Filebeat 会定期扫描（scan）日志文件，如果发现其最后修改时间改变，则创建 harvester 去采集日志。
  - 对每个日志文件创建一个 harvester ，逐行读取文本，转换成日志事件，发送到输出端。
    - 每行日志文本必须以换行符分隔，最后一行也要加上换行符才能视作一行。
  - harvester 开始读取时会打开文件描述符，读取结束时才关闭文件描述符。
    - 默认会一直读取到文件末尾，如果文件未更新的时长超过 close_inactive ，才关闭。

- 假设让 Filebeat 采集日志文件 A 。轮换日志文件时，可能经常出现将文件 A 重命名为 B 的情况，比如 `mv A B` 。Filebeat 会按以下规则处理：
  - 如果没打开文件 A ，则以后会因为文件 A 不存在而采集不了。
    - 在类 Unix 系统上，当 Filebeat 打开文件时，允许其它进程重命名文件。而在 Windows 系统上不允许，因此总是这种情况。
  - 如果打开了文件 A ，则会继续读取到文件末尾，然后每隔 backoff 时间检查一次文件：
    - 如果在 backoff 时长之内又创建文件 A ，比如 `touch A` 。则 Filebeat 会认为文件被重命名（renamed）。
      - 默认配置了 `close_renamed: false` ，因此会既采集文件 A ，又采集文件 B ，直到因为 close_inactive 超时等原因才关闭文件 B 。
      - 此时两个文件的状态都会记录在 registry 中，文件路径 source 相同，只是 inode 不同。
    - 如果在 backoff 时长之后，依然没有创建文件 A 。则 Filebeat 会认为文件被删除（removed）。
      - 默认配置了 `close_removed: true` ，因此会立即关闭文件 B 而不采集，而文件 A 又因为不存在而采集不了。此时 Filebeat 的日志如下：
        ```sh
        2021-02-02T15:49:49.446+0800    INFO    log/harvester.go:302    Harvester started for file: /var/log/A.log      # 开始采集文件 A
        2021-02-02T15:50:55.457+0800    INFO    log/harvester.go:325    File was removed: /var/log/A.log. Closing because close_removed is enabled.   # 发现文件 A 被删除了，停止采集
        ```

### 注册表

- Filebeat 会通过 registry 文件记录所有日志文件的当前状态信息（State）。
  - 即使只有一个日志文件被修改了，也会在 registry 文件中写入一次所有日志文件的当前状态。
  - registry 保存在 `data/registry/` 目录下，如下：
    ```sh
    data/registry/filebeat/
    ├── 237302.json         # 快照文件，使用最后一次动作的编号作为文件名
    ├── active.dat          # 记录快照文件的路径
    ├── log.json            # 记录日志文件的状态。该文件体积超过 10 MB 时会自动清空，并将此时所有文件的状态保存到快照文件中
    └── meta.json           # 记录一些元数据
    ```
    - 删除该目录就会重新采集所有日志文件，这会导致重复采集。
- registry 中一个记录的示例：
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
  - 采集每个日志文件时，会记录已采集的字节偏移量（bytes offset）。
    - 每次 harvester 读取日志文件时，会从 offset 处继续采集。
    - 如果 harvester 发现文件体积小于已采集的 offset ，则认为文件被截断了，会从 offset 0 处重新开始读取。这可能会导致重复采集。

### 发送日志

- Filebeat 将采集的日志事件经过处理之后，会发送到输出端，该过程称为发布事件（publish event）。
  - event 保存在内存中，不会写入磁盘。
  - 每个 event 只有成功发送到输出端，且收到确认接收的回复，才视作发送成功。
    - 如果发送 event 到输出端失败，则会自动重试。直到发送成功，才更新记录。
    - 因此，采集到的 event 至少会被发送一次。但如果在确认接收之前重启 Filebeat ，则可能重复发送。

- 一个 event 的内容示例：
  ```json
  {
    "@timestamp":"2021-02-02T12:03:21.027Z",  // 自动加上该字段，记录当前时间戳
    "@metadata":{
      "beat": "filebeat",
      "type": "_doc",
      "version": "7.14.0"
    },
    "agent": {                                // Beats 的信息
      "type": "filebeat",
      "version": "7.14.0",
      "name": "CentOS-1",
      "hostname": "CentOS-1",
      "ephemeral_id": "ed02583b-0823-4e25-bed3-e8af69ad7d82",
      "id": "49f74a3e-bfec-452c-b119-32c8014b19b2"
    },
    "log": {
      "file": {                               // 采集的日志文件的路径
          "path": "/var/log/nginx/access.log"
      },
      "offset": 765072                        // 采集的偏移量
    },
    "message": "127.0.0.1 - [2/Feb/2021:12:02:34 +0000] GET /static/bg.jpg HTTP/1.1 200 0", // 日志的原始内容，之后可以进行解析
    "fields": {},                             // 可以给 event 加上一些字段
    "tags": [],                               // 可以给 event 加上一些标签，便于筛选
    ...
  }
  ```

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

## 部署

- 用 yum 安装：
  ```sh
  yum install https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-7.14.0-x86_64.rpm
  ```
  然后启动：
  ```sh
  # ./filebeat setup    # 可选择进行初始化。这会先连接到 ES 创建索引模板，再连接到 Kibana 创建仪表盘
  ./filebeat            # 在前台运行
            -c /etc/filebeat/filebeat.yml # 指定配置文件
            -e          # 将 filebeat 自身的日志输出到 stderr
  ```
- 在 k8s 中部署时，可参考[官方配置](https://github.com/elastic/beats/blob/main/deploy/kubernetes/filebeat-kubernetes.yaml) 。

## 配置

- 所有类型的 beats 都支持以下 General 配置项：
  ```yml
  name: 'filebeat-001'        # 该 Beat 的名称，默认使用当前主机名
  tags: ['json']              # 给每条日志加上标签，保存到一个名为 tags 的字段中，便于筛选日志
  fields:                     # 给每条日志加上字段，这些字段默认保存到一个名为 fields 的字段的子字典中
    project: test
  fields_under_root: false    # 是否将 fields 的各个字段保存为日志的顶级字段，此时如果与已有字段重名则会覆盖
  ```
  - 这些参数可以配置全局的，也可以给某个日志源单独配置。

- filebeat.yml 的基本配置：
  ```yml
  # path.config: ${path.home}                     # 配置文件的路径，默认是项目根目录
  # filebeat.shutdown_timeout: 0s                 # 当 Filebeat 关闭时，如果有 event 正在发送，则等待一定时间直到其完成。默认不等待
  # filebeat.registry.path: ${path.data}/registry # registry 文件的保存目录
  # filebeat.registry.file_permissions: 0600      # registry 文件的权限
  # filebeat.registry.flush: 0s                   # 每当 Filebeat 发布一个 event 到输出端，隔多久才刷新 registry 文件

  # 配置 filebeat 自身的日志
  logging.level: info                     # 只记录不低于该级别的日志
  logging.json: true                      # 输出的日志采用 JSON 格式
  logging.to_files: true                  # 将日志保存到文件 ./logs/filebeat
  # logging.to_stderr: true               # 将日志输出到终端
  # logging.metrics.enabled: true         # 是否在日志中记录监控信息，包括 filebeat 的状态、系统负载
  # logging.metrics.period: 30s           # 记录监控信息的时间间隔

  filebeat.config.modules:                # 加载模块
    path: ${path.config}/modules.d/*.yml
  ```

### output

- Filebeat 支持多种输出端：
  ```yml
  # 输出到终端，便于调试
  # output.console:
  #   pretty: true

  # 输出到 Logstash
  output.logstash:
    hosts: ['localhost:5044']

  # 输出到 ES
  # output.elasticsearch:
  #   hosts: ['10.0.0.1:9200']
  #   username: 'admin'
  #   password: '******'
  #   index: 'filebeat-%{[agent.version]}-%{+yyyy.MM.dd}-%{index_num}'   # 用于存储 event 的索引名

  # 输出到 kafka
  # output.kafka:
  #   hosts:
  #     - 10.0.0.1:9092
  #   topic: '%{[fields.project]}_log'
  #   partition.random:             # 随机选择每个消息输出的 kafka 分区
  #     reachable_only: true        # 是否只输出到可访问的分区。默认为 false ，可能输出到所有分区，如果分区不可访问则阻塞
  #   compression: gzip             # 消息的压缩格式，默认为 gzip ，建议采用 lz4 。设置为 none 则不压缩
  #   keep_alive: 10                # 保持 TCP 连接的时长，默认为 0 秒
  #   max_message_bytes: 10485760   # 限制单个消息的大小为 10M ，超过则丢弃
  ```
  - 同时只能启用一种输出端。

### processors

- 可以配置 processors ，在输出 event 之前进行处理：
  ```yml
  processors:
    - add_host_metadata:                  # 添加当前主机的信息，包括 os、hostname、ip 等
        when.not.contains.tags: forwarded # 如果该日志不属于转发的
    - add_docker_metadata: ~            # 如果存在 Docker 环境，则自动添加容器、镜像的信息。默认将 labels 中的点 . 替换成下划线 _
    - add_kubernetes_metadata: ~        # 如果存在 k8s 环境，则自动添加 Pod 等信息
    - drop_event:                         # 丢弃 event ，如果它满足条件
        when:
          regexp:
            message: "^DEBUG"
    - drop_fields:                        # 丢弃一些字段
        ignore_missing: true              # 是否忽略指定字段不存在的错误，默认为 false
        fields:
          - cpu.user
          - cpu.system
    - rate_limit:
        limit: 1000/m                     # 限制全局发送 event 的速率，时间单位可以是 s、m、h 。超过阈值的 event 会被丢弃
        # fields:                         # 设置 fields 时，则考虑指定的所有字段的组合值，对每组不同的值分别限制速率
        #   - log.file.path
  ```
  - processors 的详细语法见 [官方文档](https://www.elastic.co/guide/en/beats/filebeat/current/defining-processors.html) 。
  - 可以配置全局的 processors ，作用于采集的所有日志事件，也可以给某个日志源单独配置。
  - 配置了多个 processors 时，会按顺序执行。
  - 支持声明 processors 的触发条件：
    ```yml
    processors:
      - <processor_name>:
          <parameters>
          when:
            <condition>
      - if:
          <condition>
        then:
          - <processor>:
              <parameters>
          - <processor>:
              <parameters>
        else:
          - <processor>:
              <parameters>
    ```

### 文件日志

- 采集文件日志的配置示例：
  ```yml
  filebeat.inputs:                  # 关于输入项的配置
  - type: log                       # 定义一个输入项，类型为普通的日志文件
    paths:                          # 指定日志文件的路径
    - /var/log/mysql.log
    - '/var/log/nginx/*'            # 可以使用通配符

  - type: log
    # enabled: true                 # 是否启用该输入项
    paths:
      - '/var/log/apache/*'

    # fields:                       # 覆盖全局的 General 配置项
    #   project: test
    #   logformat: apache
    # fields_under_root: true

    # 如果启用任何一个以 json 开头的配置项，则会将每行日志文本按 JSON 格式解析，解析的字段默认保存到一个名为 json 的字段的子字典中
    # 解析 JSON 的操作会在 multiline 之前执行。因此建议让 filebeat 只执行 multiline 操作，将日志发送到 Logstash 时才解析 JSON
    # 如果 JSON 解析失败，则会将日志文本保存在 message 字段，然后输出
    # json.add_error_key: true      # 如果解析出错，则加入 error.message 等字段
    # json.message_key: log         # 指定存储日志内容的字段名。如果指定了该字段，当该字段为顶级字段、取值为字符串类型时，会进行 multiline、include、exclude 操作
    # json.keys_under_root: false   # 是否将解析的字典保存为日志的顶级字段
    # json.overwrite_keys: false    # 在启用了 keys_under_root 时，如果解析出的字段与原有字段冲突，是否覆盖

    # 默认将每行日志文本视作一个日志事件，可以通过 multiline 规则将连续的多行文本记录成同一个日志事件
    # multiline 操作会在 include_lines 之前执行
    # multiline.type: pattern       # 采用 pattern 方式，根据正则匹配处理多行。也可以采用 count 方式，根据指定行数处理多行
    # multiline.pattern: '^\s\s'    # 如果一行文本与 pattern 正则匹配，则按 match 规则与上一行或下一行合并
    # multiline.negate: false       # 是否反向匹配
    # multiline.match: after        # 取值为 after 则放到上一行之后，取值为 before 则放到下一行之前
    # multiline.max_lines: 500      # 多行日志最多包含多少行，超过的行数不会采集。默认为 500

    # exclude_files: ['\.tgz$']           # 排除一些正则匹配的文件
    # exclude_lines: ['^DEBUG', '^INFO']  # 排除日志文件中正则匹配的那些行
    # include_lines: ['^WARN', '^ERROR']  # 只采集日志文件中正则匹配的那些行。默认采集所有非空的行。该操作会在 exclude_lines 之前执行

    # encoding: utf-8               # 编码格式
    # scan_frequency: 10s           # 每隔多久扫描一次日志文件，如果有变动则创建 harvester 进行采集
    # ignore_older: 0s              # 不扫描最后修改时间在多久之前的文件，默认不限制时间。其值应该大于 close_inactive
    # harvester_buffer_size: 16384  # 每个 harvester 在采集日志时的缓冲区大小，单位 bytes
    # max_bytes: 102400             # 每条日志的 message 部分的最大字节数，超过的部分不会发送（但依然会读取）。默认为 10 M ，这里设置为 100 K
    # tail_files: false             # 是否从文件的末尾开始，倒序读取
    # backoff: 1s                   # 如果 harvester 读取到文件末尾，则每隔多久检查一次文件是否更新

    # 配置 close_* 参数可以让 harvester 尽早关闭文件，但不利于实时采集日志
    # close_timeout: 0s             # harvester 每次读取文件的超时时间，超时之后立即关闭。默认不限制
    # close_eof: false              # 如果 harvester 读取到文件末尾，则立即关闭
    # close_inactive: 5m            # 如果 harvester 读取到文件末尾之后，超过该时长没有读取到新日志，则立即关闭
    # close_removed: true           # 如果 harvester 读取到文件末尾之后，检查发现日志文件被删除，则立即关闭
    # close_renamed: false          # 如果 harvester 读取到文件末尾之后，检查发现日志文件被重命名，则立即关闭

    # 配置 clean_* 参数可以自动清理 registry 文件，但可能导致遗漏采集，或重复采集
    # clean_removed: true           # 如果日志文件在磁盘中被删除，则从 registry 中删除它
    # clean_inactive: 0s            # 如果日志文件长时间未活动，则从 registry 中删除它。默认不限制时间。其值应该大于 scan_frequency + ignore_older

    # 给该日志源单独配置 processors
    # processors:
    # - drop_event: ...
  ```
  - 配置时间时，默认单位为秒，可使用 1、1s、2m、3h 等格式的值。

- 可以启用 filebeat 的一些内置模块，自动采集一些系统或流行软件的日志文件，此时不需要用户自行配置。
  - 命令：
    ```sh
    ./filebeat modules
                      enable  [module]...   # 启用一些模块
                      disable [module]...   # 禁用一些模块
                      list                  # 列出启用、禁用的所有模块
    ```
  - filebeat 支持的 [模块列表](https://www.elastic.co/guide/en/beats/filebeat/current/filebeat-modules.html)

### 容器日志

- 采集容器日志的配置示例：
  ```yml
  filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log
    # stream: all                   # 从哪个流读取日志，可以取值为 stdout、stderr、all ，默认为 all
    # 兼容 type: log 的配置参数
  ```
  - 注意 docker 的日志文件默认需要 root 权限才能查看。

- 上述配置会采集所有容器的日志，而使用以下自动发现（autodiscover）的配置，可以只采集部分容器的日志：

- filebeat 支持对容器的自动发现（autodiscover），还支持从容器的元数据中加载配置，称为基于提示（hints）的自动发现。
  - 配置示例：
    ```yml
    filebeat.autodiscover:
      providers:
        # - type: docker              # 声明一个自动发现的日志源，为 docker 类型。这会调用内置 docker 变量模板
        #   templates:
        #     - condition:            # 只采集满足该条件的日志
        #         contains:
        #           docker.container.name: elasticsearch
        #       config:
        #         - type: container   # 该 container 是指 filebeat.inputs 类型，不是指 providers 类型
        #           paths:
        #             - /var/lib/docker/containers/${data.docker.container.id}/*.log
        #   hints.enabled: false      # 是否启用 hints ，从 Docker 容器的 Labels 加载配置
        #   hints.default_config:     # 设置默认的 hints 配置
        #     enabled: true           # 是否采集容器的日志，默认为 true 。如果禁用，则需要容器启用 co.elastic.logs/enabled 配置
        #     type: container
        #     paths:
        #       - /var/lib/docker/containers/${data.docker.container.id}/*.log  # Docker 引擎的日志路径

        - type: kubernetes
          node: ${NODE_NAME}
          hints.enabled: true     # 从 k8s Pod 的 Annotations 加载配置
          hints.default_config:
            type: container
            paths:
              - /var/log/containers/*-${data.kubernetes.container.id}.log   # CRI 标准的日志路径
            fields_under_root: true
    ```
  - provider 为 docker 类型时，可引用一些变量，比如：
    ```sh
    docker.container.id
    docker.container.image
    docker.container.name
    docker.container.labels
    ```
  - 使用 hints 功能时，可以在容器的 Labels 或 Annotations 中添加配置参数：
    ```sh
    co.elastic.logs/enabled: true     # 是否采集容器的日志，默认为 true
    co.elastic.logs/json.*: ...
    co.elastic.logs/multiline.*: ...
    co.elastic.logs/exclude_lines: '^DEBUG'
    co.elastic.logs/include_lines: ...
    co.elastic.logs/processors.dissect.tokenizer: "%{key2} %{key1}"
    ```
