# Kubernetes

：一个大型的容器编排系统。
- [官方文档](https://kubernetes.io/docs)
- 简称为 k8s ，8 表示中间的 8 个字母。
- 用于管理大量主机上的大量容器，进行自动编排。
  - 传统部署方式中，每个主机专用于部署某个项目，且项目暂时停用时也不能收回主机，因此资源冗余大。
  - 使用 k8s 部署时，可以自动寻找空闲的主机，部署项目的容器，提高资源使用率。。
- 支持 Linux、MacOS、Windows 系统。
- 提供了滚动部署、一键回滚、服务发现、负载均衡、自动伸缩等功能，提高部署效率。

## 版本

- 2014 年，Google 公司开源了 k8s 项目，它借鉴了 Google 内部的大规模集群管理系统 Borg、Omega 。
- 2015 年，Google 公司将 k8s 项目捐赠给 Linux 基金会下属的云原生计算基金会（CNCF）托管。
- 2020 年底，k8s 发布 v1.2 版本。
  - CRI 不再支持 Docker 引擎，建议改用 containerd 或 CRI-O ，工作效率更高，但不能再通过 docker 命令查看、管理容器。
    - 这是因为 Docker 没有直接支持 CRI 接口，导致 k8s 只能通过 Dockershim 模块间接与 Docker 通信，但维护该模块比较麻烦，现在停止维护该模块。
    - 使用 Docker 构建出的镜像符合 OCI 标准，因此依然可以被 containerd 或 CRI-O 运行。
    - 如果用户继续使用 Docker 运行镜像，则启动 kubelet 时会显示一条警告。

## 架构

- k8s 部署成一个分布式集群，以一个主机为主节点（记作 master），其它主机为工作节点（记作 Node）。
  - master 负责管理整个集群，控制所有 Node 。运行以下进程：
    - apiserver ：提供整个 k8s 系统对外的 RESTful API 。
    - scheduler ：负责调度集群的资源，将 Pod 分配到某个节点上。
    - controller-manager ：负责管理 Pod ，比如滚动更新、健康检查等。
  - Node 负责部署 Pod 。运行以下进程：
    - kubelet ：创建、管理 Pod ，并上报 Pod 的状态到 master 。
    - kube-proxy ：提供访问 Pod 的网络代理。
- 用户使用 kubectl 命令，作为客户端与 apiserver 交互，从而管理 k8s 。
- k8s 用 etcd 数据库存储集群的各种数据。

### 管理对象

- k8s 将主机、容器等资源分类为多种对象，用不同的配置文件进行管理。
  - 配置文件可以是 JSON 或 YAML 格式。

主要的管理对象：
- Cluster
  - ：集群，由 k8s 联系在一起的一组主机。
- Node
  - ：节点，k8s 集群中的一个主机。
- Namespace
  - ：命名空间，用于隔离 Service 。
  - 一个 k8s 中可以创建多个命名空间，一个命名空间下可以创建多个服务。
  - k8s 初始有两个命名空间：default、kube-system 。
- Pod
  - ：容器组，是 k8s 的最小管理单元。
  - Docker 以容器形式部署应用，而 k8s 以 Pod 形式部署应用。
    - 在 k8s 中部署一个应用时，用户需要编写其 Pod 的配置文件，然后可以部署一个或多个 Pod 实例。
  - 一个 Pod 由一个或多个容器组成，它们会被部署到同一个 Node 上。而且：
    - 共享一个网络空间，可以相互通信。对外映射的访问 IP 都是 Pod IP ，因此不能暴露同样的端口号。
    - 共享所有存储卷。
- Service
  - ：服务。是对某些 Pod 进行反向代理，代表一个抽象的应用。
  - 一个应用可以部署多个 Pod 实例，拥有不同的 Pod IP ，而且重新部署时 Pod IP 还会变化，因此不方便访问。
    - 用户可以创建一个 Service ，反向代理某些 Pod 。向 Service IP 发送的网络流量，会被自动转发到对应的 Pod IP 。

## API

- 容器运行时接口（Container Runtime Interface，CRI）
  - ：kubelet 调用容器运行时的 API 。
  - 大部分容器运行时并不兼容 CRI ，因此 k8s 还开发了一些 shim 模块，用于将各种容器运行时对接到 CRI 。
    - 后来改为通过 containerd 或 CRI-O 来调用底层的容器运行时。
  - CRI 使得 k8s 与容器运行时解耦，允许 k8s 同时使用多种容器运行时。
