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
        # subPathExpr: $(POD_NAME)  # 引用 spec.containers[].env 中的环境变量
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
- 如果 kubelet 容器化运行，而不是直接运行在宿主机上，则挂载 hostPath 时：
  - 如果省略 hostPath 的 subPath、type ，则会正常挂载宿主机的路径。
  - 如果不省略 subPath、type ，则不会挂载宿主机的路径，而是在 kubelet 容器的 rootfs 中创建 `$hostPath/$subPath` 路径，映射到宿主机的 `/var/lib/kubelet/pods/<pod_uid>/volume-subpaths/<volume_name>/<container_name>/0/` 路径，然后挂载到容器。
    - [相关 Issue](https://github.com/kubernetes/kubernetes/issues/61456)
    - 一种解决方案是，将宿主机的 /tmp、/data 等目录事先挂载到 kubelet 容器中，在这些目录下创建 hostPath、subPath 。
- 挂载 hostPath 时，如果容器内进程以非 root 用户运行，则只能读取 hostPath ，没有修改权限。可以在宿主机上执行 `chown -R <uid> $hostPath` ，调整文件权限。

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
      image: nginx:1.23
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

## downwardAPI

：用于将一些 k8s 字段的值保存为文件，作为 volume 挂载。
- 例：
  ```yml
  apiVersion: v1
  kind: Pod
  metadata:
    name: nginx
  spec:
    containers:
    - name: nginx
      image: nginx:1.23
      volumeMounts:
      - name: podinfo
        mountPath: /etc/podinfo
    volumes:
      - name: podinfo
        downwardAPI:
          items:
            - path: labels
              fieldRef:
                fieldPath: metadata.labels
            - path: annotations
              fieldRef:
                fieldPath: metadata.annotations
  ```
- Pod 内进程有时需要知道一些 k8s 信息，比如当前的 Pod labels、namespace 。此时可使用 downwardAPI ，不过使用环境变量更方便，详见 [env](./Pod.md#env) 。

## ConfigMap

：用于记录一些非私密的配置参数。
- 常见用途：创建一个 ConfigMap 对象，记录一些配置参数，然后在 Pod 中引用 ConfigMap ，创建环境变量或 volume 。
  - 如果需要挂载大型文件或很多文件到 Pod 中，则不适合用 ConfigMap 。可考虑用 hostPath、PV ，或者将这些文件打包成一个 Docker 镜像，以 Sidecar 方式运行。
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
- 不过 Secret 存储在 etcd 时默认没有加密，因此安全性与 ConfigMap 一样。需要在启动 apiserver 时启用加密功能。
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

：持久存储卷声明（Persistent Volume Claim），用于自动创建 volume ，供 Pod 挂载使用。
- 用法：
  1. 用户创建一个 PVC 对象，声明需要一个怎样的 PV 存储卷。
  2. 用户创建一个 Pod ，挂载上述的 PVC 。
  3. k8s 调度 Pod 时，会自动将当前 PVC 绑定的 PV 挂载到 Pod 内。
- 与挂载 HostPath 相比，PVC 的优点：
  - 能自动创建 volume 来挂载。
  - 能限制 volume 的磁盘使用量。
  - 可以隔离每个 Pod 的 volume ，互不干扰。此时 volume 更像一个独立的磁盘设备，使得 Pod 更像一个独立的主机。
- 每个 PVC 需要绑定一个 PV 。
  - 创建 PVC 时，用户可以主动指定一个未被使用的 PV ，绑定到该 PVC 。
  - 如果创建 PVC 时未指定 PV ，k8s 会自动寻找一个符合该 PVC 需求的 PV 。
    - 比如 PVC 需要 20Gi 的存储空间，则容量为 10Gi 的 PV 不符合要求。
    - 如果现有的 PV 都不符合需求，默认会自动从 StorageClass 创建 PV 。
    - 如果一直没有符合需求的 PV ，则该 PVC 一直不可用，导致试图挂载它的 Pod 不能启动，停留在 Pending 阶段。
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
    # volumeMode: Filesystem
    # volumeName: pvc-db613389-202f-430e-95d8-9ea4f6cfc6a8  # 该 PVC 绑定的 PV 名称，这里使用 PVC 的 uid
    # dataSource:                   # 新创建的 PVC、PV ，volume 目录下默认为空，可选通过 dataSource 拷贝其它来源的数据
    #   kind: PersistentVolumeClaim
    #   name: pvc-backup
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

- 通过 Deployment、StatefulSet 部署多个 Pod 副本时，这些 Pod 会尝试挂载同一个名称的 PVC 。如果 PVC 的 accessModes 不允许同时挂载，则 Pod 不能启动。不过 StatefulSet 支持通过模板自动创建 PVC ：
  ```yml
  apiVersion: v1
  kind: StatefulSet
  metadata:
    name: redis
  spec:
    ...
    template:
      ...
      spec:
        containers:
        - name: redis
          image: redis:5.0.6
          volumeMounts:
            - name: pvc
              mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: pvc   # 会根据模板为每个 Pod 创建一个 PVC ，命名格式为 <template_name>-<pod_name> ，比如 pvc-redis-1、pvc-redis-2
    spec:
      accessModes:
        - ReadWriteOnce
      storageClassName: test-csi
      resources:
        requests:
          storage: 10Gi
  ```

### PV

：持久存储卷（Persistent Volume），一种通过 PVC 挂载的 volume 。
- 例：
  ```yml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv1
  spec:
    capacity:
      storage: 10Gi
    volumeMode: Filesystem
    accessModes:
      - ReadWriteOnce
    persistentVolumeReclaimPolicy: Delete
    # hostPath:         # hostPath 类型的 PV ，可挂载宿主机上的文件、目录
    #   path: /tmp
    local:              # local 类型的 PV ，可挂载宿主机上的磁盘设备、分区
      path: /dev/vdc
    nodeAffinity:       # 限制 local PV 只挂载某个主机的 path 。k8s 会限制使用该 PV 的 Pod 也只能调度到该 node
      required:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname
            operator: In
            values:
            - node-1
  ```
  - k8s 原生可创建 hostPath、local 两种 PV ，用于挂载宿主机上的 path ，但不能在主机间迁移数据，因此实用性低。更常见的用法是从 StorageClass 创建可迁移的 PV 。
  - PV、StorageClass 都是不受 namespace 管理的 k8s 对象，在整个集群的命名唯一。而 PVC 受 namespace 管理。

- PV 对象的生命周期分为多个阶段：
  ```sh
  Available     # 该 PV 尚未绑定到 PVC
  Bound         # 该 PV 已经绑定到某个 PVC
  Released      # 该 PV 绑定的 PVC 已被删除，但 PV 资源尚未被回收
  Failed        # 该 PV 的自动回收（reclamation）失败
  ```
- PV 有多种访问模式（accessModes）：
  - ReadWriteOnce（RWO）：被单主机读写。
    - 该模式下，如果多个 Pod 运行在同一主机，则允许同时挂载、读写同一个 PV 。
    - 该模式下，以 RollingUpdate 方式重启 Pod 时可能冲突，比如 node1 上的旧 Pod 尚未停止，而 node2 上的新 Pod 也请求挂载同一个 PV 。此时可改用 Recreate 策略。
    - 一个 PV 可以同时被多个 Pod 挂载，只要 accessModes 允许。
    - 一个 PV 可能支持多种 accessMode ，但挂载时只能选用一种 accessMode 。
  - ReadOnlyMany（ROX）：被多主机只读。
  - ReadWriteMany（RWX）：被多主机读写。
  - ReadWriteOncePod（RWOP）：在 ReadWriteOnce 的基础上，限制了只能被单个 Pod 读写。
- PV 作为 volume 挂载时，有多种模式（volumeMode）：
  - Filesystem ：默认模式，表示在挂载 volume 之前，会自动创建文件系统。
  - Block ：表示挂载的 volume 是块设备，没有文件系统。

### StorageClass

：存储类。用于将不同的存储介质抽象为存储类，作为创建 PV 的模板。
- 在 k8s 中使用 StorageClass 时，通常需要安装第三方的存储插件，或者购买公有云平台的存储服务。例如：
  - csi ：通过 k8s 容器存储接口提供 StorageClass ，兼容性好。
  - nfs ：基于 NFS 服务器提供 StorageClass 。
  - cephfs ：基于 Ceph 服务器提供 StorageClass 。
- 例：一个 StorageClass
  ```yml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: cbs-csi
  allowVolumeExpansion: true              # 是否支持对已创建的 PV 进行扩容
  parameters:                             # 一些配置参数，会传递给 provisioner
    ...
  provisioner: kubernetes.io/aws-ebs      # 提供该 StorageClass 的插件名
  reclaimPolicy: Delete
  volumeBindingMode: WaitForFirstConsumer # 插件 PV 之后什么时候挂载。默认为 Immediate ，表示立即挂载，此时可能尚未确定 Pod 被调度到哪个主机
  ```
  - 假设一个 StorageClass 的容量为 100G ，则可以创建多个 PV ，只要它们的总容量不超过 100G 。
  - 有的 StorageClass 支持创建卷快照（VolumeSnapshots），备份 volume 某个时刻的数据。
- 删除 PV 时需要回收相关资源，有多种策略（reclaimPolicy）：
  - Delete ：默认策略，表示直接删除 PV 等资源，释放存储空间。
  - Retain ：保留资源，等待用户手动回收。
  - Recycle ：对 volume 执行 rm -rf * ，然后便可复用 volume ，而不是重新创建。该策略已弃用。
- 例如腾讯云 k8s 提供了基于云硬盘的 csi 类型的 StorageClass ，挂载 PVC 的原理如下：
  1. 创建 PVC 时，自动从 StorageClass 创建一个 PV ，相当于一个云硬盘。
  2. 当 Pod 调度到某个主机时，将 PV 存储设备接入该主机，挂载到宿主机的某个目录。例如：
      ```sh
      [root@CentOS]# df -hT | grep pvc
      /dev/vde       ext4       99G   84G   16G  85% /var/lib/kubelet/plugins/kubernetes.io/csi/pv/pvc-0ad73317-6f8d-419c-a93c-ce9badf7e3fe/globalmount
      /dev/vdf       ext4      9.8G  424M  9.4G   5% /var/lib/kubelet/plugins/kubernetes.io/csi/pv/pvc-db613389-202f-430e-95d8-9ea4f6cfc6a8/globalmount
      ```
      然后将宿主机的 PV 目录挂载到 Pod 容器里，作为 volume 。
