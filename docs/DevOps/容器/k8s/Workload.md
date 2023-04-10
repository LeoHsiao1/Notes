# Workload

- 用 kubectl 命令手动管理 Pod 比较麻烦，因此一般通过控制器（Controller）自动管理 Pod ，统称为工作负载（workload）。
  - Workload 分为 Pod 、Deployment 、Job 等多种类型。
  - 用户需要编写 workload 配置文件，描述如何部署一个 Pod 。然后创建该 workload 对象，k8s 就会自动创建并部署 Pod 。

## Deployment

：适合部署无状态的 Pod ，可以在 k8s 集群内同时运行任意个 Pod 副本（又称为实例）。

### 配置

- 例：
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
    # strategy:
    #   type: RollingUpdate
    template:                       # 定义 Pod 模板
      metadata:                     # Pod 的元数据
        labels:
          k8s-app: nginx
      spec:                         # Pod 的规格
        containers:                 # 定义该 Pod 中的容器
        - name: nginx               # 该 Pod 中的第一个容器名
          image: nginx:1.23
  ```
- Deployment 会自动创建 ReplicaSet 对象，用于运行指定数量的 Pod 副本。
  - 删除一个 Deployment 时，会级联删除其下级对象 ReplicaSet ，和 ReplicaSet 的下级对象 Pod 。
  - Pod name 的格式为 `<Deployment_name>-<ReplicaSet_id>-<Pod_id>` ，例如：
    ```sh
    nginx-65d9c7f6fc-szgbk
    ```
    - 不能事先知道 Deployment 创建的 Pod name ，因此一般通过 spec.selector 筛选条件来找到 Deployment 创建的 Pod 。

  - 每个 Pod 中，容器的命名格式为 `k8s_<container_name>_<pod_name>_<namespace_name>_<pod_uid>_<restart_count>` ，例如：
    ```sh
    k8s_POD_nginx-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0   # Pod 中内置的 pause 容器，其容器名为 POD
    k8s_nginx_nginx-65d9c7f6fc-szgbk_default_c7e3e169-08c9-428f-9a62-0fb5d14336f8_0
    ```
    - Pod_id 是一个在当前 ReplicaSet 之下唯一的编号，长度为 5 字符。而 pod_uid 是一个在整个 k8s 集群唯一的编号，长度为 36 字符。
    - 因为 restartPolicy 重启容器时，会创建一个新的容器，容器名末尾的 restart_count 从 0 开始递增。

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
  - RollingUpdate
    - ：滚动更新，这是默认策略。先创建新 Pod ，等它们可用了，再删除旧 Pod 。
    - 例：
      ```yml
      strategy:
        type: RollingUpdate
        rollingUpdate:        # 滚动更新的配置
          maxUnavailable: 0   # 允许同时不可用的 Pod 数量。可以为整数或百分数，默认为 25%
          maxSurge: 1         # 为了同时运行新、旧 Pod ，允许 Pod 总数超过 replicas 一定数量。可以为整数或百分数，默认为 25%
      ```
      - 滚动更新时，会尽量保持 `replicas - maxUnavailable ≤ availableReplicas ≤ replicas + maxSurge` 。
    - 优点：
      - 客户端通过 Service 访问 Deployment 时，总是至少有一个 Ready 状态的 Pod 能接收客户端的请求，从而保证不中断服务（实际上新请求不会中断，旧请求可能被中断）。
      - 执行 `kubectl rollout restart <deployment>` 命令，则会按 strategy 策略重启 Deployment ，可实现滚动重启，又称为热重启。
    - 缺点：
      - 短期部署的 Pod 实例会比平时多 maxSurge 个，占用更多服务器资源。
      - 新旧 Pod 短期内会同时运行，可能引发冲突，比如同时访问挂载的数据卷。
      - 旧 Pod 被终止时，不会接受新请求，但可能还有旧请求未处理完，比如还有客户端的 TCP 连接在传输数据。
        - 可以给容器添加 preStop 钩子，等准备好了才终止容器。这样能实现零中断的滚动更新。
  - Recreate
    - ：直接重建。先删除旧 ReplicaSet 的 Pod ，再创建新 ReplicaSet 的 Pod 。

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

## DaemonSet

：与 Deployment 类似，但在每个 Node 上最多运行一个 Pod 副本。适合部署监控系统、日志采集等进程。
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
          image: nginx:1.23
  ```
- DaemonSet 默认会调度到每个节点，可通过 nodeSelector 等方式指定可调度节点。
- DaemonSet 的更新部署策略（strategy）有两种：
  - RollingUpdate ：滚动更新，这是默认策略。
  - OnDelete ：等用户删除当前版本的 Pod ，才自动创建新版本的 Pod 。

## StatefulSet

：与 Deployment 类似，但适合部署有状态的 Pod 。
- 相关概念：
  - 无状态应用
    - ：历史执行的任务不会影响新执行的任务。因此 Pod 可以随时删除，然后从镜像重新创建 Pod ，能同样工作。
    - 比如纯前端网站是无状态应用，数据库服务器是有状态应用。
  - 有状态应用
    - ：历史执行的任务会影响新执行的任务，因此需要存储一些历史数据。
    - 无状态应用故障时，可以立即启动新实例、销毁旧实例。而有状态应用故障时，可能丢失状态数据，甚至不能通过重启来恢复运行，因此风险更大。
      - 对于有状态应用，如果将数据存储在容器中，则会随着容器一起销毁。因此通常将数据存储到挂载卷，或容器外的数据库。
      - 例如 Nginx 通常是无状态应用，MySQL 通常是有状态应用。
    - 用 k8s 部署有状态应用时，通常使用 StatefulSet 。
- 与 Deployment 相比，StatefulSet 的优点：
  - 有序性
    - ：StatefulSet 会按顺序创建 replicas 个 Pod ，给每个 Pod 分配一个从 0 开始递增的序号。
  - 唯一性
    - ：每个 Pod 副本是独特的，不可相互替代。
    - Pod name 的格式为 `<StatefulSet_name>-<Pod_id>` ，比如 nginx-0、nginx-1 。
  - 持久性
    - 删除 Pod 时，会自动重建该 Pod ，采用相同的序号、Pod Name ，但 Pod IP 会重新分配。
    - 删除 Pod 时，默认不会自动删除其挂载的 volume 。重建 Pod 时，会挂载原来的 volume 。
- 与 Deployment 相比，StatefulSet 的缺点：
  - 运维成本更大。比如需要配置 Headless Service、PVC 。
    - 因此，如果只需部署少量有状态应用，使用 docker-compose 可能比 k8s 更方便。
    - 如果能将有状态应用改造为无状态应用，则可使用 Deployment 部署，更方便运维。

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
    serviceName: nginx        # 该 StatefulSet 采用的 k8s Service ，默认为 ''
    template:
      metadata:
        labels:
          k8s-app: nginx
      spec:
        containers:
        - name: nginx
          image: nginx:1.23
    # updateStrategy:         # 更新部署的策略，与 DaemonSet 的 strategy 相似。默认为 RollingUpdate ，可改为 OnDelete
    #   type: RollingUpdate
    #   rollingUpdate:
    #     partition: 0
    # PersistentVolumeClaim:  # k8s v1.23 新增的功能，表示在 StatefulSet 的生命周期中是否自动删除 PVC
    #   whenDeleted: Retain   # 删除 StatefulSet 时如何处理 PVC 。默认为 Retain 即保留，可改为 Delete
    #   whenScaled: Retain    # 减少 StatefulSet 的 replicas 时如何处理 PVC
  ```
  - 上例创建了一个 Headless Service ，并配置到 StatefulSet 的 serviceName 。此时会自动给每个 Pod 创建一个 DNS 子域名，例如：
    ```sh
    nginx-0.nginx.default.svc.cluster.local
    nginx-1.nginx.default.svc.cluster.local
    ```
    - 此时 Service 失去了负载均衡的功能，只能用于服务发现。
    - Deployment 的各个 Pod 可相互替代，而 StatefulSet 的各个 Pod 是独特的，建议通过 DNS 子域名来访问指定的 Pod 。而 Pod IP 在删除重建 Pod 时会变化，因此不适合用作网络标识。
    - 如果 StatefulSet 不需要被其它服务访问，可省略 serviceName 字段。

- podManagementPolicy 表示管理多个 Pod 时的策略，有两种：
  - OrderedReady
    - 这是默认策略。
    - 创建多个 Pod 时，按从小到大的序号逐个创建，等一个 Pod 变为 Ready 状态，才创建下一个 Pod 。
      - k8s v1.25 开始支持给 StatefulSet 设置 spec.minReadySeconds ，等一个 Pod 保持 Ready 状态几秒之后，才创建下一个 Pod 。
    - 删除多个 Pod 时，按从大到小的序号逐个删除，等一个 Pod 删除成功，才删除下一个 Pod 。
  - Parallel
    - ：创建、删除多个 Pod 时，都并行处理，像 Deployment 。

- StatefulSet 的更新部署策略（updateStrategy），与 DaemonSet 的 strategy 相似，有两种：
  - RollingUpdate
    - ：滚动更新，这是默认策略。
    - 按从小到大的序号逐个更新 Pod 。先删除序号为 n 的旧版 Pod ，然后创建序号为 n 的新版 Pod ，等它变为 Ready 状态，才更新序号为 n-1 的 Pod 。
    - 设置了 updateStrategy.rollingUpdate.partition 时，则会将该 StatefulSet 的所有 Pod 分为两个分区：
      - 旧分区：序号小于 partition 的 Pod 。这些 Pod 会一直采用设置 partition 时的那个版本，即使更新 StatefulSet 、删除重建 Pod ，也会停留在旧版本。
      - 新分区：序号大于等于 partition 的 Pod ，会正常更新部署。
      该功能适合灰度发布。
  - OnDelete

## Job

：一次性任务，适合部署运行一段时间就会自行终止的 Pod 。
- 创建 Job 之后，它会立即创建指定个 Pod 副本，这些 Pod 会被自动调度、运行。
- 例：用以下配置创建一个 Job
  ```yml
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: test-job
    namespace: default
  spec:
    template:
      spec:
        containers:
        - command:
          - curl
          - baidu.com
          name: curl
          image: alpine/curl:latest
        restartPolicy: Never      # Job 下级 Pod 的重启策略，是必填字段，只能为 Never 或 OnFailure
  ```
  创建 Job 之后再查看其配置，可见 k8s 自动添加了一些配置参数：
  ```yml
  apiVersion: batch/v1
  kind: Job
  metadata:
    labels:
      controller-uid: c21ce7a7-f858-4c4e-95f8-9ac02fa60995
      job-name: test-job
    name: test-job
    namespace: default
  spec:
    backoffLimit: 6     # 重试次数，默认为 6
    completions: 1      # 完成数量，默认为 1 。表示存在多少个 Succeeded Pod 时，Job 变为 Complete 状态
    parallelism: 1      # 并行数量，默认为 1 。表示最多存在多少个 Running Pod 。如果为 0 ，则不创建 Pod
    # suspend: false    # 是否暂停 Job
    # activeDeadlineSeconds: 0    # Job 执行的超时时间，超过则终止 Job ，变为 Failed 状态。默认不限制
    # ttlSecondsAfterFinished: 0  # 当 Job 执行完成之后，保留多少秒就删除 Job ，这会自动删除下级 Pod 。默认不限制。如果为 0 ，则立即删除
    selector:
      matchLabels:
        controller-uid: c21ce7a7-f858-4c4e-95f8-9ac02fa60995
    template:
      metadata:
        labels:
          controller-uid: c21ce7a7-f858-4c4e-95f8-9ac02fa60995
          job-name: test-job
      spec:
        containers:
        - command:
          - curl
          - baidu.com
          image: alpine/curl:latest
          imagePullPolicy: Always
          name: curl
          resources: {}
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
        dnsPolicy: ClusterFirst
        restartPolicy: Never
        schedulerName: default-scheduler
        terminationGracePeriodSeconds: 30
  status:
    active: 1         # 记录当前 Running 阶段的 Pod 数量
    failed: 0         # 记录当前 Failed 阶段的 Pod 数量
    # succeeded: 0    # 表示该 Job 是否执行完成
    startTime: "2022-01-01T12:00:00Z"
    # completionTime: ...
  ```
  - 创建 Job 时，k8s 默认会自动给 Job 添加一个唯一的 controller-uid 标签，用于 selector 。
    - 也可以手动指定 selector 标签，如下：
      ```yml
      manualSelector: true    # 是否允许手动指定 selector 标签
      selector:
        matchLabels:
          k8s-app: test-job
      ```

- kube-controller-manager 中的 JobController 负责管理 Job 。主要的工作流程：
  1. Job 被创建之后，处于 Active 状态，立即创建一些 Pod 副本。
  2. 每隔 1s 检查一次 Job ，等 spec.completions 数量的 Pod 进入 Succeeded 阶段之后，该 Job 就执行完成，进入 Succeeded 阶段、Complete 状态。

- 除了 Complete 状态，Job 也可能达到 activeDeadlineSeconds、backoffLimit 限制而变为 Failed 状态，都属于终止执行。
  - 如果 Pod 一直处于 Running 阶段，不自行终止，Job 就会一直执行，等待 spec.completions 条件。除非设置了 activeDeadlineSeconds 。
  - 当 Job 终止时，会自动删除所有 Running Pod （优雅地终止），但剩下的 Pod 一般会保留，方便用户查看。除非设置了 ttlSecondsAfterFinished 。
  - 特别地，用户主动删除一个 Job 时，不会自动删除其下级 Pod 。
    - 删除一个 CronJob 时，会自动删除其下级 Job 及 Pod 。

- 当任一 Pod 进入 Failed 阶段时，Job 会自动重试，最多重试 backoffLimit 次。
  - 重试的间隔时间按 0s、10s、20s、40s 数列增加，最大为 6min 。
  - 重试的方式：
    - 采用 `restartPolicy: Never` 时，Job 每次重试，会保留 Failed Pod ，创建新 Pod 。
      - 如果 `status.failed - 1 ≥ backoffLimit` ，则 Job 停止重试。
      - 因此最多可能运行 `parallelism + backoffLimit` 次 Pod 。
    - 采用 `restartPolicy: OnFailure` 时，Job 每次重试，会重启 Failed Pod 。
      - Pod 的 `status.containerStatuses[0].restartCount` 字段记录了 Pod 被 restartPolicy 重启的次数。如果 `sum_all_pod_restartCount ≥ backoffLimit` ，则 Job 停止重试。
      - 因此最多可能运行 `parallelism + backoffLimit` 次 Pod 。不过最后一次重启时，Pod 刚启动几秒，就会因为 restartCount 达到阈值而被终止。相当于少了一次重试。
    - 如果主动删除 Pod ，导致 Job 自动创建新 Pod ，则不会消耗重试次数。
  - Job 达到 backoffLimit 限制时，会停止重试，变为 Failed 状态，自动删除所有 Running Pod ，保留其它 Pod 。
    - 特别地，如果采用 `restartPolicy: OnFailure` ，则会删除所有 Pod ，不方便保留现场、看日志。
    - 因此，建议让 Job 采用 `restartPolicy: Never` 。
  - k8s v1.25 给 Job 增加了 spec.podFailurePolicy 字段，决定当容器退出码在什么范围时，让 Job 重试。在什么范围时，让 Job 直接变为 Failed 状态。

- 例：暂停执行 Job
  ```sh
  kubectl patch job/test-job -p '{"spec":{"suspend":true}}'
  ```
  - 暂停执行 Job 时，会优雅地终止所有 Running Pod 。
  - 恢复执行 Job 时，会重新设置 status.startTime 字段，导致 activeDeadlineSeconds 重新计时。

## CronJob

：定时任务，用于定时创建 Job 。
- 例：
  ```yml
  apiVersion: batch/v1
  kind: CronJob
  metadata:
    name: test-cronjob
    namespace: default
  spec:
    concurrencyPolicy: Allow
    failedJobsHistoryLimit: 1     # 最多保留多少个执行失败的 Job ，超过则自动删除。设置为 0 则不保留
    jobTemplate:
      spec:
        template:
          spec:
            containers:
              - command:
                - curl
                - baidu.com
                name: curl
                image: alpine/curl:latest
            restartPolicy: Never
    schedule: '*/5 * * * *'           # 调度时刻表，表示在什么时候创建 Job 。采用 Linux Cron 时间表达式
    # startingDeadlineSeconds: null   # 如果没在预期时刻准时调度 Job ，则最多允许延迟 n 秒调度，超过截止时间则错过这次调度。默认不限制截止时间
    successfulJobsHistoryLimit: 3     # 最多保留多少个执行成功的 Job ，超过则自动删除。设置为 0 则不保留
    suspend: false                    # 是否暂停 CronJob
  status:
    lastScheduleTime: "2022-01-01T09:25:00Z"    # 上一次调度的时刻
  ```
  - 创建一个 Job 时，如果之前创建的 Job 还在运行，则根据 concurrencyPolicy 进行操作：
    ```sh
    Allow     # 允许并发运行多个 Job 。这是默认策略。如果 Job 不会自行终止，则可能并发运行大量 Job
    Forbid    # 禁止并发。旧 Job 没有执行完时，会跳过创建新 Job 。因此不会更新 lastScheduleTime ，属于错过调度
    Replace   # 删除旧 Job ，再创建新 Job ，使得该 CronJob 同时只执行一个 Job
    ```

- kube-controller-manager 中的 CronJobController 负责管理 CronJob 。
  - kube-controller-manager 部署在容器中时，默认采用 UTC 时区。
  - 如果 CronJob 没有在预期时刻调度 Job （允许延迟 startingDeadlineSeconds 秒），则称为错过调度（miss schedule）。可能是因为 CronJob 暂停、主机时钟不准、k8s 故障等原因。
  - CronJobController 的主函数 Run() 每隔 10s 循环执行一次，期间调用 syncOne() 函数处理每个 CronJob 。
  - syncOne() 函数的流程大概如下：
    1. 调用 getRecentUnmetScheduleTimes() 函数，计算从 lastScheduleTime + startingDeadlineSeconds 时刻至今缺少调度 Job 的次数，即错过次数。
        - 如果是新创建的 CronJob ，则采用 CreationTimestamp 作为 lastScheduleTime 。
        - 如果错过次数 > 100 ，则当作 0 处理，并报错：Too many missed start time
    2. 如果错过次数 == 0 ，则不需要调度 CronJob 。
    3. 如果错过次数 > 0 ，则选取最近一次错过的预期时刻，补充调度。如果该时刻加上 startingDeadlineSeconds 之后早于当前时刻，则错过这次调度。
        - 例如暂停 CronJob 一段时间，然后取消暂停。默认不限制 startingDeadlineSeconds ，会补充最近一次错过的调度。
        - CronJob 正常的调度，也是基于错过次数来发现。
