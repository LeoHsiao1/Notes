# Pod

- 一个 Pod 包含一个或多个容器，又称为容器组。
  - Docker 以容器为单位部署应用，而 k8s 以 Pod 为单位部署应用。
- 当用户向 apiserver 请求创建一个 Pod 之后，会自动执行以下流程：
  1. kube-scheduler 决定将该 Pod 调度到哪个节点上。
  2. 由指定节点的 kubelet 部署该 Pod 。
- 同一 Pod 中的所有容器会被部署到同一个节点上。特点：
  - 共享一个网络空间，可以相互通信。对外映射的访问 IP 都是 Pod IP ，因此不能暴露同样的端口号。
  - 共享所有存储卷。

## 配置

<!--
Pod 中每个容器可单独设置 request、limit 资源
```yml
kind: Pod
spec:                         # Pod 的规格
  containers:                 # 定义该 Pod 中的容器
  - name: redis               # 该 Pod 中的第一个容器名
    image: redis:5.0.6
    command: ["redis-server /opt/redis/redis.conf"]
    ports:
    - containerPort: 6379   # 声明容器监听的端口，相当于 Dockerfile 中的 expose 指令
  # dnsPolicy: ClusterFirst
  # dnsConfig: ...
  # imagePullSecrets:
  # - name: qcloudregistrykey
  # restartPolicy: Always
  # schedulerName: default-scheduler
  # securityContext: {}
  # terminationGracePeriodSeconds: 30
  # hostNetwork: false    # 是否采用宿主机的 network namespace
  # hostIPC: false        # 是否采用宿主机的 IPC namespace
  # hostPID: false        # 是否采用宿主机的 PID namespace
```

- Pod 部署时常见的几种异常：
  - pod 长时间停留在 pending 阶段，比如：
    - 未分配用于部署的节点，即 unscheduled
    - 拉取不到镜像
    - 不能获取 Volume 等依赖
  - pod 进入 running 阶段，但启动之后很快终止，因此不断重启，即 CrashLoopBackOff 状态
  - pod 进入 running 阶段，保持运行，但长时间未通过健康检查，即非 Ready 状态。此时该 Pod 会从 EndPoint 中删除
  - pod 资源不足，比如发生内存 OOM 而重启
  - pod 异常终止，进入 failed 阶段
  - pod 被驱逐，进入 failed 阶段

Pod 处于 completion 状态时，可能是 Succeeded 或 Failed 阶段

- deployment 部署时常见的几种异常：
  - deployment 没有可用的 Pod 实例，即整个 deployment 不可用
  - deployment 的 Pod 实例未全部可用，持续长时间
  - deployment 的 Pod 实例未全部更新到最新版本，持续长时间
  - deployment 停留在 Progressing 状态超过 progressDeadlineSeconds 时长），则变为 Failed 状态

- 容器的日志建议输出到 stdout、stderr ，方便被 k8s 采集。
  - 如果存在其它日志文件，可以增加一个 sidecar 容器，执行 tail -f xx.log 命令。

-->

### Sidecar

- 一个 Pod 中只运行一个容器的情况最简单（称为主容器），但有时也会运行一些辅助容器（Sidecar）。

辅助容器有两种类型：
- 标准容器：与主容器差不多。
- init 容器：在创建 Pod 时最先启动，执行一些初始化任务，执行完成之后会自动退出。
  - 可以给一个 Pod 设置多个 init 容器，它们会按顺序串行执行。当一个 init 容器执行成功之后，才会启动下一个 init 容器或应用容器。
  - 如果某个 init 容器启动失败或异常退出，则 kubelet 会重新启动该 Pod 。
  - 重启 Pod 时会重新启动各个 init 容器。因此，为了避免多次重启 Pod 时出错，init 容器的行为应该满足幂等性。

### dnsPolicy

dnsPolicy 表示容器采用的 DNS 策略，几种取值示例：
- ClusterFirst
  - ：表示查询一个域名时，优先解析为 k8s 集群内域名。如果不能解析，才尝试解析为集群外域名。
  - 此时会自动在主机 /etc/resolv.conf 文件的基础上为容器生成 /etc/resolv.conf 文件，内容示例：
    ```sh
    nameserver 10.43.0.10     # k8s 集群内的 DNS 服务器，比如 CoreDNS
    search default.svc.cluster.local svc.cluster.local cluster.local openstacklocal
    options ndots:5
    ```
    - 如果查询同一个命名空间下的短域名，比如 nginx ，则首先尝试解析 nginx.default.svc.cluster.local ，因此第一个 search 域就解析成功。
    - 如果查询其它命名空间下的域名，即使指定了完整域名比如 redis.db.svc.cluster.local ，其点数为 4 ，因此第一个 search 域会解析失败，第二个 search 域才解析成功，增加了 DNS 请求数。
- Default
  - ：用 kubelet 的 --resolv-conf 参数指定的文件作为容器的 /etc/resolv.conf 文件，因此只能解析集群外域名。
- None
  - ：不自动为容器生成 /etc/resolv.conf 文件，此时需要 dnsConfig 自定义配置。

dnsConfig 用于自定义容器内 /etc/resolv.conf 文件中的配置参数。
- 例：
  ```yml
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
    - 8.8.8.8
    searches:
    - default.svc.cluster.local
    options:
    - name: ndots
      value: "4"
    - name: timeout
      value: "3"
  ```

## 生命周期

每个 Pod 可能经过以下阶段：
- 初始化：按顺序启动各个 init 容器。
- 启动  ：启动主容器、sidecar 容器。
- 运行  ：会被探针定期探测。
- 终止  ：终止各个容器。
- 重启  ：kubelet 会按照 restartPolicy 重启容器。

### 终止

- Running 状态的 Pod 可以被终止运行。但不能暂时终止，只能永久终止。
- 可调用 apiserver 的两种 API 来终止 Pod ：
  - Delete Pod
    - 流程如下：
      1. apiserver 将 Pod 标记为 Terminating 状态。
      2. kubelet 发现 Terminating 状态之后终止 Pod ，删除其中的容器，然后通知 apiserver 。
      3. apiserver 从 etcd 数据库删除 Pod ，以及 EndPoints 等相关资源。
    - 如果该 Pod 受某个 Controller 管理，则后者会自动创建新的 Pod 。
  - Evict Pod
    - ：驱逐，过程与 Delete 一致。
    - k8s 会在资源不足时自动驱逐 Pod 。此时 Pod 会标记为 evicted 状态、进入 Failed 阶段，不会自动删除，会一直占用 Pod IP 等资源。
    - 可添加一个 crontab 任务来删除 Failed Pod：
      ```sh
      kubectl delete pods --all-namespaces --field-selector status.phase=Failed
      ```

### 重启

- 如果容器终止运行，但所属的 Pod 未被删除，则 kubelet 会自动重启该容器。
  - 容器重启时，所属的 Pod 不会变化，也不会调度到其它节点。
  - 容器重启时，如果多次重启失败，重启的间隔时间将按 10s、20s、40s 的形式倍增，上限为 5min 。当容器成功运行 10min 之后会重置。

- 容器的重启策略 restartPolicy 分为多种：
  ```sh
  Always     # 当容器终止时，或者被探针判断为 Failure 时，总是会自动重启。这是默认策略
  OnFailure  # 只有当容器异常终止时，才会自动重启
  Never      # 总是不会自动重启
  ```

### 状态

以下是一个 Pod 对象的状态示例：
```yml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.20
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

- status.conditions 是一个数组，记录了多个状态条件及其是否成立：
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
  - readinessProbe ：就绪探针，用于探测容器是否处于 Ready 状态，可以加入 EndPoints 被访问。
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
- name: redis
  livenessProbe:            # 定义 livenessProbe 用途、ExecAction 方式的探针
    exec:
      command:              # 每次探测时，在容器中执行命令：ls /tmp/health
      - ls
      - /tmp/health         # 可见，当/tmp/health 文件存在时，探测结果才会为 Success
    initialDelaySeconds: 5  # 容器刚创建时，等待几秒才开始第一次探测，默认为 0
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

可以给 Pod 中的每个容器定义 postStart、preStop 钩子，在启动、终止过程中增加操作。如下：
  ```yml
  contaienrs:
  - name: redis
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

## 资源配额

- Pod 中的容器默认可以占用主机的全部 CPU、内存，可能导致主机宕机。建议限制其资源配额，例：
  ```yml
  kind: Pod
  spec:
    containers:
    - name: alpine
      image: alpine/curl:latest
      resources:
        limits:
          cpu: 500m               # 每秒占用的 CPU 核数
          ephemeral-storage: 1Gi  # 占用的临时磁盘空间，包括 container rootfs、container log、emptyDir volume、cache
          memory: 512Mi           # 占用的内存
        requests:
          cpu: 100m
          ephemeral-storage: 100Mi
          memory: 100Mi
  ```
- requests 表示节点应该分配给 Pod 的资源量，limits 表示 Pod 最多占用的资源量。
  - 创建 Pod 时，如果指定的 requests 大于 limits 值，则创建失败。
  - 调度 Pod 时，会寻找可用资源不低于 Pod requests 的节点。如果不存在，则调度失败。
  - 启动 Pod 时，会创建一个 Cgroup ，根据 Pod limits 设置 cpu.cfs_quota_us、memory.limit_in_bytes 阈值，从而限制 Pod 的资源开销。

- 当 Pod 占用的资源超过 limits 时：
  - 如果超过 limits.cpu ，则让 CPU 暂停执行容器内进程，直到下一个 CPU 周期。
  - 如果超过 limits.memory ，则触发 OOM-killer ，可能杀死容器内 1 号进程而导致容器终止，不过一般设置了容器自动重启。
  - 如果超过 limits.ephemeral-storage ，则会发出驱逐信号 ephemeralpodfs.limit ，驱逐 Pod 。

- 几种 Pod 举例：
  - Pod 的 requests=limits ，这样容易预测 Pod 的资源开销。
  - Pod 运行时一般只占用 0.1 核 CPU ，但启动时需要 1 核 CPU ，高峰期需要 2 核 CPU 。
    - 如果分配过多 requests=limits ，就容易浪费节点资源。
    - 如果分配过少 requests=limits ，就容易资源不足。
    - 如果分配较少 requests、较多 limits ，就难以预测 Pod 的资源开销。如果多个这样的 Pod 调度到同一个节点上，limits 之和会超过节点总资源，可能耗尽节点资源。

### RuntimeClass

- 可以创建 RuntimeClass 对象，自定义容器运行时。
- 例：
  ```yml
  apiVersion: node.k8s.io/v1
  kind: RuntimeClass
  metadata:
    name: test-rc
  handler: test-rc      # 通过 CRI 调用某个 handler ，负责创建、管理容器
  # overhead:
  #   podFixed:         # 单个 Pod 本身需要占用的系统资源
  #     cpu: 100m
  #     memory: 100Mi
  # scheduling:         # 调度规则，用于将 Pod 调度到某些节点上，比如支持该容器运行时的节点
  #   nodeSelector:
  #     project: test
  #   tolerations:
  #     - key: k1
  #       operator: Equal
  #       value: v1
  #       effect: NoSchedule
  ```
  ```yml
  kind: Pod
  spec:
    runtimeClassName: runC-pod    # Pod 采用的 RuntimeClass 。默认为空，即采用默认的容器运行时
  ```
- 默认的 Pod overhead 为空，即不考虑。如果指定了非空值，则：
  - 调度 Pod 时，会累计 Container requests、Pod overhead 资源，作为 Pod requests ，寻找有足够可用资源的节点。
  - 启动 Pod 时，会累计 Container limits、Pod overhead 资源，作为 Pod limits ，根据它设置 Cgroup 阈值。

### LimitRange

- 可以创建 LimitRange 对象，设置每个容器的资源配额的取值范围。例：
  ```yml
  apiVersion: v1
  kind: LimitRange
  metadata:
    name: test-limit-range
    namespace: default      # 作用于该命名空间
  spec:
    limits:
    - default:              # 每个容器 limits 的默认值
        cpu: 500m
        memory: 512Mi
        ephemeral-storage: 1Gi
      # defaultRequest:     # 每个容器 requests 的默认值。如果不指定，则自动设置为上述的 default 值
      #   memory: 100Mi
      # max:                # 每个容器 limits 的最大值
      #   memory: 1Gi
      # min:                # 每个容器 requests 的最小值
      #   memory: 100Mi
      type: Container
  ```
  - 创建容器时，
    - 如果未指定 limits、requests ，则自动设置为默认值。特别地，如果指定了 limits、未指定 requests ，则将 requests 设置为 limits 。
    - 如果指定的 limits 不符合 max、min 条件，则创建失败。
  - 已创建的容器不受 LimitRange 影响。

### ResourceQuota

- 可以创建 ResourceQuota 对象，限制一个 namespace 中所有 Pod 的资源总配额。例：
  ```yml
  apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: test-rq
    namespace: default
  spec:
    hard:
      requests.cpu: "10"                # 限制所有 Pod 的 requests 资源的总和
      limits.cpu: "20"
      requests.memory: 1Gi
      limits.memory: 2Gi

      requests.storage: 100Gi           # 限制 PVC 的总容量
      persistentvolumeclaims: "10"      # 限制 PVC 的总数
      requests.ephemeral-storage: 100Gi
      limits.ephemeral-storage: 100Gi

      pods: "100"                       # 限制 Pod 的总数
      services: "100"
      count/deployments.apps: "100"     # 可用 count/<resource> 的语法限制某种资源的总数
      requests.nvidia.com/gpu: 4        # 限制 GPU 的总数
      hugepages-<size>: "100"           # 限制 某种尺寸的 hugepages 的总数

  # scopes:                               # 只限制指定范围的 Pod
  #   - BestEffort
  #   - NotBestEffort
  # scopeSelector:
  #   matchExpressions:
  #     - operator: In                    # 运算符可以是 In、NotIn、Exists、DoesNotExist
  #       scopeName: PriorityClass
  #       values:
  #         - high
  ```
  - 创建 Pod 时，如果指定的 limits、requests 超过总配额，则创建失败。
  - 如果 Pod 的 .status.phase 为 Failed、Succeeded ，则处于终止状态，不会占用 cpu、memory、pods 等资源配额，但会占用 storage 等资源配额。

## 调度节点

- 创建一个 Pod 之后，kube-scheduler 会决定将该 Pod 调度到哪个节点上。调度过程分为两个步骤：
  - 过滤
    - ：遍历所有 Node ，筛选出允许调度该 Pod 的所有 Node ，称为可调度节点。比如 Node 必须满足 Pod 的 request 资源、Pod 必须容忍 Node 的污点。
    - 如果没有可调度节点，则 Pod 一直不会部署。
    - 如果 Node 总数低于 100 ，则默认当可调度节点达到 50% Node 时就停止遍历，从而减少耗时。
    - 为了避免某些节点一直未被遍历，每次遍历 Node 列表时，会以上一次遍历的终点作为本次遍历的起点。
  - 打分
    - ：给每个可调度节点打分，选出一个最适合部署该 Pod 的 Node 。比如考虑节点的亲和性。
    - 如果存在多个打分最高的 Node ，则随机选取一个。
- 可以配置 nodeSelector、Affinity、Taint 等条件，只有同时满足这些条件的节点才可用于调度。

### nodeSelector

- k8s 默认可能将 Pod 调度到任一节点上。可以给 Pod 增加 nodeSelector 配置，指定可调度节点。
- 用法：先给节点添加 Label ，然后在 Pod spec 中配置该 Pod 需要的 Node Label 。
- 例：
  ```yml
  kind: Pod
  spec:
    nodeSelector:       # 根据节点标签，筛选出可调度节点，可能有多个
      project: test
    # nodeName: node-1  # 也可以直接指定一个可调度节点
  ```

### nodeAffinity

：节点的亲和性，表示将 Pod 优先部署在哪些节点上，比 nodeSelector 更灵活。
- 亲和性的几种类型：
  - preferredDuringScheduling ：为 Pod 调度节点时，优先调度到满足条件的节点上。如果没有这样的节点，则调度到其它节点上。（软性要求）
  - requiredDuringScheduling ：为 Pod 调度节点时，只能调度到满足条件的节点上。如果没有这样的节点，则不可调度。（硬性要求）
  - IgnoredDuringExecution ：当 Pod 已调度之后，不考虑亲和性，因此不怕节点的标签变化。（软性要求）
  - RequiredDuringExecution ：当 Pod 已调度之后，依然考虑亲和性。如果节点的标签变得不满足条件，则可能驱逐 Pod 。（硬性要求，尚不支持）
- 例：
  ```yml
  kind: Pod
  spec:
    affinity:
      nodeAffinity:               # nodeAffinity 之下可以定义多种亲和性，需要同时满足
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:      # nodeSelectorTerms 之下可以定义多个条件，只需满足一个即可
          - matchExpressions:
            - key: kubernetes.io/os
              operator: In
              values:
              - linux
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 1               # preferredDuringScheduling 必须设置 weight 权重。这会遍历所有节点，如果满足一个条件，则累计 weight 作为得分，最后选出总得分最高的节点用于调度
          preference:
            matchExpressions:     # matchExpressions 之下可以定义多个条件，需要全部满足
            - key: kubernetes.io/hostname
              operator: In
              values:
              - node-1
        - weight: 50
          preference: ...
  ```
  - operator 可以是以下类型：
    ```sh
    Exists        # 节点存在该 key
    DoesNotExist  # 与 Exists 相反，可实现反亲和性
    In            # 节点存在该 key ，且其值在指定的列表中
    NotIn
    Gt            # 节点存在该 key ，且其值大于指定值
    Lt            # 小于
    ```

### podAffinity

：Pod 间的亲和性，表示将某些 Pod 优先部署到同一个节点上。
- 例：
  ```yml
  kind: Pod
  spec:
    affinity:
      podAffinity:                              # Pod 间的亲和性
        requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
            - key: project
              operator: In
              values:
              - test
          topologyKey: kubernetes.io/hostname   # 拓扑，将某个标签取值相同的多个节点划分为一个区域，然后将满足亲和性的多个 Pod 调度到同一个区域
          # namespaces:                         # 默认将当前 Pod 与所有命名空间的 Pod 考虑亲和性，可以指定命名空间
          #   - default
          # namespaceSelector:
          #   matchLabels:
          #     project: test
      podAntiAffinity:                          #  Pod 间的反亲和性
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
              - key: k8s-app
                operator: In
                values:
                - redis
            topologyKey: kubernetes.io/hostname
  ```

### Taint、Tolerations

- 可以给节点添加一些标签作为污点（Taint），然后给 Pod 添加一些标签作为容忍（Tolerations）。kube-scheduler 不会在将 Pod 调度到有污点的节点上，除非 Pod 能容忍该污点。
- 例：
  1. 给节点添加污点：
      ```sh
      kubectl taint nodes node1 k1=v1:NoSchedule
      ```
  2. 在 Pod spec 中配置容忍度：
      ```yml
      kind: Pod
      spec:
        tolerations:
        - key: k1
          operator: Equal
          value: v1
          effect: NoSchedule
        - key: k2
          operator: Exists
          effect: PreferNoSchedule
        - key: k3
          operator: Exists
          effect: NoExecute
          tolerationSeconds: 3600
      ```
- 污点的效果分为三种：
  - NoSchedule ：如果 Pod 不容忍该污点，则不部署到该节点上。如果已经部署了，则继续运行该 Pod 。
  - PreferNoSchedule ：如果 Pod 不容忍该污点，则优先部署到其它节点上，不行的话才部署到该节点上。
  - NoExecute ：如果 Pod 不容忍该污点，则不部署到该节点上。如果已经部署了，则驱除该 Pod 。
    - 可以额外设置 tolerationSeconds ，表示即使 Pod 容忍该污点，也最多只能保留指定秒数，超时之后就会被驱除，除非在此期间该污点消失。
- 在 Tolerations 中：
  - 当 operator 为 Equal 时，如果 effect、key、value 与 Taint 的相同，则匹配该 Taint 。
  - 当 operator 为 Exists 时，如果 effect、key 与 Taint 的相同，则匹配该 Taint 。
  - 如果不指定 key ，则匹配 Taint 的所有 key 。
  - 如果不指定 effect ，则匹配 Taint 的所有 effect 。

### 节点压力驱逐

- 节点压力驱逐（Node-pressure Eviction）：当节点可用资源低于阈值时，kubelet 会驱逐该节点上的 Pod 。
  - kube-scheduler 会限制每个节点上，所有 pod.request 的资源之和不超过 allocatable 。但 Pod 实际占用的资源可能更多，用 pod.limit 限制也不可靠，因此需要驱逐 Pod ，避免整个主机的资源耗尽。
  - 决定驱逐的资源主要是内存、磁盘，并不考虑 CPU 。
  - 驱逐过程：
    1. 给节点添加一个 NoSchedule 类型的污点，不再调度新 Pod 。
    2. 驱逐该节点上的 Pod 。
    3. 驱逐一些 Pod 之后，如果不再满足驱逐阈值，则停止驱逐。
  - 优先驱逐这些 Pod ：
    - 实际占用内存、磁盘多于 requests 的 Pod ，按差值排序
    - Priority 较低的 Pod

- 几种驱逐信号：
  ```sh
  memory.available    # 节点可用内存不足
  nodefs.available    # 节点可用磁盘不足
  nodefs.inodesFree   # 节点可用的 inode 不足
  imagefs.available
  imagefs.inodesFree
  pid.available       # 节点可用的 PID 不足
  ```
  - 计算关系：
    ```sh
    memory.capacity = RAM     # 节点的硬件资源容量
    memory.allocatable = memory.capacity - kube-reserved - system-reserved  # 节点的可分配资源量，等于硬件容量减去保留量
    memory.available = memory.allocatable - memory.workingSet               # 节点实际用的资源量，这是根据 Cgroup 数据计算的，与 pod.request 无关
    ```
  - nodefs、imagefs 一般都位于主机的主文件系统上。
    - nodefs ：用于存放 /var/lib/kubelet/ 目录。
    - imagefs ：用于存放 /var/lib/docker/ 目录，主要包括 docker images、container rootfs、container log 数据。
  - kubelet 发出驱逐信号时，会给节点添加以下 condition 状态：
    ```sh
    MemoryPressure
    DiskPressure
    PIDPressure
    ```

- 节点压力驱逐的阈值分为两种：
  - 硬驱逐：满足阈值时，立即强制杀死 Pod 。
  - 软驱逐：满足阈值且持续一段时间之后，在宽限期内优雅地终止 Pod ，不会考虑 Pod 的 terminationGracePeriodSeconds 。
- kubelet 默认没启用软驱逐，只启用了硬驱逐，配置如下：
  ```sh
  memory.available<100Mi    # 如果节点可用内存低于阈值，则发出该驱逐信号
  nodefs.available<10%
  imagefs.available<15%
  nodefs.inodesFree<5%
  ```
  - 阈值可以是绝对值、百分比。百分比是指 available / capacity 。
  - 同一指标同时只能配置一个阈值。

## 自动伸缩

- Pod 的负载可能有时大、有时小，需要的 CPU、内存资源也不一样。
  - 如果一直给 Pod 分配较多资源，则负载较低时 Pod 会浪费资源。
  - 如果一直给 Pod 分配较少资源，则负载较高时 Pod 会资源不足，导致处理速度过慢，甚至服务中断。
- k8s 支持自动调整给 Pod 分配的资源数量，从而适应负载的变化。
- 在离线混合部署：当在线业务的负载较低时（比如晚上），运行一些离线业务，提高节点的资源利用率。

### HPA

：Pod 水平方向的自动伸缩（Horizontal Pod Autoscaling），又称为横向伸缩。
- 原理：
  1. 创建一个 HPA 对象，监控 Pod 的一些 metrics 指标。
  2. HPA 自动增加、减少 Pod 的 replicas 数量，使得 metrics 指标接近指定数值。算法为：
      ```sh
      rate = metrics当前值 / metrics期望值
      replicas期望值 = ceil(replicas当前值 * rate )   # ceil 即向上取整
      ```
- 配置示例：
  ```yml
  apiVersion: autoscaling/v2beta2
  kind: HorizontalPodAutoscaler
  metadata:
    name: test-hpa
    namespace: default
  spec:
    maxReplicas: 10           # Pod 自动伸缩的最大数量
    minReplicas: 1            # 最小数量
    metrics:                  # 监控指标
    - resource:
        name: cpu
        target:
          averageValue: 100m
          type: AverageValue  # 全部 Pod 的 metrics 平均值
      type: Resource
    scaleTargetRef:           # 要控制的 Pod
      apiVersion: apps/v1
      kind: Deployment
      name: nginx
  ```
- kube-controller-manager 默认每隔 15s 执行一次 HPA 伸缩。
- HPA 适合控制 Deployment 类型的 Pod 。而 StatefulSet 一般不适合改变 Pod 数量，DaemonSet 则不能改变 Pod 数量。
- 安装 k8s-prometheus-adapter 之后可使用自定义的 metrics 。

### VPA

：Pod 的纵向伸缩（Vertical Pod Autoscaler），即自动增加、减少 Pod 的 request、limit 资源配额。

### CA

：k8s 集群的自动伸缩（cluster-autoscaler），即自动增加、减少集群的节点数量。
