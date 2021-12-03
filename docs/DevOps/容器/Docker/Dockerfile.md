# Dockerfile

：一个文本文件，用于描述构建一个 Docker 镜像的步骤。
- [官方文档](https://docs.docker.com/engine/reference/builder/)

## 语法

- Dockerfile 中可以包含多行指令（instruction）。
  - 指令名不区分大小写，但一般大写。
  - 一般在每行以指令名开头，允许添加前置空格。
  - 第一条非注释的指令应该是 FROM ，否则报错：`no build stage in current context`

- dockerd 构建镜像时，会依次执行 Dockerfile 中的指令。
  - 每个指令划分为一个构建步骤（build step）
  - 从 FROM 指令开始的一组指令划分为一个构建阶段（build stage）。

- Dockerfile 中的以下指令只可使用一次：
  ```sh
  FROM
  ENTRYPOINT
  CMD
  ...
  ```
  - 如果存在多个，则可能只有最后一个会生效。

### 注释

- 用 # 声明单行注释，且必须在行首声明。
- 执行 Dockerfile 之前，注释行会被删除。因此：
  ```dockerfile
  RUN echo hello \
      # comment
      world
  ```
  会变成：
  ```dockerfile
  RUN echo hello \
      world
  ```

### FROM

：表示以某个镜像为基础开始构建。
- 例：
  ```dockerfile
  FROM nginx
  ```
- 常见的基础镜像：
  - scratch ：一个空镜像。以它作为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。
  - alpine ：一个专为容器设计的 Linux 系统，体积很小，但可能遇到兼容性问题。比如它用 musl 库代替了 glibc 库。
  - slim ：一种后缀，表示某种镜像的精简版，体积较小。通常是去掉了一些文件，只保留运行时环境。

## 关于变量

- Dockerfile 中可通过 ARG、ENV 指令定义变量，可在大部分指令中引用。
  - 例：
    ```dockerfile
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
  - 允许在第一条 FROM 指令之前插入 ARG 指令：
    ```dockerfile
    ARG     A=10
    FROM    nginx:1.$A

    # 开始 FROM 构建阶段之后，不会保留 FROM 之前的 ARG 变量，因此这里 $A 的值为空
    ENV     B=$A

    # 如果声明一个同名变量并赋值为空，就可以获得之前的值，因此这里 $A 的值为 10
    ARG     A
    EXPOSE  $A
    ```
- ARG 变量只影响构建过程，生成镜像之后不会保留。而 ENV 变量会添加到容器内 shell 中。
  - 构建镜像时，可通过 `docker build --build-arg` 传入构建参数。

### ARG

：声明一个或多个键值对格式的构建参数。
- 例：
  ```dockerfile
  ARG var1  \
      var2=value2
  ```
  - 可以赋值为空。

### ENV

：给容器内 shell 添加一个或多个键值对格式的环境变量。
- 例：
  ```dockerfile
  ENV var1 \
      var2=value2
  ```
  - 可以赋值为空。

## 其它

### LABEL

：给镜像添加一个或多个键值对格式的标签。
- 标签属于 docker 对象的元数据，不会影响容器内进程。
- 例：
  ```dockerfile
  LABEL maintainer=test \
        git_refs=master
  ```

### USER

：切换容器内 shell 用户。
- 构建镜像时、容器启动后都会使用该用户。
- 语法：
  ```dockerfile
  USER <user>
  ```

### WORKDIR

：切换容器内 shell 工作目录，相当于 cd 命令。
- 语法：
  ```dockerfile
  WORKDIR <dir>
  ```

### COPY

：将构建上下文中的文件拷贝到镜像中。
- 语法：
  ```dockerfile
  COPY <src_path>...  <dst_path>
  ```
  - src_path 只能是相对路径，且不能使用 .. 指向超出构建上下文的路径。
  - dst_path 可以是相对路径或绝对路径。
    - 为相对路径时，起点为 WORKDIR 。不会受到 RUN 指令中的 cd 命令的影响，因为每个构建步骤都是创建一个新的中间容器，工作目录复位为 WORKDIR 。
- 执行 docker build 时，会将 Dockerfile 所在目录及其子目录的所有文件（包括隐藏文件）作为构建上下文（build context），拷贝发送给 dockerd ，从而允许用 COPY 或 ADD 指令拷贝文件到容器中。
  - 可以在 `.dockerignore` 文件中声明不想被发送的文件或目录。

### EXPOSE

：声明容器内进程监听的端口，建议用户对外映射。
- 如果用户创建容器时，没有主动映射该端口，则并不会自动映射。
- 例：
  ```dockerfile
  EXPOSE 80
  ```

### VOLUME

：将容器内的目录声明为挂载点。
- 如果用户创建容器时，没有主动覆盖该挂载点，则默认会自动创建匿名的数据卷来挂载。
- 例：
  ```dockerfile
  VOLUME /data
  VOLUME ["/root", "/var/log"]
  ```

### RUN

：用于在构建镜像时，在中间容器内执行一些 shell 命令。
- 有两种写法：
  ```dockerfile
  RUN <command> <param1> <param1>...        # shell 格式
  RUN ["command", "param1", "param2"...]    # exec 格式
  ```
- 例：
  ```dockerfile
  RUN set -eu; \
      echo "Hello World!"; \
      touch f1
  RUN ["/bin/echo", "hello"]
  ```

### ENTRYPOINT

：用于设置容器启动时首先执行的 shell 命令。
- 有两种写法：
  ```dockerfile
  ENTRYPOINT <command> <param1> <param1>...      # shell 格式
  ENTRYPOINT ["command", "param1", "param2"...]  # exec 格式
  ```
- 构建镜像时，dockerd 会将 shell 格式的命令转换成 exec 格式再保存，并且转换时会加上前缀 "/bin/sh" 和 "-c" 。
- 例如，如果在 Dockerfile 中编写“Entrypoint echo hello”，在保存会被转换成：
  ```dockerfile
  "Entrypoint": [
      "/bin/sh",
      "-c",
      "echo hello"
  ]
  ```

### CMD

：用于设置容器启动时首先执行的 shell 命令。
- 有三种写法：
  ```dockerfile
  CMD <command> <param1> <param1>...        # shell 格式
  CMD ["command", "param1", "param2"...]    # exec 格式
  CMD ["param1", "param2"...]               # 只有参数的 exec 格式
  ```

### 比较 ENTRYPOINT 与 CMD

- ENTRYPOINT 命令一般写在 CMD 命令之前，不过写在后面也无影响。
  - 构建镜像时，dockerd 会将 ENTRYPOINT、CMD 命令都保存为 exec 格式。
  - 创建容器时，dockerd 会将 ENTRYPOINT、CMD 命令都从 exec 格式转换成 shell 格式，再将 CMD 命令附加到 ENTRYPOINT 命令之后，然后才执行。
    - 因此，ENTRYPOINT 命令是容器启动时的真正入口端点。
    - 如果用户创建容器时声明了启动命令，则会覆盖镜像中的 CMD 指令。
- 下表统计不同写法时，一个 ENTRYPOINT 指令与一个 CMD 指令组合的结果（即最终的容器启动命令是什么）：

  -|`ENTRYPOINT echo 1`|`ENTRYPOINT ["echo", "1"]`
  -|-|-
  `CMD echo 2`          |/bin/sh -c 'echo 1' /bin/sh -c 'echo 2'  |echo 1 /bin/sh -c 'echo 2'
  `CMD ["echo", "2"]`   |/bin/sh -c 'echo 1' echo 2               |echo 1 echo 2
  `CMD ["2"]`           |/bin/sh -c 'echo 1' 2                    |echo 1 2

  可见，当 ENTRYPOINT 指令采用 shell 格式时，不会被 CMD 指令影响，可以忽略 CMD 指令。

## 多阶段构建

- 一个 Dockerfile 可以包含多个 FROM 指令，每个 FROM 指令表示一个构建阶段的开始。
- 使用多阶段构建的好处：
  - 将复杂的 Dockerfile 划分成多个独立的部分。
  - 减小镜像体积。
    - 一个构建步骤 step ，会使用之前 step 的中间镜像，不得不继承 layer 中的全部文件，因此镜像容易包含无用文件。
    - 而一个构建阶段 stage ，会使用一个独立的基础镜像，但可以选择性地 COPY 之前 stage 的文件。
- 例：
  ```dockerfile
  FROM nginx as stage1                             # 开始一个节点，并用 as 命名
  RUN touch /root/f1

  FROM nginx as stage2
  COPY --from=stage1  /root/f1  /tmp/              # 从指定阶段的最终镜像中拷贝文件
  COPY --from=nginx   /etc/nginx/nginx.conf /tmp/  # 从其它镜像中拷贝文件
  ```

## 构建

### 命令

```sh
docker build <dir_to_Dockerfile>
            -t <image:tag>              # --tag ，给构建出的镜像加上名称和标签（可多次使用该选项）
            --build-arg VERSION="1.0"   # 传入构建参数
            --target  <stage>           # 构建到某个阶段就停止
            --network <name>            # 设置中间容器使用的网络
            --no-cache                  # 构建时不使用缓存
            --force-rm                  # 即使构建失败，也强制删除中间容器
```

### 示例

1. 编写一个 Dockerfile ：
    ```dockerfile
    FROM nginx

    LABEL maintainer=test
    RUN set -eu; \
        echo Hello

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
    Step 3/4 : RUN set -eu;     touch f1
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
          - 如果构建步骤出错，则不会删除中间容器。
    - 中间镜像会作为悬空镜像一直保留在本机，用于缓存，默认隐藏显示。
      - 如果删除构建的最终镜像，则会自动删除它调用的所有中间镜像。
      - 用 docker push 推送最终镜像时，不会推送中间镜像。
    - 大部分 Dockerfile 指令不会生成新的 layer ，只是修改了配置而生成新的中间镜像。
      - ADD、COPY、RUN 指令可能修改文件，添加一层新的非空 layer ，保存到镜像配置的 rootfs.diff_ids 列表。
        - 在构建时使用 shell 的 rm 命令并不能实际删除文件，只是添加一层新的 layer ，覆盖原 layer 中的文件。
        - 因此应该尽量减少这些指令的数量，避免增加大量 layer 。比如将多条 RUN 指令合并成一条。

3. 再次构建镜像：
    ```sh
    [root@CentOS ~]# docker build . -t nginx:v2
    Sending build context to Docker daemon  2.048kB
    Step 1/4 : FROM nginx
    ---> ea335eea17ab
    Step 2/4 : LABEL maintainer=test
    ---> Using cache                            # 使用缓存
    ---> 94cb9642d8d7
    Step 3/4 : RUN set -eu;     touch f1
    ---> Using cache
    ---> 4da89ebe5fe6
    Step 4/4 : CMD ["nginx"]
    ---> Using cache
    ---> d4c94f7870ad
    Successfully built d4c94f7870ad
    Successfully tagged nginx:v1
    ```
    - 执行一个构建步骤时，如果 dockerd 发现已有的某个镜像执行过相同的构建步骤，则跳过执行当前步骤，直接采用该镜像作为中间镜像，实现缓存，减少构建耗时。
      - 如果某个构建步骤不使用缓存，则之后的所有步骤都不会再使用缓存。
      - 重复执行 RUN 指令时，如果指令的内容相同，则会使用缓存。
      - 重复执行 ADD、COPY 指令时，如果指令的内容相同，拷贝的文件的哈希值也相同，才会使用缓存。
      - 使用缓存不一定合适，例如重复执行 `RUN date > build_time` 时，得到的时间不会变，此时可通过 `docker build --no-cache` 禁用缓存。
