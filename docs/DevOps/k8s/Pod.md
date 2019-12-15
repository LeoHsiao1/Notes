# Pod

## Pod的状态

- Pending ：待定。此时kubelet正在部署该Pod。
- Running ：运行中。此时kubelet已经启动了该Pod的所有容器。
- Terminating ：正在终止运行。
- Succeeded ：Pod中所有容器都被正常终止。
- Failed ：Pod已经终止，且至少有一个容器是异常终止。
  <br>当Pod中的容器因为异常而中断运行时，默认会被 kubelet 自动重启，如果重启成功就依然为Running状态。
- Unkown ：状态未知。例如与Pod所在节点通信失败时就会不知道状态。

当用户请求终止一个Pod时，kubelet会向Pod中的进程发送SIGTERM信号，并将Pod的状态标识为“Terminating”，超过宽限期（默认为30秒）之后再向Pod中仍在运行的进程发送SIGKILL信号。

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
    app: redis
  name: deployment-redis
  namespace: default
spec:                       # Controller的规格
  replicas: 3               # Pod运行的副本数
  selector:                 # 选择Pod
    matchLabels:
      app: redis
  template:                 # 开始定义Pod的模板
    metadata:               # Pod的元数据
      labels:
        app: redis
    spec:                   # Pod的规格
      containers:           # 定义该Pod中包含的容器
      - name: redis         # 该Pod中的第一个容器
        image: redis:5.0.6
        command: ["redis-server"]
        ports:
        - containerPort: 6379   # 相当于Dockerfile中的 export 8080
```
- Metadata：对象的元数据，比如Annotation、Label等。
  - Annotation：对象的注释，采用键值对格式。
    - key、value可以配置任意内容，可以包含字母、数字、下划线、横杆、小数点。
    - key可以加上 xx.xx.io/ 格式的DNS子域作为前缀。前缀 kubernetes.io/ 、k8s.io/ 被保留给k8s核心组件使用。
  - Label：对象的标签。
    - 与Annotation类似，但是可以用于检索对象。
    - 不同对象的Label可以重复key，同一个对象的多个Label不能重复key。
- spec：规格，描述了期望中的对象状态。
- selector：选择器，通过metadata选择对象。
  - 符合条件的对象可能有0个、1个、多个。
  - 例：
      ```yaml
      selector:
        name: deployment-redis    # 匹配对象的 metadata.name
      ```
  - 例：
      ```yaml
      selector:
        matchLabels:              # 匹配对象的 metadata.labels
          app: redis
      ```

- **Deployment的 spec.template 部分就是Pod的配置内容**，当用户修改了 template 之后（改变ReplicaSet不算），k8s就会创建一个新版本的Deployment，据此重新部署Pod。
  - k8s默认会保存最近两个版本的Deployment，便于将Pod回滚（rollback）到以前的部署状态。
  - 当用户删除一个Deployment时，k8s会自动销毁对应的Pod。当用户修改一个Deployment时，k8s会滚动更新，依然会销毁旧Pod。

一些k8s对象之间存在上下级的关系，上级称为Owner，下级称为Dependent。
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

一个Pod中只运行一个容器的情况最简单，但有时也会运行一些辅助容器（Sidecar）。

辅助容器有两种类型：
- 标准容器：与应用容器差不多。
- init容器：在创建Pod时最先启动，用于执行初始化任务，执行成功之后就会自动终止。
  - 可以给一个Pod创建多个init容器，它们会按顺序串行执行。当一个init容器执行成功之后，才会启动下一个init容器或应用容器。
  - 如果init容器执行失败，则kubelet默认会重新启动该Pod（由Pod配置的restartPolicy决定）。为了避免反复重启出错，init容器应该满足幂等性。

## Horizontal Pod Autoscaling

：Pod的水平自动伸缩（HPA）。
- k8s会监控服务的一些metrics指标（比如CPU负载），当超过一定阙值时就自动增加 ReplicaSet 数量，从而实现服务的横向扩容。

## 主机调度

部署Pod时，k8s的scheduler会自动将Pod分配到某个Node上，用户也可以手动指定一个Node。
- scheduler根据Affinity、Taint、Tolerations等因素分配Pod。
- 如果Pod所在Node出现故障，该Pod就会被立即迁移到其它Node运行。

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

- Node Taint ：节点的污点。
- Pod Tolerations ：Pod的容忍度。
- scheduler不会在有污点的节点上部署Pod，除非Pod能容忍该污点。

例：
- 给Node添加Taint：
    ```
    kubectl taint nodes node1 k1=v1:NoSchedule
    ```
- 在Pod spec中配置Tolerations：
    ```yaml
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
