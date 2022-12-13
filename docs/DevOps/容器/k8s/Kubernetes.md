# Kubernetes

：一个大型的容器编排系统，采用 Golang 开发。
- [官方文档](https://kubernetes.io/docs)
- 简称为 k8s ，8 表示中间的 8 个字母。
- 用户可以通过配置文件，定义自己的应用程序，让 k8s 部署。
  - k8s 会自动寻找空闲的主机，部署容器化的应用。
  - 传统部署方式中，每个主机专用于部署某个项目，因此资源利用率低。
- 提供了滚动更新、一键回滚、服务发现、负载均衡、自动伸缩等功能，提高部署效率。
- 支持 Linux、MacOS、Windows 系统。

## 架构

### 组件

- k8s 包含多个组件进程，通常部署在多个主机上，组成分布式集群。
  - 每个主机称为节点（Node），分为两种类型：
    - 控制平面节点（Control Plane Node）：又称为主节点（master node），负责控制整个集群、管理所有节点。
    - 工作节点（Worker Node）：负责部署 Pod 。
  - 部署 k8s 组件时，可以直接运行二进制文件，也可以容器化部署。

- 主节点一般运行以下进程：
  - kube-apiserver
  - kube-controller-manager
  - kube-scheduler
  - etcd

- 所有节点都运行以下进程：
  - kubelet + 容器运行时
  - kube-proxy

### 资源

- k8s 会管理主机、容器等多种对象，又称为资源（resource）。例如：
  - Cluster
    - ：集群，由 k8s 联系在一起的一组主机。
  - Node
    - ：节点，k8s 集群中的一个主机。
  - Namespace
  - Pod
  - Service

- 一些 k8s 对象之间存在上下级依赖关系，上级称为 Owner ，下级称为 Dependent 。
  - 删除一个 Owner 时，默认会级联删除它的所有 Dependent ，反之没有影响。
  - 比如一个 Deployment 是一组 Pod 的 Owner 。如果删除这些 Pod ，但保留 Deployment ，则会自动重新创建这些 Pod 。
  - 依赖关系只能位于同一个命名空间。

### Namespace

：命名空间，用于分组管理某些类型的资源，又称为项目（project）。
- 命名空间可以管理 Pod、Service、PVC 等资源，不同命名空间下的这些资源相互隔离，互不可见。
  - 删除一个命名空间时，会删除其下的所有资源。
  - 可执行 `kubectl api-resources --namespaced=false` 查看不受命名空间管理的资源类型，比如 Node、IP、StorageClass、PersistentVolumes 。
- 一个 k8s 中可以创建多个命名空间。初始有四个：
  ```sh
  default         # 供用户使用
  kube-system     # 供 k8s 系统内部使用，比如部署 apiserver、etcd 等系统服务
  kube-node-lease # 保存节点的 Lease 对象
  kube-public     # 公开，未认证的用户也可访问
  ```

### 配置

- 每种 k8s 对象通过一种配置文件进行管理。
  - 配置文件可以是 JSON 或 YAML 格式。
- 配置文件的一般结构：
  ```yml
  apiVersion: v1              # 与 apiserver 交互时，采用的 API 版本
  kind: <sting>               # 对象的类型
  metadata:                   # 对象的元数据
    name: <sting>             # 名称，必填
    namespace: default        # 所属的命名空间
    annotations:              # 注释
      <key>: <value>
    labels:                   # 标签，用于筛选对象
      <key>: <value>
    # creationTimestamp: xx   # 创建时间，格式如 "2022-01-01T11:00:01Z"
    # ownerReferences: xx     # 指向上级对象，如果存在的话
    # resourceVersion: xx     # 配置文件的版本号，由 k8s 自动更新，是一串随机数字（不是哈希值），全局唯一
    # uid: xx                 # 每个对象会被分配一个 UID ，在整个 k8s 集群中唯一
  spec:                       # 规格，描述对象的期望状态
    <...>

  # status:                   # 描述对象的实际状态，这部分字段由 k8s 自动写入
  #   <...>
  ```
  - 修改 k8s 中的配置文件时，如果不符合语法，则会报错不能修改。
    - 如果加入了未定义的字段，则会自动删除。
  - 对象的 name 大多需要符合 DNS 命名规范：只能包含 `[a-z0-9.-]` 字符，以字母、数字开头和结尾。
    - 在同一 namespace 下，同种对象的 name 不能重复。
  - annotations、labels 采用键值对格式。
    - key、value 都是 String 类型，不能为 bool 等类型。
    - key 只能包含 `[a-zA-Z0-9._-]` 字符，以字母、数字开头和结尾。
      - 可以给 key 加上一个 `<dns_domain>/` 格式的前缀。
      - 前缀 `kubernetes.io/` 、`k8s.io/` 保留，供 k8s 系统内部使用。
- 可选添加 `metadata.finalizers` 字段，定义终结器。
  - 当 k8s 删除一个对象时，如果定义了 finalizers ，则会调用相应的终结器，并添加 `metadata.deletionTimestamp` 字段，将对象标记为 terminating 状态。直到 finalizers 字段为空，才会实际删除对象。
  - 例如 PersistentVolume 对象默认定义了 finalizers ，当不被 Pod 使用时，才能删除。
    ```yml
    finalizers:
    - kubernetes.io/pv-protection
    ```

## 版本

- 2014 年，Google 公司开源了 k8s 项目，它借鉴了 Google 内部的大规模集群管理系统 Borg、Omega 。
- 2015 年，Google 公司将 k8s 项目捐赠给 CNCF 基金会托管。
- k8s 计划每年发布三四个子版本，更新一些 feature 。
  - 增加一个 feature 的一般流程：
    1. 在某个 k8s 版本，首次加入该 feature 的代码，标为 alpha 阶段，默认不启用。可以在启动 k8s 组件时，通过命令行参数 `--feature-gates=feature1=true,feature2=true,...` 启用。
    2. 在下一个 k8s 版本，将该 feature 标为 beta 阶段，默认启用，可以禁用。此时该 feature 已通过 alpha 试用，但还不稳定，可能发生不兼容变化。
    3. 再等一个 k8s 版本，将该 feature 标为 stable 阶段（又称为 GA ），不能禁用。
  - 删除一个 feature 的一般流程：
    1. 在某个 k8s 版本，将该 feature 标为 deprecated 状态，默认禁用，可以启用。
    2. 等一两个 k8s 版本之后，将该 feature 的代码从 k8s 删除。
  - [feature-gates 列表](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates)

历史版本：
- v1.20
  - 于 2020 年 12 月发布。
  - 弃用 Dockershim ，因此 CRI 不再支持 Docker 引擎，不能再通过 docker 命令查看、管理 k8s 容器。建议改用 containerd 或 CRI-O ，工作效率更高。
    - Docker 没有直接支持 CRI 接口，导致 k8s 只能通过 Dockershim 模块间接与 Docker 通信，但维护该模块比较麻烦，现在停止维护该模块。
    - 使用 Docker 构建的镜像符合 OCI 标准，因此依然可以被 containerd 或 CRI-O 运行。
- v1.21
  - 于 2021 年 4 月发布。
  - 弃用 PodSecurityPolicy ，建议改用 PSA 。
- v1.22
  - 于 2021 年 8 月发布。
  - 允许在节点上启用 Swap 。
- v1.23
  - 于 2021 年 12 月发布。
  - [GA] 支持 IPv6 协议
- v1.24
  - 于 2022 年 5 月发布。
  - 删除 Dockershim 。
  - beta 阶段的 API 不再默认启用。
  - [GA] Job suspend
- v1.25
  - 于 2022 年 8 月发布。
  - [GA] 支持 Cgroup v2
  - [GA] Ephemeral Containers
  - [GA] PSA（Pod Security admission）：用于在创建 Pod 时根据 Pod 安全标准进行审核。
