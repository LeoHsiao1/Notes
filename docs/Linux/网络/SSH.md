# SSH

：Secure Shell，一个工作在应用层的安全网络协议，常用于远程登录、身份验证。
- SSH最初是Unix系统上的一个程序，后来扩展到其他类Unix平台。
  - 主要有两个版本，SSH2修复了SSH1的一些漏洞。
- 采用C/S架构，基于TCP协议通信。
- FTP、POP、Telnet等网络通信协议采用明文传输数据，容易被监听。而SSH将数据经过非对称加密之后再传输，很安全。
- SSH采用C/S架构工作。
  - SSH服务器要运行一个守护进程sshd，监听发到某个端口（默认是TCP 22端口）的SSH请求。
  - SSH客户端可采用SecureCRT、Putty等软件，向服务器发起SSH请求。
- 使用SSH客户端登录SSH服务器时，有两种认证方式：
  - 采用账号和密码认证：这容易被暴力破解密码，还可能受到“中间人攻击”（连接到一个冒充的SSH服务器）。
  - 采用密钥认证：先将SSH客户端的公钥放在SSH服务器上，当SSH客户端要登录时会发出该公钥的指纹，而SSH服务器会根据指纹检查authorized_keys中是否有匹配的公钥，有的话就允许该客户端登录。然后SSH服务器会用该公钥加密一个消息回复给SSH客户端，该消息只能被SSH客户端的私钥解密，这样就完成了双向认证。

## 使用SSH服务

- 安装：
```sh
yum install ssh
systemctl start sshd
```
- 命令：
```sh
$ ssh root@192.168.0.1    # 使用ssh登录到指定ip地址，用户名为root
      -p 22        # 指定端口号
      [command]      # 登录之后执行一条命令
```

sshd的主配置文件是 /etc/ssh/sshd_config ，内容示例：
```sh
Port 22                           # 监听的端口号
ListenAddress 192.168.0.1         # 允许连接的IP

Protocol 2                        # SSH协议的版本
HostKey /etc/ssh/ssh_host_rsa_key # 使用SSH2时，RSA私钥的位置

PermitRootLogin yes               # 允许root用户登录
MaxAuthTries 6                    # 密码输错时的最多尝试次数
MaxSessions 10                    # 最多连接的终端数

PasswordAuthentication yes        # 允许用密码登录（否则只能用密钥登录）
PermitEmptyPasswords no           # 不允许用空密码登录
```
- 修改了配置文件之后，要重启sshd服务才能生效：systemctl restart sshd
- ~/.ssh/authorized_keys 文件中保存了一些公钥，允许拿着这些公钥的主机通过SSH、以指定的用户名登录到本机。
- ~/.ssh/known_hosts 文件中保存了所有与本机进行过SSH连接的主机的公钥。下次再通过IP地址连接到这些主机时，如果其公钥发生变化，就可能是被冒充了。

## 相关命令

```sh
$ ssh-keygen    # 生成一对SSH密钥（默认采用RSA加密算法）
```
- 默认会将私钥文件 id_rsa 、公钥文件 id_rsa.pub 保存到 ~/.ssh/ 目录下。

```sh
$ ssh-copy-id root@10.0.0.1         # 将本机的SSH公钥拷贝给某个主机上的某个用户
              -i ~/.ssh/id_rsa.pub  # 指定要拷贝的SSH公钥
``` 
- 执行该命令时，需要先通过目标主机的身份验证，拥有拷贝SSH公钥的权限。
- 该SSH公钥会保存到目标主机的 ~/.ssh/authorized_keys 文件中，允许以后本机直接以SSH的方式登录到目标主机。

## SSH白名单和黑名单

当sshd收到一个SSH或telnet的连接请求时，会先查看 /etc/hosts.allow 文件：
- 如果包含该IP，则建立TCP连接，开始身份验证。
- 如果不包含该IP，则查看 /etc/hosts.deny 文件：
  - 如果包含该IP，则拒绝连接。
  - 如果不包含该IP，则允许连接。

/etc/hosts.allow 的内容示例：
```
sshd:192.168.0.1
sshd:192.168.220.    # 允许一个网段
in.telnetd:192.168.0.1
```

/etc/hosts.deny 的内容示例：
```
sshd:ALL          # 禁止所有IP
in.telnetd:ALL
```
- 修改了配置文件之后，要重启sshd、telnet服务才会生效。
