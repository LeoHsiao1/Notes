# Volume

：存储卷。
- 将Volume挂载到Pod中的某个目录之后，即使Pod被销毁，该目录下的文件依然会被持久化保存。
- 同一个Pod中的多个容器会共享Volume，可通过Volume共享文件。
- 给一个Pod挂载多个Volume时，它们的挂载目录不能重复。

Docker中的Volume概念比较简单，只是挂载宿主机的目录到容器中。而k8s中的Volume概念比较复杂，分为很多种类型，比如：hostPath、nfs、PVC、secret等。

## StorageClass

：存储类。
- 将不同的物理存储器抽象为存储类，相当于PV的模板。

## Persistent Volume（PV）

：持久存储卷。
- 一个存储类（Volume Class）上可以创建多个PV。

PV的访问模式：
- ReadWriteOnce：该卷可以被单主机读写
- ReadOnlyMany：该卷可以被多主机只读
- ReadWriteMany：该卷可以被多主机读写

## PersistentVolumeClaim（PVC）

：持久存储卷声明，代表用户使用存储卷的请求。
- 当用户给Pod挂载PVC时，k8s会寻找符合该PVC需求的PV，
  - 如果找到了，就把该PV与PVC一对一绑定，然后挂载到Pod上。
  - 如果没找到，则不能部署该Pod。

配置示例：
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
spec:
  accessModes:
    - ReadWriteMany   # 该PVC的访问模式
  resources:
    requests:
      storage: 10Gi   # 该PVC需要的存储空间
  storageClassName: local-volume  # 该PVC需要的存储类
```

例：在Deployment中挂载PVC
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        volumeMounts:
            - name: volume1
              mountPath: /opt/volume    # 将volume1挂载到该目录
      volumes:
      - name: volume1                   # 创建一个名为pvc1的PVC，再根据它创建名为volume1的Volume
        persistentVolumeClaim:
          claimName: pvc1
```

## ConfigMap

：用于保存配置信息，采用键值对格式，以明文形式保存在 etcd 中。
- 可以在Deployment等控制器中引用ConfigMap，导入其中的参数作为环境变量，或Volume。

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
- data部分可以包含多个键值对。用 `|-` 声明的是文件内容。
- 一个ConfigMap中可以保存多个配置文件。

例：引用ConfigMap中的参数，生成环境变量
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        command: ["echo", "$K1", "$K2"] # 使用环境变量
        env:
        - name: K1                      # 创建一个环境变量K1，
          valueFrom:                    # 它的取值为，
            configMapKeyRef:
              name: redis-config        # 名为redis-config的ConfigMap中，
              key: k1                   # 参数k1的值
        - name: K2
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: k2
        envFrom:
        - configMapRef:
            name: redis-config          # 导入名为redis-config的ConfigMap中的所有参数，生成环境变量
```

例：引用ConfigMap中的参数，生成Volume并挂载
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: redis
        image: redis:5.0.6
        volumeMounts:
        - name: volume1
          mountPath: /etc/redis/volume1     # 将名为volume1的存储卷挂载到该目录
        - name: volume2
          mountPath: /etc/redis/volume2
      volumes:
        - name: volume1             # 创建一个名为volume1的Volume
          configMap:
            name: redis-config      # 引用名为redis-config的ConfigMap中，
            items:
            - key: sentinel.conf    # 参数sentinel.conf的值
              path: sentinel.conf   # 将该参数的值保存到 mountPath/path 文件中
        - name: volume2             # 创建一个名为volume2的Volume
          configMap:
            name: redis-config      # 导入名为redis-config的ConfigMap中的所有参数，生成Volume
```

## Secret

：与ConfigMap类似，但用于保存密码等私密信息，以密文形式保存。

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
- Opaque类型的secret会将参数值经过base64编码之后再保存。

例：引用secret中的参数，生成环境变量、Volume
```yaml
apiVersion: apps/v1
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
          mountPath: /etc/redis/secret
      volumes:
        - name: volume1
          secret:
            secretName: redis-secret
```
