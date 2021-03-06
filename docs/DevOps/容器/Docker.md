# Docker

：一个用于创建、管理容器的软件。
- [官方文档](https://docs.docker.com/get-started/overview/)
- 基于 Golang 开发，在 Moby 项目中开源。
- dotCloud 公司于 2013 年发布 Docker 软件，成为了最流行的容器引擎。
  - 后来公司改名为 Docker 公司。

## 版本

- Docker 提供了用于 Linux、MacOS、Windows 系统的安装包。
- 2017 年 3 月，Docker 的软件版本号从 v1.13 升级到 17.03 ，从数字编号改为日期格式。并且分为两种发行版：
  - Docker CE ：社区版（Community Edition），免费提供。
  - Docker EE ：企业版（Enterprise Edition），增加了一些收费的功能。

## 安装

- 在 Centos 上安装：
  ```sh
  yum install yum-utils       # 安装 yum-config-manager
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加 docker 的官方镜像源
  yum install docker-ce       # 下载 docker 社区版
  systemctl start docker      # 启动 dockerd
  systemctl enable docker     # 使 docker 开机自启
  ```

- 在 ubuntu 上，可以用官方脚本自动安装：
  ```sh
  curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
  ```

## 配置

- 配置 dockerd 时，需要编辑 `/etc/docker/daemon.json` 文件，然后重启 dockerd 。
- 如果想让 dockerd 使用代理，需要在 `/usr/lib/systemd/system/docker.service` 中加入环境变量：
  ```sh
  [Service]
  Environment="HTTP_PROXY=socks5://10.0.0.1:1080"
  ```
  然后重启 dockerd ：
  ```sh
  systemctl daemon-reload
  systemctl restart docker
  ```

## 原理

### 架构

- 容器（Container）是一个类似于虚拟机的沙盒，内部可以运行一个或多个进程。
- 镜像（Image）是用于创建容器的模板，包含了应用程序的可执行文件文件、依赖文件、配置信息等。
- Docker 采用 C/S 架构工作：
  - 在宿主机上以守护进程的方式运行 dockerd 进程，作为服务器，负责管理本机的容器、镜像、数据卷、网络等对象。
  - 用户可以在宿主机上执行 docker 命令，作为客户端，与 dockerd 交互，比如请求启动容器。
    - 客户端是通过 `/var/run/docker.sock` 文件与 dockerd 通信。
    - 非 root 用户无权访问 docker.sock 文件，导致无权执行 docker ps 等命令。此时可以将该用户加入 docker 用户组：`sudo usermod leo -G docker` ，从而开通权限。

### namespace

- Docker 基于 Linux namespace 技术隔离了各个容器的运行环境。
  - 隔离了进程、网络、文件系统等系统资源，接近于独享一个虚拟机的运行环境。
  - 没有隔离硬件资源。例如：一个容器可能占用全部的 CPU 和内存；在容器内执行 top 命令会看到整个宿主机的硬件资源。
  - 没有隔离 Linux 内核，容器内的进程可能通过内核漏洞逃逸到宿主机上。

- namespace 分为多种类型，分别用于隔离不同的系统资源。如下：

    类型    |Flag           | 隔离资源
    -|-|-
    ipc     | CLONE_NEWIPC  | System V 系统的 IPC 对象、POSIX 系统的消息队列
    network | CLONE_NEWNET  | 网络设备、IP、Socket
    mnt     | CLONE_NEWNS   | 文件系统的挂载点
    pid     | CLONE_NEWPID  | 进程的 PID
    user    | CLONE_NEWUSER | 用户、用户组
    uts     | CLONE_NEWUTS  | 主机名、域名

  - 每种类型的 namespace 可以创建多个实例。
    - 每个进程可以同时使用多种类型的 namespace 实例。
    - 如果一个 namespace 内的所有进程都退出，则内核会自动销毁该 namespace 。除非 `/proc/<pid>/ns/<namespace>` 文件被一直打开或挂载。
  - 例：
    - 不同 pid namespace 中的进程可以分配相同的 PID 。
    - docker 容器内，第一个启动的进程被分配的 PID 为 1 ，而 PPID 为 0 。

- 关于 pid namespace ：
  - pid namespace 支持嵌套，当前 pid namespace 中创建的所有 pid namespace 都属于子实例。
    - 父实例可以看到子孙实例的进程信息，但反之不行。\
      比如在父实例中执行 ps -ef 命令，会将子孙实例中的进程也显示出来，并将它们的 PID 转换成父实例中的 PID 。
    - 子孙实例不可用看到父实例的进程信息。
    - 主机启动之后，第一个创建的 pid namespace 就是最上层的实例。
  - 每个 pid namespace 中，第一个创建的进程的 PID 为 1 ，通常为 init 进程。
    - 如果其它进程产生了孤儿进程，则内核会将它们改为当前 pid namespace 的 init 进程的子进程。
    - 如果 init 进程退出，则内核会向当前及子孙 pid namespace 中的所有进程发送 SIGKILL 信号，杀死它们。
    - 内核只支持将已注册 handler 的信号发送给 init 进程，会忽略 SIGKILL、SIGSTOP 等信号。但是可以发送给子孙 pid namespace 中的 init 进程，因为它们在当前 pid namespace 中的 PID 不为 1 。这样会导致子孙 pid namespace 被销毁。
  - 调用 setns() 或 unshare() 时，不会改变当前进程的 pid namespace ，而是影响之后创建的子进程。
    - 因此，一个进程在创建之后，其 PID 总是不变。成为孤儿进程时， PPID 会变为 1 。
  - 相关 API ：
    ```c
    #include <unistd.h>

    pid_t getpid(void);   // 返回当前进程的 PID ，属于当前的 pid namespace
    pid_t getppid(void);  // 返回父进程的 PID 。如果父进程属于不同的 pid namespace ，则返回 0
    ```

- `/proc/<pid>/ns/` 目录下，通过一些软链接，记录了进程所属的 namespace ID 。如下：
  ```sh
  [root@CentOS ~]# ll /proc/1/ns
  total 0
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 ipc -> ipc:[4026531839]
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 mnt -> mnt:[4026531840]
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 net -> net:[4026531956]
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 pid -> pid:[4026531836]
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 user -> user:[4026531837]
  lrwxrwxrwx. 1 root root 0 Mar 26 13:25 uts -> uts:[4026531838]
  ```
  - 如果两个进程的某种 namespace ID 相同，则说明属于这种类型的同一个 namespace 实例。
  - 创建子进程时，默认继承父进程的 namespace 实例。

- 相关 API ：
  ```c
  #include <sched.h>

  int clone(int (*child_func)(void *), void *child_stack, int flags, void *arg);
      // 创建一个子进程，并创建指定类型的 namespace ，让子进程加入其中
      // child_func   ：子进程要运行的函数
      // child_stack  ：子进程使用的栈空间
      // flags        ：一种或多种 namespace 的 flag ，比如 flags = CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUSER
      // args         ：传给子进程的参数

  int setns(int fd, int nstype);
      // 让当前进程加入已存在的 namespace
      // fd     ：一个 namespace 的文件描述符
      // nstype ：用于检查 fd 指向的 namespace 类型，填 0 则不检查

  int unshare(int flags);
      // 根据 flags 创建新的 namespace ，然后让当前进程加入其中。这会先离开已加入的同类型 namespace
  ```

### Cgroup

- Docker 基于 Linux Cgroup 技术限制各个容器占用的 CPU、内存等系统资源。
  - 在 Cgroup 技术之前，通常通过 ulimit 命令限制 shell 终端占用的系统资源，但功能较少。

- Cgroup 的版本：
  - v1
    - [官方文档](https://www.kernel.org/doc/Documentation/cgroup-v1/)
    - 本文采用该版本。
  - v2
    - 将所有 subsystem 都关联到一个 unified hierarchy 中。
    - 同一个 subsystem 不能同时关联 v1 和 v2 版本的 hierarchy 。
    - 只允许在根节点、叶子节点创建 cgroup 。

#### 主要概念

- task
  - ：代表一个进程。
- cgroup
  - ：控制组，包含一组进程。
  - cgroup 的最小管理单位是进程，不能管理进程中的某个线程。
  - 创建子进程时，默认继承父进程的 cgroup 。但是创建之后，修改父进程或子进程的 cgroup ，不再相互影响。
- hierarchy
  - ：层级，是由多个 cgroup 实例以目录树的形式组成，又称为 cgroup 树。
  - 通过挂载文件系统的方式，创建 hierarchy 。
    - 一般将 hierarchy 挂载在 `/sys/fs/cgroup/` 目录下。
    - 通过在 hierarchy 目录下创建、删除子目录的方式，创建、删除 cgroup 节点。
    - cgroup 子节点默认继承父节点的属性。
    - 如果一个 cgroup 节点不包含任何进程，也没有子节点，则称为空节点，允许被删除。
    - 创建 hierarchy 时，根路径下的 cgroup 节点是第一个创建的节点，称为 root cgroup 。
  - 每个进程同时可以存在于多个 hierarchy 中。
    - 在同一个 hierarchy 中，每个进程同时只能属于一个 cgroup ，但可以切换到其它 cgroup 。
- subsystem
  - ：资源控制器（Resource Controller）。
  - 通过将 subsystem 关联到 hierarchy 的方式，控制 cgroup 内进程占用的系统资源。
    - 每个 subsystem 同时只能关联一个 hierarchy 。
    - 每个 hierarchy 同时可以关联多个 subsystem 。
  - subsystem 分为多种类型：
    ```sh
    pids        # 限制、统计进程总数，包括 Cgroup 当前节点及其子节点

    cpu         # 限制 CPU 使用量
    cpuacct     # 统计 CPU 使用量
    cpuset      # 只允许使用 CPU 的指定核

    memory      # 统计、限制内存的使用量

    blkio       # 限制对块设备的 IO 速度
    devices     # 控制能否访问设备
    freezer     # 暂停或恢复进程
    hugetlb     # 限制 huge page 的使用量
    perf_event  # 允许进程被 perf 命令监控

    net_prio    # 设置对网络接口的访问优先级
    net_cls     # 通过等级识别符 (classid) 标记进程发出的网络数据包，便于被 iptables 等工具统计
    ```
    每种 subsystem 通过读写一组文件来实现配置，例如：
    ```sh
    pids.max                  # 限制进程总数，取值为 max 则不限制
    pids.current              # 记录当前的进程总数

    cpu.cfs_period_us         # 设置一个周期的长度，单位为 us ，取值范围为 1ms ~ 1s
    cpu.cfs_quota_us          # 限制每个周期内占用 CPU 的最大时长。取值至少为 1ms ，如果取值为 -1 则不限制
    cpu.shares                # 设置与其它 cgroup 抢占 CPU 时的权重，取值范围为 1 ~ 1024

    memory.limit_in_bytes     # 限制进程最大的内存使用量，取值为 -1 则不限制
    memory.usage_in_bytes     # 记录进程当前的内存使用量
    memory.oom_control        # 取值为 0 时，如果进程的内存使用量超过限制，则通过 OOM 杀死进程。取值为 1 时，禁用 OOM-killer ，只是暂停进程
    ```

#### 查看

- 例：查看指定进程的 cgroup 信息
  ```sh
  [root@CentOS ~]# cat /proc/$$/cgroup
  11:memory:/user.slice
  10:cpuset:/
  9:cpuacct,cpu:/user.slice
  8:hugetlb:/
  7:net_prio,net_cls:/
  6:devices:/user.slice
  5:freezer:/
  4:blkio:/user.slice
  3:pids:/user.slice
  2:perf_event:/
  1:name=systemd:/user.slice/user-1000.slice/session-3785.scope
  ```
  - 每行的三个字段分别表示：
    - cgroup ID 。
    - cgroup 绑定的所有 subsystem 的名称，用逗号分隔。
      - `name=systemd` 表示没有绑定 subsystem ，只是定义了名称。
    - 进程在 cgroup 树中的路径。
      - 这是对于挂载点的相对路径，以 / 开头。
  - 对于 Cgroup v2 ，每行总是显示成 `0::<PATH>` 的格式。

- 例：查看系统的所有 subsystem
  ```sh
  [root@CentOS ~]# cat /proc/cgroups
  #subsys_name    hierarchy       num_cgroups     enabled
  cpuset          10              5               1
  cpu             9               71              1
  cpuacct         9               71              1
  memory          11              71              1
  devices         6               71              1
  freezer         5               5               1
  net_cls         7               5               1
  blkio           4               71              1
  perf_event      2               5               1
  hugetlb         8               5               1
  pids            3               71              1
  net_prio        7               5               1
  ```
  - 四列分别表示 subsystem 的：
    - 名称
    - 关联的 hierarchy ID
    - 关联的 cgroup 中的进程数
    - 是否启用

#### 创建

创建 Cgroup 的示例：
1. 通过挂载文件系统的方式，创建 hierarchy ：
    ```sh
    mkdir -p /cgroup/hierarchy_1

    # 挂载一个 cgroup 类型的虚拟文件系统，作为 hierarchy ，命名为 hierarchy_1 。默认关联所有 subsystem
    # mount -t cgroup hierarchy_1 /cgroup/hierarchy_1

    # 可以通过 -o 选项传入一些参数，这里是只关联指定的 subsystem
    # mount -t cgroup -o cpuset,cpuacct hierarchy_1 /cgroup/hierarchy_1

    # 挂载 hierarchy ，关联的 subsystem 为空
    mount -t cgroup -o none,name=subsystem_1  hierarchy_1  /cgroup/hierarchy_1
    ```
    - 如果使用的 subsystem 已经被关联，则挂载 hierarchy 时会报错：
      ```sh
      mount: hierarchy_1 is already mounted or /cgroup/hierarchy_1 busy
      ```
    - 删除 hierarchy 的命令：
      ```sh
      umount      /cgroup/hierarchy_1
      /bin/rm -r  /cgroup/hierarchy_1
      ```

2. hierarchy 在挂载之后会自动创建 root cgroup 节点，生成一些默认文件。如下：
    ```sh
    [root@CentOS ~]# cd /cgroup/hierarchy_1
    [root@CentOS /cgroup/hierarchy_1]# ll
    total 0
    -rw-r--r--. 1 root root 0 Mar 26 17:17 cgroup.clone_children  # 文件内容默认为 0 。如果为 1 ，则创建子节点时会拷贝当前节点的 cpuset subsystem 配置
    --w--w--w-. 1 root root 0 Mar 26 17:17 cgroup.event_control
    -rw-r--r--. 1 root root 0 Mar 26 17:17 cgroup.procs           # 记录该 cgroup 关联的所有进程，每行一个 PID
    -r--r--r--. 1 root root 0 Mar 26 17:17 cgroup.sane_behavior
    -rw-r--r--. 1 root root 0 Mar 26 17:17 notify_on_release      # 文件内容默认为 0 。如果为 1 ，则 cgroup 退出时会执行 release_agent
    -rw-r--r--. 1 root root 0 Mar 26 17:17 release_agent          # 该文件只存在于 root cgroup 中，包含一些 cgroup 退出时需要执行的命令
    -rw-r--r--. 1 root root 0 Mar 26 17:17 tasks                  # 与 cgroup.procs 类似，记录进程中主线程的 TID ，即与 PID 一致
    [root@CentOS /cgroup/hierarchy_1]# head cgroup.procs          # root cgroup 默认包含系统的所有进程
    1
    2
    4
    6
    7
    8
    9
    10
    11
    12
    ```

3. 在 hierarchy 目录下添加 cgroup 节点：
    ```sh
    [root@CentOS /cgroup/hierarchy_1]# mkdir cgroup_1             # 创建一个 cgroup 子节点，这会自动生成一些默认文件
    [root@CentOS /cgroup/hierarchy_1]# cd cgroup_1/
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# ll
    total 0
    -rw-r--r--. 1 root root 0 Mar 26 17:35 cgroup.clone_children
    --w--w--w-. 1 root root 0 Mar 26 17:35 cgroup.event_control
    -rw-r--r--. 1 root root 0 Mar 26 17:35 cgroup.procs
    -rw-r--r--. 1 root root 0 Mar 26 17:35 notify_on_release
    -rw-r--r--. 1 root root 0 Mar 26 17:35 tasks
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat cgroup.procs  # 非 root cgroup 的节点，默认不包含任何进程
    ```

4. 在 cgroup 节点中增加进程：
    ```sh
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# echo 1 >> cgroup.procs   # 向该 cgroup 分组加入一个进程，这会自动将该进程移出之前的 cgroup
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat cgroup.procs
    1
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# head ../cgroup.procs
    2
    4
    6
    7
    8
    9
    10
    11
    12
    13
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat ../cgroup.procs >> cgroup.procs # 每次只能加入一个 PID
    cat: write error: Argument list too long
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# echo 3 >> cgroup.procs              # 不能加入不存在的进程的 PID
    -bash: echo: write error: No such process
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# echo > cgroup.procs                 # 只能在 cgroup 中加入进程，不支持删除进程
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat cgroup.procs
    1
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# echo $$ > cgroup.procs  # 加入当前终端的 PID
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat cgroup.procs
    1
    4593
    6121                                                                # 终端执行命令时创建了子进程，因此也加入了其 PID
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# echo $$ > cgroup.procs  # 加入 PID 时，会自动排序、去重、去掉不存在的 PID
    [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cat cgroup.procs
    1
    4593
    6160
    ```
    - 非 root 用户只能修改自己进程所属的 cgroup 。
    - 非空节点的 cgroup 不允许被删除：
      ```sh
      [root@CentOS /cgroup/hierarchy_1/cgroup_1]# cd ..
      [root@CentOS /cgroup/hierarchy_1]# /bin/rm -r cgroup_1/
      /bin/rm: cannot remove ‘cgroup_1/cgroup.clone_children’: Operation not permitted
      /bin/rm: cannot remove ‘cgroup_1/cgroup.event_control’: Operation not permitted
      /bin/rm: cannot remove ‘cgroup_1/notify_on_release’: Operation not permitted
      /bin/rm: cannot remove ‘cgroup_1/cgroup.procs’: Operation not permitted
      /bin/rm: cannot remove ‘cgroup_1/tasks’: Operation not permitted
      ```

#### libcgroup-tools

：一个查看、配置 Cgroup 的工具包。
- 安装：`yum install -y libcgroup-tools`
- 命令：
  ```sh
  lscgroup        # 显示本机的所有 cgroup
  ```
  ```sh
  lssubsys        # 显示已挂载的 subsystem
          -a      # 显示所有 subsystem
          -m      # 增加显示每个 subsystem 的挂载点
          -i      # 增加显示每个 subsystem 关联的 hierarchy ID
  ```
  ```sh
  cgdelete [<controllers>:<path>]...  # 删除 cgroup
  ```
- 例：
  ```sh
  [root@CentOS ~]# lscgroup
  ...
  cpu,cpuacct:/               # 每行的格式为 <controllers>:<path> ，即 subsystem 的类型、cgroup 在 hierarchy 下的相对路径
  cpu,cpuacct:/docker
  cpu,cpuacct:/docker/baf31e1d1a0b055b7f7d9947ec035d716a2d7788ee47473f85f9f4061633fabe
  cpu,cpuacct:/docker/ba919a1393fbd560291ec8dd28eedf12b1e6ce4f0c1ab4df04d929074a436661
  cpu,cpuacct:/user.slice
  cpu,cpuacct:/system.slice
  cpu,cpuacct:/system.slice/iptables.service
  cpu,cpuacct:/system.slice/run-user-1000.mount
  cpu,cpuacct:/system.slice/crond.service
  cpuset:/
  cpuset:/docker
  cpuset:/docker/baf31e1d1a0b055b7f7d9947ec035d716a2d7788ee47473f85f9f4061633fabe
  cpuset:/docker/ba919a1393fbd560291ec8dd28eedf12b1e6ce4f0c1ab4df04d929074a436661
  name=subsystem_1:/
  ```

### layer

- Docker 容器内采用联合挂载（Union mount）技术挂载多层文件系统（file system layer）。
  - mount 命令会让挂载的文件系统覆盖挂载点，而 Union mount 会让挂载的文件系统与挂载点合并：路径不同的文件会混合，路径相同的文件会覆盖。
  - 使用 Union mount 合并多层文件系统时，只有最上层的那个文件系统为读写模式（称为 top layer），其它文件系统都为只读模式。
    - 用户在容器内创建、修改的任何文件，都保存在 top layer 中。
    - 比如用户要修改 /etc/hosts 文件，而该文件存储在 read-only layer 中，则内核会自动将该文件拷贝到 top layer 中，供用户修改。这一特性称为 COW（copy-on-write）。
  - 支持 Union mount 的文件系统称为 Union Filesystem ，比如 UnionFS、AUFS、OverlayFS 等。
- 启动 Docker 容器时，会先根据 Docker 镜像创建一个只读模式的 RootFS 文件系统，包含 /bin、/dev、/home 等 FHS 标准目录。
  - 然后在它上面挂载一个读写模式的文件系统，内容为空，不包含任何文件，供用户修改文件。
