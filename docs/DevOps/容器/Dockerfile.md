# Dockerfile

：一个文本文件，用于构建 Docker 镜像。
- [官方文档](https://docs.docker.com/v17.09/engine/reference/builder/#usage)

## 内容示例

```dockerfile
FROM nginx                      # Dockerfile 中的第一条非注释命令，表示以某个镜像为基础开始构建

MAINTAINER "..."                # 注明镜像的作者
LABEL maintainer="..."          # 给镜像添加键值对格式的标签

ENV var1=value1 var2=value2 ... # 设置环境变量
ARG var1                        # 设置构建参数（可以在 docker build 时传入该参数的值）
ARG var2=value2                 # 可以给构建参数设置默认值

USER <user>                     # 切换用户（构建过程中、容器启动后都会使用该用户）
WORKDIR <dir>                   # 切换工作目录（相当于 cd 命令，此后的相对路径就会以它为起点）

COPY <src_path>... <dst_path>   # 将 Dockerfile 所在目录下的文件拷贝到镜像中
# 源路径只能是相对路径，且不能使用 .. 指向超出 Dockerfile 所在目录的路径
# 目标路径可以是绝对路径，也可以是相对路径（起点为 WORKDIR ，不会受到 RUN 命令中的 cd 命令的影响）
# 例：COPY . /root/

RUN echo "Hello World!" && \
    touch f1

VOLUME ["/root", "/var/log"]    # 将容器内的这些目录设置成挂载点
# 主要是提示用户在启动容器时应该挂载这些目录，如果用户没有主动挂载，则默认会自动创建一些匿名的数据卷来挂载
# 用 docker inspect 命令查看容器信息，可以看到各个挂载点的实际路径

EXPOSE 80                       # 暴露容器的一个端口
# 主要是提示用户在启动容器时应该映射该端口，如果用户没有主动映射，则默认会映射到宿主机的一个随机端口
```

- 用 # 声明单行注释。
- Dockerfile 中的命令名不区分大小写，但一般大写。
- 常见的基础镜像：
  - scratch ：一个空镜像。以它作为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。
  - alpine ：一个专为容器设计的 Linux 系统，体积很小，但可能遇到兼容性问题。比如它用 musl 库代替了 glibc 库。
  - slim ：一种后缀，表示某种镜像的精简版，体积较小。通常是去掉了一些文件，只保留运行时环境。

## 可执行命令

Dockerfile 中有三种可执行命令：RUN、ENTRYPOINT、CMD 。

### RUN

：用于在构建镜像的过程中，在临时容器内执行一些命令。
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
- dockerd 每次执行 ADD、COPY、RUN 命令时，会给镜像添加一层文件系统。
  - 执行 rm 等命令也无法删除下层的文件系统中的文件。
  - 因此执行这些命令的次数越多，镜像的体积越大。应该尽量减少这些命令的数量，比如将多条 RUN 命令合并成一条。

### ENTRYPOINT

：用于设置容器启动时首先执行的命令。
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

：用于设置容器启动时首先执行的命令。
- 如果用户执行 docker run 命令时设置了启动命令，则会覆盖镜像中的 CMD 命令。
- 有三种写法：
  ```dockerfile
  CMD <command> <param1> <param1>...        # shell 格式
  CMD ["command", "param1", "param2"...]    # exec 格式
  CMD ["param1", "param2"...]               # 只有参数的 exec 格式
  ```
- Dockerfile 中的 ENTRYPOINT、CMD 命令最多只能各写一个，否则只有最后一个会生效。
- ENTRYPOINT 命令一般写在 CMD 命令之前，不过写在后面也没关系。

### 比较 ENTRYPOINT 与 CMD

- 构建镜像时，dockerd 会将 ENTRYPOINT、CMD 命令都保存为 exec 格式。
- 启动容器时，dockerd 会将 ENTRYPOINT、CMD 命令都从 exec 格式转换成 shell 格式，再将 CMD 命令附加到 ENTRYPOINT 命令之后，然后才执行。
  - 因此，ENTRYPOINT 命令是容器启动时的真正入口端点。
- 下表统计不同写法时，一个 ENTRYPOINT 命令与一个 CMD 命令组合的结果（即最终的容器启动命令是什么）：

  -|`ENTRYPOINT echo 1`|`ENTRYPOINT ["echo", "1"]`
  -|-|-
  `CMD echo 2`          |/bin/sh -c 'echo 1' /bin/sh -c 'echo 2'  |echo 1 /bin/sh -c 'echo 2'
  `CMD ["echo", "2"]`   |/bin/sh -c 'echo 1' echo 2               |echo 1 echo 2
  `CMD ["2"]`           |/bin/sh -c 'echo 1' 2                    |echo 1 2

  可见，当 ENTRYPOINT 命令采用 shell 格式时，不会被 CMD 命令影响，可以忽略 CMD 命令。

## 多阶段构建

在一个 Dockerfile 中可以使用多个 FROM 命令，相当于拼接多个 Dockerfile ，每个 FROM 命令表示一个构建阶段的开始。
- 后一个阶段可以使用之前任一阶段生成的文件。
- 例：
  ```dockerfile
  FROM centos as stage1                           # 给该阶段命名
  COPY . /root/

  FROM centos as result
  COPY --from=stage1 /root/ /root/                # 从指定阶段的最终容器内拷贝文件
  COPY --from=nginx /etc/nginx/nginx.conf /root/  # 从其它镜像中拷贝文件
  ```

## 构建示例

1. 编写一个 Dockerfile ：
    ```dockerfile
    FROM nginx

    WORKDIR /tmp
    COPY . .

    RUN touch f1
    ```

2. 首次构建镜像：
    ```sh
    [root@CentOS ~]# docker build . -t nginx:v1
    Sending build context to Docker daemon  2.048kB # 发送构建上下文
    Step 1/4 : FROM nginx                           # 第一个步骤
    ---> b8cf2cbeabb9                               # 步骤结束，生成一个中间镜像（这里就是 FROM 的源镜像）
    Step 2/4 : WORKDIR /tmp                         # 第二个步骤
    ---> Running in aa5d0452df16                    # 在一个中间容器内运行
    Removing intermediate container aa5d0452df16    # 删除中间容器
    ---> 7c4d52f72d3e                               # 步骤结束，生成一个中间镜像（这里是将中间容器提交为中间镜像）
    Step 3/4 : COPY . .
    ---> c9148f6e7db9
    Step 4/4 : RUN touch f1
    ---> Running in 9b587d19b685
    Removing intermediate container 9b587d19b685
    ---> 77e41c3c83a9
    Successfully built 77e41c3c83a9                 # 成功完成构建
    Successfully tagged nginx:v1                    # 加上镜像名和标签
    ```
    - 构建镜像时，dockerd 会依次执行 Dockerfile 中的指令，分为多个步骤。
    - 每个步骤执行完之后，会将当前的构建结果保存为一个中间镜像（又称为过渡镜像，没有镜像名和标签）。
      - 执行 ADD、COPY、RUN 指令时才会添加一层文件系统，但执行所有指令时都会生成一个中间镜像。
      - 最后一个步骤生成的镜像，会成为构建的最终镜像，加上镜像名和标签。
    - 有的步骤需要执行 shell 命令，会根据上一个步骤生成的中间镜像，创建一个中间容器（intermediate container），来执行该步骤。
      - 执行完该步骤之后，生成一个中间镜像，然后删除中间容器。
      - 如果该步骤出错，则中间容器不会删除，会占用越来越多的磁盘空间。

3. 再次构建镜像：
    ```sh
    [root@CentOS ~]# docker build . -t nginx:v2
    Sending build context to Docker daemon  2.048kB
    Step 1/4 : FROM nginx
    ---> b8cf2cbeabb9
    Step 2/4 : WORKDIR /tmp
    ---> Using cache                                # 使用缓存
    ---> 7c4d52f72d3e
    Step 3/4 : COPY . .
    ---> Using cache
    ---> c9148f6e7db9
    Step 4/4 : RUN touch f1
    ---> Using cache
    ---> 77e41c3c83a9
    Successfully built 77e41c3c83a9
    Successfully tagged nginx:v2
    ```
    - 执行一个构建步骤时，如果 dockerd 发现已有的某个镜像执行过相同的构建步骤，则会使用该镜像作为缓存，而不执行当前步骤，从而节约构建时间。
    - 如果某个构建步骤不使用缓存，则之后的所有步骤都不会再使用缓存。
    - 例：
      - 执行 RUN 指令时，如果指令的内容相同，则会使用缓存。
      - 执行 ADD、COPY 指令时，如果指令的内容相同，拷贝的文件的哈希值也相同，才会使用缓存。
      - 不过使用缓存不一定合适，比如执行 `RUN date > f1` 时，如果使用缓存，则只会记录首次构建的时间。

4. 查看本机的所有镜像：
    ```sh
    [root@CentOS ~]# docker images -a
    REPOSITORY        TAG                 IMAGE ID            CREATED             SIZE
    nginx             v1                  77e41c3c83a9        3 minutes ago       133MB
    nginx             v2                  77e41c3c83a9        3 minutes ago       133MB
    <none>            <none>              c9148f6e7db9        3 minutes ago       133MB
    <none>            <none>              7c4d52f72d3e        3 minutes ago       133MB
    nginx             latest              b8cf2cbeabb9        11 days ago         133MB
    ```
    - 可见，两次构建的最终镜像 nginx:v1 和 nginx:v2 ，是同一个镜像，拥有相同的 ID ，只是标签不同。
      - 因为第二次用的是之前缓存的镜像。
    - 每个步骤生成的中间镜像保留了下来，以便用作下一次构建的缓存。
      - 这些中间镜像属于悬空镜像。
      - 如果删除构建的最终镜像 nginx:v1 ，则会将它调用的中间镜像也删除。

5. 注释掉 `WORKDIR /tmp` ，再次构建镜像：
    ```sh
    [root@CentOS ~/tmp]# docker build . -t nginx:v2
    Sending build context to Docker daemon  2.048kB
    Step 1/3 : FROM nginx
    ---> b8cf2cbeabb9
    Step 2/3 : WORKDIR /tmp
    ---> Using cache                                # 使用缓存
    ---> 7c4d52f72d3e
    Step 3/3 : RUN touch f1                         # Dockerfile 从该步骤开始，与已有的镜像不同，因此不再使用缓存
    ---> Running in b7d99ef57d73
    Removing intermediate container b7d99ef57d73
    ---> 44be442f0574
    Successfully built 44be442f0574
    ```
