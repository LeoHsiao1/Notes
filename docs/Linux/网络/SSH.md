# SSH

：Secure Shell ，一个工作在应用层的安全网络协议，常用于远程登录、身份验证。
- SSH 最初是 Unix 系统上的一个程序，后来扩展到其他类 Unix 平台。
  - 主要有两个版本，SSH2 修复了 SSH1 的一些漏洞。
- 采用 C/S 架构，基于 TCP 协议通信。
- FTP、POP、Telnet 等网络协议采用明文传输数据，容易被监听。而 SSH 将数据经过非对称加密之后再传输，很安全。
- SSH 采用 C/S 架构工作。
  - SSH 服务器要运行一个守护进程 sshd ，监听发到某个端口（默认是 TCP 22 端口）的 SSH 请求。
  - SSH 客户端可采用 SecureCRT、Putty 等软件，向服务器发起 SSH 请求。
- 使用 SSH 客户端登录 SSH 服务器时，有两种认证方式：
  - 采用账号和密码认证：这容易被暴力破解密码，还可能受到“中间人攻击”（连接到一个冒充的 SSH 服务器）。
  - 采用密钥认证：先将 SSH 客户端的公钥放在 SSH 服务器上，当 SSH 客户端要登录时会发出该公钥的指纹，而 SSH 服务器会根据指纹检查 authorized_keys 中是否有匹配的公钥，有的话就允许该客户端登录。然后 SSH 服务器会用该公钥加密一个消息回复给 SSH 客户端，该消息只能被 SSH 客户端的私钥解密，这样就完成了双向认证。

## 服务器

运行 sshd 服务器：
```sh
yum install ssh
systemctl start sshd
systemctl enable sshd
```

sshd 的主配置文件是 /etc/ssh/sshd_config ，内容示例：
```
Port 22                           # 监听的端口号
ListenAddress 0.0.0.0             # 允许连接的 IP

AllowUsers root leo@10.0.0.1      # 只允许这些用户进行 SSH 登录。可以使用通配符 * 和 ? ，可以指定用户的 IP ，可以指定多个用户（用空格分隔）
AllowGroups *                     # 只允许这些用户组进行 SSH 登录

Protocol 2                        # SSH 协议的版本
HostKey /etc/ssh/ssh_host_rsa_key # 使用 SSH2 时，RSA 私钥的位置

PermitRootLogin yes               # 允许 root 用户登录
MaxAuthTries 6                    # 每个 TCP 连接的最多认证次数。如果客户端输错密码的次数达到该值的一半，则断开连接
MaxSessions 10                    # 最多连接的终端数

PasswordAuthentication yes        # 允许使用密码登录（否则只能使用密钥登录）
PermitEmptyPasswords no           # 不允许使用空密码登录
```
- 修改了配置文件之后，要重启 sshd 服务才会生效：systemctl restart sshd
- 默认在 ~/.ssh/authorized_keys 文件中保存了一些公钥，允许客户端使用这些公钥进行 SSH 认证，登录到本机。
- 默认在 ~/.ssh/known_hosts 文件中保存了所有与本机成功进行了 SSH 认证的主机的公钥。下次再连接到这些主机时，如果其公钥发生变化，则怀疑是被冒充了。

## 客户端

使用客户端：
```sh
$ ssh root@10.0.0.1          # 使用 ssh 服务，以 root 用户的身份登录指定主机
                  -p 22      # 指定端口号
                  [command]  # 执行一条命令就退出登录（不会打开新 shell ）
```
- 例：
    ```sh
    ssh root@10.0.0.1 "echo $HOSTNAME"  # 用双引号时，会先在本机读取变量的值，然后将命令发送到远端
    ssh root@10.0.0.1 'echo $HOSTNAME'  # 用单引号时，会先将命令发送到远端，然后在远端读取变量的值
    ```
- ssh 登录成功之后，会在目标主机上打开一个 shell 终端，并将 stdin、stdout 绑定到当前终端。
- ssh 连接 timeout 的可能原因：
  - 与目标主机的网络不通。
  - 目标主机没有运行 sshd 服务器，或者防火墙没有开通 22 端口。
  - 目标主机的负载太大，接近卡死，不能响应 ssh 连接请求。

- 通过 sshpass 命令可以传递密码给 ssh、scp 命令，如下：
  ```sh
  yum install sshpass
  sshpass -p 123456 ssh root@10.0.0.1
  ```

- 采用以下格式可以发送多行命令：
    ```sh
    ssh -tt root@10.0.0.1 << EOL
      uname -n
      echo hello
    exit
    EOL
    ```
  - `-tt` 选项用于强制分配伪终端，从而将远程终端的内容显示到当前终端。
  - 这里将 EOF 声明为定界符，将两个定界符之间的所有内容当作 sh 脚本发送到远程终端执行。
    甚至两个定界符之间的缩进空格，也会被一起发送。
  - 最后一条命令应该是 exit ，用于主动退出远程终端。

## 相关命令

### ssh-keygen

```sh
$ ssh-keygen          # 生成一对 SSH 密钥（默认采用 RSA 加密算法）
            -r rsa    # 指定加密算法（默认是 rsa）
            -C "123456@email.com"   # 添加备注信息
```
- 默认会将私钥文件 id_rsa 、公钥文件 id_rsa.pub 保存到 ~/.ssh/ 目录下。
- id_rsa.pub 的内容示例如下，只占一行，包括加密算法名称、公钥值、备注信息三个字段。
    ```
    ssh-rsa AAB3...mKu4S19Lw== root@Centos
    ```

### ssh-copy-id

```sh
$ ssh-copy-id root@10.0.0.1         # 将本机的 SSH 公钥拷贝给目标主机上的指定用户
              -i ~/.ssh/id_rsa.pub  # 指定要拷贝的 SSH 公钥
``` 
- 执行该命令时，需要先通过目标主机的身份验证，才拥有拷贝 SSH 公钥的权限。
- 该 SSH 公钥会被拷贝到目标主机的指定用户的 ~/.ssh/authorized_keys 文件中，允许以后本机以该用户的身份 SSH 免密登录到目标主机。

### 配置白名单和黑名单

当 Linux 收到一个 ssh 或 telnet 的连接请求时，会先查看 /etc/hosts.allow 文件：
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
