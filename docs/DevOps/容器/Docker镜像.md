# Docker镜像

镜像是容器的模板，是一些静态文件。
- 每个镜像都有一个由Docker自动分配的 ImageID（一串编号），用户也可以自定义镜像名和tag（表示镜像的版本）。
  - 通过 ImageID 或 ImageName:tag 可以指定一个唯一的 Image 。
- Docker服务器使用的镜像都存储在宿主机上，也可以将镜像存储到镜像仓库服务器中。
  - Docker默认使用的镜像仓库是官方的Docker hub。

## 管理镜像

查看镜像：
```shell
docker
    images                 # 列出本机的所有镜像
    image rm <Image>...    # 删除镜像
    tag <Image> <ImageName>:<tag>  # 给镜像加上ImageName和tag
```
- 例：删除所有none镜像
    ```shell
    docker images | awk '$2=="<none>" {print $3}' | xargs docker image rm
    ```

拉取镜像：
```shell
docker
    pull <ImageName>:<tag>  # 从镜像仓库拉取镜像
    push <ImageName>:<tag>  # 推送镜像到镜像仓库
    search <ImageName>     # 在镜像仓库中搜索某个镜像
    login -u will tencentyun.com    # 使用一个用户名登录一个镜像仓库（然后会提示输入密码）
```
- 如果不注明镜像的tag，则默认拉取latest版本。
- 尽量不要拉取latest版本，而使用具体的版本名，比如 v1.0，否则在不同时间拉取的latest版本会不一样。

镜像被Docker保存成一些散乱的文件，使用以下命令可以导出成文件包：
```shell
docker save -o images.tar <Image>...           # 将镜像打包成tar文件
docker save <Image>... | gzip > images.tar.gz  # 打包成tar.gz文件
docker load -i images.tar                      # 导入镜像
```

## 制作镜像

制作Docker镜像的方法有两种：
- 将一个容器提交为镜像：
    ```shell
    docker commit <容器ID> <ImageName>:<tag>
    ```
  - 每次commit时，会在原镜像外部加上一层新的文件系统（file system layer）。因此commit次数越多，镜像的体积越大。
- 编写Dockerfile文件，然后基于它构建镜像：
    ```shell
    docker build <Dockerfile所在目录> -t <生成的镜像名:tag>
        --build-arg VERSION="1.0"  # 传入构建参数给Dockerfile
        --target <阶段名>          # 构建到某个阶段就停止
        --network <name>           # 设置build过程中使用的网络
    ```
  - 例：
    ```shell
    docker build . -t centos:v1.0 --network host
    ```
  - docker build命令会将Dockerfile所在目录作为上下文目录，将该目录及其子目录下的所有文件都拷贝给 docker daemon 。
    <br>可以在 .dockerignore 文件中声明不想被拷贝的文件。
  - 执行docker build命令时，docker daemon会创建临时容器来构建镜像，构建完成之后会自动删除临时容器。
  - 如果镜像构建失败，则生成ImageID为none。

## Dockerfile

Dockerfile是一个文本文件，用于构建镜像。
- [官方文档](https://docs.docker.com/v17.09/engine/reference/builder/#usage)

### 语法

```dockerfile
FROM nginx                # Dockerfile中的第一条非注释命令，表示以某个镜像为基础开始构建

MAINTAINER "..."           # 注明镜像的作者
LABEL maintainer="..."     # 添加镜像的标签

ENV var1=value1 var2=value2 ...  # 设置环境变量
ARG var1                   # 设置构建参数（可以在docker build时传入该参数的值）
ARG var2=value2            # 可以给构建参数设置默认值

USER <用户名>              # 切换用户（构建过程中、容器启动后都会使用该用户）
WORKDIR <目录>             # 切换工作目录（相当于cd命令，此后的相对路径就会以它为起点）

COPY <源路径>... <目标路径> # 将宿主机上下文目录中的文件拷贝到镜像中
# 源路径只能是相对路径，且不能使用 .. 指向超出上下文目录的路径。
# 目标路径可以是绝对路径，也可以是相对路径（起点为WORKDIR，不会受到RUN命令中的cd命令的影响）
# 例：COPY . /root/

RUN echo "Hello World!" && \
    touch f1

VOLUME ["/root", "/var/log"]    # 将容器中的这些目录设置成挂载点
# docker daemon 启动容器时会自动在宿主机的 /var/lib/docker/volumes/ 下创建一个随机名字的目录，挂载到容器的挂载点。
# 用 docker inspect 命令查看容器信息，可看到各个挂载目录。

EXPOSE 80    # 暴露容器的一个端口
# 只是声明，并没有实际暴露出去，没有绑定到宿主机的具体端口。
# 如果docker run时使用 -p 选项，则 EXPOSE 的作用只是提醒用户应该映射哪个端口。
# 如果docker run时使用 -P 选项，则宿主机会自动映射一个随机端口到被 EXPOSE 暴露的端口。
```

- Dockerfile中的命令名不区分大小写，但一般大写。
- 使用 # 声明单行注释。
- scratch 是一个空镜像，以它为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。

### 可执行命令

Dockerfile中有三种可执行命令：RUN、ENTRYPOINT、CMD。

RUN：用于在构建镜像的过程中，在临时容器中执行一些命令。
- 有两种写法：
  ```dockerfile
  RUN <command> <param1> <param1>...        # shell格式
  RUN ["command", "param1", "param2"...]    # exec格式
  ```
- 例：
  ```dockerfile
  RUN echo hello
  RUN ["/bin/echo", "hello"]
  ```
- docker daemon每次执行RUN命令时，会在原镜像外部加上一层新的文件系统（file system layer）。
  - 执行 rm 等命令也无法删除内层的文件系统中的文件。
  - 因此执行RUN命令的次数越多，镜像的体积越大。应该尽量减少RUN命令的数量，最好合并成一条RUN命令。

ENTRYPOINT：用于设置容器启动时首先执行的命令。
- 有两种写法：
  ```dockerfile
  ENTRYPOINT <command> <param1> <param1>...      # shell格式
  ENTRYPOINT ["command", "param1", "param2"...]  # exec格式
  ```
- 构建镜像时，docker daemon 会将shell格式的命令转换成exec格式再保存，并且转换时会加上前缀"/bin/sh"和"-c"。
- 例如，如果在Dockerfile中编写“Entrypoint echo hello”，在保存会被转换成：
  ```
  "Entrypoint": [
      "/bin/sh",
      "-c",
      "echo hello"
  ]
  ```

CMD：用于设置容器启动时首先执行的命令。
- 如果用户执行 docker run 命令时设置了启动命令，则会覆盖镜像中的CMD命令。
- 有三种写法：
  ```dockerfile
  CMD <command> <param1> <param1>...        # shell格式
  CMD ["command", "param1", "param2"...]    # exec格式
  CMD ["param1", "param2"...]               # 只有参数的exec格式
  ```
- Dockerfile中的 ENTRYPOINT、CMD 命令最多只能各写一个，否则只有最后一个会生效。
- ENTRYPOINT命令一般写在CMD命令之前，不过写在后面也没关系。

ENTRYPOINT 与 CMD ：
- 构建镜像时，docker daemon 会将 ENTRYPOINT、CMD 命令都保存为exec格式。
- 启动容器时，docker daemon 会将 ENTRYPOINT、CMD 命令都从exec格式转换成shell格式，再将 CMD 命令附加到 ENTRYPOINT 命令之后，然后才执行。
- 下表统计不同写法时，一个ENTRYPOINT命令与一个CMD命令组合的结果（即最终的容器启动命令是什么）：

  -|`ENTRYPOINT echo 1`|`ENTRYPOINT ["echo", "1"]`
  -|-|-
  `CMD echo 2`          |/bin/sh -c 'echo 1' /bin/sh -c 'echo 2'  |echo 1 /bin/sh -c 'echo 2'
  `CMD ["echo", "2"]`   |/bin/sh -c 'echo 1' echo 2               |echo 1 echo 2
  `CMD ["2"]`           |/bin/sh -c 'echo 1' 2                    |echo 1 2

- 可见，当ENTRYPOINT命令采用shell格式时，不会被CMD命令影响，可以忽略CMD命令。

### 多阶段构建

在一个Dockerfile中可以使用多个 FROM 命令，相当于拼接多个Dockerfile，每个 FROM 命令表示一个构建阶段的开始。
- 后一个阶段可以使用之前任一阶段生成的文件。
- 例：
  ```dockerfile
  FROM centos as stage1        # 给该阶段命名
  COPY . /root/

  FROM centos as result
  COPY --from=stage1 /root/ /root/                 # 从指定阶段的最终容器中拷贝文件
  COPY --from=nginx /etc/nginx/nginx.conf /root/   # 从其它镜像中拷贝文件
  ```
