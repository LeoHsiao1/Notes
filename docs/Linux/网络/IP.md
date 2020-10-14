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

## DNS 配置

- 可以在 /etc/hosts 文件中配置静态的 DNS 解析规则：
  ```
  127.0.0.1   localhost localhost4
  ::1         localhost localhost6 
  ```
- 可以在 /etc/sysconfig/network-scripts/ifcfg-eth0 文件中配置网卡 eth0 采用的 DNS 服务器：
  ```
  DNS1=202.96.134.133
  DNS2=202.96.128.166
  DNS3=202.96.128.86
  DNS4=114.114.114.114
  ```
- 可以在 /etc/resolv.conf 文件中配置 Linux 系统采用的 DNS 服务器：
  ```
  nameserver 114.114.114.114
  nameserver 8.8.8.8
  ```

## ping

：常用于测试网络是否连通、网络延迟、域名解析。

原理：
- 基于 ICMP 协议，向目标主机发送 ICMP 报文，根据收到回复的时间间隔就可以知道通信延迟。
- ICMP 报文的头部用 1 个字节记录了该报文的生存期（Time To Live ，TTL）。
- ICMP 报文每经过一跳路由器，TTL 的值就会被减一，当 TTL 为零时路由器就会丢弃该报文。

命令：
```sh
$ ping <host>    # 启动 ping
        -c n     # 最多发送 ICMP 报文多少次（默认为无限次）
        -i n     # 每次发送 ICMP 报文的间隔时间（默认为 1 秒）
        -I eth0  # 使用本机的指定网卡来发送 ICMP 报文（默认自动选取网卡）
```
- host 可以是 IP 地址或域名，如果是域名，在执行时还会显示出域名解析后的 IP 地址。

例：
```sh
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
- 可见它成功连接到目标主机，显示出 ping 的测试结果。
- icmp_seq ：表示这是第几个 ICMP 报文。
- ttl ：ICMP 报文剩下的生存期。
- time ：发出 ICMP 报文之后，隔了多久才收到回复。
- Linux 的 ping 命令默认每隔一秒向目标主机发送一个 ICMP 报文，并且会一直发送，要按 `Ctrl+C` 终止。

例：
```sh
[root@Centos ~]# ping google.com
PING google.com (93.46.8.90) 56(84) bytes of data.

^C
```
- 可见它一直尝试连接目标主机，但并没有成功。原因可能是：
  - 与目标主机的物理网络没有连通
  - 与目标主机的物理网络连通，但是目标主机没有开启 ICMP 协议

## traceroute

：用于查看发送一个数据包到目标主机时，要经过哪些路由。

命令：
```sh
$ traceroute <host>
```

## cip.cc

：一个公开的 Web 网站，访问之后会显示本机的公网 IP、地理位置、运营商。
- 不同场景的用法：
  - 在 Web 浏览器上，访问 `cip.cc` 网站。
  - 在 Unix/Linux 上，执行 `curl cip.cc` 。
  - 在 Windows 上，执行 `telnet cip.cc` 。
- 也可查询指定 IP 的信息：`curl cip.cc/8.8.8.8`
- 例：
    ```sh
    [root@Centos ~]# curl cip.cc
    IP      : 120.241.2.7
    地址    : 中国  广东  深圳
    运营商  : 移动
    数据二  : 广东省深圳市 | 移动
    数据三  : 中国广东深圳 | 移动
    ```
