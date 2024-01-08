



# Longhorn

- ：一个分布式块存储系统，用作 k8s 的 CSI 存储插件。
- 2017 年，由 Rancher Labs 公司发布。

## 原理

- 部署 Longhorn 时，包含多个组件：
  - Longhorn Manager
    - ：以 k8s DaemonSet 方式部署在每个主机上。
    - 它会监听 k8s apiserver 。如果发现 k8s 创建了 Longhorn volume 类型的 CRD 对象，则通过 CSI 接口调用 Longhorn CSI Plugin ，创建一个 Longhorn volume 实体。
    - 如果一个主机未部署 Longhorn Manager ，则该主机上的 Pod 不能使用 Longhorn 的 volume 。
    <!-- /var/lib/longhorn/ 目录 -->
  - Longhorn CSI Plugin
    - ：负责管理 Longhorn volume ，比如创建、删除、挂载、生成快照。
  - Longhorn UI
    - ：提供 Web 页面，供用户操作。
  - Longhorn API
    - ：提供 API 接口。
    - 比如 Longhorn UI、Longhorn CSI Plugin 会调用 Longhorn API ，从而间接访问 Longhorn Manager 。
  - Longhorn Engine
    - ：一个轻量级进程，担任 volume 的控制器。
    - Longhorn Manager 会为每个 volume 专门运行一个 Longhorn Engine 进程，与 volume 位于同一主机。因此一个 volume 或 Longhorn Engine 故障时，不会影响其它 volume 。

- Longhorn Engine 的工作流程：
  1. Longhorn Manager 创建一个 Longhorn volume ，用于挂载到某个 Pod ，并在该 Pod 所在主机上创建一个 Longhorn Engine 进程。
  2. Longhorn Engine 在 Pod 中挂载一个块设备 `/dev/longhorn/vol-xxx` 。并将 Pod 对于该块设备的读写指令，通过 iSCSI 协议发送到宿主机的 Longhorn volume 中执行。
  3. Longhorn Engine 定期为 Longhorn volume 生成快照，拷贝到各个副本中。


- Longhorn Engine 会为每个 volume 存储多个数据副本（replicas），从而实现高可用。
  - 每个数据副本，存储在不同主机的的磁盘上。
    <!-- - 每个副本位于不同主机的磁盘上，存储为一个稀疏文件？？ -->
  - Longhorn 默认会为每个 volume 维持至少 3 个健康的副本。如果当前健康的副本数量低于阈值，则会自动添加新的副本。
  - 当前 Pod 不可用时，会自动在存储副本的其它主机上重新创建 Longhorn Engine、Pod 。
  - 缺点：只能将 Pod 调度到存储 volume 副本的 3 个主机上。


- Longhorn Engine 会定期为 volume 创建快照（snapshot），实现增量备份。
  - 将 volume 的每 4 KB 磁盘空间划分为一个 block 。定期为 volume 创建一个快照，记录最近发生变化的 block 的最新内容，然后将快照拷贝到各个副本。
    - volume 负责存储实时数据。而每个副本负责存储快照，可能滞后于实时数据。
    - 写入数据到 volume 时，操作系统不一定会立即将内存中的数据 flush 到磁盘。如果此时 volume 故障，则会丢失实时数据。为了解决该问题，Longhorn 会在创建每个快照之前，自动执行 sync 命令。
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



<!-- Longhorn 是一个精简配置的存储系统。这意味着 Longhorn volume 只会占用当前所需的空间。例如，如果用户创建了 20GB 容量的 volume ，但仅写入 1GB 数据，则实际占用的宿主机磁盘空间为 1 GB。
如果用户写入 10GB 数据，然后删除 9GB 数据，则实际占用的宿主机磁盘空间为 10GB 。因为 Longhorn volume 属于块设备，不是文件系统，不能感知哪些数据被用户删除，不能释放被删除的磁盘空间。
（在 Pod 中查看的磁盘空间是 1GB ？不包括已删除的数据）
 -->
