# Docker Compose

- Docker Compose是一个Docker容器的编排工具，基于Python，由Docker官方提供。
- 它根据compose文件管理docker容器，还可以构建Docker镜像。
- 它将当前目录看作一个project，每个compose文件定义一种或多种服务，每种服务可以运行一个或多个容器实例。
- 项目名称默认为当前目录名，容器名称默认按照“项目名称_服务名称_序号”的格式命名。
- 单个服务运行多个容器实例时可能会因为使用相同的端口、容器名等资源，产生冲突。
- 安装：
yum/pip install docker-compose
- 命令：
docker-compose
-f <file>      # 指定compose文件（默认使用当前目录下的docker-compose.yml）

up          # 启动服务（会重新加载compose文件，可能会删除容器或重新创建容器）
-d        # 作为守护进程运行（否则docker-compose会阻塞终端）
--scale web=2 mysql=1    # 设置服务运行的实例数量
--build      # 在启动容器之前，先构建镜像
ps            # 显示所有正在运行的容器
restart <service>...   # 重启服务
stop <service>...    # 停止服务
start <service>...    # 启动已停止的服务
down <service>...    # 停止并删除容器
--rmi all      # 删除该服务用到的所有镜像
-v          # 删除compose文件中设置的volumes以及用到的匿名volumes
rm <service>...    # 删除已停止的服务
  -f
exec <service> <command># 在服务容器中执行一条命令
-d          # 在后台执行命令
-T          # 不分配终端（默认会分配一个tty）
--index=n      # 指定该服务的第n个容器实例
logs <service>...    # 查看服务的日志
-f          # 保持查看
--tail=n        # 查看最后n行
- docker-compose.yml的例子：
version: '2'            # 说明compose文件的版本
services:            # 开始定义服务
    web:              # 第一个服务的名称
        # build: .        # dockerfile的路径
    # container_name: web    # 容器名
        image: centos        # 使用的镜像名
        command: [tail, -f, /dev/null]    # 启动命令
        init: true        # 使用init作为一号进程
        restart: unless-stopped  # 重启的策略
        ports:          # 端口映射
            - 9000:8000
            - 9001:8001
        networks:          # 连接到的网络
            - net
    # network_mode: "host"
        links:          # 创建到其它容器的网络连接
            - mysql        # 可以使用mysql作为hostname，连接到mysql容器的网络
        volumes:          # 挂载目录
            - /root:/root
        environment:        # 环境变量
            ID: 1
            NAME: one

    mysql:            # 定义另一个服务
        image: mysql
        ...

networks:        # 定义网络（默认会创建一个compose_default网络）
    net:
        driver: bridge

