# Kubernetes

：一个大型的容器编排系统，采用 Golang 开发。
- [官方文档](https://kubernetes.io/docs)
- 简称为 k8s ，8 表示中间的 8 个字母。
- 用于管理大量主机上的大量容器，进行自动编排。
  - 传统部署方式中，每个主机专用于部署某个项目，且项目暂时停用时也不能收回主机，因此资源冗余大。
  - 使用 k8s 部署时，可以自动寻找空闲的主机，部署容器化的应用，提高资源使用率。
- 支持 Linux、MacOS、Windows 系统。
- 提供了滚动更新、一键回滚、服务发现、负载均衡、自动伸缩等功能，提高部署效率。

## 版本

- 2014 年，Google 公司开源了 k8s 项目，它借鉴了 Google 内部的大规模集群管理系统 Borg、Omega 。
- 2015 年，Google 公司将 k8s 项目捐赠给 Linux 基金会下属的云原生计算基金会（CNCF）托管。
- v1.20
  - 2020 年 12 月发布。
  - CRI 弃用了 Docker 引擎，建议改用 containerd 或 CRI-O ，工作效率更高，但不能再通过 docker 命令查看、管理容器。
    - 这是因为 Docker 没有直接支持 CRI 接口，导致 k8s 只能通过 Dockershim 模块间接与 Docker 通信，但维护该模块比较麻烦，现在停止维护该模块。
    - 使用 Docker 构建出的镜像符合 OCI 标准，因此依然可以被 containerd 或 CRI-O 运行。
    - 如果用户继续使用 Docker 运行镜像，则启动 kubelet 时会显示一条警告。
- v1.23
  - 2021 年 12 月发布。
  - 默认启用 PSA（Pod Security admission）服务，在创建 Pod 时根据 Pod 安全标准进行审核。
- v1.24
  - 2022 年 4 月发布。
  - 删除了 Dockershim 模块。

## 架构

- k8s 包含多个组件进程，通常部署在多个主机上，组成分布式集群。
  - 用户可以与 k8s 系统交互，部署自定义的应用，称为工作负载（workload）。
- 每个主机称为节点（Node），分为两种类型：
  - 控制平面节点（Control Plane Node）：又称为主节点（master node），负责控制整个集群、管理所有节点。
  - 工作节点（Worker Node）：负责部署 Pod 。

- 主节点运行以下进程：
  - kube-apiserver
    - ：负责提供 Restful API ，供用户访问、控制 k8s 集群。
    - 默认监听 6443 端口，会被其它 kube 服务访问。
  - kube-controller-manager
    - ：控制器。负责监控、管理 Node、Namespace、Pod、Service 等各种 k8s 资源。
    - 管理 Pod 时，主要根据 Controller 配置。
  - kube-scheduler
    - ：调度器。负责调度 Pod ，根据一些策略决定将每个 Pod 分配到哪个节点上部署。
  - etcd
    - ：一个分布式数据库，用于存储 k8s 的配置、状态数据。
    - 默认监听 2379、2380 端口，仅供本机的 apiserver 访问。
    - 一般将 etcd 部署在主节点上，也可以部署在独立主机上，或者部署在 k8s 集群之外。

- 所有节点运行以下进程：
  - kubelet
    - ：负责管理当前节点上的所有 Pod 。
  - kube-proxy
    - ：负责管理节点的逻辑网络。

- 用户可使用 kubectl 命令，作为客户端与 apiserver 交互，从而管理 k8s 。

### kubelet

- 主要工作：
  - 将当前节点注册到 kube-apiserver 。
  - 监控当前节点。
  - 创建、管理、监控 Pod ，基于容器运行时。
- 默认监听 10250 端口。
- kubelet 部署 Pod 时，会调用 CRI 接口 RuntimeService.RunPodSandbox ，先创建一个沙盒（Pod Sandbox），再启动 Pod 中的容器。
  - Sandbox 负责提供一个 Pod 运行环境，比如设置网络。
  - Sandbox 可以基于 Linux namespace 实现，也可以基于虚拟机实现，比如 kata-containers 。
  - 基于 Linux namespace 实现 Sandbox 时，kubelet 会先在每个 Pod 中运行一个 pause 容器。
    - pause 容器是一个简单程序，便于管理 Linux namespace ，比如创建 network namespace 并共享给其它容器。
    - pause 容器一直以睡眠状态保持运行，避免 Pod 中所有容器进程停止时，Linux namespace 被自动删除。
    - 如果停止 pause 容器，则会导致 kubelet 认为该 Pod 失败，触发重启事件，创建新 Pod 。
    - pause 容器可以与其它容器共用一个 PID namespace ，从而为其它容器启动 1 号进程、清理僵尸进程。不过 k8s 默认禁用了该共享功能，使得其它容器的 1 号进程的 PID 依然为 1 。
- kubelet 中的 PLEG（Pod Lifecycle Event Generator）模块负责执行 relist 任务：获取本机的容器列表，检查所有 Pod 的状态，如果状态变化则生成 Pod 的生命周期事件。
  - 每执行一次 relist ，会等 1s 再执行下一次 list 。
  - 如果某次 relist 耗时超过 3min ，则报错 `PLEG is not healthy` ，并将当前 Node 标记为 NotReady 状态。

### kube-proxy

kube-proxy 主要负责将访问 Service 的流量反向代理到 Pod 。有多种代理模式：
- userspace
  - k8s v1.2 之前的默认模式。
  - 原理：
    - kube-proxy 监听一些端口，反向代理到 Pod 。
    - 配置 iptables 规则，将访问 Service IP 的流量转发到 kube-proxy 监听的端口。
  - 缺点：
    - 流量会先后被 iptables、kube-proxy 转发，需要从内核态传递到用户态，性能较低。
- iptables
  - k8s v1.2 之后的默认模式。
  - 原理：
    - 监听所有 Service、EndPoints 的变化，自动配置 iptables 规则，将访问 Service IP 的流量转发到 EndPoints 。
    - 如果 EndPoints 包含多个 Pod IP ，则有两种负载均衡算法：随机、轮询。
    - 转发数据包时会进行 NAT ，实现透明代理。
      - 将数据包转发给 EndPoints 时，会将数据包的目标 IP 改为 Pod IP ，即 DNAT 。
      - 转发 EndPoints 返回的数据包时，会将数据包的源 IP 改为 Pod IP ，即 SNAT 。
  - 缺点：
    - 修改 iptables 规则时，需要先用 iptables-save 导出，然后修改，最后用 iptables-restore 导入，有一定耗时。
    - 处理每个数据包时，需要线性查找与其匹配的 iptables 规则，时间复杂度为 O(n) 。因此 Service 数量较多时，耗时较久。
- IPVS
  - k8s v1.8 新增的模式，基于 LVS 的 NAT 代理模式。
  - 原理：
    - 为每个 Service IP 创建一个 IPVS ，负责反向代理。
    - 通过 ipset 命令创建一些包含 Service IP 的哈希集合。然后配置 iptables 规则，将访问 ipset 集合的流量交给 IPVS 处理，并进行 NAT 。
  - 优点：
    - 通过 ipset 大幅减少了 iptables 规则的数量，并且哈希查找的速度更快。
    - 支持多种负载均衡算法。

## 资源

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
  - 依赖关系不允许跨命名空间。

### Namespace

：命名空间，用于对某些资源进行分组管理，又称为项目（project）。
- 命名空间可以管理 Pod、Service、PVC 等资源，不同命名空间下的这些资源相互隔离，互不可见。
  - 删除一个命名空间时，会删除其下的所有资源。
  - 可执行 `kubectl api-resources --namespaced=true` 查看被命名空间管理的所有资源类型，比如 Node、IP、StorageClass、PersistentVolumes 等资源不受命名空间管理。
- 一个 k8s 中可以创建多个命名空间。初始有四个：
  ```sh
  default         # 供用户使用
  kube-system     # 供 k8s 系统内部使用，比如部署 apiserver、etcd 等系统服务
  kube-node-lease # 包含各个节点的 lease 对象
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
    # resourceVersion: xx     # 配置文件的版本号，由 k8s 自动更新，是一串随机数字（不是哈希值），全局唯一
  spec:                       # 规格，描述对象的期望状态
    <...>

  # status:                   # 描述对象的实际状态，这部分字段由 k8s 自动写入
  #   <...>
  ```
  - 修改 k8s 中的配置文件时，如果不符合语法，则会报错不能修改。如果加入了未定义的字段，则会自动删除。
  - 对象的 name 必须符合 DNS 命名规范，只能包含 `[a-z0-9.-]` 字符。
    - 在同一 namespace 下，同种对象的 name 不能重复。
    - 每个对象会被自动分配一个 UUID ，在整个 k8s 集群的所有 namespace 中唯一。
  - annotations、labels 采用键值对格式。
    - key、value 都是 String 类型，不能为 bool 等类型。
    - key 只能包含 `[a-zA-Z0-9._-]` 字符，必须以字母、数字开头和结尾。
    - 可以给 key 加上一个 `<dns_domain>/` 格式的前缀。
      - 前缀 `kubernetes.io/` 、`k8s.io/` 保留，供 k8s 系统内部使用。
