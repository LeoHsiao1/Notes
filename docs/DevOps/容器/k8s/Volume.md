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

## ConfigMap

：用于记录一些非私密的配置参数。
- 常见用例：创建一个 ConfigMap 对象，记录一些配置参数，然后在 Pod 中引用 ConfigMap ，创建环境变量或 volume 。
- 例：一个 ConfigMap
  ```yml
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: redis
  data:
    k1: hello         # 一个配置参数，名为 k1 ，值为 hello
    k2: world
    redis.conf: |-    # 可以用 |- 传入多行字符串作为 value ，适合挂载为配置文件
      bind 0.0.0.0
      port 6379
      daemonize yes
  # binaryData:
  #   k1: ...
  # immutable: false  # 可选将 ConfigMap、Secret 声明为不可变类型，此时只能删除该对象，不能修改。
  ```
  - ConfigMap 没有 spec 字段，主要配置是 data 和 binaryData 字段至少存在一个，其下可以按键值对格式记录多个配置参数。
    - 每个配置参数的 key 必须是有效的 DNS 子域名。
    - data 类型的配置参数，其 value 是 utf-8 编码的字符串。
    - binaryData 类型的配置参数，其 value 是 base64 编码的字符串。引用该 value 时，会自动进行 base64 解码。因此该 value 可用于保存二进制值。
  - etcd 默认限制了每个客户端请求的最大体积为 1.5MB ，而 k8s 限制了每个 ConfigMap、Secret 对象的最大体积为 1MB （不会进行压缩），超过则不允许创建。

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
  - 如果将 ConfigMap、Secret 作为 volume 直接挂载（不指定 subpath ），则 volume 目录下的各个配置文件采用符号链接、只读模式。修改 ConfigMap、Secret 之后，大概会在一分钟内更新 volume 目录下的符号链接，从而更新配置文件。
    - 其它情况下，修改 ConfigMap、Secret 之后，不会自动更新引用它的环境变量、volume ，除非重启 Pod 。

## Secret

：与 ConfigMap 类似，但用于记录密码等私密的配置参数。
- Secret 存储在 etcd 时跟 ConfigMap 一样没有加密，因此有权访问 etcd 的所有用户都可以查看 Secret 。
  - 可以加密 etcd 里的数据，或者通过 RBAC 限制有权读取 Secret 的用户。
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
  - Secret 的 data 类型的配置参数，相当于 ConfigMap 的 binaryData 。
  - Secret 有多种 type ：
    ```sh
    Opaque                              # 默认的 Secret 类型，用于记录任意用途的密钥
    kubernetes.io/tls                   # 用于记录 tls 密钥文件
    kubernetes.io/ssh-auth
    kubernetes.io/basic-auth
    kubernetes.io/dockerconfigjson      # 用于记录 ~/.docker/config.json 文件的值，该 Secret 可用作 Pod 的 imagePullSecrets
    kubernetes.io/service-account-token
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
    volumes:
    - name: vol-secret
      secret:
        secretName: redis
        items:
        - key: redis.conf
          path: redis.conf
  ```

## PVC

：持久存储卷声明（PersistentVolumeClaim），用于自动创建 volume ，供 Pod 挂载使用。
- 用法：
  1. 用户创建一个 PVC 对象，声明需要一个怎样的 PV 存储卷。
  2. 用户创建一个 Pod ，挂载上述的 PVC 。
  3. k8s 调度 Pod 时，会自动将当前 PVC 绑定的 PV 挂载到 Pod 内。
- 与挂载 HostPath 相比，PVC 的优点：
  - 能自动创建 volume 来挂载。
  - 能限制 volume 的磁盘使用量。
  - 可以保证每个 Pod 的 volume 是隔离的，互不干扰。
- 每个 PVC 需要绑定一个 PV 。
  - 创建 PVC 时，用户可以主动指定一个未被使用的 PV ，绑定到该 PVC 。
  - 如果创建 PVC 时未指定 PV ，k8s 会自动寻找一个符合该 PVC 需求的 PV 。
    - 比如 PVC 需要 20Gi 的存储空间，则容量为 10Gi 的 PV 不符合要求。
    - 如果现有的 PV 都不符合需求，默认会自动从 StorageClass 创建 PV 。
    - 如果一直没有符合需求的 PV ，则该 PVC 一直不可用，导致挂载它的 Pod 不能启动，停留在 Pending 阶段。
  - PVC 与 PV 一对一绑定，因此即使 Pod 重启、调度到其它主机，也会挂载之前的 PV ，从而持久保存数据。
- PVC 是一种受 namespace 管理的 k8s 对象，不是 Pod 的子对象。因此删除 Pod 时，不会自动删除它挂载的 PVC 。
  - 删除 PVC 时，默认会自动删除下级的 PV 对象。

- 例：创建一个 PVC 对象
  ```yml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc1
    finalizers:
    - kubernetes.io/pvc-protection  # 如果用户请求删除 PVC ，则会等该 PVC 不再被任何 Pod 使用时才删除
  spec:
    accessModes:
      - ReadWriteOnce               # 访问模式
    resources:
      requests:
        storage: 10Gi               # 该 PVC 需求的存储空间，容量低于该值的 PV 都不符合需求
        # 目前 PVC 只支持声明对容量的需求，计划以后增加 IOPS 等需求
    storageClassName: test-csi      # 采用的存储类。不源自该存储类的 PV 都不符合需求
    volumeMode: Filesystem
    volumeName: pvc-db613389-202f-430e-95d8-9ea4f6cfc6a8  # 该 PVC 绑定的 PV 名称，这里使用 PVC 的 uid
  ```
  然后给 Pod 挂载 PVC ：
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
          mountPath: /data
    volumes:
    - name: volume1
      persistentVolumeClaim:
        claimName: pvc1
  ```

### PV

：持久存储卷（Persistent Volume），是从 StorageClass 创建而来的 volume 。
- PV 对象的生命周期分为以下几个阶段：
  ```sh
  Available     # 该 PV 尚未绑定到 PVC
  Bound         # 该 PV 已经绑定到某个 PVC
  Released      # 该 PV 绑定的 PVC 已被删除，但 PV 资源尚未被回收
  Failed        # 该 PV 的回收（reclamation）失败
  ```
- PV 有多种访问模式（accessModes）：
  - ReadWriteOnce（RWO）：被单主机读写。
    - 该模式下，如果多个 Pod 运行在同一主机，则允许同时读写同一个 PV 。
    - 该模式下，以 RollingUpdate 方式重启 Pod 时可能冲突，比如 node1 上的旧 Pod 尚未停止，而 node2 上的新 Pod 也请求挂载同一个 PV 。此时可改用 Recreate 策略。
    - 一个 PVC 可以同时被多个 Pod 挂载，即一个 PV 可以同时被多个 Pod 访问，只要 accessModes 允许。
    - 目前一个 PV 只允许同时配置一种 accessMode 。
  - ReadOnlyMany（ROX）：被多主机只读。
  - ReadWriteMany（RWX）：被多主机读写。
  - ReadWriteOncePod（RWOP）：在 ReadWriteOnce 的基础上，限制了只能被单个 Pod 读写。
- PV 作为 volume 挂载时，有多种模式（volumeMode）：
  - Filesystem ：默认模式，表示在挂载 volume 之前，会自动创建文件系统。
  - Block ：表示挂载的 volume 是块设备，没有文件系统。

### StorageClass

：存储类。用于将不同的存储介质抽象为存储类，作为创建 PV 的模板。
- 在 k8s 中使用 StorageClass 资源时，通常需要安装第三方的存储插件，或者购买公有云平台的存储服务。例如：
  - hostPath ：k8s 原生支持的一种 PV ，但不能在主机间迁移数据。
  - local ：k8s 原生支持的一种 PV ，可挂载主机上已挂载的磁盘、分区等存储设备。这种 PV 只能手动创建，不能通过 PVC 自动创建。
  - csi ：通过 k8s 容器存储接口提供存储卷，兼容性好。
  - nfs ：基于 NFS 服务器提供存储卷。
  - cephfs ：基于 Ceph 服务器提供存储卷。
- StorageClass 的配置文件示例：
  ```yml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: cbs-csi
  allowVolumeExpansion: true            # 是否支持对已创建的 PV 进行扩容
  parameters:                           # 一些配置参数，取决于提供 StorageClass 的软件
    ...
  provisioner: com.tencent.cloud.csi.cbs
  reclaimPolicy: Delete
  volumeBindingMode: WaitForFirstConsumer
  ```
  - StorageClass、PV 都是不受 namespace 管理的 k8s 对象，在整个集群的命名唯一。而 PVC 受 namespace 管理。
  - 假设一个 StorageClass 的容量为 100G ，则可以创建多个 PV ，只要它们的总容量不超过 100G 。
  - 删除 PV 时需要回收资源，有多种策略（reclaimPolicy）：
    - Delete ：默认策略，表示直接删除 PV 等资源，释放存储空间。
    - Recycle ：对 volume 执行 rm -rf * ，然后供以后复用。
    - Retain ：手动回收。
- 例如腾讯云 k8s 提供了基于云硬盘的 csi 类型的 StorageClass ，挂载 PVC 的原理如下：
  1. 创建 PVC 时，自动从 StorageClass 创建一个 PV ，相当于一个云硬盘。
  2. 当 Pod 调度到某个主机时，将 PV 存储设备接入该主机，挂载到宿主机的某个目录。例如：
      ```sh
      [root@CentOS]# df -hT | grep pvc
      /dev/vde       ext4       99G   84G   16G  85% /var/lib/kubelet/plugins/kubernetes.io/csi/pv/pvc-0ad73317-6f8d-419c-a93c-ce9badf7e3fe/globalmount
      /dev/vdf       ext4      9.8G  424M  9.4G   5% /var/lib/kubelet/plugins/kubernetes.io/csi/pv/pvc-db613389-202f-430e-95d8-9ea4f6cfc6a8/globalmount
      ```
      然后将宿主机的 PV 目录挂载到 Pod 容器里，作为 volume 。
