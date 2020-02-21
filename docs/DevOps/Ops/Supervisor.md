# Supervisor

：一个进程管理工具，基于 Python 开发。
- 它可以启动、停止、监听进程，还提供了 Web 管理页面。
  - 它会监听进程的状态，发现进程异常终止时就立即重启。
- 采用 C/S 工作模式：
  - 运行一个守护进程 supervisord 作为服务器，负责管理进程。
  - 用户执行 supervisorctl 命令时，就是作为客户端与 supervisord 通信，发出控制命令。
- [官方文档](http://supervisord.org/index.html)

## 服务器

### 启动

- 用 yum 安装：
    ```sh
    yum install supervisor
    ```
- 启动：
    ```sh
    supervisord                           # 启动服务器
                -c /etc/supervisord.conf  # 使用指定的配置文件
    ```

### 配置

supervisor 默认使用`/etc/supervisord.conf`作为主配置文件（用于保存 supervisord 的配置），还会导入`/etc/supervisord.d/`目录下的其它配置文件（用于保存各个进程的配置）。
- 这些配置文件的后缀名为 .ini ，采用 ini 的语法。

`/etc/supervisord.conf`的内容示例：
```ini
[unix_http_server]
file=/var/run/supervisor/supervisor.sock   ; supervisor 的 sock 文件的路径
;chmod=0700                 ; sock 文件的权限(默认为 0700)
;chown=nobody:nogroup       ; sock 文件的 uid:gid

;[inet_http_server]         ; 启用 Web 管理页面
;port=127.0.0.1:9001
;username=user              ; 用户名（默认无）
;password=123               ; 密码（默认无）

[include]                   ; 导入其它配置文件
files = supervisord.d/*.ini
```

`/etc/supervisord.d/*.ini`的内容示例：
```ini
[program:ping]              ; 被管理的进程名
command=/bin/ping 127.0.0.1 ; 该进程的启动命令
;directory=/root            ; 工作目录（执行 command 之前会切换到该目录）
user=root                   ; 用哪个用户启动该进程
;numprocs=1                 ; 该进程要启动多少个副本
;priority=999               ; 进程启动的优先级，值越小则越优先启动

;autostart=true    ; 当 supervisord 启动时是否自动启动该进程
;autorestart=true  ; 当进程异常终止时是否自动重启
;startretries=3    ; 启动失败后的重试次数
;startsecs=1       ; 启动几秒后进程没有异常终止，就视作进程启动成功了
;exitcodes=0,2     ; 进程正常终止时的退出码，如果不取这些值则视作异常终止
;stopsignal=TERM   ; 当 supervisor 被用户要求终止该进程时，发送哪种信号（可以是 TERM、HUP、INT、QUIT、KILL、USR1、USR2）
;stopwaitsecs=10   ; 发送 stopsignal 信号之后，如果超过 stopwaitsecs 秒进程仍然没终止，则发送 SIGKILL 信号强制终止

stdout_logfile=/var/log/supervisor/%(program_name)s_stdout.log   ; stdout 日志文件的保存路径（该目录需要已存在）
stderr_logfile=/var/log/supervisor/%(program_name)s_stderr.log   ; stderr 日志文件的保存路径（该目录需要已存在）
;redirect_stderr=false                                           ; 是否把 stderr 重定向到 stdout
;stdout_logfile_maxbytes=50MB                                    ; stdout 日志文件的最大大小，超出则会循环写入，设置成 0 则不限制大小
;stdout_logfile_backups=10                                       ; stdout 日志文件的备份数量。设置成 0 则不备份
```
- **用 supervisor 启动的进程必须保持在前台运行，否则会脱离 supervisor 的控制，不能被捕捉输出，也不能被终止。**
- 用 supervisor 启动 python 进程时，由于 Python 不会自动刷新输出缓冲区，导致它不能被记录 stdout 和 stderr 的日志，需要用 python -u 的方式启动，禁用输出缓冲区。

## 客户端命令

```sh
supervisorctl
              start <name>             # 启动一个进程（name 为 all 时会选中配置文件中的所有进程）
              stop <name>
              restart <name>

              status                   # 查看所有进程的状态
              update                   # 重新加载配置文件

              reload                   # 重启 supervisord ，并重新加载其配置文件
              shutdown                 # 停止 supervisord
```
