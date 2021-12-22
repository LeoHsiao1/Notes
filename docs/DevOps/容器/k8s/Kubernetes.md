# Kubernetes

：一个大型的容器编排系统。
- [官方文档](https://kubernetes.io/docs)
- 简称为 k8s ，8 表示中间的 8 个字母。
- 用于管理大量主机上的大量容器，进行自动编排。
  - 传统部署方式中，每个主机专用于部署某个项目，且项目暂时停用时也不能收回主机，因此资源冗余大。
  - 使用 k8s 部署时，可以自动寻找空闲的主机，部署容器化的应用，提高资源使用率。。
- 支持 Linux、MacOS、Windows 系统。
- 提供了滚动更新、一键回滚、服务发现、负载均衡、自动伸缩等功能，提高部署效率。

## 版本

- 2014 年，Google 公司开源了 k8s 项目，它借鉴了 Google 内部的大规模集群管理系统 Borg、Omega 。
- 2015 年，Google 公司将 k8s 项目捐赠给 Linux 基金会下属的云原生计算基金会（CNCF）托管。
- 2020 年底，k8s 发布 v1.2 版本。
  - CRI 不再支持 Docker 引擎，建议改用 containerd 或 CRI-O ，工作效率更高，但不能再通过 docker 命令查看、管理容器。
    - 这是因为 Docker 没有直接支持 CRI 接口，导致 k8s 只能通过 Dockershim 模块间接与 Docker 通信，但维护该模块比较麻烦，现在停止维护该模块。
    - 使用 Docker 构建出的镜像符合 OCI 标准，因此依然可以被 containerd 或 CRI-O 运行。
    - 如果用户继续使用 Docker 运行镜像，则启动 kubelet 时会显示一条警告。

## 架构

- k8s 部署在多个主机上，组成分布式集群。
- 每个主机称为节点（Node），分为两类：
  - 主节点（master node）：又称为控制平面节点（control plane node），负责管理整个集群。
  - 工作节点（worker node）：负责部署 Pod 。

- 主节点运行以下进程：
  - kube-apiserver
    - ：提供 k8s 集群的 API 。
    - 默认监听 6443 端口，会被其它 kube 服务访问。
  - kube-scheduler
    - ：负责调度集群的资源，将 Pod 分配到某个节点上部署。
  - kube-controller-manager
    - ：负责管理 Pod ，比如滚动更新、健康检查等。
  - etcd
    - ：数据库。默认监听 2379、2380 端口，只被本机的 kube-apiserver 访问。

- 工作节点运行以下进程：
  - kubelet
    - ：基于容器运行时创建、管理 Pod。
    - 默认监听 10250 端口。
  - kube-proxy
    - ：提供访问 Pod 的网络代理。
  <!-- - coredns -->
  <!-- - storage-provisioner -->
  <!-- pause -->

- 用户使用 kubectl 命令，作为客户端与 apiserver 交互，从而管理 k8s 。
- k8s 采用基于角色的访问控制（RBAC），控制内部组件之间、用户对组件的访问权限。

### 资源

- k8s 需要管理主机、容器等多种对象，称为资源（resource）。
- 每种资源通过一种配置文件进行管理。配置文件可以是 JSON 或 YAML 格式。

常见的几种资源：
- Cluster
  - ：集群，由 k8s 联系在一起的一组主机。
- Node
  - ：节点，k8s 集群中的一个主机。
- Namespace
  - ：命名空间。
  - 一个 k8s 中可以创建多个命名空间，一个命名空间下可以部署多个 Pod 。
  - k8s 初始有两个命名空间：
    - default ：供用户使用。
    - kube-system ：用于部署 k8s 系统服务，比如 apiserver、etcd 等。
- Pod
  - ：容器组，是 k8s 的最小管理单元。
  - Docker 以容器形式部署应用，而 k8s 以 Pod 形式部署应用。
- Service
  - ：对某些 Pod 的反向代理，代表一个抽象的应用服务。

## 相关概念

一些 k8s 发行版，基于 k8s ，并封装了其它组件，比如 Web UI、网络插件。
- Rancher ：由 Rancher Labs 公司发布。
- OpenShift ：由 Red Hat 公司发布。
- kubesphere ：由青云公司开源。
- KubeOperator ：由飞致云公司开源。
