# Workload

- 用 kubectl 命令手动管理 Pod 比较麻烦，因此一般通过控制器（Controller）自动管理 Pod ，统称为工作负载（workload）。
  - Workload 分为 Pod 、Deployment 、Job 等多种类型。
  - 用户需要编写 workload 配置文件，描述如何部署一个 Pod 。然后创建该 workload 对象，k8s 就会自动创建并部署 Pod 。

## Deployment

：用于部署无状态的 Pod 。

### 配置

例：
```yml
apiVersion: v1
kind: Deployment
metadata:
  annotations:
    deployment.kubernetes.io/revision: "1"  # k8s 自动添加该字段，表示当前配置文件是第几次修改的版本，从 1 开始递增
  name: nginx
  namespace: default
  # generation: 1                 # k8s 自动添加该字段，表示配置文件的版本序号，从 1 开始递增
spec:
  # minReadySeconds: 0            # 一个 Pod 需要保持 Ready 状态多久，才视作可用
  # paused: false                 # 是否暂停编排，默认为 false 。如果为 true ，则修改 spec.template 时不会触发更新部署
  # progressDeadlineSeconds: 600  # 如果 Deployment 停留在 Progressing 状态超过一定时长，则变为 Failed 状态，但会继续尝试部署。执行 rollout pause 时不会累计该时长
  replicas: 2                     # 期望运行的 Pod 副本数，默认为 1
  revisionHistoryLimit: 2         # 保留最近多少个历史版本的 ReplicaSet（不包括当前版本），可用于回滚（rollback）。默认为 10 ，设置为 0 则不保留
  selector:                       # 选择 Pod
    matchLabels:
      k8s-app: nginx
  # strategy:                     # 更新部署的策略，默认为 RollingUpdate
  #   type: RollingUpdate
  template:                       # 定义 Pod 模板
    metadata:                     # Pod 的元数据
      labels:
        k8s-app: nginx
    spec:                         # Pod 的规格
      containers:                 # 定义该 Pod 中的容器
      - name: nginx               # 该 Pod 中的第一个容器名
        image: nginx:1.20
```
- Deployment 会自动创建 ReplicaSet 对象，用于运行指定数量的 Pod 副本。
  - 删除一个 Deployment 时，会级联删除其下级对象 ReplicaSet ，和 ReplicaSet 的下级对象 Pod 。
  - Pod name 的格式为 `<Deployment_name>-<ReplicaSet_id>-<Pod_id>` ，例如：
    ```sh
    nginx-65d9c7f6fc-szgbk
    ```
    - 因此不能事先知道 Deployment 创建的 Pod name ，通常通过 spec.selector 来筛选 Pod 。

  - 每个 Pod 中，容器的命名格式为 `k8s_<container_name>_<pod_name>_<k8s_namespace>_<pod_uid>_<restart_id>` ，例如：
    ```sh
    k8s_POD_nginx-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0   # Pod 中内置的 pause 容器，其容器名为 POD
    k8s_nginx_nginx-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0
    ```
    - Pod 重启时，会创建一组新的容器，容器名末尾的 restart_id 从 0 开始递增。

- spec.selector 是必填字段，称为标签选择器，用于与 spec.template.metadata.labels 进行匹配，从而筛选 Pod 进行管理，筛选结果可能有任意个（包括 0 个）。
  - 当 selector 中没有设置筛选条件时，默认选中所有对象。
  - 当 selector 中设置了多个筛选条件时，会选中同时满足所有条件的对象。
  - 例：
    ```yml
    selector:
      matchLabels:
        k8s-app: nginx        # 要求 labels 中存在该键值对

      matchExpressions:
        - key: k1             # 要求存在 app 标签，且取值包含于指定列表
          operator: In
          values:
          - v1
        - key: k2
          operator: Exists    # 运算符可以为 In 、NotIn 、Exists 、DidNotExist
    ```

- spec.template 是必填字段，表示 Pod 配置文件的模板。
  - 当用户修改了 spec.template 之后，Deployment 会自动创建一个新版本的 ReplicaSet ，并将旧版本的 ReplicaSet 的 replicas 减至 0 。该过程称为更新部署。
    - ReplicaSet 会根据 template 创建 Pod ，并添加 `metadata.ownerReferences` 和 `metadata.labels.pod-template-hash` ，用于区分不同版本的 Pod 。
    - Deployment 会保留最近 revisionHistoryLimit 个历史版本的 ReplicaSet ，可用于回滚。
  - 修改 Deployment 的其它配置，比如 replicas ，不算版本变化，不会触发更新部署。
    - 创建 Deployment 之后不允许修改 spec.selector 。

- Deployment 的更新部署策略（strategy）有两种：
  - Recreate
    - ：直接重建。先删除旧 ReplicaSet 的 Pod ，再创建新 ReplicaSet 的 Pod 。
  - RollingUpdate
    - ：滚动更新。先创建新 Pod ，等它们可用了，再删除旧 Pod 。
    - 这可以保证在更新过程中不中断服务。但新旧 Pod 短期内会同时运行，可能引发冲突，比如同时访问挂载的数据卷。
    - 例：
      ```yml
      strategy:
        type: RollingUpdate
        rollingUpdate:            # 滚动更新的配置
          maxUnavailable: 0       # 允许同时不可用的 Pod 数量。可以为整数或百分数，默认为 25%
          maxSurge: 1             # 为了同时运行新、旧 Pod ，允许 Pod 总数超过 replicas 一定数量。可以为整数或百分数，默认为 25%
      ```
      滚动更新时，会尽量保持 `replicas - maxUnavailable ≤ availableReplicas ≤ replicas + maxSurge` 。

### 状态

- Deployment 存在多种 conditions ：
  ```sh
  Progressing       # 处理中，例如正在部署或删除 Pod
  Complete          # 处理完成，例如部署完所有 Pod 且可用，或者该 Deployment 是停止运行的旧版本
  Available         # 可用，即 availableReplicas 不低于 maxUnavailable
  ReplicaFailure    # 处理失败，例如不能部署 Pod 、停留在 Progressing 状态超时
  ```
  - 例如 Deployment 处于 Available 状态时，可能同时处于 Progressing 或 Complete 状态。

- Deployment 的状态示例：
  ```yml
  status:
    availableReplicas: 1    # 可用的 Pod 数，允许接收 service 的流量
    observedGeneration: 3   # 可用的 Pod 采用的 Deployment 版本。如果小于 metadata.generation 则说明不是最新版本
    readyReplicas: 1        # 就绪状态的 Pod 数
    replicas: 1             # 期望运行的 Pod 数
    updatedReplicas: 1      # 采用最新版本 Deployment 的 Pod 数。如果等于 replicas ，则说明已全部更新
    conditions:
    - type: Progressing
      status: "True"
      reason: NewReplicaSetAvailable                # 处于当前状态的原因
      message: ReplicaSet "nginx-bbf945bc9" has successfully progressed.  # reason 的详细信息
      lastTransitionTime: "2022-02-10T15:53:46Z"    # 最近一次改变该 condition 的 status 的时刻
      lastUpdateTime: "2022-02-10T15:53:55Z"        # 最近一次更新该 condition 的时刻
    - type: Available
      status: "True"
      reason: MinimumReplicasAvailable
      message: Deployment has minimum availability.
      lastTransitionTime: "2022-02-10T15:53:46Z"
      lastUpdateTime: "2022-02-10T15:53:46Z"
  ```
  - 一般的 Pod 通过 readinessProbe 健康检查之后，就会进入 Ready 状态，加入 EndPoints 。但 Deployment 要求一个 Pod 保持 Ready 状态至少 minReadySeconds 秒，才视作可用（available），加入 EndPoints 。

- Deployment 的常见问题：
  - 没有一个可用的 Pod 。
  - Pod 未全部可用。
  - Pod 未全部更新到最新版本。

## ReplicaSet

：副本集（RC），用于运行指定数量的 Pod 副本。
- ReplicaSet 取代了 k8s 早期的副本控制器（Replication Controller ，RS）。
  - 使用 Deployment 时，会自动创建、管理 ReplicaSet ，不必用户直接操作 ReplicaSet 。
- 假设用户指定运行 replicas 个 Pod ，ReplicaSet 会自动控制 available Pod 数量，使其等于 replicas 。
  - 如果可用的 Pod 数多于 replicas ，则停止多余的 Pod 。
  - 如果可用的 Pod 数少于 replicas ，则创建空缺数量的 Pod 。包括以下情况：
    - 已有的 Pod 故障，比如部署失败、部署之后未通过健康检查。
    - 已有的 Pod 需要的部署资源不足，比如 Pod 所在 Node 故障。
- 通过修改 replicas ，可以方便地调整某个应用的 Pod 副本数量，实现横向扩容、缩容，称为缩放（scale）。
  - 减少 replicas 时，优先删除以下 Pod ：
    - unschedulable、pending 状态的 Pod 。
    - 给 Pod 添加注释 `controller.kubernetes.io/pod-deletion-cost: ±<int>` ，表示删除 Pod 的成本，默认为 0 。优先删除成本较低的 Pod 。
    - 调度的 Pod 副本数较多的节点上的 Pod 。
    - 创建时间较晚的 Pod 。

## StatefulSet

：与 Deployment 类似，但用于部署有状态的 Pod 。
- 相关概念：
  - 无状态应用
    - ：历史执行的任务不会影响新执行的任务。因此 Pod 可以随时销毁并从镜像重新创建。
  - 有状态应用
    - ：历史执行的任务会影响新执行的任务，因此需要存储一些历史数据。
    - 将数据存储在容器中时，会随着容器一起销毁。因此建议将数据存储到挂载卷，或容器外的数据库。
- 与 Deployment 相比，StatefulSet 的特点：
  - 有序性
    - ：StatefulSet 会按顺序创建 replicas 个 Pod （不会同时创建），给每个 Pod 分配一个从 0 开始递增的序号。
    - 不过删除 StatefulSet 不会有序地删除 Pod ，可以先手动删除。
  - 唯一性
    - ：每个 Pod 副本是独特的，不可相互替换。
    - Pod name 的格式为 `<StatefulSet_name>-<Pod_id>` 。

  - 持久性
    - 即使重启、重新创建 Pod ，同一序号的 Pod 使用的 Pod Name、Pod IP 不变
    - 删除 Pod 时，不会自动删除其挂载的 volume


<!--
- 一个有状态服务的每个 Pod 使用独立的资源、配置文件，不能随时创建、销毁 Pod ，甚至连 Pod 名都不能改变。
- 例如：以无状态服务的方式运行一个 CentOS 容器，所有状态都存储在容器里，不可靠。改成 StatefulSet 方式运行，就可以漂移到不同节点上，实现高可用。 -->


- 例：
  ```yml
  apiVersion: v1
  kind: Service
  metadata:
    name: nginx
    namespace: default
  spec:
    clusterIP: None
    ports:
    - port: 80
      protocol: TCP
      targetPort: 80
    selector:
      k8s-app: nginx

  ---

  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: nginx
    namespace: default
  spec:
    # podManagementPolicy: OrderedReady
    replicas: 2
    # revisionHistoryLimit: 10
    selector:
      matchLabels:
        k8s-app: nginx
    serviceName: nginx
    template:
      metadata:
        labels:
          k8s-app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:1.20
    # updateStrategy:         # 更新部署的策略，注意与 strategy 的语法不同
    #   rollingUpdate:
    #     partition: 0
    #   type: RollingUpdate
  ```
  - 上例创建了一个 Headless Service ，并配置到 StatefulSet 的 serviceName 。此时会自动给每个 Pod 创建子域名，格式为 `<Pod_name>.<Service_domain>` ，例：
    ```sh
    nginx-0.nginx.nlp-web.svc.cluster.local
    nginx-1.nginx.nlp-web.svc.cluster.local
    ```




## DaemonSet

：与 Deployment 类似，但是在每个 node 上只部署一个 Pod 副本。适合监控、日志等 daemon 服务。
- DaemonSet 默认会调度到每个节点，可通过 nodeSelector 等方式指定可调度节点。
- 例：
  ```yml
  apiVersion: apps/v1
  kind: DaemonSet
  metadata:
    name: nginx
    namespace: default
  spec:
    selector:
      matchLabels:
        k8s-app: nginx
    # strategy:
    #   type: RollingUpdate
    template:
      metadata:
        labels:
          k8s-app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:1.20
  ```
- DaemonSet 的更新部署策略（strategy）有两种：
  - OnDelete ：等用户删除当前版本的 Pod ，才自动创建新版本的 Pod 。
  - RollingUpdate ：默认采用。

## Job

：一次性任务，适合部署运行一段时间就会自行终止、不需要重启的 Pod 。


## CronJob

：定时任务，用于定时创建并执行某个 Job 。
- 由 kube-controller-manager 定时调度，而后者默认采用 UTC 时区。
