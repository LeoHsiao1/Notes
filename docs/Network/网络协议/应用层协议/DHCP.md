# DHCP

：动态主机配置协议，用于给一些主机动态分配 IP 地址，广泛应用于路由器中。
- 属于应用层协议，基于 UDP 通信。

## 用法

- 一个网络中，每个主机必须绑定不同的 IP 地址，才能通过 IP 协议相互通信。而绑定 IP 地址有两种方式：
  - 静态分配
    - ：比如用户手动给一个主机绑定一个 IP 地址。
    - 缺点：需要手动配置，比较麻烦。
  - 动态分配
    - ：通常是由路由器，根据 DHCP 协议，自动给各个主机分配一个 IP 地址。
    - 缺点：一个主机绑定的 IP 地址可能变化。如果想永久性识别一个主机的身份，建议记录该主机的 Mac 地址。

- 如果一个网络内没有 DHCP server ，各个主机如何通过 IP 协议相互通信？
  - 用户手动给每个主机绑定一个 IP 地址。
  - 或者让每个主机，自己给自己分配一个 IP 地址，不由 DHCP server 决定。
    - 主机自行分配的 IP ，应该是 169.254.0.0/16 子网下的一个随机 IP 。称为链接本地地址（Link-Local Address），是一种 B 类私有地址，只能在内网使用。
    - 主机自行分配 IP 时，需要通过 ARP 协议检查该 IP 在当前内网是否已被使用。

## 原理

- DHCP 协议采用 C/S 工作模式。
  - 运行一个 DHCP server （通常由路由器担任），负责分配 IP 地址。
  - 每个主机作为 DHCP client ，向 DHCP server 发送请求，获得一个 IP 地址。

- DHCP client 申请 IP 地址的流程如下：
  1. Request ： client 广播 discover 报文。（此时 client 与 server 通过 UDP 协议通信，一般使用受限广播报文）
  2. Reply ： server 收到 discover 报文，然后广播 offer 报文，包括准备分配的 IP 地址、默认网关等信息。
  3. Request ： client 收到 offer 报文，然后广播 request 报文，表示请求使用这个 IP 地址。
  4. Reply ： server 收到 request 报文，然后广播 ack 报文，即确认报文，表示确定将这个 IP 地址分配给 client 。

- DHCP server 的主要配置内容：
  - 作用域：指 DHCP server 所管理的 IP 地址的范围，通常为一个连续网段。
  - 排除范围：指作用域内一些不被 DHCP server 分配的 IP 地址。
  - 地址池：作用域内排除掉不分配的 IP 地址，剩下的就是地址池。
  - 租约： client 只能租用每个 IP 地址一段时间。
