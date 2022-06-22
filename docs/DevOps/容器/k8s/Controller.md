# Controller

- 用户用 kubectl 命令手动管理 Pod 比较麻烦，因此一般用控制器（Controller）自动管理 Pod 。
  - 用户需要编写 Controller 配置文件，描述如何部署一个 Pod 。然后创建该 Controller ，k8s 就会自动创建并部署其 Pod 。
- Controller 分为 Deployment、StatefulSet 等多种类型。

## Deployment

：默认的 Controller 类型，用于部署无状态的 Pod 。

### 配置

配置文件示例：
```yml
apiVersion: v1
kind: Deployment            # 该 Controller 的类型
metadata:                   # 该 Controller 的元数据
  annotations:
    deployment.kubernetes.io/revision: "1"  # k8s 自动添加该字段，表示当前配置是第几次修改版本，从 1 开始递增
  labels:
    creator: Leo
  name: redis
  namespace: default
  # generation: 1           # k8s 自动添加该字段，表示配置文件的版本序号，从 1 开始递增
spec:                       # Controller 的规格
  replicas: 3               # Pod 运行的副本数，默认为 1
  selector:                 # 选择 Pod
    matchLabels:
      k8s-app: redis
  # progressDeadlineSeconds: 600  # 如果 Deployment 停留在 Progressing 状态超过一定时长，则变为 Failed 状态
  # revisionHistoryLimit: 10      # 保留 Deployment 的多少个旧版本，可用于回滚（rollback）。设置为 0 则不保留
  # strategy:               # 更新部署的策略，默认为滚动更新
  #   type: RollingUpdate
  #   rollingUpdate:              # 滚动更新过程中的配置
  #     maxUnavailable: 25%       # 允许同时不可用的 Pod 数量。可以为整数，或者百分数，默认为 25%
  #     maxSurge: 25%             # 为了同时运行新、旧 Pod ，允许 Pod 总数超过 replicas 一定数量。可以为整数，或者百分数，默认为 25%
  template:                       # 开始定义 Pod 的模板
    metadata:                     # Pod 的元数据
      labels:
        k8s-app: redis
    spec:                         # Pod 的规格
      containers:                 # 定义该 Pod 中的容器
      - name: redis               # 该 Pod 中的第一个容器名
        image: redis:5.0.6
        command: ["redis-server /opt/redis/redis.conf"]
        ports:
        - containerPort: 6379   # 声明容器监听的端口，相当于 Dockerfile 中的 expose 指令
```
- 部署一个 Deployment 时，可以创建多个 Pod 实例。
  - Pod 的命名格式为 `<Controller_name>-<ReplicaSet_id>-<Pod_id>` ，例如：
    ```sh
    redis-65d9c7f6fc-szgbk
    ```
    - 用 kubectl 命令管理 Pod 时，不能事先知道 Pod 的具体名称，应该通过 label 来筛选 Pod 。
  - 每个 Pod 中，容器的命名格式为 `k8s_<container_name>_<pod_name>_<k8s_namespace>_<pod_uid>_<restart_id>` ，例如：
    ```sh
    k8s_POD_redis-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0   # Pod 中内置的 pause 容器，其容器名为 POD
    k8s_redis_redis-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0
    ```
    - 当 Pod 配置不变时，如果触发重启事件，创建新 Pod ，则会将容器末尾的 restart_id 加 1（从 0 开始递增）。

- spec.selector 是必填字段，称为标签选择器，用于与 spec.template.metadata.labels 进行匹配，从而筛选 Pod 进行管理，筛选结果可能有任意个（包括 0 个）。
  - 当 selector 中没有设置筛选条件时，会选出所有对象。
  - 当 selector 中设置了多个筛选条件时，只会选出满足所有条件的对象。
  - 例：
    ```yml
    selector:
      matchLabels:
        k8s-app: redis        # 要求 labels 中存在该键值对
      matchExpressions:
        - key: k1             # 要求存在 app 标签，且取值包含于指定列表
          operator: In
          values:
          - v1
        - key: k2
          operator: Exists    # 运算符可以为 In、NotIn、Exists、DidNotExist
    ```

- spec.template 是必填字段，用于描述 Pod 的配置。
  - 当用户修改了 template 之后（改变 ReplicaSet 不算），k8s 就会创建一个新版本的 Deployment ，据此重新部署 Pod 。
  - 删除 Deployment 时，k8s 会自动销毁对应的 Pod 。
  - 修改 Deployment 时，k8s 会自动部署新 Pod ，销毁旧 Pod ，该过程称为更新部署。

- Deployment 的更新部署策略（strategy）有两种：
  - Recreate ：先销毁旧 Pod ，再部署新 Pod 。
  - RollingUpdate ：先部署新 Pod ，等它们可用了，再销毁旧 Pod 。
    - 这可以保证在更新过程中不中断服务。但新旧 Pod 短期内会同时运行，可能引发冲突，比如同时访问挂载的数据卷。

### 状态

- Deployment 存在多种条件（condition）：
  ```sh
  Progressing       # 处理中，比如正在部署或销毁 Pod 实例
  Complete          # 处理完成，比如部署完所有 Pod 实例且可用，或者该 Deployment 是停止运行的旧版本
  Available         # 可用，即达到 ReplicaSet 的 Pod 实例最小可用数
  ReplicaFailure    # 处理失败，比如不能部署 Pod 实例、Progressing 超时
  ```
  - 一个资源可能同时处于多种 condition 状态，但只能处于一种 phrase 。
    - 比如 Deployment 处于 Available 状态时，可能同时处于 Progressing 或 Complete 状态。
  - 根据 `.status.conditions` 判断 `.status.phase`
  <!-- - 支持添加自定义的 condition -->

- Deployment 的状态示例：
  ```yml
  status:
    availableReplicas: 1    # 可用的 Pod 实例数，允许接收 service 的流量
    observedGeneration: 3   # 可用的 Pod 实例采用的 Deployment 版本，如果小于 metadata.generation 则说明不是最新版本
    readyReplicas: 1        # 处于 health 状态的 Pod 实例数
    replicas: 1             # 期望运行的实例数
    updatedReplicas: 1      # 采用最新版本 Deployment 的 Pod 实例数
    conditions:
    - type: Progressing     # condition 类型
      status: "True"        # 是否处于当前 condition ，可以取值为 True、False、Unknown
      reason: NewReplicaSetAvailable  # status 的原因
      message: ReplicaSet "redis-bbf945bc9" has successfully progressed.  # reason 的详细信息
      lastTransitionTime: "2021-06-29T10:52:18Z"
      lastUpdateTime: "2022-02-10T02:34:38Z"
    - type: Available
      status: "True"
      reason: MinimumReplicasAvailable
      message: Deployment has minimum availability.
      lastTransitionTime: "2022-02-10T15:53:46Z"
      lastUpdateTime: "2022-02-10T15:53:46Z"
  ```

<!--
lastTransitionTime    # 上一次进入该状态的时间？？？
lastUpdateTime        # 上一次更新该状态的时间
 -->


## ReplicaSet

：副本集（RC），用于控制一个应用的 Pod 实例数量。
- 取代了 k8s 早期版本的副本控制器（Replication Controller，RS），会被 Deployment 调用。
- 假设用户指定运行 n 个 Pod ，ReplicaSet 会自动控制可用的 Pod 数量，使其等于 n 。
  - 通过健康检查的 Pod 才计入可用数量。
  - 如果可用的 Pod 数多于 n ，则停止多余的 Pod 。
  - 如果可用的 Pod 数少于 n ，则增加部署 Pod 。包括以下情况：
    - 已有的 Pod 故障，比如部署失败、部署之后未通过健康检查。
    - 已有的 Pod 需要的部署资源不足，比如 Pod 所在 Node 故障。
- 通过 ReplicaSet ，可以方便地调整 Pod 数量，实现横向扩容、缩容。

## StatefulSet

：与 Deployment 类似，但部署的是有状态服务。

<!--
- 无状态应用：历史执行的任务不会影响新执行的任务。因此应用可以随时销毁并从镜像重新创建。
- 有状态应用：历史执行的任务会影响新执行的任务，因此需要存储一些历史数据。
  - 将数据存储在容器中时，会随着容器一起销毁。因此建议将数据存储在挂载卷，或容器外的数据库中。

使用数据卷
- 一个有状态服务的每个 Pod 实例使用独立的资源、配置文件，不能随时创建、销毁 Pod ，甚至连 Pod 名都不能改变。
- 例如：以无状态服务的方式运行一个 CentOS 容器，所有状态都存储在容器里，不可靠。改成 StatefulSet 方式运行，就可以漂移到不同节点上，实现高可用。
-->

## DaemonSet

：与 Deployment 类似，但是在每个 node 上只部署一个 Pod 实例。适合监控、日志等 daemon 服务。
- DaemonSet 默认会调度到每个节点，可通过 nodeSelector 等方式指定可调度节点。
- 例：
  ```yml
  apiVersion: apps/v1
  kind: DaemonSet
  metadata:
    name: redis
    namespace: default
  spec:
    selector:
      matchLabels:
        k8s-app: redis
    template:
      metadata:
        labels:
          k8s-app: redis
      spec:
        containers:
          - ...
    # updateStrategy:           # DaemonSet 的更新部署策略（updateStrategy）有两种：RollingUpdate、OnDelete
    #   type: RollingUpdate
    #   rollingUpdate:
    #     maxSurge: 0
    #     maxUnavailable: 1
  ```

## Job

：只执行一次的任务，即部署一次某个 Pod 。

## CronJob

：定时任务，定时创建并执行某个 Job 。
- 由 kube-controller-manager 定时调度，而后者默认采用 UTC 时区。
