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

- 配置 dockerd 时，需要创建 `/etc/docker/daemon.json` 文件，然后重启 dockerd 。


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
  - 相关的内核 API ：
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

- 相关的内核 API ：
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

### layer

- Docker 容器内采用联合挂载（Union mount）技术挂载多层文件系统（file system layer）。
  - mount 命令会让挂载的文件系统覆盖挂载点，而 Union mount 会让挂载的文件系统与挂载点合并：路径不同的文件会混合，路径相同的文件会覆盖。
  - 使用 Union mount 合并多层文件系统时，只有最上层的那个文件系统为读写模式（称为 top layer），其它文件系统都为只读模式。
    - 用户在容器内创建、修改的任何文件，都保存在 top layer 中。
    - 比如用户要修改 /etc/hosts 文件，而该文件存储在 read-only layer 中，则内核会自动将该文件拷贝到 top layer 中，供用户修改。这一特性称为 COW（copy-on-write）。
  - 支持 Union mount 的文件系统称为 Union Filesystem ，比如 UnionFS、AUFS、OverlayFS 等。
- 启动 Docker 容器时，会先根据 Docker 镜像创建一个只读模式的 RootFS 文件系统，包含 /bin、/dev、/home 等 FHS 标准目录。
  - 然后在它上面挂载一个读写模式的文件系统，内容为空，不包含任何文件，供用户修改文件。

## 最佳实践

- 每个容器内应该只运行一个应用，使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
- 当用户主动终止容器时，容器的 1 号进程要负责清理容器内的所有进程。如果 1 号进程只是个 shell 脚本，或者容器内运行了多个进程组，则容易清理不干净，留下僵尸进程。此时建议使用 init 作为 1 号进程，保证清理成功。
- 尽量创建无状态容器：不将数据存储在容器内，因此可以随时销毁容器，从镜像重新创建与其一致的容器，而不必担心数据丢失。
- 建议采用以下方案来存储容器的数据：
  - 挂载目录，将文件存储到容器外。
  - 将数据存储到容器外的数据库中。

