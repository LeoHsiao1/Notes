# SSH

：Secure Shell ，一个加密的网络传输协议，常用于远程登录、传输文件。
- 于 1995 年发布。
  - 最初是 Unix 系统上的一个程序，后来扩展到其他类 Unix 平台。
  - 主要有两个版本，SSH2 修复了 SSH1 的一些漏洞。
- 基于 TCP 协议通信，工作在应用层。
- 采用 C/S 架构工作。
  - SSH 服务器要运行一个守护进程 sshd ，监听发到某个端口（默认是 TCP 22 端口）的 SSH 请求。
  - SSH 客户端可采用 SecureCRT、Putty 等软件，向服务器发起 SSH 请求。
- FTP、Telnet、POP 等网络传输协议采用明文传输数据，容易被监听、窃取。而 SSH 将数据经过非对称加密之后再传输，很安全，但传输耗时大了点。

## 服务器

### 部署

- 运行 sshd 服务器：
  ```sh
  yum install ssh
  systemctl start sshd
  systemctl enable sshd
  ```

- 或者运行 docker 镜像：
  ```sh
  docker run -d -p 10022:22 --name sshd \
      -e SSH_ENABLE_ROOT=true \
      -e SSH_ENABLE_ROOT_PASSWORD_AUTH=true \
      panubo/sshd:1.5.0
  ```
  - 需要进入容器，手动修改 root 密码。

### 配置

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
StrictModes yes                   # 被其它主机以密钥方式 SSH 登录时，检查用户的家目录、authorized_keys 的文件权限，只允许被该用户访问，否则存在被其他用户篡改的风险，拒绝 SSH 登录
```
- 修改了配置文件之后，要重启 sshd 服务才会生效：`systemctl restart sshd`
- 如果 StrictModes 检查不通过，则 sshd 会拒绝 SSH 登录，并在 `/var/log/secure` 文件中报错 `Authentication refused: bad ownership or modes for file ~/.ssh/authorized_keys` 。此时需要调整文件权限：
  ```sh
  chown `id -u`:`id -g` ~  ~/.ssh
  chmod 700 ~  ~/.ssh
  chmod 600 ~/.ssh/authorized_keys
  ```
- 使用 SSH 客户端登录 SSH 服务器时，有两种认证方式：
  - 用户名加密码认证
    - ：登录时指定用户名，然后按提示输入密码。
    - 优点：
      - 可设置方便记忆的密码。
    - 缺点：
      - 每次登录时需要手动输入密码。
      - 采用弱密码时容易被暴力破解。
  - 密钥认证
    - ：先将 SSH 客户端的公钥放在 SSH 服务器上，当 SSH 客户端要登录时会发出该公钥的指纹，而 SSH 服务器会根据指纹检查 authorized_keys 中是否有匹配的公钥，有的话就允许该客户端登录。然后 SSH 服务器会用该公钥加密一个消息回复给 SSH 客户端，该消息只能被 SSH 客户端的私钥解密，这样就完成了双向认证。
    - 优点：
      - 很安全。
      - 每次登录时不需要手动输入密码，又称为免密登录。
    - 缺点：
      - 密钥文件只能拷贝，不方便人记忆。
- 为了避免恶意用户频繁尝试 SSH 登录，进行暴力破解，可采取以下安全措施：
  - 使用复杂的 SSH 密码，或者只允许使用 SSH 密钥进行登录。
  - 禁止 root 用户远程登录，创建其它用户并分配 root 权限，这样暴力破解时还需要猜测有效的用户名。
  - 只允许白名单中的 IP 登录，比如只允许内网 IP 。

### 白名单、黑名单

当 Linux 收到一个 ssh 或 telnet 的连接请求时，会先查看 `/etc/hosts.allow` 文件：
- 如果包含该 IP ，则建立 TCP 连接，开始身份认证。
- 如果不包含该 IP ，则查看 /etc/hosts.deny 文件：
  - 如果包含该 IP ，则拒绝连接。
  - 如果不包含该 IP ，则允许连接。

- `/etc/hosts.allow` 的内容示例：
  ```sh
  sshd:10.0.0.1
  sshd:10.0.0.    # 允许一个网段
  in.telnetd:10.0.0.1
  ```

- `/etc/hosts.deny` 的内容示例：
  ```sh
  sshd:ALL              # 禁止所有 IP
  in.telnetd:ALL
  ```
  - 修改了配置文件之后，要重启 sshd、telnet 服务才会生效。

## 客户端

### 命令

```sh
$ ssh <user>@<host>   # 使用 ssh 协议，以 user 用户（默认为 root ）的身份登录 host 主机
      -p 22           # 指定端口号
      [command]       # 不打开远程主机的 shell ，而是以非交互模式执行一条命令

      # 建立 SSH 连接的同时，可以运行一个代理服务器
      # bind_address 默认为 localhost ，绑定到其它地址时需要在 sshd_config 中设置 GatewayPorts=yes
      -L [bind_address:]<bind_port>:<host>:<port>   # 让本地的 ssh 进程监听 bind_port 端口，将该端口收到的 TCP 数据包传输到远程主机，由后者转发到任意主机的 <host>:<port>
      -R [bind_address:]<bind_port>:<host>:<port>   # 让远程主机的 sshd 进程监听 bind_port 端口，将其 TCP 数据包传输到本机，由后者转发到任意主机的 <host>:<port>
```
- 例：
  ```sh
  ssh root@10.0.0.1  ls -lh
  ssh root@10.0.0.1  "hostname | xargs echo"  # 用引号将待执行的命令标明为一个字符串，以免被特殊字符截断
  ssh root@10.0.0.1  'echo $HOSTNAME'         # 用单引号时，不会在本机读取变量的值，而是直接先将命令发送到远端去执行
  ```
- ssh 登录成功之后，会在目标主机上打开一个 shell 终端，并将其 stdin、stdout 绑定到当前终端。
- ssh 登录时报错 timeout 的可能原因：
  - 与目标主机的网络不通。
  - 目标主机没有运行 sshd 服务器，或者防火墙没有开通 22 端口。
  - 目标主机的负载太大，接近卡死，不能响应 ssh 连接请求。
- 可通过以下格式发送多行命令：
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

### 配置

- `~/.ssh/config` 文件记录了 ssh 命令的配置参数。示例：
  ```sh
  Host *
      StrictHostKeyChecking ask         # 是否检查远程主机的公钥。默认为 ask ，即在登录时询问是否检查。可改为 yes 或 no ，即总是检查、不检查
      # Port 22                         # SSH 登录端口
      # User root                       # SSH 登录用户
      # IdentityFile ~/.ssh/id_rsa.pub  # 用于免密登录的私钥文件
      # UserKnownHostsFile ~/.ssh/known_hosts   # known_hosts 文件的路径

  Host 10.0.*
      StrictHostKeyChecking no

  Host centos* !centos-1                # 匹配所有名称以 centos 开头的主机，排除 centos-1 主机
      StrictHostKeyChecking yes
  ```
  - 该文件默认不存在，可主动创建。
  - 可定义多组 Host 配置，它们会分别生效。如果某个主机匹配一个或多个 Host 模式，则采用对应的配置参数。

- `~/.ssh/known_hosts` 文件记录了所有与本机进行过 SSH 通信的远程主机的公钥，用于验证远程主机的身份。
  - ssh 命令默认会在第一次尝试登录远程主机时（不需要成功登录），按 SSH 协议进行一次通信，将其公钥记录到 known_hosts 文件。
    - 以后再尝试登录远程主机时，如果其密钥与记录的值不同，则终止登录并发出警告，怀疑该远程主机是假冒的。
  - ssh 命令第一次尝试登录远程主机时，known_hosts 文件未记录该主机的密钥，不能验证身份。默认配置了 `StrictHostKeyChecking yes` ，会询问是否依然要登录。如下：
    ```sh
    [root@CentOS ~]# ssh 10.0.0.1
    The authenticity of host '10.0.0.1 (10.0.0.1)' can't be established.
    ECDSA key fingerprint is SHA256:4v11FRemHSDNLDPETHgi7TBKLzg6STOCNXsN1aX18Ko.
    ECDSA key fingerprint is MD5:69:8a:63:97:37:2f:13:5c:4f:d4:27:46:9d:e8:7d:43.
    Are you sure you want to continue connecting (yes/no)?
    ```

- `~/.ssh/authorized_keys` 文件记录了一些远程主机的公钥，允许使用这些公钥对应的私钥进行认证，登录本机。

## 相关命令

### sshpass

- 通过 sshpass 命令可以传递密码给 ssh、scp 命令，如下：
  ```sh
  yum install sshpass
  sshpass -p 123456 ssh root@10.0.0.1
  ```
  但这样会将明文密码泄露到终端，不安全。

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
