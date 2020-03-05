# FTP

：文件传输协议（File Transfer Protocol）
- 采用 C/S 工作模式。
- 默认使用 TCP 20 端口传输文件，使用 TCP 21 端口传输客户端发出的 FTP 指令。
- 采用明文传输数据，容易被监听。

## vsftpd

：very secure ftp daemon ，一个加密型 FTP 服务器软件。
- 支持三种登录模式：
  - 匿名用户模式：允许任何客户端登录（用户名为 anonymous ，密码为空）。最不安全。
    - 默认使用匿名用户模式，开放/var/ftp 目录供客户端访问。
  - 本地用户模式：用 FTP 服务器的 SSH 账号登录。当 FTP 的账号密码泄露时，服务器也会被破解。
  - 虚拟用户模式：为 FTP 客户端独立创建账号密码，存储在一个数据库中。安全性最高。
- 安装：
    ```sh
    yum install vsftpd
    systemctl enable vsftpd
    ```
- 修改配置文件 /etc/vsftpd/vsftpd.conf ：
    ```sh
    anonymous_enable=YES        # 启用匿名用户模式
    anon-upload_enable=YES      # 允许匿名用户上传文件
    anon-umask=022              # 匿名用户上传的文件的 umask 值
    anon_mkdir_write_enable=YES # 允许匿名用户创建目录
    anon_other_write_enable=YES # 允许匿名用户修改目录名、删除目录

    local_enable=NO             # 本地用户模式
    write_enable=YES            # 给本地用户写权限
    userlist_enable=YES         # 启用黑名单（/etc/vsftpd/user_list 和/etc/vsftpd/ftpusers）
    userlist_deny=YES           # 禁止/etc/vsftpd/user_list 中的用户登录

    guest_enable=NO             # 虚拟用户模式
    ```
    - 修改配置文件之后，要重启服务才能生效：systemctl restart vsftpd

## ftp

：一个 FTP 客户端软件。
- 安装：yum install ftp
- 用法：
  ```sh
  $ ftp <ip>    # 登录到一个 FTP 服务器（这会进入 FTP 客户端的终端）
  ```
