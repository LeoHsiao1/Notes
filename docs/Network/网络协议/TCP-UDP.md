# TCP/UDP

## TCP 协议

：传输控制协议（Transmission Control Protocol）
- 规定了网络上的主机之间如何传输数据，属于传输层协议。
- 采用 C/S 架构，通信双方分别称为 server、client 。
  - 面向连接：通信双方在通信之前要先建立信道。
  - 是可靠的通信协议，可保证消息顺序，可进行差错控制、流量控制。
  - 可进行全双工通信。
- 大部分应用层协议都是基于 TCP 进行通信的，比如 HTTP、FTP、SMTP 等。

### 数据包结构

TCP 数据包的结构如下：

![](./tcp.jpg)

- Source Port ：源端口，长度为 16 bit 。
- Dest Port ：目标端口，16 bit 。
- Seq number ：序列号，32 bit ，用于保证消息顺序。
- Ack number ：确认号，32 bit ，表示期望收到的下一个序列号，用于标识符 ACK=1 的情况。
- Data offset ：偏移量，4 bit 。表示 Payload 的起始坐标，即 TCP Header 的总长度。
- Reserved ：保留给未来使用，3 bit ，默认值为 0 。
- Flag ：标志符，9 bit 。每个 bit 代表一个标志位，默认值为 0 。
  - NS
  - CWR
  - ECE
  - URG=1 ：表示该数据是紧急数据，应该被优先处理。
  - ACK=1 ：表示确认。
  - PSH=1 ：表示发送方应该立即将该数据打包成一个 TCP 数据包发送，接收方也应该立即将该数据上报给上层程序。
    - TCP 模块在发送数据时，一般会等发送缓冲区满了，才打包成一个 TCP 数据包发送。同理，接收数据时也一般会等接收缓冲区满了才上报。
    - 一般一个应用层的报文会被切分成多个 TCP 数据包发送，最后一个 TCP 数据包会设置成 PSH=1 。
  - RST=1 ：用于重新建立 TCP 连接，也可用于拒绝连接。
  - SYN=1 ：用于建立 TCP 连接，开始同步。
  - FIN=1 ：用于断开 TCP 连接。
- Window size
- Checksum ：校验和，16 bit 。
- Urgent pointer
- Options
- Payload ：有效载体，即该数据包要传递的实际数据。
  - Payload 之前的其它数据都只是用于描述 TCP 数据包的元数据，称为 TCP Header 。
  - 以太网中网卡的 MTU 通常设置为 1500 ，因此如果 TCP 报文超过该长度，转换成 IP 数据包时就需要拆分成多份。

### 建立连接

- 建立 TCP 连接时需要经过三个步骤，称为“三次握手”：
  1. 主机 A 发送一个 SYN=1 的 TCP 包，表示请求连接。
  2. 主机 B 收到后，回复一个 SYN=1、ACK=1 的 TCP 包，表示允许连接。
  3. 主机 A 收到后，发送一个 ACK=1 的 TCP 包，表示正式建立连接。
- 主动连接方称为 client ，被动连接方称为 server 。
  - 通信双方都要发送一个 SYN、一个 ACK 。
  - 建立连接之后，双方便可以开始正式通信，发送任意个包含有效载体的 TCP 数据包。
- 对应的 Socket 状态变化如下：

  ![](./tcp_1.png)

  - `SYN_SENT` ：已发出 SYN=1 的 TCP 包，还没有收到 SYN=1、ACK=1 的 TCP 包。
  - `SYN_RECEIVED`
  - `ESTABLISHED` ：已建立连接。
  - `LISTEN` ：系统正在监听发向该 Socket 的 TCP 包。

### 断开连接

- 断开 TCP 连接时需要经过四个步骤，称为“四次分手”：
  1. 主机 A 发送 FIN ，表示请求断开连接。
  2. 主机 B 收到后，先回复 ACK ，表示同意断开连接。\
    准备好了之后也发送 FIN ，请求断开连接。
  3. 主机 A 收到后，发送一个 ACK ，表示自己已经断开连接。
  4. 主机 B 收到后，正式断开连接。
- client、server 都可以主动断开连接。
  - 通信双方都要发送一个 FIN、一个 ACK 。
- 对应的 Socket 状态变化如下：

  ![](./tcp_2.png)

  - `FIN-WAIT-1`
  - `FIN-WAIT-2`
  - `TIME_WAIT`
    - 主动关闭方在关闭连接之后，还要等待 2*MSL 时间之后才能变成 CLOSED 状态，避免对方来不及关闭连接。此时该端口占用的资源不会被内核释放。
    - MSL（Maximum Segment Lifetime）：TCP 段在网络传输中的最大生存时间，超过该时间就会被丢弃。它的默认值为 2 分钟。
    - 一般 HTTP 通信时，服务器发出响应报文之后就会主动关闭连接（除非是长连接），使端口变成 TIME_WAIT 状态。
    - 如果服务器处理大部分 HTTP 请求的时长，都远低于 TIME_WAIT 时长，就容易产生大量 TIME_WAIT 状态的端口，影响并发性能。
  - `CLOSE_WAIT`
    - 例如：HTTP 客户端发送 FIN 包来主动关闭连接时，HTTP 服务器没有马上调用 close() 关闭端口，就会长时间处于 CLOSE_WAIT 状态。
  - `LAST_ACK`
  - `CLOSED` ：已关闭连接。

## UDP 协议

：用户数据报协议（User Datagram Protocol）
- 与 TCP 协议类似，只是面向无连接。
- 通信双方分别称为 sender、receiver 。
- TCP 需要一直运行一个服务器，而 UDP 适合用作即时通信、广播消息。
- 少部分应用层协议是基于 UDP 进行通信的，比如 DHCP、DNS、SNMP、RIP 等。
