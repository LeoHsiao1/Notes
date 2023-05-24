# Socket

：套接字，是类 Unix 系统提供的一套 API ，用于进行 TCP/UDP 通信，工作在会话层。

## 用法

- 调用 Socket API 时，会在内存中创建一个 Socket 类型的文件，没有实际存储在磁盘上。
  - 程序读、写 Socket 文件时，操作系统会自动基于 TCP/UDP 协议接收、发送数据，不需要程序自己实现 TCP/UDP 协议的具体逻辑。
  - Linux 内核会为每个 Socket 自动分配一些内存空间，创建一个接收缓冲区（Recv buffer）、一个发送缓冲区（Send buffer），用于缓冲基于 TCP/UDP 协议接收、发送的 payload 数据。
- Socket 主要有两种用法：
  - Unix Domain Socket
    - ：用于本机的进程之间通信。
    - 例如 mysqld 进程在启动时会创建一个 /var/lib/mysql/mysql.sock 文件，位于同一主机的其它进程可读写该文件，从而与 mysqld 进程通信。
  - Network Socket
    - ：用于不同主机的进程之间通信。
    - 通信双方需要各自创建一个 Socket 文件，向一方的 Socket 文件写入数据，就会被操作系统自动进行 TCP/UDP 传输，然后可以在另一方的 Socket 文件读取到数据。
    - client 向 server 请求建立 TCP 连接时，需要知道 server 的 `IP:PORT` 地址，比如 `10.0.0.1:80` 。
      - IP ：IPv4 或 IPv6 地址，用于定位主机。
      - PORT ：端口号，用于定位主机上的进程。
        - 同一 IP 的主机上可能有多个进程，分别监听了不同的 TCP 端口。

### 常见报错

- 当主机 A 向主机 B 的某个端口发送 SYN 包，请求建立 TCP 连接时：
  - 如果主机 B 的防火墙禁用了该端口，则会拒绝通信，导致主机 A 报错：`No route to host`
    - 防火墙也可能丢弃该包，不作出响应，导致主机 A 长时间停留在尝试连接的阶段，显示：`Trying <host>...`
    - 如果主机 A 长时间没有收到回复（连 RST 包都没收到），则超出等待时间之后会报错：`Connection timed out`
  - 如果主机 B 的防火墙放通了该端口，但没有进程在监听该 socket ，则会回复一个 RST 包，表示拒绝连接，导致主机 A 报错：`Connection refused`

- 当主机 A 与主机 B 通信过程中，主机 B 突然关闭 TCP 连接时：
  - 如果主机 A 继续读取数据，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset`
  - 如果主机 A 继续发送数据，主机 B 就会回复一个 RST 包，导致主机 A 报错：`Connection reset by peer`

## API

### 创建 Socket

- 创建 Socket 的 API ：
  ```c
  #include <sys/socket.h>

  int socket(int domain, int type, int protocol);
      // 创建一个 Socket ，返回一个文件描述符 sockfd

  int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
      // 将一个 Socket 绑定到指定的 IP:PORT

  int listen(int sockfd, int backlog);
      // TCP server 一方的程序会调用该函数，让 Socket 进入 LISTEN 状态，等待 client 连接
      // backlog ：accept 队列的最大长度

  int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
      // TCP client 一方的程序会调用该函数，连接到 server

  int accept(int sockfd, struct sockaddr *restrict addr, socklen_t *restrict addrlen);
      // 从指定 Socket 的 accept 队列取出一个 TCP 握手成功的连接，为它创建并绑定一个新 Socket ，返回新的 sockfd
      // 源 Socket 为 LISTEN 状态，新 Socket 为 ESTABLISHED 状态
      // 如果 accept 队列为空，则 accept() 函数会一直阻塞等待
      // addr    ：请求连接的客户端地址
      // addrlen ：客户端地址的长度，即 sizeof(addr)

  int shutdown(int sockfd , int how);
      // 用于停止 Socket 的通信，但并不会关闭 Socket
      // how ：表示操作类型，可取值：
        // SHUT_RD   ：停止接收，并丢弃接收缓冲区中的数据
        // SHUT_WR   ：停止发送，但继续传输发送缓冲区中的数据
        // SHUT_RDWR ：停止接收和发送
  ```

- 例：基于 Socket 开发一个 TCP server 程序的代码流程
  1. 调用 socket() 创建一个 Socket ，然后用 bind() 绑定，用 listen() 监听。
      - 该 Socket 用于被动监听 TCP 端口，等待 client 连接，不能用于正式的 TCP 通信。
      - client 程序可调用 socket() 创建一个 Socket ，然后调用 connect() 主动连接到 server 。
  2. 调用 accept() ，为每个 TCP 握手成功的 client 创建一个 Socket 。
      - 该 Socket 用于正式的 TCP 通信。
      - 一个 server 可能被多个 client 连接，会分别创建一个 Socket ，分别用一对接收、发送缓冲区进行 TCP 通信。
  3. 调用 read()、write() 读写 Socket 。
  4. 调用 close() 关闭 Socket 。

- 调用 bind() 时，如果端口已被本机的其它进程绑定，则会报错：`bind() failed: Address already in use`
  - 同一 IP 的主机上可能有多个进程先后调用 bind() 。如果它们的 Socket 使用相同 protocol ，则只能绑定不同端口。如果使用不同 protocol ，则可以绑定相同端口。
  - 端口号在 TCP/UDP 数据包中存储为 16 bit 的无符号整数，因此取值范围为 0~65535 。
    - 小于 1024 的端口号通常被系统服务使用，不建议普通进程使用，比如 SSH 协议采用 TCP 22 端口。
      - 调用 bind() 时，如果端口号小于 1024 ，则需要 root 权限才能绑定。
      - 调用 bind() 时，如果端口号为 0 ，则会被随机分配一个可用端口号。例：
        ```sh
        [root@CentOS ~]# python3 -m http.server 0
        Serving HTTP on 0.0.0.0 port 33720 (http://0.0.0.0:33720/) ...
        ```
    - 如果一个进程绑定 IP 为 127.0.0.1 并监听一个端口，则只会接收本机发来的数据包，因为其它主机发来的数据包的目标 IP 不可能是本机环回地址。
    - 如果一个进程绑定 IP 为 0.0.0.0 并监听一个端口，则会接收所有数据包，不限制目标 IP ，只要目标端口一致。

- 当 server 调用 listen() 监听 TCP 端口时，Linux 内核会自动为该 Socket 维护 SYN、accept 两个连接队列。
  - 如果一个 client 请求连接当前 server ，开始三次握手。则等 TCP 连接变为 SYN_RECV 状态时，将连接信息存入 SYN 队列，又称为半连接队列。
    - 此时每个连接占用 304 bytes 内存。
    - 查看半连接的数量：
      ```sh
      netstat | grep SYN_RECV | wc -l
      ```
  - 当 TCP 连接变为 ESTABLISHED 状态时，将它从 SYN 队列取出，存入 accept 队列，又称为全连接队列。
    - 等到 server 调用 accept() 函数，就从 accept 队列取出 TCP 连接。
  - 如果队列满了，则 Socket 不能接收新连接。
    - Linux 内核默认会在 SYN 队列满了时启用 SYN Cookies 功能，从而抵抗 SYN Flood 攻击。
      - 原理：将 SYN_RECV 状态的连接信息不存入 SYN 队列，而是在 server 回复的 SYN+ACK 包中包含一个 cookie 信息。client 之后发出 ACK 包时如果包含该 cookie ，则允许建立连接。
      - 不过该功能不符合 TCP 协议，与某些服务不兼容。

- 调用 accept() 时，会根据五元组 protocol、src_addr、src_port、dst_addr、dst_port 创建一个 Socket ，只要其中一项元素不同，就会创建不同的 Socket 文件。
  - 当 server 监听一个端口、被不同 IP 的 client 分别请求连接时，这些 Socket 的 src_addr、src_port 不同，因此创建的 Socket 有 `255^4 * 65535` 种可能性，几乎无限。
  - 当 server 监听一个端口、被同一 IP 的 client 多次请求连接时，这些 Socket 的 src_addr 相同、src_port 默认的取值范围为 `10000 ~ 65535` ，因此创建的 Socket 有 55535 种可能性，一般足够使用。
    - 一般情况下，同一 client 向同一 server 建立的 TCP 并发连接数只有一个，或者几个。
    - 有的情况下，client 会频繁访问 server ，每次创建一个新的 TCP 连接，传输完数据就关闭连接。而 client 作为主动关闭方， Socket 要等 2*MSL 时长才能关闭，因此新、旧 Socket 会同时存在，平均每秒最多能创建 `55535/60=925` 个新 Socket 。此时建议 client 创建 TCP 连接之后不立即关闭，而是复用一段时间。
  - Linux 内核收到一个发向本机的 TCP/UDP 数据包时，会检查其 dst_addr、dst_port ，判断属于哪个 Socket ，然后暂存到该 Socket 的接收缓冲区。
    - 如果不存在该 Socket ，则回复一个 RST 包，表示拒绝连接。

### 读写 Socket

- Socket 是在内存中创建的文件，因此可调用文件的 API 来读写 Socket ：
  ```c
  #include <unistd.h>

  ssize_t read(int fd, void *buf, size_t count);
  ssize_t write(int fd, const void *buf, size_t count);
  ```

- 也可以调用 recv()、send() 等 API 来读写 Socket ，详见 IO 模型。

### 关闭 Socket

- 关闭 Socket 的几种方式：
  - 等待创建该 Socket 的进程主动调用 close() 。
    ```c
    #include <unistd.h>

    int close(int fd);
    ```
    - 不允许其它进程关闭该 Socket ，即使是 root 用户。
  - 终止创建该 Socket 的进程，内核会自动回收其创建的所有 Socket 。
  - 通过 gdb ，调试创建该 Socket 的进程，调用 close() 。如下：
    ```sh
    ss -tapn | grep $PORT     # 找出监听某个端口的进程的 PID
    lsof -p $PID | grep TCP   # 找出该进程创建的 Socket 的文件描述符 FD
    gdb  -p $PID              # 调试该进程
    call close($FD)           # 关闭 Socket
    ```

### IO 模型

- 读写 Socket 的 API 有多种，根据 IO 模型分为以下几类：
  - 阻塞（blocking） IO
  - 非阻塞（nonblocking） IO
  - IO 复用（multiplexing）
  - 信号驱动（signal driven） IO
  - 异步（asynchronous） IO ：简称为 AIO

#### 阻塞 IO

- ：程序调用 API 读写 Socket 时，会阻塞执行。
  - 调用 API 接收数据时，要等数据从 Socket 接收缓冲区拷贝到 buf 进程内存空间，API 才返回。
  - 调用 API 发送数据时，也要等数据从 buf 进程内存空间拷贝到 Socket 发送缓冲区，API 才返回。
- 优点：用法简单。
- 缺点：调用 API 时可能长时间阻塞，导致当前线程不能执行其它任务。
  - 函数阻塞时 CPU 是空闲的，可执行其它线程。
- 相关 API ：
  ```c
  #include <sys/socket.h>

  ssize_t recv(int sockfd, void *buf, size_t len, int flags);
      // 接收数据。将 Socket 接收缓冲区中的数据，拷贝到 buf ，然后返回实际读取的字节数
      // sockfd ：指定 Socket 的文件描述符
      // buf    ：指向一块内存空间的指针，用作读缓冲。内核会从 Socket 接收缓冲区读取数据，写入其中
      // len    ：声明 buf 内存空间的长度

  ssize_t recvfrom(int sockfd, void *restrict buf, size_t len, int flags, struct sockaddr *restrict src_addr, socklen_t *restrict addrlen);
      // 与 recv() 相比，只接收来自指定源地址的数据

  ssize_t send(int sockfd, const void *buf, size_t len, int flags);
      // 发送数据。将 buf 中的数据，拷贝到 Socket 发送缓冲区，然后返回实际拷贝的字节数

  ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);
      // 与 send() 相比，只发送数据到指定目标地址
  ```
  - 调用 read()、write() 读写 Socket 时，相当于调用 recv()、send() 且 flags 为 0 。
  - 调用 `recv(sockfd, buf, len, flags);` 时，相当于调用 `recvfrom(sockfd, buf, len, flags, NULL, NULL);` 。
    - TCP 通信时，通常使用 recv()、send() ，因为远程主机的地址已经绑定到 Socket 了。
    - UDP 通信时，通常使用 recvfrom()、sendto() ，从而区分不同地址的远程主机。

- 例：假设两个程序 A、B 分别位于两个 Linux 主机上，已建立 TCP 连接，可调用 send()、recv() 函数来发送、接收数据。流程如下：
  1. 程序 A 调用 send() ，请求操作系统发送一批 bytes 数据。
  2. 程序 A 的操作系统先将 bytes 数据暂存到发送缓冲区，然后取出这些数据作为 payload ，自动封装为一个或多个 TCP 包，最后发送。
  3. 程序 B 的操作系统收到一个或多个 TCP 包，自动解包，将其中的 payload 数据暂存到接收缓冲区。
      - 这些数据会一直保存在接收缓冲区，直到程序调用 recv() 取出这些数据。另外，关闭 Socket 也会销毁缓冲区，如果缓冲区还有数据则会丢失。
      - 如果接收缓冲区满了，则不能接收包含 payload 的新 TCP 包，只能丢包。为了避免这种情况，可以提高调用 recv() 的频率，或者增加 `net.core.rmem_default` 内核参数。
  4. 程序 B 调用 `recv(int sockfd, void *buf, size_t len, int flags);` ，请求接收数据。
      - 这个 buf 是进程动态分配的一块内存空间，可以被进程直接访问。而 Socket 发送、接收缓冲区是 Linux 内核自动分配的一块内存空间，不能被进程直接访问。
      - 如果接收缓冲区中有数据，则操作系统会从中取出 len 长度的数据，拷贝到进程的 buf 内存空间，然后结束执行 recv() 函数。之后进程可以自由处理 buf 中的数据。
      - 如果接收缓冲区中没有数据，则 recv() 函数会一直阻塞等待。

- 假设程序多次调用 send() ，分别发送 1、2、3 bytes 长度的数据：
  - 如果是 TCP 通信，则多次 send() 的数据会暂存在发送缓冲区中，前后拼接成一段数据（该例为 6 bytes 长度）。累计的数据量达到 Nagle 算法的阈值之后，才封装为一个 TCP 数据包并发送。因此 recv() 时只收到一段数据，不能区分多次 send() 的数据。
    - 该问题称为 TCP 黏包。常见的解决方案是，程序每次 send() 时，主动给数据添加一些前缀标识，从而明确每条数据的边界。例如 HTTP 协议发送的每个报文，都有固定格式的头部。
    - 有时 TCP 黏包不会影响数据传输。例如将一个文件的数据分多次 send() 发送，本来就需要拼接成一段数据，不存在边界。
  - 如果是 UDP 通信，则每次调用 send() ，都会立即发送 UDP 数据包，不存在黏包的问题。

#### 非阻塞 IO

- ：程序调用 API 读写 Socket 时，API 会立即返回一个错误码，然后程序需要轮询 IO 操作是否完成。
- 优点：调用 API 的耗时很短。
- 缺点：需要多次轮询，占用更多 CPU 。

#### IO 复用

- ：程序调用 API 阻塞监视多个 Socket ，等任一 Socket 缓冲区变为可读或可写时返回。然后程序再调用 recv() 或 send() 。
- 优点：使用单线程就可同时监视多个 Socket 的状态。
  - 例如 TCP server 一般会被多个 client 连接，绑定了多个 Socket ，需要检查每个 Socket 是否接收了新数据。如果 server 采用阻塞式 IO ，则一个线程同时只能检查一个 Socket 的缓冲区是否可读，轮询一遍全部 Socket 的耗时较久。解决方案是创建多线程，或采用 IO 复用。
- select() 是最老的一种 IO 复用 API ，大部分操作系统都支持：
  ```c
  #include <sys/select.h>

  int select(int nfds, fd_set *restrict readfds, fd_set *restrict writefds, fd_set *restrict exceptfds, struct timeval *restrict timeout);
      // 阻塞监视多个文件描述符，等任一文件描述符满足条件时才返回
      // nfds       ：取值等于监视的最大一个文件描述符 + 1
      // readfds    ：一组文件描述符，当任一变为可读时，函数返回
      // writefds   ：一组文件描述符，当任一变为可写时，函数返回
      // exceptfds  ：一组文件描述符，当任一发生异常时，函数返回
      // timeout    ：函数阻塞的超时时间
  ```
  - 等待文件描述符变为可读、可写，是指可以立即进行 IO 操作而不会阻塞。
  - select() 将监视的所有文件描述符记录在一个数组中，数组长度固定为 FD_SETSIZE=1024 。

- poll() 是一种改进的 API ：
  ```c
  #include <poll.h>

  int poll(struct pollfd *fds, nfds_t nfds, int timeout);
      // 阻塞监视多个文件描述符
      // fds  ：一个指针，记录一组 pollfd 结构体的首地址
      // nfds ：pollfd 结构体的数量

  struct pollfd {
      int   fd;         // 文件描述符
      short events;     // 监视的事件，比如文件可读、可写等
      short revents;    // 实际发生的事件。调用 poll() 时内核会赋值该变量
  };
  ```
  - poll() 不限制文件描述符的数量，而且监视的事件比 select() 更多。

- Linux 系统独有地，将 poll() 改进为了 epoll 系列 API ：
  ```c
  #include <sys/epoll.h>

  int epoll_create(int size);
      // 创建一个 epoll 实例，返回其文件描述符 epfd
      // size ：允许 epoll 实例监视的文件描述符总数。Linux 2.6 开始会自动调整 size ，因此传入 size>0 即可

  int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
      // 控制一个 epoll 实例，管理对一个文件描述符 fd 的监视事件
      // fd    ：一个文件描述符，如果有多个文件描述符需要监视，则需要多次调用 epoll_ctl()
      // op    ：操作类型。比如添加、删除监视的事件
      // event ：一组事件。epoll_event 结构体中记录了一个文件描述符、监视的事件

  int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
      // 阻塞监视一个 epoll 实例，等任一事件发生时，返回满足条件的事件数量
      // 超时时，函数返回 0
      // 出错时，函数返回 -1 ，并设置 errno
      // events    ：一个指针。调用 epoll_wait() 时，内核会将发生的的一组事件的首地址赋值给该指针
      // maxevents ：最多返回的事件数
      // timeout   ：阻塞的超时时间，单位 ms 。取值为 0 则立即返回，适合轮询。取值为 -1 则会一直阻塞。
  ```
  - epoll 实例以文件形式保存，使用完之后应该 close() 。
  - epoll 只返回发生的事件，不需要检查所有文件描述符，比 select() 和 poll() 更高效，更适合监视大量文件描述符。
  - epoll 是线程安全的，而 select() 和 poll() 不是。
    - 当一个线程阻塞等待 epoll 实例时，其它线程可以向该 epoll 实例添加文件描述符。如果新的文件描述符满足条件，则会解除阻塞。

#### 信号驱动 IO

- ：进程调用 sigaction() ，函数会立即返回。等 Socket 变为可读或可写时，内核会发送 SIGIO 信号通知该进程。然后进程再调用 recv() 或 send() 。

#### 异步 IO

- ：进程调用 API 读写 Socket ，函数会立即返回。等内核执行完 IO 操作之后，再发送信号通知该进程。
- 相当于另外创建了一个线程，去执行 recv() 或 send() 。
- 其它四种 IO 模型都属于同步 IO ，进程需要等待 IO 完成，才能执行其它任务。

- 同步通信（Synchronous）
  - ：指一个程序对外发送消息之后，要等收到回复，才能执行其它任务。
  - 在等待回复的期间，该程序属于阻塞（Block）状态。

- 异步通信（Asynchronous）
  - ：指一个程序对外发送消息之后，不必等收到回复，就能执行其它任务。
  - 例如：打电话属于同步通信，需要一边说话一边听对方的回复。而发短信属于异步通信。
  - CPU 的运行速度远高于磁盘 IO 、网络 IO 速度。因此采用同步 IO 时，程序经常会阻塞，不占用 CPU 。采用异步 IO 可以大幅提高 CPU 的使用率。

## 相关命令

### sockstat

- 通过 `/proc/net/sockstat` 文件可查看各种状态的 socket 数量：
  ```sh
  [CentOS ~]# cat /proc/net/sockstat
  sockets: used 1101
  TCP: inuse 44 orphan 0 tw 260 alloc 402 mem 37
  UDP: inuse 2 mem 10
  UDPLITE: inuse 0
  RAW: inuse 0
  FRAG: inuse 0 memory 0
  ```
  各字段的含义：
  ```sh
  orphan  # 无主的 Socket ，即不绑定任何进程
  tw      # TIME-WAIT 状态的 socket 数量
  alloc   # 已绑定进程的 socket 数量
  mem     # 占用内存，单位为内存页 pages
  ```

### netstat

：用于查看本机网络连接的状态。
- 命令：
  ```sh
  netstat
          -a  # 显示所有 socket
          -l  # 只显示被进程 listen 的 socket
          -t  # 只显示 tcp socket
          -u  # 只显示 udp socket
          -x  # 只显示 unix socket

          -e  # 增加显示 User、Inode 列
          -p  # 增加显示 PID/Program name 列，表示使用每个 socket 的进程
          -n  # 取消将端口号显示成服务名（比如默认会把 22 端口显示成 ssh）
  ```

### ss

：全称为 socket statistics 。该命令与 netstat 类似，但执行速度更快。
- 命令：
  ```sh
  ss        # 显示 established 状态的 socket
    -a      # 显示所有状态的 socket
    -l      # 只显示被进程 listen 的 socket
    -t      # 只显示 tcp socket
    -u      # 只显示 udp socket
    -x      # 只显示 unix socket

    -p      # 显示绑定每个 socket 的进程名
    -m      # 显示每个 socket 占用的内存
    -n      # 取消将端口号显示成服务名
    -i      # 显示 tcp 协议的详细信息，包括 mss、cwnd、ssthresh 等
    -s      # 显示各种 Socket 的统计数量
  ```

- 例：查看各种 Socket 的统计数量
  ```sh
  [root@CentOS ~]# ss -s
  Total: 1101 (kernel 1405)           # Total 表示存在的 Socket 数。不过 kernel 中存在的 Socket 数较多一些，因为有些 Socket 已关闭，但尚未回收
  TCP:   697 (estab 140, closed 538, orphaned 0, synrecv 0, timewait 295/0), ports 0

  Transport Total     IP        IPv6
  *         1405      -         -
  RAW       0         0         0
  UDP       3         2         1     # 统计 UDP 类型的 Socket ，包括总数、IPv4 数量、IPv6 数量
  TCP       159       44        115
  INET      162       46        116
  FRAG      0         0         0
  ```
  - 执行 `ss -a` 时不会显示 closed 状态的 Socket ，但它们的确存在，占用了文件描述符。
  - 这里 closed 状态的 Socket ，不是指被 close() 关闭的 Socket （它们会被内核自动回收），而是指没有通信的 Socket 。比如：
    - 程序创建 Socket 之后，没有成功调用 connect() ，导致该 Socket 从未进行通信。
    - 程序调用了 shutdown() ，但没有调用 close() ，导致该 Socket 停止通信。

- 例：查看所有 TCP 端口的信息
  ```sh
  [root@CentOS ~]# ss -tapn | cat    # 加上 cat 使显示的 users 列不换行
  State      Recv-Q   Send-Q    Local Address:Port    Peer Address:Port
  LISTEN     0        128       127.0.0.1:34186            *:*              users:(("node",pid=15647,fd=19))
  LISTEN     0        128           *:111                  *:*              users:(("systemd",pid=1,fd=51))
  LISTEN     0        128           *:22                   *:*              users:(("sshd",pid=3057,fd=3))
  ```
  - 不指定 Socket 类型时，默认显示的第一列是 Netid ，表示 Socket 类型，取值包括：
    ```sh
    TCP
    UDP
    u_str     # Unix Stream
    u_dgr     # UNIX datagram
    nl        # net link
    p_raw     # raw packet
    p_dgr     # datagram packet
    ```
  - LISTEN 状态时：
    - Recv-Q 表示当前 accept 队列的长度。
    - Send-Q 表示 accept 队列允许的最大长度。
  - 非 LISTEN 状态时：
    - Recv-Q 表示接收队列的长度，即已接收、尚未被进程读取的字节数。
    - Send-Q 表示发送队列的长度，即已发送、尚未收到对方 ACK 的字节数。
    - 上述两个值为 0 时最好，说明内核缓冲区没有堆积。
  - 最右端的一列 users 表示监听每个端口的进程。

- 例：查看所有 Socket 占用的内存
  ```sh
  [root@CentOS ~]# ss -tapnmi | cat
  State      Recv-Q   Send-Q    Local Address:Port    Peer Address:Port
  LISTEN     0        128             *:22                 *:*              users:(("sshd",pid=1173,fd=3))
      skmem:(r0,rb87380,t0,tb16384,f0,w0,o0,bl0,d0)   cubic rto:1000 mss:536 cwnd:10 segs_in:146 lastsnd:988678939 lastrcv:988678939 lastack:988678939
  SYN-SENT   0        1         10.0.0.1:52052        10.0.0.2:9094         users:(("filebeat",pid=1215,fd=8))
      skmem:(r0,rb87380,t0,tb16384,f4294966016,w1280,o0,bl0,d0)   cubic rto:16000 backoff:4 mss:524 rcvmss:88 advmss:1460 cwnd:1 ssthresh:7 segs_out:5 lastsnd:988678939 lastrcv:988678939 lastack:988678939 unacked:1 retrans:1/4 lost:1
  ```
  - skmem 表示 Socket 占用的内存，其中各个字段的含义：
    ```sh
    rmem_alloc    # 接收缓冲区已分配的内存。通常缓冲区不需要存储数据时，Socket 就不会向 MMU 申请分配内存
    rcv_buf       # 接收缓冲区的容量，即最多允许分配的内存。Linux 可能自动增减缓冲区的容量
    wmem_alloc    # 发送缓冲区已分配的内存
    snd_buf       # 发送缓冲区的容量
    fwd_alloc     # 该 Socket 已分配，但尚未用于 rmem_alloc、wmem_alloc 的空闲内存。这部分内存尚未写入数据，因此并未占用 RSS 内存
    wmem_queued   # 发送缓冲区已分配的另一块内存，已写入数据，正在准备发送
    opt_mem       # 用于存储 socket option 的内存
    back_log      # sk backlog 队列占用的内存。当进程正在接收数据包时，新的数据包会被暂存到 sk backlog 队列，以便被进程立即接收
    sock_drop     # 该 Socket 丢弃的数据包的数量
    ```
  - 每个 Socket 占用的总内存等于 rmem_alloc + wmem_alloc (+ fwd_alloc) + wmem_queued + opt_mem + back_log 。
  - 这里 rto 的单位为 ms ，
