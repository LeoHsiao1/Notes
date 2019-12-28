# FTP

：文件传输协议（File Transfer Protocol）
- 采用C/S架构。
- 默认使用TCP 20 端口传输文件，使用TCP 21 端口传输客户端发出的FTP指令。
- 采用明文传输数据，容易被监听。

## vsftpd

：very secure ftp daemon，一个加密型FTP服务器软件。
- 支持三种登录模式：
  - 匿名用户模式：允许任何客户端登录（用户名为anonymous，密码为空）。最不安全。
    - 默认使用匿名用户模式，开放/var/ftp目录供客户端访问。
  - 本地用户模式：用FTP服务器的SSH账号登录。当FTP的账号密码泄露时，服务器也会被破解。
  - 虚拟用户模式：为FTP客户端独立创建账号密码，存储在一个数据库中。安全性最高。
- 安装：
    ```sh
    yum install vsftpd
    systemctl enable vsftpd
    ```
- 修改配置文件 /etc/vsftpd/vsftpd.conf ：
    ```sh
    anonymous_enable=YES        # 启用匿名用户模式
    anon-upload_enable=YES      # 允许匿名用户上传文件
    anon-umask=022              # 匿名用户上传的文件的umask值
    anon_mkdir_write_enable=YES # 允许匿名用户创建目录
    anon_other_write_enable=YES # 允许匿名用户修改目录名、删除目录

    local_enable=NO             # 本地用户模式
    write_enable=YES            # 给本地用户写权限
    userlist_enable=YES         # 启用黑名单（/etc/vsftpd/user_list和/etc/vsftpd/ftpusers）
    userlist_deny=YES           # 禁止/etc/vsftpd/user_list中的用户登录

    guest_enable=NO             # 虚拟用户模式
    ```
    - 修改配置文件之后，要重启服务才能生效：systemctl restart vsftpd

## ftp

：一个FTP客户端软件。
- 安装：yum install ftp
- 命令：
```sh
$ ftp <ip>    # 登录到一个FTP服务器（这会进入FTP客户端的终端）
```
