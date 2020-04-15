# Supervisor

：一个进程管理工具，基于 Python 开发。
- 可以启动、停止、监听进程，还提供了 Web 管理页面。
- 可以监听进程的状态，发现进程异常终止时就立即重启。
- 采用 C/S 工作模式：
  - 运行一个守护进程 supervisord 作为服务器，负责管理进程。
  - 当用户执行 supervisorctl 命令时，就是作为客户端与 supervisord 通信，发出操作命令。
- [官方文档](http://supervisord.org/index.html)

## 安装

- 用 yum 安装：
    ```sh
    yum install supervisor
    ```
  然后启动：
    ```sh
    supervisord                           # 启动服务器
                -c /etc/supervisord.conf  # 使用指定的配置文件
    ```

- 或者安装 Python 库：
    ```sh
    pip install supervisor
    ```

## 配置

- 用户需要先在配置文件中定义要控制的进程，然后才能用 supervisor 管理。
- supervisor 默认使用`/etc/supervisord.conf`作为主配置文件（用于保存 supervisord 的配置）。
  - 还会导入`/etc/supervisord.d/`目录下的其它配置文件（用于保存各个进程的配置），这些配置文件的后缀名为 .ini ，采用 ini 的语法。
- **用 supervisor 管理的进程必须保持在前台运行，否则会脱离 supervisor 的控制，不能捕捉它的 stdout、stderr ，也不能终止它。**
- 用 supervisor 启动 Python 进程时， Python 解释器默认不会自动刷新输出缓冲区，导致不能记录该进程的 stdout、stderr 。因此需要用 python -u 的方式启动，禁用输出缓冲区。

`/etc/supervisord.conf`的内容示例：
```ini
[unix_http_server]
file=/var/run/supervisor/supervisor.sock   ; supervisor 的 sock 文件的路径
;chmod=0700                 ; sock 文件的权限(默认为 0700)
;chown=nobody:nogroup       ; sock 文件的 uid:gid

;[inet_http_server]         ; Web 管理页面（默认不启用）
;port=127.0.0.1:9001
;username=user
;password=123

[supervisord]
logfile=/var/log/supervisor/supervisord.log
;logfile_maxbytes=50MB
;logfile_backups=10
;loglevel=info
pidfile=/var/run/supervisord.pid
nodaemon=false

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor/supervisor.sock ; use a unix:// URL  for a unix socket

[include]                   ; 导入其它配置文件
files = supervisord.d/*.ini
```

`/etc/supervisord.d/*.ini`的内容示例：
```ini
[program:ping]              ; 被管理的进程名
command=/bin/ping 127.0.0.1 ; 该进程的启动命令
directory=/root             ; 工作目录（执行 command 之前会切换到该目录）
user=root                   ; 用哪个用户启动该进程
;numprocs=1                 ; 该进程要启动多少个副本
;priority=999               ; 进程启动的优先级，值越小则越优先启动

autostart=true              ; 当 supervisord 启动时是否自动启动该进程
autorestart=true            ; 当进程异常终止时是否自动重启
startretries=3              ; 启动失败后的重试次数
startsecs=1                 ; 启动几秒后进程没有异常终止，就视作进程启动成功了
exitcodes=0,2               ; 进程正常终止时的退出码，如果不取这些值则视作异常终止
;stopsignal=TERM            ; 当 supervisor 被用户要求终止该进程时，发送哪种信号（可以是 TERM、HUP、INT、QUIT、KILL、USR1、USR2）
;stopwaitsecs=10            ; 发送 stopsignal 信号之后，如果超过 stopwaitsecs 秒进程仍然没终止，则发送 SIGKILL 信号强制终止

stdout_logfile=/var/log/supervisor/%(program_name)s_stdout.log   ; stdout 日志文件的保存路径（该目录需要已存在）
stdout_logfile_maxbytes=100MB                                    ; stdout 日志文件的最大大小，超出则会循环写入，设置成 0 则不限制大小
stdout_logfile_backups=0                                         ; 备份多少个以前的 stdout 日志文件（按 *.1、*.2、*.3 格式编号），设置成 0 则不备份
;redirect_stderr=false                                           ; 是否把 stderr 重定向到 stdout
stderr_logfile=/var/log/supervisor/%(program_name)s_stderr.log   ; stderr 日志文件的保存路径（该目录需要已存在）
```

## 操作命令

```sh
supervisorctl
              start <name>            # 启动指定名字的进程（name 为 all 时会选中配置文件中的所有进程）
              stop <name>             # 停止进程
              restart <name>          # 重启进程

              status                  # 查看所有进程的状态
              update                  # 重新加载配置文件

              reload                  # 重启 supervisord ，并重新加载其配置文件
              shutdown                # 停止 supervisord
```

## 日志

supervisor 的日志文件默认保存在 `/var/log/supervisor/` 目录下，主要包括：
- supervisord.log ：记录了 supervisord 的日志，例如：
  ```
  2020-01-12 06:42:25,426 INFO exited: kafka-consumer (exit status 1; not expected)     # 进程异常终止了
  2020-01-12 06:42:25,496 INFO spawned: 'kafka-consumer' with pid 20535                 # 已重新启动进程
  2020-01-12 06:42:26,487 INFO success: kafka-consumer entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)  # 进程启动成功
  ```
- %(program_name)s_stdout.log ：记录了进程的 stdout 。
- %(program_name)s_stderr.log ：记录了进程的 stderr 。
