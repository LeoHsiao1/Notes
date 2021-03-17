# Dockerfile

：一个文本文件，用于构建 Docker 镜像。
- [官方文档](https://docs.docker.com/v17.09/engine/reference/builder/#usage)

## 例

```dockerfile
FROM nginx                       # Dockerfile 中的第一条非注释命令，表示以某个镜像为基础开始构建

MAINTAINER "..."                 # 注明镜像的作者
LABEL maintainer="..."           # 添加镜像的标签

ENV var1=value1 var2=value2 ...  # 设置环境变量
ARG var1                         # 设置构建参数（可以在 docker build 时传入该参数的值）
ARG var2=value2                  # 可以给构建参数设置默认值

USER <用户名>                     # 切换用户（构建过程中、容器启动后都会使用该用户）
WORKDIR <目录>                    # 切换工作目录（相当于 cd 命令，此后的相对路径就会以它为起点）

COPY <源路径>... <目标路径>        # 将宿主机上下文目录中的文件拷贝到镜像中
# 源路径只能是相对路径，且不能使用 .. 指向超出上下文目录的路径
# 目标路径可以是绝对路径，也可以是相对路径（起点为 WORKDIR ，不会受到 RUN 命令中的 cd 命令的影响）
# 例：COPY . /root/

RUN echo "Hello World!" && \
    touch f1

VOLUME ["/root", "/var/log"]      # 将容器内的这些目录设置成挂载点
# 主要是提示用户在启动容器时应该挂载这些目录，如果用户没有主动挂载，则默认会自动创建一些匿名的数据卷来挂载
# 用 docker inspect 命令查看容器信息，可以看到各个挂载点的实际路径

EXPOSE 80                         # 暴露容器的一个端口
# 主要是提示用户在启动容器时应该映射该端口，如果用户没有主动映射，则默认会映射到宿主机的一个随机端口
```

- 用 # 声明单行注释。
- Dockerfile 中的命令名不区分大小写，但一般大写。
- 常见的基础镜像：
  - scratch ：一个空镜像。以它作为基础镜像，将可执行文件拷贝进去，就可以构建出体积最小的镜像。
  - alpine ：一种专为容器设计的 Linux 系统，体积很小，但可能遇到兼容性问题。比如它用 musl 库代替了 glibc 库。
  - slim ：一种后缀，表示某种镜像的精简版，体积较小。通常是去掉了一些文件，只保留运行时环境。

## 可执行命令

Dockerfile 中有三种可执行命令：RUN、ENTRYPOINT、CMD 。

### RUN

- ：用于在构建镜像的过程中，在临时容器内执行一些命令。
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
- dockerd 每次执行 RUN 命令时，会在原镜像外部加上一层新的文件系统（file system layer）。
  - 执行 rm 等命令也无法删除内层的文件系统中的文件。
  - 因此执行 RUN 命令的次数越多，镜像的体积越大。应该尽量减少 RUN 命令的数量，最好合并成一条 RUN 命令。

### ENTRYPOINT

- ：用于设置容器启动时首先执行的命令。
- 有两种写法：
  ```dockerfile
  ENTRYPOINT <command> <param1> <param1>...      # shell 格式
  ENTRYPOINT ["command", "param1", "param2"...]  # exec 格式
  ```
- 构建镜像时，dockerd 会将 shell 格式的命令转换成 exec 格式再保存，并且转换时会加上前缀"/bin/sh"和"-c"。
- 例如，如果在 Dockerfile 中编写“Entrypoint echo hello”，在保存会被转换成：
  ```dockerfile
  "Entrypoint": [
      "/bin/sh",
      "-c",
      "echo hello"
  ]
  ```

### CMD

- ：用于设置容器启动时首先执行的命令。
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
  FROM centos as stage1        # 给该阶段命名
  COPY . /root/

  FROM centos as result
  COPY --from=stage1 /root/ /root/                 # 从指定阶段的最终容器内拷贝文件
  COPY --from=nginx /etc/nginx/nginx.conf /root/   # 从其它镜像中拷贝文件
  ```
