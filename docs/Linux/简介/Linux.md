# 简介

## Linux

1991 年，Linus Torvalds 开发了 Linux 内核，将其授权为自由软件。
- Linux 内核与诸多 GNU 软件组合在一起，构成了一个操作系统，称为 GNU/Linux 。
- Linux 在设计上借鉴了 Unix ，属于类 Unix 系统。
- Linux 诞生之后，社区在自由氛围下很快发展壮大，使 Linux 超越了 Unix 。

## 版本

Linux 内核（kernel）的版本号规则为 `主版本.次版本.发布版本-修订版本` ，例如 `2.6.18-92` 。

Linux 发行版（distribution）是将 Linux 内核和一些软件整合在一起的产品，常见的几种如下：
- Fedora ：由红帽公司开发。
- RHEL ：红帽企业版 Linux（Red Hat Enterprise Linux），提供了付费的技术支持、更新服务。
- CentOS ：社区企业操作系统（Community Enterprise Operating System）。
  - 它是将 RHEL 系统调整之后再发布，比如去除了商业软件。该项目已被红帽公司收购。
  - CentOS 系统比较稳定可靠，常用于搭建服务器。
  - CentOS 6 于 2011 年发布。
    - 内核版本为 2.6.x 。
    - 集成了 Python 2.6 ，对应命令为 python 。
  - CentOS 7 于 2014 年发布。
    - 内核版本为 3.10.x 。
    - 用 systemd 进程代替 init 进程来初始化系统，用 systemctl 命令代替 service、chkconfig 来管理系统服务。
    - 默认的文件系统从 ext4 改为 xfs 。
    - 管理网络的工具从 ifconfig 改为 ip ，从 netstat 改为 ss 。
    - 管理防火墙的工具从 iptables 改为 firewall-cmd 。
    - 集成了 Python 2.7 ，对应命令为 python 。
  - CentOS 8 于 2019 年发布。
    - 内核版本为 4.18.x 。
    - 用 dnf 代替包管理工具 yum 。
    - 集成了 Python 3.6 ，对应命令为 python3 。

- Debian ：由 Debian 社区开发。
  - Debian 8 ：代号为 jessie ，于 2015 年发布。
  - Debian 9 ：代号为 stretch ，于 2017 年发布。
  - Debian 10 ：代号为 buster ，于 2019 年发布。
  - Debian 11 ：代号为 bullseye 。

- Ubuntu ：基于 Debian 系统。提供的桌面系统很受欢迎。
- Mint ：基于 Ubuntu 系统。
- Gentoo
