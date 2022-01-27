# Kubernetes

：一个大型的容器编排系统，采用 Golang 开发。
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
- v1.23
  - 默认启用 PSA（Pod Security admission）服务，在创建 Pod 时根据 Pod 安全标准进行审核。

## 原理

### 架构

- k8s 包含多个系统进程，通常部署多个主机上，组成分布式集群。
  - 用户可以与 k8s 系统交互，部署自定义的应用，称为工作负载（workload）。
- 每个主机称为节点（Node），分为两种：
  - 主节点（master node）：又称为控制平面节点（control plane node），负责控制整个集群、管理所有节点。
  - 工作节点（worker node）：负责部署 Pod 。

- 主节点运行以下进程：
  - kube-apiserver
    - ：负责提供 Restful API ，供用户访问、控制 k8s 集群。
    - 默认监听 6443 端口，会被其它 kube 服务访问。
  - kube-controller-manager
    - ：负责监控、管理 Node、Namespace、Pod、Service 等各种 k8s 资源。
    - 管理 Pod 时，主要根据 Controller 配置。
  - kube-scheduler
    - ：负责调度 Pod ，根据一些策略决定将 Pod 分配到哪个节点上部署。
  - etcd
    - ：分布式数据库。
    - 默认监听 2379、2380 端口，只被本机的 kube-apiserver 访问，用于存储 k8s 的配置、状态数据。
    - 也可以将 etcd 部署在主节点之外，或集群之外。

- 所有节点运行以下进程：
  - kubelet
    - 主要工作：
      - 将当前节点注册到 kube-apiserver ，然后监控当前节点。
      - 创建、监控、管理 Pod ，基于容器运行时。
    - 默认监听 10250 端口。
  - kube-proxy
    - ：负责管理节点的逻辑网络，基于 iptables 规则。如果节点收到一个发向某个 Pod 的网络包，则自动转发给该 Pod 。
  <!-- - coredns -->
  <!-- - storage-provisioner -->
  <!-- pause -->

- 用户使用 kubectl 命令，作为客户端与 apiserver 交互，从而管理 k8s 。
- k8s 采用基于角色的访问控制（RBAC），控制内部组件之间、用户对组件的访问权限。

### 资源

- k8s 会管理主机、容器等多种对象，又称为资源（resource）。例如：
  - Cluster
    - ：集群，由 k8s 联系在一起的一组主机。
  - Node
    - ：节点，k8s 集群中的一个主机。
  - Namespace
    - ：命名空间，用于隔离某些资源，又称为项目（project）。
      - 不同命名空间下的 Pod、Service 相互隔离。
      - Node、IP、StorageClass、PersistentVolumes 不受命名空间影响。
      - 可执行 `kubectl api-resources --namespaced=true` 查看所有被命名空间影响的资源。
    - 一个 k8s 中可以创建多个命名空间。初始有四个：
      ```sh
      default         # 供用户使用
      kube-system     # 供 k8s 系统内部使用，比如部署 apiserver、etcd 等系统服务
      kube-node-lease # 包含各个节点的 lease 对象
      kube-public     # 公开，未认证的用户也可访问
      ```
  - Pod
    - ：容器组，是 k8s 的最小管理单元。
    - Docker 以容器形式部署应用，而 k8s 以 Pod 形式部署应用。
  - Service
    - ：对某些 Pod 的反向代理，代表一个抽象的应用服务。

- 一些 k8s 对象之间存在上下级依赖关系，上级称为 Owner ，下级称为 Dependent 。
  - 删除一个 Owner 时，默认会级联删除它的所有 Dependent ，反之没有影响。
  - 比如一个 Deployment 是一组 Pod 的 Owner 。如果删除这些 Pod ，但保留 Deployment ，则会自动重新创建这些 Pod 。
  - 依赖关系不允许跨命名空间。

### 配置

- 每种 k8s 对象通过一种配置文件进行管理。
  - 配置文件可以是 JSON 或 YAML 格式。
- 配置文件的一般结构：
  ```yml
  apiVersion: v1              # 与 kube-apiserver 交互时，采用的 API 版本
  kind: <sting>               # 对象的类型
  metadata:                   # 对象的元数据
    name: <sting>             # 名称
    # namespace: default      # 所属的命名空间
    # annotations:            # 注释
    #   <key>: <value>
    # labels:                 # 标签，用于筛选对象
    #   <key>: <value>
  spec:                       # 规格，描述对象的期望状态
    <...>
  status:                     # 描述对象的实际状态
    <...>
  ```
  - 在同一 namespace 下，同种对象的 name 不能重复。
  - 每个对象会被自动分配一个 UUID ，在整个 k8s 集群的所有 namespace 中唯一。
  - annotations、labels 采用键值对格式。
    - key、value 都是 String 类型。
    - key 只能包含 `[a-zA-Z0-9._-]` 字符，必须以字母、数字开头和结尾。
    - 可以给 key 加上一个 `<dns_domain>/` 格式的前缀。
      - 前缀 kubernetes.io/ 、k8s.io/ 保留，供 k8s 系统内部使用。
