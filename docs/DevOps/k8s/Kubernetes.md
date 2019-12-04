# Kubernetes

：简称为 k8s ，8表示中间的8个字母。
- 2014年，Google开源了k8s项目，它源于Google内部的大规模集群管理系统Borg。
- 2015年，Google将k8s项目捐赠给Linux基金会下属的云原生计算基金会（CNCF）托管。
- [Kubernetes中文指南](https://jimmysong.io/kubernetes-handbook/concepts/)

## 原理

k8s是一个分布式集群，以一个节点为主节点（记作master），其它节点为工作节点（记作node）。
- master负责管理整个集群，控制所有node节点。运行的进程包括：
  - apiserver：提供整个k8s系统对外的API，采用RESTful风格。
  - scheduler：负责调度集群的资源，将pod分配到某个节点上。
  - controller manager：负责维护集群的状态，包括故障检测、自动扩展、滚动更新等。
- node上运行的进程包括：
  - kubelet：负责管理pod、上报pod的状态。
  - proxy：为pod提供对外的代理，供用户访问。
- k8s集群中的资源抽象为 service、controller 等多种对象，根据各自的配置文件创建。
  - 配置文件可以是JSON或YAML格式，
- 服务的滚动更新：通过临时创建多个服务的实例，保证在更新过程中不中断服务。

## 管理单元

集群（cluster）
- 由k8s联系在一起的一组主机。
- 使用 Etcd 数据库保存集群各资源的信息。

节点（node）
- k8s集群中的一台主机，可以是物理服务器或者虚拟机。

命名空间（namespace）
- 相当于虚拟化的集群，在逻辑上隔离k8s集群中的资源。
- 一个k8s集群中可以划分 ≥1 个命名空间，一个命名空间下可以创建 ≥1 个服务。
- 初始有两个命名空间：default、kube-system。

服务（service）
- 服务是逻辑上的概念。一个Linux主机中的服务是由一些运行中的进程提供，而k8s中的服务是由运行中的pod提供。

容器组（pod）
- pod是服务的一个独立运行的实例，是k8s集群中的最小管理单元。
- 一个服务可以运行 ≥1 个pod实例，一个pod中可以包含 ≥1 个容器。
- 每个Pod内的容器共享一个网络空间（共享IP地址和端口等）。默认配置下，不同Pod之间的网络互不可见。
- 可以给每个Pod设置 Label 作为标识。
- pod的状态：
  - Pending：待定。此时pod已被kubelet接受，但还未运行。（可能是在下载镜像）
  - Running：pod中的所有容器都已被kubelet创建，正在运行。
  - Succeeded：pod中的所有容器都正常运行结束。
  - failed：pod中的所有容器都因为异常而中断运行。
    <br>当pod中的容器因为异常而中断运行时，默认会被 kubelet 自动重启，如果重启成功就依然为running状态。
  - Unkown：不知道pod的状态。（可能是因为与node通信失败）

## 网络

k8s中常见的几种IP地址：
- 节点IP：集群中一个主机节点的IP地址。
- pod的IP：一个pod的IP地址。当服务访问外部时，使用的是pod级别的ip。
- 服务IP：不管一个服务运行了多少个pod实例，都是暴露该IP供集群内的其它主机访问。
  - 同一个集群内的主机可通过“服务IP+端口号”访问该服务。
- 服务的负载均衡IP：服务通过该IP暴露到集群外，供集群外的主机访问。

k8s中主要研究四种网络通信：
- 同一个pod内，容器之间的通信
- 同一个服务内，pod之间的通信
- 同一个集群内，pod到服务的通信
- 集群内与集群外的通信

## 存储

- ConfigMap：保存一些键值对形式的配置信息，以明文保存。
  <https://blog.51cto.com/wzlinux/2331050>
  所有的配置内容都存储在etcd中
- Secrets：保存密码等私密信息，以密文保存。
- Volume：存储卷。
- Persistent Volume（PV）：持久化存储卷。
- PersistentVolumeClaim（PVC）：用户存储的请求。
- StorageClass：存储类

## Controller

：控制器，用于控制Pod。

常见的Controller：
- ReplicaSet：用于控制Pod的副本数。
  - 在旧版的k8s中名为Replication Controller。
  - 通常写在Deployment中。
- StatefulSet
- Job：定义只执行一次的任务。
- CronJob

### Deployment：

- Deployment：用于定义Pod、ReplicaSet。

例：
```yaml
apiVersion: apps/v1
kind: Deployment            # 该Controller的类型
metadata:                   # 该Controller的元数据
  name: the-deployment
spec:                       # 该Controller的规格
  replicas: 3               # Pod运行的副本数
  selector:                 # 通过Label选择Pod
    matchLabels:
      app: redis
  template:                 # 定义一个Pod模板
    metadata:               # Pod的元数据
      labels:
        deployment: redis
    spec:                   # Pod的规格
      containers:           # 该Pod中包含的容器
      - name: redis         # 该Pod中的第一个容器
        image: redis:5.0.6
        command: ["redis-server"]
        ports:
        - containerPort: 6379   # 相当于Dockerfile中的 export 8080
        env:
        - name: REDIS_PASSWD    # 添加一个名为REDIS_PASSWD的环境变量
          valueFrom:
            secretKeyRef:       # 从secret中获取配置
              name: redis       # 选择名为redis的secret
              key: password     # 获取secret中名为password的key的值
```

## 常用插件

- kube-dns：为k8s集群提供DNS服务。
- Ingress Controller：支持外网连接到服务。
- Heapster：监控k8s集群的资源。
- Dashboard：提供GUI。
- Federation：提供跨可用区的集群。
- Fluentd-elasticsearch：采集、存储、查询k8s集群的日志。

## minikube

：用于运行一个单节点的k8s实验环境。

### 安装

1. 安装docker
2. 安装minikube：

```shell
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube
mv minikube /usr/local/bin
```

3. 安装kubectl

### 命令

```shell
minikube
        start --vm-driver=none    # 启动minikube服务，在容器中运行（默认在虚拟机中运行）
        stop
```

## kubectl

：k8s集群的管理工具。
- 它作为client端，与master节点上的apiserver进程通信，从而进行控制。

### 安装
```shell
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x kubectl
mv kubectl /usr/local/bin
```

### 命令

```shell
kubectl
        version                 # 查看client和server的version
        cluster-info            # 查看当前集群的信息

        create
            -f <file>           # 根据配置文件创建对象

        get
            nodes [name]        # 显示所有（或指定）的node的信息
                -o wide         # 显示更宽的信息
                -o json         # 显示成JSON格式
                -o yaml         # 显示成YAML格式
            pods [name]         # 显示所有（或指定）的pods的信息（默认是当前命名空间的）
            services [name]     # 显示所有（或指定）的服务的信息
            deployments [name]

        delete
            -f ….json           # 删除json文件中指定的资源
            deployment <name>   # 删除指定的deployment
            pods <name>         # 删除指定的pod（如果deployment没被删除，kubelet就会重新创建这种pod）
            pods --all          # 删除所有的pod


        exec
            <pod> <command>            # 在pod中执行命令（默认选择第一个容器）
            <pod> -c <容器> <command>  # 在pod中的指定容器中执行命令
            -it <pod> -c <容器> bash   # 进入pod中的指定容器的终端
```
