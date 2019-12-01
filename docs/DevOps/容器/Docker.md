# Docker

Docker是目前最流行的容器引擎。
- 基于Go语言，运行在Linux平台上。也有Docker for Windows版本，只能运行windows上的应用程序。
- 于2013年被Docker公司推出，掀起了容器技术的潮流。
- 以镜像（image）作为模板，创建容器（container）。
- [官方文档](https://docs.docker.com/engine/docker-overview/)

## 原理

Docker采用C/S架构。
- 服务器作为宿主机上的守护进程运行，称为docker daemon。
- 服务器负责管理本机的容器、镜像。
- 客户端负责把用户执行的docker命令发送给服务器，由服务器执行。

Docker通过Linux namespace隔离各个容器的运行环境。
- 隔离了进程、网络、文件系统，类似于独享一个虚拟机环境。
- 但是没有隔离物理资源，比如在容器内执行free、top命令会看到整个宿主机的内存、CPU。
- 也没有隔离内核，容器内的进程可能通过内核漏洞溢出到宿主机上。

使用容器的最佳实践：
- 每个容器内应该只运行一个应用，尽量使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
  <br>因此，不要在容器内用supervisor等工具启动多个进程。
- 创建无状态容器，这样不必担心数据丢失。
  <br >无状态容器：不将数据存储在容器内，因此可以随时关闭、重启容器，而不必担心数据丢失。
- 创建容器之后不要修改它，这样随时可以从镜像重新创建容器。
- 存储数据的方案：
  - 将文件挂载到容器外。
  - 将临时数据存储到容器外的Redis中。

## 安装

- 在Centos上安装：

    ```shell
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加docker的官方镜像源
    yum install docker-ce   # 下载docker社区版
    systemctl start docker  # 启动docker服务
    ```

- 在ubuntu上，可使用官方脚本自动安装：

    ``shell
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    ```

- 测试运行：

    ``shell
    docker pull hello-world    # 从镜像仓库拉取一个镜像
    docker run hello-world     # 运行镜像
    ``

## 容器

容器是根据镜像运行起来的一个虚机环境，至少包含一个进程组。
- 每个容器都有一个由Docker自动分配的 ContainerID（一串编号），用户也可以自定义容器名。
  - 通过 ContainerID 或 ContainerName 可以指定一个唯一的 Container 。
- 当容器内的进程都停止时，容器就会变成 stopped 状态。此时容器的文件依然会被Docker保留，可以再次启动。

- 创建容器。
- docker run hello-world  # 创建一个容器来运行镜像hello-world
#如果本地不存在该镜像，docker会自动从镜像仓库下载该镜像
- docker run -it ubuntu:15.10 bash    # 创建容器，并进入该容器的终端
- docker run -d ubuntu:15.10 tail -f /dev/null  # 创建一个容器（让它执行tail命令以保持运行）
-i    # 打开容器的stdin
-t    # 创建一个伪终端绑定到容器的stdin上，供用户操作
-d    # 让容器在后台运行
--name <name>      # 设置容器的名字

-p 8080:5000      # 将宿主机的端口8080映射到容器的端口5000
-p 127.0.0.1:8080:5000  # 将宿主机指定IP的端口8080映射到容器的端口5000
-p 127.0.0.1::5000    # 将宿主机指定IP的任意一个端口映射到容器的端口5000
-P            # 将宿主机的49000~49900任意一个端口映射到容器暴露的某个端口
--network <网络名>    # 连接到指定的docker网络
--workdir <path>    # 指定容器的工作目录

-v /root:/root      # 将宿主机的某个目录挂载到容器的某个目录
--mount source=volume1, target=/tmp    # 将一个数据卷挂载到容器中的某个目录
-e USER=root      # 设置环境变量

--cpus 2        # 该容器最多平均使用2个CPU
--cpu-shares 1024    # 与其它容器抢占CPU时的权重（取值为1~1024）
-m 256m        # 限制最多使用的内存量（超过该值的2倍时就会被OOM杀死）

--restart no      # 任何情况下都不会自动重启容器
--restart on-failure  # 当容器异常终止时就自动重启容器（用docker start）
--restart unless-stopped  # 当容器终止时就自动重启容器，除非容器被docker stop了
--restart always    # 当容器终止时一定会自动重启容器
            # 如果被docker stop了，当docker服务被重启时又会自动重启该容器

--init    # 使容器的1号进程为init（会把容器的启动命令作为参数传给init进程）
      # 关闭容器时，init进程会确保回收容器内的各个进程
--rm    # 当容器终止时，自动删除它
- 容器中的应用应该作为前台进程运行，否则当前台进程运行结束之后就会终止容器。
- 在宿主机上让容器执行一条命令：
docker exec [options] <container> <command>
- 例如：docker centos1 ping 127.0.0.1。在容器中执行该命令时，会将stdout打印到宿主机的当前终端，但在宿主机上按Ctrl + C不能发送关闭信号到容器中。
- 例如：docker exec -it centos1 bash    # 进入一个容器的终端
- 管理容器。
docker 
ps          # 列出正在运行的容器
-a        # 列出所有容器
-n <int>    # 显示最后创建的几个容器（包括所有状态的）
--no-trunc    # 不截断过长的显示内容
stop <容器名>...  # 停止容器
start <容器名>...  # 启动已停止的容器
rm <容器名>...    # 删除已停止的容器
  -f        # 强制删除运行中的容器
rename <容器名> <新容器名>
container
prune  # 删除所有已终止的容器

stats        # 查看所有容器的资源使用情况（实时刷新）
inspect <name>    # 查看一个容器或镜像的具体信息
logs <容器名>  # 查看容器的log，比如标准输出
--tail 10  # 显示最后几行
-f      # 保持显示
-t      # 显示时间戳

update <容器名>...  # 更改容器的配置
--cpus 2
-m 256m
--restart no
- 
- 
- 
 
## 其它设置

- 关于文件。
- 在宿主机与容器之间拷贝文件（在宿主机上执行以下命令）。
docker cp /root/f1 <容器ID>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp <容器ID>:/root/f1 /root/    # 从容器拷贝文件到宿主机的指定目录
- docker拷贝当前目录时不能使用cp *，要使用cp .。而且不必加上-a选项就可以递归拷贝。
- 添加数据卷。
docker volume
ls          # 列出所有的docker数据卷
create <数据卷名>    # 创建一个数据卷
rm <数据卷名>      # 删除一个数据卷
- docker的数据卷用于存储容器的数据。使用数据卷可以避免将数据写入容器的存储层。
- 一个数据卷可以被多个容器共用，一个容器也可以挂载多个数据卷。
- 关于网络。
- docker安装后会在宿主机上创建一个名为docker0的网卡。
- 创建一个容器时，会自动在宿主机中创建一个虚拟网卡。如果不使用—network选项，则默认将容器的网卡连接到docker0网卡，并分配一个docker0网卡下的私有IP地址。
- 从容器内不能访问到容器外的网络（除非开放端口或连通网络），只能访问127.0.0.1。
- docker安装后会创建三个docker网络。
- bridge  ：一个docker网络，可以将一些容器连入。（还可以再创建bridge类型的网络）
- host    ：使用宿主机的eth网卡，与宿主机的网络连通。
- none    ：一个被隔离的网络，只能使用lo网卡。
- 管理网络的命令。
docker network \
ls            # 列出所有的docker网络
create <网络名>      # 创建一个网络
rm <网络名>        # 删除一个网络
connect <网络名> <容器ID>  # 将一个网络连接到指定容器
disconnect <网络名> <容器ID>  # 取消连接
- 如果容器test1和容器test2连接到同一个网络，就可以在test1中ping test2。（此时相当于用-p选项连通了所有端口）
- 
- 
- 
 