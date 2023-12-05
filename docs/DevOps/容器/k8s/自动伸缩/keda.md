# keda

- [keda](https://keda.sh/docs) 是一个 k8s 插件，用于实现 Pod 自动伸缩。
- 2019 年由微软公司开源，2023 年成为 CNCF 基金会的毕业项目。

## 原理

- 设计理念：
  - k8s 原生的 HPA 是根据监控指标调整 replicas 。如果所有 Pod 的平均 cpu、memory 负载升高，则增加 replicas ，反之则减少 replicas 。不能缩放到 minReplicas=0 。
  - keda 是根据事件调整 replicas 。默认将 replicas 设置为 minReplicaCount=0 。如果从 Prometheus、Kafka 等数据源收到 event ，代表业务负载出现（称为 active ），则增加 replicas 。等没有业务负载了，再减少 replicas 。

- keda 定义了几种 CRD 对象：
  - ScaledObject ：用于自动伸缩 Deployment、StatefulSet 类型的 Pod 。
  - ScaledJob ：用于自动伸缩 Job 类型的 Pod 。
  - TriggerAuthentication ：记录账号密码，用于连接到 Prometheus、Kafka 等数据源。

## 部署

- 执行：
  ```sh
  kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.12.1/keda-2.12.1.yaml
  ```
  这会在 k8s 中新建一个 keda 命名空间，部署 keda 服务。

## ScaledJob

- 创建 ScaledObject 对象之后，会自动创建下属的 HPA 对象。
  - ScaledObject 会输入指标数据给 HPA ，从而驱使 HPA 改变 replicas 。
  - 如果 scaleTargetRef 已被其它 ScaledObject 或 HPA 管理，则不允许创建新的 ScaledObject 。

- 配置语法：
  ```yml
  apiVersion: keda.sh/v1alpha1
  kind: ScaledObject
  metadata:
    name: <string>
    # namespace: default
    annotations:
      # autoscaling.keda.sh/paused: "true"        # 添加该注释时，会立即暂停自动伸缩。删除该注释时，会继续自动伸缩
      # autoscaling.keda.sh/paused-replicas: "0"  # 将 replicas 修改到指定数量，然后暂停自动伸缩。如果同时添加 paused 和 paused-replicas 注释，则只有后者生效
  spec:
    # pollingInterval:  30      # 每隔 30s 从 triggers 获取一次数据，检查是否出现 event
    # fallback:
    #   failureThreshold: <int> # 备选方案：如果连续多次从 triggers 获取数据失败，则将 replicas 改为指定值
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
      # scalingModifiers: ...                 # 支持对多个 triggers 的值进行混合运算，将结果作为自动伸缩的依据
    scaleTargetRef:                           # 自动伸缩的目标对象，即某个 Deployment 或 StatefulSet
      # apiVersion: apps/v1
      # kind: Deployment
      name: <string>
    triggers: ...
  ```

## triggers

keda 提供了多种方式来触发 Pod 自动伸缩，统称为 triggers 。

### cron

- 用于定时伸缩。配置示例：
  ```yml
  apiVersion: keda.sh/v1alpha1
  kind: ScaledObject
  metadata:
    name: test
  spec:
    minReplicaCount: 2
    maxReplicaCount: 5
    scaleTargetRef:
      kind: Deployment
      name: test
    triggers:
    - type: cron                # 定时伸缩
      metadata:
        desiredReplicas: "5"    # 平时将 replicas 默认赋值为 minReplicaCount 。在 [start, end) 时间范围内，将 replicas 赋值为 desiredReplicas
        end: 05 * * * *         # 采用 Linux Cron 时间表达式
        start: 00 * * * *
        timezone: Asia/Shanghai # 时区
    # advanced:
    #   horizontalPodAutoscalerConfig:
    #     behavior:
    #       scaleDown:
    #         stabilizationWindowSeconds: 300   # 默认在 end 时刻之后，要等待 300s 才能减少 replicas 。将该参数改为 0 ，则会立即减少 replicas
  ```
