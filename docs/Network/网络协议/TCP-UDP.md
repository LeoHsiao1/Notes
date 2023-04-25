# TCP/UDP

- 大部分应用层协议，在传输层是基于 TCP/UDP 协议进行通信的。
  - 例如 HTTP、FTP、SMTP 是基于 TCP 协议。
  - 例如 DHCP、DNS、SNMP（简单网络管理协议）、TFTP（通用文件传输协议）、NFS（网络文件系统）是基于 UDP 协议。

## TCP

：传输控制协议（Transmission Control Protocol）
- 属于传输层协议，用于让一个主机向另一个主机传输网络数据包。
- 特点：
  - 全双工通信。
  - 面向连接：通信双方在通信之前要先建立连接，作为信道。
    - 这里的连接是指逻辑网络上的连接，不是通过物理介质连接。
  - 传输可靠：可实现顺序控制、差错控制、流量控制、拥塞控制。

### 架构

- TCP 协议采用 C/S 架构：
  - server
    - ：称为服务器、被动连接方，由一个主机担任。需要持续监听某个 TCP 端口，供 client 连接。
    - Linux 系统通常可监听的端口号范围为 0~65535 ，例如 HTTP 服务器通常监听 TCP 80 端口。
  - client
    - ：称为客户端、主动连接方，由任意个主机担任，可以连接到 server 。

- 例：假设 client 想与某个 server 按 TCP 协议进行通信（比如传输一张图片），则一般流程如下：
  1. client 事先知道 server 的 IP 地址、监听的端口号。
  2. 建立连接：client 发送几个特殊的 TCP 包给 server ，请求用 client 的随机一个端口，连接到 server 的指定一个端口。
  3. 正式通信：双方端口组成一个全双工信道，可以发送任意个包含任意 payload 的 TCP 包。

- 在类 Unix 系统中进行 TCP/UDP 通信时，通信双方需要各创建一个 Socket 文件，以读写文件的方式进行通信。
  - 比如 client 向本机的 Socket 文件写入数据，会被自动传输到 server 端的 Socket 文件，被 server 读取到数据。

### 数据包结构

TCP segment 的结构如下：

![](./tcp.jpg)

- Source Port ：源端口，占 16 bit 空间。
- Dest Port ：目标端口，占 16 bit 。
- Seq number ：序列号，占 32 bit 。
- Ack number ：确认号，占 32 bit 。
- Data offset ：偏移量，占 4 bit 。表示 payload 的起始坐标，即 TCP headers 的总长度。
- Reserved ：保留给未来使用，占 3 bit ，默认值为 0 。
- Flag ：标志符，占 9 bit 。每个 bit 代表一个标志位，默认值为 0 。
  - NS
  - CWR
  - ECE
  - URG=1 ：表示该 TCP 包是紧急数据，应该被优先处理。
  - ACK=1 ：表示确认。注意它与 Ack number 是不同字段。
  - PSH=1 ：表示该 TCP 包应该被发送方立即发送、被接收方立即上报。
    - 例如 Linux 在 TCP 通信时设计了发送缓冲区、接收缓冲区，可暂存一些 bytes 数据。
      - 发送 TCP 包时，默认会等发送缓冲区堆积了较多数据时，才下发到网络层。
      - 接收 TCP 包时，默认会等接收缓冲区堆积了较多数据时，才上报到应用层。
      - 使用缓冲区，能提高通信效率，但增加了通信延迟。
    - 假设缓冲区已有一些 bytes 数据，此时新增一个数据包的 payload ：
      - 如果该数据包设置了 URG=1 ，则会立即处理该包的 payload ，跳过处理缓冲区已有的数据。
      - 如果该数据包设置了 PSH=1 ，则会立即处理该包的 pyaload ，以及缓冲区已有的全部数据。
    - 例如一个应用层的 HTTP 报文可能拆分成多个 TCP 包发送，最后一个 TCP 包设置了 PSH=1 。
  - RST=1 ：表示拒绝 TCP 连接，不愿意接收对方发送的数据包。
  - SYN=1 ：表示请求建立 TCP 连接。
  - FIN=1 ：表示请求关闭 TCP 连接，但依然愿意接收对方发送的数据包，直到正式关闭连接。
- Window size ：表示本机接收窗口的大小，占 16 bit 。
- Checksum ：校验和，占 16 bit 。
  - 计算方法：
    1. 将 TCP headers 中的 Checksum 清零。
    2. 在 TCP headers 之前加上 12 bytes 的伪头部，包含几个字段：Source IP、Dest IP、1 个 保留字节、protocol（传输层协议号）、length（原 headers + payload 的长度）。
    3. 计算整个 TCP 数据包（包括伪头部、原 headers、payload）的 Checksum ，记录到 TCP headers 中。
- Urgent pointer
- Options ：在 TCP headers 的末尾可添加一些额外的配置参数，实现扩展功能。例如：
  - MSS（Maximum Segment Size）：允许传输的 TCP 包的最大体积。
    - 以太网中，IP 包的最大体积 MTU 通常设置为 1500 Bytes 。考虑到 TCP 包封装成 IP 包时需要添加 metadata ，因此通常将 MSS 设置为 1460 bytes 。
    - 如果一个 IP 包超过 MTU ，则会被拆分成多个 IP 包。如果一个 TCP 包超过 MSS ，则会被丢弃。
    - TCP 三次握手时，通信双方可通过 SYN 包协商 MSS、Window scale、SACK-permitted 的值，然后作用于本次 TCP 通信的所有数据包。
  - Window scale ：用于扩展 Window size 的大小。
  - SACK ：用于选择性确认。
  - SACK-permitted ：表示本机启用了 SACK 功能。
  - Timestamps ：时间戳，占 32 bit 。
    - 该时间戳不表示 Unix 时间，而是通常每隔几十 ms 就递增 1 。
    - 常用于计算 TCP 包的传输耗时、 RTT ，防止序号回绕。
  - Nop ：表示 No-Operation ，用作各个 Options 之间的分隔符。
- Payload ：负载，即该数据包负责传递的数据。
  - payload 之前的数据都只是用于描述 TCP 数据包的元数据，称为 TCP headers 。

### 建立连接

- 建立 TCP 连接时需要经过三个步骤，称为 "三次握手" ：

  ![](./socket_1.png)

  1. client 发送一个 SYN=1 的 TCP 包给 server ，表示请求连接到 server 的指定一个 TCP 端口。
  2. server 收到后，回复一个 ACK=1、SYN=1 的 TCP 包，表示接受对方的连接，且自己也请求连接。
      - 如果 client 收到该包，就证明自己发送的包能被对方接收，而对方发送的包也能被自己接收。因此从 client 的角度来看，判断双方能相互通信。
  3. client 收到后，发送一个 ACK=1 的 TCP 包，表示接受对方的连接，从而正式建立连接。
      - 如果 server 收到该包，则从 server 的角度来看，判断双方能相互通信。
      - 如果 server 一直未收到 ACK 包，处于 SYN_RECV 状态，则会在超时之后重新发送 SYN+ACK 包，再次等待。多次超时之后，server 会关闭该连接。

- 建立 TCP 连接时的 Socket 状态变化：
  - `LISTEN`      ：server 正在监听该 Socket ，允许接收 TCP 包。
  - `SYN_SENT`    ：client 已发出 SYN=1 的 TCP 包，还没有收到 SYN+ACK 包。
  - `SYN_RECV`    ：server 已收到 SYN 包，还没有收到 ACK 包。
  - `ESTABLISHED` ：已建立连接。

### 关闭连接

- 关闭 TCP 连接时需要经过四个步骤，称为 "四次分手" ：

  ![](./socket_2.png)

  1. 主动关闭方发送一个 FIN=1 的 TCP 包，表示请求关闭连接。
  2. 被动关闭方收到后，先回复一个 ACK 包，表示同意关闭连接。等自己准备好之后也发送一个 FIN 包，表示请求关闭连接。
  3. 主动关闭方收到后，发送一个 ACK 包，表示自己已关闭连接。
  4. 被动关闭方收到后，正式关闭连接。

- 只有 client 能主动建立连接，但 client、server 都可以主动关闭连接。
  - 建立连接时，通信双方都要发送一个 SYN 包、一个 ACK 包。
  - 关闭连接时，通信双方都要发送一个 FIN 包、一个 ACK 包。

- 关闭 TCP 连接时的 Socket 状态变化：
  - `FIN-WAIT-1`
  - `FIN-WAIT-2`
  - `TIME-WAIT`
    - 主动关闭方在第 3 步之后，已关闭 TCP 连接，而 Socket 处于 TIME-WAIT 状态，还要等待 2*MSL 时间才能变成 CLOSED 状态，从而避免对方来不及关闭 TCP 连接。
    - MSL（Maximum Segment Lifetime）：TCP 段在网络传输中的最大生存时间，超过该时长则会被丢弃。
      - RFC 793 定义的 MSL 为 2 分钟，而 Linux 中 MSL 通常为 30 秒。
    - 如果一个 server 被大量 client 建立 TCP 连接，则建议 server 不要主动关闭 TCP 连接，避免产生大量 TIME-WAIT 状态的 Socket ，浪费内存。这样有两种结果：
      - client 主动关闭连接，则 server 可立即关闭 Socket ，而 client 要保留 TIME-WAIT 状态的 Socket 一段时间。
      - client 不主动关闭连接，则 server 可等 TCP 连接长时间空闲、未用于传输数据，才主动关闭它。
  - `CLOSE-WAIT`
    - 在第 2 步，如果被动关闭方没有立即调用 close() 关闭端口，则会长时间处于 CLOSE-WAIT 状态。
  - `LAST-ACK`
  - `CLOSED` ：TCP、Socket 都已关闭。

### 数据传输

- 建立 TCP 连接之后，通信双方就可以开始传输包含自定义 payload 的 TCP 包。
  - 建立 TCP 连接之后，一般会将 TCP 连接保持一段时间，供双方多次收发数据，称为 keepalive 。等双方不再使用时，才关闭 TCP 连接。
- 一般程序进行 TCP 通信时，不需要自己实现 TCP 协议的具体逻辑，只需调用操作系统的 API ，操作系统会自动完成顺序控制、差错控制等任务。
  - 例如两个 Linux 主机上的程序之间进行 TCP 通信时，可调用 send()、recv() 函数来发送、接收数据。流程如下：
    1. 程序 A 调用 send() 发送一批 bytes 数据。
    2. 程序 A 的操作系统先将 bytes 数据暂存到发送缓冲区，然后取出这些数据作为 payload ，封装为一个或多个 TCP 包，最后发送。
    3. 程序 B 的操作系统收到一个或多个 TCP 包，将其中的 payload 暂存到接收缓冲区。
    4. 等到程序 B 调用 recv() 接收数据，操作系统就取出接收缓冲区中的 bytes 数据。

#### 顺序控制

- TCP 通信时，双方会分别记录 Seq number、Ack number 两个序列号。
  - 如果本机通过 TCP payload 发送了 n bytes 的数据，则将本机记录的 Seq number 增加 n 。
  - 如果本机通过 TCP payload 接收了 n bytes 的数据，则将本机记录的 Ack number 增加 n 。
  - 刚建立 TCP 连接时，双方会分别随机生成一个 Seq number 的初始值，称为 ISN（Initial Sequence Number）。而本机的 Ack number 的初始值取决于对方的 ISN 。
  - 优点：利用序列号，发送方可同时发送多个数据包（只要不超过发送窗口），不必控制发送顺序，反正接收方能根据序列号对这些数据包排序。

- 例：主机 A 向主机 B 发送一个 HTTP 请求，并收到一个 HTTP 响应，其下层的 TCP 通信过程如下
  - 首先 TCP 三次握手：
    1. 主机 A 发送一个 SYN=1 的 TCP 包，表示请求连接。其中：
        - Seq number = 1000 ，假设这是主机 A 的 ISN 。
        - Ack number = 0 ，因为还没收到过数据。
        - payload 长度为 0 。
    2. 主机 B 回复一个 ACK=1、SYN=1 的 TCP 包，表示接受连接。其中：
        - Seq number = 2000 ，假设这是主机 B 的 ISN 。
        - Ack number = 1001 ，表示收到了主机 A 的 Seq number ，预计接收的下一个字节的序列号。
        - payload 长度为 0 。
    3. 主机 A 发送一个 ACK=1 的 TCP 包，正式建立连接。其中：
        - Seq number = 1001 。TCP 握手阶段有点特殊，虽然没有发送 payload ，但双方发出 ACK=1 包时，都会将 Seq number 增加 1 。
        - Ack number = 2001 ，表示收到了主机 B 的 Seq number ，预计接收的下一个字节的序列号。
        - payload 长度为 0 。
  - 然后发送 HTTP 请求：
    1. 主机 A 发送一个 ACK=1 的 TCP 包，包含 400 bytes 的 HTTP 请求报文。其中：
        - Seq number = 1001 ，与上一步相同。
        - Ack number = 2001 ，与上一步相同。
        - payload 长度为 400 bytes 。发送之后，会将本机的 Seq number 增加到 1401 。
    2. 主机 B 回复一个 ACK=1 的 TCP 包。其中：
        - Seq number = 2001 。
        - Ack number = 1401 ，增加了 400 。
        - payload 长度为 0 。
  - 最后收到 HTTP 响应：
    1. 主机 B 发送一个 ACK=1 的 TCP 包，包含 500 bytes 的 HTTP 响应报文。其中：
        - Seq number = 2001 ，与上一步相同。
        - Ack number = 1401 ，与上一步相同。
        - payload 长度为 500 bytes 。发送之后，会将本机的 Seq number 增加到 2501 。
    2. 主机 A 回复一个 ACK=1 的 TCP 包。其中：
        - Seq number = 1401 。
        - Ack number = 2501 ，增加了 500 。
        - payload 长度为 0 。

- 防止序号回绕（Protection Against Wrapped Sequences，PAWS）
  - ：TCP headers 中用 32 bit 空间记录序列号，如果序列号的取值达到最大值，则从 0 开始重新递增，称为回绕。此时接收窗口中同时存在新旧 TCP 包，需要判断它们的先后顺序。
  - 通常每传输 4 GB 数据，序列号就回绕一次。
  - 常见的解决方案是，比较两个 TCP 包 headers 中的 timestamp ，从而判断它们的先后顺序。不过极低的概率下，timestamp 与序列号会同时发生回绕。

- TCP 会话劫持（TCP Session Hijack）
  - ：一种网络攻击方式。假设主机 A 与主机 B 已建立 TCP 连接，攻击者可以运行主机 C ，窃听到当前的 Seq number、Ack number ，从而冒充主机 A 与主机 B 通信。
    - 同时，攻击者对真正的主机 A 进行 DoS 攻击，使它不能与主机 B 通信。
    - 如果攻击者担任主机 A 与主机 B 的通信中间人，比如路由器，则更容易冒充主机 A 。
  - 对策：
    - 随机生成 ISN ，减少被预测的概率。不过依然难以避免被窃听。
    - 启用 SSL 协议，加密 TCP 包中的 payload 。
    - 启用 IPsec 协议，加密 IP 包中的 payload ，即 TCP segment 。

#### 差错控制

- 确认
  - ：发送方每发送一个 TCP 包，都要根据序列号确认它是否传输成功。
  - 例：
    1. 假设通过 TCP 协议传输 300 bytes 的数据，发送方可以发送 3 个 TCP 包，分别携带 100 bytes 的 payload ，分别在 TCP headers 中声明 Seq number = 0 、Seq number = 100 、Seq number = 200 ，表示 payload 中第一个字节的序列号。
    2. 接收方每收到一个 TCP 包，就回复一个 TCP 包，其中 payload 为空，并在 TCP headers 中声明 Ack number ，取值等于 Seq number + payload length ，表示预计接收的下一个字节的序列号。
    3. 接收方收到 ACK 包，则确认序列号小于 Ack number 的数据传输成功。

- 累计确认
  - ：发送方不必按顺序接收 ACK 包，只要收到一个 ACK 包，则认为小于当前 Ack number 的数据全部传输成功。
  - 例：假设发送方发送 3 个数据包，分别携带 100 bytes 的 payload ，Seq number 分别为 0、100、200 。而接收方回复 3 个 ACK 包，Ack number 分别为 100、200、300 。
    - 如果 3 个 ACK 包在传输时全部丢失，则发送方会触发超时重传。
    - 如果第 1、2 个 ACK 包丢失，但第 3 个 ACK 包传输成功，则发送方得知当前的 Ack number = 300 ，说明之前的数据包全部传输成功，不必重传。

- 校验和
  - ：接收方每接收一个数据包，都要计算一次 Checksum ，检查它是否与数据包原有的 Checksum 相同，从而确保数据包在网络传输过程中没有变化。
  - 如果一个数据包不通过校验，或序列号重复，则接收方会丢弃该数据包，导致发送方触发超时重传。

#### 重传

- 当 TCP 包传输失败时，发送方通常会重新发送该包，该机制称为重传（Retransmission）。
  - 什么时候触发重传？通常是根据超时重传、快速重传。
  - 重传哪些 TCP 包？通常是根据 SACK 。

- 超时重传
  - ：如果发送方发送一个数据包之后，超过 RTO（Retransmission Timeout，重传超时） 时长未收到对应的 ACK 包，则重新发送该数据包。
  - 超时的常见原因：
    - 网络延迟突然变大
    - 发送的数据包丢失
    - 回复的 ACK 包丢失
  - RTT（Round Trip Time，往返时间）：一个主机与另一个主机通信时，从发出数据包到收到回复的耗时，是端到端延迟的两倍。
  - 发送方设置的 RTO ，应该略大于 RTT 。
    - 如果 RTO 比 RTT 大很多，则数据包丢失时，要等更久时间才重发。
    - 如果 RTO 比 RTT 小很多，则数据包没有丢失时，也容易重发，加剧网络拥塞。
    - 例如 Linux 会根据网络最近一段时间的 RTT 平均值，动态设置 RTO 。每触发一次超时重传，就会把 RTO 翻倍，然后继续统计 RTT 。

- 快速重传（Fast retransmit）
  - ：如果发送方发送一个数据包之后，没有收到 ACK 包，但之后发送的 3 个数据包都收到 ACK 包，则认为前一个数据包发送失败，不等超时就重传。
  - 例：假设发送方发送 5 个数据包，分别携带 100 bytes 的 payload ，Seq number 分别为 0、100、200、300、400 ，其中第二个包传输失败。则流程如下：
    1. 接收方收到 Seq number = 0 的包，于是回复一个 Ack number = 100 的包。
    2. 接收方未收到 Seq number = 100 的包，却收到 Seq number = 200 的包，发现它的序列号不符合 Ack number 预期，因此不接受该包，并回复一个 Ack number = 100 的包。
    3. 接收方收到 Seq number = 300 和 Seq number = 400 的包，同理，分别回复一个 Ack number = 100 的包。
    4. 发送方收到 3 个 Ack number = 100 的包，判断第二个包传输失败，于是从 Seq number = 100 处重新发送 payload 。
  - 优点：与超时重传相比，快速重传能更快地发现传输失败的包，并重新发送。
  - 缺点：快速重传时，发送方能判断某个 Seq number 的包传输失败，但不知道该包之后的各个包是否传输成功，因此需要重传在该 Seq number 之后的全部包，加剧网络拥塞。对此的解决方案是启用 SACK 功能。

- 选择性确认（Selective Acknowledgements，SACK）
  - ：TCP 协议的一个可选功能。当通信双方都开启 SACK 功能时，接收方可在 TCP Options 中添加 SACK 参数，声明自己已收到哪些范围的数据，使得发送方可判断哪些数据传输失败，并重传这些数据。
  - 例：假设发送方发送 5 个数据包，分别携带 100 bytes 的 payload ，而接收方只收到第 0-99、200-499 bytes 的数据。
    - 如果只是快速重传，则发送方会从 Seq number = 100 处重新发送，重传第 100-499 bytes 的数据，加剧网络拥塞。
    - 如果开启 SACK 功能，则接收方会回复一个 Ack number = 100 的包，并在其中声明 SACK=200-499 ，使得发送方可判断接收方缺少第 100-199 bytes 的数据，并重传这些数据。
  - 由于 TCP Options 整体最多占 40 bytes 空间，所以 SACK 参数最多包含 4 段范围，例如 SACK=0-99,200-499,600-699,800-899 。

- 重复确认（Duplicate SACK，D-SACK）
  - ：TCP 协议的一个可选功能，是基于 SACK 的扩展功能。允许接收方在 SACK 参数中声明的序列号小于当前的 Ack number ，表示重复收到该范围的数据。
  - 例如接收方重复收到第 0-100 bytes 的数据，则回复一个 Ack number = 100 的包，并在其中声明 SACK=0-99 。
  - 优点：通过 D-SACK ，发送方能发现 TCP 包被重复传输，有利于了解网络状态。
    - 假设发送方触发一次超时重传，不能判断超时的原因。如果收到 D-SACK 包，就能判断发送的数据包没有丢失。再结合 Ack number 的值，就能判断超时的原因是网络延迟突然变大，还是之前的 ACK 包丢失。

#### 流量控制

- 如果 TCP 采用串行通信模式，发送方每发送一个数据包，等确认之后才能发送下一个数据包，则发送 n 个数据包需要等待 n 次 RTT ，传输数据的效率太低。
  - 因此 TCP 协议支持并行通信，允许发送方同时发送多个数据包，然后接收方回复多个 ACK 包，整体只需等待一次 RTT 。
    - 优点：大幅提高了传输数据的效率。
    - 缺点：如果同时发送的数据 payload 过多，超过了接收缓冲区的容量，则会导致丢包。为了解决该问题，通常采用滑动窗口的机制。

- 接收窗口（receive window）
  - ：接收方的接收缓冲区的可用空间，单位 bytes 。
  - 接收方可以同时接收多个数据包，将 payload 暂存到接收缓冲区，等处理完了才删除接收缓冲区中的这些数据。
    - 如果接收缓冲区的可用空间不足，则不能接收包含 payload 的新数据包，只能丢包。
  - TCP headers 中的 Window size 表示本机接收窗口的大小，占 16 bit 空间，因此接收窗口最大为 65535 bytes 。
    - 如果需要进一步增加窗口大小，可在 TCP Options 中添加 Window scale 参数，占 14 bit 空间。
      - 此时用 Window size 与 Window scale 的乘积表示接收窗口的大小，因此接收窗口最大为 2^16 * 2^14 = 1 GB 。
    - 每发送一个新的 TCP 包，就可修改本机 Window size 的大小，而 Window scale 在三次握手时就确定不变了。
  - 网络带宽高时，增加接收窗口的大小，能明显提高数据传输速度，即网速。
    - 但网络带宽低、丢包率高时，增加接收窗口的大小，可能加剧网络拥塞。

- 发送窗口（send window）
  - ：发送方的发送缓冲区的可用空间，单位 bytes 。
  - 通过 TCP 协议发送一批 bytes 数据时，发送方会先将数据暂存到发送缓冲区，然后取出这些数据作为 payload ，封装为 TCP 包并发送。等收到 ACK 确认之后，才删除发送缓冲区中对应的数据，腾出空间。
    - 如果发送缓冲区没满，则可以写入新的数据，然后发送。
    - 如果发送缓冲区满了，则不能写入新的数据，因此暂停发送。
    - 综上，发送窗口决定了发送方最多有多少个数据已发送但未 ACK 确认。
  - 发送窗口越大，则允许并行发送的 payload 越多，网速越快。但发送窗口的大小不能超过接收窗口，否则会导致丢包。
  - 例：假设发送窗口的初始大小为 300 bytes ，发送方同时发送 Seq number = 0 、Seq number = 100 、Seq number = 200 的 3 个 TCP 包，每个 TCP 包携带 100 bytes 的 payload 。
    - 此时发送窗口的大小为 0 ，只能暂停发送新的 payload ，等待 ACK 包。
    - 如果发送方收到 Ack number = 100 的 ACK 包，则可以在发送缓冲区写入新的 100 bytes 数据，发送第 4 个 TCP 包。
    - 如果发送方收到 Ack number = 300 的 ACK 包，则可以在发送缓冲区写入新的 300 bytes 数据，发送第 4、5、6 个 TCP 包。

- 滑动窗口（sliding window）
  - ：接收方将接收窗口的大小告诉发送方，然后发送方据此配置发送窗口的大小，一般让发送窗口小于、接近接收窗口。
  - 优点：通过滑动窗口这个机制，可控制并行流量的大小、数据传输速度。

- 操作系统会自动完成滑动窗口等任务。例：假设两个 Linux 主机上的程序之间进行 TCP 通信，程序 A 调用 send() 发送数据，程序 B 调用 recv() 接收数据。
  - 如果程序 B 调用 recv() 处理数据的速度较慢，导致一些 bytes 数据堆积在接收缓冲区中尚未处理，则程序 B 的操作系统会自动减小在 ACK 包中声明的 Window size ，从而通知发送方减小发送窗口。
  - 极端情况下，接收缓冲区满了，此时接收窗口为 0 ，使得发送窗口也为 0 ，称为窗口关闭。
    - 窗口关闭之后，发送方会每隔一定时长，发送一个用于 window probe 的 TCP 包，询问接收方当前接收窗口的大小。如果非 0 ，则发送方可以继续发送数据。
  - 如果接收窗口的大小只有几 bytes ，使得发送窗口也只有几 bytes ，此时 payload 比 TCP header 小得多，传输数据的效率很低，加剧了网络拥塞，称为糊涂窗口综合征。解决方案如下：
    - 接收方通常在接收窗口小于 MSS 时，或者小于接收缓冲区的一半时，就直接关闭接收窗口。
    - 发送方通常启用 Nagle 算法，在满足以下任一条件时才发送数据包：
      - 如果已发送的数据包都 ACK 确认，则立即发送新的数据包，使得发送方至少有一个数据包已发送但未 ACK 确认。
      - 如果发送缓冲区堆积的数据超过 MSS ，则立即发送新的数据包。
    - 有的程序不采用 Nagle 算法，比如 SSH 。因为比起传输数据的效率，它们更追求低延迟、实时性，即使发送缓冲区只有几 bytes 数据，也会立即发送。
      - 在 Linux 上，用 Socket 发送 TCP 数据时默认启用 Nagle 算法，配置 TCP_NODELAY 会禁用 Nagle 算法。

#### 拥塞控制

- 网络拥塞：当网络延迟变大、发生丢包时，会引发超时重传，但重传的数据包又会增加网络负载，导致延迟更大、丢包率更高。
- 为了减轻网络拥塞，发送方会动态计算一个拥塞窗口（cwnd），然后将接收窗口、拥塞窗口中较小的一个值，设置为发送窗口的大小。
<!-- - 慢启动：刚建立 TCP 连接时，发送方给 cwnd 设置一个较小的值。之后每经过一次 rtt 往返通信，就将 cwnd 加 1 。 -->
<!-- 拥塞避免：，，， -->

- TCP 通信双方可采用不同的拥塞控制算法，控制自己发送 TCP 包的过程。
- BBR
  - ：Google 于 2016 年发布的一个 TCP 拥塞控制算法。在网络延迟超过 100ms 、丢包率超过 1% 的场景下，能在发送 TCP 包时明显降低延迟、提高吞吐量。
  - 当网络链路拥塞时，传统的拥塞控制算法 Reno、Cubic 会将数据包放到缓冲区再发送，因此增加了延迟。而 BBR 算法会避免使用缓冲区。
  - Linux 内核 4.9 加入了 BBR 算法，可通过 sysctl 启用。

## UDP

：用户数据报协议（User Datagram Protocol）
- 属于传输层协议，与 TCP 类似。
- 特点：
  - 全双工通信。
  - 面向无连接。
  - 传输不可靠。
- 对比 UDP 与 TCP ：
  - UDP 没有 TCP 的顺序控制、差错控制等功能，只是简单地发送数据包。
    - 使用 UDP 时，如果需要顺序控制、差错控制等功能，可在应用层实现。
  - UDP 的开销更低。比如 TCP 需要一直运行一个服务器，而 UDP 适用于即时通信、广播消息。



<!-- ## QUIC
 -->
