# Pod

- 一个 Pod 包含一个或多个容器，又称为容器组。
  - Docker 以容器为单位部署应用，而 k8s 以 Pod 为单位部署应用。
- 当用户向 apiserver 请求创建一个 Pod 之后，会自动执行以下流程：
  1. kube-scheduler 决定将该 Pod 调度到哪个节点上。
  2. 由指定节点的 kubelet 运行该 Pod 。

## 配置

- 例：简单的 Pod 配置
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: curl
    namespace: default
  spec:                           # Pod 的规格
    containers:                   # 在 Pod 中定义一组容器
    - command:
      - ping
      - baidu.com
      name: curl                  # 容器名
      image: alpine/curl:latest
  ```
  - 使用上述配置参数即可创建一个 Pod ，省略的其它配置参数会采用默认值。

- 例：详细的 Pod 配置
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: nginx
  spec:
    containers:
    - name: nginx
      image: nginx:1.20
      # imagePullPolicy: Always         # 拉取镜像的策略。默认为 Always ，表示每次创建容器时都要 pull 镜像。可选 IfNotPresent ，表示本机不存在该镜像时才拉取
      args:                             # 容器的启动命令，这会覆盖 Dockerfile 的 CMD 指令
      - nginx
      - -c
      - /etc/nginx/nginx.conf
      command:                          # 容器的启动参数，这会覆盖 Dockerfile 的 ENTRYPOINT 指令
      - bash
      - -c
      env:                              # 添加环境变量到容器终端
      - name: k1
        value: v1
      workingDir: /tmp                  # 容器的工作目录，这会覆盖 Dockerfile 的 WORKDIR 指令
      # terminationMessagePath: /dev/termination-log  # 默认挂载一个文件到容器内指定路径，用于记录容器的终止信息
      # terminationMessagePolicy: File
    # imagePullSecrets:                 # 拉取镜像时使用的账号密码，需要指定 secret 对象
    # - name: my_harbor
    # restartPolicy: Always             # 重启策略
    # terminationGracePeriodSeconds: 30 # kubelet 主动终止 Pod 时的宽限期，默认为 30s
    # hostIPC: false                    # 是否采用宿主机的 IPC namespace
    # hostNetwork: false                # 是否采用宿主机的 Network namespace
    # hostPID: false                    # 是否采用宿主机的 PID namespace
    # shareProcessNamespace:false       # 是否让所有容器共用 pause 容器的 PID namespace
  ```

- 容器内应用程序的的日志建议输出到 stdout、stderr ，方便被 k8s 采集。
  - 如果输出到容器内的日志文件，可以增加一个 sidecar 容器，执行 `tail -f xx.log` 命令，将日志采集到容器终端。

- Static Pod 是一种特殊的 Pod ，由 kubelet 管理，不受 apiserver 控制，不能调用 ConfigMap 等对象。
  - 用法：启动 kubelet 时加上 --pod-manifest-path=/etc/kubernetes/manifests 参数，然后将 Pod 的配置文件保存到该目录下。kubelet 会定期扫描配置文件，启动 Pod 。
  - 例如用 kubeadm 部署 k8s 集群时，会以 Static Pod 的形式运行 kube-apiserver、kube-scheduler 等 k8s 组件。

### containers

- 一个 Pod 中可以运行多个容器，特点：
  - 各个容器必须设置不同的 name 。
  - 容器内的主机名等于 Pod name ，模拟一个虚拟机。
  - 所有容器会被部署到同一个节点上。
    - 所有容器共享一个 Network namespace ，可以相互通信。绑定同一个 Pod IP ，因此不能监听同一个端口号。
    - 所有容器共享挂载的所有 volume 。
    - 所有容器采用独立的 PID namespace ，保证每个容器的主进程的 PID 为 1 。

- Pod 中的容器分为两种类型：
  - 普通容器
    - 辅助容器（Sidecar）：一些辅助用途的普通容器，不运行业务服务，而是负责采集日志、监控告警等辅助功能。
  - init 容器
    - ：在创建 Pod 之后最先启动，执行一些初始化任务，执行完成之后就退出。
    - 可以给一个 Pod 设置多个 init 容器，它们会按顺序先后运行。
      - 当一个 init 容器运行成功之后（即进入 Succeeded 阶段），才会启动下一个 init 容器。
      - 当所有 init 容器都运行成功之后，才会同时启动所有普通容器。
      - 如果某个 init 容器运行失败，则触发 restartPolicy 。
    - init 容器不会长期运行，因此不支持 lifecycle、Probe 等配置。
    - init 容器可能多次重启、重复运行，因此建议实现幂等性。

- 例：
  ```yml
  kind: Pod
  spec:
    containers:                 # 普通容器
    - name: nginx
      image: nginx:1.20
    initContainers:             # init 容器
    - name: init
      image: busybox:latest
      command:
        - touch
        - /tmp/f1
  ```

- 关于资源配额：
  - 如果多个 init 容器定义了一种配额，比如 limits/requests.cpu ，则采用各个 init 容器中取值最大的该种配额，作为有效值，作用于所有 init 容器的运行过程。
  - 对于整个 Pod ，一种配额的有效值（决定了调度），采用以下两者的较大值：
    - 所有普通容器的该种配额的总和
    - init 容器的该种配额的有效值

- 临时容器（Ephemeral Containers）
  - ：一种临时存在的容器，便于人工调试。
  - 临时容器不能在 Pod spec 中定义，只能通过 API 创建。不会自动重启，不会自动删除。
  - 例：
    ```sh
    # 在指定节点创建一个临时容器。这会创建一个 Pod ，采用 hostNetwork、hostPID 等
    kubectl debug node/<node> -it --image=alpine/curl:latest -- sh
    kubectl delete pod node-debugger-xxx

    # 创建一个临时容器，添加到指定的 Pod
    kubectl debug <pod> -it --image=alpine/curl:latest -- sh
        -c <name>         # 指定临时容器的名称
        --target=<name>   # 共用指定容器的 PID namespace
    ```

### env

- Pod 中定义的 env 环境变量会被添加到容器终端，还可在 command、args 命令中引用：
  ```sh
  echo $var1 ${var2}          # 这不是在 shell 中执行命令，$ 符号不生效，会保留原字符串
  sh -c "echo $var1 ${var2}"  # 这会读取 shell 环境变量
  echo $(var)                 # 语法 $() 会在创建容器时嵌入 Pod env 环境变量，而不是读取 shell 环境变量。如果该变量不存在，则 $ 符号不生效，会保留原字符串
  ```
  例：
  ```yml
  kind: Pod
  spec:
    containers:
    - name: busybox
      image: busybox:latest
      command: ["echo", "$K1", "$(K2)"]
      env:
      - name: K1
        value: V1
      - name: K2
        value: V2
  ```
- 可以将 Pod 的 [一些字段](https://kubernetes.io/docs/concepts/workloads/pods/downward-api/) 保存为环境变量，例：
  ```yml
  env:
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.labels['k8s-app']
  - name: LIMITS_CPU
    valueFrom:
      resourceFieldRef:
        containerName: container-0
        resource: limits.cpu
  ```

### DNS

- k8s 集群内通常会运行一个 DNS 服务器，比如 CoreDNS 。可以创建一些只在 k8s 集群内有效的域名，解析到 pod_ip 或 service_ip 。
  - 默认会修改每个 Pod 内的 /etc/resolv.conf 文件，让 Pod 将 DNS 查询请求发送到该 DNS 服务器。
  - 例如在 Pod 内访问 k8s service_name 时，默认会 DNS 解析到 service_ip 。
- 建议让 Pod 慎用 DNS 查询。因为：
  - 进行 DNS 查询需要一定耗时。
  - Pod 里运行的程序可能不尊重 DNS 查询结果的 TTL ，甚至无限期缓存 DNS 查询结果，直到重启程序。

- dnsPolicy 表示容器内采用的 DNS 策略，常见的几种取值：
  - ClusterFirst
    - ：默认值，表示查询一个域名时，优先解析为 k8s 集群内域名。如果不能解析，才尝试解析为集群外域名。
    - 此时会自动在宿主机 /etc/resolv.conf 文件的基础上为容器生成 /etc/resolv.conf 文件，内容示例：
      ```sh
      nameserver 10.43.0.10     # k8s 集群内的 DNS 服务器，比如 CoreDNS
      search default.svc.cluster.local svc.cluster.local cluster.local openstacklocal
      options ndots:5
      ```
      - 如果查询同一个命名空间下的短域名，比如 nginx ，则首先尝试解析 nginx.default.svc.cluster.local ，因此第一个 search 域就解析成功。
      - 如果查询其它命名空间下的域名，比如 redis.db.svc.cluster.local ，其点数为 4 ，因此第一个 search 域会解析失败，第二个 search 域才解析成功，增加了 DNS 请求数。
  - Default
    - ：采用 Pod 的宿主机的 /etc/resolv.conf 文件，因此不能解析 k8s 集群内域名。
  - None
    - ：不自动为容器生成 /etc/resolv.conf 文件，此时需要用 dnsConfig 自定义配置。

- dnsConfig 用于自定义容器内 /etc/resolv.conf 文件中的配置参数。例：
  ```yml
  kind: Pod
  spec:
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

### priority

- 优先级（priority）
  - ：多个 Pod 同时等待 kube-scheduler 调度时，会选出 priority 最高的 Pod 优先调度。如果该 Pod 调度成功或不可调度，才调度 priority 较低的 Pod 。
- 抢占（Preemption）
  - ：当一个 Pod 缺乏可用资源来调度时，会自动驱逐某个节点上一些 priority 较低的 Pod （这会优雅地终止），腾出 CPU、内存等资源。
  - 在抢占成功之前，如果出现另一个可调度节点，则停止抢占。
  - 在抢占成功之前，如果出现另一个 priority 更高的 Pod ，则优先调度它。而当前 Pod 会重新调度。
- PriorityClass
  - ：一种不受命名空间管理的对象，用于配置 Pod priority 。
  - 例：创建一个 PriorityClass
    ```yml
    apiVersion: scheduling.k8s.io/v1
    kind: PriorityClass
    metadata:
      name: test-priority
    value: 1000                               # 优先级，取值范围为 0~2^32 ，默认为 0
    # preemptionPolicy: PreemptLowerPriority  # 抢占策略，默认会抢占 priority 较低的 Pod 。设置成 Never 则放弃抢占
    # globalDefault: false                    # 是否将该 PriorityClass 默认绑定到所有 Pod 。最多存在一个默认的 PriorityClass
    ```
    绑定到 Pod ：
    ```yml
    kind: Pod
    spec:
      priorityClassName: test-priority
    ```
    此后新创建的 Pod 会自动根据 PriorityClass 设置 priority ，但不会影响已创建的 Pod 。
  - k8s 自带了两个 PriorityClass ，用于部署系统组件。
    ```sh
    system-cluster-critical
    system-node-critical
    ```

## 生命周期

- 一个对象从创建到存在、删除的过程称为生命周期（lifecycle）。

### phase

- Pod 的生命周期分为多个阶段（phase）：
  - Pending
    - ：Pod 已创建，但尚未运行。
  - Running
    - ：运行中，即 kubelet 在运行该 Pod 的所有容器。
  - Succeeded
    - ：Pod 中的所有容器都已经正常终止。又称为 Completed 状态。
  - Failed
    - ：Pod 中的所有容器都已经终止，且至少有一个容器是异常终止。
  - Unkown
    - ：状态未知。
    - 例如 apiserver 与 kubelet 断开连接时，就不知道 Pod 的状态。

- 一般的 Pod 会按顺序经过 Pending、Running、Succeeded 阶段，但也可能在几个阶段之间反复切换。
- k8s 定义了上述几个 Pod phase ，不过通常还会用 Scheduled、terminated 等状态（status）来形容 Pod 。

### 启动

- 一个新建的 Pod ，主要经过以下步骤，才能从 Pending 阶段进入 Running 阶段。
  - 调度节点
    - Pod 被调度到一个节点之后，不能迁移到其它节点。如果在其它节点创建新的 Pod ，即使采用相同的 Pod name ，但 UID 也会不同。
  - 拉取镜像
    - 如果拉取镜像失败，则 Pod 报错 ImagePullBackOff ，会每隔一段时间重试拉取一次。间隔时间按 0s、10s、20s、40s 数列增加，最大为 5min 。Pod 成功运行 10min 之后会重置间隔时间。
  - 创建容器
    - 比如根据镜像配置容器、挂载数据卷。
  - 启动容器
    - 先启动 init 容器，再启动标准容器。

### 终止

- 如果 Pod 中所有容器从 running 状态变为 terminated 状态，则称该 Pod 处于终止（terminated）状态。
  - Pod 终止并不是暂停。此时容器内进程已退出、消失，不能恢复运行。
  - Pod 终止之后，可能触发 restartPolicy ，也可能被 Deployment、Job 等控制器自动删除。如果没有删除，则会一直占用 Pod IP 等资源。
    - kube-controller-manager 会在 terminated pod 数量达到 terminated-pod-gc-threshold 阈值时，删除它们。
    - 用户也可以添加一个 crontab 任务来删除 Failed Pod ：
      ```sh
      kubectl delete pods --all-namespaces --field-selector status.phase=Failed
      ```

- Pod 终止的常见原因：
  - Pod 自行终止，进入 Succeeded 或 Failed 阶段。
  - kubelet 主动终止 Pod 。
    - 一般流程如下：
      1. 向容器内主进程发送 SIGTERM 信号。
      2. 等待宽限期（terminationGracePeriodSeconds）之后，如果容器仍未终止，则向容器内所有进程发送 SIGKILL 信号。
  - Linux 内核主动终止 Pod 。
    - 比如因为 OOM 杀死容器、用 kill 命令杀死容器内主进程。
    - 此时宽限期不生效，Pod 会突然终止，可能中断正在执行的事务，甚至丢失数据。
  - 主机宕机，导致 Pod 容器终止。

- 用户可调用 apiserver 的以下几种 API ，让 kubelet 终止 Pod ，称为自愿中断（voluntary disruptions）。
  - Delete Pod
    - 流程如下：
      1. apiserver 将 Pod 标记为 Terminating 状态。
      2. kubelet 发现 Terminating 状态之后终止 Pod ，删除其中的容器，然后通知 apiserver 。
      3. apiserver 从 etcd 数据库删除 Pod 。
    - 在 k8s 中，修改一个 Pod 的配置时，实际上会创建新 Pod 、删除旧 Pod 。
  - Evict Pod
    - ：驱逐，过程与 Delete 一致。
    - kubelet 会在节点资源不足时自动驱逐 Pod ，此时 Pod 会标记为 evicted 状态、进入 Failed 阶段。
    - Deploytment 不会自动删除下级的 evicted Pod ，而 DaemonSet、StatefulSet 会自动删除。

### 重启

- Pod 终止时，如果启用了 restartPolicy ，则会被 kubelet 自动重启。
  - kubelet 重启 Pod 时，并不会重启容器，而是删除旧容器（保留 pause 容器），然后在当前节点上重新创建 Pod 中的所有容器。
  - 如果 Pod 连续重启失败，则重启的间隔时间按 0s、10s、20s、40s 数列增加，最大为 5min 。Pod 成功运行 10min 之后会重置间隔时间。
    - 连续重启时，k8s 会报错 CrashLoopBackOff ，表示 Pod 陷入崩溃循环中。
    - Pod 不支持限制重启次数，会无限重启。不过 Job 可以通过 backoffLimit 限制重试次数。
  - 如果手动终止 Pod 中的任一容器，则 kubelet 会在 1s 内发现，并将 Pod 标记为 Failed 阶段，等满足重启间隔之后，再根据 restartPolicy 重启 Pod 。
    - 特别地，手动终止 pause 容器时，kubelet 可能过几秒才发现。

- Pod 的重启策略（restartPolicy）分为多种：
  ```sh
  Always     # 当容器终止时，总是会自动重启。这是默认策略
  OnFailure  # 只有当容器异常终止时，才会自动重启
  Never      # 总是不会自动重启
  ```
  - Deployment、Daemonset、StatefulSet 适合部署长期运行的 Pod ，挂掉了就自动重启，除非被删除。因此 restartPolicy 只能为 Always 。
  - Job 适合部署运行一段时间就会自行终止的 Pod ，因此 restartPolicy 只能为 Never 或 OnFailure 。

### 状态

以下是一个 Pod 对象的状态示例：
```yml
kind: Pod
status:
  conditions:             # Pod 的一些状态条件
  - type: Initialized     # condition 类型
    status: "True"        # 是否符合当前 condition ，可以取值为 True 、False 、Unknown
    lastProbeTime: null   # 最近一次探测的时刻
    lastTransitionTime: "2021-12-01T08:20:23Z"  # 最近一次改变该 condition 的 status 的时刻
  - type: Ready
    status: "True"
    lastProbeTime: null
    lastTransitionTime: "2021-12-01T08:21:24Z"
  ...
  containerStatuses:      # 容器的状态
  - containerID: docker://2bc5f548736046c64a10d9162024ed102fba0565ff742e16cd032c7a1b75cc29
    image: nginx:1.20
    imageID: docker-pullable://nginx@sha256:db3c9eb0f9bc7143d5995370afc23f7434f736a5ceda0d603e0132b4a6c7e2cd
    name: nginx
    ready: true
    restartCount: 0       # Pod 被 restartPolicy 重启的次数
    state:
      running:
        startedAt: "2021-12-01T08:21:23Z"
  hostIP: 10.0.0.1
  podIP: 10.42.57.150
  phase: Running          # Pod 所处的生命周期阶段
  startTime: "2021-12-01T08:20:23Z"
```
- 与 phase 类似，k8s 给一些资源定义了多种状态条件（conditions）。
  - 一个资源可能同时符合多种 conditions ，但同时只能处于一种 phase 。例如 Pod 可以同时符合 PodScheduled、Ready 条件。
  - k8s 会根据一个资源符合哪些 conditions ，判断该资源所处的 phase 。
  - 用户可以添加自定义的 conditions 。

- status.conditions.type 记录了 Pod 的多种 conditions ：
  ```sh
  PodScheduled      # Pod 已被调度到一个节点上
  Unschedulable     # Pod 不能被调度到节点上。可能是缺乏可用节点、找不到挂载卷等资源
  Initialized       # Pod 中的所有 init 容器都已运行成功
  ContainersReady   # Pod 中的所有容器已运行，且处于就绪状态
  Ready             # 整个 Pod 处于就绪状态，可以开始工作，又称为健康（health）状态。此时该 Pod 才会加入 EndPoints ，被 Service 反向代理
  ```

- status.containerStatuses.state 记录了容器的状态，有以下三种取值：
  ```sh
  waiting       # 等待一些条件才能启动。比如拉取镜像、挂载数据卷、等待重启间隔
  running       # 正在运行
  terminated    # 已终止
  ```

- Pod 的状态主要取决于其中容器的状态。
  - 当所有容器启动成功，变为 running 状态时，Pod 才从 Pending 阶段进入 Running 阶段。
  - 当所有容器处于 running 状态，并通过 readinessProbe 检查时，Pod 才处于 Running 阶段、Ready 状态。
  - 当任一容器变为 terminated 状态时，kubelet 会将 Pod 取消 Ready 状态，并触发 restartPolicy 。

### 探针

- Pod 默认未定义探针，因此经常遇到以下问题：
  - 容器刚启动时，可能还在初始化，kubelet 就会认为 Pod 处于 Ready 状态，过早接入 Service 的访问流量。
  - 容器运行一段时间之后突然故障，kubelet 却不能发现，依然接入 Service 的访问流量。
- 可以给 Pod 定义三种不同用途的探针，让 kubelet 定期对容器进行健康检查：
  - startupProbe
    - ：启动探针，用于探测容器是否已成功启动。如果探测结果为 Failure ，则触发 restartPolicy 。
    - 适用于启动耗时较久的容器。
  - livenessProbe
    - ：存活探针，用于探测容器是否正常运行。如果探测结果为 Failure ，则触发 restartPolicy 。
    - 适用于运行时可能故障，且需要主动重启的容器。
  - readinessProbe
    - ：就绪探针，用于探测容器是否就绪。如果探测结果为 Success ，则将 Pod 标记为 Ready 状态 。
    - 适用于运行可能故障，且不需要重启的容器。
- 探针每次的探测结果有三种：
  ```sh
  Success
  Failure
  Unknown     # 未知结果，此时不采取行动
  ```
  - Pod 默认未定义探针，相当于探测结果一直为 Success 。
  - Pod 定义了探针时，探测结果默认为 Failure ，需要探测成功，才能变为 Success 。
- 探针有多种实现方式：
  ```sh
  exec        # 在容器中执行指定的命令，如果命令的退出码为 0 ，则探测结果为 Success
  tcpSocket   # 访问容器的指定 TCP 端口，如果能建立 TCP 连接（不必保持），则探测结果为 Success
  httpGet     # 向容器的指定端口、URL 发出 HTTP GET 请求，如果收到响应报文，且状态码为 2xx 或 3xx ，则探测结果为 Success
  grpc
  ```

例：
```yml
kind: Pod
spec:
  containers:
  - name: nginx
    startupProbe:
      exec:
        command:
        - ls
        - /tmp/health
      # initialDelaySeconds: 0  # 容器刚启动时，等待几秒才开始第一次探测
      # periodSeconds: 10       # 每隔几秒探测一次
      # timeoutSeconds: 1       # 每次探测的超时时间
      # failureThreshold: 3     # 容器处于 Success 时，连续多少次探测为 Failure ，才判断容器为 Failure
      # successThreshold: 1     # 容器处于 Failure 时，连续多少次探测为 Success ，才判断容器为 Success
    livenessProbe:
      tcpSocket:
        port: 80
      periodSeconds: 3
    readinessProbe:
      httpGet:
        path: /health
        port: 80
        # scheme: HTTP
        httpHeaders:            # 给请求报文添加 Headers
        - name: X-Custom-Header
          value: hello
```
- 定义了 startupProbe 探针时，容器必须在 `initialDelaySeconds + failureThreshold × periodSeconds` 时长内成功启动，否则会触发 restartPolicy ，陷入死循环。

### postStart、preStop

- 可以给 Pod 中的每个容器定义 postStart、preStop 钩子，在启动、终止时增加操作。例：
  ```yml
  kind: Pod
  spec:
    contaienrs:
    - name: nginx
      lifecycle:
        postStart:
          exec:
            command:
            - /bin/bash
            - -c
            - echo hello ; sleep 1
        preStop:
          httpGet:
            path: /
            port: 80
  ```
- 启用了 postStart 时，会被 kubelet 在创建容器之后立即执行。
  - 如果 postStart 执行结果为 Failure ，则触发 restartPolicy 。
  - postStart 与容器的 ENTRYPOINT 是异步执行的，执行顺序不能确定。不过只有等 postStart 执行成功之后，kubelet 才会将容器的状态标为 Running 。
- 启用了 preStop 时，kubelet 终止 Pod 的流程如下：
  1. 先执行 preStop 钩子。
  2. 超过宽限期之后，如果容器依然未终止，则发送 SIGTERM 信号并再宽限 2 秒，最后发送 SIGKILL 信号。

## 资源配额

- Pod 中的容器默认可以占用主机的全部 CPU、内存，可能导致主机宕机。建议限制其资源配额，例：
  ```yml
  kind: Pod
  spec:
    containers:
    - name: nginx
      image: nginx:1.20
      resources:
        limits:
          cpu: 500m               # 每秒占用的 CPU 核数
          ephemeral-storage: 1Gi  # 占用的临时磁盘空间
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
  - k8s v1.8 增加了 ephemeral-storage 功能，不是基于 Cgroup 技术，而是直接监控 Pod 的 container rootfs、container log、emptyDir 占用的磁盘空间。

- 当 Pod 占用的资源超过 limits 时：
  - 如果超过 limits.cpu ，则让 CPU 暂停执行容器内进程，直到下一个 CPU 周期。
  - 如果超过 limits.memory ，则触发 OOM-killer ，可能杀死容器内 1 号进程而导致容器终止，不过一般设置了容器自动重启。
  - 如果超过 limits.ephemeral-storage ，则会发出驱逐信号 ephemeralpodfs.limit ，驱逐 Pod 。

- 建议监控 Pod 运行一段时间的实际资源开销，据此配置 requests、limits 。
  - 例如用脚本自动配置：
    ```py
    requests.cpu = average_over_24_hours(monitor.cpu)   # 根据 24 小时的平均开销设置 requests 资源
    limits.cpu   = max_over_24_hours(monitor.cpu)       # 根据 24 小时的最大开销设置 requests 资源
    ```
    - 理想的情况是， Pod 的 requests 等于 limits ，这样容易预测 Pod 的资源开销。
  - 假设一个 Pod 运行时通常只占用 0.1 核 CPU ，但启动时需要 1 核 CPU ，高峰期需要 2 核 CPU 。
    - 如果 requests 等于 limits 且多于实际开销，就容易浪费节点资源。
    - 如果 requests 等于 limits 且少于实际开销，Pod 就容易资源不足。
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

  # scopes:                             # 只限制指定范围的 Pod
  #   - BestEffort
  #   - NotBestEffort
  # scopeSelector:
  #   matchExpressions:
  #     - operator: In                  # 运算符可以是 In、NotIn、Exists、DoesNotExist
  #       scopeName: PriorityClass
  #       values:
  #         - high
  ```
  - 创建 Pod 时，如果指定的 limits、requests 超过总配额，则创建失败。
  - terminated 状态的 Pod 不会占用 cpu、memory、pods 等资源配额，但会占用 storage 等资源配额。
  - 安装 Nvidia 插件可让 kubelet 识别出主机上的 GPU ，然后分配给 Pod 。
    - 每个容器可以分配整数个 GPU ，不支持小数。
    - 不同容器之间不能共享 GPU 。

## 调度节点

- k8s 默认可能将 Pod 调度到任一节点上。可以配置 nodeSelector、Affinity、Taint 等条件，只有同时满足这些条件的节点才可用于部署 Pod 。

### nodeSelector

：节点选择器，用于筛选可调度节点。
- 用法：先给节点添加 Label ，然后在 Pod spec 中配置该 Pod 需要的 Node Label 。
- 例：
  ```yml
  kind: Pod
  spec:
    nodeSelector:       # 根据节点标签，筛选出可调度节点，可能有多个
      project: test

    # nodeName: node-1  # 也可以用 nodeName 直接指定一个可调度节点
  ```

### nodeAffinity

：节点的亲和性，表示将 Pod 优先调度在哪些节点上，比 nodeSelector 更灵活。
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

：Pod 间的亲和性，表示将某些 Pod 优先调度到同一区域。
- 例：
  ```yml
  kind: Pod
  spec:
    affinity:
      podAffinity:                              # Pod 间的亲和性
        requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              project: test
          topologyKey: kubernetes.io/hostname   # 根据指定 label 划分节点的拓扑域，然后将满足亲和性的多个 Pod 集中调度到同一个拓扑域
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
              matchLabels:
                k8s-app: nginx
            topologyKey: kubernetes.io/hostname
  ```

### topology

- 可以根据某个 label 的多种取值，将所有节点划分为多个拓扑域。

- 例：
  ```yml
  kind: Pod
  spec:
    topologySpreadConstraints:
      - labelSelector:                    # 筛选出某类型的 Pod （当前命名空间下）
          matchLabels:
            k8s-app: nginx
        topologyKey: kubernetes.io/zone   # 根据指定 label 划分节点的拓扑域，然后将该类型的 Pod 分散调度到不同的拓扑域，使得数量尽量均衡
        maxSkew: 1                        # 计算该类型的 Pod 调度到各个拓扑域的数量，取最大值与最小值之差，称为 maxSkew ，表示分布不均的程度
        whenUnsatisfiable: DoNotSchedule  # 如果 Pod 不满足 maxSkew 条件，默认不会调度。取值为 ScheduleAnyway 则依然调度，但尽量减小 maxSkew
      # - labelSelector: ...              # 一个 Pod 可定义多个 topologySpreadConstraints 条件，调度时需要同时满足
  ```
  - 如果某个节点不存在指定 label ，则不属于拓扑域，不会用于调度上述 Pod ，除非设置了 ScheduleAnyway 。
  - 上述条件只会在调度 Pod 时生效。如果终止已调度的 Pod ，则可能导致不满足 maxSkew 条件。

### Taint、Tolerations

：污点、容忍度，表示避免将 Pod 调度到哪些节点上，与亲和性相反。
- 可以给节点添加一些标签作为污点（Taint），然后给 Pod 添加一些标签作为容忍度（Tolerations）。kube-scheduler 不会将 Pod 调度到有污点的节点上，除非 Pod 能容忍该污点。
- 例：
  1. 给节点添加污点：
      ```sh
      kubectl taint nodes node1 k1=v1:NoSchedule
      ```
      或者修改节点的配置：
      ```yml
      spec:
        taints:
        - effect: NoSchedule
          key: k1
          value: v1
      ```
  2. 给 Pod 配置容忍度：
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
          # tolerationSeconds: 3600
      ```
- 污点的效果分为三种：
  - PreferNoSchedule ：如果 Pod 不容忍该污点，则优先调度到其它节点上，除非其它节点不可用，或者已经调度了。
  - NoSchedule ：如果 Pod 不容忍该污点，则不调度到该节点上。如果已经调度了，则继续运行该 Pod 。
  - NoExecute ：如果 Pod 不容忍该污点，则不调度到该节点上。如果已经调度了，则驱逐该 Pod 。
    - 可以额外设置 tolerationSeconds ，表示即使 Pod 容忍该污点，也最多只能保留指定秒数，超时之后就会被驱逐，除非在此期间污点消失。
- 在 Tolerations 中：
  - 当 operator 为 Equal 时，如果 effect、key、value 与 Taint 的相同，则匹配该 Taint 。
  - 当 operator 为 Exists 时，如果 effect、key 与 Taint 的相同，则匹配该 Taint 。
  - 如果不指定 key ，则匹配 Taint 的所有 key 。
  - 如果不指定 effect ，则匹配 Taint 的所有 effect 。
- 例：当节点不可用时，node controller 可能自动添加以下 NoExecute 类型的污点
  ```sh
  node.kubernetes.io/not-ready            # 节点未准备好
  node.kubernetes.io/unschedulable        # 节点不可调度
  node.kubernetes.io/unreachable          # node controller 访问不到该节点
  node.kubernetes.io/network-unavailable  # 节点的网络配置错误，不能正常 Pod 通信

  # 节点压力驱逐
  node.kubernetes.io/disk-pressure
  node.kubernetes.io/memory-pressure
  node.kubernetes.io/pid-pressure
  ```
  - DaemontSet 类型的 Pod 默认会添加对上述几种污点的容忍度，因此当节点出现这些故障时，也不会被驱逐。

### 节点压力驱逐

- 节点压力驱逐（Node-pressure Eviction）：当节点可用资源低于阈值时，kubelet 会驱逐该节点上的 Pod 。
  - kube-scheduler 会限制每个节点上，所有 pod.request 的资源之和不超过 allocatable 。但 Pod 实际占用的资源可能更多，用 pod.limit 限制也不可靠，因此需要驱逐 Pod ，避免整个主机的资源耗尽。
  - 决定驱逐的资源主要是内存、磁盘，并不考虑 CPU 。
  - 驱逐过程：
    1. 给节点添加一个 NoSchedule 类型的污点，不再调度新 Pod 。
    2. 驱逐该节点上的 Pod 。
    3. 驱逐一些 Pod 之后，如果不再满足驱逐阈值，则停止驱逐。
  - 优先驱逐这些 Pod ：
    - 实际占用内存、磁盘多于 requests 的 Pod ，按差值排序。
    - Priority 较低的 Pod 。

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
    memory.capacity    # 节点内存的硬件资源量，取自 /proc/meminfo 文件中的 MemTotal
    memory.allocatable = memory.capacity - kube-reserved - system-reserved  # 总共可分配的资源量，等于硬件量减去保留量
    memory.allocated   = sum(pod.requests.memory)                           # 已分配的资源量，等于当前调度到该节点的所有 Pod 的 requests 总和
    memory.unallocated = memory.allocatable - memory.allocated              # 未分配的资源量
    memory.available   = memory.capacity - memory.workingSet                # 实际可用的资源量，这是根据 Cgroup 监控数据计算的，与 pod.requests 无关
    ```
  - nodefs、imagefs 一般都位于主机的主文件系统上（俗称系统盘）。
    - nodefs ：用于存放 /var/lib/kubelet/ 目录。
    - imagefs ：用于存放 /var/lib/docker/ 目录，主要包括 docker images、container rootfs、container log 数据。
  - 修改了节点的系统盘大小之后，可以重启 kubelet ，让它更新 capacity 。
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

- 分析 kubelet 的源代码：
  - kubelet 启动时，先后启动 cAdvisor、containerManager、evictionManager 等模块。
  - 调用 evictionManager.Start() 函数即可启动 evictionManager 模块，它会运行一个主循环：
    ```golang
    for {
      if evictedPods := m.synchronize(diskInfoProvider, podFunc); evictedPods != nil {
        klog.InfoS("Eviction manager: pods evicted, waiting for pod to be cleaned up", "pods", klog.KObjSlice(evictedPods))
        m.waitForPodsCleanup(podCleanedUpFunc, evictedPods)   // 如果有 Pod 被驱逐，则等待该 Pod 被清理，最多等待 podCleanupTimeout=30s
      } else {
        time.Sleep(monitoringInterval)  // 间隔时间默认为 10s ，与 housekeeping-interval 相等
      }
    }
    ```
    - 每次循环的主要任务是执行 synchronize() ，判断是否要驱逐 Pod ，并返回 evictedPods 数组。流程如下：
      1. 检查当前节点的所有 Pod ，筛选出非 terminated 状态的 Pod ，记录在 activePods 数组中。
      2. 检查 activePods ，驱逐占用 ephemeral-storage 超过限制的所有 Pod 。如果有这样的 Pod 被驱逐，则停止执行 synchronize() 。
          - 如果 Pod 的 emptyDir 占用的磁盘空间超过 emptyDir.sizeLimit 限制，则驱逐该 Pod 。
          - 如果 Pod 中某个容器占用的磁盘空间超过 limits.ephemeral-storage 限制，则驱逐该 Pod 。
      3. 检查节点的监控指标，如果低于需要驱逐的阈值 thresholds ，则停止执行 synchronize() 。
      4. 将 activePods 按需要驱逐的优先级排序，然后从前到后逐个驱逐 Pod ，只要有一个 Pod 驱逐成功，则停止执行 synchronize() 。这样会尽量少地驱逐 Pod 。
    - cAdvisor 每隔 housekeeping-interval=10s 采集一次监控数据，因此 synchronize() 最迟会读取到 10s 前的监控数据，做出驱逐的决策时不一定准确。
      - kubelet 每隔 1 分钟监控一次 Pod 占用的磁盘空间，因此驱逐有一定延迟。
    - 如果有 Pod 被驱逐，则需要等待该 Pod 被清理，直到满足以下条件：
      - Pod 处于 terminated 状态
      - Pod 的所有容器已终止
      - Pod 的所有 volume 已清理

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
      rate = metrics 当前值 / metrics 期望值
      replicas 期望值 = ceil(replicas 当前值 * rate )   # ceil 即向上取整
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
