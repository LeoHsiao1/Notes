# Ceph

：一个分布式存储系统。可以将多个主机的磁盘联网组合成一个资源池，提供块存储、文件存储、对象存储服务。
- [官方文档](https://docs.ceph.com/)
- 读音为 `/ˈsɛf/`
- 采用 C++ 开发。
- 2006 年由 Sage Weil 发布，2014 年被红帽公司收购。

## 原理

- Ceph 集群分布式部署在多个主机上，运行多种服务进程：
  - Monitor（MON）
    - 负责存储、维护 Cluster Map ，比如各个服务的地址、配置、状态等信息。
    - 支持部署多个实例，基于 Paxos 算法实现一致性。
    - 每个实例占用 1GB 以上内存。
    - 客户端一般通过访问 Monitor 来与 Ceph 集群交互。
  - Manager（MGR）
    - 负责管理一些功能模块，比如 Dashboard 。
    - 每个实例都会运行 Dashboard 模块，提供 Web 管理页面。集成了一套 grafana、prometheus、node_exporter、alertmanager 监控进程。
  - Object Storage Daemon（OSD）
    - 负责将数据存储到设备中，供用户读写。
    - 通常在每个主机上，为每个存储设备部署一个 OSD 进程。
  - Crash
    - 负责收集其它服务的崩溃信息。
  - Meta Data Server（MDS）
    - 负责存储 CephFS 文件系统的元数据，比如文件权限、属性。
    - 启用文件存储时才需要。将文件的内容存储在 OSD ，而元数据存储在 MDS 服务器。
  - RADOS Gateway（RGW）
    - 通过 RESTful API 提供对象存储功能。
    - 启用对象存储时才需要。

- RADOS ：Ceph 的存储层，以对象存储的形式存储所有数据，因此存储数据的基本单位为 object 。
  - 每个 object 的默认大小为 4MB ，拥有一个在集群内唯一的 object id 。
  - Ceph 会将 object 根据哈希值分配到一些 pg（Placement Group） 中，从而方便分组管理大量 object 。
  - 支持创建多个存储池（Pool），对 pg 进行分组管理。

- 应用程序可通过 librados 库访问 RADOS 。librados 库提供了三种常用的存储接口：
  - librbd
    - ：用于块存储。
    - Ceph 不依赖其它文件系统，可以用自带的存储后端 BlueStore 直接管理 HDD、SSD 硬盘。
  - MDS
    - ：用于文件存储。
    - 提供了一种网络文件系统 CephFS ，兼容 POSIX 文件系统。
  - RADOS Gateway
    - ：用于对象存储，兼容 S3、Swift 。

- Ceph 新增数据的流程：
  1. 应用程序访问 Monitor ，获知所有 OSD 的信息。
  2. 将数据分割为以 object 为单位，再以 pg 为单位分组。
  3. 将 pg 分配到一些 OSD 中存储。
      - 应用程序直接与 OSD 进程通信，不需要经过 Monitor 中转，因此分散了负载压力。
      - 应用程序和 OSD 进程都能根据 CRUSH 算法计算出每个 pg 应该存储到哪个 OSD 的哪个位置，不需要查表，因此效率更高。

## 部署

Ceph 有多种部署方式：
- ceph-ansible ：基于 ansible playbook 部署 Ceph 集群。
- ceph-deploy ：一个命令行工具，已停止维护。
- Cephadm ：一个 Python3 脚本，用于以容器形式部署 Ceph 集群，通过编排（Orchestrator，orch）接口控制 Ceph 。
- Rook ：用于在 k8s 中部署 Ceph 集群。

### 版本

大概每年发布一个大版本：
- v9 ：版本名为 Infernalis ，2015 年发布。
- v15 ：版本名为 Octopus ，2020 年发布。
- v16 ：版本名为 Pacific ，2021 年发布。

### Cephadm

部署步骤：
1. 下载 Cephadm 脚本：
    ```sh
    version=pacific
    wget https://github.com/ceph/ceph/raw/${version}/src/cephadm/cephadm
    ```
2. 在当前主机上部署一个初始化的 Ceph 集群：
    ```sh
    python3 cephadm bootstrap --mon-ip <ip>
    ```
    该命令会：
    - 采用指定 IP 作为当前主机的 IP 。
    - 检查本机是否安装了依赖软件，没有则自动安装：
      - docker 或 podman 容器引擎
      - systemctl
      - lvcreate
      - chronyd
    - 以容器形式运行一个 Monitor 和 Manager 进程，并在防火墙开通相应端口。
    - 为 Ceph 集群生成一个新的 SSH 密钥。
      - 密钥保存到 /etc/ceph/ceph.client.admin.keyring 文件。
      - 公钥保存到 /etc/ceph/ceph.pub 文件，并添加到 /root/.ssh/authorized_keys 文件。
    - 给当前主机添加 _admin 标签。
      - 如果主机带有 _admin 标签，则会自动拷贝私钥文件和 /etc/ceph/ceph.conf 到该主机，允许它们管理集群。
      - 如果主机带有 _no_schedule 标签，则不会在该主机部署服务进程。
    - 启动 Ceph Dashboard ，并在终端打印初始的账号、密码。
      - 默认监听 HTTPS 8443 端口，可以禁用 SSL 协议：
        ```sh
        ceph config set mgr mgr/dashboard/ssl false
        ceph config set mgr mgr/dashboard/server_port 8080
        ceph config set mgr mgr/dashboard/ssl_server_port 8443
        ceph mgr module disable dashboard
        ceph mgr module enable dashboard
        ```

3. 进入 ceph shell ：
    ```sh
    python3 cephadm shell
    ceph status
    ```
    - 也可以执行 `yum install ceph-common` ，在宿主机上安装 ceph 命令。

4. 添加其它主机
    ```sh
    ceph orch host add host2 10.0.0.2
    ```
    - 需要先拷贝 SSH 公钥到目标主机：
      ```sh
      ssh-copy-id -f -i /etc/ceph/ceph.pub root@10.0.0.2
      ```

5. 部署 OSD 进程：
    ```sh
    ceph-volume lvm zap /dev/vdb --destroy    # 擦除一个磁盘
    ceph orch daemon add osd host1:/dev/vdb   # 创建 OSD 进程，管理磁盘
    ```

命令：
```sh
python3 cephadm
                version
                check-host                        # 检查本机是否安装了 cephadm 依赖
                bootstrap --mon-ip <ip>           # 引导启动一个新集群，重复执行则会部署多个集群
                rm-cluster --fsid <fsid> --force  # 删除集群，需要指定集群 ID
                shell                             # 打开 ceph shell ，这会创建一个临时的 ceph 容器
                ls                                # 列出当前主机上的服务进程
                logs --name <name>                # 查看指定服务进程的日志
```
- cephadm 将日志保存到 journalctl ，也可以直接看容器日志。

## 管理命令

### 集群

```sh
# 查看集群
ceph -v
ceph status

# 升级集群
ceph orch upgrade start --ceph-version 16.2.6   # 升级到指定版本
ceph orch upgrade status                        # 查看升级任务的状态。执行 ceph status 还会显示升级的进度条
ceph orch upgrade stop                          # 停止升级任务

# 配置集群
ceph config dump                    # 输出集群的配置参数，不包括默认的配置参数
ceph config ls                      # 列出所有可用的配置参数
ceph config log [n]                 # 查看配置参数最近 n 次的变更记录
ceph config get <who> [key]         # 读取配置参数，who 表示服务类型
ceph config set <who> <key> <value> # 设置配置参数
```

### 主机

```sh
ceph orch host add <hostname> [addr] [label]... # 添加一个主机，指定名称和 IP 地址，还可以附加标签
ceph orch host rm  <hostname>
ceph orch host ls
ceph orch host set-addr  <hostname> <addr>      # 更新主机的地址
ceph orch host label add <hostname> <label>     # 给一个主机添加标签
ceph orch host label rm  <hostname> <label>
```

### 服务

```sh
ceph orch status                              # 显示编排器的状态，比如 cephadm
ceph orch ls [service_type] [service_name]    # 列出集群中的服务
              --export                        # 导出 spec 配置
ceph orch ps [hostname] [service_name]        # 列出主机上的服务进程实例
ceph orch rm <service_name>                   # 删除一个服务，这会终止其所有进程实例
ceph orch apply -i <xx.yml>                   # 导入服务的 spec 配置
```
- 每种服务可能运行多个进程实例。
  - 服务的名称采用小写的服务类型，例如 mon 。
  - 服务进程以守护进程的形式运行，称为 daemon 。
    - daemon 的命名格式为 `<service_name>.<hostname>` ，例如 mon.host1 。
    - daemon 的容器命名格式为 `ceph-<fsid>-<process_name>` 。
  - 没有直接重启服务的命令，管理不方便。
- 同种服务的 daemon 采用同一份配置（Specification，spec）。例如 mon 服务的配置如下：
  ```yml
  service_type: mon
  service_name: mon
  placement:              # 关于部署的配置
    count: 5              # 指定需要部署的实例数
    # count_per_host: 1   # 每个主机上部署的实例数
    # hosts:              # 或者指定用于部署的主机名
    # - host-1
    # label: null         # 根据标签筛选用于部署的主机名
  # unmanaged: false      # 是否禁止 Orchestrator 管理该服务
  ```

### OSD

```sh
ceph osd ls                                   # 列出所有 OSD
ceph osd tree                                 # 以树形结构列出所有 OSD
ceph orch device ls [hostname]                # 列出主机上的存储设备
                    --wide                    # 显示详细信息
ceph orch daemon add osd <hostname>:<device>  # 创建 OSD 进程，管理指定的存储设备
ceph orch apply osd --all-available-devices   # 添加 spec 配置：自动为所有可用的存储设备部署 OSD 进程
                    --unmanaged=true          # 禁止编排 OSD 进程，不允许自动部署、手动部署
ceph orch osd rm <osd_id>...                  # 移除 OSD 进程，这会添加一个计划任务
ceph orch osd rm status                       # 查看移除任务的状态
ceph orch osd rm stop <osd_id>...             # 停止移除任务

# ceph-volume 是一个更底层的命令
ceph-volume lvm list                          # 列出所有已关联 OSD 的 logical volume
ceph-volume lvm zap <device>...               # 擦除一个 device 的内容。这会通过 dd if=/dev/zero of=<device> 命令销毁其中的分区表
                    --destroy                 # 擦除一个 raw device 时，销毁其中的 volume group 和 logical volume
ceph-volume lvm prepare --data <device>       # 为一个 device 创建 OSD
ceph-volume lvm activate
                    <osd_id> <uuid>           # 启动 OSD 进程，需要指定其编号和 uuid
                    --all                     # 自动发现所有 device 已关联的 OSD ，并启动
ceph-volume lvm deactivate <osd_id> <uuid>    # 停止 OSD 进程
```
- ceph-volume 会自动发现主机上的存储设备，满足以下条件才视作可用，允许创建 OSD ：
  - 大于 5 GB 。
  - 没有挂载。
  - 不包含文件系统。
  - 没有磁盘分区（partition）。因此通常使用以下两种存储设备：
    - raw device ：原始存储设备，比如一个磁盘。
    - logical volume ：LVM 逻辑卷。
- ceph-volume lvm 部署 OSD 的工作流程：
  1. 分配一个在集群内唯一的 OSD ID ，编号从 0 开始。
  2. 格式化存储设备，为 OSD 创建 LVM 逻辑卷。
      - 此后执行 fdisk -l 可以同时看到原存储设备和 OSD 设备。如果用 mount 挂载原存储设备，则会报错：`xx is already mounted` ，因为已被 OSD 占用。
  3. 在当前主机部署一个 OSD 进程，并将 OSD 元数据以 LVM 标签的形式添加到逻辑卷，方便发现与逻辑卷关联的 OSD 。

### Pool

```sh
ceph osd pool ls                        # 列出所有 pool
ceph osd pool create <pool>             # 创建一个 pool ，指定名称
                    [pg_num] [pgp_num]
                    [replicated|erasure]
ceph osd pool rm  <pool> <pool> --yes-i-really-really-mean-it   # 删除一个 pool ，需要两次指定其名称
ceph osd pool get <pool> <key>          # 读取配置参数
ceph osd pool set <pool> <key> <value>
```
- pool 分为两种类型：
  - replicated ：复制池，默认采用。将 object 保存多份，从而实现数据备份。
    - 假设全部 OSD 的磁盘容量为 100G ，存储的 pool size 为 3 ，则 pool 最多允许写入 33G 数据。
  - erasure ：纠错码池。通过占用大概 1.5 倍的存储空间来实现数据备份。
    - 比复制池占用的存储空间更少，但是读取时占用更多 CPU 和内存来解码，读取延迟较大，适合冷备份。
- pool 常见的配置参数：
  ```sh
  size              # 该 pool 中每个 object 的副本数，即将所有数据保存 size 份。默认为 3
  min_size          # 读写 object 时需要的最小副本数。默认为 2
  pg_num            # 该 pool 包含的 pg 数，默认为 32 。应该根据 osd_count*100/pool_size 估算，并取最近的一个 2^n 幂值
  pgp_num           # 用于 CRUSH 计算的 pg 数，取值应该等于 pg_num
  crush_rule        # 采用的 CRUSH 规则。默认为 replicated_rule
  quota_max_bytes   # 存储容量。默认为 0 ，不限制
  quota_max_objects # 存储的 object 数。默认为 0 ，不限制
  ```
- mon 服务关于 pool 的配置参数：
  ```sh
  mon_allow_pool_delete       # 是否允许删除 pool ，默认为 false
  mon_allow_pool_size_one     # 是否允许 pool size 设置为 1 。默认为 false ，因此 size 至少要为 2

  # pool 配置参数的默认值
  osd_pool_default_size
  osd_pool_default_min_size
  osd_pool_default_pg_num
  osd_pool_default_pgp_num
  ```
- pool 中 pg 的常见状态：
  ```sh
  # 正常状态
  active        # 可以读写
  clean         # pg 不存在故障的 object

  # 异常状态
  down          # pg 离线
  undersized    # pg 实际运行的副本数少于 pool size
  degraded      # 降级了，pg 中存在一些 object ，其副本数少于 pool size
  stale         # pg 的状态没有更新到 Monitor ，可能是存储该 pg 的所有 OSD 都故障了

  # 关于检查、恢复
  deep          # 根据 checksum 检查 pg 的数据是否一致
  peer          # 存储该 pg 的所有 OSD 互相通信，将该 pg 的状态同步一致
  recovery      # 根据操作日志找出 pg 中与其它副本不一致的 object ，进行同步。常见于 OSD 重启时
  backfill      # 检查并同步 pg 中的全部 object ，常见于新增 pg、OSD 时
  ```

### CephFS

```sh
ceph fs ls                                    # 列出已创建的 fs
ceph fs status
ceph fs new <fs_name> <meta> <data>           # 创建一个 fs，指定其用于存储元数据、数据的 pool
ceph fs rm  <fs_name> --yes-i-really-mean-it  # 删除一个 fs
ceph fs add_data_pool <fs_name> <pool>        # 给 CephFS 增加数据池
ceph fs get <fs_name>                         # 读取全部配置参数
ceph fs set <fs_name> <key> <value>           # 修改一个配置参数

ceph mds stat                                 # 显示 mds 的状态
```
- Ceph 集群中可以创建多个 CephFS 文件系统实例，简称为 fs 。
  - 每个 fs 需要使用至少两个 pool ，分别用于存储数据、元数据。
  - 每个 fs 需要使用至少一个 MDS 服务器。
- fs 常见的配置参数：
  ```sh
  max_file_size   # 单个文件的最大体积，默认为 1024^4
  down            # 是否停止服务。通过设置该参数为 true 或 false ，可以停止或启动 fs
  ```
- 例：创建 fs
  ```sh
  ceph osd pool create cephfs1.data
  ceph osd pool create cephfs1.meta
  ceph fs new cephfs1 cephfs1.meta cephfs1.data
  ```
- Linux 内核已经内置了 ceph 模块，因此可以直接用 mount 命令挂载 CephFS 文件系统：
  ```sh
  mount -t ceph <mon_ip:port>:<src_dir> <dst_dir>  # 访问 mon 服务器，将 CephFS 文件系统的 src_dir 挂载到当前主机的 dst_dir
          [-o options]              # 可加上一些逗号分隔的选项，如下：
              name=guest            # CephX 用户
              secret=xxx            # CephX 密钥
              secretfile=xxx        # CephX 密钥文件
              fs=cephfs1            # 默认挂载第一个 fs
  ```
  - secretfile、fs 选项需要安装 ceph 软件包才能使用，其提供了功能更多的 mount.ceph 命令。
  - 例：
    ```sh
    mkdir /mnt/cephfs
    mount -t ceph   10.0.0.1:/  /mnt/cephfs   -o name=admin,secret=xxx
    echo '10.0.0.1:/  /mnt/cephfs    ceph    name=admin,secret=xxx    0   0' >> /etc/fstab

    dmesg | tail          # 查看挂载日志
    umount /mnt/cephfs    # 卸载
    ```
  - 如果停止 fs ，则客户端访问已挂载的 fs 时会出错，比如无响应、umount 失败。

### volume

```sh
ceph fs volume ls                             # 列出已创建的 volume
ceph fs volume create <volume>                # 创建一个 volume
ceph fs volume rm <volume> --yes-i-really-mean-it

ceph fs subvolume ls
ceph fs subvolume create <vol_name> <sub_name> [group_name]
ceph fs subvolume rm     <vol_name> <sub_name> [group_name]

ceph fs subvolumegroup ls
ceph fs subvolumegroup create <vol_name> <group_name>
ceph fs subvolumegroup rm     <vol_name> <group_name>
```
- CephFS volume 是对一种快速创建 fs 的方式。
  - 创建一个 volume 时，会自动创建：
    - 一个同名的 fs 。
    - 两个 pool ，命名格式为 `cephfs.<volume>.data` 和 `cephfs.<volume>.meta` 。
    - 两个 MDS 服务器。
  - 删除一个 volume 时，会自动删除关联的 fs、pool 和 MDS 。
  - 每个 volume 中可以创建多个子卷（subvolume）或子卷组（subvolume group），相当于文件夹。
- 例：查看 mds.volume1 的配置
  ```sh
  [ceph: root@CentOS /]# ceph orch ls mds mds.volume1 --export
  service_type: mds
  service_id: volume1
  service_name: mds.volume1
  placement:
    count: 2
  ```

### CephX

```sh
ceph auth ls            # 列出已创建的凭证
ceph auth get <name>    # 读取指定的凭证
ceph auth rm  <name>
```
- Ceph 集群采用 CephX 协议进行身份认证。
- 凭证示例：
  ```sh
  client.admin                                            # 用户名
          key: AQD9O45hiBQrDBAAsMYpN0ddCF/apJpYIoLokg==   # 密钥，采用 base64 编码
          caps: [mds] allow *                             # 权限
          caps: [mgr] allow *
          caps: [mon] allow *
          caps: [osd] allow *
  ```
