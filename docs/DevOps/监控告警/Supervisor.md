# Supervisor

：一个进程管理工具，基于 Python 开发。
- 功能：
  - 可以通过简单的命令来启动、停止进程，并且当进程异常退出时会自动重启它，类似于 systemd 。
  - 可以记录进程的 stdout、stderr 。
  - 提供了 Web 管理页面。
- 采用 C/S 架构：
  - 首先运行一个守护进程 supervisord ，然后由它以子进程的方式启动各个托管的进程。
  - 用户可以执行 supervisorctl 命令，通过与 supervisord 通信，来控制托管的进程。
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

- 或者下载 Python 库然后安装：
    ```sh
    wget https://github.com/Supervisor/supervisor/archive/4.1.0.tar.gz
    tar -zxvf supervisor-4.1.0.tar.gz
    cd supervisor-4.1.0
    python setup.py install
    ```

### 开机自启

虽然 Supervisor 能自动重启它托管的进程，但 supervisord 本身还不能自动重启。因此建议用 systemd 启动 supervisord ，从而保证 supervisord 能够开机自启、自动重启。步骤如下：
1. 添加配置文件 /usr/lib/systemd/system/supervisord.service ：
    ```ini
    [Unit]
    Description=Supervisor Daemon

    [Service]
    User=leo
    Group=leo
    Type=forking
    ExecStart=/usr/bin/supervisord -c /etc/supervisord.conf
    ExecStop=/usr/bin/supervisorctl shutdown
    ExecReload=/usr/bin/supervisorctl reload
    KillMode=process
    Restart=on-failure
    RestartSec=1s

    [Install]
    WantedBy=multi-user.target
    ```
2. 然后启动 supervisord ：
    ```sh
    systemctl start supervisord
    systemctl enable supervisord
    ```

## 配置示例

- 用户需要先在配置文件中定义要控制的进程，然后才能用 Supervisor 管理。
- Supervisor 默认使用 /etc/supervisord.conf 作为主配置文件（用于保存 supervisord 的配置）。
  - 还会导入 /etc/supervisord.d/ 目录下的其它配置文件（用于保存各个进程的配置），这些配置文件的后缀名为 .ini ，采用 ini 的语法。

### /etc/supervisord.conf

```ini
[unix_http_server]
file=/var/run/supervisor/supervisor.sock   ; supervisord 的 sock 文件的路径
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

- 使用非 root 用户启动 supervisord 时，它会因为无法创建某些目录而无法启动。因此建议采用以下措施：
  - 将配置文件中的 /var/run/ 路径改为 /var/log/
  - 手动创建以下目录，并分配权限：
    ```sh
    sudo mkdir /etc/supervisord.d/
    sudo mkdir /var/log/supervisor/

    sudo chown -R leo:leo /etc/supervisord.d/
    sudo chown -R leo:leo /etc/supervisord.conf
    sudo chown -R leo:leo /var/log/supervisor/
    ```
- 当 supervisord 开启了 inet_http_server 时，可以通过发出 HTTP 请求来管理该主机上的进程，如下：
    ```sh
    curl -L "http://10.0.0.1:9001/index.html?processname=ping&action=start" -u "admin:WJnhZdpFvtml"   # 启动
    curl -L "http://10.0.0.1:9001/index.html?processname=ping&action=stop" -u "admin:WJnhZdpFvtml"    # 停止
    curl -L "http://10.0.0.1:9001/index.html?processname=ping&action=restart" -u "admin:WJnhZdpFvtml" # 重启
    curl -L "http://10.0.0.1:9001/logtail/ping" -u "admin:WJnhZdpFvtml"                               # 查看日志
    ```

### /etc/supervisord.d/*.ini

```ini
[program:ping]              ; 被管理的进程名
command=/bin/ping 127.0.0.1 ; 该进程的启动命令
directory=/root             ; 工作目录（执行 command 之前会切换到该目录）
user=root                   ; 用哪个用户启动该进程
;environment=A="1",B="2"    ; 设置环境变量
;numprocs=1                 ; 该进程要启动多少个副本
;priority=999               ; 进程启动的优先级，值越小则越优先启动

autostart=true              ; 当 supervisord 启动时是否自动启动该进程
autorestart=unexpected      ; 当进程启动成功之后退出时是否重启它
startsecs=1                 ; 进程启动之后保持运行多少秒，才视作进程启动成功了
startretries=3              ; 启动失败之后最多尝试重启多少次
;exitcodes=0,2              ; 如果进程以这些退出码退出，则视作正常退出，否则视作异常退出
;stopsignal=TERM            ; 当 supervisord 主动终止该进程时，发送哪种信号（可以是 TERM、HUP、INT、QUIT、KILL、USR1、USR2）
;stopwaitsecs=10            ; 发送 stopsignal 信号之后，如果超过 stopwaitsecs 秒进程仍然没退出，则发送 SIGKILL 信号强制终止
;stopasgroup=false          ; 发送 stopsignal 信号时，是否发送给子进程
;killasgroup=false          ; 发送 SIGKILL 信号时，是否发送给子进程

stdout_logfile=/var/log/supervisor/%(program_name)s_stdout.log   ; stdout 日志文件的保存路径（不配置的话就不会记录日志）
stdout_logfile_maxbytes=100MB                                    ; stdout 日志文件的最大大小，超出则会循环写入，设置成 0 则不限制大小
stdout_logfile_backups=0                                         ; 最多保存多少份以前的日志文件（按 *.1、*.2、*.3 格式编号），设置成 0 则不保存
;redirect_stderr=false                                           ; 是否把 stderr 重定向到 stdout
stderr_logfile=/var/log/supervisor/%(program_name)s_stderr.log   ; stderr 日志文件的保存路径
stderr_logfile_maxbytes=100MB
stderr_logfile_backups=0

;[group:test]                       ; 创建一个 group ，便于同时管理多个 program
;programs=ping,program2,program3
```

- 如果 command 是执行一个可执行文件，则必须使用绝对路径，如下：
  ```ini
  command=./test.sh         # 错误
  command=/root/test.sh     # 正确
  ```
- command 不支持动态取值，如下：
  ```ini
  command=echo $PWD     # 执行结果相当于 echo '$PWD'
  command=echo `date`   # 执行结果相当于 echo '`date`'
  ```
  如果需要动态取值，建议将 command 保存到一个 sh 脚本中，然后执行该 sh 脚本。
- 用 supervisord 管理的进程必须保持在前台运行，否则会脱离 supervisord 的控制，不能捕捉它的 stdout、stderr ，也不能终止它。
- 用 supervisord 启动 Python 进程时， Python 解释器默认不会自动刷新输出缓冲区，导致不能记录该进程的 stdout、stderr 。因此需要用 python -u 的方式启动，禁用输出缓冲区。如下：
  ```ini
  command=python -u test.py
  ```

- 当 supervisord 启动一个进程时（状态为 STARTING ）：
  - 如果进程在 startsecs 秒之内退出了（包括正常退出、异常退出），则视作启动失败（状态为 BACKOFF ），最多尝试重启 startretries 次（如果依然失败则状态为 FATAL ）。
  - 如果进程在 startsecs 秒之内没有退出，则视作进程启动成功了（状态为 RUNNING ）。
  - 如果进程在 startsecs 秒之后退出了（包括正常退出、异常退出，状态为 EXITED ），则根据 autorestart 策略决定是否重启它（不受 startretries 限制）。
  - 如果进程在 startsecs 秒之后被用户通过 supervisorctl stop 命令主动停止了，则状态为 STOPPED 。

- 使用 supervisorctl start 启动进程时，至少会阻塞前端 startsecs 秒。

- autorestart 有三种取值，决定了进程（启动成功之后）退出时是否重启它：
  - true ：总是重启。
  - flase ：总是不重启。
  - unexpected ：异常退出时才重启，即退出码与 exitcodes 不同。

- 建议为进程只保留一份日志，另外用 logrotate 来按日期切割日志。配置如下：
    ```ini
    stdout_logfile=/var/log/supervisor/%(program_name)s.out
    stdout_logfile_maxbytes=0
    stdout_logfile_backups=0
    redirect_stderr=true
    ```

## supervisorctl 命令

```sh
supervisorctl
              start <name>    # 启动进程
              stop <name>     # 停止进程
              restart <name>  # 重启进程

              status          # 查看所有进程的状态
              update          # 重新加载发生改变的 /etc/supervisord.d/*.ini 配置文件（这会自动重启受影响的进程）

              shutdown        # 停止 supervisord
              reload          # 重启 supervisord（这会重新加载所有配置文件、重启所有进程）
```
- 直接执行 supervisorctl 命令会进入其交互式终端。
- `<name>` 有以下几种取值：
  - `all` ：选中当前主机上所有被 supervisord 管理的进程。
  - `program_name` ：只选中指定名字的进程。
  - `group_name` ：选中一个组内的所有进程。
  - `group_name:program_name` ：选中一个组内的指定进程。
- supervisord 启动的进程都是它的子进程，因此：
  - 如果修改了 shell 的环境变量，要重启 supervisord 才会生效。
  - 如果 supervisord 进程退出了，通常会自动终止它管理的各个进程。

## 日志

Supervisor 的日志文件默认保存在 `/var/log/supervisor/` 目录下，主要包括：
- supervisord.log ：记录了 supervisord 的日志，例如：
  ```
  2020-01-12 06:42:25,426 INFO exited: kafka-consumer (exit status 1; not expected)     # 进程退出了，且没有使用预期的退出码
  2020-01-12 06:42:25,496 INFO spawned: 'kafka-consumer' with pid 20535                 # 已重新启动进程
  2020-01-12 06:42:26,487 INFO success: kafka-consumer entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)  # 进程启动成功
  ```
- %(program_name)s_stdout.log ：记录了进程的 stdout 。
- %(program_name)s_stderr.log ：记录了进程的 stderr 。

## Cesi

：一个基于 Python3 的 Flask 开发的 Web 管理平台，可以统一管理多台主机上的 Supervisor （需要它们开启 inet_http_server ）。
- [Github 页面](https://github.com/gamegos/cesi)
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
  ```ini
  [cesi]                            # 对 cesi 本身的配置
  database = "sqlite:///users.db"   # SQLite 数据库的位置
  activity_log = "activity.log"     # 日志文件的保存路径
  admin_username = "admin"
  admin_password = "admin"

  [[nodes]]                         # 对一个 Supervisor 节点的配置
  name = "node1"
  environment = "内网"              # 用于对 Supervisor 进行逻辑上的分组
  host = "10.0.0.1"
  port = "9001"
  username = ""                     # 用于登录 Supervisor 的账号
  password = ""
  ```
  - Cesi 将用户信息存储在 SQLite 数据库中，因此不能通过配置文件创建账号、修改密码，要在 Web 页面上操作。
  - Cesi 只划分了两种用户权限：
    - Admin ：有权使用 Cesi ，并管理用户。
    - Normal User ：有权使用 Cesi 。
  - 可以通过 Environment 对各个 Supervisor 进行分组。
  - 可以通过 Group 对全部 Supervisor 中的进程进行分组（该 Group 参数在 Supervisor 中配置）。
  - 只要有一个 node 无法连接， Cesi 就会抛出异常，导致所有 node 都不会显示。

- Cesi 提供了一些 Restful API ：
   ```sh
   GET /api/v2/nodes/                                         # 获取全部 Supervisor 节点的信息
   GET /api/v2/nodes/<node_name>/                             # 获取指定节点的信息（包括节点信息、进程信息）
   GET /api/v2/nodes/<node_name>/processes/                   # 获取指定节点上全部进程的信息
   GET /api/v2/nodes/<node_name>/processes/<process_name>/    # 获取指定节点上的指定进程的信息

   GET /api/v2/nodes/<node_name>/processes/<process_name>/start/
   GET /api/v2/nodes/<node_name>/processes/<process_name>/stop/
   GET /api/v2/nodes/<node_name>/processes/<process_name>/restart/
   GET /api/v2/nodes/<node_name>/processes/<process_name>/log/

   GET /api/v2/nodes/<node_name>/all-processes/start/         # 启动指定节点上的全部进程
   GET /api/v2/nodes/<node_name>/all-processes/stop/
   GET /api/v2/nodes/<node_name>/all-processes/restart/
   ```
