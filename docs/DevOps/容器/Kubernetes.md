# Kubernetes

## Pod

- ConfigMap：保存一些键值对形式的配置信息，以明文保存。
  <https://blog.51cto.com/wzlinux/2331050>
  所有的配置内容都存储在etcd中
- Secrets：保存密码、私钥等私密的配置信息，以密文保存。

k8s中管理yaml配置文件的工具：
- helm
- Kustomize


## Controller

控制器，用于控制Pod。

### Deployment：

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

### ReplicaSet

- ReplicaSet：用于控制Pod的副本数。
  - 在旧版的k8s中名为Replication Controller。
  - 通常写在Deployment中。

### StatefulSet


