# Kubernetes

：一个流行的容器编排系统。
- [官方文档](https://kubernetes.io/docs/concepts/)
- 简称为 k8s ，8 表示中间的 8 个字母。
- 提供了滚动部署、一键回滚、服务发现、负载均衡、自动伸缩等功能，适合管理大量容器。

## 版本

- 2014 年，Google 开源了 k8s 项目，它源于 Google 内部的大规模集群管理系统 Borg 。
- 2015 年，Google 将 k8s 项目捐赠给 Linux 基金会下属的云原生计算基金会（CNCF）托管。
- 2020 年底，发布 v1.2 版本。
  - 弃用 Docker 作为容器运行时（Container Runtime Interface ， CRI），建议改用 containerd 或 CRI-O 。
    - 如果用户继续使用 Docker 运行镜像，则启动 kubelet 时会显示一条警告。
    - 原本 Docker 没有直接支持 CRI 接口，k8s 只能通过 Dockershim 模块间接与 Docker 通信，但维护该模块比较麻烦，现在停止维护该模块。
    - 使用 Docker 构建出的镜像符合 OCI 标准（Open Container Initiative），因此依然可以被 containerd 或 CRI-O 运行。

## 架构

- k8s 部署成一个分布式集群，以一个 Linux 主机为主节点（记作 master），其它主机为工作节点（记作 Node）。
  - master 负责管理整个集群，控制所有 Node 。
  - master 运行以下进程：
    - apiserver ：提供整个 k8s 系统对外的 RESTful API 。
    - scheduler ：负责调度集群的资源，将 Pod 分配到某个节点上。
      controller-manager ：负责控制 Pod ，比如滚动更新、故障检测、自动扩容等。
  - Node 运行以下进程：
    - kubelet ：负责管理 Pod、上报 Pod 的状态到 master 。\
      kube-proxy ：为 Service 提供访问 Pod 的网络代理以及负载均衡。
- 通常使用 Docker 作为容器引擎。
- 用 etcd 数据库存储 k8s 集群的各种数据。

## 管理对象

k8s 将主机、容器等资源归类为多种对象，用不同的配置文件进行管理。
- 配置文件可以是 JSON 或 YAML 格式。

主要管理对象如下：
- Cluster
  - ：集群，由 k8s 联系在一起的一组主机。
- Node
  - ：节点，k8s 集群中的一个主机，可以是物理服务器或者虚拟机。
- Namespace
  - ：命名空间，用于隔离 Service 。
  - 一个 k8s 集群中可以划分多个命名空间，一个命名空间下可以创建多个服务。
  - k8s 集群初始有两个命名空间：default、kube-system 。
- Service
  - ：服务，代表一个应用。
  - 服务是一个抽象的概念。Linux 主机上的服务是由运行中的进程提供，而 k8s 中的服务是由运行中的 Pod 提供。
  - 用户访问 Service IP 就相当于访问一个独立的应用，Service 会将用户的访问流量转发给相应的 Pod 处理，相当于第四层的反向代理。
- Pod
  - ：容器组，是应用的一个独立运行的实例，是 k8s 集群中的最小管理单元。
  - 一个应用可以运行多个 Pod 实例，它们被同一个 Service 反向代理。
  - 一个 Pod 中可以运行多个容器，它们会被部署到同一个 Node 上，而且：
    - 共享一个网络空间，可以相互通信。对外暴露的访问 IP 都是 Pod IP ，因此不能暴露同样的端口号。
    - 共享存储卷，因此多个容器使用存储卷的同一目录时可能发生冲突。
  - 虽然可以用 kubectl 命令手动管理 Pod ，但是太麻烦。k8s 中一般使用 Controller 管理 Pod 。
