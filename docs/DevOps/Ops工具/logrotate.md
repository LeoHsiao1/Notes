# logrotate

：一个用于定期切割日志文件的工具。
- 可以将单个日志文件分成多个不同日期的日志文件，便于管理。

## 安装

1. 需要先启动 crond 服务。
2. Centos 默认安装了 logrotate ，也可以手动安装：
    ```sh
    yum install logrotate
    ```

## 用法

- logrotate 安装之后不需要保持启动。它会被 crond 每天启动一次，启动之后会读取自己的配置文件，据此执行日志切割任务。
  - 配置文件默认保存在`/etc/logrotate.d/`目录下。
- 可以手动启动 logrotate ，测试一下效果：
    ```sh
    logrotate <configfile>  # 启动 logrotate 并读取某个配置文件
              -d            # 开启调试模式，此时不会影响实际的日志文件
              -f            # 强制执行一次日志切割（logrotate 可能认为此时不需要进行日志切割）
    ```

## 配置

logrotate 默认使用`/etc/logrotate.conf`作为主配置文件（用于保存 logrotate 本身的配置），还会导入`/etc/logrotate.d/`目录下的其它配置文件（用于保存各个日志切割任务的配置）。
- 这些配置文件不限制后缀名，采用 logrotate 自定的语法，用 # 声明单行注释。

例：编写一个`/etc/logrotate.d/nginx`
```
/usr/local/nginx/logs/*.log {   # 待切割的日志文件的绝对路径（如果有多个路径，则用空格分隔）
    daily                       # 每天轮询一次日志文件（还可设置 weekly、monthly、yearly）
    missingok                   # 如果日志文件不存在，则忽略该错误
    notifempty                  # 如果日志文件为空，则不切割

    rotate 5                    # 最多存储 5 个归档日志，超过 5 个时则删掉最旧的归档日志
    # olddir /tmp/nginx         # 将归档日志放到指定目录下（默认放在源目录下），目标目录必须已存在
    dateext                     # 创建归档日志时，加上当前日志作为文件名后缀
    dateformat -%Y-%m-%d-%s     # 日期字符串的格式（文件名示例： error.log-2019-12-23-1577083161 ）
    compress                    # 启用 gzip 压缩归档日志（后缀名为 .gz ）
    delaycompress               # 每次轮询生成的归档日志会等到下一次轮询时才压缩
    create 644 nginx nginx      # 以指定权限创建新的日志文件

    postrotate                  # 每次切割日志之后，执行 postrotate 与 endscript 之间的命令
      if [ -f /var/run/nginx.pid ]; then
          /bin/kill -USR1 `cat /var/run/nginx.pid`
      fi
    endscript
}
```

按照上述配置，logrotate 会定期轮询（rotate）一次 Nginx 的日志文件，比如 error.log 。如果内容不为空，就创建一个归档日志 error.log-xx ，将 error.log 的文件描述符重定向到 error.log-xx 上，然后再以指定权限创建一个新的 error.log 文件，供 Nginx 写入新的日志。
- 不过此时必须要向 Nginx 发送 -USR1 信号，让它重新打开日志文件，刷新文件描述符。
- 另一种做法：不创建新的 error.log ，而是将原 error.log 的内容拷贝到 error.log-xx 中。这样就不必让 Nginx 刷新文件描述符，但是在拷贝的过程中 logrotate 会一直占用 error.log 的文件描述符，导致 Nginx 不能写入日志。因此这种做法不够可靠。
