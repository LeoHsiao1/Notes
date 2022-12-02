# Volume

- 删除容器时，其 top layer 也会被删除，因此容器启动之后修改的文件都会丢失。持久化保存容器内数据的方案之一，是给容器挂载 volume 。
- Docker 的 volume 比较简单，只是挂载宿主机的文件、目录到容器中。而 k8s 的 volume 分为 hostPath、ConfigMap 等多种类型，功能更多。
- 创建 k8s Pod 时，挂载 volume 的步骤：
  1. 在 spec.volumes 字段声明该 Pod 需要挂载的所有 volume ，让 k8s 做好准备。
      - 这些 volume 可以挂载到容器，也可以不挂载到容器。
      - 这些 volume 可以同时挂载到该 Pod 的多个容器，使得这些容器可通过 volume 相互传递文件。
  2. 在 spec.containers[].volumeMounts 字段声明容器的挂载配置，将某 name 的 volume ，挂载到容器内的 mountPath 路径。
      - 挂载到容器的所有 volume ，必须包含于 Pod spec.volumes 列表。

## hostPath

：用于将宿主机的一个路径挂载到 Pod 。
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
      - name: vol-time              # 挂载的 volume 名称，必须与 Pod 声明的 spec.volumes 一致
        mountPath: /etc/localtime   # 将 volume 挂载到容器内的该路径
        # readOnly: false           # 挂载 volume 时是否为只读模式。默认为 false
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
- hostPath.type 字段用于在挂载之前确保 hostPath 符合某种类型。几种 type 取值：
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
- 容器内进程以非 root 用户运行时，通常只能读取 hostPath ，没有修改权限。可以在宿主机上执行 `chown -R <uid>:<uid> $hostPath` ，调整文件权限。

## emptyDir

：用于将宿主机的一个空目录挂载到 Pod 。
- 每次给一个 Pod 挂载 emptyDir 时，会在宿主机上自动创建一个空目录，路径为 `/var/lib/kubelet/pods/<pod_uid>/volumes/kubernetes.io~empty-dir/<volume_name>` 。
  - emptyDir 目录的文件权限为 777 ，文件所有者为 root 用户。
  - 如果该 Pod 一直调度在当前 Node ，即使重启 Pod ，也会保留 emptyDir 并继续挂载。
  - 如果该 Pod 从当前 Node 移除，则自动删除 emptyDir 。
- emptyDir 适合保存一些重要性低的数据，在 Pod 重启时可以不保留，但保留了会更好。比如缓存。
- 例：
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: nginx
  spec:
    containers:
    - name: nginx
      image: nginx:1.20
      volumeMounts:
      - name: volume-cache
        mountPath: /cache
    volumes:
    - name: volume-cache
      emptyDir:
        sizeLimit: 100Mi    # 限制 emptyDir 存储的文件大小，超过则驱逐该 Pod 。即使 emptyDir 未达到 sizeLimit ，也可能达到 limits.ephemeral-storage 而驱逐 Pod
    - name: volume-tmpfs
      emptyDir:
        medium: Memory      # 在内存中创建 emptyDir ，挂载为 tmpfs 文件系统。此时 emptyDir 存储的文件不会占用磁盘，而是占用内存，受 sizeLimit、limits.memory 限制
        sizeLimit: 100Mi
  ```

## StorageClass

：存储类。
- 将不同的物理存储器抽象为存储类，相当于 PV 的模板。

### Persistent Volume（PV）

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

### PersistentVolumeClaim（PVC）

：持久存储卷声明，代表用户使用存储卷的请求。
- 当用户给 Pod 挂载 PVC 时，k8s 会寻找符合该 PVC 需求的 PV ，
  - 如果找到了，就把该 PV 与 PVC 一对一绑定，然后挂载到 Pod 。
  - 如果没找到，则不能部署该 Pod 。

- 例：一个 PVC
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
              mountPath: /opt/volume
      volumes:
      - name: volume1    # 创建一个名为 volume1 的卷，基于 pvc1
        persistentVolumeClaim:
          claimName: pvc1
```

## ConfigMap

：用于记录一些配置参数。
- 可以在 Deployment 等对象中引用 ConfigMap 中的配置参数，创建环境变量或 volume 。
- 例：一个 ConfigMap
  ```yml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: redis
  data:               # ConfigMap 的主体数据，可按键值对格式记录多个配置参数
    k1: hello         # 一个配置参数，名为 k1 ，值为 hello
    k2: world
    redis.conf: |-    # 用 `|-` 传入多行字符串作为 value ，适合挂载为配置文件
      bind 0.0.0.0
      port 6379
      daemonize yes
  ```
- 例：根据 ConfigMap 创建环境变量
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - name: redis
      image: redis:5.0.6
      command: ["echo", "$K1", "$(K2)"]
      env:
      - name: K1                # 创建一个环境变量 K1 ，
        valueFrom:              # 它的取值为，
          configMapKeyRef:
            name: redis         # 名为 redis 的 ConfigMap 中，
            key: k1             # 参数 k1 的值
            # optional: false   # 能否省略该环境变量。默认为 false ，当 secret.key 不存在时，会拒绝创建 Pod 。如果为 true ，则 secret.key 不存在时，不会创建该 env 变量
      - name: K2
        valueFrom:
          configMapKeyRef:
            name: redis
            key: k2
      envFrom:
      - configMapRef:
          name: redis           # 导入 ConfigMap 中的所有参数，生成环境变量
  ```
- 例：根据 ConfigMap 创建 volume 并挂载
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - name: redis
      image: redis:5.0.6
      volumeMounts:
      - name: volume1
        mountPath: /opt/redis/volume1     # 将名为 volume1 的存储卷挂载到该目录
        # readOnly: true        # 挂载 ConfigMap、Secret 的 volume 时，总是为只读模式
      - name: volume2
        mountPath: /opt/redis/volume2
    volumes:
      - name: volume1           # 创建一个名为 volume1 的卷
        configMap:
          name: redis           # 引用的 ConfigMap 名称
          items:
          - key: redis.conf     # 引用 ConfigMap 中的哪个参数
            path: redis.conf    # 将该参数的值保存为 path 文件，挂载到容器中的路径为 mountPath/path
      - name: volume2           # 创建一个名为 volume2 的卷
        configMap:
          name: redis           # 导入名为 redis 的 ConfigMap 中的所有参数，生成 volume
          # defaultMode: 420    # 文件权限，默认为 420 ，这是 YAML 中的十进制数，对应 Linux 的八进制权限 644
  ```
  - 挂载 ConfigMap 的 volume 时，会先将 configMap 的参数值保存为宿主机 `/var/lib/kubelet/pods/<pod_uid>/../` 目录下的文件，然后将该文件以只读模式挂载到容器中。
  - 如果将 ConfigMap、Secret 作为 volume 直接挂载（不指定 subpath ），则 volume 目录下的各个配置文件采用符号链接、只读模式。修改 ConfigMap、Secret 之后，会在一分钟之内更新 volume 目录下的符号链接，从而更新配置文件。
    - 其它情况下，修改 ConfigMap、Secret 之后，不会自动更新引用它的环境变量、volume ，除非重启 Pod 。

## Secret

：与 ConfigMap 类似，但用于保存密码等私密的配置参数。
- ConfigMap 对象以明文形式存储在 etcd 中。而 Secret 对象会将配置参数的值经过 Base64 编码之后存储到 etcd ，并且被 Deployment 等对象引用时会自动从 Base64 解码。
- 例：一个 Secret
  ```yml
  apiVersion: v1
  kind: Secret
  metadata:
    name: redis
  type: Opaque
  data:
    username: dGVzdA==
    password: MTIzNDU2Cg==
  ```
- 例：根据 Secret 创建环境变量
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
- 例：根据 Secret 创建 volume 并挂载
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: redis
  spec:
    containers:
    - name: redis
      image: redis:5.0.6
      volumeMounts:
      - name: vol-secret
        mountPath: /etc/redis.conf
        subPath: redis.conf
    volumes:
    - name: vol-secret
      secret:
        secretName: redis
  ```
