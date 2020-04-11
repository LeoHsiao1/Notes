# Docker

：目前最流行的容器引擎。
- 基于 Go 语言，运行在 Linux 平台上。也有 Docker for Windows 版本，只能运行 windows 上的应用程序。
- 于 2013 年被 Docker 公司推出，掀起了容器技术的潮流。
- 以镜像（image）作为模板，创建容器（container）。
- [官方文档](https://docs.docker.com/engine/docker-overview/)

## 原理

- Docker 采用 C/S 工作模式。
  - 服务器作为宿主机上的守护进程运行，称为 docker daemon ，负责管理本机的容器、镜像。
  - 用户可以在宿主机上执行 docker 命令，作为客户端。这些命令会发送给服务器，由服务器执行。
- **Docker 容器是通过在宿主机上运行一些进程，模拟出一个虚拟机的运行环境。一个宿主机上可以同时运行多个 Docker 容器。**
- 通过 Linux namespace 隔离各个容器的运行环境。
  - 隔离了进程、网络、文件系统，接近于独享一个虚拟机环境。
  - 没有隔离物理资源。例如：一个容器可能占用全部的 CPU 和内存；在容器内执行 top 命令会看到整个宿主机的资源。
  - 没有隔离 Linux 内核，容器内的进程可能通过内核漏洞溢出到宿主机上。
- 通过 Linux cgroups 限制各个容器使用的 CPU、内存等资源。

使用 Docker 容器的推荐做法：
- 每个容器内应该只运行一个应用，尽量使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
- 创建容器之后不要改动它，这样可以随时从镜像重新创建与其一致的容器。
- 创建无状态容器 —— 不将数据存储在容器内，因此可以随时关闭、重启容器，而不必担心数据丢失。
- 建议采用以下方案来存储容器的数据：
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

### 启动容器

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

### 执行命令

```sh
docker exec [options] <container> <command>  # 在容器中执行一条命令
```

- 这样可以在宿主机上让容器执行命令，不必进入容器的终端。执行后产生的 stdout 会打印到宿主机的当前终端，但是不会接收宿主机的 stdin ，在宿主机上按 Ctrl + C 不能发送关闭信号到容器中。
- 例：
    ```sh
    docker exec -it centos1 bash    # 在容器中创建终端并进入
    ```

### 拷贝文件

```sh
docker cp /root/f1 <容器>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp <容器>:/root/f1 /root/    # 从容器拷贝文件到宿主机的指定目录
```
- 拷贝当前目录时不能使用 docker cp * ，要使用 docker cp . 。而且不必加上 -a 选项就可以递归拷贝。

### 数据卷

```sh
docker volume
            ls            # 显示所有的 docker 数据卷
            create <name> # 创建一个数据卷
            rm <name>     # 删除一个数据卷
```

- 将容器中产生的数据存储到数据卷中，可以持久化存储。如果遗留在容器中，当容器被删除时，容器中的数据也会消失。
- 一个数据卷可以被多个容器共用，一个容器也可以挂载多个数据卷。

### 管理网络

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

## 镜像

镜像是容器的模板，是一些静态文件。
- 每个镜像都有一个由 Docker 自动分配的 ImageID（一串编号），用户也可以自定义镜像名和 tag（表示镜像的版本）。
  - 通过 ImageID 或 ImageName:tag 可以指定一个唯一的 Image 。
- Docker 服务器使用的镜像都存储在宿主机上，也可以将镜像存储到镜像仓库服务器中。
  - Docker 默认使用的镜像仓库是官方的 Docker hub 。

### 管理镜像

查看镜像：
```sh
docker
    images                 # 列出本机的所有镜像
    image rm <Image>...    # 删除镜像
    tag <Image> <ImageName>:<tag>  # 给镜像加上 ImageName 和 tag
```
- 例：删除所有 none 镜像
    ```sh
    docker images | awk '$2=="<none>" {print $3}' | xargs docker image rm
    ```

拉取镜像：
```sh
docker
    pull <ImageName>:<tag>  # 从镜像仓库拉取镜像
    push <ImageName>:<tag>  # 推送镜像到镜像仓库
    search <ImageName>     # 在镜像仓库中搜索某个镜像
    login -u will tencentyun.com    # 使用一个用户名登录一个镜像仓库（然后会提示输入密码）
```
- 如果不注明镜像的 tag ，则默认拉取 latest 版本。
- 尽量不要拉取 latest 版本，而使用具体的版本名，比如 v1.0 ，否则在不同时间拉取的 latest 版本会不一样。

镜像被 Docker 保存成一些散乱的文件，使用以下命令可以导出成文件包：
```sh
docker save -o images.tar <Image>...           # 将镜像打包成 tar 文件
docker save <Image>... | gzip > images.tar.gz  # 打包成 tar.gz 文件
docker load -i images.tar                      # 导入镜像
```

### 制作镜像

制作 Docker 镜像的方法有两种：
- 将一个容器提交为镜像：
    ```sh
    docker commit <容器 ID> <ImageName>:<tag>
    ```
  - 每次 commit 时，会在原镜像外部加上一层新的文件系统（file system layer）。因此 commit 次数越多，镜像的体积越大。
- 编写 Dockerfile 文件，然后基于它构建镜像：
    ```sh
    docker build <Dockerfile 所在目录> -t <生成的镜像名:tag>
        --build-arg VERSION="1.0"  # 传入构建参数给 Dockerfile
        --target <阶段名>          # 构建到某个阶段就停止
        --network <name>           # 设置 build 过程中使用的网络
    ```
  - 例：
    ```sh
    docker build . -t centos:v1.0 --network host
    ```
  - docker build 命令会将 Dockerfile 所在目录作为上下文目录，将该目录及其子目录下的所有文件都拷贝给 docker daemon 。
    <br>可以在 .dockerignore 文件中声明不想被拷贝的文件。
  - 执行 docker build 命令时，docker daemon 会创建临时容器来构建镜像，构建完成之后会自动删除临时容器。
  - 如果镜像构建失败，则生成 ImageID 为 none 。

## Dockerfile

：一个文本文件，用于构建镜像。
- [官方文档](https://docs.docker.com/v17.09/engine/reference/builder/#usage)

### 例

```dockerfile
FROM nginx                 # Dockerfile 中的第一条非注释命令，表示以某个镜像为基础开始构建

MAINTAINER "..."           # 注明镜像的作者
LABEL maintainer="..."     # 添加镜像的标签

ENV var1=value1 var2=value2 ...  # 设置环境变量
ARG var1                   # 设置构建参数（可以在 docker build 时传入该参数的值）
ARG var2=value2            # 可以给构建参数设置默认值

USER <用户名>              # 切换用户（构建过程中、容器启动后都会使用该用户）
WORKDIR <目录>             # 切换工作目录（相当于 cd 命令，此后的相对路径就会以它为起点）

COPY <源路径>... <目标路径> # 将宿主机上下文目录中的文件拷贝到镜像中
# 源路径只能是相对路径，且不能使用 .. 指向超出上下文目录的路径。
# 目标路径可以是绝对路径，也可以是相对路径（起点为 WORKDIR ，不会受到 RUN 命令中的 cd 命令的影响）
# 例：COPY . /root/

RUN echo "Hello World!" && \
    touch f1

VOLUME ["/root", "/var/log"]    # 将容器中的这些目录设置成挂载点
# docker daemon 启动容器时会自动在宿主机的 /var/lib/docker/volumes/ 下创建一个随机名字的目录，挂载到容器的挂载点。
# 用 docker inspect 命令查看容器信息，可看到各个挂载目录。

EXPOSE 80    # 暴露容器的一个端口
# 只是声明，并没有实际暴露出去，没有绑定到宿主机的具体端口。
# 如果 docker run 时使用 -p 选项，则 EXPOSE 的作用只是提醒用户应该映射哪个端口。
# 如果 docker run 时使用 -P 选项，则宿主机会自动映射一个随机端口到被 EXPOSE 暴露的端口。
```

- 使用 # 声明单行注释。
- Dockerfile 的命令名不区分大小写，但一般大写。
- scratch 是一个空镜像，以它为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。

### 可执行命令

Dockerfile 中有三种可执行命令：RUN、ENTRYPOINT、CMD 。

RUN ：用于在构建镜像的过程中，在临时容器中执行一些命令。
- 有两种写法：
  ```dockerfile
  RUN <command> <param1> <param1>...        # shell 格式
  RUN ["command", "param1", "param2"...]    # exec 格式
  ```
- 例：
  ```dockerfile
  RUN echo hello
  RUN ["/bin/echo", "hello"]
  ```
- docker daemon 每次执行 RUN 命令时，会在原镜像外部加上一层新的文件系统（file system layer）。
  - 执行 rm 等命令也无法删除内层的文件系统中的文件。
  - 因此执行 RUN 命令的次数越多，镜像的体积越大。应该尽量减少 RUN 命令的数量，最好合并成一条 RUN 命令。

ENTRYPOINT ：用于设置容器启动时首先执行的命令。
- 有两种写法：
  ```dockerfile
  ENTRYPOINT <command> <param1> <param1>...      # shell 格式
  ENTRYPOINT ["command", "param1", "param2"...]  # exec 格式
  ```
- 构建镜像时，docker daemon 会将 shell 格式的命令转换成 exec 格式再保存，并且转换时会加上前缀"/bin/sh"和"-c"。
- 例如，如果在 Dockerfile 中编写“Entrypoint echo hello”，在保存会被转换成：
  ```
  "Entrypoint": [
      "/bin/sh",
      "-c",
      "echo hello"
  ]
  ```

CMD ：用于设置容器启动时首先执行的命令。
- 如果用户执行 docker run 命令时设置了启动命令，则会覆盖镜像中的 CMD 命令。
- 有三种写法：
  ```dockerfile
  CMD <command> <param1> <param1>...        # shell 格式
  CMD ["command", "param1", "param2"...]    # exec 格式
  CMD ["param1", "param2"...]               # 只有参数的 exec 格式
  ```
- Dockerfile 中的 ENTRYPOINT、CMD 命令最多只能各写一个，否则只有最后一个会生效。
- ENTRYPOINT 命令一般写在 CMD 命令之前，不过写在后面也没关系。

ENTRYPOINT 与 CMD ：
- 构建镜像时，docker daemon 会将 ENTRYPOINT、CMD 命令都保存为 exec 格式。
- 启动容器时，docker daemon 会将 ENTRYPOINT、CMD 命令都从 exec 格式转换成 shell 格式，再将 CMD 命令附加到 ENTRYPOINT 命令之后，然后才执行。
  - 因此，ENTRYPOINT 命令是容器启动时的真正入口端点。
- 下表统计不同写法时，一个 ENTRYPOINT 命令与一个 CMD 命令组合的结果（即最终的容器启动命令是什么）：

  -|`ENTRYPOINT echo 1`|`ENTRYPOINT ["echo", "1"]`
  -|-|-
  `CMD echo 2`          |/bin/sh -c 'echo 1' /bin/sh -c 'echo 2'  |echo 1 /bin/sh -c 'echo 2'
  `CMD ["echo", "2"]`   |/bin/sh -c 'echo 1' echo 2               |echo 1 echo 2
  `CMD ["2"]`           |/bin/sh -c 'echo 1' 2                    |echo 1 2

- 可见，当 ENTRYPOINT 命令采用 shell 格式时，不会被 CMD 命令影响，可以忽略 CMD 命令。

### 多阶段构建

在一个 Dockerfile 中可以使用多个 FROM 命令，相当于拼接多个 Dockerfile ，每个 FROM 命令表示一个构建阶段的开始。
- 后一个阶段可以使用之前任一阶段生成的文件。
- 例：
  ```dockerfile
  FROM centos as stage1        # 给该阶段命名
  COPY . /root/

  FROM centos as result
  COPY --from=stage1 /root/ /root/                 # 从指定阶段的最终容器中拷贝文件
  COPY --from=nginx /etc/nginx/nginx.conf /root/   # 从其它镜像中拷贝文件
  ```
