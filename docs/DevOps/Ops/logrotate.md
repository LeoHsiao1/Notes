# logrotate

：一个用于定期切割日志文件的工具。
- 可以避免日志文件体积过大，还可以将日志文件分日期管理。

## 安装

Centos默认安装了logrotate，也可以手动安装：
```shell
yum install crontabs logrotate
```

## 用法

- 在`/etc/logrotate.d/`目录下创建关于日志切割的配置文件即可。
- logrotate会被crontab定期启动，启动之后会读取自己的配置文件，据此执行日志切割任务。
- 可以手动启动logrotate，测试一下效果。

命令：
```shell
logrotate <configfile>  # 启动logrotate并读取某个配置文件
          -d            # 开启调试模式，此时不会影响实际的日志文件
          -f            # 强制执行一次日志切割（logrotate可能认为此时不需要进行日志切割）
```

## 配置

logrotate默认使用`/etc/logrotate.conf`作为主配置文件（用于保存logrotate本身的配置），还会导入`/etc/logrotate.d/`目录下的其它配置文件（用于保存各个日志切割任务的配置）。
- 这些配置文件不限制后缀名，采用logrotate自定的语法，用 # 声明单行注释。

例：编写一个`/etc/logrotate.d/nginx`
```
/usr/local/nginx/logs/*.log {   # 待切割的日志文件的绝对路径（如果有多个路径，则用空格分隔）
    daily                       # 每天轮询一次日志文件（还可设置weekly、monthly、yearly）
    missingok                   # 如果日志文件不存在，则忽略该错误
    notifempty                  # 如果日志文件为空，则不切割

    rotate 5                    # 最多存储5个归档日志，超过5个时则删掉最旧的归档日志
    # olddir /tmp/nginx         # 将归档日志放到指定目录下（默认放在源目录下），目标目录必须已存在
    dateext                     # 创建归档日志时，加上当前日志作为文件名后缀
    dateformat -%Y-%m-%d-%s     # 日期字符串的格式（这种格式形同 error.log-2019-12-23-1577083161 ）
    compress                    # 启用gzip压缩归档日志（后缀名为 .gz ）
    delaycompress               # 每次轮询生成的归档日志会等到下一次轮询时才压缩
    create 644 nginx nginx      # 以指定权限创建新的日志文件

    postrotate                  # 每次切割日志之后，执行postrotate与endscript之间的命令
      if [ -f /var/run/nginx.pid ]; then
          /bin/kill -USR1 `cat /var/run/nginx.pid`
      fi
    endscript
}
```

按照上述配置，logrotate会定期轮询（rotate）一次Nginx的日志文件，比如 error.log 。如果内容不为空，就创建一个归档日志 error.log-xx ，将 error.log 的文件描述符重定向到 error.log-xx 上，然后再以指定权限创建一个新的 error.log 文件，供Nginx写入新的日志。
- 不过此时必须要向Nginx发送 -USR1 信号，让它重新打开日志文件，刷新文件描述符。
  - 大部分进程收到 -USR1 信号之后会进行复位操作，比如重新加载配置文件、重新打开日志文件。
- 另一种做法：不创建新的 error.log ，而是将原 error.log 的内容拷贝到 error.log-xx 中。这样就不必让Nginx刷新文件描述符，但是在拷贝的过程中logrotate会一直占用 error.log 的文件描述符，导致Nginx不能写入日志。因此这种做法不够可靠。
