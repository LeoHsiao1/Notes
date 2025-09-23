# ARP

：地址解析协议（Address Resolution Protocol），用于根据主机的 IP 地址查询到主机的 MAC 地址，常用于局域网的主机寻址。
- 属于网络层协议。

## 原理

- 假设主机 A 的 IP 为 10.0.0.1 ，想发送以太网帧给 IP 为 10.0.0.2 的主机 B ，则需要查询主机 B 的 Mac 地址，流程如下：
  1. 主机 A 在子网内广播一个 ARP request 包，询问 10.0.0.2 对应的 Mac 地址是什么。
    - 该 ARP 包中记录了主机 A 这个发送方的 IP 地址、Mac 地址。
    - 该 ARP 包封装在以太网帧里，帧头中的目标 Mac 地址填的是 0xffffffff ，表示广播给子网内的所有主机。
  2. 主机 B 收到 ARP request 包，发现询问的 IP 10.0.0.2 是自己网卡绑定的 IP ，于是回复一个 ARP response 包，说明 10.0.0.2 对应的 Mac 地址是什么。
    - 该 ARP 包封装在以太网帧里，帧头中的目标 Mac 地址填的是主机 A 的 Mac 地址。
    - 如果主机 A 一直未收到 ARP response 包，可能是因为当前子网的其它主机未使用该 IP 。
  3. 然后，主机 A 与主机 B 知道了双方的 Mac 地址，便可相互发送以太网帧进行通信。

- 每个主机启动时，会建立一个 ARP 缓存表，记录当前子网内一些 IP 地址及其对应的 Mac 地址。
  - 发送以太网帧给一个 IP 地址时，如果该 IP 已有 ARP 缓存，则使用缓存的 Mac 地址，不必广播 ARP request 包。
  - Linux 系统默认将每条 ARP 记录缓存几十秒就删除。
  - 用户可添加静态 ARP 记录，将某个 IP 固定解析到某个 Mac 地址。主机重启时，所有 ARP 缓存都会删除。

## 相关协议

- Reverse ARP
  - ：反向地址解析协议。局域网的一些主机可能尚未分配 IP ，可发送 RARP 请求到 RARP 服务器，根据当前主机的 Mac 地址，申请分配一个 IP 地址。
  - 该协议已被 DHCP 协议取代。
- Proxy ARP
  - ：允许一个主机代替其它主机回复 ARP response 包。常用于路由器、NAT 网关。
  - 假设主机 A 发出 ARP request 包，询问另一个子网的主机 B 的 Mac 地址。
    - ARP 消息不能跨子网传播，因此主机 B 不会收到 ARP request 包，主机 A 不会收到 ARP response 包。
    - 可以让网关启用 Proxy ARP 功能，在收到 ARP request 包时，回复 ARP response 包，填入主机 B 的 Mac 地址。
- Gratuitous ARP
  - ：允许一个主机在局域网内广播，说明自己的 IP 地址、Mac 地址是什么。
  - 假设主机 B 的 IP 地址或 Mac 地址变化了，
    - 只使用 ARP 协议时，其它主机不会立即知道，要等 ARP 缓存过期，才会重新查询主机 B 的 Mac 地址。
    - 使用 GARP 协议，主机 B 可以主动广播自己的变化，立即影响其它主机。

## ARP 攻击

- 如果局域网一台主机被入侵，则可能对其它主机进行 ARP 攻击：
  - ARP DOS 攻击：攻击者发送大量 ARP 包，对目标主机造成严重负载，比如使得 ARP 缓存表过大、网络通信过多。
  - ARP 欺骗攻击：攻击者回复 ARP response 包，将一些 IP 解析到攻击者的 Mac 地址，从而接收发向这些 IP 的数据包，进行窃听、篡改。
