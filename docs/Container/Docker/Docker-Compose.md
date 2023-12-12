# Docker Compose

：一个命令行工具，用于编排 Docker 容器。
- [官方文档](https://docs.docker.com/compose/compose-file/)
- 由 Docker 公司发布，采用 Python 开发。
- 擅长管理当前主机上的多个容器，但不方便管理其它主机上的容器。

## 安装

- 用 pip 安装：
  ```sh
  pip3 install docker-compose
  ```

- 用 yum 安装：
  ```sh
  yum install docker-compose
  ```

## 命令

```sh
docker-compose
            -f <file>                 # 指定 compose 文件。默认会在当前目录及祖父目录中寻找 docker-compose.yml 文件
            -p <name>                 # --project-name ，指定项目名，默认采用 compose 文件所在的目录名

            # 启动
            up [service]...           # 启动服务，这会创建并启动容器
                -d                    # 以 daemon 方式运行。默认会在当前终端的前台运行
                --build               # 总是构建镜像。默认如果镜像已存在，则不会构建
                --force-recreate      # 总是重新创建容器。默认会检查 compose 文件，如果配置变化则删除容器再重新创建
                --scale web=2 redis=1 # 设置各服务运行的实例数量
            ps      [service]...      # 显示正在运行的服务（的容器）
            start   [service]...      # 启动已停止的服务
            restart [service]...      # 重启服务

            # 停止
            stop    [service]...      # 停止服务
                -t <n>                # 超时时间，默认为 10 秒
            kill    [service]...      # 杀死服务
                -s <signal>           # 发送的信号，默认为 SIGKILL
            down                      # 停止并删除所有容器，默认会删除用到的网络
                -v                    # --volumes ，同时删除 compose 文件中定义的 volumes 以及用到的匿名 volumes
                --rmi all             # 同时删除该服务用到的所有镜像

            exec <service> <command>  # 在服务的容器中执行一条命令
                -d                    # 在后台执行命令
                -T                    # 不分配终端（默认会分配一个 tty）
                --index=n             # 指定该服务的第 n 个容器实例

            logs <service>...         # 查看服务的日志
                -f                    # 保持显示
                -t                    # 显示时间戳
                --tail 10             # 显示最后几行
```
- 编写好 compose 文件之后，通常执行以下命令来启动容器：
  ```sh
  docker-compose up         # 先尝试在前台运行，看日志是否正常
  Ctrl + C                  # 终止运行
  docker-compose up -d      # 以 daemon 方式运行
  docker-compose down       # 销毁服务
  ```
- 用 docker-compose 命令启动容器之后，也可以用 docker 命令查看、管理。

## compose 文件

- docker-compose 命令根据 compose 配置文件来创建、管理 docker 容器。
  - compose 文件保存为 yaml 格式，扩展名为 .yaml 或 .yml 。
- compose 文件的主要版本：
  - v2
  - v3
    - 移除了 cpu_shares、mem_limit 等限制容器资源使用率的配置，改为通过 deploy 参数配置，但只支持部署到 docker swarm 集群。

### 语法

例：
```yml
version: '3'                  # 声明 compose 文件的语法版本

services:                     # 开始定义服务

  redis:                      # 定义第一个服务
    image: redis:5.0.5        # 指定使用的镜像
    networks:
      - net

  web:                        # 定义第二个服务
    container_name: web       # 指定生成的容器名
    # scale: 1                # 运行的实例数

    # 关于镜像
    # image: centos:7
    build:                    # 使用构建出的镜像
      context: ./etc
      dockerfile: Dockerfile
      network: host
      args:
        arg1: Hello

    # 关于启动
    depends_on:               # 声明对其它服务的依赖关系
      - redis                 # 这表示 docker-compose start 时会先启动 redis 服务，再启动 web 服务。docker-compose stop 时顺序相反，而 docker-compose restart 时不控制顺序
    init: true                # 使用 init 作为 1 号进程
    hostname: CentOS          # 主机名
    user: root                # 覆盖 Dockerfile 中的 USER
    working_dir: /opt         # 覆盖 Dockerfile 中的 WORKDIR
    privileged: false         # 是否开启特权模式
    entrypoint:               # 覆盖 Dockerfile 中的 ENTRYPOINT ，取值可以为字符串类型或列表类型
      - /bin/sh
      - -c
      - echo Hello            # 此处容器的启动命令为 /bin/sh -c 'echo Hello' World ，实际上只会执行 echo Hello
      - World
    command: echo Hello       # 覆盖 Dockerfile 中的 CMD
    restart: unless-stopped   # 容器的重启策略
    # stop_signal: SIGTERM    # 执行 docker stop 时向容器发送的信号
    # stop_grace_period: 10s  # 执行 docker stop 之后，如果容器超时未终止，则发送 SIGKILL 信号强制杀死

    # 关于环境变量
    environment:              # 环境变量，采用数组的格式声明
      - var1=1
      - var2=hello
    # environment:            # 也可以采用键值对的格式声明
    #   var1: 1
    #   var2: hello
    env_file:                 # 从文件中导入环境变量。这些文件中每行为 VAR=VALUE 的格式，用 # 声明单行注释
      - ./test.env

    # 关于标签
    labels:                   # 给容器添加标签。注意 key 不加引号，而 value 必须加引号
      project: "test_1"
      branch: "dev"
      - /etc/test.env

    # 关于网络
    dns:                      # 指定 DNS 服务器
      - 8.8.8.8
    networks:                 # 使当前容器连接到一些 docker 网络
      - net
    # network_mode: host      # 网络模式，不能与 networks 同时配置
    # links:                  # 使当前容器连接到其它容器。links 配置参数已弃用，建议改用 networks 配置
    #  - redis
    ports:                    # 映射端口
      - 80:8080
      - 80:8080/udp           # 映射 UDP 端口
      - 9090-9091:8080-8081   # 映射连续多个端口
      - 127.0.0.1:80:8080     # 映射宿主机指定 Socket 的端口
      - '1022:22'             # YAML 有一个特殊语法，如果冒号 : 右侧的数小于 60 ，则视作 60 进制数。为了避免这种情况，需要将这行字符串加上定界符

    # 关于挂载
    volumes:
      - /root/data:/root/data # 挂载文件或目录
      - ./log:/root/log       # 支持挂载相对路径（必须以 ./ 或 ../ 开头，省略的话则会视作数据卷的名称）
      - conf:/root/conf       # 挂载数据卷（不允许省略数据卷名，因此不支持挂载匿名卷）

    # 设置 ulimit 参数
    ulimits:
      nproc: 65535
      nofile:
        soft: 20000
        hard: 40000

    # 健康检查
    healthcheck:
      test: curl http://localhost || exit 1
      interval: 1m30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:                     # 定义网络。每个网络按 <project>_<network> 的格式命名
  # default:                  # 如果没有自定义网络，则默认会创建一个 default 网络，让上述所有服务的容器连接到它，但不会接入初始的 bridge 网络
  net:
    # driver: bridge

volumes:                      # 所有挂载的数据卷都必须在此定义。每个数据卷按 <project>_<volume> 的格式命名
  conf:
  db:
```
- 每个 compose 文件可以定义一个或多个服务，每个服务可以运行一个或多个容器实例。
  - 如果用户不指定生成的容器名，则会自动按照 "项目名_服务名_实例编号" 的格式命名，比如：web_web_1 。
  - 一个服务运行多个容器实例时，可能因为使用相同的资源而冲突，比如：
    - 指定的容器名相同，此时应该让它自动生成容器名
    - 挂载的宿主机路径或数据卷相同
    - 映射的端口相同
  - 使用多个 compose 文件时，需要避免它们所在的目录名相同，导致生成的容器、网络、数据卷同名而冲突。
- 上例中，web 容器向宿主机映射了两个端口，而 redis 容器没有映射端口，因此不能被宿主机访问。
  - 两个容器都连接到了 net_1 网络，因此可以相互访问。比如 web 容器可以通过 `127.0.0.1:6379` 或 `redis:6379` 访问到 redis 容器。
- 使用 depends_on 并不能判断服务是否就绪，不如自定义启动脚本，等上一个服务启动就绪了，才启动当前服务。如下：
  ```yml
  command:
    - /bin/bash
    - -c
    - |
      while ! curl 127.0.0.1:80;
      do
        sleep 1;
      done
      python3 run.py
  ```
- compose 文件中支持引用环境变量，例如：
  ```yml
  version: '3'

  services:
    redis:
      image: redis:${IMAGE_TAG}
      environment:
        var1: $var1
  ```
  - 执行 docker-compose 命令时，会尝试在当前 shell 或 ./.env 文件中读取同名的环境变量，如果不存在则取值为空。

- docker-compose 会自动给容器添加一些 labels ，例如：
  ```sh
  com.docker.compose.config-hash         : "fcd1bc82cbd8c940c0f6b5bc9c053914332bc3a8a2f4d51b46924feb0e7c05b7"
  com.docker.compose.container-number    : "1"
  com.docker.compose.oneoff              : "False"
  com.docker.compose.project             : "redis"
  com.docker.compose.project.config_files: "docker-compose.yml"
  com.docker.compose.project.working_dir : "/opt/redis"
  com.docker.compose.service             : "redis"
  com.docker.compose.version             : "1.29.1"
  ```
