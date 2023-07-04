# Dockerfile

：一个文本文件，用于描述构建 Docker 镜像时需要执行的指令。
- [官方文档](https://docs.docker.com/engine/reference/builder/)

## 语法

- Dockerfile 中可以包含多行指令（instruction）。
  - 指令名不区分大小写，但一般大写。
  - 一般在每行以指令名开头，允许添加前置空格。
  - 第一个非注释的指令应该是 FROM ，否则报错：`no build stage in current context`
    - Dockerfile 至少需要包含一个 FROM 指令，其它指令都可以省略。

- Dockerfile 中的大部分指令可使用多次。
  - ENTRYPOINT、CMD 指令如果存在多个，则只有最后一个会生效。

- 用 # 声明单行注释，且必须在行首声明。
  - 执行 Dockerfile 之前，注释行会被删除。因此：
    ```sh
    RUN echo hello \
        # comment
        world
    ```
    会变成：
    ```sh
    RUN echo hello \
        world
    ```

## 构建阶段

- dockerd 构建镜像时，会依次执行 Dockerfile 中的指令。
  - 每个指令划分为一个构建步骤（build step）
  - 从 FROM 指令开始的一组指令划分为一个构建阶段（build stage）。

### FROM

：表示以某个镜像为基础镜像，开始一个构建阶段。
- 会沿用基础镜像的 layer ，继承其大部分指令的配置。
- 语法：
  ```sh
  FROM [--platform=<platform>] <image> [AS <name>]
  ```
  - FROM 指令表示一个构建阶段的开始，可用 AS 给该阶段命名。
  - 有的程序不支持跨平台运行，因此需要指定不同的 --platform ，对不同平台分别构建镜像。常见的几种平台（OS/Architecture）：
    ```sh
    windows/amd64     # 常用于 Windows 主机
    linux/amd64       # 常用于 Linux 主机
    linux/arm64
    linux/arm64/v8    # 常用于 Apple M1 CPU
    ```
    - 默认根据本机的操作系统、CPU 架构，指定 --platform 的值。

- 例：
  ```sh
  FROM nginx
  FROM nginx AS stage1
  ```
- 基础镜像举例：
  - scratch ：一个空镜像。以它作为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。
  - *-slim ：一种后缀，表示某种镜像的精简版，体积较小。通常是去掉了一些文件，只保留运行时环境。
  - busybox ：集成了许多常用的 Unix 命令，体积只有 2MB ，相当于一个小巧的工具箱。
  - debian
  - alpine ：一个专为容器设计的轻量级 Linux 系统，体积只有 5MB 。
    - 包含了 busybox ，用 musl libc 库代替了 glibc 库，可能遇到兼容性问题。
    - 可用 apk add 命令安装软件包。
    - busybox 不包含 curl 命令，可用以下命令启动一个包含 curl 的容器：
      ```sh
      docker run -it --rm --entrypoint sh alpine/curl
      ```
  - Container Linux ：一个专为容器设计的轻量级 Linux 系统，由 CoreOS 公司发布。2020 年停止开发，被 Fedora CoreOS 替代。

### 多阶段

- 一个 Dockerfile 可以包含多个 FROM 指令，即多个构建阶段。
- 使用多阶段构建的优点：
  - 将复杂的 Dockerfile 划分成多个独立的部分。
  - 减小镜像体积。
    - 一个构建步骤 step ，会使用之前 step 的中间镜像，继承 layer 中的全部文件，因此镜像容易包含无用文件。
    - 而一个构建阶段 stage ，会使用一个独立的基础镜像，但可以选择性地 COPY 之前 stage 的文件。
- 例：
  ```sh
  FROM nginx AS stage1                             # 开始一个阶段，并用 AS 命名
  RUN touch /root/f1

  FROM nginx AS stage2
  COPY --from=stage1  /root/f1  /tmp/              # 从指定阶段的最终镜像中拷贝文件
  COPY --from=nginx   /etc/nginx/nginx.conf /tmp/  # 从其它镜像中拷贝文件
  RUN  ls /tmp
  ```

- 存在多个 FROM 阶段时，传入的构建参数会被第一个声明该 ARG 的阶段获取，之后的阶段不能再获取。
  ```sh
  FROM  nginx
  ARG   =10

  FROM  nginx
  ARG   A
  # 这里 $A 的值为空
  RUN   echo $A
  ```

- 可以在第一个 FROM 指令之前声明 ARG 指令，此时该 ARG 变量会存在于所有 FROM 阶段。如下：
  ```dockerfile
  ARG   A=10

  FROM  nginx
  # 此时 $A 属于当前作用域，值为空
  ENV   B=$A
  # 如果声明一个同名的 ARG 变量并赋值为空，则可以获得全局作用域的值，因此这里 $A 的值为 10
  ARG   A
  RUN   echo $A

  FROM  nginx
  # 这里 $A 的值为 10
  ARG   A
  RUN   echo $A
  ```

## 变量

- Dockerfile 中可通过 ARG、ENV 指令定义变量，可在大部分指令中引用。
  - 例：
    ```sh
    ARG     A=10
    ENV     B=$A

    EXPOSE  ${A:-80}
    WORKDIR ${A:+'/tmp'}
    ```
  - 支持多种读取变量的语法：
    ```sh
    $var
    ${var}
    ${var:-default}      # 如果变量存在且不为空，则返回其值，否则返回默认值
    ${var:+default}      # 如果变量存在且不为空，则返回默认值，否则返回空
    ```

### ARG

：声明一个或多个键值对格式的构建参数。
- 例：
  ```sh
  ARG var1  \
      var2=value2
  ```
  - 可以不赋值，此时值为空。
- 构建镜像时，可通过 `docker build --build-arg xx` 从 Dockerfile 外部传入构建参数，赋值给 ARG 变量。
  - 如果想从外部赋值给 ENV 指令，则需要先赋值给 ARG 变量，然后在 ENV 指令中读取 ARG 变量。如下：
    ```sh
    ARG     A=10
    ENV     B=$A
    ```

### ENV

：给容器内 shell 添加一个或多个键值对格式的环境变量。
- 语法与 ARG 指令相同。

- 比较 ARG 与 ENV 变量：
  - ARG 变量的作用域更广。在 ENV、RUN 指令中都可读取 ARG 变量，而在 ARG 指令中不能读取 ENV 变量。
  - ARG 变量的寿命更短，只能在构建镜像时读取。而 ENV 变量会添加到容器内 shell 中，在构建镜像、运行镜像时都可读取。
    - 制作镜像之后，可通过 `docker history <image>` 命令查看 ARG 变量的值，因此不应该通过 ARG 传递密码等敏感信息。可改为读取 secret 文件，或者让最终镜像不继承当前构建阶段。

### LABEL

：给镜像添加一个或多个键值对格式的标签。
- 语法与 ARG 指令相同，但必须赋值。
- 标签属于 docker 对象的元数据，不会影响容器内进程。

## 文件

### COPY

：从构建上下文拷贝文件到镜像中。
- 语法：
  ```sh
  COPY <src_path>...  <dst_path>
      --chown=<user>:<group>    # 拷贝之后的文件权限
      --from=<name>             # 表示拷贝的源对象，默认是 build context ，可以指定其它构建阶段或镜像
  ```
  - src_path 只能是相对路径，且不能使用 .. 指向超出构建上下文的路径。
    - src_path 可以包含通配符 ? 和 * 。
    - src_path 为目录时，不会拷贝该目录，而是拷贝该目录下的所有文件。
  - dst_path 可以是相对路径或绝对路径。
    - 为相对路径时，起点为 WORKDIR 。不会受到 RUN 指令中的 cd 命令的影响，因为每个构建步骤都是创建一个新的中间容器，工作目录复位为 WORKDIR 。
- 例：
  ```sh
  COPY *.py /tmp/
  ```

### ADD

：用法与 COPY 相似，但支持 src_path 为 URL 。

## 执行命令

### RUN

：用于在构建镜像时，在中间容器内执行一些 shell 命令。
- 有两种写法：
  ```sh
  RUN <command> <param1> <param2>...        # shell 格式
  RUN ["command", "param1", "param2"...]    # exec 格式，即 JSON array 。注意使用双引号，否则使用单引号会被视作 shell 格式
  ```
  - shell 格式是在 shell 解释器中执行命令。而 exec 格式是直接执行命令，因此不支持 shell 语法，比如用管道符、用 $ 读取变量。
  - 制作镜像时，dockerd 会将所有命令都从 shell 格式转换成 exec 格式 `["/bin/sh", "-c", "<command> <param1> <param2>..."]` ，然后保存 。
    - 在 Windows 平台上，前缀为 `["cmd", "/S", "/C"]` 。
  - 在容器中，dockerd 会将所有命令都从 exec 格式转换成 shell 格式，然后执行。
- 例：
  ```sh
  RUN echo Hello && \
      touch f1
  RUN ["/bin/echo", "hello"]
  ```

### ENTRYPOINT、CMD

- ENTRYPOINT、CMD 指令都用于设置容器的启动命令，前者的优先级更高。
  - 都支持 shell 格式、exec 格式两种写法。CMD 指令还支持第三种写法：
    ```sh
    CMD ["param1", "param2"...]   # 只有参数的 exec 格式
    ```
  - 创建容器时，dockerd 会将 ENTRYPOINT、CMD 命令都从 exec 格式转换成 shell 格式，再将 CMD 命令附加到 ENTRYPOINT 命令之后，然后执行。
    - 如果执行 `docker run <image> [command]` 时声明了启动命令，则会覆盖镜像中的 CMD 指令。
    - 还可通过 `docker run --entrypoint` 覆盖镜像中的 ENTRYPOINT 指令。
- 下表统计不同写法时， ENTRYPOINT 指令与 CMD 指令组合的结果，即容器的启动命令是什么：

  -|`ENTRYPOINT echo 1`|`ENTRYPOINT ["echo", "1"]`
  -|-|-
  `CMD echo 2`          |/bin/sh -c 'echo 1' /bin/sh -c 'echo 2'  |echo 1 /bin/sh -c 'echo 2'
  `CMD ["echo", "2"]`   |/bin/sh -c 'echo 1' echo 2               |echo 1 echo 2
  `CMD ["2"]`           |/bin/sh -c 'echo 1' 2                    |echo 1 2

  - ENTRYPOINT 指令应该采用 exec 格式，因为采用 shell 格式时，CMD 指令不会被执行，而且容器内由 shell 解释器担任 1 号进程。
  - 一般 ENTRYPOINT 指令填程序的启动命令，CMD 指令填程序的启动参数。例如：
    ```dockerfile
    ENTRYPOINT ["java"]
    CMD ["-jar", "test.jar"]
    ```

### SHELL

：声明执行 shell 格式的命令时，采用的 shell 解释器。
- 默认值：
  ```sh
  SHELL ["/bin/sh", "-c"]
  ```

### ONBUILD

：用于声明触发器（build trigger），托管一个普通的 Dockerfile 命令。当其它镜像通过 FROM 继承当前镜像时，就会执行所有触发器。
- 不支持嵌套 ONBUILD 。
- 例：在构建 nginx:v1 的 Dockerfile 中加入 ONBUILD ：
  ```sh
  ONBUILD RUN mkdir -p /data
  ONBUILD COPY . /data
  ONBUILD RUN ls /data
  ```
  使用 nginx:v1 作为基础镜像，构建另一个镜像：
  ```sh
  [root@CentOS ~]# docker build . -t nginx:v2
  Sending build context to Docker daemon  2.048kB
  Step 1/2 : FROM  nginx:v1
  # Executing 3 build triggers      # 在 FROM 步骤，依次执行所有触发器，每个触发器都会创建一个中间容器
  ---> Running in ba646d1c9824
  Removing intermediate container ba646d1c9824
  ---> Running in 09ba6f8a6933
  Dockerfile
  Removing intermediate container 09ba6f8a6933
  ---> 8f66dce6bb3c
  Step 2/2 : EXPOSE 80
  ---> Running in 1f6182a06031
  Removing intermediate container 1f6182a06031
  ---> 2b4beb4d379a
  Successfully built 2b4beb4d379a
  Successfully tagged nginx:v2
  ```

## 其它

### USER

：切换容器内的 shell 用户。
- 镜像构建时、构建之后都会使用该配置。
- 语法：
  ```sh
  USER <user>[:<group>]
  ```

### WORKDIR

：切换容器内的 shell 工作目录。
- 镜像构建时、构建之后都会使用该配置。
- 语法：
  ```sh
  WORKDIR <dir>
  ```

### EXPOSE

：声明容器内进程监听的端口。
- 如果用户创建容器时，没有主动映射该端口，则并不会自动映射，除非使用 `docker run -P` 。
- 例：
  ```sh
  EXPOSE 80
  EXPOSE 80/tcp 80/udp
  ```
  - 默认为 TCP 协议。

### VOLUME

：将容器内的目录声明为挂载点。
- 如果用户创建容器时，没有主动覆盖该挂载点，则默认会自动创建匿名的数据卷来挂载。
- 例：
  ```sh
  VOLUME /data
  VOLUME /root  /var/log
  ```

### STOPSIGNAL

：声明 `docker stop` 停止容器时，应该给 1 号进程发送的信号。
- 默认值：
  ```sh
  STOPSIGNAL  SIGTERM
  ```

## 例

- 例：通过多阶段构建一个 Java 镜像
  ```dockerfile
  # 多阶段共享的 ARG 变量
  ARG GIT_REPO=https://github.com/xx/xx.git \
      GIT_REFS=master

  # 基础阶段。这些配置很少变动，重复构建时应该命中缓存，还可以做成一个基础镜像
  FROM openjdk:8u312-jre-buster AS base_image

  # 定义环境变量
  ENV USER=test \
      USER_ID=1000  \
      WORK_DIR=/opt

  # 创建用户及目录
  RUN useradd $USER -u $USER_ID -m -s /bin/bash && \
      mkdir -p $WORK_DIR && \
      chown -R $USER:$USER $WORK_DIR

  # 其它配置
  USER $USER
  WORKDIR $WORK_DIR
  # EXPOSE 80
  # VOLUME $WORK_DIR/data

  # 构建阶段
  FROM maven:3.8.4-jdk-8 AS builder
  WORKDIR $WORK_DIR
  RUN git clone $GIT_REPO .   && \
      git checkout $GIT_REFS  && \
      mvn clean package

  # 最终阶段
  FROM base_image
  LABEL GIT_REPO=$GIT_REPO \
        GIT_REFS=$GIT_REFS
  COPY --from=builder /root/*/target/*.jar .
  ENTRYPOINT ["java"]
  CMD ["-jar", "test.jar"]
  ```

- 例：给容器编写一个 entrypoint.sh 脚本，可实现复杂的启动过程
  ```dockerfile
  ...
  COPY ./entrypoint.sh /
  ENTRYPOINT ["/entrypoint.sh"]
  CMD ["-jar", "test.jar"]
  ```
  entrypoint.sh 的内容示例：
  ```sh
  #!/bin/bash
  set -eu

  # 如果传入的 CMD 命令即 $@ 中，第一个参数为 -jar ，则采用正常的启动命令
  if [ "$1" = '-jar' ]; then
      # 调整工作目录的权限。该目录可能是挂载目录，因此在容器启动时才能确定权限
      chown -R $USER "$WORK_DIR"

      # 如果工作目录为空，则进行初始化
      # if [ -z "$(ls -A "$WORK_DIR")" ]; then
      #     gosu $USER init.sh
      # fi

      # 以非 root 用户运行进程，用 $@ 作为进程的启动命令
      exec gosu $USER "$@"
  fi

  # 如果 $@ 不匹配以上条件，则直接执行
  exec "$@"
  ```
  - 这里没有通过 USER 指令切换用户，而是先以 root 用户运行 entrypoint.sh 脚本，方便调整目录权限。然后脚本通过 gosu 切换到普通用户，提高安全性。
  - gosu 命令与 sudo 类似，用于以指定用户的身份执行一个命令。
    - sudo 命令会创建一个子进程去执行，而 gosu 会通过 exec 方式执行。
  - 通过 exec 方式执行命令，会让该命令进程替换当前 shell 进程，作为 1 号进程，且该命令结束时当前 shell 也会退出。
  - entrypoint.sh 调用的环境变量在 Dockerfile 中声明了默认值，也可以在启动容器时修改，例如：docker run -e USER=xx

- 例：使用 tini
  ```dockerfile
  ...
  RUN wget https://github.com/krallin/tini/releases/download/v0.19.0/tini -O /usr/bin/tini && \
      chmod +x /usr/bin/tini
  ENTRYPOINT ["tini", "--", "/entrypoint.sh"]
  CMD ["-jar", "test.jar"]
  ```

## 构建镜像

### build 命令

```sh
docker build <PATH>|<URL>
            -f <file>                   # Dockerfile 的路径，默认为 <dir>/Dockerfile
            -t <image>                  # --tag ，给构建出的镜像加上名称和标签（可多次使用该选项）
            --build-arg VERSION="1.0"   # 传入 ARG 构建参数。可多次使用该选项，每次只能传入一个键值对
            --target <stage>            # 执行完某个阶段就停止构建
            --no-cache                  # 构建时不使用缓存

            --force-rm                  # 某个 step 构建失败时，默认不会删除中间容器，以便用户调试。启用该选项则会强制删除
            --network <name>            # 设置中间容器使用的网络
            --add-host <host>:<ip>      # 在中间容器中，将某个主机名解析到某个 ip 。该 DNS 规则不会保存到 /etc/hosts 文件中
```
- 执行 `docker build <PATH>` 时，会将目标目录及其子目录的所有文件（包括隐藏文件）作为构建上下文（build context），拷贝发送给 dockerd ，从而允许用 COPY 或 ADD 指令拷贝文件到容器中。
  - 因此文件会被拷贝两次，有两倍耗时。比较大的文件可以利用缓存，或者用 wget 下载到镜像中。
  - 执行 `docker build - < Dockerfile` ，则只会发送 Dockerfile 作为构建上下文。
- 可以在 .dockerignore 文件中声明不想被发送的文件或目录。如下：
  ```sh
  *.log     # 匹配当前目录下的文件
  !*.md     # ! 表示反向匹配
  */tmp*    # 匹配子目录下的文件
  **/tmp*   # ** 匹配任意数量的目录
  **/.git
  ```
  - Dockerfile 和 .dockerignore 文件总是会被发送给 dockerd ，即使在这声明了也没用。

### BuildKit

- Docker 的 18.09 版本增加了一个 BuildKit 构建器。特点如下：
  - 采用一种更低级的格式来定义构建过程，称为（Low Level Builder ，LLB）。
    - 兼容 Dockerfile ，通过前端组件自动将其转换成 LLB 。
  - 优化了构建过程，减少耗时。
    - 会显示每个 step 的耗时。
    - 会并行构建所有 stage ，除非存在 FROM 依赖关系。因此适合同时构建多个平台的镜像。
  - 构建时，由 dockerd 进程创建基于 runc 的中间容器，不是由 containerd-shim 管理，因此不能通过 docker 命令查看中间容器。

- 可通过 buildx 插件启用 BuildKit ：
  ```sh
  docker buildx
            build <dir>             # 构建镜像，兼容 docker build 的命令选项
                --cache-from <image>                  # 采用某个镜像作为缓存源
                --platform linux/arm64,...            # 指定构建的目标平台，默认采用本机平台，可指定多个平台
                --progress plain                      # 构建过程的输出类型。默认为 auto ，设置为 plain 则会显示终端输出
                --secret id=mysecret,src=/root/secret # 将宿主机上的文件声明为一个私密文件，分配 id ，可供 RUN 命令挂载
            ls                      # 列出所有 builder 实例
            du                      # 显示 buildx 占用的磁盘
            prune -f                # 清空 buildx cache
  ```
  - 也可执行 `DOCKER_BUILDKIT=1 docker build` 来启用 BuildKit 。
  - 从 Docker 23.0.0 版本开始，`docker build` 命令默认采用 BuildKit 构建器，声明 `DOCKER_BUILDKIT=0` 才会采用旧的构建器。

启用 Buildkit 时，Dockerfile 的新语法：
- 支持在 Dockerfile 中声明语法版本：
  ```sh
  # syntax=docker/dockerfile:1.2
  ```
- RUN 命令支持使用 `--mount` 选项，有多种挂载类型：
  - bind ：默认挂载类型。
    ```sh
    RUN --mount=type=bind,src=./dist,dst=/dist \
        --mount=type=bind,from=stage1,src=/root,dst=/root \
        ls /root
    ```
    - from 表示挂载的源对象，用法与 COPY --from 相同。
    - src 表示源路径，默认为 from 的顶级目录。
    - dst 表示目标路径，如果不存在则会自动创建。
    - 挂载时默认的访问模式为 rw ，可以改为 ro 。
    - 使用 RUN --mount 是临时挂载 build context 中的文件到容器中，当 RUN 命令执行结束就会取消挂载，因此该文件不会像 COPY 命令那样保存到镜像 layer 中。
    - 一条 RUN 命令中，可多次使用 --mount 选项，挂载多个文件。
  - cache ：用于挂载缓存目录，类似于数据卷。
    ```sh
    RUN --mount=type=cache,target=/app/node_modules,id=/app/node_modules \
        cd /app   && \
        npm install

    RUN --mount=type=cache,target=/app/node_modules,sharing=locked \
        cd /app   && \
        npm run build
    ```
    - cache 会在第一次挂载时自动创建。当构建结束，且不存在引用它的镜像时，自动删除。
      - 挂载 cache 的优点：可以让多个构建步骤共享文件。
    - cache 的 id 默认等于 target 。
    - sharing 表示并行构建时，对 cache 的访问模式。可取值如下：
      - shared ：默认值，允许并行读写。
      - locked ：同时只能有一方绑定该 cache 。
      - private ：如果 cache 已被绑定，则创建新的 cache 实例。
  - secret ：用于挂载一个私密文件。该文件不是来自 build context ，而是在 `docker buildx build --secret xx` 命令中指定的宿主机文件。
    ```sh
    RUN --mount=type=secret,id=mysecret,dst=/secret \
        cat /secret
    ```

### 例

1. 编写一个 Dockerfile ：
    ```dockerfile
    FROM nginx

    LABEL maintainer=test
    RUN echo Hello && \
        touch f1

    CMD ["nginx"]
    ```

2. 首次构建镜像：
    ```sh
    [root@CentOS ~]# docker build . -t nginx:v1
    Sending build context to Docker daemon  2.048kB # 发送构建上下文
    Step 1/4 : FROM nginx                           # 第一个步骤
    ---> ea335eea17ab                               # 步骤结束，生成一个中间镜像（这里是 FROM 的源镜像）
    Step 2/4 : LABEL maintainer=test                # 第二个步骤
    ---> Running in 144c44cb0874                    # 在一个中间容器内运行
    Removing intermediate container 144c44cb0874    # 删除中间容器
    ---> 94cb9642d8d7                               # 步骤结束，生成一个中间镜像（这里是将中间容器提交为中间镜像）
    Step 3/4 : RUN echo Hello && touch f1
    ---> Running in a1150f37fb12
    Removing intermediate container a1150f37fb12
    ---> 4da89ebe5fe6
    Step 4/4 : CMD ["nginx"]
    ---> Running in d239ef15d1eb
    Removing intermediate container d239ef15d1eb
    ---> d4c94f7870ad
    Successfully built d4c94f7870ad                 # 构建完成
    Successfully tagged nginx:v1                    # 加上镜像名和标签
    ```
    - 构建镜像时，每个步骤的主要内容为：
      1. 使用上一步骤的镜像，创建一个临时的中间容器（intermediate container），用于执行 Dockerfile 中的一个指令。
      2. 将中间容器提交为一个中间镜像，用于创建下一步骤的中间容器。
      3. 删除当前的中间容器，开始下一步骤。
    - 中间镜像会作为悬空镜像一直保留在本机，用于缓存，默认隐藏显示。
      - 如果删除构建的最终镜像，则会自动删除它调用的所有中间镜像。
      - 用 docker push 推送最终镜像时，不会推送中间镜像。
    - 大部分 Dockerfile 指令不会生成新的 layer ，只是修改了配置而生成新的中间镜像。
    - 执行 RUN 指令时，可能修改文件，添加一层新的非空 layer ，保存到镜像配置的 rootfs.diff_ids 列表。
      - 建议尽量减少 RUN 指令的数量，避免增加大量 layer ，占用过多磁盘空间。比如将多条 RUN 指令合并成一条，但合并了经常不命中缓存的命令时，又会增加构建耗时。
      - 安装软件之后，应该删除缓存。例如：
        ```dockerfile
        RUN yum update && \
            yum install -y vim && \
            yum clean all && \
            rm -rf /var/cache/yum
        ```
        ```dockerfile
        RUN apt update && \
            apt install -y vim && \
            apt clean && \
            rm -rf /var/lib/apt/lists/*
        ```
        ```dockerfile
        RUN pip install -r requirements.txt --no-cache-dir
        ```
      - 构建镜像时，使用 shell 的 rm 命令只能删除当前 layer 的文件。不能删除之前 layer 的文件，只是添加一层新的 layer ，覆盖原 layer 中的文件，因此之前的 layer 依然占用了磁盘空间。

3. 再次构建镜像：
    ```sh
    [root@CentOS ~]# docker build . -t nginx:v2
    Sending build context to Docker daemon  2.048kB
    Step 1/4 : FROM nginx
    ---> ea335eea17ab
    Step 2/4 : LABEL maintainer=test
    ---> Using cache                            # 该 step 使用了缓存
    ---> 94cb9642d8d7
    Step 3/4 : RUN echo Hello && touch f1
    ---> Using cache
    ---> 4da89ebe5fe6
    Step 4/4 : CMD ["nginx"]
    ---> Using cache
    ---> d4c94f7870ad
    Successfully built d4c94f7870ad
    Successfully tagged nginx:v1
    ```
    - 执行一个构建步骤时，如果 dockerd 发现已有的某个镜像执行过相同的构建步骤，则跳过执行当前步骤，直接采用该镜像作为中间镜像，实现缓存，减少构建耗时。
      - 如果某个构建步骤未命中缓存，则之后的所有步骤都会禁用缓存。因此建议尽量将这样的构建步骤写在 Dockerfile 后面。
      - 重复执行 RUN 指令时，如果指令的内容相同，则会使用缓存。
      - 重复执行 ADD、COPY 指令时，如果指令的内容相同，拷贝的文件的哈希值也相同，才会使用缓存。
      - 使用缓存不一定合适，例如重复执行 `RUN date > build_time` 时，得到的时间不会变，此时可通过 `docker build --no-cache` 禁用缓存。
    - 例如构建 npm 前端项目时，可以分别 install 和 build ，尽量让 install 命中缓存：
      ```dockerfile
      WORKDIR /app
      COPY package.json /app/package.json
      RUN npm install
      COPY . .
      RUN npm run build
      ```
