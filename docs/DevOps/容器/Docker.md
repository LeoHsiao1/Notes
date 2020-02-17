# Docker

：目前最流行的容器引擎。
- 基于 Go 语言，运行在 Linux 平台上。也有 Docker for Windows 版本，只能运行 windows 上的应用程序。
- 于 2013 年被 Docker 公司推出，掀起了容器技术的潮流。
- 以镜像（image）作为模板，创建容器（container）。
- [官方文档](https://docs.docker.com/engine/docker-overview/)

## 原理

Docker 采用 C/S 工作模式。
- 服务器作为宿主机上的守护进程运行，称为 docker daemon 。
- 服务器负责管理本机的容器、镜像。
- 用户可以在宿主机上执行 docker 命令，作为客户端。这些命令会发送给服务器，由服务器执行。

**Docker 容器是在宿主机上运行一些进程，模拟出虚拟机的运行环境。**
- 通过 Linux namespace 隔离各个容器的运行环境。
  - 隔离了进程、网络、文件系统，接近于独享一个虚拟机环境。
  - 没有隔离物理资源。例如：一个容器可能占用全部的 cpu 和内存；在容器内执行 top 命令会看到整个宿主机的资源。
  - 没有隔离 Linux 内核，容器内的进程可能通过内核漏洞溢出到宿主机上。
- 通过 Linux cgroups 限制进程组使用的 CPU、内存等资源。

使用 Docker 容器的推荐做法：
- 每个容器内应该只运行一个应用，尽量使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
  <br>因此，不要在容器内用 supervisor 等工具启动多个进程。
- 创建无状态容器，这样不必担心数据丢失。
  <br >无状态容器：不将数据存储在容器内，因此可以随时关闭、重启容器，而不必担心数据丢失。
- 创建容器之后不要修改它，这样随时可以从镜像重新创建容器。
- 存储数据的方案：
  - 挂载目录，将文件存储到容器外。
  - 将数据存储到容器外的数据库中。

## 安装

- 在 Centos 上安装：
    ```sh
    yum install yum-utils       # 安装 yum-config-manager
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加 docker 的官方镜像源
    yum install docker-ce       # 下载 docker 社区版
    systemctl start docker      # 启动 docker daemon
    systemctl enable docker     # 使 docker 开机自启
    ```

- 在 ubuntu 上，可使用官方脚本自动安装：
    ```sh
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    ```

## 容器

容器是一个根据镜像运行起来的虚拟主机环境，至少包含一个进程组。
- 每个容器都有一个由 Docker 自动分配的 ContainerID（一串编号），用户也可以自定义容器名。
  - 通过 ContainerID 或 ContainerName 可以指定一个唯一的 Container 。
- 当容器内的进程都停止时，容器就会从 running 状态变成 stopped 状态。此时容器的文件依然会被 Docker 保留，可以再次启动。

### docker run

```sh
docker run <Image>            # 运行一个镜像，这会创建一个容器（如果本机不存在该镜像，则会自动从镜像仓库下载该镜像）
            -i                # 启用容器的 stdin
            -t                # 创建一个伪终端绑定到容器的 stdin 上，供用户操作
            -d                # 让容器在后台运行
            
            --name <name>     # 设置容器的名字
            --workdir <path>  # 指定容器的工作目录
            --init            # 使用 init 作为容器的 1 号进程（它会照常执行容器的启动命令）
            --rm              # 当容器终止时，自动删除它

            -p 80:8000               # 将宿主机的端口 80 映射到容器的端口 8000（可重复使用该命令选项）
            -p 127.0.0.1:80:8000     # 将宿主机指定网卡的端口 80 映射到容器的端口 8000
            -P                       # 从宿主机上随机选取端口映射到容器暴露的所有端口
            --network <网络名>       # 将容器连接到指定的 docker 网络

            -v /root:/app            # 将宿主机的 /root 目录挂载到容器的 /app 目录（可重复使用该命令选项）
            --mount source=volume1, target=/tmp # 将一个数据卷挂载到容器中的某个目录

            -e PATH=$PATH:/root      # 设置环境变量（可重复使用该命令选项）

            # 设置容器的重启策略
            --restart no             # 总是不会自动重启
            --restart on-failure     # 当容器异常终止时，才会自动重启（通过 docker start 重启）
            --restart unless-stopped # 当容器终止时，就自动重启，除非容器是被 docker stop 终止的
            --restart always         # 当容器终止时，总是会自动重启（即使被 docker stop 了，当 docker daemon 重启时又会自动重启该容器）

            # 限制容器占用的 CPU、内存
            --cpus 2                 # 限制该容器最多使用 2 个 CPU（平均值）
            --cpu-shares 1024        # 与其它容器抢占 CPU 时的权重（取值为 1~1024）
            -m 256m                  # 限制最多使用的内存量（超过该值的 2 倍时就会被 OOM 杀死）
```
- 例：
    ```sh
    docker run hello-world                       # 运行一个测试镜像
    docker run -it ubuntu:15.10 bash             # 创建容器，并进入该容器的终端
    docker run -d ubuntu:15.10 tail -f /dev/null # 创建一个容器（让它执行一个不会停止的启动命令）
    ```
- 默认由容器的启动命令作为容器中的 1 号进程。如果 1 号进程运行结束，容器就会立即终止。
  - 因此，容器的启动命令应该在前台运行，且能够一直保持运行，比如 `tail -f /dev/null`。
  - 当用户终止容器时，容器的 1 号进程要负责清理容器内的所有进程。如果 1 号进程只是个 shell 脚本，或者容器内运行了多个进程组，则容易清理不干净，留下僵尸进程。此时可以使用 init 作为 1 号进程，保证清理成功。
- 容器内不能再创建嵌套的容器，甚至不能联系到 docker daemon ，因此不能使用 docker 命令。
  - 可以将 /var/run/docker.sock 文件挂载到容器中，使得容器内的程序可以与 docker daemon 通信。

### docker exec

```sh
docker exec [options] <container> <command>  # 让容器执行一条命令
```

- 这样可以在宿主机上让容器执行命令，不必进入容器的终端。执行后产生的 stdout 会打印到宿主机的当前终端，但是不会接受宿主机的 stdin ，在宿主机上按 Ctrl + C 不能发送关闭信号到容器中。
- 例：
    ```sh
    docker exec -it centos1 bash    # 进入一个容器的终端
    ```

### 管理容器

```sh
docker 
        ps                  # 显示所有处于运行状态的容器
            -a              # 显示所有状态的容器
            -n <int>        # 显示最后创建的几个容器（包括所有状态的）
            --no-trunc      # 不截断过长的显示内容
        stop <容器>...      # 停止容器（会变成 stopped 状态）
        start <容器>...     # 启动 stopped 状态的容器
        restart <容器>...   # 重启容器（相当于先 stop 再 start）
        rm <容器>...        # 删除容器（只能删除 stopped 状态的）
            -f              # 强制删除（可以删除 running 状态的）
        container prune     # 删除所有 stopped 状态的容器

        rename <容器名> <新容器名>  # 重命名容器
        update <容器>...    # 更改容器的配置
            --restart no
            --cpus 2
            -m 256m

        inspect <name>      # 显示一个容器或镜像的详细信息
        logs <容器>         # 显示一个容器的日志（来自终端输出）
            --tail 10       # 显示最后几行
            -f              # 保持显示
            -t              # 显示时间戳
        stats               # 显示所有容器的资源使用情况
```

### docker cp

```sh
docker cp /root/f1 <容器>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp <容器>:/root/f1 /root/    # 从容器拷贝文件到宿主机的指定目录
```
- 拷贝当前目录时不能使用 docker cp * ，要使用 docker cp . 。而且不必加上 -a 选项就可以递归拷贝。

### docker volume

```sh
docker volume
            ls            # 显示所有的 docker 数据卷
            create <name> # 创建一个数据卷
            rm <name>     # 删除一个数据卷
```

- 将容器中产生的数据存储到数据卷中，可以持久化存储。如果遗留在容器中，当容器被删除时，容器中的数据也会消失。
- 一个数据卷可以被多个容器共用，一个容器也可以挂载多个数据卷。

### docker network

- docker 安装后会在宿主机上创建一个名为 docker0 的虚拟网卡。
  - 创建一个容器时，会自动在宿主机中创建一个名字以 veth 开头的虚拟网卡给它使用，并且连接到 bridge 网络，被分配一个 docker0 网卡下的私有 IP 地址。
- docker 安装后会自动创建三个 docker 网络：
  - bridge ：一个虚拟网络，使用 docker0 网卡，可以接入多个容器，连通它们的网络。
  - host ：使用宿主机的 eth 网卡。
  - none ：一个被隔离的网络，只能使用 lo 网卡。
- 如果几个容器连接到同一个 bridge 网络，就可以在一个容器中访问其它容器、访问所有端口（使用容器的名字作为目标主机）。例如：ping centos2
  - 默认创建的 bridge 不支持这样通信。
- 容器使用的是独立的虚拟网卡，容器内的网络端口并没有暴露给外部。采用以下方法才可以被外部访问：
  - 将容器端口映射到宿主机的真实网络端口。
  - 将容器连接到 host 网络，让容器使用宿主机的 eth 网卡，无需再映射端口。

命令：
```sh
docker network
            ls                       # 显示所有的 docker 网络
            create <name>            # 创建一个网络（bridge 类型）
            rm <name>                # 删除一个网络

            connect <name> <容器>    # 将一个网络连接到指定容器
            disconnect <name> <容器> # 取消连接

            inspect <name>           # 查看一个网络的详细信息
```
