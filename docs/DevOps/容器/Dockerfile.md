# Dockerfile
- Dockerfile文件的语法。
- 第一行非注释语句应该是以FROM开头，表示以某个镜像为基础构建当前镜像。
- 使用 # 号注释。
- scratch是一个空镜像，以它为基础，将可执行文件拷贝进去，就可以构建出体积最小的镜像。
- 例如：
FROM nginx
RUN echo "Hello World!" \
  && mkdir /tmp/1 \
  && rm /tmp/1
COPY ./package.json /usr/src/app/
- MAINTAINER <……>          # 注明镜像的作者
- ENV var1=value1 var2=value2 ...  # 设置环境变量
- ARG version=""          # 设置构建参数（可以被构建时传入的构建参数覆盖）
- LABEL maintainer="..."      # 添加标签信息
- USER <用户名>            # 切换到指定的用户（构建过程、容器启动后都会使用该用户）
- WORKDIR <目录>          # 切换到指定的工作目录（此后的相对路径就会以它为起点）
- 它相当于容器中的cd命令，如果该目录不存在则自动创建。
- COPY <源路径>... <目标路径>    # 将宿主机上下文目录中的文件拷贝到镜像中
- 源路径只能是相对路径，且不能使用 .. 指向超出上下文目录的路径。
- 目标路径可以是绝对路径，也可以是相对路径（起点为WORKDIR，不会受到cd命令的影响）。
- VOLUME <目录>                  # 将某个目录设置为挂载点
- 例如：VOLUME ["/root","/var/log", "/etc"]  # 设置多个挂载点
- Docker daemon启动容器时会自动在宿主机的/var/lib/docker/volumes/下创建一个随机名字的目录，挂载到容器的挂载点。需要用docker inspect查看容器信息，找到被挂载的源目录的具体路径。
- EXPOSE <端口号>    # 暴露容器的一个端口（但并没有绑定到宿主机的指定端口）
- 如果用-p选项创建容器，则EXPOSE的作用只是提醒用户应该映射哪个端口。
- 如果用-P选项创建容器，宿主机的端口就会被自动映射到被EXPOSE暴露的端口。
- 多阶段构建：在一个Dockerfile中可以使用多个FROM语句，相当于拼接了多个Dockerfile。后一个阶段可以使用之前所有阶段生成的文件。
FROM centos as builder        # 给该阶段命名
COPY . /root/

FROM centos as result
COPY --from=stage1 /root/ /root/    # 从指定阶段的最终容器中拷贝文件
- 也可以从其它镜像中拷贝文件，比如：COPY --from=nginx /etc/nginx/nginx.conf /nginx/conf
- Dockerfile中的可执行命令。
- RUN命令：在构建镜像的过程中，让临时容器执行一些命令。
- 有两种写法：
RUN <可执行文件> <param1> <param1>...        # shell格式
RUN ["可执行文件", "param1", "param2"...]      # exec格式
- 例如：
RUN /bin/bash echo hello
RUN ["/bin/bash", "echo hello"]
- docker build过程中，每执行一个RUN语句就构建一次镜像，叠加一层文件系统，因此应该尽量减少RUN命令的数量。用 \ 换行，用 && 连接多条命令。
- ENTRYPOINT命令：设置容器启动时要执行的命令（一定会被执行）。
- 有两种写法：
ENTRYPOINT <可执行文件> <param1> <param1>...    # shell格式
ENTRYPOINT ["可执行文件", "param1", "param2"...]  # exec格式
- shell格式会被转换成exec格式再保存，并且转换时会加上前缀"/bin/sh"和"-c"。例如：Dockerfile中的“Entrypoint /bin/bash echo hello”，在保存会被转换成：
"Entrypoint": [
    "/bin/sh",
    "-c",
    "/bin/bash echo hello"
]
- CMD命令：设置容器启动时默认执行的命令。它会被docker run指定的command覆盖。
- 有三种写法：
CMD <可执行文件> <param1> <param1>...        # shell格式
CMD ["可执行文件", "param1", "param2"...]      # exec格式
CMD ["param1", "param2"...]            # 只有参数的exec格式
- 第三种写法只有参数，没有可执行文件。它的用途是——作为参数附加到ENTRYPOINT命令之后。
- 如果在docker run时指定了COMMAND参数，CMD命令就会被覆盖。
- 可以在docker run时指定一条命令，覆盖CMD命令，再作为参数附加到ENTRYPOINT命令之后。
- Dockerfile中可以加入ENTRYPOINT命令和CMD命令（即使不加，也可以构建镜像）。
- Dockerfile中的ENTRYPOINT 命令应该最多只写一个，否则只有最后一个会生效。
- Dockerfile中的CMD命令应该最多只写一个，否则只有最后一个会生效。
- 如果Dockerfile中同时存在一条ENTRYPOINT命令和一条CMD命令。则：
- ENTRYPOINT命令一般写在CMD命令之前，不过写在后面也没关系。
- 创建容器时，docker daemon会直接将CMD命令附加到ENTRYPOINT命令之后（两者都事先转换成exec格式），合并成容器的启动命令（此时转换成shell格式）。
- 总结：编写Dockerfile时，主要使用ENTRYPOINT 命令进行容器启动时的初始化。需要拼接参数到ENTRYPOINT命令时，才加入CMD命令。
