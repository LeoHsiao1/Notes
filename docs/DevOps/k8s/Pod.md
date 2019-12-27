# Pod

## Controller

：控制器，用于控制Pod。
- k8s设计了多种Controller，用不同的配置文件进行管理。

### Deployment

：描述一个Pod的部署状态，让k8s据此部署Pod。
- Deployment部署的是无状态应用：同一个应用的不同Pod实例没有差异，可以随时创建、销毁Pod，可以共享资源、配置文件。

Deployment的配置文件通常命名为deployment.yaml，内容示例如下：
```yaml
apiVersion: apps/v1
kind: Deployment            # 该Controller的类型
metadata:                   # 该Controller的元数据
  annotations:
    creator: Leo
  labels:
    app: redis-1
  name: deployment-redis-1
  namespace: default
spec:                       # Controller的规格
  replicas: 3               # Pod运行的副本数
  selector:                 # 选择Pod
    matchLabels:
      app: redis-1
  template:                 # 开始定义Pod的模板
    metadata:               # Pod的元数据
      labels:
        app: redis-1
    spec:                   # Pod的规格
      containers:           # 定义该Pod中的容器
      - name: redis-1       # 该Pod中的第一个容器
        image: redis:5.0.6
        command: ["redis-server /opt/redis/redis.conf"]
        ports:
        - containerPort: 6379   # 相当于Dockerfile中的 export 8080
```
- metadata ：对象的元数据，包含多种字段。
  - annotations ：注释，采用键值对格式。
    - key、value可以写入任意内容，可以包含字母、数字、下划线、横杆、小数点。
    - key可以加上 xx.xx.io/ 格式的DNS子域作为前缀。前缀 kubernetes.io/ 、k8s.io/ 被保留给k8s核心组件使用。
  - labels ：标签，采用键值对的格式。
    - 与Annotation类似，但是可以用于筛选对象。
    - 同一个对象的labels中不能存在重复的key，不同对象的labels之间可以存在重复的key-value。
- spec ：规格，描述了期望中的对象状态。
- selector ：选择器，根据labels筛选对象。匹配的对象可能有0个、1个或多个。
  - 当selector中设置了多个筛选条件时，只会选中满足所有条件的对象。
  - 当selector中没有设置筛选条件时，会选中所有对象。
  - 例：
    ```yaml
    selector:
      matchLabels:
        app: redis-1    # 要求labels中存在该键值对
      matchExpressions:
        - {key: app, operator: In, values: [redis-1, redis-2]}  # 要求labels中存在app键，且值为redis-1或redis-2
        - {key: app, operator: Exists}                          # 运算符可以是In、NotIn、Exists、DidNotExist
    ```
  - Deployment的spec.selector会被用于与spec.template.metadata.labels进行匹配，从而筛选Pod。

- **Deployment的 spec.template 部分就是Pod的配置内容**，当用户修改了 template 之后（改变ReplicaSet不算），k8s就会创建一个新版本的Deployment，据此重新部署Pod。
  - k8s默认会保存最近两个版本的Deployment，便于将Pod回滚（rollback）到以前的部署状态。
  - 当用户删除一个Deployment时，k8s会自动销毁对应的Pod。当用户修改一个Deployment时，k8s会滚动更新，依然会销毁旧Pod。

- 一些k8s对象之间存在上下级的关系，上级称为Owner，下级称为Dependent。
  - 例如：一个ReplicaSet是多个Pod的Owner。
  - 删除一个Owner对象时，默认会级联删除它的所有Dependent。

### ReplicaSet

：副本集（RC），用于控制、维持一个应用的Pod数量。
- 取代了以前的副本控制器（Replication Controller，RS）。
- 通常在Deployment的 spec 部分中配置。
- 当用户指定运行n个Pod时，如果Pod数少于n，ReplicaSet就会自动创建新的副本；如果Pod数多于n，ReplicaSet就会终止多余的副本。
- 改变ReplicaSet的数量就可以方便地缩容、扩容，当ReplicaSet为0时就会删除所有Pod。
- 滚动更新一个应用时，k8s会先创建一个新的ReplicaSet，启动需要的Pod数，然后迁移流量到新的Pod，最后把旧的ReplicaSet的Pod数减至0。从而保证在更新过程中不中断服务。
- 如果Pod出现故障、Pod需要的资源不足、或者Pod所在Node出现故障，ReplicaSet不会进行修复，而是直接创建新的Pod。

### StatefulSet

：与Deployment类似，但部署的是有状态服务。
- 一个有状态服务的每个Pod实例使用独立的资源、配置文件，不能随时创建、销毁Pod，甚至连Pod名都不能改变。
- 例如：以无状态服务的方式运行一个CentOS容器，所有状态都存储在容器里，不可靠。改成StatefulSet方式运行，就可以漂移到不同节点上，实现高可用。

### DaemonSet

：与Deployment类似，但部署的是宿主机上的daemon服务，例如监控、日志服务。
- 一个DaemonSet服务通常在每个宿主机上只需部署一个Pod实例。

### Job

：与Deployment类似，但部署的是只执行一次的任务。

### CronJob

：与Deployment类似，但部署的是定时任务或周期性任务。

## Sidecar

一个Pod中只运行一个容器的情况最简单（称为主容器），但有时也会运行一些辅助容器（Sidecar）。

辅助容器有两种类型：
- 标准容器：与主容器差不多。
- init容器：在创建Pod时最先启动，执行一些初始化任务，执行完成之后会自动退出。
  - 可以给一个Pod设置多个init容器，它们会按顺序串行执行。当一个init容器执行成功之后，才会启动下一个init容器或应用容器。
  - 如果某个init容器启动失败或异常退出，则kubelet会重新启动该Pod。
  - 重启Pod时会重新启动各个init容器。因此，为了避免多次重启Pod时出错，init容器的行为应该满足幂等性。

## Horizontal Pod Autoscaling

：Pod的水平方向上的自动伸缩（HPA）。
- k8s会监控服务的一些metrics指标（比如CPU负载），当超过一定阙值时就自动增加 ReplicaSet 数量，从而实现服务的横向扩容。

## 主机调度

部署Pod时，k8s的scheduler会给Pod自动分配一个Node（这一过程称为主机调度），然后由Node上的kubelet部署该Pod。
- scheduler会综合考虑Affinity、Taint、Tolerations等因素，从而选出一个Node。
- 如果Pod所在的Node出现故障，该Pod会被立即迁移到其它Node运行。

### Affinity

：节点的亲和性，表示Pod适合部署在什么样的Node上。
- 用法：先给Node添加Label，然后在Pod spec中配置该Pod需要的Node Label。
- 亲和性的主要分类：
  - requiredDuringScheduling ：当Pod开始部署时，只能部署到满足条件的Node上。如果没有这样的Node，则重新部署。（硬性要求）
  - preferredDuringScheduling ：当Pod开始部署时，优先部署到符合条件的Node上。如果没有这样的Node，则部署到其它Node上。（软性要求）
  - RequiredDuringExecution ：当Pod正在运行时，如果Node变得不满足条件，则重新部署。（硬性要求）
  - IgnoredDuringExecution ：当Pod正在运行时，如果Node变得不满足条件，则忽略该问题，继续运行Pod。（软性要求）
- 例：
```yaml
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
- nodeSelector下的条件只要满足一个即可，matchExpressions下的条件要全部满足。
- 条件的operator可以是以下类型：
  - Exists ：Node上存在该key。
  - DoesNotExist ：与Exists相反。
  - In ：Node上存在该key，且其值在给定的列表中。
  - NotIn ：与In相反。
  - Gt ：Node上存在该key，且其值大于给定值。
  - Lt ：与Gt相反，是小于。

### Taint、Tolerations

- Node Taint ：Node的污点。
- Pod Tolerations ：Pod的容忍度。
  - scheduler不会在将Pod调度到有污点的节点上，除非Pod能容忍该污点。
  - 搭配使用污点和容忍度，可以限制某个Pod只能被调度到指定Node上。

例：
- 给Node添加污点：
    ```shell
    kubectl taint nodes node1 k1=v1:NoSchedule
    ```
- 在Pod spec中配置容忍度：
    ```yaml
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
      - NoSchedule ：如果Pod不容忍该污点，则不部署到该Node上。如果已经部署了，则继续运行该Pod。
      - PreferNoSchedule ：如果Pod不容忍该污点，则优先部署到其它Node上，不行的话才部署到该Node上。
      - NoExecute ：如果Pod不容忍该污点，则不部署到该Node上。如果已经部署了，则驱除该Pod。
        - 可以额外设置 tolerationSeconds ，表示即使Pod容忍该污点，也最多只能保留指定秒数，超时之后就会被驱除，除非在此期间该污点消失。
    - 在Tolerations中：
      - 当operator为Equal时，如果effect、key、value与Taint的相同，则匹配该Taint。
      - 当operator为Exists时，如果effect、key与Taint的相同，则匹配该Taint。
      - 如果不指定key，则匹配Taint的所有key。
      - 如果不指定effect，则匹配Taint的所有effect。

## Pod的生命周期

Pod被kubelet启动、终止的大致流程：
- 初始化：按顺序启动各个init容器。
- 启动  ：启动主容器、sidecar容器。
- 运行  ：会被探针定期探测。
- 终止  ：终止各个容器。
- 重启  ：kubelet会按照restartPolicy重启容器。

### 状态

以下是一个Pod对象的状态示例：
```yaml
apiVersion: v1
kind: Pod
metadata:
  ...
spec:
  containers:
    ...
  restartPolicy: Always   # Pod中的容器restartPolicy
  schedulerName: default-scheduler
  ...
status:
  conditions:             # Pod的状态
  - type: Initialized
    status: "True"        # 结合type、status来看，该Pod已初始化
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
- status.phase 记录了Pod目前处于生命周期的哪一阶段，有以下几种取值：
  - Pending ：待定。此时kubelet正在部署该Pod，包括分配Node、拉取镜像、启动容器等。
  - Running ：运行中。此时kubelet已经启动了该Pod的所有容器。
  - Succeeded ：Pod中的所有容器都已经正常终止。
  - Failed ：Pod中的所有容器都已经终止，且至少有一个容器是异常终止。
    - Failed的Pod会被kubelet自动重启，如果重启成功则会变回Running。
  - Unkown ：状态未知。例如与Pod所在节点通信失败时就会不知道状态。

- status.conditions 是一个数组，包含了对Pod多种状态条件的判断，如下：
  - PodScheduled ：Pod已被调度到一个节点上。
  - Unschedulable ：Pod不能被调度到节点上。可能是缺乏可用节点、缺乏挂载卷等资源。
  - Initialized ：Pod中的所有init容器都已成功启动（不管是否运行结束）。
    - 运行init容器的过程中，Pod处于pending阶段，Initialized条件为True。
  - ContainersReady ：Pod中的所有容器已成功启动。
  - Ready ：Pod处于就绪状态。此时k8s才允许该Pod被Service发现。

- status.containerStatuses.state 记录了容器的状态，有以下几种取值：
  - waiting ：正在准备启动。比如拉取镜像、取用ConfigMap，或者等待重启。
  - running ：正在运行。
  - terminated ：已终止。

- Pod的状态取决于容器的状态。因此，分析Pod的状态时，需要考虑更细单位的容器。
  - **kubelet创建一个容器之后，还要等容器中的业务进程成功启动，这个容器才算真正启动。**可以通过postStart判断容器是否已创建，通过readinessProbe判断容器是否已成功启动。
  - 当Pod中的所有容器都处于running状态时，Pod才能处于Running状态。
  - 当Pod中有某个容器处于terminated状态时，kubelet会按照restartPolicy重启它。在重启完成之前，Pod都处于 Unavailable 状态。

### 探针

探针：又称为健康检查。在 spec.contaienrs 中定义，用于定期探测容器是否在正常运行。
- 探针每次的探测结果有三种：
  - Success ：容器在正常运行。
  - Failure ：容器没在正常运行。此时kubelet会按照restartPolicy重启它。
  - Unknown ：未知结果，此时不采取行动。
- 探针有三种用途：
  - startupProbe ：启动探针，用于探测容器是否已成功启动。
  - readinessProbe ：就绪探针，用于探测容器是否处于就绪状态，可以开始工作。
  - livenessProbe ：存活探针，用于探测容器是否在正常运行。
- 探针的影响：
  - 如果用户没定义探针，则容器刚创建时，可能尚未成功启动业务进程，kubelet就会认为容器处于就绪状态，进而认为Pod处于就绪状态，提前接入Service的访问流量。
  - 如果readinessProbe的结果为Farlure，则k8s会认为该容器所属的Pod不处于就绪状态，不允许被Service发现。
  - 如果startupProbe、livenessProbe的结果为Farlure，则k8s会按照restartPolicy重启容器。
- 探针有三种实现方式：
  - ExecAction ：在容器中执行指定的命令，如果命令的退出码为0，则检查结果为Success。
  - TCPSocketAction ：访问容器的指定端口，如果能建立TCP连接，则检查结果为Success。
  - HTTPGetAction ：向容器的指定URL发出HTTP GET请求，如果收到响应报文，且状态码为2xx或3xx，则检查结果为Success。

例：
```yaml
contaienrs:
- name: redis-1
  livenessProbe:            # 定义livenessProbe用途、ExecAction方式的探针
    exec:
      command:              # 每次探测时，在容器中执行命令：ls /tmp/health
      - ls
      - /tmp/health         # 可见，当/tmp/health文件存在时，探测结果才会为Success
    initialDelaySeconds: 5  # 容器刚创建之后，等待几秒才开始第一次探测（用于等待容器成功启动）
    periodSeconds: 3        # 每隔几秒探测一次
    timeoutSeconds: 1       # 每次探测的超时时间
    failureThreshold: 3     # 容器正常运行时，连续多少次探测为Failure，才判断容器为Failure
    successThreshold: 1     # 容器启动时，或发现异常时，连续多少次探测为Success，才判断容器为Success
  readinessProbe:           # 定义readinessProbe用途、TCPSocketAction方式的探针
    tcpSocket:
      port: 8080
    periodSeconds: 3
  livenessProbe:            # 定义livenessProbe用途、HTTPGetAction方式的探针
    httpGet:
      path: /health
      port: 8080
      httpHeaders:          # 添加请求报文的Headers
      - name: X-Custom-Header
        value: hello
    periodSeconds: 3
```

### postStart、preStop

用户可以给Pod中的单个容器定义 postStart、preStop 钩子，完善启动、终止过程。如下：
  ```yaml
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
- kubelet刚创建一个容器之后，会立即执行其 postStart 钩子。
  - postStart与容器的ENTRYPOINT是异步执行的，因此执行顺序不能确定。不过只有等postStart执行完成之后，k8s才会将容器的状态标为Running。
- kubelet终止一个容器时，会先执行其 preStop 钩子。超过宽限期之后会发送SIGTERM信号并再宽限2秒，最后才发送SIGKILL信号。
  - 没有定义 preStop 时，kubelet会采用默认的终止方式：先向Pod中的所有容器的进程发送SIGTERM信号，并将Pod的状态标识为Terminating。超过宽限期（grace period，默认为30秒）之后，如果仍有进程在运行，则发送SIGKILL信号，强制终止它们。
  - 这里说的终止是指容器被kubelet主动终止，不包括容器自己运行结束的情况。

### 重启

容器的重启策略分为以下几种：
- `restartPolicy: Always` ：当容器终止时，或者被探针判断为Failure时，总是会自动重启。这是默认策略。
- `restartPolicy: OnFailure` ：只有当容器异常终止时，才会自动重启。
- `restartPolicy: Never` ：总是不会自动重启。

当容器重启时，
- 如果多次重启失败，重启的间隔时间将按 10s、20s、40s 的形式倍增，上限为 5min 。当容器成功运行 10min 之后会重置。
- 只会在当前Node上重启，除非因为Node故障等原因触发了主机调度。
