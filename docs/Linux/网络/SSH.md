# SSH

：Secure Shell ，一个加密的网络传输协议，常用于远程登录、传输文件。
- 于 1995 年发布。
  - 最初是 Unix 系统上的一个程序，后来扩展到其他类 Unix 平台。
  - 主要有两个版本，SSH2 修复了 SSH1 的一些漏洞。
- 基于 TCP 协议通信，工作在应用层。
- 采用 C/S 架构工作。
  - SSH 服务器要运行一个守护进程 sshd ，监听发到某个端口（默认是 TCP 22 端口）的 SSH 请求。
  - SSH 客户端可采用 SecureCRT、Putty 等软件，向服务器发起 SSH 请求。
- FTP、Telnet、POP 等网络传输协议采用明文传输数据，容易被监听。而 SSH 将数据经过非对称加密之后再传输，很安全，但速度较慢。

## 服务器

运行 sshd 服务器：
```sh
yum install ssh
systemctl start sshd
systemctl enable sshd
```

sshd 的主配置文件是 `/etc/ssh/sshd_config` ，内容示例：
```sh
Port 22                           # 监听的端口号
ListenAddress 0.0.0.0             # 允许连接的 IP

AllowUsers root leo@10.0.0.1      # 只允许这些用户进行 SSH 登录。可以使用通配符 * 和 ? ，可以指定用户的 IP ，可以指定多个用户（用空格分隔）
AllowGroups *                     # 只允许这些用户组进行 SSH 登录

Protocol 2                        # SSH 协议的版本
HostKey /etc/ssh/ssh_host_rsa_key # 使用 SSH2 时，RSA 私钥的位置

MaxAuthTries 6                    # 每个 TCP 连接的最多认证次数。如果客户端输错密码的次数达到该值的一半，则断开连接
MaxSessions 10                    # 最多连接的终端数

PermitRootLogin yes               # 允许 root 用户登录
PasswordAuthentication yes        # 允许使用密码登录（否则只能使用 SSH 私钥登录）
PermitEmptyPasswords no           # 不允许使用空密码登录

UseDNS no                         # 不检查目标主机的主机名、 IP 是否与 DNS 一致，否则会增加建立 SSH 连接的耗时
StrictModes yes                   # 在 SSH 认证时检查用户的家目录、authorized_keys 等文件是否只被该用户拥有写权限
```
- 修改了配置文件之后，要重启 sshd 服务才会生效：`systemctl restart sshd`
- `~/.ssh/authorized_keys` 文件中保存了一些公钥，允许客户端使用对应的私钥进行 SSH 认证，登录到本机。
- `~/.ssh/known_hosts` 文件中保存了所有与本机成功进行了 SSH 认证的主机的公钥。下次再连接到这些主机时，如果其公钥发生变化，则怀疑是被冒充了。
- 如果 StrictModes 检查不通过，会拒绝 SSH 认证，并在 /var/log/secure 文件中报错 `Authentication refused: bad ownership or modes for file ~/.ssh/authorized_keys` ，此时建议执行：
  ```sh
  chmod 700   ~   ~/.ssh
  chmod 600   ~/.ssh/authorized_keys
  ```
- 使用 SSH 客户端登录 SSH 服务器时，有两种认证方式：
  - 账号和密码认证：容易被暴力破解密码，还可能受到“中间人攻击”（连接到一个冒充的 SSH 服务器）。
  - 密钥认证：先将 SSH 客户端的公钥放在 SSH 服务器上，当 SSH 客户端要登录时会发出该公钥的指纹，而 SSH 服务器会根据指纹检查 authorized_keys 中是否有匹配的公钥，有的话就允许该客户端登录。然后 SSH 服务器会用该公钥加密一个消息回复给 SSH 客户端，该消息只能被 SSH 客户端的私钥解密，这样就完成了双向认证。
- 为了避免恶意用户反复尝试 SSH 登录，进行暴力破解，可采取以下措施：
  - 使用复杂的 SSH 密码，或者只允许使用 SSH 密钥进行登录。
  - 禁止 root 用户远程登录，这样暴力破解时还需要猜测用户名。
  - 只允许白名单的 IP 登录。

### 白名单和黑名单

当 Linux 收到一个 ssh 或 telnet 的连接请求时，会先查看 /etc/hosts.allow 文件：
- 如果包含该 IP ，则建立 TCP 连接，开始身份认证。
- 如果不包含该 IP ，则查看 /etc/hosts.deny 文件：
  - 如果包含该 IP ，则拒绝连接。
  - 如果不包含该 IP ，则允许连接。

/etc/hosts.allow 的内容示例：
```sh
sshd:192.168.0.1
sshd:192.168.220.    # 允许一个网段
in.telnetd:192.168.0.1
```

/etc/hosts.deny 的内容示例：
```sh
sshd:ALL              # 禁止所有 IP
in.telnetd:ALL
```
- 修改了配置文件之后，要重启 sshd、telnet 服务才会生效。

## 客户端

使用客户端：
```sh
$ ssh root@10.0.0.1          # 使用 ssh 服务，以 root 用户的身份登录指定主机
                  -p 22      # 指定端口号
                  [command]  # 不打开远程主机的 shell ，而是以非交互模式执行一条命令
```
- 例：
  ```sh
  ssh root@10.0.0.1  ls -lh
  ssh root@10.0.0.1  "hostname | xargs echo"  # 用引号将待执行的命令标明为一个字符串，以免被特殊字符截断
  ssh root@10.0.0.1  'echo $HOSTNAME'         # 用单引号时，不会在本机读取变量的值，而是直接先将命令发送到远端去执行
  ```
- ssh 登录成功之后，会在目标主机上打开一个 shell 终端，并将 stdin、stdout 绑定到当前终端。
- ssh 连接 timeout 的可能原因：
  - 与目标主机的网络不通。
  - 目标主机没有运行 sshd 服务器，或者防火墙没有开通 22 端口。
  - 目标主机的负载太大，接近卡死，不能响应 ssh 连接请求。
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
- 通过 sshpass 命令可以传递密码给 ssh、scp 命令，如下：
  ```sh
  yum install sshpass
  sshpass -p 123456 ssh root@10.0.0.1
  ```
  但这样会将明文密码泄露到终端，比较危险。

## 相关命令

### ssh-keygen

```sh
$ ssh-keygen                        # 生成一对 SSH 密钥（默认采用 RSA 加密算法）
            -r rsa                  # 指定加密算法（默认是 rsa）
            -C "123456@email.com"   # 添加备注信息
```
- 默认会将私钥文件 id_rsa 、公钥文件 id_rsa.pub 保存到 ~/.ssh/ 目录下。
- id_rsa.pub 的内容示例如下，只占一行，包括加密算法名称、公钥值、备注信息三个字段。
  ```
  ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEArFUEBouVr03Wr8qpS2BDSDxi/HCIykWnepfVdafRHoAVcp/YxjiuszjKMRiNXY78yg4P5j9NB1+r0M9OrKkg0yspluWQDLX06EWr3l48+tVHLaCCF+JNJQIuFILvbu+/paKnM3pnCw3WROmJL/o/E75bLNowT5NSIEU2nDbJCvNIslD/VnhdXAoLyqio28McOp2Wie0fJ2x8s1vbLsjdURsr3AUO+KlAoVOgg5Ok7/RZ0ywcWE78IWkIluBQV7I0K5wia2TM+X0I3KvaX1xj5zp18+1X9UeQOEDU10mCZN+mig3Z1qJov1MPS19bMN4BhS5HXDTihW1yW+oRYptG0Q== root@CentOS-1
  ```

### ssh-copy-id

```sh
$ ssh-copy-id root@10.0.0.1         # 将本机的 SSH 公钥拷贝给目标主机上的指定用户
              -i ~/.ssh/id_rsa.pub  # 指定要拷贝的 SSH 公钥
``` 
- 执行该命令时，需要先通过目标主机的 SSH 认证，才有拷贝 SSH 公钥的权限。
- 该 SSH 公钥会被拷贝到目标主机的指定用户的 ~/.ssh/authorized_keys 文件中，允许以后本机以该用户的 SSH 私钥登录到目标主机。

### scp

：安全拷贝协议（Secure copy protocol），基于 SSH 协议加密通信，用于在主机之间拷贝文件。

用法：
```sh
$ scp
      <file>... root@10.10.0.1:/root  # 将本机的文件拷贝到其它主机（需要通过 SSH 认证）
      root@10.10.0.1:/root/f1 /root   # 将其它主机的文件拷贝到本机的指定目录
      -r                              # 递归操作（用于拷贝目录）
      -P 22                           # 指定 SSH 的端口
```

### sftp

：安全文件传输协议（Secure File Transfer Protocol），基于 SSH 协议加密通信，兼容 FTP 的大部分指令，比 scp 的功能更多。

例：
```sh
[root@CentOS ~]# sftp root@10.0.0.1
Connecting to 10.0.0.1...
sftp> pwd
Remote working directory: /root
sftp> ls
sftp> ls -l
drwxr-xr-x    2 root root     4096 Dec  7  2016 backup
-rw-r--r--    1 root root     6821 Dec 19  2019 test.py
-rwxrwxr-x    1 root root      115 Dec 21  2018 test.sh
sftp> get test.sh
Fetching /root/test.sh to test.sh
/root/test.sh                                                100%   6821  6.7KB/s   00:00
```
