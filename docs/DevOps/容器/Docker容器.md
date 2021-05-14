# Docker 容器

## 启动

```sh
docker run <image>              # 运行一个镜像，这会创建一个容器（如果本机不存在该镜像，则会自动从镜像仓库下载该镜像）
            -i                  # 启用容器的 stdin
            -t                  # 创建一个伪终端绑定到容器的 stdin 上，供用户操作
            -d                  # 以 daemon 方式运行

            --name <name>       # 设置容器的名字
            -l <key>[=<value>]  # --label ，给容器添加键值对格式的标签，比如 branch=dev 。如果不指定 value ，则默认赋值为 "" 。可以多次使用该选项

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
- 用户创建一个容器时，需要指定一条启动命令（如果有默认配置则无需指定）。
  - 容器启动之后，用户可以进入容器内终端，执行任意命令，启动其它进程。
- 默认由容器启动命令创建的进程担任容器内的 1 号进程。
  - 一旦容器的 1 号进程退出（或者不在前台运行），dockerd 就会杀死容器内所有进程，使得整个容器停止运行。
    - 因此，为了让容器保持运行，容器的启动命令应该在前台运行，且一直保持运行，比如 `tail -f /dev/null` 。
  - 当用户主动终止容器时，容器的 1 号进程要负责清理容器内的所有进程。
    - 如果 1 号进程只是个 shell 脚本，或者容器内运行了多个进程组，则容易清理不干净，留下僵尸进程。此时建议使用 init 作为 1 号进程，保证清理成功。
- 建议每个容器内只运行一个应用，使得启动、停止该容器相当于启动、停止该应用，这样方便管理。
- 无状态容器：容器可以随时销毁，然后从镜像重新创建，不会中断服务，不会丢失数据。
- 持久化存储容器内数据的几种方案：
  - 挂载目录，将文件存储到容器外。
  - 将数据存储到容器外的数据库中。

## 管理

```sh
docker
      ps                        # 显示所有 running 状态的容器
          -a                    # 显示所有状态的容器
          -n <int>              # --last ，显示最后创建的几个容器（包括所有状态的）
          --no-trunc            # 不截断显示过长的内容
          -q                    # 只显示 ID
          -s                    # 增加显示容器的可写层 layer 所占磁盘空间、全部层 layer 所占虚拟磁盘空间

          -f status=running     # --filter ，添加过滤条件，只显示部分容器
          -f "label=branch"     # 过滤具有 branch 标签的容器
          -f "label=branch=dev" # 过滤具有 branch 标签且取值为 dev 的容器

          --format '{{.Names}} {{.Status}}' # 自定义每个容器显示的字段信息，基于 Go 模板语法

      stop    <container>...    # 暂停容器的运行，容器会变成 stopped 状态
      start   <container>...    # 启动容器，容器会从 stopped 状态变为 running 状态
      restart <container>...    # 重启容器（相当于先 stop 再 start）
      rm      <container>...    # 删除容器（只能删除 stopped 状态的）
          -f                    # 强制删除（可以删除 running 状态的）
      container prune           # 删除所有 stopped 状态的容器

      rename  <container> <new_name>  # 重命名容器
      update  <container>...          # 更改容器的配置
          --restart no
          --cpus 2
          -m 256m

      stats                     # 显示所有容器的资源使用情况
      inspect <object>          # 显示一个 Docker 对象的详细信息
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
- 容器的生命周期：
  ```sh
  Creat     # 创建。此时容器被 dockerd 分配了 CPU 、内存等资源，创建了根目录文件系统
  Up        # 运行中
  Exit      # 停止。此时容器占用的资源被释放，但文件系统保留不变
  Restart   # 重启。此时容器重新被分配资源，但依然使用之前的文件系统，重新执行启动命令
  Delete    # 被删除。此时容器占用的资源被释放，文件系统也被删除。最终消失不见，在 dockerd 中不能查询到该容器
  ```
- `docker ps --format 'xx'` 可显示以下字段，注意区分大小写：
  ```sh
  .ID
  .Image
  .Command      # 容器的启动命令
  .CreatedAt    # 容器的创建时间
  .RunningFor	  # 容器从创建以来，存在的时长
  .Ports	      # 镜像 EXPOSE 的端口、容器实际映射的端口

  .Names
  .Labels       # 容器的所有标签
  .Label        # 容器的指定标签的值，比如 '{{.Label "maintainer"}}'

  .State        # 容器的运行状态，比如 created、running、exited
  .Status       # 容器的运行状态，以及该状态的持续时间，比如 Up 2 minutes
  .Size         # 容器占用的磁盘空间
  .Mounts       # 容器挂载的所有卷
  .Networks     # 容器关联的所有网络
  ```

## 日志

```sh
docker logs <container>   # 显示一个容器的日志
          --tail 10       # 显示最后几行
          -f              # 保持显示
          -t              # 显示时间戳
```
- dockerd 会记录容器内 1 号进程的 stdout、stderr ，作为该容器的日志。
  - 将其它进程的日志文件重定向到 `/proc/1/fd/1`、`/proc/1/fd/2` ，就会一起记录到容器的日志中。
  - 例如， Nginx 的官方镜像中重定向了其日志文件：
    ```sh
    ln -sf /dev/stdout /var/log/nginx/access.log
    ln -sf /dev/stderr /var/log/nginx/error.log
    ```

### 日志驱动器

dockerd 会通过日志驱动器（logging driver）保存容器的日志。
- 常见的几种如下：
  - nong ：不保存日志。
  - local
    - 将日志按文本格式保存在宿主机的 `/var/lib/docker/containers/{ContainerId}/local-logs/container.log` 文件中。
    - 默认会自动进行日志切割， max-size 为 10m ，max-file 为 5 。
  - json-file
    - 将日志按 JSON 格式保存在宿主机的 `/var/lib/docker/containers/{ContainerId}/{ContainerId}-json.log` 文件中。如下：
      ```sh
      [root@CentOS ~]# tail -n 1 /var/lib/docker/containers/3256c21887f9b110e84f0f4a620a2bf01a8a7b9e3a5c857e5cae53b22c5436d4/3256c21887f9b110e84f0f4a620a2bf01a8a7b9e3a5c857e5cae53b22c5436d4-json.log
      {"log":"2021-02-22T03:16:15.807469Z 0 [Note] mysqld: ready for connections.\n","stream":"stderr","time":"2021-02-22T03:16:15.80758596Z"}
      ```
      - 使用 docker logs 命令查看日志时，只会显示其 log 字段的值。
    - 默认不会进行日志切割， max-size 为 -1 即不限制大小，max-file 为 1 。
  - syslog  ：将日志保存到宿主机的 syslog 中。
  - journald ：将日志保存到宿主机的 journald 中。
  - fluentd ：将日志保存到 fluentd 服务中。
- 每个容器同时只能启用一种日志驱动器。
  - 默认启用的是 json-file ，但是
- 可以在 daemon.json 中配置日志驱动器，但需要重启 dockerd 才会生效，而且只会对新创建的容器生效。如下：
  ```json
  {
    "log-driver": "json-file",  // 设置日志驱动器的类型，默认为 json-file
    "log-opts": {
      "max-size": "1g"          // 日志文件的最大大小。超过该大小则滚动一次，创建一个新日志文件继续写入
      "max-file": "1"           // 最多保留多少份日志文件。即使只保留 1 份，每次滚动时也会创建一个新日志文件
    }
  }
- 也可以在创建每个容器时，单独配置日志驱动器，如下：
  ```sh
  docker run -d \
        --log-driver json-file  \
        --log-opt max-size=10m  \
        --log-opt max-file=5    \
        nginx
  ```
  ```

## 执行命令

```sh
docker exec [options] <container> <command>  # 在容器内执行一条命令
```
- 这样可以在宿主机上让容器执行命令，不必进入容器的终端。执行后产生的 stdout 会打印到宿主机的当前终端，但是不会接收宿主机的 stdin ，在宿主机上按 Ctrl + C 不能发送关闭信号到容器内。
- 例：
  ```sh
  docker exec -it centos1 bash    # 在容器内创建终端并进入
  ```

## 拷贝文件

```sh
docker cp   /root/f1                <container>:/root/    # 从宿主机拷贝文件到容器的指定目录
docker cp   <container>:/root/f1    /root/                # 从容器拷贝文件到宿主机的指定目录
```
- 拷贝当前目录时不能使用 `docker cp *` ，要使用 `docker cp .` 。而且不必加上 -a 选项就可以递归拷贝。

## 数据卷

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
  /etc/localtime          # 让容器内采用与宿主机相同的时区，不过有的容器不会读取该文件
  /var/run/docker.sock    # 允许在容器内与 dockerd 通信，可以执行 docker ps 等命令
  ```

## 网络

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

### 映射端口

- 让容器内端口可以被容器外访问的三种方案：
  - 将容器内端口映射到宿主机的 eth 网卡上的端口。
    - 比如执行 `docker run -p 80:80` ，此时 dockerd 会自动添加 iptables 规则，将宿主机 80 端口收到的 TCP 流量转发到容器的 80 端口。
    - 此时宿主机的防火墙会暴露 80 端口，允许被任意外部 IP 访问。
    - 这样自动添加的 iptables 规则很复杂，不建议手动修改，否则可能会出错。如果出错，可以尝试重启 dockerd ，让它重新配置 iptables 。
  - 让容器连接到 host 网络，从而使用宿主机的 eth 网卡，而不是自己的虚拟网卡。
    - 比如执行 `docker run --network host` ，这样当容器内的服务监听端口时，是监听 eth 网卡上的 Socket ，因此可以被外部 IP 访问。
  - 如果几个容器连接到同一个 bridge 类型的网络，就可以在一个容器内访问到其它容器的 IP 、所有端口。
    - 此时可以使用容器的名字作为目标主机，比如执行 `ping mysql` 时会自动将容器名 mysql 解析成该容器的 IP 。

- 例：
  - 创建两个容器
    ```sh
    [root@Centos ~]# docker run -d --name test1 --network host nginx
    9c1c537e8a304ad9e4244e3c7ae1743b88d45924b7b48cbb0a9f63606c82d76d
    [root@Centos ~]# docker run -d --name test2 -p 2080:80 nginx
    4601a81b438e31e5cb371291e1299e4c5333e853a956baeb629443774a066e9c
    ```
  - 在宿主机上可以访问各个容器映射的端口：
    ```sh
    [root@Centos ~]# curl -I 10.0.0.1:80
    HTTP/1.1 200 OK
    ...
    [root@Centos ~]# curl -I 10.0.0.1:2080
    HTTP/1.1 200 OK
    ...
    ```
    甚至可以通过环回地址访问：
    ```sh
    [root@Centos ~]# curl -I 127.0.0.1:80     # test1 容器与宿主机共用网卡
    HTTP/1.1 200 OK
    ...
    [root@Centos ~]# curl -I 127.0.0.1:2080   # test2 容器的端口已经映射到宿主机的网卡
    HTTP/1.1 200 OK
    ...
    ```
  - 在容器内访问宿主机上的端口：
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
    HTTP/1.1 200 OK
    ...
    ```
  - 在容器内访问环回地址的端口：
    ```sh
    [root@Centos ~]# docker exec -it test1 curl -I 127.0.0.1:80
    HTTP/1.1 200 OK
    ...
    [root@Centos ~]# docker exec -it test1 curl -I 127.0.0.1:2080
    HTTP/1.1 200 OK
    ...
    [root@Centos ~]# docker exec -it test2 curl -I 127.0.0.1:80
    HTTP/1.1 200 OK
    ...
    [root@Centos ~]# docker exec -it test2 curl -I 127.0.0.1:2080       # test2 容器的网卡上没有监听 2080 端口，因此不能访问
    curl: (7) Failed to connect to 127.0.0.1 port 2080: Connection refused
    ...
    ```
