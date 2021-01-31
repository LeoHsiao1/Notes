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
- flags ：
  - UP ：表示网卡已被启用。
  - BROADCAST ：表示支持广播。
  - RUNNING ：表示网卡已连接到网络。
  - MULTICAST ：表示支持组播。
- 地址信息：
  - mtu ：最大传输单元，即网卡能传输的 IP 数据包最大大小，单位 bytes 。
  - inet ：网卡的 IP 地址。
  - netmask ：子网掩码。
  - ether ：网卡的 MAC 地址。
  - txqueuelen ：传输队列的长度。
- IP 数据包的统计数量：
  - RX packets ：接收的数据包总数。
-   TX packets ：发送的数据包总数。
  - bytes ：数据包的总大小。
  - errors ：出错的数据包数。比如校验错误、帧对齐错误。
  - dropped ：因为 buffer 内存不足等原因而被丢弃的数据包数。
  - overrun ：因为缓冲区已满而被丢弃的数据包数。
  - frame ：因为数据帧出错的数据包数，比如长度不能被 8 整除。
  - carrier ：因为载体出错的数据包数，比如半双工模式时不可通信。
  - collisions ：发生碰撞的数据包数。

## route

命令：
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

：可替代 ifconfig、route 命令，且功能更强。

命令：
```sh
$ ip
    link                  # 显示所有网卡的信息
        -s                # 增加显示网卡接收、发送的字节数（该选项要放在 link 之前）
        -s -s             # 增加显示网卡接收、发送的错误包数（该选项要放在 link 之前）
        show eth0         # 只显示指定网卡的信息
        set eth0 up       # 启用网卡
                  down    # 停用网卡
        del eth0          # 删除网卡

    addr                            # 显示所有网卡的信息，及其 IP 地址
        add 10.0.0.1/24 dev eth0    # 给网卡增加一个 IP 及掩码
        del 10.0.0.1/24 dev eth0    # 删除

    neighbour                       # 显示当前网段的其它主机

    route                           # 显示路由表
        add default via 10.0.0.1    # 增加一个默认网关
```

## ping

：常用于基于 ICMP 协议测试网络是否连通、网络延迟、丢包率、域名解析。
- 命令：
  ```sh
  $ ping <host>    # 启动 ping
          -c n     # 最多发送 ICMP 报文多少次（默认为无限次）
          -i n     # 每次发送 ICMP 报文的间隔时间（默认为 1 秒）
          -I eth0  # 使用本机的指定网卡来发送 ICMP 报文（默认自动选取网卡）
  ```
  - host 可以是 IP 地址或域名，如果是域名，在执行时还会显示出域名解析后的 IP 地址。

- 例：
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

- 例：
  ```sh
  [root@Centos ~]# ping google.com
  PING google.com (93.46.8.90) 56(84) bytes of data.

  ^C
  ```
  - 可见它一直尝试连接目标主机，但并没有成功。原因可能是：
    - 与目标主机的物理网络没有连通。
    - 与目标主机的物理网络连通，但是目标主机没有开启 ICMP 协议。
  - ICMP 不是基于 TCP 通信，因此不需考虑目标主机是否开放了 TCP 端口。

## traceroute

：用于测试发送一个数据包到目标主机，显示经过的各个路由节点。
- 命令：
  ```sh
  $ traceroute <host>
              -I    # 发送 ICMP ECHO 数据包
              -T    # 发送 TCP SYN 包，默认端口为 80
              -U    # 发送 UDP 数据表，默认端口是 53
  ```
  - 先探测 TTL 减 1 的路由节点，再探测 TLL 减 2 的路由节点，以此类推，直到 TTL 减为 0 或者到达目标主机。
- 例：
  ```sh
  [root@Centos ~]# traceroute baidu.com
  traceroute to baidu.com (220.181.38.148), 30 hops max, 60 byte packets
  1  100.98.0.1 (100.98.0.1)            7.329 ms  7.170 ms  7.232 ms
  2  * * *
  3  * * *
  4  * * *
  5  * * *
  6  10.47.55.177 (10.47.55.177)        2.073 ms  2.157 ms  1.765 ms
  7  10.1.0.146 (10.1.0.146)            2.674 ms  2.276 ms  2.274 ms
  8  172.16.38.33 (172.16.38.33)        2.876 ms  2.611 ms  2.524 ms
  9  172.16.38.21 (172.16.38.21)        3.030 ms  3.677 ms  2.978 ms
  10  220.181.182.129 (220.181.182.129) 3.389 ms  3.682 ms  4.957 ms
  11  * * *
  12  220.181.182.174 (220.181.182.174) 4.447 ms  3.676 ms  3.902 ms
  13  * * *
  14  * * *
  ```
  - 显示为 * 的路由节点，是因为没有回复 traceroute 发送的数据包。

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
