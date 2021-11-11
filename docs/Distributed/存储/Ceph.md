# Ceph

：一个分布式存储系统。可以将多个主机的磁盘合并成一个资源池，提供块存储、文件存储、对象存储服务。
- [官方文档](https://docs.ceph.com/)
- 读音为 `/ˈsɛf/`
- 采用 C++ 开发。
- 2006 年由 Sage Weil 发布，2014 年被红帽公司收购。

## 原理

- Ceph 集群中会运行多种服务进程：
  - 监控进程（Monitor，MON）
    - 负责存储、维护集群的主要数据。
    - 支持部署多个实例，基于 Paxos 算法实现一致性。
  - 管理进程（Manager，MGR）
    - 负责管理其它模块，比如 Dashboard 。
    - 每个 Manager 进程都会运行 Dashboard 模块，提供 Web 管理页面。集成了一套 grafana、prometheus、node_exporter、alertmanager 监控进程。
  - 存储守护进程（Object Storage Daemon，OSD）
    - 负责主机上存储数据。
  - 元数据服务器（Meta Data Server，MDS）
    - 负责存储文件系统的元数据。
    - 启用文件存储时，才需要 MDS 。
  - Crash
    - 负责收集其它服务的崩溃信息。

- Ceph 的底层是 RADOS
- 应用程序可通过 LIBRADOS 库访问 RADOS

- LIBRADOS 库提供了三种常用的接口：
  - librbd
    - ：用于块存储。
    - Ceph 不依赖其它文件系统，可以用自带的存储后端 BlueStore 直接管理 HDD、SSD 硬盘。
  - MDS
    - ：用于文件存储，兼容 POSIX 系统。
  - RADOSGW
    - ：RESTful 接口，对接 S3、Swift 等对象存储。

- Ceph 分布式部署在多个主机上，每个主机称为一个节点。
  - 通常每个节点的每个硬盘提供一个 OSD 存储服务。
  - 节点存储数据的基本单位称为 object 。
    - 每个 object 拥有一个 object id ，默认大小为 4MB 。
  - 节点会将 object 根据哈希值分配到一些 pg（Placement Group） 中，从而方便分组管理。

- Ceph 新增数据的流程：
  1. 应用程序调用 LIBRADOS 库，将块、文件或对象发送给存储节点。
  2. 存储节点将数据分割成一系列 object ，再分配到一些 pg 。
  3. 存储节点将 pg 根据 CRUSH 算法分配到一些 OSD 中存储。


- 支持多副本
  - 数据具有强一致，确保所有副本写入完成才返回确认


## 部署

Ceph 存在多种部署方式，大多通过编排（Orchestrator，orch）接口控制 Ceph 。
- Cephadm
- ceph-ansible ：基于 ansible playbook 部署 Ceph 集群。
- Rook ：用于在 k8s 中部署 Ceph 集群。

### 版本

大概每年发布一个大版本：
- v9 ：版本名为 Infernalis ，2015 年发布。
- v15 ：版本名为 Octopus ，2020 年发布。
- v16 ：版本名为 Pacific ，2021 年发布。

### Cephadm

：一个 Python3 脚本，用于以容器形式部署 Ceph 集群。

#### 部署步骤

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
    - 自动发现本机已安装的 Docker 或 Podman 容器引擎，用它拉取 Ceph 镜像。
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

4. 添加其它主机：
    ```sh
    ceph orch host add host2 10.0.0.2
    ```
    - 需要先拷贝 SSH 公钥到目标主机：
      ```sh
      ssh-copy-id -f -i /etc/ceph/ceph.pub root@10.0.0.2
      ```

4. 创建 OSD 进程：
    ```sh
    ceph orch apply osd --all-available-devices
    ```

#### 命令

```sh
python3 cephadm
                version
                bootstrap --mon-ip <ip>           # 引导启动一个集群
                rm-cluster --fsid <fsid> --force  # 删除集群
                shell                             # 打开 ceph shell ，这会创建一个临时的 ceph 容器
                ls                                # 列出当前主机上的服务进程
                logs --name <name>                # 查看指定服务进程的日志
```
- fsid 表示 CephFS 集群的 ID 。
- cephadm 将日志保存到 journalctl ，也可以直接看容器日志。


### ceph 命令


```sh
# 查看集群
ceph -v
ceph status

# 配置集群
ceph config dump                  # 输出集群的配置参数，不包括默认的配置参数
config ls                         # 列出所有可用的配置参数
config log [n]                    # 查看配置参数最近 n 次的变更记录
config set <who> <key> <value>    # 设置一个配置参数，who 表示服务类型
config get <who> [key]            # 读取配置参数

# 升级集群
ceph orch upgrade start --ceph-version 16.2.6   # 升级到指定版本
ceph orch upgrade status                        # 查看升级任务的状态。执行 ceph status 还会显示升级的进度条
ceph orch upgrade stop                          # 停止升级任务
```
- 每种服务可能运行多个进程实例。
  - 服务的名称采用小写的服务类型，例如 mon 。
  - 服务进程以守护进程的形式运行，称为 daemon 。
    - daemon 的命名格式为 `<service_name>.<hostname>` ，例如 mon.host1 。
    - daemon 的容器命名格式为 `ceph-<fsid>-<process_name>` 。
  - 同种服务的 daemon 采用同一份配置（Specification，spec）。mon 服务的配置示例：
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



```sh
# 管理主机
ceph orch host add <hostname> [addr] [label]... # 添加一个主机，指定名称和 IP 地址，还可以附加标签
ceph orch host set-addr  <hostname> <addr>      # 更新主机的地址
ceph orch host label add <hostname> <label>     # 给一个主机添加标签
ceph orch host label rm  <hostname> <label>
ceph orch host ls
ceph orch host rm <hostname>

# 关于 OSD
ceph osd ls                                   # 列出所有 OSD
ceph osd tree                                 # 以树形结构列出所有 OSD

# 管理服务
ceph orch status                              # 显示编排器的状态，比如 cephadm
ceph orch ls [service_type] [service_name]    # 列出集群中的服务
              --export                        # 导出 spec 配置
ceph orch ps [hostname] [service_name]        # 列出主机上的服务进程
ceph orch rm <service_name>                   # 删除一个服务，这会终止其所有进程实例
ceph orch apply -i <xx.yml>                   # 导入服务的 spec 配置
ceph orch apply osd --all-available-devices   # 添加 spec 配置：自动为所有可用的存储设备创建 OSD 进程
                    --unmanaged=true          # 禁止编排 OSD 进程，不允许自动创建、手动创建


ceph orch device ls [hostname]                # 列出主机上的存储设备
                    --wide                    # 显示详细信息
ceph orch device zap <hostname> <device> --force      # 擦除一个存储设备的内容（基于 dd 命令），可供继续使用
ceph orch daemon add osd <hostname>:<device>  # 为指定的存储设备创建 OSD 进程
ceph orch osd rm <osd_id>...                  # 移除 OSD 进程，这会添加计划任务
ceph orch osd rm status                       # 查看移除任务的状态
ceph orch osd rm stop <osd_id>...             # 停止移除任务

ceph-volume lvm activate <osd_id> <fsid>





# 文件存储
ceph fs volume create <fs_name> --placement="<placement spec>"
```
<!-- - Ceph 会自动发现主机上的存储设备，满足以下条件才视作可用，允许创建 OSD 进程：
  - 大于 5 GB 。
  - 没有挂载。
  - 没有磁盘分区或 LVM 。
  - 不包含文件系统。 -->


