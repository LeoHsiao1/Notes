# IP

## ifconfig

用法：
```sh
$ ifconfig                         # 显示已启用的网口
            -a                     # 显示所有网口的信息
            eth0                   # 显示网口 eth0 的信息
            up                     # 启用网口
            down                   # 停用网口
            10.0.0.1               # 设置网口的 IP 地址
            netmask 255.255.255.0  # 设置网口的子网掩码
            broadcast 10.0.0.255   # 设置网口的广播地址
```

例：
```sh
[root@CentOS ~]# ifconfig
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
- 一个主机可以有多个网络接口，例如：
  ```sh
  eth0    # 连接到第一个以太网网卡
  wlan0   # 连接到第一个无线网卡
  lo      # 环回网口，地址为 127.0.0.1 。属于虚拟网口，没有连接到物理设备
  ```
- 每个网口有一些配置信息，比如 IP、子网掩码，保存在内核的网络协议栈中。
  - MAC 地址属于网卡的配置信息，与网口无关。
- flags 取值示例：
  - UP ：网口已启用。
  - BROADCAST ：网口支持广播。
  - RUNNING ：网口已连接到网络。
  - MULTICAST ：网口支持组播。
- 地址信息：
  - mtu ：最大传输单元，即网口能传输的 IP 数据包最大大小，单位 bytes 。
  - inet ：网口的 IP 地址。
  - netmask ：子网掩码。
  - ether ：网口的 MAC 地址。
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
$ route       # 显示本机的路由表
    -n        # 将名称解析为 IP
```

- 例：查看路由表
  ```sh
  [root@CentOS ~]# route -n
  Kernel IP routing table
  Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
  0.0.0.0         10.0.1.1        0.0.0.0         UG    0      0        0 eth0    # 缺省路由。默认将数据包通过 eth0 网口发送到 10.1.6.1 网关
  10.0.1.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0    # 将发向 10.0.1.0/24 子网的数据包通过 eth0 网口发出
  169.254.0.0     0.0.0.0         255.255.0.0     U     1002   0        0 eth0    # Link-Local Address
  ```
  - 常见的路由方式：
    - 目标地址在当前网络，因此直接将数据包从某网口发出，直接访问。
    - 目标地址在其它网络，因此下一跳会将数据包发送到一个网关，由它继续路由转发。
      - 该网关必须在当前网络，可直接访问。通常是当前网络的路由器。
  - Flags 的常见取值：
    ```sh
    U     # Up ，该路由为启用状态
    !     # 该路由为禁用状态
    H     # Host ，目的地址是一个主机
    G     # Gateway ，将数据包发送到一个网关
    ```
  - Metric 表示这条路由的跳数，即到目标主机需要经过几次路由转发。默认为 0 。
- 例：修改路由表
  ```sh
  route add default gw 10.0.1.1         # 设置缺省路由
  route del default

  route add -host 10.0.1.2 dev eth0     # 添加一条路由，将发向 10.0.1.2 的数据包通过 eth0 网口发出。其中 -host 表示目的地址是一个主机
  route add -net 10.0.1.0/24 metric 1024 dev eth0   # -net 表示目的地址是一个子网
  route add -net 10.0.1.0/24 gw 10.0.1.1            # 将发向 10.0.1.0/24 子网的数据包路由到网关 10.0.1.1

  route add -host 10.0.1.2 reject       # 拒绝发向指定主机的流量
  ```

- 用 route、ip 命令修改的路由在主机重启之后不会保存。
  - 可以将路由保存在 `/etc/sysconfig/network-scripts/route-xx` 文件中，然后执行 `systemctl restart network` 。

## ip

：可替代 ifconfig、route 命令，且功能更强。

命令：
```sh
$ ip
    link                  # 显示所有网口的信息
        -s                # 增加显示网口接收、发送的字节数（该选项要放在 link 之前）
        -s -s             # 增加显示网口接收、发送的错误包数（该选项要放在 link 之前）
        show eth0         # 只显示指定网口的信息
        set eth0 up       # 启用网口
                  down    # 停用网口
        del eth0          # 删除网口

    addr                            # 显示所有网口的信息，及其 IP 地址
        add 10.0.0.1/24 dev eth0    # 给网口增加一个 IP 及掩码
        del 10.0.0.1/24 dev eth0    # 删除

    neighbour                       # 显示当前网段的其它主机

    route                           # 显示路由表
      add default via 10.0.1.1      # 设置缺少路由
      add 10.0.1.0/24 via 10.0.1.1  # via 相当于 route 命令的 gw
      add 10.0.1.0/24 dev eth0
```

## ping

：常用于基于 ICMP 协议测试网络是否连通、网络延迟、丢包率、域名解析。
- 命令：
  ```sh
  $ ping <host>    # 启动 ping
          -c n     # 最多发送 ICMP 报文多少次（默认为无限次）
          -i n     # 每次发送 ICMP 报文的间隔时间（默认为 1 秒）
          -I eth0  # 使用本机的指定网口来发送 ICMP 报文（默认自动选取网口）
  ```
  - host 可以是 IP 地址或域名，如果是域名，在执行时还会显示出域名解析后的 IP 地址。

- 例：
  ```sh
  [root@CentOS ~]# ping baidu.com
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
  - icmp_seq ：表示这是第几个 ICMP 报文。
  - ttl ：ICMP 报文剩下的生存期。
  - time ：发出 ICMP 报文之后，隔了多久才收到回复，这表示往返时间（RTT）。
  - Linux 的 ping 命令默认每隔一秒向目标主机发送一个 ICMP 报文，并且会一直发送，要按 `Ctrl+C` 终止。

- 例：
  ```sh
  [root@CentOS ~]# ping google.com
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
  [root@CentOS ~]# traceroute baidu.com
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

：一个位于公网的 Web 网站，访问之后会显示本机的公网 IP、地理位置、运营商。
- 不同场景的用法：
  - 在 Web 浏览器上，访问 `cip.cc` 网站。
  - 在 Unix/Linux 上，执行 `curl cip.cc` 。
  - 在 Windows 上，执行 `telnet cip.cc` 。
- 也可查询指定 IP 的信息：`curl cip.cc/8.8.8.8`
- 例：
  ```sh
  [root@CentOS ~]# curl cip.cc
  IP      : 120.241.2.7
  地址    : 中国  广东  深圳
  运营商  : 移动
  数据二  : 广东省深圳市 | 移动
  数据三  : 中国广东深圳 | 移动
  ```
