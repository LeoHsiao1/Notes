# FTP

：文件传输协议（File Transfer Protocol）
- 于 1971 年发布，是一个陈旧、低效、不安全的传输协议。
- 采用 C/S 架构。
  - FTP 客户端可以从 FTP 服务器下载文件，或者上传文件到 FTP 服务器。
- 采用明文传输数据，容易被监听。

## ftp

：一个命令行工具，用作 FTP 客户端。
- 安装：`yum install ftp`

### 原理

- 客户端连接服务器的流程：
  1. 客户端使用本机随机一个端口创建 Socket ，连接到服务器的 TCP 21 端口，进行身份认证。称为 TCP 控制连接（control connection）。
  2. 登录成功之后，客户端可以执行多条数据命令，每条命令都需要建立一个新的 TCP 连接，称为 TCP 数据连接（data connection）。
      - 建立数据连接时，有两种模式：被动模式、主动模式。
- 被动模式（Passive mode）
  1. 通过 TCP 控制连接的信道，客户端发送 PASV 命令给服务器，表示请求以 Passive 模式连接服务器。
  2. 通过 TCP 控制连接的信道，服务器返回 PASV 响应，声明自己的 ip:port 地址，供客户端连接。
      - 这里的 port 是随机监听的一个端口号，只用于本次数据连接。
  3. 客户端根据上述 ip:port 地址，连接到服务器，建立一个 TCP 数据连接。
      - 客户端的防火墙不需要开通端口，但服务器的防火墙需要开通 21 端口和一组可能监听的端口，比如 21000~22000 。
  4. 通过 TCP 数据连接的信道，客户端发送数据命令给服务器，然后收到响应。
- 主动模式（Acitve mode）
  1. 通过 TCP 控制连接的信道，客户端发送 PORT 命令给服务器，声明自己的 ip:port 地址。
      - 这里的 port 是随机监听的一个端口号，只用于本次数据连接。
  2. 服务器使用 TCP 20 端口连接到客户端，建立 TCP 数据连接。
  3. 通过 TCP 数据连接的信道，客户端发送数据命令给服务器，然后收到响应。
      - 服务器的防火墙只需要开通一个端口，但客户端的防火墙需要开通一组可能监听的端口。
- 总之：
  - 主动模式需要服务器访问客户端，可能被客户端的防火墙拦截，因此被动模式更常用。
  - 主动模式、被动模式建立的 TCP 连接都是一次性使用的。客户端每执行一条数据命令（比如 ls、get），都需要建立一个新的 TCP 连接，效率低。

### 命令

- 打开客户端：
  ```sh
  ftp [host] [port]   # 连接一个 FTP 服务器（这会进入 FTP 客户端的终端）
      -A              # 采用主动模式
      -p              # 采用被动模式（默认）
  ```

- 进入 FTP 客户端之后可以执行以下命令：
  ```sh
  open [host]   # 连接服务器
  close         # 断开服务器
  bye           # 关闭客户端

  status        # 显示状态信息
  ascii         # 切换到 ASCII 码传输模式，可能会乱码
  binary        # 切换到二进制传输模式

  !ls           # 在本地执行 Shell 命令
  lcd [dir]     # 改变本地的工作目录

  ls      [path]                # 显示目录下的文件列表
  delete  [file]                # 删除文件
  mkdir   [dir]                 # 创建目录
  rmdir   [dir]                 # 删除目录（只能是空目录）
  get     [file] [local_file]   # 下载文件，保存到本地指定路径
  put     [local_file] [file]   # 上传文件，保存到服务器上指定路径

  prompt        # 开启或关闭交互模式。在同时操作多个文件时，每个文件都询问一次
  mls           # 同时操作多个文件，且支持使用通配符
  mdelete
  mget
  mput

  help          # 显示帮助信息
  debug         # 开启或关闭调试模式
  ```

### 例

- 连接 ftp 服务器：
  ```sh
  [root@CentOS ~]# ftp
  ftp> open 10.0.0.1
  Connected to 10.0.0.1 (10.0.0.1).
  220 (vsFTPd 3.0.2)
  Name (10.0.0.1:root): ftpuser         # 输入用户名
  331 Please specify the password.
  Password:                             # 输入密码
  230 Login successful.
  Remote system type is UNIX.
  Using binary mode to transfer files.
  ftp> ls -al
  227 Entering Passive Mode (10,0,0,1,208,236).   # 连接服务器，目标 IP 为 10.0.0.1 ，端口号为 208*256+236 ，因为每个字段采用 256 进制
  150 Here comes the directory listing.
  drwx------    3 1001     1001          112 Dec 11 10:50 .
  drwx------    3 1001     1001          112 Dec 11 10:50 ..
  -rw-r--r--    1 1001     1001           59 Dec 11 09:33 ftptest.txt
  -rw-r--r--    1 1001     1001           59 Dec 11 09:24 tmp.txt
  226 Directory send OK.
  ftp> pwd
  257 "/"
  ftp> cd /tmp
  550 Failed to change directory.     # 无权切换到其它目录
  ```

- 下载单个文件：
  ```sh
  ftp> get tmp.txt
  local: tmp.txt remote: tmp.txt
  227 Entering Passive Mode (10,0,0,1,191,105).
  150 Opening BINARY mode data connection for tmp.txt (59 bytes).
  226 Transfer complete.
  59 bytes received in 0.000218 secs (270.64 Kbytes/sec)
  ftp> !ls
  tmp.txt
  ftp> !cat tmp.txt
  20201211, 0915, zd_data, tmp.txt, just for test connection.
  ```

- 下载多个文件：
  ```sh
  ftp> prompt                         # 关闭交互模式，否则执行 mget 时会询问每个文件是否下载
  Interactive mode off.
  ftp> mget *.txt
  local: ftptest.txt remote: ftptest.txt
  227 Entering Passive Mode (10.0.0.1,161,64).
  150 Opening BINARY mode data connection for ftptest.txt (59 bytes).
  226 Transfer complete.
  59 bytes received in 0.000263 secs (224.33 Kbytes/sec)
  local: tmp.txt remote: tmp.txt
  227 Entering Passive Mode (10.0.0.1,184,27).
  150 Opening BINARY mode data connection for tmp.txt (59 bytes).
  226 Transfer complete.
  59 bytes received in 0.000201 secs (293.53 Kbytes/sec)
  ```

## vsftpd

：very secure ftp daemon ，一个加密型的 FTP 服务器。
- [官方文档](https://security.appspot.com/vsftpd/vsftpd_conf.html)
- 支持三种登录模式：
  - 匿名用户模式：允许任何客户端登录（用户名为 anonymous ，密码为空），最不安全。
  - 本地用户模式：通过 FTP 服务器所在主机的 SSH 账号登录，不够安全。
  - 虚拟用户模式：通过独立的账号登录，安全性最高。

### 安装

```sh
yum install vsftpd
systemctl start vsftpd
systemctl enable vsftpd
```

### 配置

vsftpd 的配置文件是 `/etc/vsftpd/vsftpd.conf` ，内容如下：
```ini
# 是否以 stand-alone 模式运行
# listen=YES
# listen_address=0.0.0.0
# listen_port=21
# ftp_data_port=20
# connect_from_port_20=NO
# 允许同时连接的客户端数。默认为 0 ，即无限制
# max_clients=0
# 同一客户端最多同时创建多少个连接。默认为 0 ，即无限制
# max_per_ip=0
# 使用被动模式连接的客户端的超时时间，单位为秒
# accept_timeout=60
# 使用主动模式连接的客户端的超时时间
# connect_timeout=60
# 如果一个客户端长时间空闲（即未执行 ftp 命令），超过该秒数，则服务器关闭该连接
# idle_session_timeout=300
# 如果一个客户端长时间停止传输数据，超过该秒数，则服务器关闭该连接
# data_connection_timeout=300
# use_sendfile=YES

# 允许客户端采用主动模式通信
# port_enable=YES
# 允许客户端采用被动模式通信
# pasv_enable=YES
# 被动模式下，服务器监听的最小端口号。默认为 0 ，即不限制
pasv_min_port=21000
# 被动模式下，服务器监听的最大端口号。默认为 0 ，即不限制
pasv_max_port=22000
# 被动模式下，服务器返回 PASV 响应时需要声明 ip:port 地址，供客户端连接。该 ip 默认是客户端建立 TCP 控制连接时的目标 ip ，也可通过 pasv_address 参数指定一个固定的 ip
# 如果 ftp 服务器通过 NAT 服务器暴露公网地址，供客户端访问，则 ftp 服务器不能感知到公网 ip 是多少，只能通过 pasv_address 参数指定公网 ip 。不过这会导致客户端不能通过内网 ip 连接服务器
# pasv_address=10.0.0.1
# 被动模式下，服务器默认会检查客户端建立 TCP 数据连接时的目标 ip ，是否与 TCP 控制连接相同。可将该参数改为 YES ，即使目标 ip 不同，也允许连接
# pasv_promiscuous=NO

# 允许用户下载文件
# download_enable=YES
# 允许用户写文件
write_enable=YES

# 限制用户只能访问家目录
chroot_local_user=YES
# 允许用户写家目录
allow_writeable_chroot=YES
# 通过 chroot() 函数限制 chroot_list_file 中的用户只能访问家目录。如果启用了 chroot_local_user ，则限制所有用户，除了 chroot_list_file 中的用户
# chroot_list_enable=YES
# 一个用户列表，每行记录一个用户名
# chroot_list_file=/etc/vsftpd.chroot_list
# 是否拒绝 userlist_file 中的用户登录
# userlist_enable=NO
# 一个用户列表，每行记录一个用户名
# userlist_file=/etc/vsftpd/user_list

# 是否将显示的时间转换到本地时区（默认为 UTC 时区）
# use_localtime=NO
# 开启日志
xferlog_enable=YES
# 日志文件的路径
xferlog_file=/var/log/vsftpd.log
```

### 匿名用户模式

1. 在 vsftpd.conf 中加入以下配置：
    ```ini
    # 只允许本地 IP 访问，否则匿名用户模式很危险
    listen_address=127.0.0.1
    # 是否启用匿名用户模式（默认启用）
    anonymous_enable=YES
    # 允许匿名用户上传文件
    anon-upload_enable=YES
    # 匿名用户上传的文件的 umask 值
    anon-umask=022
    # 匿名用户的家目录
    anon_root=/var/ftp
    # 允许匿名用户创建目录
    anon_mkdir_write_enable=YES
    # 允许匿名用户修改目录名、删除目录
    anon_other_write_enable=YES
    ```
    - 配置文件语法：
      - 等号 = 前后不能有空格。
      - 用 YES、NO 表示布尔值。
    - 修改配置文件之后，要重启服务才能生效：`systemctl restart vsftpd`

### 虚拟用户模式

这里是同时启用本地用户模式、虚拟用户模式，通过本地 SSH 用户的 PAM 模块完成虚拟用户的身份认证。

1. 在 vsftpd.conf 中加入以下配置：
    ```ini
    # 禁用匿名用户模式
    anonymous_enable=NO
    # 启用本地用户模式
    local_enable=YES
    # 启用虚拟用户模式
    guest_enable=YES
    # 虚拟用户映射到的 ssh 用户名，用于通过 PAM 模块进行身份认证。默认为 ftp
    # guest_username=ftp
    # 让虚拟用户拥有与本地用户相同的权限（默认只拥有匿名用户的权限）
    virtual_use_local_privs=YES
    # 采用指定的 /etc/pam.d/<service_name> 配置文件进行身份认证
    pam_service_name=vsftpd
    # 读取用户配置的目录
    user_config_dir=/etc/vsftpd/virtual_users_conf.d
    ```
    - 默认所有虚拟用户都映射到名为 ftp 的 SSH 用户，可选给每个虚拟用户单独创建 SSH 用户：
      ```sh
      useradd ftpuser1 -s /sbin/nologin -d /data/ftp/ftpuser1
      ```

2. 为每个虚拟用户单独创建配置文件：
    ```sh
    mkdir -p /etc/vsftpd/virtual_users_conf.d/
    vim /etc/vsftpd/virtual_users_conf.d/ftpuser1
    ```
    ```ini
    # 本地用户登录之后进入的家目录
    local_root=/data/ftp/ftpuser1
    # local_umask=077
    ```
    为每个虚拟用户创建家目录，并分配权限给相应的 ssh 用户：
    ```sh
    mkdir -p /data/ftp/ftpuser1
    chown -R ftp:ftp /data/ftp/ftpuser1
    ```

3. 创建一个临时的 virtual_users 文件，配置所有的虚拟用户名和密码：
    ```sh
    ftpuser1
    FnwKhwCWBo90
    ftpuser2
    XJo4lfLkJZX3
    ```
   然后将密码文件转换成加密数据库：
    ```sh
    yum install -y libdb-utils
    db_load -T -t hash -f virtual_users /etc/vsftpd/virtual_users.db
    chmod 600 /etc/vsftpd/virtual_users.db
    rm -f virtual_users
    ```
   创建一个 PAM 的配置文件 /etc/pam.d/vsftpd ，根据加密数据库验证用户身份：
    ```sh
    auth      required pam_userdb.so  db=/etc/vsftpd/virtual_users
    account   required pam_userdb.so  db=/etc/vsftpd/virtual_users
    ```

## sftp

：安全文件传输协议（Secure File Transfer Protocol），是基于 SSH 协议进行加密通信，兼容 FTP 的大部分功能。
- 优点：
  - sftp 与 ftp 相比，更安全。且服务器更简单，只需监听 SSH 22 端口，不需要监听 FTP 端口。
  - sftp 与 scp 相比，功能更多。
- 例：用 docker-compose 部署 sftp 服务器
  ```yml
  version: "3"

  services:
    sftp:
      container_name: sftp
      image: atmoz/sftp:alpine-3.7
      restart: unless-stopped
      ports:
        - '1022:22'
      volumes:
        - /etc/localtime:/etc/localtime:ro
        # - ./ssh:/etc/ssh/
        - ./users.conf:/etc/sftp/users.conf:ro
        - ./home:/home/
  ```
  - 建议执行 `docker cp sftp:/etc/ssh/` . 拷贝 ssh 目录并挂载，避免每次重建容器时 SSH 公钥变化
  在 users.conf 中配置账号：
  ```sh
  user1:123456:1001:100:files
  user2:123456:1002:100:files
  ```
  这会在容器中创建一个名为 user1 的用户，登录密码为 123456 ，uid 为 1001 ，gid 为 100 。还会在用户家目录下创建一个 files 目录：
  ```sh
  [root@CentOS ~]# ls -alh home/user1/
  total 0
  drwxr-xr-x 3 root root  19 Apr 6 16:41 .      # 家目录的所有权属于 root 用户，因此 user1 用户无权修改
  drwxr-xr-x 3 root root  18 Apr 6 16:41 ..
  drwxr-xr-x 3 1001 100   18 Apr 6 16:41 files  # 创建的子目录 files ，会自动分配所有权给 user1 用户
  ```

- 例：使用 sftp 客户端
  ```sh
  [root@CentOS ~]# ssh -p 1022 root@10.0.0.1
  This service allows sftp connections only.      # 使用 ssh 客户端会拒绝连接
  Connection to 10.0.0.1 closed.
  [root@CentOS ~]# sftp -P 1022 root@10.0.0.1
  Connecting to 10.0.0.1...
  sftp> pwd
  Remote working directory: /
  sftp> ls -alh
  drwxr-xr-x    0 0        0            4.0K Apr 6 16:41 .
  drwxr-xr-x    0 0        0            4.0K Apr 6 16:41 ..
  drwxr-xr-x    0 1001     100          4.0K Apr 6 16:41 files
  ```
