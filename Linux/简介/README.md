# 简介

## Unix

1969年，贝尔实验室的Ken Thompson借鉴multics系统的设计思路，用汇编语言开发了一个操作系统，取名为Unix。<br />

1972年，Ken Thompson和Dennis Ritchie用C语言重写了Unix系统。随着C语言的流行，Unix系统也成为了当时最流行的操作系统。

后来，Unix系统演化出两个主要分支：

- System V：由贝尔实验室所在的AT&T公司开发，属于商业软件。
- BSD：由加州大学伯克利分校开发，属于自由软件。

## GNU

1983年，Richard Stallman发起了自由软件计划（GNU，GNU is Not Unix），推广自由软件的理念。

- 1985年他又创建了自由软件基金会（Free Software Foundation，FSF），是GNU计划的主要赞助组织。
  - 他认为电子软件的一大优点就是容易拷贝，这是用户的基本自由，不能被非自由软件剥夺。
  - 他希望软件开发者不是靠昂贵的版权费获利，而是靠技术支持等服务获取报酬。简单来说就是“资源免费，服务收费”。
- GPL：GNU通用公共许可证（GNU General Public License），是GNU运动推广的一种开放授权的版权协议。
  - 它允许GNU软件可以被所有人自由地使用、复制、修改和再发布，任何人都不能限制该权利。
  - 自由软件（free software）强调自由，而不是单纯的免费。
  - 计算机软件的功能、设计原理、编程语言本身没有版权，因此一款软件可以被别人反向编程。比如Java语言没有版权，但甲骨文公司拥有JVM和一些类库的版权。
- GNU计划的目标是创建一个完全自由的操作系统，从里到外使用的软件都是自由软件。
  - GNU计划已经开发了很多流行的自由软件，比如早期的gcc、make、bash，后来的GNOME、git。
  - GNU计划本来打算为这个操作系统开发一个内核，称为hurd，但一直没有完成。后来采用Linux内核。

## Linux

1991年，Linus Torvalds开发了Linux内核，将其授权为自由软件。

- Linux内核与诸多GNU软件组合在一起，构成了一个操作系统，称为GNU/Linux。
- Linux在设计上借鉴了Unix，属于类Unix系统。
- Linux诞生之后，社区在自由氛围下很快发展壮大，使Linux超越了Unix。

### Linux的版本

Linux内核（kernel）的版本编号规则为“主版本 . 次版本 . 发布版本 - 修改版本”，例如“2.6.18-92”。

Linux发行版（distribution）是把Linux内核和一些软件整合在一起的产品，常见的如下：

- RHEL：红帽企业版Linux（RedHat Enterprise Linux）
- CentOS：社区企业操作系统（Community Enterprise Operating System）。在RHEL系统的基础上去除了商业软件。目前该项目已被红帽公司收购。
- Fedora：由红帽公司开发。
- Debian
- Ubuntu：基于Debian。
- Linux Mint：基于Ubuntu。
- Gentoo

### X Window

一种图形界面系统，又称为X11。

Linux常见的图形桌面GNOME、KDE都是基于X Window实现的。

### POSIX

POSIX：可移植的操作系统接口（Portable Operating System Interface of UNIX），定义了操作系统为应用程序提供的接口的标准。

- 90年代初，IEEE协会为了提高应用程序在Unix系统上的可移植性，定义了POSIX标准。如果两个操作系统都遵循POSIX标准，则可以将应用程序直接移植。
- Unix系统采用POSIX标准。
- Linux系统也采用POSIX标准，因此Linux上运行的程序能与大部分UNIX系统兼容。
- Windows系统一直沿用1993年推出的Windows NT系统的接口标准。

## 开源

1998年，自由软件阵营中的部分成员分裂出来，并以“开源”为名继续开展活动。

- 开源即对外公布软件的源代码，很多公司利用开源的方法来获取社区的支持，提高软件质量。
- 开源软件不一定是自由软件。
