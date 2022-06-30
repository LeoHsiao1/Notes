# Volume

- 以卷（volume）方式将文件或目录挂载到容器中，即使容器被删除，volume 也会一直保留。
- Docker 中的 volume 比较简单，只是挂载宿主机的目录到容器中。而 k8s 中的 volume 分为多种类型。
- k8s Pod 需要先声明使用几个 volume ，然后才能挂载到 Pod 的容器中。
  - 同一个 Pod 声明的 volume 可以被所有容器同时挂载，因此容器之间可通过 volume 传递文件。

## hostPath

：用于将主机某个路径挂载到容器中。
- 例：
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - image: redis:5.0.6
      name: redis
      volumeMounts:
      - name: vol-time              # 挂载到容器的 volume 名称，必须与 Pod 声明的 spec.volumes 一致
        mountPath: /etc/localtime
        readOnly: true              # 限制容器只能读取 volume ，不能修改
      - name: vol-data
        mountPath: /data/redis
      - name: vol-data
        mountPath: /etc/redis.conf
        subPath: redis.conf         # 当 volume 为目录时，可选指定 subPath ，只挂载 volume 中的子路径
    volumes:                        # 声明该 Pod 使用的所有 volume
      - name: vol-time
        hostPath:
          path: /etc/localtime
          type: File
      - name: vol-data
        hostPath:
          path: /data/redis
          type: Directory
  ```
- 可选指定 type ，用于在挂载之前确保 hostPath 符合 type 类型。几种 type 取值：
  ```sh
  ""                  # 默认为空字符串，即不检查。如果 hostPath 不存在，则自动按该路径创建目录
  Directory           # hostPath 必须是一个已存在的目录，否则不能挂载
  DirectoryOrCreate   # 如果 hostPath 不存在，则自动按该路径创建目录，文件权限为 0755 ，文件所有权与 kubelet 相同
  File                # hostPath 必须是一个已存在的文件
  FileOrCreate        # 如果 hostPath 不存在，则自动按该路径创建文件，文件权限为 0644 ，文件所有权与 kubelet 相同
  Socket              # hostPath 必须是一个已存在的套接字文件
  BlockDevice         # hostPath 必须是一个已存在的块设备文件
  CharDevice          # hostPath 必须是一个已存在的字符设备文件
  ```
  - 如果 kubelet 容器化运行，而不是直接运行在主机上，则 hostPath 会使用 kubelet 容器 rootfs 中的路径，映射到主机的 `/var/lib/kubelet/pods/<pod_uid>/volume-subpaths/<volume_name>/<container_name>/0/` 路径之后再挂载到容器。
    - 此时要省略 subPath ，才能让 hostPath 使用主机路径。可能还要省略 type 。

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
可以将磁盘挂载到 ReadOnlyMany (AKA ROX) 中的多个 Pod ，但一次只有一个 Pod 可以以 ReadWriteOnce 模式 (AKA RWO)使用该磁盘

给 Pod 挂载云磁盘时，会自动将云磁盘挂载到 Pod 的宿主机，再挂载到容器里。
-->

## PersistentVolumeClaim（PVC）

：持久存储卷声明，代表用户使用存储卷的请求。
- 当用户给 Pod 挂载 PVC 时，k8s 会寻找符合该 PVC 需求的 PV ，
  - 如果找到了，就把该 PV 与 PVC 一对一绑定，然后挂载到 Pod 上。
  - 如果没找到，则不能部署该 Pod 。

配置示例：
```yml
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
```yml
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
      - name: volume1    # 创建一个名为 volume1 的卷，基于 pvc1
        persistentVolumeClaim:
          claimName: pvc1
```

## ConfigMap

：用于保存配置信息，采用键值对格式，以明文形式保存在 etcd 中。
- 可以在 Deployment 等控制器中引用 ConfigMap ，导入其中的参数作为环境变量，或 volume 。
- 修改 ConfigMap 时，不会导致挂载它的 Pod 自动重启。

- 配置示例：
  ```yml
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
  - data 部分可以包含多个键值对，比如保存多个变量、配置文件。
  - 用 `|-` 传入多行字符串作为 value 。

- 例：根据 ConfigMap 创建环境变量
  ```yml
  apiVersion: v1
  kind: Deployment
  spec:
    template:
      spec:
        containers:
        - name: redis
          image: redis:5.0.6
          command: ["echo", "$K1", "$(K2)"]
          env:
          - name: K1                      # 创建一个环境变量 K1 ，
            valueFrom:                    # 它的取值为，
              configMapKeyRef:
                name: redis-config        # 名为 redis-config 的 ConfigMap 中，
                key: k1                   # 参数 k1 的值
                # optional: false         # 是否可省略。默认为 false ，当 secret.key 不存在时，会拒绝创建 Pod 。如果为 true ，则当 secret.key 不存在时，不会创建该 env 变量
          - name: K2
            valueFrom:
              configMapKeyRef:
                name: redis-config
                key: k2
          envFrom:
          - configMapRef:
              name: redis-config          # 导入 ConfigMap 中的所有参数，生成环境变量
  ```

- 例：将 ConfigMap 作为 volume 并挂载
  ```yml
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
          - name: volume1             # 创建一个名为 volume1 的卷
            configMap:
              name: redis-config      # 引用的 ConfigMap 名称
              items:
              - key: sentinel.conf    # 引用 ConfigMap 中的哪个参数
                path: sentinel.conf   # 将该参数的值保存到 mountPath/path 文件中
          - name: volume2             # 创建一个名为 volume2 的卷
            configMap:
              name: redis-config      # 导入名为 redis-config 的 ConfigMap 中的所有参数，生成 volume
  ```

## Secret

：与 ConfigMap 类似，但用于保存密码等私密信息。
- 保存时会自动将参数值转换成 Base64 编码，挂载时会自动从 Base64 解码。
- 配置示例：
  ```yml
  apiVersion: v1
  kind: Secret
  metadata:
    name: redis-secret
  type: Opaque
  data:
    username: bGVvCg==
    password: MTIzNDU2Cg==
  ```
  调用 secret ：
  ```yml
  spec:
    containers:
    - name: redis
      env:
      - name: PASSWORD
        valueFrom:
          secretKeyRef:
            key: password
            name: redis
  ```
