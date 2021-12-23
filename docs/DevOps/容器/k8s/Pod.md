# Pod

## 原理

- 一个 Pod 由一个或多个容器组成，它们会被部署到同一个 Node 上。而且：
  - 共享一个网络空间，可以相互通信。对外映射的访问 IP 都是 Pod IP ，因此不能暴露同样的端口号。
  - 共享所有存储卷。
- 用 kubectl 命令手动管理 Pod 比较麻烦，因此一般用 Controller 管理 Pod 。
  - 用户需要编写 Controller 配置文件，描述如何部署一个应用的 Pod 。然后创建该 Controller ，k8s 就会自动部署其 Pod 。

## Controller

：控制器，用于管理 Pod 。
- Controller 分为 Deployment、StatefulSet 等多种类型。

### Deployment

：默认的 Controller 类型，用于部署无状态的 Pod 。

配置文件示例：
```yml
apiVersion: v1
kind: Deployment            # 该 Controller 的类型
metadata:                   # 该 Controller 的元数据
  annotations:
    creator: Leo
  labels:
    app: redis-1
  name: deployment-redis-1
  namespace: default
spec:                       # Controller 的规格
  replicas: 3               # Pod 运行的副本数
  selector:                 # 选择 Pod
    matchLabels:
      app: redis-1
  template:                 # 开始定义 Pod 的模板
    metadata:               # Pod 的元数据
      labels:
        app: redis-1
    spec:                   # Pod 的规格
      containers:           # 定义该 Pod 中的容器
      - name: redis-1       # 该 Pod 中的第一个容器
        image: redis:5.0.6
        command: ["redis-server /opt/redis/redis.conf"]
        ports:
        - containerPort: 6379   # 相当于 Dockerfile 中的 export 8080
```
- selector ：选择器，根据 labels 筛选对象。匹配的对象可能有任意个（包括 0 个）。
  - 当 selector 中设置了多个筛选条件时，只会选中满足所有条件的对象。
  - 当 selector 中没有设置筛选条件时，会选中所有对象。
  - 例：
    ```yml
    selector:
      matchLabels:
        app: redis-1    # 要求 labels 中存在该键值对
      matchExpressions:
        - {key: app, operator: In, values: [redis-1, redis-2]}  # 要求 labels 中存在 app 键，且值为 redis-1 或 redis-2
        - {key: app, operator: Exists}                          # 运算符可以是 In、NotIn、Exists、DidNotExist
    ```
  - Deployment 的 spec.selector 会被用于与 spec.template.metadata.labels 进行匹配，从而筛选 Pod 。

- Deployment 的 spec.template 部分就是 Pod 的配置内容，当用户修改了 template 之后（改变 ReplicaSet 不算），k8s 就会创建一个新版本的 Deployment ，据此重新部署 Pod 。
  - k8s 默认会保存最近两个版本的 Deployment ，便于将 Pod 回滚（rollback）到以前的部署状态。
  - 当用户删除一个 Deployment 时，k8s 会自动销毁对应的 Pod 。当用户修改一个 Deployment 时，k8s 会滚动更新，依然会销毁旧 Pod 。

- 当用户修改一个 Deployment 的配置时，k8s 自动采用滚动更新（Rolling Update）的方式，保证在更新过程中不中断服务。流程如下：
  1. 创建一个新的 ReplicaSet 对象，部署需要的 Pod 数。
  2. 将旧 Pod 的流量迁移到新 Pod 。
  3. 将旧 Pod 数减至 0 ，然后删除旧的 Deployment 。

### ReplicaSet

：副本集（RC），用于控制一个应用的 Pod 实例数量。
- 取代了 k8s 早期版本的副本控制器（Replication Controller，RS），会被 Deployment 调用。
- 假设用户指定运行 n 个 Pod ，ReplicaSet 会自动控制可用的 Pod 数量，使其等于 n 。
  - 通过健康检查的 Pod 才计入可用数量。
  - 如果可用的 Pod 数多于 n ，则停止多余的 Pod 。
  - 如果可用的 Pod 数少于 n ，则增加部署 Pod 。包括以下情况：
    - 已有的 Pod 故障，比如部署失败、部署之后未通过健康检查。
    - 已有的 Pod 需要的部署资源不足，比如 Pod 所在 Node 故障。
- 通过 ReplicaSet ，可以方便地调整 Pod 数量，实现横向扩容、缩容。

### StatefulSet

：与 Deployment 类似，但部署的是有状态服务。
<!-- - 无状态应用：不需要保持连续运行，可以随时销毁并从镜像重新创建。
使用数据卷
- 一个有状态服务的每个 Pod 实例使用独立的资源、配置文件，不能随时创建、销毁 Pod ，甚至连 Pod 名都不能改变。
- 例如：以无状态服务的方式运行一个 CentOS 容器，所有状态都存储在容器里，不可靠。改成 StatefulSet 方式运行，就可以漂移到不同节点上，实现高可用。 -->

### DaemonSet

：与 Deployment 类似，但部署的是宿主机上的 daemon 服务，例如监控、日志服务。
- 一个 DaemonSet 服务通常在每个宿主机上只需部署一个 Pod 实例。

### Job

：与 Deployment 类似，但部署的是只执行一次的任务。

### CronJob

：与 Deployment 类似，但部署的是定时任务或周期性任务。

## Sidecar

一个 Pod 中只运行一个容器的情况最简单（称为主容器），但有时也会运行一些辅助容器（Sidecar）。

辅助容器有两种类型：
- 标准容器：与主容器差不多。
- init 容器：在创建 Pod 时最先启动，执行一些初始化任务，执行完成之后会自动退出。
  - 可以给一个 Pod 设置多个 init 容器，它们会按顺序串行执行。当一个 init 容器执行成功之后，才会启动下一个 init 容器或应用容器。
  - 如果某个 init 容器启动失败或异常退出，则 kubelet 会重新启动该 Pod 。
  - 重启 Pod 时会重新启动各个 init 容器。因此，为了避免多次重启 Pod 时出错，init 容器的行为应该满足幂等性。

## Horizontal Pod Autoscaling

：Pod 的水平方向上的自动伸缩（HPA）。
- k8s 会监控服务的一些 metrics 指标（比如 CPU 负载），当超过一定阙值时就自动增加 ReplicaSet 数量，从而实现服务的横向扩容。

## 主机调度

部署 Pod 时，k8s 的 scheduler 会给 Pod 自动分配一个 Node（这一过程称为主机调度），然后由 Node 上的 kubelet 部署该 Pod 。
- scheduler 会综合考虑 Affinity、Taint、Tolerations 等因素，从而选出一个 Node 。
- 如果 Pod 所在的 Node 出现故障，该 Pod 会被立即迁移到其它 Node 运行。

### Affinity

：节点的亲和性，表示 Pod 适合部署在什么样的 Node 上。
- 用法：先给 Node 添加 Label ，然后在 Pod spec 中配置该 Pod 需要的 Node Label 。
- 亲和性的主要分类：
  - requiredDuringScheduling ：当 Pod 开始部署时，只能部署到满足条件的 Node 上。如果没有这样的 Node ，则重新部署。（硬性要求）
  - preferredDuringScheduling ：当 Pod 开始部署时，优先部署到符合条件的 Node 上。如果没有这样的 Node ，则部署到其它 Node 上。（软性要求）
  - RequiredDuringExecution ：当 Pod 正在运行时，如果 Node 变得不满足条件，则重新部署。（硬性要求）
  - IgnoredDuringExecution ：当 Pod 正在运行时，如果 Node 变得不满足条件，则忽略该问题，继续运行 Pod 。（软性要求）
- 例：
```yml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: k1
            operator: In
            values:
            - v1.0
            - v1.1
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: k2
            operator: In
            values:
            - v2
```
- 上例中在 nodeAffinity 下定义了两个亲和性。
- nodeSelector 下的条件只要满足一个即可，matchExpressions 下的条件要全部满足。
- 条件的 operator 可以是以下类型：
  - Exists ：Node 上存在该 key 。
  - DoesNotExist ：与 Exists 相反。
  - In ：Node 上存在该 key ，且其值在给定的列表中。
  - NotIn ：与 In 相反。
  - Gt ：Node 上存在该 key ，且其值大于给定值。
  - Lt ：与 Gt 相反，是小于。

### Taint、Tolerations

- Node Taint ：Node 的污点。
- Pod Tolerations ：Pod 的容忍度。
  - scheduler 不会在将 Pod 调度到有污点的节点上，除非 Pod 能容忍该污点。
  - 搭配使用污点和容忍度，可以限制某个 Pod 只能被调度到指定 Node 上。

例：
- 给 Node 添加污点：
    ```sh
    kubectl taint nodes node1 k1=v1:NoSchedule
    ```
- 在 Pod spec 中配置容忍度：
    ```yml
    spec:
      containers:
        ...
      tolerations:
      - key: "k1"
        operator: "Equal"
        value: "v1"
        effect: "NoSchedule"
      - key: "k2"
        operator: "Exists"
        effect: "PreferNoSchedule"
      - key: "k3"
        operator: "Exists"
        effect: "NoExecute"
        tolerationSeconds: 3600
    ```
    - 污点的效果分为三种：
      - NoSchedule ：如果 Pod 不容忍该污点，则不部署到该 Node 上。如果已经部署了，则继续运行该 Pod 。
      - PreferNoSchedule ：如果 Pod 不容忍该污点，则优先部署到其它 Node 上，不行的话才部署到该 Node 上。
      - NoExecute ：如果 Pod 不容忍该污点，则不部署到该 Node 上。如果已经部署了，则驱除该 Pod 。
        - 可以额外设置 tolerationSeconds ，表示即使 Pod 容忍该污点，也最多只能保留指定秒数，超时之后就会被驱除，除非在此期间该污点消失。
    - 在 Tolerations 中：
      - 当 operator 为 Equal 时，如果 effect、key、value 与 Taint 的相同，则匹配该 Taint 。
      - 当 operator 为 Exists 时，如果 effect、key 与 Taint 的相同，则匹配该 Taint 。
      - 如果不指定 key ，则匹配 Taint 的所有 key 。
      - 如果不指定 effect ，则匹配 Taint 的所有 effect 。

## Pod 的生命周期

Pod 被 kubelet 启动、终止的大致流程：
- 初始化：按顺序启动各个 init 容器。
- 启动  ：启动主容器、sidecar 容器。
- 运行  ：会被探针定期探测。
- 终止  ：终止各个容器。
- 重启  ：kubelet 会按照 restartPolicy 重启容器。

### 状态

以下是一个 Pod 对象的状态示例：
```yml
apiVersion: v1
kind: Pod
metadata:
  ...
spec:
  containers:
    ...
  restartPolicy: Always   # Pod 中的容器 restartPolicy
  schedulerName: default-scheduler
  ...
status:
  conditions:             # Pod 的状态
  - type: Initialized
    status: "True"        # 结合 type、status 来看，该 Pod 已初始化
    lastProbeTime: null   # 上次探测状态的时刻
    lastTransitionTime: "2019-12-24T08:20:23Z"  # 上次状态改变的时刻
  - type: Ready
    status: "True"
    lastProbeTime: null
    lastTransitionTime: "2019-12-24T08:21:24Z"
  ...
  containerStatuses:      # 容器的状态
  - containerID: docker://2bc5f548736046c64a10d9162024ed102fba0565ff742e16cd032c7a1b75cc29
    image: harbor.test.com/test/redis:5.0.6_1577092536
    imageID: docker-pullable://harbor.test.com/test/redis@sha256:db3c9eb0f9bc7143d5995370afc23f7434f736a5ceda0d603e0132b4a6c7e2cd
    name: redis
    ready: true
    restartCount: 0
    state:
      running:
        startedAt: "2019-12-24T08:21:23Z"
  hostIP: 192.168.120.23
  podIP: 10.244.57.150
  phase: Running
  startTime: "2019-12-24T08:20:23Z"
```
- status.phase 记录了 Pod 目前处于生命周期的哪一阶段，有以下几种取值：
  - Pending ：待定。此时 kubelet 正在部署该 Pod ，包括分配 Node、拉取镜像、启动容器等。
  - Running ：运行中。此时 kubelet 已经启动了该 Pod 的所有容器。
  - Succeeded ：Pod 中的所有容器都已经正常终止。
  - Failed ：Pod 中的所有容器都已经终止，且至少有一个容器是异常终止。
    - Failed 的 Pod 会被 kubelet 自动重启，如果重启成功则会变回 Running 。
  - Unkown ：状态未知。例如与 Pod 所在节点通信失败时就会不知道状态。

- status.conditions 是一个数组，包含了对 Pod 多种状态条件的判断，如下：
  - PodScheduled ：Pod 已被调度到一个节点上。
  - Unschedulable ：Pod 不能被调度到节点上。可能是缺乏可用节点、缺乏挂载卷等资源。
  - Initialized ：Pod 中的所有 init 容器都已成功启动（不管是否运行结束）。
    - 运行 init 容器的过程中，Pod 处于 pending 阶段，Initialized 条件为 True 。
  - ContainersReady ：Pod 中的所有容器已成功启动。
  - Ready ：Pod 处于就绪状态。此时 k8s 才允许该 Pod 被 Service 发现。

- status.containerStatuses.state 记录了容器的状态，有以下几种取值：
  - waiting ：正在准备启动。比如拉取镜像、取用 ConfigMap ，或者等待重启。
  - running ：正在运行。
  - terminated ：已终止。

- Pod 的状态取决于容器的状态。因此，分析 Pod 的状态时，需要考虑更细单位的容器。
  - kubelet 创建一个容器之后，还要等容器中的业务进程成功启动，这个容器才算真正启动。可以通过 postStart 判断容器是否已创建，通过 readinessProbe 判断容器是否已成功启动。
  - 当 Pod 中的所有容器都处于 running 状态时，Pod 才能处于 Running 状态。
  - 当 Pod 中有某个容器处于 terminated 状态时，kubelet 会按照 restartPolicy 重启它。在重启完成之前，Pod 都处于 Unavailable 状态。

### 探针

探针：又称为健康检查。在 spec.contaienrs 中定义，用于定期探测容器是否在正常运行。
- 探针每次的探测结果有三种：
  - Success ：容器在正常运行。
  - Failure ：容器没在正常运行。此时 kubelet 会按照 restartPolicy 重启它。
  - Unknown ：未知结果，此时不采取行动。
- 探针有三种用途：
  - startupProbe ：启动探针，用于探测容器是否已成功启动。
  - readinessProbe ：就绪探针，用于探测容器是否处于就绪状态，可以开始工作。
  - livenessProbe ：存活探针，用于探测容器是否在正常运行。
- 探针的影响：
  - 如果用户没定义探针，则容器刚创建时，可能尚未成功启动业务进程，kubelet 就会认为容器处于就绪状态，进而认为 Pod 处于就绪状态，提前接入 Service 的访问流量。
  - 如果 readinessProbe 的结果为 Farlure ，则 k8s 会认为该容器所属的 Pod 不处于就绪状态，不允许被 Service 发现。
  - 如果 startupProbe、livenessProbe 的结果为 Farlure ，则 k8s 会按照 restartPolicy 重启容器。
- 探针有三种实现方式：
  - ExecAction ：在容器中执行指定的命令，如果命令的退出码为 0 ，则检查结果为 Success 。
  - TCPSocketAction ：访问容器的指定端口，如果能建立 TCP 连接，则检查结果为 Success 。
  - HTTPGetAction ：向容器的指定 URL 发出 HTTP GET 请求，如果收到响应报文，且状态码为 2xx 或 3xx ，则检查结果为 Success 。

例：
```yml
contaienrs:
- name: redis-1
  livenessProbe:            # 定义 livenessProbe 用途、ExecAction 方式的探针
    exec:
      command:              # 每次探测时，在容器中执行命令：ls /tmp/health
      - ls
      - /tmp/health         # 可见，当/tmp/health 文件存在时，探测结果才会为 Success
    initialDelaySeconds: 5  # 容器刚创建之后，等待几秒才开始第一次探测（用于等待容器成功启动）
    periodSeconds: 3        # 每隔几秒探测一次
    timeoutSeconds: 1       # 每次探测的超时时间
    failureThreshold: 3     # 容器正常运行时，连续多少次探测为 Failure ，才判断容器为 Failure
    successThreshold: 1     # 容器启动时，或发现异常时，连续多少次探测为 Success ，才判断容器为 Success
  readinessProbe:           # 定义 readinessProbe 用途、TCPSocketAction 方式的探针
    tcpSocket:
      port: 8080
    periodSeconds: 3
  livenessProbe:            # 定义 livenessProbe 用途、HTTPGetAction 方式的探针
    httpGet:
      path: /health
      port: 8080
      httpHeaders:          # 添加请求报文的 Headers
      - name: X-Custom-Header
        value: hello
    periodSeconds: 3
```

### postStart、preStop

可以给 Pod 中的单个容器定义 postStart、preStop 钩子，在启动、终止过程中增加操作。如下：
  ```yml
  contaienrs:
  - name: redis-1
    lifecycle:
      postStart:
        exec:
          command:
          - /bin/bash
          - -c
          - echo hello ; sleep 1
      preStop:
        exec:
          command:
          - /bin/bash
          - -c
          - redis-cli shutdown
  ```
- kubelet 刚创建一个容器之后，会立即执行其 postStart 钩子。
  - postStart 与容器的 ENTRYPOINT 是异步执行的，因此执行顺序不能确定。不过只有等 postStart 执行完成之后，k8s 才会将容器的状态标为 Running 。
- kubelet 终止一个容器时，会先执行其 preStop 钩子。超过宽限期之后会发送 SIGTERM 信号并再宽限 2 秒，最后才发送 SIGKILL 信号。
  - 没有定义 preStop 时，kubelet 会采用默认的终止方式：先向 Pod 中的所有容器的进程发送 SIGTERM 信号，并将 Pod 的状态标识为 Terminating 。超过宽限期（grace period ，默认为 30 秒）之后，如果仍有进程在运行，则发送 SIGKILL 信号，强制终止它们。
  - 这里说的终止是指容器被 kubelet 主动终止，不包括容器自己运行结束的情况。

### 重启

容器的重启策略分为以下几种：
- `restartPolicy: Always` ：当容器终止时，或者被探针判断为 Failure 时，总是会自动重启。这是默认策略。
- `restartPolicy: OnFailure` ：只有当容器异常终止时，才会自动重启。
- `restartPolicy: Never` ：总是不会自动重启。

当容器重启时，
- 如果多次重启失败，重启的间隔时间将按 10s、20s、40s 的形式倍增，上限为 5min 。当容器成功运行 10min 之后会重置。
- 容器只会在当前 Node 上重启，除非因为 Node 故障等原因触发了主机调度。
