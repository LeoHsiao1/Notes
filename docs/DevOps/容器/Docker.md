# Docker

：目前最流行的容器引擎。
- [官方文档](https://docs.docker.com/engine/docker-overview/)
- 基于 Golang 开发。
- 于 2013 年被 Docker 公司发布，掀起了容器技术的潮流。
- 运行在 Linux 平台上。也有 Docker for Windows 版本，但只能运行 windows 上的应用程序。

## 安装

- 在 Centos 上安装：
  ```sh
  yum install yum-utils       # 安装 yum-config-manager
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加 docker 的官方镜像源
  yum install docker-ce       # 下载 docker 社区版
  systemctl start docker      # 启动 docker daemon
  systemctl enable docker     # 使 docker 开机自启
  ```

- 在 ubuntu 上，可以用官方脚本自动安装：
  ```sh
  curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
  ```

## 原理
  
- 采用 C/S 架构。
  - 服务器作为宿主机上的守护进程运行，称为 docker daemon ，负责管理本机的容器、镜像。
  - 用户可以在宿主机上执行 docker 命令，作为客户端。这些命令会发送给服务器，由服务器执行。
- 通过 Linux namespace 隔离了各个容器的运行环境。
  - 隔离了进程、网络、文件系统，接近于独享一个虚拟机环境。
  - 没有隔离物理资源。例如：一个容器可能占用全部的 CPU 和内存；在容器内执行 top 命令会看到整个宿主机的资源。
  - 没有隔离 Linux 内核，容器内的进程可能通过内核漏洞溢出到宿主机上。
- 通过 Linux cgroups 限制了各个容器使用的 CPU、内存等资源。


## 容器

- 每个容器被创建时，会被 docker daemon 分配两个随机的、独一无二的字符串，作为该容器的标识符。
  - Container ID   ：是一串十六进制数。有 64 位长，但允许用户只用开头少量几位就指定一个容器。
  - Container Name ：通常由几个英文单词组成。可以由 docker daemon 分配，也可以由用户自定义。
  - 容器被创建之后，就不能再修改其标识符。

- 用户创建一个容器时，必须指定一条启动命令（如果有默认配置则无需指定）。
  - 默认由启动命令对应的进程担任容器内的 1 号进程。
  - 容器启动之后，用户可以进入容器内终端，执行任意命令，启动其它进程。
  - 一旦容器的 1 号进程退出（或者不在前台运行），docker daemon 就会杀死容器内所有进程，使得整个容器停止运行。
  - 为了让容器保持运行，容器的启动命令应该在前台运行，且能够一直保持运行，比如 `tail -f /dev/null` 。

- 容器的生命周期：
  - Creat   ：创建。此时容器被 docker daemon 分配了 CPU 、内存等资源，创建了根目录文件系统。
  - Up      ：运行中。
  - Exit    ：停止。此时容器占用的资源被释放，但文件系统保留不变。
  - Restart ：重启。此时容器重新被分配资源，但依然使用之前的文件系统，重新执行启动命令。
  - Delete  ：被删除。此时容器占用的资源被释放，文件系统也被删除。最终消失不见，在 docker daemon 中不能查询到该容器。


### 启动

```sh
docker run <image>            # 运行一个镜像，这会创建一个容器（如果本机不存在该镜像，则会自动从镜像仓库下载该镜像）
            -i                # 启用容器的 stdin
            -t                # 创建一个伪终端绑定到容器的 stdin 上，供用户操作
            -d                # 以 daemon 方式运行
            
            --name <name>     # 设置容器的名字
            --workdir <path>  # 指定容器的工作目录
            --init            # 使用 init 作为容器的 1 号进程（它会照常执行容器的启动命令）
            --rm              # 当容器终止时，自动删除它

            -p 80:8000                # 将宿主机的端口 80 映射到容器的端口 8000（可重复使用该命令选项）
            -p 127.0.0.1:80:8000      # 将宿主机指定网卡的端口 80 映射到容器的端口 8000
            -P                        # 从宿主机上随机选取端口映射到容器暴露的所有端口
            --network <name>          # 将容器连接到指定名称的 docker 网络

            -e PATH=$PATH:/root       # 设置环境变量（可重复使用该命令选项）

            -v /root:/root            # 将宿主机的 /root 路径挂载到容器的 /root 路径（可重复使用该命令选项）
            -v volume_1:/root         # 将宿主机的 volume_1 数据卷挂载到容器的 /root 路径
            -v /etc/localtime:/etc/localtime:ro   # 限制容器对挂载路径只有读取权限

            # 设置容器的重启策略
            --restart no              # 总是不会自动重启
            --restart on-failure      # 当容器异常终止时，才会自动重启（通过 docker start 重启）
            --restart unless-stopped  # 当容器终止时，就自动重启，除非容器是被 docker stop 终止的
            --restart always          # 当容器终止时，总是会自动重启（即使被 docker stop 了，当 docker daemon 重启时又会自动重启该容器）

            # 限制容器占用的 CPU、内存
            --cpus 2                  # 限制该容器最多使用 2 个 CPU（平均值）
            --cpu-shares 1024         # 与其它容器抢占 CPU 时的权重（取值为 1~1024）
            -m 256m                   # 限制最多使用的内存量（超过该值的 2 倍时就会被 OOM 杀死）
```
- 例：
  ```sh
  docker run hello-world                   # 运行一个测试镜像
  docker run -it centos:7 bash             # 创建容器，并进入该容器的终端
  docker run -d centos:7 tail -f /dev/null # 创建一个容器（让它执行一个不会停止的启动命令）
  ```
- 非 root 用户可能无权访问 /var/run/docker.sock 文件，导致无权执行 docker ps 等命令。
  - 此时可以将该用户加入 docker 用户组：`sudo usermod leo -G docker` ，从而开通权限。
- 容器内不能再创建嵌套的容器，甚至不能联系到 docker daemon ，因此不能使用 docker ps 等命令。
  - 将 /var/run/docker.sock 文件挂载到容器内之后，可以在容器内与 docker daemon 通信。
- 将宿主机的 /etc/localtime 文件挂载到容器中，就会让容器采用宿主机的时区。


### 管理

```sh
docker 
      ps                  # 显示所有处于运行状态的容器
          -a              # 显示所有状态的容器
          -n <int>        # 显示最后创建的几个容器（包括所有状态的）
          --no-trunc      # 不截断过长的显示内容
      stop <容器>...      # 停止容器（相当于暂停，容器会变成 stopped 状态）
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
docker exec [options] <container> <command>  # 在容器内执行一条命令
```

- 这样可以在宿主机上让容器执行命令，不必进入容器的终端。执行后产生的 stdout 会打印到宿主机的当前终端，但是不会接收宿主机的 stdin ，在宿主机上按 Ctrl + C 不能发送关闭信号到容器内。
- 例：
    ```sh
    docker exec -it centos1 bash    # 在容器内创建终端并进入
    ```

### 拷贝文件

```sh
docker cp /root/f1 <容器>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp <容器>:/root/f1 /root/    # 从容器拷贝文件到宿主机的指定目录
```
- 拷贝当前目录时不能使用 `docker cp *` ，要使用 `docker cp .` 。而且不必加上 -a 选项就可以递归拷贝。

### 数据卷

```sh
docker volume
            ls                # 显示所有的 docker 数据卷
            inspect <name>    # 查看数据卷的详细信息
            create <name>     # 创建一个数据卷
            rm <name>         # 删除一个数据卷
            prune             # 删除所有没有使用的本地数据卷
```
- 如果将宿主机的某个路径或数据卷，挂载到容器内的某个路径，则容器被删除之后该路径下的文件也会一直保存在宿主机上，从而持久保存数据。
- 挂载宿主机的路径时：
  - 如果该宿主机路径不存在，则会自动创建它再挂载。
    - 默认是创建一个符合宿主机路径的目录。例如想用 `-v /root/f1:/root/f1` 挂载一个文件时，会在宿主机上创建一个路径为 `/root/f1` 的目录再挂载。
    - 默认以 root 用户创建。如果容器内应用以非 root 用户启动，则对于挂载路径可能没有访问权限，此时需要先在宿主机上修改其文件权限，再重启容器。
- 挂载数据卷时：
  - 实际上是先在宿主机的 `/var/lib/docker/volumes/<name>/` 目录下创建一个 _data 目录，再将它挂载到容器中。
    - 会自动给 _data 目录分配合适的文件权限，供容器内应用访问。
  - 一个数据卷可以被多个容器共用，一个容器也可以挂载多个数据卷。

### 网络

```sh
docker network
              ls                       # 显示所有的 docker 网络
              inspect <name>           # 查看一个网络的详细信息
              create <name>            # 创建一个网络（bridge 类型），这会创建一个对应的虚拟网卡
              rm <name>                # 删除一个网络
              prune                    # 删除所有没有使用的网络

              connect <name> <容器>     # 将一个网络连接到指定容器
              disconnect <name> <容器>  # 取消连接
```

- docker 安装之后会创建三个 docker 网络：
  - bridge ：一个虚拟网络，使用一个名为 docker0 的虚拟网卡。
  - host ：使用宿主机的 eth 网卡。
  - none ：一个被隔离的网络，只能使用 lo 网卡。
- 创建一个容器时，默认会创建一个名字以 veth 开头的虚拟网卡，专门给该容器使用。
  - 创建容器的默认配置是 `docker run --network bridge` ，因此会将容器的虚拟网卡连接到 bridge 网络的 docker0 网卡。
  - 从容器内不能访问到 eth 网卡，因为缺乏 DNS ，比如尝试 ping 会报错 `No route to host` 。
  - 当容器内的服务监听端口时，是监听虚拟网卡上的 Socket ，因此不能被容器外的 eth 网卡或其它网卡访问到。
- 让容器内端口可以被容器外访问的三种方案：
  - 将容器内端口映射到宿主机的 eth 网卡上的端口。
    - 比如执行 `docker run -p 80:80`
    - 此时 docker daemon 会配置 iptables 规则，将宿主机 80 端口收到的流量转发到容器内的 80 端口。
      - 不过此时相当于在宿主机的防火墙上开通 80 端口，允许被任意外部 IP 访问。
      - 此时从一个容器中不能访问到另一个容器映射的端口，因为 iptables 规则不会转发该流量。
  - 让容器连接到 host 网络，从而使用宿主机的 eth 网卡，而不创建自己的虚拟网卡。
    - 比如执行 `docker run --network host`
    - 这样当容器内的服务监听端口时，是监听 eth 网卡上的 Socket ，可以被外部访问。
  - 如果几个容器连接到同一个 bridge 网络，就可以在一个容器内访问其它容器、访问所有端口（使用容器的名字作为目标主机）。例如：`ping mysql`
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

- 每个容器内应该只运行一个应用，尽量使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
- 当用户主动终止容器时，容器的 1 号进程要负责清理容器内的所有进程。如果 1 号进程只是个 shell 脚本，或者容器内运行了多个进程组，则容易清理不干净，留下僵尸进程。此时建议使用 init 作为 1 号进程，保证清理成功。
- 创建容器之后不要改动它，这样可以随时从镜像重新创建与其一致的容器。
- 尽量创建无状态容器：不将数据存储在容器内，因此可以随时关闭、重启容器，而不必担心数据丢失。
- 建议采用以下方案来存储容器的数据：
  - 挂载目录，将文件存储到容器外。
  - 将数据存储到容器外的数据库中。

## 镜像

- 每个镜像都会被 docker daemon 分配一串随机编号作为 image ID ，用户也可以自定义镜像名和 tag（表示镜像的版本）。
  - 通过 image ID 或 imageName:tag 可以指定一个唯一的 Image 。
- docker daemon 使用的镜像都存储在宿主机上，也可以将镜像存储到镜像仓库服务器中。
  - 默认使用的是官方的镜像仓库 hub.docker.com ，也可以使用自己部署的仓库。

### 查看

```sh
docker
      images                 # 列出本机的所有镜像
      image rm <image>...    # 删除镜像
      tag <image> <imageName>:<tag>  # 给镜像加上 imageName 和 tag
```
- 例：删除所有 none 镜像
    ```sh
    docker images | awk '$2=="<none>" {print $3}' | xargs docker image rm
    ```

### 拉取

```sh
docker
      pull <imageName>:<tag>        # 从镜像仓库拉取镜像
      push <imageName>:<tag>        # 推送镜像到镜像仓库
      search <imageName>            # 在镜像仓库中搜索某个镜像
      login -u will tencentyun.com  # 使用一个用户名登录一个镜像仓库（然后会提示输入密码）
```
- 如果不注明镜像的 tag ，则默认拉取 latest 版本。
- 尽量不要拉取 latest 版本，而使用具体的版本名，比如 v1.0 ，否则在不同时间拉取的 latest 版本会不一样。
- 镜像在宿主机上会存储成一些零散的文件，使用以下命令可以导出成压缩包：
  ```sh
  docker save -o images.tar <image>...           # 将镜像打包成 tar 文件
  docker save <image>... | gzip > images.tar.gz  # 打包成 tar.gz 文件
  docker load -i images.tar                      # 导入镜像
  ```

### 制作

制作 Docker 镜像的方法有两种：
- 将一个容器提交为镜像：
    ```sh
    docker commit <containerID> <imageName>:<tag>
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
  - 可以在 .dockerignore 文件中声明不想被拷贝的文件。
  - 执行 docker build 命令时，docker daemon 会创建临时容器来构建镜像，构建完成之后会自动删除临时容器。
  - 如果镜像构建失败，则生成的 image ID 为 none 。
