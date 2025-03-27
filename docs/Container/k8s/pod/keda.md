# keda

- [keda](https://keda.sh/docs) 是一个 k8s 插件，用于实现 Pod 自动伸缩。
- 2019 年由微软公司开源，2023 年成为 CNCF 基金会的毕业项目。

## 原理

- 设计理念：
  - k8s 原生的 HPA 是根据监控指标调整 replicas 。如果所有 Pod 的平均 cpu、memory 负载升高，则增加 replicas ，反之则减少 replicas 。
  - keda 是根据事件（event）调整 replicas 。默认将 replicas 设置为 minReplicaCount=0 。如果从 Prometheus、Kafka 等数据源收到 event ，代表业务负载出现，则自动增加 replicas 。等没有业务负载了，再减少 replicas 。

- keda 提供了两种伸缩器（scaler）：
  - ScaledObject ：用于自动伸缩 Deployment、StatefulSet 类型的 Pod 。
  - ScaledJob ：用于自动伸缩 Job 类型的 Pod 。

- keda scaler 划分了两种工作状态：
  - not-active
    - ：未激活，此时将 replicas 赋值为 0 。
    - 此时，keda scaler 会直接修改 replicas 。不能依靠 HPA ，因为 k8s 原生的 HPA 不支持将 replicas 缩减到 0 。
  - active
    - ：激活，此时将 replicas 赋值为正数。
    - 此时，keda scaler 会输入 External 类型的指标数据给 HPA ，通过 HPA 间接调整 replicas 。比如将 replicas 从一个正数，改为其它正数，该过程称为伸缩（scaling）。

- 创建 keda scaler 对象时，会自动创建一个下属的 HPA 对象，用于间接调整 replicas 。
  - 如果 scaleTargetRef 已经被其它 keda scaler 或 HPA 管理，则不允许创建新的 keda scaler 。

- keda scaler 连接 Prometheus、Kafka 等数据源时可能需要身份认证。为此，keda 定义了一种名为 TriggerAuthentication 的 CRD 对象，用于从 k8s Secret 对象中读取密钥，然后传给 keda scaler 。

## 部署

- 执行：
  ```sh
  kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.12.1/keda-2.12.1.yaml
  ```
  这会在 k8s 中新建一个 keda 命名空间，部署 keda 服务。

## ScaledObject

- 配置语法：
  ```yml
  apiVersion: keda.sh/v1alpha1
  kind: ScaledObject
  metadata:
    name: <string>
    # namespace: default
    annotations:
      # autoscaling.keda.sh/paused: ''            # 添加该名称的注释时，会暂停自动伸缩，并删除下属的 HPA 对象。删除该注释时，会继续自动伸缩
      # autoscaling.keda.sh/paused-replicas: '0'  # 将 replicas 修改到指定数量，然后暂停自动伸缩。如果同时添加 paused 和 paused-replicas 注释，则只有后者生效
  spec:
    # pollingInterval:  30      # 每隔 30s 从 triggers 获取一次数据，检查是否出现 event
    # fallback:
    #   failureThreshold: <int> # 备选方案：如果连续 failureThreshold 次，从 triggers 获取数据失败，则修改 replicas 的值
    #   replicas: <int>
    # maxReplicaCount:  100     # 自动伸缩时，replicas 的最大值。默认为 100
    # minReplicaCount:  0       # 自动伸缩时，replicas 的最小值。默认为 0
    # idleReplicaCount: 0       # 没有 event 时，replicas 的值。默认未配置 idleReplicaCount ，如果配置该参数，则只能取值为 0
    # cooldownPeriod:   300     # 如果配置了 idleReplicaCount 或 minReplicaCount 为 0 ，则连续 300s 未收到 event 时，才能将 replicas 改为 0
    advanced:
      # restoreToOriginalReplicaCount: false  # 删除 ScaledObject 时，是否将 scaleTarget 的 replicas 改为原始值
      # horizontalPodAutoscalerConfig:        # 自定义 ScaledObject 下属的 HPA 对象
      #   name: keda-hpa-{ScaledObject.name}
      #   behavior: ...
    scaleTargetRef:                           # 自动伸缩的目标对象，即某个 Deployment 或 StatefulSet
      # apiVersion: apps/v1
      # kind: Deployment
      name: <string>
    triggers:
      - type: <string>
        # name: <string>
        # kube-controller-manager 默认每隔 15s 执行一次 HPA ，从 ScaledObject 获取指标数据，而 ScaledObject 的指标数据又是从 triggers 获取
        # 默认 ScaledObject 不会缓存并使用 triggers 之前的数据，因此 ScaledObject 会比 pollingInterval 更频繁地从 triggers 获取数据
        # useCachedMetrics: false
        metadata: ...
  ```
  - 将 replicas 改为 0 之前，至少需要等待 cooldownPeriod 时长。
  - 将 replicas 改为非 0 值之前，至少需要等待 stabilizationWindowSeconds 时长。

- 可以配置多个 trigger ，此时取它们的最大值，用于给 replicas 赋值。也可以对多个 triggers 的值进行混合运算：
  ```yml
  advanced:
    scalingModifiers:
      formula: "(trigger1 + trigger2)/2"  # 支持多种算术运算，语法参考 https://expr-lang.org/docs/language-definition
      target: 1                           # 计算 formula 取值，除以期望值 target ，然后赋值给 replicas
      # activationTarget: 0               # 当 formula 取值超过该值时，才激活 keda scaler
  ```
  - formula 中可以根据名称，引用 trigger 的数值。但引用的是原始值，不会考虑 trigger 中的 Threshold 。

## triggers

keda 提供了多种方式来触发 Pod 自动伸缩，统称为 triggers 。

### cron

- 用途：在指定时间范围内增加 replicas ，而平时将 replicas 设置为最小值。
- 配置示例：
  ```yml
  apiVersion: keda.sh/v1alpha1
  kind: ScaledObject
  metadata:
    name: nginx
  spec:
    minReplicaCount: 0
    maxReplicaCount: 5
    cooldownPeriod: 0
    scaleTargetRef:
      kind: Deployment
      name: nginx
    triggers:
    - type: cron                # 定时伸缩
      metadata:
        desiredReplicas: "5"    # 在 [start, end) 时间范围内，将 replicas 赋值为 desiredReplicas 。而平时将 replicas 赋值为 minReplicaCount
        end: 15 * * * *         # 采用 Linux Cron 时间表达式
        start: 00 * * * *
        timezone: Asia/Shanghai # 时区
    # advanced:
    #   horizontalPodAutoscalerConfig:
    #     behavior:
    #       scaleDown:
    #         stabilizationWindowSeconds: 300   # 默认在 end 时刻之后，要等待 300s 才能减少 replicas 。将该参数改为 0 ，则允许立即减少 replicas
  ```

### kubernetes-workload

- 用途：查询 k8s 中某些 Pod 的数量 ，然后按比例赋值给 replicas 。
- 配置示例：
  ```yml
  triggers:
  - type: kubernetes-workload
    metadata:
      podSelector: k1=v1, k2 notin (v1,v2)  # 根据标签查询 Pod 的数量。只统计当前 k8s namespace 下的 Pod ，排除 Succeeded、Failed 阶段的 Pod
      value: '0.5'    # keda 会将查询到的 Pod 数量，除以该值，然后赋值给 replicas
  ```
  - 如果查询到的 Pod 数量为 0 ，则会将 replicas 赋值为 minReplicaCount 。

### kafka

- 用途：用 keda 控制 Kafka consumerGroup 的 Pod 数量。查询某个 consumerGroup 在某个 topic 的滞后量，然后按比例赋值给 replicas 。
- 配置示例：
  ```yml
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka:9092
      # version: 1.0.0
      consumerGroup: test_group_1
      topic: test_topic_1
      lagThreshold: '5.0'                   # 期望每个 Pod 的平均滞后量。keda 会将查询到的滞后量，除以该值，然后赋值给 replicas
      # activationLagThreshold: '0'         # 激活 keda scaler 的阈值。如果查询到的滞后量，小于等于该值，则将 replicas 赋值为 0
      # allowIdleConsumers: 'false'         # 是否允许 replicas 数量大于 topic 的分区数，从而存在空闲的 consumer 。默认为 false
      # partitionLimitation: ...            # 统计 topic 的哪几个分区的滞后量之和，默认为所有分区。可指定逗号分隔的多个分区编号，还可指定编号范围，例如为 1,2,5-6
      # scaleToZeroOnInvalidOffset: 'false' # 如果不能获取某个分区的 offset ，是否假定该分区的 lag 为 0 。默认配置了 false ，假定 lag 为 1
  ```
  - replicas 的最大值，既受 maxReplicaCount 限制，也受 allowIdleConsumers 限制。
  - 如果想让 replicas 自动缩减到 0 ，则需要考虑多个因素：
    - ScaledObject 的 minReplicaCount 或 idleReplicaCount 是否为 0 。
    - activationLagThreshold 的优先级比 lagThreshold 更高。假设 lagThreshold 为 5 ，activationLagThreshold 为 10 ，查询到的滞后量为 10 。则优先考虑 activationLagThreshold ，将 replicas 赋值为 0 。
    - HPA 等待 stabilizationWindowSeconds 时长才能减少 replicas 。
  - 如果指定的 topic 不存在，则 keda-operator 每次从 triggers 获取数据时，就会打印报错日志：
    ```sh
    error describing topics: kafka server: Request was for a topic or partition that does not exist on this broker
    ```
    此时 keda scaler 不会工作。

- 下面举例说明上述 ScaledObject 配置文件的运行效果：
  - 当 kafka_lag 为 12 时，因为 lagThreshold 为 5 ，所以 keda 会给 desiredReplicas 赋值为 `kafka_lag / lagThreshold = 12 / 5 = 2.4` ，向上取整为 3 。
  - 当 kafka_lag 为 0 时，keda 会给 desiredReplicas 赋值为 `0 / 5 = 0` 。
    - 当 kafka_lag 为 0 时，可能是因为 kafka 没有生产消息，此时将 replicas 赋值为 0 是合适的。
    - 当 kafka_lag 为 0 时，也可能是因为 kafka 每时每刻生产的消息都被消费了，此时将 replicas 赋值为 0 是不合适的，但毕竟 keda 掌握的情报有限，只能做出这样的决策。\
      此时消费者减少，kafka_lag 会增长，使得 keda 又自动增加 replicas 。如果经常这样，replicas 数量会频繁变化，导致频繁启动、停止 Pod ，增加了开销（比如 kafka rebalance 的耗时）。因此建议 HPA behavior ，避免 replicas 抖动。例如：
      ```yml
      advanced:
        horizontalPodAutoscalerConfig:
          behavior:
            scaleDown:
              stabilizationWindowSeconds: 300 # 统计最近 n 秒内 desiredReplicas 的最大值，作为 scaleDown 的依据
              policies:
              - type: Percent
                value: 50
                periodSeconds: 60             # 每次减少 replicas 时，限制在 60s 内最多减少 50% ，这样以保守策略减少 kafka 消费者
            scaleUp:
              stabilizationWindowSeconds: 0   # 允许立即增加 replicas ，这样尽量及时消费 kafka 消息
      ```
      假设监控 Kafka 消费速度，发现每个消费者 Pod 在 30s 内最多消费 100 条消息。则建议将 lagThreshold 赋值为 100 ，并将 scaleDown.periodSeconds 赋值为 30s 的两倍以上。

- keda 的源代码中，会调用 `getLagForPartition()` 函数，获取每个分区的 lag 。有几种结果：
  - 指定的 topic 不存在，导致不能从 kafka 获取该 topic 的信息。
    - 此时， 不会激活 keda scaler ，不会修改 replicas 。
  - 指定的 topic 存在， 但某个分区不能获取到有效的 lag 。
    - 如果配置了 `scaleToZeroOnInvalidOffset: 'false'` ，则假定该分区的 lag 为 1 。
      - 如果有 n 个分区是这样，则总 lag 增加 n 。
      - 总 lag 大于 0 时，除以 lagThreshold 之后，会使得 replicas 赋值为 1 。
    - 如果配置了 `scaleToZeroOnInvalidOffset: 'true'` ，则假定该分区的 lag 为 0 。
      - 此时，可能遇到一个死循环问题：
        ```yml
        新建一个 topic -> 尚未运行 consumer Pod -> 不存在 lag
        -> 假定 lag 为 0 -> 给 replicas 赋值为 0 -> 依然不运行 consumer Pod
        ```
    - 什么样的 lag 算无效？ lag 是计算每个分区的 `latestOffset - consumerOffset` 差值，如果不存在 offset ，或者 lag 小于 0 ，则认为 lag 无效。
    - 什么情况下会出现无效的 lag ？
      - 生产者尚未写入消息，因此尚未累计 latestOffset 。
      - consumerGroup 尚未消费，因此尚未累计 consumerOffset 。（可能某些分区存在 consumerOffset ，某些分区不存在）
      - consumerGroup 提交过 consumerOffset ，但持续 offsets.retention.minutes 时间停止运行，因此它在 __consumer_offsets 中记录的 consumerOffset 被自动删除。

### mysql

- 用途：连接到 MySQL 并执行查询语句，得到一个数值，然后按比例赋值给 replicas 。
- 配置示例：
  ```yml
  triggers:
  - type: mysql
    metadata:
      query: SELECT CEIL(COUNT(*)/6) FROM tasks WHERE state='running'
      queryValue: '5.0'             # keda 会将查询到的值，除以该值，然后赋值给 replicas
      # activationQueryValue: '0'   # 激活 keda scaler 的阈值。如果查询到的值，小于等于该值，则将 replicas 赋值为 0
    authenticationRef:
      name: trigger-auth-mysql
  ```
  再添加以下配置用于身份认证：
  ```yml
  apiVersion: v1
  kind: Secret
  metadata:
    name: mysql
    namespace: default
  type: Opaque
  data:
    connectionString: username:password@tcp(mysql:3306)/db_name
  ---
  apiVersion: keda.sh/v1alpha1
  kind: TriggerAuthentication
  metadata:
    name: trigger-auth-mysql
    namespace: default
  spec:
    secretTargetRef:
    - parameter: connectionString
      name: mysql
      key: connectionString
  ```

### prometheus

- 用途：连接到 Prometheus 并执行查询语句，得到一个数值，然后按比例赋值给 replicas 。
- 配置示例：
  ```yml
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      query: count(kube_pod_info{pod='nginx'})  # 查询语句应该返回一个 vector 或 scalar 类型的值
      threshold: '5.0'                          # keda 会将查询到的值，除以该值，然后赋值给 replicas
      # activationThreshold: '0'                # 激活 keda scaler 的阈值。如果查询到的值，小于等于该值，则将 replicas 赋值为 0
      # ignoreNullValues: 'true'                # 如果查询结果为空，则将 replicas 赋值为 0 。并且不让 keda-operator 打印报错
      # customHeaders: header1=xxx,header2=xxx
      authModes: basic
    authenticationRef:
      name: trigger-auth-prometheus
  ```
  再添加以下配置用于身份认证：
  ```yml
  apiVersion: v1
  kind: Secret
  metadata:
    name: prometheus
    namespace: default
  type: Opaque
  data:
    username: xxx
    password: xxx
  ---
  apiVersion: keda.sh/v1alpha1
  kind: TriggerAuthentication
  metadata:
    name: trigger-auth-prometheus
    namespace: default
  spec:
    secretTargetRef:
    - parameter: username
      name: prometheus
      key: username
    - parameter: password
      name: prometheus
      key: password
  ```
