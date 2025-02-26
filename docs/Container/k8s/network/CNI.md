# CNI

- Docker 原生的网络方案是 bridge ，在主机上创建 OSI 2 层的虚拟网桥。如果多个容器接入同一个 bridge 网络，则分别拥有一个该虚拟子网的 IP ，可以相互通信。
  - 但 bridge 不支持跨主机通信，不能从一个主机访问到另一个主机上的虚拟 IP 。因此不能满足 k8s 集群的需求。
- k8s 默认采用的 CNI 软件是 noop ，只能基于 iptables 配置一些简单的网络规则，缺乏大部分 CNI 功能。因此用户通常会安装第三方的 CNI 软件，比如 Flannel 。

## Flannel

- ：一个 CNI 软件，于 2014 年由 CoreOS 公司发布。
- [GitHub](https://github.com/flannel-io/flannel)
- 原理：在每个主机运行一个守护进程 flanneld ，它会自动完成以下工作：
  - 为每个主机分配一个虚拟子网 subnet ，比如 `10.42.1.0/24` 。每次部署一个 Pod 时，从当前主机的 subnet 中分配一个虚拟 IP ，给该 Pod 使用。
  - 在每个主机创建一个虚拟网口 flannel.1 ，负责在主机之间路由指向虚拟 IP 的流量。所有主机通过虚拟网口 flannel.1 相互连通，组成一个虚拟局域网。
    - 查看本机的虚拟网口 flannel.1 ：
      ```sh
      [root@CentOS ~]# ip addr show dev flannel.1
      7: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default
          link/ether e6:4a:c6:ec:7e:07 brd ff:ff:ff:ff:ff:ff
          inet 10.42.1.0/32 scope global flannel.1
            valid_lft forever preferred_lft forever
          inet6 fe80::14b4:8ff:fec3:4e67/64 scope link
            valid_lft forever preferred_lft forever
      ```
    - 查看隔壁主机的虚拟网口 flannel.1 ：
      ```sh
      [root@CentOS ~]# ip neighbour show dev flannel.1
      10.42.2.0 lladdr 1a:4b:83:67:93:03 PERMANENT
      10.42.3.0 lladdr 7a:54:a4:bf:ce:28 PERMANENT
      ```
    - 可见，每个主机都有一个虚拟网口 flannel.1 ，绑定了一个虚拟 IP 、虚拟 Mac 地址。
  - 在每个主机添加一些 route 规则，处理指向虚拟 IP 的数据包：
    - 如果数据包的目标 IP 属于当前主机的 subnet ，则发送给本机的 Pod 。
    - 如果数据包的目标 IP 属于隔壁主机的 subnet ，则通过虚拟网口 flannel.1 发送给隔壁主机。
  - flanneld 默认会调用 kube-apiserver ，将网络、配置等数据存储到 k8s 自带的 etcd 数据库，因此不必单独部署数据库。

- 假设在主机 A 上， ping 主机 B 上的一个 Pod IP ，则数据包的传输路径为：
  ```yml
  主机 A ：
      ping 发送数据包
            ↓
      虚拟网口 flannel.1
            ↓
      以太网网口 eth0
            ↓
  主机 B ：
      以太网网口 eth0
            ↓
      虚拟网口 flannel.1
            ↓
      Pod 的虚拟网口
  ```
  - 虚拟网口 flannel.1 负责在主机之间路由指向虚拟 IP 的流量。但它是虚拟网口，并不能实现主机之间的以太网通信。
  - 为了将数据包通过以太网传输，从主机 A 发送到主机 B ，虚拟网口 flannel.1 会将数据包进行封装，交给以太网网口发送。工作流程如下：
    - 虚拟网口 flannel.1 收到的是 OSI 3 层的 IP 数据包，会将它封包成 OSI 2 层的以太网帧。
    - 然后将以太网帧，用 VXLAN 技术封包在 OSI 4 层的 UDP 报文中。
      - 该 UDP 报文的目标 IP ，是主机 B 的以太网 IP 。
      - flanneld 怎么知道每个主机的以太网 IP ？
        - 每个主机的 flanneld 进程在启动时，会自动发现本机的第一张以太网网口（通常名为 eth0 ），上报该网口绑定的以太网 IP 。
        - 用户可以在启动 flanneld 进程时，添加 `'--iface=eth1'` 命令行参数，从而使用其它网口。
    - 然后将 UDP 报文，像普通流量一样处理：封装成 IP 数据包，然后从本机的以太网网口发出。
    - 主机 B 的以太网网口收到 IP 数据包时，会发现它包含 VXLAN header ，于是交给 flanneld 处理，进行解包：
      ```yml
      IP 数据包 （目标 IP 是主机 B 的以太网 IP ）
      ↓
      UDP 数据包 （目标 IP 是主机 B 的以太网 IP ）
      ↓
      以太网帧
      ↓
      IP 数据包 （目标地址是 Pod 的虚拟 IP ）
      ```

- 综上，Flannel 的主要功能是，让多台主机组成一个 OSI 3 层的虚拟网络，传输指向虚拟 IP 的流量。
- 缺点：
  - 用 VXLAN 技术在主机之间传输数据包，增加了一个 overlay 虚拟网络层，需要封包、拆包，存在少量的耗时。
  - Flannel 不支持过滤网络流量，不支持 k8s NetworkPolicy 。

## Calico

- ：一个 CNI 软件，于 2016 年发布。
- [GitHub](https://github.com/projectcalico/calico)
- 架构：
  - 在每个主机运行一个守护进程 felix ，负责管理网络流量，可配置路由规则、ACL 规则。
  - felix 可使用 k8s 自带的 etcd 数据库，不必单独部署数据库。
- Flannel 主要提供了虚拟网络的功能，而 Calico 提供了两大功能：
  - 虚拟网络
  - 网络策略
    - Calico 支持 k8s ，因此可集成 Istio 等服务网格，管理微服务的流量。
- Calico 虚拟网络有多种模式：
  - VXLAN
  - IP-in-IP
    - 原理：
      - 在每个主机上创建一个虚拟网口 tunl0 ，担任 OSI 3 层的网桥，连通各个主机。
      - 当本机某个 Pod 发出一个 OSI 3 层的 IP 数据包时，如果目标 IP 属于其它主机的虚拟子网，则封包成 IP 包，再通过虚拟网口 tunl0 发出。
    - 在每个安装了 Calico 的节点上自动配置 iptables 规则。
      - 如果一个 IP 包的源 IP 不属于 Calico 节点，则会 drop 。因此在 k8s 集群外的主机上，即使添加了路由规则，也不能访问到 k8s 集群内的虚拟 IP 。除非将外部主机的 IP 加入 Calico 白名单 FELIX_EXTERNALNODESCIDRLIST 。
      - 默认启用了 natOutgoing 。当 Pod 发送 IP 包给 k8s 集群外的主机时，会自动将源 IP 从 Pod IP 改为当前节点 IP 。收到回复的 IP 包时，会自动将目标 IP 从当前节点 IP 改回 Pod IP 。
  - BGP
    - 原理：
      - 用 BGP 协议在主机之间通告路由信息，给每个主机分配一个 AS 编号。
      - 当本机某个 Pod 发出一个 OSI 3 层的 IP 数据包时，如果目标 IP 属于其它主机的虚拟子网，则直接路由转发给该主机。因此 Calico 实现了纯三层的虚拟网络。
    - 优点：VXLAN、IPIP 都属于隧道模式，需要封包、拆包。而 BGP 属于直接路由模式，效率更高。
    - 缺点：要求所有主机位于以太网的同一子网。如果主机 A 发送网络包给主机 B 时，需要经过第三方主机路由转发，则第三方主机不知道 Calico 的 BGP 路由，会丢弃这个指向虚拟 IP 的数据包。
  - CrossSubnet
    - 原理：自动切换模式。在同一子网内通信时，采用 BGP 直接路由模式。跨子网通信时，采用 VXLAN 或 IPIP 隧道模式。
    - 用法：先启用 VXLAN 或 IPIP 模式，然后添加配置参数 `vxlanMode: CrossSubnet` 或 `ipipMode: CrossSubnet` 。
- Calico 默认基于 Linux iptables 管理网络数据包，也可改用 eBPF 技术。

## Canal

- ：一个 CNI 方案，是组合使用 Flannel 提供的 VXLAN overlay 网络、Calico 提供的网络策略。
- [GitHub](https://github.com/projectcalico/canal)
- Canal 项目于 2016 年发布，于 2018 年停止更新。
- 后来 Calico 也提供了 [类似 Canal 的方案](https://projectcalico.docs.tigera.io/getting-started/kubernetes/flannel/flannel) ，还增加了 VXLAN overlay 的原生功能。
- 例：
  - 查看本机的路由表：
    ```sh
    [root@CentOS ~]# route
    Kernel IP routing table
    Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
    default         10.1.1.1        0.0.0.0         UG    0      0        0 eth0
    10.1.1.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0
    10.42.1.7       0.0.0.0         255.255.255.255 UH    0      0        0 cali62e56a2ef6d
    10.42.1.9       0.0.0.0         255.255.255.255 UH    0      0        0 cali8417d296a09
    10.42.2.0       10.42.2.0       255.255.255.0   UG    0      0        0 flannel.1
    10.42.3.0       10.42.3.0       255.255.255.0   UG    0      0        0 flannel.1
    ```
    - 可见当前主机有一个虚拟网口 flannel.1 ，每个 Pod 有一个虚拟网口 cali*** 。
    - 如果数据包的目标 IP 属于当前主机的 subnet ，则通过虚拟网口 cali*** 发送给 Pod 。
    - 如果数据包的目标 IP 属于隔壁主机的 subnet ，则通过虚拟网口 flannel.1 发送给隔壁主机。

## Cilium

- ：一个 CNI 方案，于 2015 年发布。
- [GitHub](https://github.com/cilium/cilium)
- 主要提供两个维度的功能：
  - 担任 CNI
    - 可以基于 VXLAN overlay、本机路由等网络模式，组建一个 OSI 3 层的虚拟网络。
    - 支持过滤 OSI 3 层、7 层的网络流量，比如身份认证。
  - 替代 kube-proxy
    - Cilium 不基于 Linux iptables 管理网络数据包，而是基于 eBPF 技术，效率更高，吞吐量更大。
    - kube-proxy 通常采用 iptables 代理模式，而 Cilium 通过 eBPF 使用哈希表进行代理，查找速度更快。
    - 基于 eBPF 可以收集更多监控指标。可以用 Prometheus 采集监控指标，也可以使用 Cilium 自带的 Hubble 监控平台。
