# CNI

- Docker 原生的网络方案是 bridge ，在主机上创建 OSI 2 层的虚拟网桥。如果多个容器接入同一个 bridge 网络，则分别拥有一个该虚拟子网的 IP ，可以相互通信。
  - 但 bridge 不支持跨主机通信，不能从一个主机访问到另一个主机上的虚拟 IP 。因此不能满足 k8s 集群的需求。
- k8s 默认采用的 CNI 软件是 noop ，只能基于 iptables 配置一些简单的网络规则，缺乏大部分 CNI 功能。因此用户通常会安装第三方的 CNI 软件，比如 Flannel 。

## Flannel

- ：一个 CNI 软件，2014 年由 CoreOS 公司发布。
- [GitHub](https://github.com/flannel-io/flannel)
- 原理：在每个主机运行一个守护进程 flanneld ，它会自动完成以下工作：
  - 为每个主机分配一个虚拟子网 subnet ，比如 `10.42.1.0/24` 。每次部署一个 Pod 时，从当前主机的 subnet 中分配一个虚拟 IP ，给该 Pod 使用。
  - 在每个主机创建一个虚拟网口 flannel.1 ，负责在主机之间传输指向虚拟 IP 的流量。所有主机通过虚拟网口 flannel.1 相互连通，组成一个虚拟局域网。如下：
    ```sh
    [root@CentOS ~]# ip addr
    7: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN group default
        link/ether e6:4a:c6:ec:7e:07 brd ff:ff:ff:ff:ff:ff
        inet 10.42.1.0/32 scope global flannel.1
          valid_lft forever preferred_lft forever
    ...
    [root@CentOS ~]# ip neighbour show dev flannel.1
    10.42.2.0 lladdr 1a:4b:83:67:93:03 PERMANENT
    10.42.3.0 lladdr 7a:54:a4:bf:ce:28 PERMANENT
    ```
    可见本机通过虚拟网口 flannel.1 连通了多个主机，每个主机都有一个虚拟网口 flannel.1 ，绑定了一个虚拟 IP 、虚拟 Mac 地址。
  - 在每个主机添加一些 route 规则。表示将指向某些虚拟 IP 的网络包，发送给本机上的 Pod ，或者用 VXLAN 技术转发给其它主机上的 Pod 。
  - flanneld 默认会调用 kube-apiserver ，将网络、配置等数据存储到 k8s 自带的 etcd 数据库，因此不必单独部署数据库。
- 综上，Flannel 的主要功能是，让多台主机组成一个 OSI 3 层的虚拟网络，传输指向虚拟 IP 的流量。
- 缺点：
  - 用 VXLAN 技术在主机之间传输数据包，增加了一个 overlay 虚拟网络层，需要封包、拆包，存在少量的耗时。
  - Flannel 不支持管控网络流量，不支持 k8s NetworkPolicy 。

## Calico

- ：一个 CNI 软件，2016 年发布。
- [GitHub](https://github.com/projectcalico/calico)
- 架构：
  - 在每个主机运行一个守护进程 felix ，负责管理网络流量，可配置路由规则、ACL 规则。
  - felix 可使用 k8s 自带的 etcd 数据库，不必单独部署数据库。
- Flannel 主要提供了虚拟网络的功能，而 Calico 提供了两大功能：
  - 虚拟网络
  - 网络策略
    - Calico 支持 k8s NetworkPolicy ，因此可集成 Istio 等服务网格，管理微服务的流量。
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
- Calico 默认基于 Linux iptables 控制网络流量，也可改用 eBPF 技术，性能更高。

## Canal

- ：一个 CNI 方案，是组合使用 Flannel 提供的 VXLAN overlay 网络、Calico 提供的网络策略。
- Canal 项目于 2016 年发布，于 2018 年停止更新。后来 Calico 也提供了 [类似 Canal 的方案](https://projectcalico.docs.tigera.io/getting-started/kubernetes/flannel/flannel) ，还增加了 VXLAN overlay 的原生功能。
- 例：
  - 查看一个主机的路由表：
    ```sh
    [root@CentOS ~]# route
    Kernel IP routing table
    Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
    default         10.1.51.1       0.0.0.0         UG    0      0        0 eth0
    10.1.1.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0
    10.42.1.7       0.0.0.0         255.255.255.255 UH    0      0        0 cali62e56a2ef6d
    10.42.1.9       0.0.0.0         255.255.255.255 UH    0      0        0 cali8417d296a09
    10.42.2.0       10.42.2.0       255.255.255.0   UG    0      0        0 flannel.1
    10.42.3.0       10.42.3.0       255.255.255.0   UG    0      0        0 flannel.1
    ```
    - 可见当前主机有一个虚拟网口 flannel.1 ，每个 Pod 有一个虚拟网口 cali*** 。
    - 如果目标 IP 属于当前主机的虚拟子网，则通过对应 Pod 的虚拟网口 cali*** 发出。
    - 如果目标 IP 属于其它主机的虚拟子网，则通过虚拟网口 flannel.1 发出。
  - 假设本机某个 Pod 发出一个 IP 数据包，目标 IP 是 10.42.2.1 ，则传输流程如下：
    1. 宿主机根据 route 规则，将 IP 数据包通过虚拟网口 flannel.1 发出，从而被 flanneld 处理。
    2. flanneld 将 OSI 3 层的 IP 数据包，封包成 OSI 2 层的以太网帧。然后将以太网帧，用 VXLAN 技术封包在 OSI 4 层的 UDP 报文中，目标 IP 设置为其它主机的以太网 IP ，而不是虚拟 IP 。
    3. 该 UDP 报文像普通流量一样被宿主机处理，先转换成 IP 协议包，然后通过物理网口 eth0 发向目标主机。
    4. 目标主机收到该 UDP 报文，发现它包含 VXLAN header ，于是交给 flanneld 处理。被后者拆包成原始的 IP 数据包，发送到对应的 Pod 。
