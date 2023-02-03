# CNI

k8s 默认采用的 CNI 组件是 noop ，能基于 iptables 配置一些简单的网络规则，但功能较少。因此用户通常会安装第三方的 CNI 软件。例如：

- [Flannel](https://github.com/flannel-io/flannel)
  - 2014 年由 CoreOS 公司发布。
  - Docker 原生的网络方案是，在主机上创建 OSI 2 层的虚拟网桥，称为 bridge 。如果多个容器接入同一个 bridge 网络，则分别拥有一个该虚拟子网的 IP ，可以相互通信。
    - 但 bridge 不支持跨主机通信，不能从一个主机访问到另一个主机上的虚拟 IP 。
    - Flannel 弥补 Docker 的上述缺陷，可以跨主机传输指向虚拟 IP 的流量。
  - 原理：在 k8s 每个节点上运行一个守护进程 flanneld ，它会自动完成以下工作：
    - 为每个节点分配一个虚拟子网 subnet ，比如 `10.42.1.0/24` 。每次部署一个 Pod 时，从当前节点的 subnet 中分配一个虚拟 IP ，给该 Pod 使用。
    - 在每个节点创建一个虚拟网口 flannel.1 ，负责在主机之间传输指向虚拟 IP 的流量。所有节点通过虚拟网口 flannel.1 相互连通，组成一个虚拟局域网。如下：
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
    - 在每个节点添加一些 route 规则，处理发向虚拟 IP 的流量。如下：
      ```sh
      [root@CentOS ~]# route
      Kernel IP routing table
      Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
      default         10.1.51.1       0.0.0.0         UG    0      0        0 eth0
      10.1.1.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0
      10.42.1.7       0.0.0.0         255.255.255.255 UH    0      0        0 cali62e56a00f6d
      10.42.1.9       0.0.0.0         255.255.255.255 UH    0      0        0 cali84131296a09
      10.42.2.0       10.42.2.0       255.255.255.0   UG    0      0        0 flannel.1
      10.42.3.0       10.42.3.0       255.255.255.0   UG    0      0        0 flannel.1
      ```
      - 如果目标 IP 属于当前节点的虚拟子网，则通过对应 Pod 的虚拟网口 cali*** 发出。
      - 如果目标 IP 属于其它节点的虚拟子网，则通过虚拟网口 flannel.1 发出。
    - 假设本机某个 Pod 发出一个 IP 数据包，目标 IP 是 10.42.2.1 ，则传输流程如下：
      1. 宿主机根据 route 规则，将 IP 数据包通过虚拟网口 flannel.1 发出，从而被 flanneld 处理。
      2. flanneld 将 OSI 3 层的 IP 数据包，封装成 OSI 2 层的以太网帧。然后将以太网帧，以 VXLAN 方式封装在 OSI 4 层的 UDP 报文中，目标 IP 设置为其它节点的以太网 IP ，而不是虚拟 IP 。
      3. 该 UDP 报文像普通流量一样被宿主机处理，先转换成 IP 协议包，然后通过物理网口 eth0 发向目标主机。
      4. 目标主机收到该 UDP 报文，发现它包含 VXLAN header ，于是交给 flanneld 处理。被后者拆包成原始的 IP 数据包，发送到对应的 Pod 。
    - flanneld 默认会调用 kube-apiserver ，将网络、配置等数据存储到 k8s 自带的 etcd 数据库，因此不必单独部署数据库。
  - 综上所述，Flannel 能让多台主机组成一个 OSI 3 层的 overlay 虚拟局域网，传输指向虚拟 IP 的流量。




与 Flannel 不同，Calico 不使用覆盖网络。相反，Calico 配置了一个第 3 层网络，该网络使用BGP 路由协议在主机之间路由数据包。这意味着数据包在主机之间移动时不需要包裹在额外的封装层中。
除了网络连接之外，Calico 的网络策略是其最受追捧的功能之一。因此可与服务网格 Istio 集成，管理微服务的流量

- [Calico](https://github.com/projectcalico/calico)
  - ，比较复杂，功能更多。主要是能配置网络策略

- Canal
  - 组合使用 Flannel 与 Calico ，结合两者的优点，使用前者提供的 overlay 网络层、后者提供的网络策略功能
