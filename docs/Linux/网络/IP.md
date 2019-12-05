# IP

## ifconfig

命令：

```shell
$ ifconfig                         # 显示已启用网卡的信息
            -a                     # 显示所有网卡的信息
            eth0                   # 显示网卡eth0的信息
            up                     # 启用网卡
            down                   # 停用网卡
            10.0.0.1               # 设置网卡的IP地址
            netmask 255.255.255.0  # 设置网卡的子网掩码
            broadcast 10.0.0.255   # 设置网卡的广播地址
```

例：

```
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

- 主机一般都有一张物理网卡eth0，还有多张虚拟网卡，比如环回地址的网卡lo。
- inet：网卡的IP地址。
- ether：网卡的MAC地址。
- flags
  - UP：表示网卡已被启用。
  - BROADCAST：表示支持广播。
  - RUNNING：表示网卡已连接到网络。
  - MULTICAST：表示支持组播。
- mtu：最大传输单元，即网卡能传输的数据包最大体积。
- RX packets、TX packets：表示接收、发送的数据包数。
  - error：出错的数据包数。比如校验错误、帧同步错误。
  - dropped：因为buffer内存不足等原因而被丢弃的数据包数。
  - overrun：因为队列已满而被丢弃的数据包数。
  - carrier：因为载体出错的数据包数，比如半双工模式时不可通信。
  - collisions：发生碰撞的数据包数。

## route

命令：

```shell
$ route    # 显示本机的路由表
```

例：

```
[root@Centos ~]# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         gateway         0.0.0.0         UG    0      0        0 eth0
10.0.0.1        0.0.0.0         255.255.255.0   U     0      0        0 eth0
link-local      0.0.0.0         255.255.0.0     U     1002   0        0 eth0
```

## ip

：用于查看和管理ip地址、路由表，功能更强大。

命令：

```shell
$ ip
    addr        # 显示所有网卡的信息（相当于ifconfig -a）
    route       # 显示路由表（相当于route命令）
```

## ping

：常用于测试网络是否连通、网络延迟、域名解析。

原理：
- 基于ICMP协议，向目标主机发送ICMP报文，根据收到回复的时间间隔就可以知道通信延迟。
- ICMP报文的头部用1个字节记录了该报文的生存期（Time To Live，TTL）。
- ICMP报文每经过一跳路由器，TTL的值就会被减一，当TTL为零时路由器就会丢弃该报文。

命令：

```shell
$ ping <host>    # 启动ping
        -c n     # 最多发送ICMP报文多少次（默认为无限次）
        -i n     # 每次发送ICMP报文的间隔时间（默认为1秒）
        -I eth0  # 使用本机的指定网卡来发送ICMP报文（默认自动选取网卡）
```

- host可以是IP地址或域名，如果是域名，在执行时还会显示出域名解析后的IP地址。

例：

```
[root@Centos ~]# ping baidu.com
PING baidu.com (39.156.69.79) 56(84) bytes of data.
64 bytes from 39.156.69.79 (39.156.69.79): icmp_seq=1 ttl=250 time=37.0 ms
64 bytes from 39.156.69.79 (39.156.69.79): icmp_seq=2 ttl=250 time=37.0 ms
64 bytes from 39.156.69.79 (39.156.69.79): icmp_seq=3 ttl=250 time=37.0 ms
64 bytes from 39.156.69.79 (39.156.69.79): icmp_seq=4 ttl=250 time=37.0 ms
^C
--- baidu.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3003ms
rtt min/avg/max/mdev = 37.008/37.022/37.044/0.136 ms
```

- 可见它成功连接到目标主机，显示出ping的测试结果。
- icmp_seq：表示这是第几个ICMP报文。
- ttl：ICMP报文剩下的生存期。
- time：发出ICMP报文之后，隔了多久才收到回复。
- Linux的ping命令默认每隔一秒向目标主机发送一个ICMP报文，并且会一直发送，要按 `Ctrl+C` 终止。

例：

```
[root@Centos ~]# ping google.com
PING google.com (93.46.8.90) 56(84) bytes of data.

^C
```

- 可见它一直尝试连接目标主机，但并没有成功。原因可能是：
  - 与目标主机的网络不通
  - 与目标主机的网络连通，但是目标主机没有开启ICMP协议

## traceroute

：用于查看发送一个数据包到目标主机时，要经过哪些路由。

命令：

```shell
$ traceroute <host>
```
