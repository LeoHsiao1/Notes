# Controller

：控制器，用于控制Pod。

- Deployment：用于描述一次部署任务。
  - k8s会保存用户每次使用的Deployment，从而方便回滚到以前的部署状态。
  - 当用户删除一个Deployment时，k8s会自动销毁对应的Pod。当用户更新一个Deployment时，k8s会滚动更新，依然会销毁旧Pod。
  - 例：滚动更新一个应用时，k8s会先创建一个新的ReplicaSet，启动需要的Pod数，然后迁移流量到新的Pod，最后把旧的ReplicaSet的Pod数减至0。从而保证在更新过程中不中断服务。

- ReplicaSet：副本集，用于控制、维持一个应用的Pod数量。
  - 取代了以前的副本控制器（Replication Controller）。
  - 通常写在Deployment中。
  - 例：当用户指定运行n个Pod时，如果Pod数少于n，ReplicaSet就会自动创建新的副本；如果Pod数多于n，ReplicaSet就会终止多余的副本。
  - 改变ReplicaSet的数量就可以方便地缩容、扩容，当ReplicaSet为0时就会删除所有Pod。
  - 如果Pod出现故障、Pod需要的资源不足、或者Pod所在Node出现故障，ReplicaSet不会进行修复，而是直接创建新的Pod。


- StatefulSet
- Job
- CronJob


k8s常见的应用类型：

- 无状态服务
  - 可以随时创建、销毁Pod，只需用ReplicaSet控制Pod数。
  - 所有Pod基本没有差异，可以共享资源、配置文件
- StatefulSet：有状态服务。
  - 不能随时创建、销毁Pod，甚至连Pod名都不能变。
  - 每个Pod使用独立的资源、配置文件，比如分别挂载目录。
  - 例：以无状态服务的方式运行一个CentOS容器，所有状态都存储在容器里，不可靠。改成StatefulSet方式运行，就可以漂移到不同节点上，实现高可用。
- Job：只执行一次的任务。执行成功就自动销毁。
- CronJob
- DaemonSet：担任宿主机上的daemon服务。
  - 例：在集群中每个节点上以DaemonSet方式运行一些监控、存储、日志Pod。












## Deployment：

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
- spec ：规格，描述了期望中的对象状态。
- Label ：对象的标签。
  - 采用键值对格式，用于描述对象的一些特征，以便于通过Label检索对象。
  - 不同对象的Label可以重复。
  - key可以加上 alpha.istio.io/ 格式的前缀。前缀 kubernetes.io/ 被k8s保留。
- Annotation ：对象的注释。
  - 与Label类似，但不能用于检索对象，只是单纯的注释。


一些k8s对象之间存在上下级的关系，上级称为Owner，下级称为Dependent。
- 例如：一个ReplicaSet是多个Pod的Owner。
- 删除一个Owner对象时，默认会级联删除它的所有Dependent。


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

