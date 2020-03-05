# IP

## ifconfig

用法：
```sh
$ ifconfig                         # 显示已启用网卡的信息
            -a                     # 显示所有网卡的信息
            eth0                   # 显示网卡 eth0 的信息
            up                     # 启用网卡
            down                   # 停用网卡
            10.0.0.1               # 设置网卡的 IP 地址
            netmask 255.255.255.0  # 设置网卡的子网掩码
            broadcast 10.0.0.255   # 设置网卡的广播地址
```

例：
```sh
[root@Centos ~]# ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.0.1  netmask 255.255.255.0  broadcast 10.0.0.255
        ether 52:54:00:59:c1:b7  txqueuelen 1000  (Ethernet)
        RX packets 25883978  bytes 7322687281 (6.8 GiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 24178898  bytes 6035774584 (5.6 GiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 3615476  bytes 2842561090 (2.6 GiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 3615476  bytes 2842561090 (2.6 GiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```
- 主机一般都有一张物理网卡 eth0 ，还有多张虚拟网卡，比如环回地址的网卡 lo 。
- inet ：网卡的 IP 地址。
- ether ：网卡的 MAC 地址。
- flags
  - UP ：表示网卡已被启用。
  - BROADCAST ：表示支持广播。
  - RUNNING ：表示网卡已连接到网络。
  - MULTICAST ：表示支持组播。
- mtu ：最大传输单元，即网卡能传输的数据包最大体积。
- RX packets、TX packets ：表示接收、发送的数据包数。
  - error ：出错的数据包数。比如校验错误、帧同步错误。
  - dropped ：因为 buffer 内存不足等原因而被丢弃的数据包数。
  - overrun ：因为队列已满而被丢弃的数据包数。
  - carrier ：因为载体出错的数据包数，比如半双工模式时不可通信。
  - collisions ：发生碰撞的数据包数。

## route

用法：
```sh
$ route    # 显示本机的路由表
```

例：
```sh
[root@Centos ~]# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         gateway         0.0.0.0         UG    0      0        0 eth0
10.0.0.1        0.0.0.0         255.255.255.0   U     0      0        0 eth0
link-local      0.0.0.0         255.255.0.0     U     1002   0        0 eth0
```

## ip

：用于查看和管理 ip 地址、路由表，功能更强大。

用法：
```sh
$ ip
    addr        # 显示所有网卡的信息（相当于 ifconfig -a）
    route       # 显示路由表（相当于 route 命令）
```
