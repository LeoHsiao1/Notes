# Supervisor

：一个进程管理工具，基于 Python 开发。
- 功能：
  - 可以启动、停止、监听进程，当进程退出时自动重启它。
  - 可以记录进程的 stdout、stderr 。
  - 提供了 Web 管理页面。
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
  - 然后要手动创建 supervisor 用到的目录，因为它不会自己创建。
    ```sh
    sudo mkdir /etc/supervisord.d/
    sudo mkdir /var/run/supervisor/
    sudo mkdir /var/log/supervisor/
    sudo chown -R leo:leo /etc/supervisord.d/
    sudo chown -R leo:leo /var/run/supervisor/
    sudo chown -R leo:leo /var/log/supervisor/
    ```

- 不能连接到外网时，需要拷贝 Python 库然后安装：
    ```sh
    tar -zxvf supervisor-4.1.0.tar.gz
    cd supervisor-4.1.0
    python setup.py install
    ```

## 配置

- 用户需要先在配置文件中定义要控制的进程，然后才能用 supervisor 管理。
- supervisor 默认使用`/etc/supervisord.conf`作为主配置文件（用于保存 supervisord 的配置）。
  - 还会导入`/etc/supervisord.d/`目录下的其它配置文件（用于保存各个进程的配置），这些配置文件的后缀名为 .ini ，采用 ini 的语法。

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
supervisor.rpcinterface_factory=supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor/supervisor.sock

[include]   ; 导入其它配置文件
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
autorestart=unexpected      ; 当进程启动成功之后退出时是否重启它
startsecs=1                 ; 进程启动之后保持运行多少秒，才视作进程启动成功了
startretries=3              ; 启动失败之后最多尝试重启多少次
;exitcodes=0,2              ; 如果进程以这些退出码退出，则视作正常退出（状态为 EXITED ），否则视作异常退出
;stopsignal=TERM            ; 当 supervisor 主动终止该进程时，发送哪种信号（可以是 TERM、HUP、INT、QUIT、KILL、USR1、USR2）
;stopwaitsecs=10            ; 发送 stopsignal 信号之后，如果超过 stopwaitsecs 秒进程仍然没退出，则发送 SIGKILL 信号强制终止

stdout_logfile=/var/log/supervisor/%(program_name)s_stdout.log   ; stdout 日志文件的保存路径（不配置的话就不会记录日志）
stdout_logfile_maxbytes=100MB                                    ; stdout 日志文件的最大大小，超出则会循环写入，设置成 0 则不限制大小
stdout_logfile_backups=0                                         ; 最多保存多少份以前的日志文件（按 *.1、*.2、*.3 格式编号），设置成 0 则不保存
;redirect_stderr=false                                           ; 是否把 stderr 重定向到 stdout
stderr_logfile=/var/log/supervisor/%(program_name)s_stderr.log   ; stderr 日志文件的保存路径
stderr_logfile_maxbytes=100MB
stderr_logfile_backups=0
```

- 进程的 command 不支持动态取值，比如：
  ```sh
  command=echo $PWD     # 执行结果相当于 echo '$PWD'
  command=echo `date`   # 执行结果相当于 echo '`date`'
  ```
  如果需要动态取值，建议将 command 保存到一个 sh 脚本中，然后执行该 sh 脚本。

- 用 supervisor 管理的进程必须保持在前台运行，否则会脱离 supervisor 的控制，不能捕捉它的 stdout、stderr ，也不能终止它。
- 用 supervisor 启动 Python 进程时， Python 解释器默认不会自动刷新输出缓冲区，导致不能记录该进程的 stdout、stderr 。因此需要用 python -u 的方式启动，禁用输出缓冲区。

- 当 supervisor 启动一个进程时（状态为 STARTING ）：
  - 如果进程在 startsecs 秒之内退出了（包括正常退出、异常退出），则视作启动失败（状态为 BACKOFF ），最多尝试重启 startretries 次（依然失败的话则状态为 FATAL ）。
  - 如果进程在 startsecs 秒之内没有退出，则视作进程启动成功了（状态为 RUNNING ）。
  - 如果进程在 startsecs 秒之后退出了，则根据 autorestart 策略决定是否重启它（不考虑 startretries ）。

- autostart 有三种取值，决定了进程（启动成功之后）退出时是否重启它：
  - true ：总是重启。
  - flase ：总是不重启。
  - unexpected ：异常退出时才重启，即退出码与 exitcodes 不同。

- 建议让 Supervisor 只保留一份日志，如下，另外用 logrotate 来按日期切割日志。
    ```ini
    stdout_logfile=/var/log/supervisor/%(program_name)s.out
    stdout_logfile_maxbytes=0
    stdout_logfile_backups=0
    redirect_stderr=true
    ```

## 操作命令

```sh
supervisorctl
              start <name>            # 启动指定名字的进程（name 为 all 时会选中所有已管理的进程）
              stop <name>             # 停止进程
              restart <name>          # 重启进程

              status                  # 查看所有进程的状态
              update                  # 重新加载配置文件

              reload                  # 重新加载配置文件（这会导致 supervisord 重启）
              shutdown                # 停止 supervisord
```
- 直接执行 supervisorctl 的话会进入其交互式终端。
- 使用 supervisorctl start 启动进程时，会阻塞前端 startsecs 秒。
- 修改了配置文件之后，总是要执行 supervisorctl reload 命令才会生效。
- 如果修改了 shell 的环境变量，要重启 supervisord 才会生效。

## 日志

supervisor 的日志文件默认保存在 `/var/log/supervisor/` 目录下，主要包括：
- supervisord.log ：记录了 supervisord 的日志，例如：
  ```
  2020-01-12 06:42:25,426 INFO exited: kafka-consumer (exit status 1; not expected)     # 进程退出了，且没有使用预期的退出码
  2020-01-12 06:42:25,496 INFO spawned: 'kafka-consumer' with pid 20535                 # 已重新启动进程
  2020-01-12 06:42:26,487 INFO success: kafka-consumer entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)  # 进程启动成功
  ```
- %(program_name)s_stdout.log ：记录了进程的 stdout 。
- %(program_name)s_stderr.log ：记录了进程的 stderr 。

## Cesi

：一个基于 Python3 的 Flask 开发的 Web 管理平台，可以统一管理多台主机上的 Supervisor 。
- 安装：
  ```sh
  wget https://github.com/gamegos/cesi/releases/download/v2.6.8/cesi-extended.tar.gz
  mkdir cesi/
  tar -zxvf cesi-extended.tar.gz -C cesi/
  cd cesi/
  pip3 install -r requirements.txt
  python3 cesi/run.py --config-file defaults/cesi.conf.toml
  ```
  - 启动之后，访问 <http://127.0.0.1:5000> 即可查看 Web 页面。默认的账号、密码为 admin、admin 。

- Cesi 的主配置文件是 defaults/cesi.conf.toml ，内容示例如下：
  ```conf
  [cesi]                            # 对 cesi 本身的配置
  database = "sqlite:///users.db"   # SQLite 数据库的位置
  activity_log = "activity.log"     # 日志文件的保存路径
  admin_username = "admin"
  admin_password = "admin"

  [[nodes]]                         # 对一个 Supervisor 节点的配置
  name = "node1"
  environment = "内网"              # 用于对 Supervisor 进行逻辑上的分组
  host = "127.0.0.1"
  port = "9001"
  username = ""                     # 用于登录 Supervisor 的账号
  password = ""
  ```
  - Cesi 将用户信息存储在 SQLite 数据库中，因此不能通过配置文件创建账号、修改密码，要在 Web 页面上操作。
