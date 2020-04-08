# SSH

：Secure Shell ，一个工作在应用层的安全网络协议，常用于远程登录、身份验证。
- SSH 最初是 Unix 系统上的一个程序，后来扩展到其他类 Unix 平台。
  - 主要有两个版本，SSH2 修复了 SSH1 的一些漏洞。
- 采用 C/S 工作模式，基于 TCP 协议通信。
- FTP、POP、Telnet 等网络通信协议采用明文传输数据，容易被监听。而 SSH 将数据经过非对称加密之后再传输，很安全。
- SSH 采用 C/S 工作模式工作。
  - SSH 服务器要运行一个守护进程 sshd ，监听发到某个端口（默认是 TCP 22 端口）的 SSH 请求。
  - SSH 客户端可采用 SecureCRT、Putty 等软件，向服务器发起 SSH 请求。
- 使用 SSH 客户端登录 SSH 服务器时，有两种认证方式：
  - 采用账号和密码认证：这容易被暴力破解密码，还可能受到“中间人攻击”（连接到一个冒充的 SSH 服务器）。
  - 采用密钥认证：先将 SSH 客户端的公钥放在 SSH 服务器上，当 SSH 客户端要登录时会发出该公钥的指纹，而 SSH 服务器会根据指纹检查 authorized_keys 中是否有匹配的公钥，有的话就允许该客户端登录。然后 SSH 服务器会用该公钥加密一个消息回复给 SSH 客户端，该消息只能被 SSH 客户端的私钥解密，这样就完成了双向认证。

## 使用 SSH 服务

安装：
```sh
yum install ssh
systemctl start sshd
```

用法：
```sh
$ ssh root@192.168.0.1    # 使用 ssh 登录到指定 ip 地址，用户名为 root
      -p 22        # 指定端口号
      [command]      # 登录之后执行一条命令
```

sshd 的主配置文件是 /etc/ssh/sshd_config ，内容示例：
```sh
Port 22                           # 监听的端口号
ListenAddress 192.168.0.1         # 允许连接的 IP

Protocol 2                        # SSH 协议的版本
HostKey /etc/ssh/ssh_host_rsa_key # 使用 SSH2 时，RSA 私钥的位置

PermitRootLogin yes               # 允许 root 用户登录
MaxAuthTries 6                    # 密码输错时的最多尝试次数
MaxSessions 10                    # 最多连接的终端数

PasswordAuthentication yes        # 允许用密码登录（否则只能用密钥登录）
PermitEmptyPasswords no           # 不允许用空密码登录
```
- 修改了配置文件之后，要重启 sshd 服务才能生效：systemctl restart sshd
- ~/.ssh/authorized_keys 文件中保存了一些公钥，允许拿着这些公钥的主机通过 SSH、以指定的用户名登录到本机。
- ~/.ssh/known_hosts 文件中保存了所有与本机进行过 SSH 连接的主机的公钥。下次再通过 IP 地址连接到这些主机时，如果其公钥发生变化，就可能是被冒充了。

## 相关命令

### ssh-keygen

```sh
$ ssh-keygen         # 生成一对 SSH 密钥（默认采用 RSA 加密算法）
            -r rsa   # 指定加密算法（默认是 rsa）
            -C "your_email@example.com"   # 添加备注信息
```
- 默认会将私钥文件 id_rsa 、公钥文件 id_rsa.pub 保存到 ~/.ssh/ 目录下。

### ssh-copy-id

```sh
$ ssh-copy-id root@10.0.0.1         # 将本机的 SSH 公钥拷贝给目标主机上的指定用户
              -i ~/.ssh/id_rsa.pub  # 指定要拷贝的 SSH 公钥
``` 
- 执行该命令时，需要先通过目标主机的身份验证，才拥有拷贝 SSH 公钥的权限。
- 该 SSH 公钥会被拷贝到目标主机的指定用户的 ~/.ssh/authorized_keys 文件中，允许以后本机以该用户的身份 SSH 免密登录到目标主机。

## SSH 白名单和黑名单

当 sshd 收到一个 SSH 或 telnet 的连接请求时，会先查看 /etc/hosts.allow 文件：
- 如果包含该 IP ，则建立 TCP 连接，开始身份验证。
- 如果不包含该 IP ，则查看 /etc/hosts.deny 文件：
  - 如果包含该 IP ，则拒绝连接。
  - 如果不包含该 IP ，则允许连接。

/etc/hosts.allow 的内容示例：
```
sshd:192.168.0.1
sshd:192.168.220.    # 允许一个网段
in.telnetd:192.168.0.1
```

/etc/hosts.deny 的内容示例：
```
sshd:ALL          # 禁止所有 IP
in.telnetd:ALL
```
- 修改了配置文件之后，要重启 sshd、telnet 服务才会生效。
