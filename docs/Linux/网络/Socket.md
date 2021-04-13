# Socket

：套接字。一个在内存中创建的文件描述符，并不会实际存储在磁盘上。
- 使用 Socket ，程序可以按读写文件的方式进行进程间通信。主要有两种用法：
  - Unix Domain Socket ：用于本机的进程之间通信，保存为一个 Socket 文件，比如 /var/lib/mysql/mysql.sock 。
  - Network Socket ：用于不同主机的进程之间通信，基于 TCP/UDP 协议通信，用 host:port 表示通信方。

## 相关 API

- 创建 Socket 的内核 API ：
  ```c
  #include <sys/socket.h>

  int socket(int domain, int type, int protocol);                           // 打开一个 Socket ，输入的参数都是用于指定协议、类型
  int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);     // 将一个 Socket 绑定到指定的 IP 地址和 port 端口

  int listen(int sockfd, int backlog);                                      // 监听指定 Socket （常用于作为服务器的进程）
  int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);  // 连接到指定 Socket（常用于作为客户端的进程）
  ```
- 关闭、读写 Socket 的 API ，与普通文件一致：
  ```c
  #include <unistd.h>

  int close(int fd);
  ssize_t read(int fd, void *buf, size_t count);
  ssize_t write(int fd, const void *buf, size_t count);
  ```
- Linux 收到一个发向本机的 TCP/UDP 数据包时，先检查其目标 IP 、目标端口，判断属于哪个 Socket ，然后交给监听该 Socket 的进程。
  - 如果不存在该 Socket ，则回复一个 RST 包，表示拒绝连接。
  - 如果一个进程调用 bind() 时，该端口已被其它进程绑定，则会报错：`bind() failed: Address already in use`
  - 如果一个进程绑定 IP 为 127.0.0.1 并监听，则只会收到本机发来的数据包，因为其它主机发来的数据包的目标 IP 不可能是本机环回地址。
  - 如果一个进程绑定 IP 为 0.0.0.0 并监听，则会收到所有目标 IP 的数据包，只要目标端口一致。
- 建立 Network Socket 连接时，进程会以文件的形式打开 Socket 。
  - 每个 Socket 连接由五元组 protocol、src_addr、src_port、dst_addr、dst_port 确定，只要其中一项元素不同， Socket 的文件描述符就不同。
  - 例如，当服务器监听一个 TCP 端口时，可以被任意 dst_addr、dst_port 连接，理论上可以建立大概 255^4 * 65535 个 Socket 连接。
  - 实际上，一个主机上建立的 Socket 连接总数一般为几万个，主要受以下因素限制：
    - 进程可以打开的文件描述符数量
    - 内存总量

## 常见报错

- 当主机 A 向主机 B 的某个端口发送 SYN 包，请求建立 TCP 连接时：
  - 如果主机 B 的防火墙禁用了该端口，则会拒绝通信，导致主机 A 报错：`No route to host`
  - 如果主机 B 的防火墙启用了该端口，但没有进程在监听该 socket ，则会回复一个 RST 包（也可能一直不回复），表示拒绝连接，导致主机 A 报错：`Connection refused`
  - 如果主机 A 长时间没有收到回复（连 RST 包都没收到），则超出等待时间之后会报错：`Connection timed out`

- 当主机 A 与主机 B 通信过程中，主机 B 突然断开 TCP 连接时：
  - 如果主机 A 继续读取数据包，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset`
  - 如果主机 A 继续发送数据包，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset by peer`

## 相关命令

### sockstat

查看各状态的 socket 数量：
```sh
[CentOS ~]# cat /proc/net/sockstat
sockets: used 375
TCP: inuse 38 orphan 0 tw 34 alloc 150 mem 6
UDP: inuse 0 mem 2
UDPLITE: inuse 0
RAW: inuse 0
FRAG: inuse 0 memory 0
```
- `used` ：使用的 socket 数量。
- `inuse` ：监听的 socket 数量。
- `orphan` ：无主的，不属于任何进程。
- `tw` ：time_wait 。
- `alloc` ：allocated ，已分配的。
- `mem` ：Socket 的缓冲区大小。

### telnet

：一个传统的远程登录工具。
- 通信内容没有加密，容易被监听。因此现在不适合用于远程登录，常用于测试 TCP 端口能否连通。
- 命令：
  ```sh
  $ telnet <host> [port]    # 连接到某个主机（默认采用 TCP 23 端口）
  ```

- 例：端口连通
  ```sh
  [root@Centos ~]# telnet baidu.com 80
  Trying 39.156.69.79...
  Connected to baidu.com.
  Escape character is '^]'.

  ```
  - 可见它成功连接到目标主机的 80 端口。此时按 `Ctrl+]` 加 `Ctrl+D` 即可断开连接。

- 例：端口不通
  ```sh
  [root@Centos ~]# telnet 127.0.0.1 8000
  Trying 127.0.0.1...
  telnet: connect to address 127.0.0.1: Connection refused
  ```

- 例：无响应
  ```sh
  [root@Centos ~]# telnet baidu.com
  Trying 220.181.38.148...

  ^C
  ```
  - 可见它一直尝试连接目标主机的 23 端口，但并没有收到响应。原因可能是：
    - 与目标主机的网络不通。
    - 与目标主机的网络连通，但端口不通。
    - 与目标主机的端口连通，但是目标主机的 CPU 或内存等资源已经耗尽，不能做出响应。

### netstat

：用于查看本机网络连接的状态。
- 命令：
  ```sh
  $ netstat
          -a  # 显示所有网络连接、socket
          -l  # 只显示被进程 listen 的 socket
          -t  # 只显示 TCP 的 socket
          -u  # 只显示 UDP 的 socket
          -x  # 只显示 unix socket
          
          -p  # 显示使用每个 socket 的进程名
          -n  # 不允许用服务名代替端口号（比如默认会把 22 端口显示成 ssh）
  ```

### ss

：socket statistics ，用于查看本机 socket 的状态。
- 与 netstat 命令类似，但运行速度更快。
- 命令：
  ```sh
  $ ss        # 显示 established 状态的 socket
      -a      # 显示所有 socket
      -l      # 只显示被进程 listen 的 socket
      -t      # 只显示 TCP 的 socket
      -u      # 只显示 UDP 的 socket
      -x      # 只显示 unix socket

      -p      # 显示使用每个 socket 的进程名
      -n      # 不允许用服务名代替端口号
      -s      # 增加显示 TCP、UDP 等类型端口的统计信息
  ```

- 例：查看所有 TCP 端口的信息
  ```sh
  [root@Centos ~]# ss -tapn | cat    # 加上 cat 使显示的 users 不换行
  State      Recv-Q Send-Q Local Address:Port    Peer Address:Port
  LISTEN     0      128    127.0.0.1:34186            *:*              users:(("node",pid=15647,fd=19))
  LISTEN     0      128        *:111                  *:*              users:(("systemd",pid=1,fd=51))
  LISTEN     0      128        *:22                   *:*              users:(("sshd",pid=3057,fd=3))
  ```
  - Recv-Q、Send-Q ：表示接收队列、发送队列中待处理的数据包数。它们最好为 0 ，即没有包堆积。
  - 最右端的一列 users 表示监听每个端口的进程。

- 例：查看指定端口的信息
  ```sh
  [root@Centos ~]# ss -tapn | grep 8000
  LISTEN     0      128         :::8000               :::*             users:(("docker-proxy",pid=18614,fd=4))
  ```

### tcpdump

：一个网络抓包工具，可以抓取主机网卡上收发的所有数据包。
- 命令：
  ```sh
  tcpdump
          -i lo         # 监听指定网卡（默认是监听第一个网卡，即 eth0）
          -n            # 将主机名、域名显示成明确的 IP 地址
          -nn           # 将端口名显示成明确的端口号
          -v            # 显示数据包的详细信息
          -vv           # 显示数据包更详细的信息

          # 过滤表达式
          host 10.0.0.1       # 指定主机
          net 10.0.0.1/24     # 某个网段
          src 10.0.0.1        # 指定源地址
          dst 10.0.0.1        # 指定目的地址
          tcp                 # 指定协议
          port 80             # 指定端口
          tcp and dst port 80 # 过滤出目的端口为 80 的 tcp 数据包

          -c 10               # 抓取指定数量的数据包之后就停止运行
          -w dumps.pcap       # 将抓取信息保存到一个文件中
  ```
  - 监听 eth0 网卡时，会抓取本机与其它主机通信的数据包。监听 lo 网卡时，会抓取本机内部通信的数据包。
  - 过滤表达式支持使用 and、or、not 运算符。
  - 可以先用 tcpdump 抓包并保存为文件，然后在 Wireshark 的 GUI 界面中分析。

- 下例是对一次 HTTP 请求的抓包：
  ```sh
  [root@Centos ~]# tcpdump -nn tcp and dst port 8000
  tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
  listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
  13:46:14.669786 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [S], seq 2920488928, win 29200, options [mss 1424,sackOK,TS val 3983484990 ecr 0,nop,wscale 7], length 0
  13:46:14.670038 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [.], ack 174830516, win 229, options [nop,nop,TS val 3983484990 ecr 2392282894], length 0
  13:46:14.670095 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [P.], seq 0:82, ack 1, win 229, options [nop,nop,TS val 3983484990 ecr 2392282894], length 82
  13:46:14.672466 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [.], ack 18, win 229, options [nop,nop,TS val 3983484992 ecr 2392282896], length 0
  13:46:14.672591 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [.], ack 378, win 237, options [nop,nop,TS val 3983484992 ecr 2392282897], length 0
  13:46:14.672667 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [F.], seq 82, ack 378, win 237, options [nop,nop,TS val 3983484993 ecr 2392282897], length 0
  13:46:14.672805 IP 10.124.128.97.52152 > 10.124.130.12.8000: Flags [.], ack 379, win 237, options [nop,nop,TS val 3983484993 ecr 2392282897], length 0
  ```
  - 每行包含多个字段：时间戳 源地址 > 目的地址 Flags ... length
  - 常见的几种 TCP 数据包标志：
    ```sh
    [S]     # SYN 数据包
    [.]     # ACK 数据包
    [S.]    # SYN+ACK 数据包
    [P]     # PUSH 数据包
    [F]     # FIN 数据包
    [R]     # RST 数据包
    ```
