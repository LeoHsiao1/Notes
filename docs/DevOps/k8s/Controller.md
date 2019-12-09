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
  - 如果Pod出现故障，或者Pod所在Node出现故障，ReplicaSet不会进行修复，而是直接创建新的Pod。

- 

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

