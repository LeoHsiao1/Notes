# Kubernetes

：目前最流行的容器编排系统。
- 简称为 k8s ，8表示中间的8个字母。
- 历史：
  - 2014年，Google开源了k8s项目，它源于Google内部的大规模集群管理系统Borg。
  - 2015年，Google将k8s项目捐赠给Linux基金会下属的云原生计算基金会（CNCF）托管。
- [Kubernetes中文指南](https://jimmysong.io/kubernetes-handbook/concepts/)

## 框架

- 部署成一个分布式集群，以一个Linux主机为主节点（记作master），其它主机为工作节点（记作Node）。
  - master负责管理整个集群，控制所有Node。
  - master运行以下进程：
    - apiserver ：提供整个k8s系统对外的 RESTful API 。
    - scheduler ：负责调度集群的资源，将Pod分配到某个节点上。
    - controller manager ：负责控制Pod，比如滚动更新、故障检测、自动扩容等。
  - Node运行以下进程：
    - container runtim ：负责管理镜像、容器。
    - kubelet ：负责管理Pod、上报Pod的状态。
    - kube-proxy ：为Service提供访问Pod的网络代理以及负载均衡。
- 通常使用 Docker 作为容器引擎。
- 用 Etcd 数据库存储k8s集群的各种数据。
- 将集群中的资源抽象为 Service、Controller 等多种对象，根据各自的配置文件创建。
  - 配置文件可以是JSON或YAML格式，

## 插件

k8s专注于担任一个容器编排的底层平台，也提供了多种 RESTful API ，方便用户开发插件、上层应用。如下：
- CRI：容器运行时接口（Container Runtime Interface），用于管理容器、镜像。
- CNI：容器网络接口（Container Network Interface），用于管理容器的网络。
- CSI：容器存储接口（Container Storage Interface），用于管理存储资源。

流行插件：
- kube-dns：为k8s集群提供DNS服务。
- Ingress Controller：为服务提供外网入口。
- Prometheus：监控k8s集群的资源。
- Dashboard：提供Web操作页面I。
- Federation：提供跨可用区的集群。
  - k8s原本是部署在同一局域网内的主机上，如果部署在跨地域（Region）的不同主机上，则网络延迟会比较大。
- Fluentd-elasticsearch：采集、管理k8s集群的日志。
- Flannel：用于管理容器网络，比较简单。
- Calico：与Flannel类似，但更复杂、功能更多。

## 管理单元

### Cluster

：集群，由k8s联系在一起的一组主机。

### Node

：节点，k8s集群中的一台主机，可以是物理服务器或者虚拟机。

### Namespace

：命名空间，相当于虚拟化的集群，在逻辑上隔离k8s集群中的资源。
- 一个k8s集群中可以划分多个命名空间，一个命名空间下可以创建多个服务。
- k8s集群初始有两个命名空间：default、kube-system。

### Service

：服务，代表一个应用。
- 用户访问Service的IP就相当于访问一个单独的应用，Service负责反向代理，将用户的访问流量转发给相应的Pod处理。
- 服务是一个抽象的概念。Linux主机上的服务是由运行中的进程提供，而k8s中的服务是由运行中的Pod提供。

### Pod

：容器组，是应用的一个独立运行的实例，是k8s集群中的最小管理单元。
- 一个应用可以运行多个Pod实例，它们被同一个Service反向代理。
- 一个Pod中可以运行多个容器，它们会被部署到同一个Node上，而且：
  - 共享一个网络空间，可以相互通信。对外暴露的访问IP都是Pod IP，因此不能暴露同样的端口号。
  - 共享存储卷，因此多个容器使用存储卷的同一目录时可能发生冲突。
- 虽然可以用 kubectl 手动管理Pod、容器，但是太麻烦。k8s中一般使用Controller管理Pod。
- 当用户请求终止一个Pod时，kubelet会向Pod中的进程发送SIGTERM信号，并将Pod的状态标识为“Terminating”，超过宽限期（默认为30秒）之后再向Pod中仍在运行的进程发送SIGKILL信号。

一个Pod中只运行一个容器的情况最简单，但有时也会运行一些辅助容器（Sidecar）。
- 辅助容器有两种类型：
  - 标准容器：与应用容器差不多。
  - init容器：在创建Pod时最先启动，用于执行初始化任务，执行成功之后就会自动终止。
    - 可以给一个Pod创建多个init容器，它们会按顺序串行执行。当一个init容器执行成功之后，才会启动下一个init容器或应用容器。
    - 如果init容器执行失败，则kubelet默认会重新启动该Pod（由Pod配置的restartPolicy决定）。为了避免反复重启出错，init容器应该满足幂等性。

Pod的状态：
- Pending ：待定。此时kubelet正在部署该Pod。
- Running ：运行中。此时kubelet已经启动了该Pod的所有容器。
- Terminating ：正在终止运行。
- Succeeded ：Pod中所有容器都被正常终止。
- Failed ：Pod已经终止，且至少有一个容器是异常终止。
  <br>当Pod中的容器因为异常而中断运行时，默认会被 kubelet 自动重启，如果重启成功就依然为Running状态。
- Unkown ：状态未知。例如与Pod所在节点通信失败时就会不知道状态。

## 网络

k8s中常见的几种IP地址：
- Node IP：集群中一个主机节点的IP地址。
- Pod IP：一个Pod的IP地址。
- Service IP：不管一个服务运行了多少个Pod实例，都是暴露该IP供集群内的节点访问。
  - 一个服务访问外部时，源地址是Pod IP；外部访问一个服务时，目的地址是Service IP。
  - 每个Service会被k8s分配一个集群内的虚拟IP（没有绑定到设备上），集群内节点可以通过“服务IP+端口号”访问该服务。
- 服务的负载均衡IP：服务通过该IP暴露到集群外，供集群外的主机访问。

k8s中主要研究四种网络通信：
- 同一个Pod内，容器之间的通信
- 同一个服务内，Pod之间的通信
- 同一个集群内，Pod到服务的通信
- 集群内与集群外的通信

## 存储

- ConfigMap：用于保存一些键值对形式的配置信息，以明文保存在 etcd 中。
  <https://blog.51cto.com/wzlinux/2331050>
- Secret：用于保存密码等私密信息，以密文保存，使用时从Secret引用即可。
- Volume：存储卷。
  - 将存储卷挂载到Pod中的某个目录之后，即使Pod被销毁，该目录下保存的数据也不会丢失。
  - 一个存储卷只能挂载到一个Pod。
- Persistent Volume（PV）：持久存储卷。
- PersistentVolumeClaim（PVC）：持久存储卷声明。
  - 一个PV上可以创建多个PVC，挂载到Pod使用。
- StorageClass：存储类
