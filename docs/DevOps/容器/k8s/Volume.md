# Volume

：存储卷。
- 将 Volume 挂载到 Pod 中的某个目录之后，即使 Pod 被销毁，该目录下的文件依然会被持久化保存。
- 同一个 Pod 中的多个容器会共享 Volume ，可通过 Volume 共享文件。
- 给一个 Pod 挂载多个 Volume 时，它们的挂载目录不能重复。

Docker 中的 Volume 概念比较简单，只是挂载宿主机的目录到容器中。而 k8s 中的 Volume 概念比较复杂，分为很多种类型，比如：hostPath、nfs、PVC、secret 等。

## StorageClass

：存储类。
- 将不同的物理存储器抽象为存储类，相当于 PV 的模板。

## Persistent Volume（PV）

：持久存储卷。
- 一个存储类（Volume Class）上可以创建多个 PV 。

PV 的访问模式：
- ReadWriteOnce ：被单主机读写。如果多个 Pod 运行在同一主机，则可以同时读写。
- ReadOnlyMany ：被多主机只读
- ReadWriteMany ：被多主机读写
- ReadWriteOncePod ：在 ReadWriteOnce 的基础上，限制了只能被单个 Pod 读写。


<!-- PVC 可以配置多个 accessMode ，比如：
  accessModes:
  - ReadWriteOnce
  - ReadOnlyMany
可以将磁盘挂载到 ReadOnlyMany (AKA ROX) 中的多个 Pod，但一次只有一个 Pod 可以以 ReadWriteOnce 模式 (AKA RWO)使用该磁盘 -->

## PersistentVolumeClaim（PVC）

：持久存储卷声明，代表用户使用存储卷的请求。
- 当用户给 Pod 挂载 PVC 时，k8s 会寻找符合该 PVC 需求的 PV ，
  - 如果找到了，就把该 PV 与 PVC 一对一绑定，然后挂载到 Pod 上。
  - 如果没找到，则不能部署该 Pod 。

配置示例：
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc1
spec:
  accessModes:
    - ReadWriteMany   # 该 PVC 的访问模式
  resources:
    requests:
      storage: 10Gi   # 该 PVC 需要的存储空间
  storageClassName: local-volume  # 该 PVC 需要的存储类
```

例：在 Deployment 中挂载 PVC
```yaml
apiVersion: v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        volumeMounts:
            - name: volume1
              mountPath: /opt/volume    # 将 volume1 挂载到该目录
      volumes:
      - name: volume1    # 创建一个名为 volume1 的 Volume ，基于 pvc1
        persistentVolumeClaim:
          claimName: pvc1
```

## ConfigMap

：用于保存配置信息，采用键值对格式，以明文形式保存在 etcd 中。
- 可以在 Deployment 等控制器中引用 ConfigMap ，导入其中的参数作为环境变量，或 Volume 。

配置示例：
```yaml
apiVersion: v1
kind: ConfigMap 
metadata:
  name: redis-config
data:
  k1: hello
  k2: world
  redis.conf: |-
    bind 0.0.0.0
    port 6379
    daemonize yes
```
- data 部分可以包含多个键值对。用 `|-` 声明的是文件内容。
- 一个 ConfigMap 中可以保存多个配置文件。

例：引用 ConfigMap 中的参数，生成环境变量
```yaml
apiVersion: v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        command: ["echo", "$K1", "$K2"] # 使用环境变量
        env:
        - name: K1                      # 创建一个环境变量 K1 ，
          valueFrom:                    # 它的取值为，
            configMapKeyRef:
              name: redis-config        # 名为 redis-config 的 ConfigMap 中，
              key: k1                   # 参数 k1 的值
        - name: K2
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: k2
        envFrom:
        - configMapRef:
            name: redis-config          # 导入名为 redis-config 的 ConfigMap 中的所有参数，生成环境变量
```

例：引用 ConfigMap 中的参数，生成 Volume 并挂载
```yaml
apiVersion: v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        volumeMounts:
        - name: volume1
          mountPath: /opt/redis/volume1     # 将名为 volume1 的存储卷挂载到该目录
        - name: volume2
          mountPath: /opt/redis/volume2
      volumes:
        - name: volume1             # 创建一个名为 volume1 的 Volume
          configMap:
            name: redis-config      # 引用名为 redis-config 的 ConfigMap 中，
            items:
            - key: sentinel.conf    # 参数 sentinel.conf 的值
              path: sentinel.conf   # 将该参数的值保存到 mountPath/path 文件中
        - name: volume2             # 创建一个名为 volume2 的 Volume
          configMap:
            name: redis-config      # 导入名为 redis-config 的 ConfigMap 中的所有参数，生成 Volume
```

## Secret

：与 ConfigMap 类似，但用于保存密码等私密信息，转换成 Base64 编码再保存。

配置示例：
```yaml
apiVersion: v1
kind: Secret 
metadata:
  name: redis-secret
type: Opaque
data:
  username: bGVvCg==
  password: MTIzNDU2Cg==
```
- Opaque 类型的 secret 会将参数值经过 base64 编码之后再保存。

例：引用 secret 中的参数，生成环境变量、Volume
```yaml
apiVersion: v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        env:
        - name: username
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: username
        volumeMounts:
        - name: volume1
          mountPath: /opt/redis/secret
      volumes:
        - name: volume1
          secret:
            secretName: redis-secret
```
