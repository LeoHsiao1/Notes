# Longhorn

- ：一个分布式块存储系统，用作 k8s 的 CSI 存储插件。
- 2017 年，由 Rancher Labs 公司发布。

## 原理

### 架构

- 部署 Longhorn 时，包含多个组件：
  - Longhorn Manager
    - ：Longhorn 的主控制器，以 DaemonSet 方式部署在每个 k8s node 上。
    - 如果一个 k8s node 未部署 Longhorn Manager ，则该主机上的 Pod 不能使用 Longhorn Volume 。
  - Longhorn CSI Plugin
    - ：管理 Longhorn Volume 。
  - Longhorn UI
    - ：提供 Web 页面，供用户操作。
  - Longhorn API
    - ：提供 API 接口。
    - 比如 Longhorn UI、Longhorn CSI Plugin 会调用 Longhorn API ，从而间接访问 Longhorn Manager 。
  - Longhorn Engine
    - ：负责对 volume 的底层控制，比如创建副本、快照、备份。

- 工作流程：
  1. 用户创建一个 PVC ，未绑定 PV 。并且 PVC 中配置了 `storageClassName: longhorn-static` ，表示需要从 Longhorn 创建存储卷。
  2. k8s 自动从 `storageClassName: longhorn-static` 创建一个 `volumes.longhorn.io` 对象，并映射到一个 PV 对象。然后将该 PV 绑定到 PVC ，供用户使用。
      - `volumes.longhorn.io` 是 Longhorn 定义的一种 CRD 资源，代表一个 Longhorn Volume 。
  3. Longhorn Manager 监听 k8s apiserver 。如果发现 k8s 创建了一个 `volumes.longhorn.io` 资源，则通过 CSI 接口调用 Longhorn CSI Plugin ，创建一个 volume 并存储到 k8s node 的磁盘中。
      - 当 PV 刚创建、尚未挂载时，Longhorn 不会在磁盘中存储 volume 数据。
      - 当 PV 被 Pod 挂载时（不管是否写入数据），Longhorn 才会在 k8s node 上创建 `/var/lib/longhorn/replicas/xxx` 目录，用于存储 volume 的副本数据。
      - 创建 volume 需要十秒左右，因此 Pod 第一次启动较慢。
  4. 在 Pod 所在的 k8s node 上，Longhorn 通过 iSCSI 协议连接某个 k8s node 上的 volume 副本，将 volume 作为一个 disk 块设备挂载到 Pod 所在的 k8s node 。
      - Pod 与 volume 副本可以位于不同 k8s node ，因为 iSCSI 协议支持跨主机读写磁盘。
      - 执行命令 `fdisk -l`，可以看到宿主机上多了个 disk 块设备。
      - 如果删除 Pod ，则会立即在宿主机上删除这个 disk 块设备。
  5. Longhorn 给 volume 创建文件系统，然后将 volume 挂载到 Pod 中。
      - 执行命令 `df -hT | grep /dev/longhorn`，可以看到宿主机上有个名为 `/dev/longhorn/${volume_name}` 的文件系统，挂载到了宿主机目录 `/var/lib/kubelet/plugins/kubernetes.io/csi/pv/${pv_name}/globalmount` 。

- Longhorn 在每个 k8s node 上的数据目录默认为 `/var/lib/longhorn/` ，目录结构如下：
  ```sh
  /var/lib/longhorn/
  ├── engine-binaries/            # 存储 Longhorn Engine 的二进制文件
  ├── longhorn-disk.cfg
  ├── replicas/                   # 存储各个 volume 副本数据
  │   └── test1-8fa949bf/         # 一个名为 test1 的 volume
  │       ├── revision.counter
  │       ├── volume-head-000.img # volume 副本数据存储为一个稀疏文件，文件体积等于 volume 容量
  │       ├── volume-head-000.img.meta
  │       └── volume.meta
  └── unix-domain-socket
  ```

### Longhorn Engine

- Longhorn Engine 默认会为每个 volume 至少存储 3 份副本数据（replicas），从而实现高可用。
  - 一个 volume 的多个副本是地位相等的，不存在主从之分。
    - 用户往一个 volume 写入数据时，数据会并行写入所有副本。
    - Longhorn 不会保证这些副本之间的数据一致性。
  - 每个副本，必须存储在不同 k8s node 的的磁盘上，避免同时故障。
  - Longhorn 默认会为每个 volume 维持至少 3 个健康的副本。
    - 如果当前健康的副本数量低于阈值，则会自动添加新的副本，除非 k8s node 数量不足。

- 关于 volume 的稀疏文件：
  - 假设用户创建一个 20GB 容量的 volume ，但仅写入 1GB 数据。则：
    - 在宿主机上执行命令 `cd /var/lib/longhorn/replicas/xxx; ls-lh` ，会发现该 volume 存储了一个体积等于 20GB 的稀疏文件。
    - 在宿主机上执行命令 `du -sh *` ，会发现稀疏文件实际占用的磁盘空间为 1GB 。
  - 假设用户创建一个 volume ，写入 10GB 数据，然后删除 9GB 数据，则：
    - 在宿主机上执行命令 `du -sh *` ，会发现稀疏文件实际占用的磁盘空间为 10GB 。因为 volume 最初创建时属于 disk 块设备，不是文件系统，因此不知道 volume 中哪些磁盘空间可以释放。
    - 在 Pod 中执行命令 `df -hT | grep /dev/longhorn/` ，会发现挂载的 volume 已用的磁盘空间为 1GB 。因为 volume 挂载到 Pod 之前会创建文件系统。
    - 用户可在 Longhorn 网页上执行 `trim filesystem` 操作，释放 volume 中已删除文件占用的磁盘空间。

- Longhorn Engine 会定期为 volume 创建快照（snapshot），实现增量备份。
  - 快照在 k8s 中表示为 `Snapshot.longhorn.io/v1beta2` 对象。
  - 将 volume 的每 4 KB 磁盘空间划分为一个 block 。
    - 定期为 volume 创建一个快照，记录最近发生变化的 block 的最新内容，然后将快照拷贝到各个副本。
    - volume 负责存储实时数据。而每个副本负责存储快照，可能滞后于实时数据。
  - 用户写入数据到 volume 时，操作系统不一定会立即将内存中的数据 flush 到磁盘。如果此时 volume 故障，则会丢失实时数据。
    - 为了解决该问题，Longhorn 会在创建每个快照之前，自动执行 sync 命令。
  - 每个副本存储一连串快照，最新的一个快照位于顶部，最旧的一个快照位于底部。称为快照链。
    - 每个快照包含一些 block 在历史时刻的数据。
    - 读取某个 block 的数据时，先尝试到最新一个快照中读取，如果找不到，则到之前一个快照中读取，这样遍历各个快照。
    - 所有快照都不支持修改，只能读取、删除。
    - 如果删除一个快照，则会将它包含的 block ，与相邻、时间较新的一个快照合并。最新的一个快照不支持删除，因为不存在较新的快照来合并。
  - 将所有快照的 block 合并在一起，就能得到整个 volume 的数据，像 docker image 的多层 layer 。
    - 如果有多个快照包含同一位置 block 的数据，则只采纳时间最新的那个快照，因为其中的 block 是最新版本。
    - 可以只合并指定时刻以前的快照，从而将整个 volume 的数据回滚到指定历史时刻。
  - 快照链较长时，每读取一个 block 都需要线性遍历快照，效率低。为了缩短耗时，Longhorn 建立了索引：对于每个 block ，用 1 Byte 体积的索引，记录它的最新版本位于哪个快照。
    - 例如记录 block A 的最新版本位于最新一个快照，block B 的最新版本位于距今第 2 个快照。
    - 例如 volume 容量为 1GB 时，需要分配 256 KB 内存来存储索引。
    - 索引只有 1 Byte 的寻址范围，因此每个副本最多存储 254 个快照。

- Longhorn 支持为 volume 定期创建备份（backup），存储到 NFS、S3 等外部存储系统。
  - 备份与快照的原理不同：
    - 备份时会将每个 block 压缩存储。
    - 每个 volume 创建的第一个备份包含全量数据，之后创建的每个备份只包含增量数据：将 volume 的每 2 MB 磁盘空间划分为一个 block ，记录哪些 block 的数据变化了。

## 部署

- [部署文档](https://longhorn.io/docs/1.8.2/deploy/install/)
  - 部署 Longhorn 之前，需要在 k8s node 上安装依赖：
    ```yml
    # 安装并启动 iscsi 服务器
    apt install -y open-iscsi
    systemctl enable iscsid
    systemctl start iscsid

    # 安装 nfs v4 客户端，而 nfs 服务器是 Longhorn 内置运行
    apt install -y nfs-common
    ```
  - 默认会在 k8s 中创建一个 longhorn-system 命名空间，用于部署 Longhorn 的所有组件。
  - 启动之后，用户需要修改 longhorn-frontend 这个 k8s Service ，通过它访问 Longhorn UI 的 Web 页面，没有密码认证。

## 用法

- 例：让 Pod 挂载 Longhorn 提供的 PVC
  ```yml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: test-pvc
  spec:
    accessModes:
      - ReadWriteOnce
    storageClassName: longhorn
    resources:
      requests:
        storage: 2Gi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: test
    namespace: default
  spec:
    restartPolicy: Always
    containers:
    - name: test
      image: alpine/curl
      imagePullPolicy: IfNotPresent
      volumeMounts:
      - name: vol
        mountPath: /data
    volumes:
    - name: vol
      persistentVolumeClaim:
        claimName: test-pvc
  ```

- 部署 Longhorn 时会创建一个 StorageClass ，用户也可以自定义一个：
  ```yml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: longhorn
  parameters:
    backupTargetName: default
    dataEngine: v1
    dataLocality: disabled
      # 可选取值：
      # disabled      # 不在乎 Pod 与 volume 副本是否位于同一个 k8s node 。这是默认值
      # best-effort   # 尽量在 Pod 所在 k8s node 上存储一个 volume 副本。如果做不到（比如磁盘空间不足），则只能放到不同 k8s node 上
      # strict-local  # 必须在 Pod 所在 k8s node 上存储一个 volume 副本，此时 Pod 读写 volume 的 IOPS 更高、延迟更低，不过性能提升一般不足 10%
    disableRevisionCounter: 'true'
      # 是否禁用副本的 revision.counter
      # 启用时，会在每个副本的磁盘目录中，存储一个 revision.counter 文件，用于记录当前副本的版本号
      # 每次写入副本时，自动将版本号递增 1 。这样就可以知道，一个 volume 的多个副本中，哪个副本存储了最新的数据
      # 但启用 revision.counter 时，并不能保证多个副本的数据一致性，还增加了每次写入的耗时
      # 因此，建议禁用 revision.counter ，此时会检查各个副本的磁盘文件的修改时间，判断哪个副本存储了最新的数据
    fromBackup: ''
      # 可以从 nfs、s3 等外部存储系统，读取备份数据，然后创建 volume
      # 例如 fromBackup: 's3://backupbucket@us-east-1?volume=minio-vol1&backup=backup-eeb2782d5b2f42bb'
    fsType: ext4
      # 在 volume 块设备中创建文件系统，然后才挂载到 Pod 中。有多种取值： ext4、xfs
    numberOfReplicas: '3'
      # 每个 volume 存储几个副本
    staleReplicaTimeout: '30'
      # 如果一个副本，连续几分钟处于 unhealthy 状态，则认为它没有用，删除它
    replicaAutoBalance: ignored
      # 是否自动迁移 volume 副本，使得每个 k8s node 上存储的 volume 副本数量均衡（不考虑 volume 体积）
      # 默认取值为 ignored ，表示继承全局配置参数
      # 取值为 disabled ，则禁用该功能
      # 取值为 least-effort ，则进行小幅的均衡。使得各个 node 存储的副本数量差距，不超过一倍
      # 取值为 best-effort ，则进行准确的均衡。使得各个 node 存储的副本数量，几乎相同
    unmapMarkSnapChainRemoved: ignored
      # 在 trim filesystem 期间，是否自动删除当前时刻之前的所有快照
    nfsOptions: "vers=4.2,noresvport,softerr,timeo=600,retrans=5"
      # 通过 NFS 协议连接 volume 的配置参数
  provisioner: driver.longhorn.io
  reclaimPolicy: Delete
  volumeBindingMode: Immediate
  allowVolumeExpansion: true
  ```

- Longhorn UI 网页上的的配置参数：
  - `Automatically Delete Workload Pod when The Volume Is Detached Unexpectedly`
    - ：当 volume 意外断开连接时，是否让 Longhorn 自动删除挂载该 volume 的 Pod 。
    - 这样阻止了 Pod 在没有 volume 的情况下继续运行。即使 Pod 被重新创建，也会一直等待挂载 volume 。
  - `Pod Deletion Policy When Node is Down`
    - ：表示当一个 k8s node 宕机时，是否强制删除该节点上的 Pod 。
    - 如果故障 Pod 由 Deployment 管理，则一旦进入 Terminating 状态，不必删除， Deployment 就会自动创建新 Pod ，部署到其它节点。
      - 如果故障 Pod 挂载了 ReadWriteOnce 类型的 volume ，则等 Pod 被实际删除、释放 volume 之后，新 Pod 才能挂载旧 volume ，才能顺利启动。
      - 如果故障 Pod 挂载了 ReadWriteMany 类型的 volume ，则不必删除 Pod ，新 Pod 就能挂载旧 volume 。
    - 如果故障 Pod 由 StatefulSet 管理，则等 Pod 进入 Terminated 状态、被实际删除之后， StatefulSet 才能创建相同编号的新 Pod 。
  - `Default Data Path`
    - ：Longhorn 在每个 k8s node 上的数据目录，默认为 `/var/lib/longhorn/` 。
    - 不方便修改这个路径，因为部署 Longhorn Pod 时，挂载了宿主机的 `/var/lib/longhorn` 路径。
  - `Create Default Disk on Labeled Nodes`
    - ：只在包含标签 `node.longhorn.io/create-default-disk: 'true'` 的 k8s node 上存储 volume 副本，也就是创建 `/var/lib/longhorn/replicas/xx` 目录。
    - 默认不启用该参数， Longhorn 会将 volume 副本存储到任何 k8s node 上，这样不方便集中管理。
    - 用户也可以给 StorageClass 添加 `parameters.nodeSelector` 配置参数，选出一些 k8s node 。
  - `Storage Reserved Percentage For Default Disk`
    - ：每个 k8s node 的磁盘中，保留多少百分比的磁盘空间不分配。默认为 25% 。
    - 假设磁盘容量为 100GB ，则其中 75GB 磁盘空间可用于创建 volume ，称为 AvailableStorage 。
  - `Storage Over Provisioning Percentage`
    - ：所有 volume 的容量之和（称为 ScheduledStorage ），不能超过 AvailableStorage 的多少百分比。默认为 100% ，即不允许超卖。
    - 除了 volume 副本数据，sanpshot 也会占用较多磁盘。建议在 Longhorn UI 上添加 CronJob 来定期删除 snapshot 。

- `volumes.longhorn.io` 的配置参数：
  - frontend 有多种取值：
    ```sh
    block device  # 通过 iSCSI 协议连接 volume ，并且将 volume 作为一个 disk 块设备，挂载到 Pod 所在的 k8s node
    iscsi         # 通过 iSCSI 协议连接 volume ，但不会作为块设备挂载，导致 Pod 会停留在 ContainerCreating 状态
    ```
  - accessMode 有多种取值：
    ```sh
    ReadWriteOnce
    ReadWriteMany # 此时只能通过 NFS 协议连接 volume
    ```

## 测试

- 性能测试
  - 参考：<https://www.theairtips.com/post/kubernetes-persistent-storage-performance-test>
  - Longhorn 允许 Pod 读写网盘，与直接读写宿主机磁盘相比，性能低一些。体现在以下方面：
    - Pod 通过 iSCSI 协议读写 volume 的 IOPS 速度，大概只有宿主机磁盘原本 IOPS 的 30% 。
    - 内网网络带宽通常有几 Gbps ，不会成为 iSCSI 速度的瓶颈。
    - 宿主机磁盘的 IO 延迟通常为 1ms 左右，而 Pod 通过 iSCSI 协议读写 volume 的 IO 延迟，大概增加 0.5ms 。
      - 增加 volume 副本数量时，读操作的延迟不变，而写操作的延迟会增加。因为每次执行写操作，都需要同步到所有 volume 副本。
  - 总之，大部分软件的 Pod 对磁盘读写速度不敏感，因此使用 Longhorn 不会明显降低性能。
