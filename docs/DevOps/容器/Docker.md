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
  - 例如：不同 pid namespace 中的进程可以分配相同的 PID 。

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

- 相关的内核 API ：
  ```c
  #include <sched.h>

  int clone(int (*child_func)(void *), void *child_stack, int flags, void *arg);
      // 创建一个子进程，并创建指定类型的 namespace ，然后将子进程加入其中
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


## 容器

- 用户创建一个容器时，必须指定一条启动命令（如果有默认配置则无需指定）。
  - 默认由启动命令对应的进程担任容器内的 1 号进程。
  - 容器启动之后，用户可以进入容器内终端，执行任意命令，启动其它进程。
  - 一旦容器的 1 号进程退出（或者不在前台运行），dockerd 就会杀死容器内所有进程，使得整个容器停止运行。
  - 为了让容器保持运行，容器的启动命令应该在前台运行，且能够一直保持运行，比如 `tail -f /dev/null` 。

- 容器的生命周期：
  ```sh
  Creat     # 创建。此时容器被 dockerd 分配了 CPU 、内存等资源，创建了根目录文件系统
  Up        # 运行中
  Exit      # 停止。此时容器占用的资源被释放，但文件系统保留不变
  Restart   # 重启。此时容器重新被分配资源，但依然使用之前的文件系统，重新执行启动命令
  Delete    # 被删除。此时容器占用的资源被释放，文件系统也被删除。最终消失不见，在 dockerd 中不能查询到该容器
  ```

### 启动

```sh
docker run <image>              # 运行一个镜像，这会创建一个容器（如果本机不存在该镜像，则会自动从镜像仓库下载该镜像）
            -i                  # 启用容器的 stdin
            -t                  # 创建一个伪终端绑定到容器的 stdin 上，供用户操作
            -d                  # 以 daemon 方式运行

            --name <name>       # 设置容器的名字
            --workdir <path>    # 指定容器的工作目录
            --init              # 使用 init 进程作为容器的 1 号进程（它会照样执行容器的启动命令）
            --rm                # 当容器终止时，自动删除它

            -p 80:8000                # 将宿主机的端口 80 映射到容器的端口 8000（可重复使用该命令选项）
            -p 127.0.0.1:80:8000      # 将宿主机指定网卡的端口 80 映射到容器的端口 8000
            -P                        # 从宿主机上随机选取端口映射到容器暴露的所有端口
            --network <network>       # 将容器连接到指定的 docker 网络（启用该命令选项时，-p 选项会失效）

            -e PATH=$PATH:/root       # 设置环境变量（可重复使用该命令选项）

            -v /root:/root            # 将宿主机的 /root 路径挂载到容器的 /root 路径（可重复使用该命令选项）
            -v volume_1:/root         # 将宿主机的 volume_1 数据卷挂载到容器的 /root 路径
            -v /etc/localtime:/etc/localtime:ro   # 限制容器对挂载路径只有读取权限

            # 设置容器的重启策略，即当容器处于 stopped 状态时，是否通过 docker start 重启
            --restart no              # 总是不会自动重启
            --restart on-failure      # 当容器异常终止时（不包括 dockerd 重启的情况），才会自动重启
            --restart unless-stopped  # 当容器终止时，就自动重启，除非容器是被 docker stop 了
            --restart always          # 当容器终止时，总是会自动重启（即使被 docker stop 了，当 dockerd 重启时又会自动重启该容器）

            # 限制容器占用的 CPU、内存
            --cpus 2                  # 限制该容器最多使用 2 个 CPU（平均值）
            --cpu-shares 1024         # 与其它容器抢占 CPU 时的权重（取值为 1~1024）
            -m 256m                   # 限制最多使用的内存量（超过该值的 2 倍时就会被 OOM 杀死）

            --privileged              # 特权模式，允许在容器内访问所有设备文件，比如挂载磁盘，甚至可以在容器内运行嵌套的容器
```
- 例：
  ```sh
  docker run hello-world                   # 运行一个测试镜像
  docker run -it centos:7 bash             # 创建容器，并进入该容器的终端
  docker run -d centos:7 tail -f /dev/null # 创建一个容器（让它执行一个不会停止的启动命令）
  ```
- 运行嵌套容器的示例：
  ```sh
  docker run -d --name dind --privileged docker:dind  # dind 镜像代表 docker in docker ，内置了 dockerd
  docker exec -it dind sh                             # 进入 dind 容器
  docker run -d nginx                                 # 在 dind 容器内运行嵌套的容器
  ps auxf                                             # 查看此时的进程树
  ```

### 管理

```sh
docker
      ps                      # 显示所有 running 状态的容器
          -a                  # 显示所有状态的容器
          -n <int>            # 显示最后创建的几个容器（包括所有状态的）
          --no-trunc          # 不截断过长的显示内容
          -q                  # 只显示 ID
          -s                  # 增加显示容器占用的磁盘空间

      stop    <container>...  # 暂停容器的运行，容器会变成 stopped 状态
      start   <container>...  # 启动容器，容器会从 stopped 状态变为 running 状态
      restart <container>...  # 重启容器（相当于先 stop 再 start）
      rm      <container>...  # 删除容器（只能删除 stopped 状态的）
          -f                  # 强制删除（可以删除 running 状态的）
      container prune         # 删除所有 stopped 状态的容器

      rename  <container> <new_name>  # 重命名容器
      update  <container>...  # 更改容器的配置
          --restart no
          --cpus 2
          -m 256m

      stats                   # 显示所有容器的资源使用情况
      inspect <object>        # 显示一个 Docker 对象的详细信息
```
- 管理容器、镜像、数据卷、网络等对象时，可以以 ID 或 Name 作为标识符，指定某个对象。
  - ID   ：是一串十六进制数，有 64 位长。允许用户只用开头少量几位就指定一个对象，只需要与其它 ID 不重复。
  - Name ：通常由几个英文单词组成。可以由 dockerd 自动分配，也可以由用户自定义。
  - 每个对象在创建之后，不支持修改其 ID 或 Name 。
- 例：
  ```sh
  docker ps -a
  docker stop `docker ps -aq` # 停止所有容器
  ```

### 日志

```sh
docker logs <container>   # 显示一个容器的日志
          --tail 10       # 显示最后几行
          -f              # 保持显示
          -t              # 显示时间戳
```
- dockerd 会记录容器内 1 号进程的 stdout、stderr ，作为该容器的日志。
  - 将其它进程的日志文件重定向到 /proc/1/fd/1、/proc/1/fd/2 ，就会一起记录到容器的日志中。
  - 例如， Nginx 的官方镜像中重定向了其日志文件：
    ```sh
    ln -sf /dev/stdout /var/log/nginx/access.log
    ln -sf /dev/stderr /var/log/nginx/error.log
    ```

#### 日志驱动器

dockerd 会通过日志驱动器（logging driver）保存容器的日志。
- 常见的几种如下：
  - nong ：不保存日志。
  - local
    - 将日志按文本格式保存在宿主机的 `/var/lib/docker/containers/{ContainerId}/local-logs/container.log` 文件中。
  - json-file
    - 默认启用，但不会进行日志切割。
    - 将日志按 JSON 格式保存在宿主机的 `/var/lib/docker/containers/{ContainerId}/{ContainerId}-json.log` 文件中。如下：
      ```sh
      [root@CentOS ~]# tail -n 1 /var/lib/docker/containers/3256c21887f9b110e84f0f4a620a2bf01a8a7b9e3a5c857e5cae53b22c5436d4/3256c21887f9b110e84f0f4a620a2bf01a8a7b9e3a5c857e5cae53b22c5436d4-json.log
      {"log":"2021-02-22T03:16:15.807469Z 0 [Note] mysqld: ready for connections.\n","stream":"stderr","time":"2021-02-22T03:16:15.80758596Z"}
      ```
    - 使用 docker logs 命令查看日志时，只会显示其 log 字段的值。
  - syslog
  - journald
  - fluentd
- 同时只能启用一种日志驱动器。
- 可以在启动容器时配置日志驱动器：
  ```sh
  docker run -d \
        --log-driver json-file \    # 选择日志驱动器的类型
        --log-opt max-size=10m \    # 日志文件超过 10MB 时切割一次
        --log-opt max-file=3 \      # 最多保留 3 份切割日志
        nginx
  ```
- 也可以在 daemon.json 中配置日志驱动器，但需要重启 dockerd 才会生效， 而且只会对新创建的容器生效。

### 执行命令

```sh
docker exec [options] <container> <command>  # 在容器内执行一条命令
```
- 这样可以在宿主机上让容器执行命令，不必进入容器的终端。执行后产生的 stdout 会打印到宿主机的当前终端，但是不会接收宿主机的 stdin ，在宿主机上按 Ctrl + C 不能发送关闭信号到容器内。
- 例：
  ```sh
  docker exec -it centos1 bash    # 在容器内创建终端并进入
  ```

### 拷贝文件

```sh
docker cp   /root/f1                <container>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp   <container>:/root/f1    /root/                # 从容器拷贝文件到宿主机的指定目录
```
- 拷贝当前目录时不能使用 `docker cp *` ，要使用 `docker cp .` 。而且不必加上 -a 选项就可以递归拷贝。

### 数据卷

```sh
docker volume
            ls                # 显示所有的 docker 数据卷
            inspect <volume>  # 查看数据卷的详细信息
            create  <volume>  # 创建一个数据卷
            rm      <volume>  # 删除一个数据卷
            prune             # 删除所有未使用的数据卷
```
- 如果将宿主机的某个路径或数据卷，挂载到容器内的某个路径，则容器被删除之后该路径下的文件也会一直保存在宿主机上，从而持久保存数据。
- 挂载宿主机的路径时：
  - 如果该宿主机路径不存在，则会自动创建它再挂载。
    - 默认是创建一个符合宿主机路径的目录。例如想用 `-v /root/f1:/root/f1` 挂载一个文件时，会在宿主机上创建一个路径为 `/root/f1` 的目录再挂载。
    - 默认以 root 用户创建。如果容器内应用以非 root 用户启动，则对于挂载路径可能没有访问权限，此时需要先在宿主机上修改其文件权限，再重启容器。
- 挂载数据卷时：
  - 实际上是先在宿主机的 `/var/lib/docker/volumes/<volumeID>/` 目录下创建一个 _data 目录，再将它挂载到容器中。
    - 会自动给 _data 目录分配合适的文件权限，供容器内应用访问。
  - 一个数据卷可以被多个容器共用，一个容器也可以挂载多个数据卷。
- 一些经常挂载的文件：
  ```sh
  /etc/hosts
  /etc/passwd             # 让容器采用宿主机的用户名、uid
  /etc/localtime          # 让容器采用宿主机的时区
  /var/run/docker.sock    # 允许在容器内与 dockerd 通信，可以执行 docker ps 等命令
  ```

### 网络

```sh
docker network
              ls                  # 显示所有的 docker 网络
              inspect <network>   # 查看一个网络的详细信息
              create  <network>   # 创建一个网络（bridge 类型），这会创建一个对应的虚拟网卡
              rm      <network>   # 删除一个网络
              prune               # 删除所有没有使用的网络

              connect     <network> <container>   # 将一个网络连接到指定容器
              disconnect  <network> <container>   # 取消连接
```

- docker 安装之后会创建三个 docker 网络：
  - bridge ：一个虚拟网络，使用一个名为 docker0 的虚拟网卡。
  - host ：使用宿主机的 eth 网卡。
  - none ：一个被隔离的网络，只能使用 lo 网卡。
- 创建一个容器时，默认会给该容器创建一个虚拟网卡，名称以 veth 开头，并分配一个虚拟 IP 。
  - 各个容器的虚拟网卡之间默认网络隔离，比如尝试其它容器的 IP ，会报错 `No route to host` 。
  - 从容器内可以访问到容器外，比如 ping 宿主机的 IP 、其它主机的 IP 。但从容器外默认不能访问到容器内，比如 ping 容器的虚拟 IP 。
    - 在容器内监听端口时，是监听其虚拟网卡上的 Socket ，因此默认不能从容器外访问到该端口。
  - 创建容器的默认配置包括 `docker run --network bridge` ，因此会将容器的虚拟网卡连接到 bridge 网络的 docker0 网卡。

- 让容器内端口可以被容器外访问的三种方案：
  - 将容器内端口映射到宿主机的 eth 网卡上的端口。
    - 比如执行 `docker run -p 80:80` ，此时 dockerd 会自动添加 iptables 规则，将宿主机 80 端口收到的 TCP 流量转发到容器的 80 端口。
    - 缺点：
      - 此时宿主机的防火墙会暴露 80 端口，允许被任意外部 IP 访问。
      - 此时从一个容器中不能访问到另一个容器映射的端口，因为 iptables 规则不会转发该流量。
      - 这样自动添加的 iptables 规则很复杂，不建议手动修改，否则可能会出错。如果出错，可以尝试重启 dockerd ，让它重新配置 iptables 。
  - 让容器连接到 host 网络，从而使用宿主机的 eth 网卡，而不是自己的虚拟网卡。
    - 比如执行 `docker run --network host` ，这样当容器内的服务监听端口时，是监听 eth 网卡上的 Socket ，因此可以被外部 IP 访问。
  - 如果几个容器连接到同一个 bridge 类型的网络，就可以在一个容器内访问到其它容器的 IP 、所有端口。
    - 此时可以使用容器的名字作为目标主机，比如执行 `ping mysql` 时会自动将容器名 mysql 解析成该容器的 IP 。

- 例：创建几个容器
  ```sh
  [root@Centos ~]# docker run -d --name test1 --network host nginx
  9c1c537e8a304ad9e4244e3c7ae1743b88d45924b7b48cbb0a9f63606c82d76d
  [root@Centos ~]# docker run -d --name test2 -p 2080:80 nginx
  4601a81b438e31e5cb371291e1299e4c5333e853a956baeb629443774a066e9c
  ```
  在宿主机上可以访问各个容器映射的端口：
  ```sh
  [root@Centos ~]# curl -I 127.0.0.1:80
  HTTP/1.1 200 OK
  ...
  [root@Centos ~]# curl -I 127.0.0.1:2080
  HTTP/1.1 200 OK
  ...
  ```
  在容器内不能访问另一个容器映射到宿主机的端口，除非源容器或目标容器使用宿主机的网卡。也就是说，映射端口的容器只能与宿主机直接通信，不能与其它容器间接通信。如下：
  ```sh
  [root@Centos ~]# docker exec -it test1 curl -I 10.0.0.1:80
  HTTP/1.1 200 OK
  ...
  [root@Centos ~]# docker exec -it test1 curl -I 10.0.0.1:2080
  HTTP/1.1 200 OK
  ...
  [root@Centos ~]# docker exec -it test2 curl -I 10.0.0.1:80
  HTTP/1.1 200 OK
  ...
  [root@Centos ~]# docker exec -it test2 curl -I 10.0.0.1:2080
  curl: (7) Failed to connect to 10.0.0.1 port 2080: No route to host
  ```

### 最佳实践

- 每个容器内应该只运行一个应用，使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
- 当用户主动终止容器时，容器的 1 号进程要负责清理容器内的所有进程。如果 1 号进程只是个 shell 脚本，或者容器内运行了多个进程组，则容易清理不干净，留下僵尸进程。此时建议使用 init 作为 1 号进程，保证清理成功。
- 尽量创建无状态容器：不将数据存储在容器内，因此可以随时销毁容器，从镜像重新创建与其一致的容器，而不必担心数据丢失。
- 建议采用以下方案来存储容器的数据：
  - 挂载目录，将文件存储到容器外。
  - 将数据存储到容器外的数据库中。

## 镜像

- 每个镜像有两种标识符：
  - `image ID` ：由 dockerd 随机分配的编号。
  - `imageName:tag` ：镜像名与标签的组合，由用户自定义，通常将 tag 用于表示镜像的版本号。
- dockerd 使用的镜像都存储在宿主机上，也可以将镜像存储到镜像仓库服务器中。
  - 默认使用的是官方的镜像仓库 hub.docker.com ，也可以使用自己搭建的仓库服务器，比如 harbor 。
- 悬空镜像（dangling images）：一些只有 ID 的镜像，没有镜像名和标签（而是名为 `<none>:<none>` ），也没有被容器使用。

### 查看

```sh
docker image
            ls              # 显示本机的镜像（默认不显示悬空镜像）。等价于 docker images 命令
                -a          # 显示所有的镜像
            rm <image>...   # 删除镜像（只能删除未被容器使用的）
            prune           # 删除所有悬空镜像
                -a          # 删除所有未被容器使用的镜像
```

### 拉取

```sh
docker
      pull    <imageName>:<tag>     # 从镜像仓库拉取镜像
      push    <imageName>:<tag>     # 推送镜像到镜像仓库
      search  <imageName>           # 在镜像仓库中搜索某个镜像
      login -u leo tencentyun.com   # 使用一个用户名登录一个镜像仓库（然后会提示输入密码）
      tag <image> <imageName>:<tag> # 给镜像加上名称和 tag ，可以多次添加
```
- 如果不注明镜像的 tag ，则默认拉取 latest 版本。
  - 尽量不要拉取 latest 版本，否则在不同时间拉取的 latest 版本可能不一样。

### 导出

- Docker 镜像由一层或多层文件系统组成，在宿主机上存储为一些零散的文件。
- 可以将镜像导出成压缩包：
  ```sh
  docker save -o images.tar <image>...        # 将镜像打包成 tar 文件
  docker save <image>... | gzip > images.tgz  # 打包并压缩
  
  docker load -i images.tar                   # 导入镜像
  ```
- 例：
  ```sh
  [root@Centos ~]# docker save -o nginx.tar nginx:latest
  [root@Centos ~]# ls -lh
  total 131M
  -rw-------. 1 root root 131M Mar 28 16:04 nginx.tar
  [root@Centos ~]# tar -tf nginx.tar
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/           # 每个目录对应一层 layer
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/VERSION
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/json
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/layer.tar  # layer 包含的文件
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/VERSION
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/json
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/layer.tar
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/VERSION
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/json
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/layer.tar
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/VERSION
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/json
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/layer.tar
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/VERSION
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/json
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/layer.tar
  b8cf2cbeabb915843204ceb7ef0055fecadd55c2b0c58ac030e01fe75235885a.json
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/VERSION
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/json
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/layer.tar
  manifest.json                                                               # 镜像的配置文件，记录了镜像名、各个 layer 的位置
  repositories
  ```

### 制作

制作 Docker 镜像的方法主要有两种：
- 将一个容器提交为镜像：
    ```sh
    docker commit <container> <imageName>:<tag>
    ```
  - 每次 commit 时，会在原镜像外部加上一层新的文件系统。因此 commit 次数越多，镜像的体积越大。

- 编写 Dockerfile 文件，然后基于它构建镜像：
    ```sh
    docker build <dir_to_Dockerfile> -t <imageName:tag>
                --build-arg VERSION="1.0"   # 传入构建参数给 Dockerfile
                --target  <stage>           # 构建到某个阶段就停止
                --network <name>            # 设置 build 过程中使用的网络
                --no-cache                  # 构建时不使用缓存
    ```
  - 例：
    ```sh
    docker build . -t centos:v1.0 --network host
    ```
  - 执行 docker build 命令时，会将 Dockerfile 所在目录及其子目录的所有文件作为构建上下文（build context），拷贝发送给 dockerd ，从而允许用 COPY 或 ADD 命令拷贝文件到容器中。
    - 可以在 `.dockerignore` 文件中声明不想被发送的文件。
