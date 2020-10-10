# TCP/UDP

## Socket 通信的状态

未连接时的状态：
- `LISTEN` ：该 Socket 已绑定到某个进程，内核正在监听该 Socket 。

建立 TCP 连接时的状态：
- `SYN_SENT` ：已发出 SYN=1 的 TCP 包，还没有收到 ACK=1、SYN=1 的 TCP 包。
- `SYN_RECEIVED`
- `ESTABLISHED` ：已建立连接，可以通信。

![](./connect.png)

断开 TCP 连接时的状态：
- `FIN-WAIT-1`
- `FIN-WAIT-2`
- `TIME_WAIT`
  - 主动关闭方在关闭连接之后，还要等待 2*MSL 时间之后才能变成 CLOSED 状态，避免对方来不及关闭连接。此时该端口占用的资源不会被内核释放。
  - MSL （Maximum Segment Lifetime）表示 TCP 段在网络传输中的最大生存时间，超过该时间就会被丢弃。它的默认值为 2 分钟。
  - HTTP 服务器应该尽量不要主动关闭端口，否则容易产生 TIME_WAIT 状态的端口，浪费大量的服务器资源。
- `CLOSE_WAIT`
  - 例如：HTTP 客户端发送 FIN 包来主动关闭连接时，HTTP 服务器没有马上调用 close() 关闭端口，就会长时间处于 CLOSE_WAIT 状态。
- `LAST_ACK`
- `CLOSED` ：已关闭连接。

![](./disconnect.png)

## Socket 本身的状态

在 Linux 上，执行以下命令可查看 Socket 本身的状态：
```
[CentOS ~]# cat /proc/net/sockstat
sockets: used 375
TCP: inuse 38 orphan 0 tw 34 alloc 150 mem 6
UDP: inuse 0 mem 2
UDPLITE: inuse 0
RAW: inuse 0
FRAG: inuse 0 memory 0
```
- `sockets: used` ：已使用的 socket 数量。
- `TCP: inuse` ：正在使用的 TCP socket 数量。
  - `orphan` ：无主的，不属于任何进程。
  - `tw` ：等待关闭的。
  - `alloc` ：已分配的。
  - `mem` ：使用的缓存大小。

## TCP 通信的常见报错

- 当主机 A 向主机 B 的某个端口发送 SYN 包，请求建立 TCP 连接时：
  - 如果主机 B 的防火墙禁用了该端口，或者启用了该端口但是没有进程在监听该端口，主机 B 的内核就会回复一个 RST 包（也可能一直不回复），导致主机 A 报错：`Connection refused`
  - 如果主机 A 一直没有收到回复（连 RST 包都没收到），则超出等待时间之后会报错：`Connection timed out`

- 当主机 A 与主机 B 通信过程中，主机 B 突然断开 TCP 连接时：
  - 如果主机 A 继续读取数据包，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset`
  - 如果主机 A 继续发送数据包，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset by peer`

## telnet

：一个传统的远程登录工具。
- 通信内容没有加密，容易被监听。因此不再适合用于远程登录，现在常用于测试 TCP 端口是否连通。
- 命令：
    ```sh
    $ telnet <host> [port]    # 连接到某个主机的 TCP 端口（默认是 23 端口）
    ```

- 例：端口连通
    ```
    [root@Centos ~]# telnet baidu.com 80
    Trying 39.156.69.79...
    Connected to baidu.com.
    Escape character is '^]'.

    ```
    - 可见它成功连接到目标主机的 80 端口。此时按 `Ctrl+]` 和 `Ctrl+D` 即可断开连接。

- 例：端口不连通
    ```
    [root@Centos ~]# telnet 127.0.0.1 8000
    Trying 127.0.0.1...
    telnet: connect to address 127.0.0.1: Connection refused
    ```
    - Connection refused 表示与目标主机的物理网络连通，但是连接不到目标端口。原因可能是：
      - 目标主机的防火墙拦截了发向该端口的数据包。
      - 目标主机的防火墙开通了该端口，但是目标主机上没有进程在监听该端口。
    - 上方访问的目标主机是本地环回地址，不会被防火墙拦截，所以是第二种原因。

- 例：无响应
    ```
    [root@Centos ~]# telnet baidu.com
    Trying 220.181.38.148...

    ^C
    ```
    - 可见它一直尝试连接目标主机的 23 端口，但并没有成功。原因可能是：
      - 与目标主机的网络不通
      - 端口无响应

## netstat

：用于查看本机网络连接的状态。

<details>
<summary>已淘汰不用</summary>

命令：

```sh
$ netstat
        -a  # 显示所有网络连接、socket
        -l  # 只显示 LISTEN 状态的
        -t  # 只显示 tcp 的 socket
        -u  # 只显示 udp 的 socket
        -x  # 只显示 unix socket
        -p  # 显示使用每个网络连接的进程名
```

</details>

## ss

：socket statistics ，用于查看 socket 的统计信息。
- 与 netstat 命令类似，但运行速度更快。

- 命令：
    ```sh
    $ ss        # 显示 established 状态的 socket
        -a      # 显示所有状态的 socket
        -l      # 只显示被进程 listen 的 socket
        -t      # 只显示 TCP 协议的端口
        -u      # 只显示 UDP 协议的端口
        -x      # 只显示本机通信的 socket

        -p      # 显示使用每个 socket 的进程名
        -n      # 不允许用服务名代替端口号（比如默认会把 22 端口显示成 ssh）
        -s      # 增加显示 TCP、UDP 等类型端口的统计信息
    ```

- 例：查看所有 TCP 端口的信息
    ```
    [root@Centos ~]# ss -tapn | cat    # 加上 cat 使显示的 users 不换行
    State      Recv-Q Send-Q Local Address:Port    Peer Address:Port
    LISTEN     0      128    127.0.0.1:34186            *:*              users:(("node",pid=15647,fd=19))
    LISTEN     0      128        *:111                  *:*              users:(("systemd",pid=1,fd=51))
    LISTEN     0      128        *:22                   *:*              users:(("sshd",pid=3057,fd=3))
    ```
    - Recv-Q、Send-Q ：表示接收队列、发送队列中待处理的数据包数。它们最好为 0 ，即没有包堆积。
    - 最右端的一列 users 表示监听每个端口的进程。

- 例：查看指定端口的信息
    ```
    [root@Centos ~]# ss -tapn | grep 8000
    LISTEN     0      128         :::8000               :::*             users:(("docker-proxy",pid=18614,fd=4))
    ```
