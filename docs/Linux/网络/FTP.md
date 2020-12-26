# FTP

：文件传输协议（File Transfer Protocol）
- 于 1971 年发布，是一个陈旧、低效、不安全的传输协议。
- 采用 C/S 架构。
- 采用明文传输数据，容易被监听。

## ftp

：一个 FTP 客户端软件。
- 安装：`yum install ftp`
- 通信时，客户端先使用本机随机一个端口创建 Socket ，连接到服务器的 21 端口。登录成功之后有两种通信模式：
  - 主动模式（Acitve mode）
    1. 客户端先随机监听一个端口，发送 PORT 命令给服务器。
    2. 服务器使用 20 端口连接到客户端的该端口，进行通信。
    - 服务器的防火墙只需要开通一个端口，但客户端的防火墙需要开通一组可能监听的端口。
  - 被动模式（Passive mode）
    1. 客户端发送 PASV 命令给服务器。
    2. 服务器随机监听一个端口。
    3. 客户端连接到服务器的该端口，进行通信。
    - 客户端的防火墙不需要开通端口，但服务器的防火墙需要开通 21 端口和一组可能监听的端口，比如 21000~21100 。
    - 客户端通常采用被动模式。
- 客户端不会保持 TCP 连接，每次执行指令都会根据通信模式重新建立连接。

### 用法

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
  227 Entering Passive Mode (10,0,0,1,208,236).   # 可见服务器的 IP 是 10.0.0.1 ，端口号是 208*256+236 ，因为每个字段采用 256 进制
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

：very secure ftp daemon ，一个加密型 FTP 服务器软件。
- [官方文档](https://security.appspot.com/vsftpd/vsftpd_conf.html)
- 支持三种登录模式：
  - 匿名用户模式：允许任何客户端登录（用户名为 anonymous ，密码为空），最不安全。
  - 本地用户模式：通过 FTP 服务器所在主机的 SSH 账号登录，不够安全。
  - 虚拟用户模式：通过独立的账号登录，安全性最高。

### 安装

```sh
yum install vsftpd
systemctl start vsftpd
```

### 配置

vsftpd 的配置文件是 `/etc/vsftpd/vsftpd.conf` ，内容如下：
```ini
# listen=YES                # 是否以 stand-alone 模式运行
# listen_address=0.0.0.0
# listen_port=21
# ftp_data_port=20
# connect_from_port_20=NO
# max_clients=0             # 允许连接的客户端数，设置为 0 则不限制
# accept_timeout=60         # 使用被动模式连接的客户端的超时时间，单位为秒
# connect_timeout=60        # 使用主动模式连接的客户端的超时时间

# port_enable=YES           # 允许客户端采用主动模式通信
# pasv_enable=YES           # 允许客户端采用被动模式通信
pasv_min_port=0             # 被动模式下，服务器监听的最小端口号，设置为 0 则不限制
pasv_max_port=0             # 被动模式下，服务器监听的最大端口号
pasv_address=10.0.0.1       # 被动模式下，服务器的 IP 地址，会让客户端连接到该 IP

# download_enable=YES       # 允许用户下载文件
write_enable=YES            # 允许用户写文件

chroot_local_user=YES                       # 限制用户只能访问主目录
allow_writeable_chroot=YES                  # 允许用户写主目录
# chroot_list_file=/etc/vsftpd.chroot_list
# chroot_list_enable=YES                    # 限制 chroot_list_file 中的用户只能访问主目录
# userlist_file=/etc/vsftpd/user_list       # 黑名单文件，每行记录一个用户名
# userlist_enable=YES                       # 拒绝 userlist_file 名单中的用户登录

# use_localtime=YES                         # 是否将显示的时间转换到本地时区（默认为 UTC 时区）
xferlog_enable=YES                          # 开启日志
xferlog_file=/var/log/vsftpd.log            # 日志文件的路径
```

### 匿名用户模式

1. 在配置文件中加入以下配置：
    ```ini
    listen_address=127.0.0.1      # 只允许本地 IP 访问，否则匿名用户模式很危险
    anonymous_enable=YES          # 是否启用匿名用户模式（默认启用）
    anon-upload_enable=YES        # 允许匿名用户上传文件
    anon-umask=022                # 匿名用户上传的文件的 umask 值
    anon_root=/var/ftp            # 匿名用户的主目录
    anon_mkdir_write_enable=YES   # 允许匿名用户创建目录
    anon_other_write_enable=YES   # 允许匿名用户修改目录名、删除目录
    ```
    - 配置文件语法：
      - 等号 = 前后不能有空格。
      - 用 YES、NO 表示布尔值。
    - 修改配置文件之后，要重启服务才能生效：`systemctl restart vsftpd`

### 虚拟用户模式

这里是同时启用本地用户模式、虚拟用户模式，通过本地 SSH 用户的 PAM 模块完成虚拟用户的身份认证。

1. 在配置文件中加入以下配置：
    ```ini
    anonymous_enable=NO
    local_enable=YES                        # 启用本地用户模式
    guest_enable=YES                        # 启用虚拟用户模式

    virtual_use_local_privs=YES             # 让虚拟用户拥有与本地用户相同的权限（默认只拥有匿名用户的权限）
    pam_service_name=vsftpd.vu              # 采用指定的 PAM 配置文件进行身份认证
    user_config_dir=/etc/vsftpd/users_conf  # 读取用户配置的目录
    ```

2. 为每个虚拟用户单独创建配置文件：
    ```sh
    mkdir /etc/vsftpd/users_conf/
    vim /etc/vsftpd/users_conf/ftpuser
    ```
    ```ini
    guest_username=ftpuser
    local_root=/home/ftpuser    # 本地用户登录之后进入的目录
    # local_umask=077
    ```

3. 为每个虚拟用户创建一个同名的 SSH 用户，以便通过 PAM 模块进行身份认证：
    ```sh
    useradd ftpuser -s /sbin/nologin
    ```
   创建一个临时的 users 文件，配置虚拟用户名和密码：
    ```sh
    ftpuser
    FnwKhwCWBo90
    # ftpuser2        # 可以配置多个用户
    # XJo4lfLkJZX3
    ```
   然后将密码文件转换成加密数据库：
    ```sh
    yum install -y libdb-utils
    db_load -T -t hash -f users /etc/vsftpd/users.db
    chmod 600 /etc/vsftpd/users.db
    rm -f users
    ```
   创建一个 PAM 的配置文件 /etc/pam.d/vsftpd.vu ，根据加密数据库验证用户身份：
    ```sh
    auth      required pam_userdb.so  db=/etc/vsftpd/users
    account   required pam_userdb.so  db=/etc/vsftpd/users
    ```
