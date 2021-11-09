# Ceph

：一个分布式存储系统。可以将多个主机的磁盘合并成一个资源池，提供块存储、文件存储、对象存储服务。
- [官方文档](https://docs.ceph.com/)
- 读音为 `/ˈsɛf/`
- 采用 C++ 开发。
- 2006 年由 Sage Weil 发布，2014 年被红帽公司收购。

## 原理

- 一个 Ceph 集群包含以下组件：
  - 监控进程（Monitor，MON）
    - 监听 3300、6789 端口。
  - 管理进程（Manager，MGR）
    - ：管理集群的磁盘等资源，提供 Web 页面和 RESTful API 。
    - 监听 6800、6801、8443、9283 端口。
  - 存储守护进程（Object Storage Daemon，OSD）
  - 元数据服务器（Meta Data Server，MDS）
    - 启用文件存储时，需要依赖 MDS 。

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

- ceph-ansible ：基于 ansible playbook 部署 Ceph 集群。
- Rook ：用于在 k8s 中部署 Ceph 集群。

### Cephadm

：一个 Python3 脚本，用于以容器形式部署 Ceph 集群。步骤如下：
1. 下载 Cephadm 脚本：
    ```sh
    wget https://github.com/ceph/ceph/raw/octopus/src/cephadm/cephadm
    ```
2. 在当前主机上部署一个初始化的 Ceph 集群：
    ```sh
    python3 cephadm bootstrap --mon-ip <ip>
    ```
    该命令会：
    - 采用指定的 IP 作为当前节点的 IP 。
    - 自动发现本机已安装的 Docker 或 Podman 容器引擎，用它拉取 Ceph 镜像。
    - 运行一个 Monitor 和 Manager 进程，并在防火墙开通相应端口。
    - 运行一套 grafana、prometheus、alertmanager 监控进程。
    - 为 Ceph 集群生成一个新的 SSH 密钥。
      - 密钥保存到 /etc/ceph/ceph.client.admin.keyring 文件。
      - 公钥保存到 /etc/ceph/ceph.pub 文件，并添加到 /root/.ssh/authorized_keys 文件。
    - 给当前节点添加 _admin 标签。
      - 会自动拷贝私钥文件和 /etc/ceph/ceph.conf 到带有 _admin 标签的节点，允许它们管理集群。

3. 进入 ceph shell ：
    ```sh
    python3 cephadm shell
    ceph -v
    ceph status
    ```

4. 添加其它主机：
    ```sh
    ceph orch host add node-2 10.0.0.2
    ```
    - 需要先拷贝 SSH 公钥到目标主机：
      ```sh
      ssh-copy-id -f -i /etc/ceph/ceph.pub root@10.0.0.2
      ```

4. 创建 OSD 进程：
    ```sh
    ceph orch apply osd --all-available-devices
    ```



命令：
```sh
# 管理主机
ceph orch host add <hostname> [addr] [label]...

# 关于 OSD
ceph orch device ls                           # 列出所有节点上的存储设备
ceph orch apply osd --all-available-devices   # 为所有可用的存储设备创建 OSD 进程
ceph orch daemon add osd <hostname>:<device>  # 为指定的存储设备创建 OSD 进程
ceph orch osd rm <osd_id>...                  # 移除 OSD 进程
ceph orch device zap <hostname> <device>      # 擦除一个存储设备的内容，可以继续使用

# 文件存储
ceph fs volume create <fs_name> --placement="<placement spec>"
```
- Ceph 会自动发现主机上的存储设备，满足以下条件才视作可用，允许创建 OSD 进程：
  - 大于 5 GB 。
  - 没有挂载。
  - 没有磁盘分区或 LVM 。
  - 不包含文件系统。


