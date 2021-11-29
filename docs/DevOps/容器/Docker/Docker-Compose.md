# Docker Compose

：一个 Docker 容器的编排工具。
- [官方文档](https://docs.docker.com/compose/compose-file/)
- 由 Docker 公司发布，采用 Python 开发。
- 可以管理当前宿主机上的任意个容器，但不能管理其它主机上的容器。

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
            -f <file>                 # 指定 compose 文件。默认会在当前目录及祖父目录寻找 docker-compose.yml 文件

            up [service]...           # 启动服务，即创建并启动容器（会检查 compose 文件，如果配置变化则删除容器再重新创建）
                -d                    # 以 daemon 方式运行（否则会阻塞当前终端）
                --scale web=2 mysql=1 # 设置服务运行的实例数量
                --build               # 强制构建镜像（如果镜像已存在，则默认不会再次构建）
            ps      [service]...      # 显示所有正在运行的容器
            stop    [service]...      # 停止服务
            start   [service]...      # 启动已停止的服务
            restart [service]...      # 重启服务

            down                      # 停止并删除所有容器，并删除用到的网络
                -v                    # 同时删除 compose 文件中定义的 volumes 以及用到的匿名 volumes
                --rmi all             # 同时删除该服务用到的所有镜像

            exec <service> <command>  # 在服务的容器中执行一条命令
                -d                    # 在后台执行命令
                -T                    # 不分配终端（默认会分配一个 tty）
                --index=n             # 指定该服务的第 n 个容器实例

            logs <service>...         # 查看服务的日志
                --tail 10             # 显示最后几行
                -f                    # 保持显示
                -t                    # 显示时间戳
```
- 编写好 compose 文件之后，通常只需在该目录下使用以下命令：
  ```sh
  docker-compose up         # 先尝试在前台运行，看看是否正常
  Ctrl + C                  # 终止前台进程
  docker-compose up -d      # 以 daemon 方式运行
  docker-compose down       # 销毁服务
  ```

## compose 文件

docker-compose 根据 compose 配置文件来创建、管理 docker 容器。
- compose 文件保存为 yaml 格式，扩展名为 .yaml 或 .yml 。
- 每个 compose 文件可以定义一种或多种服务，每种服务可以运行一个或多个容器实例。
  - 单个服务运行多个容器实例时可能会因为使用相同的端口、容器名等资源，产生冲突。

### 版本

compose 文件的主要版本：
- v2
- v3
  - 移除了 cpu_shares、mem_limit 等限制容器资源使用率的配置，改为通过 deploy 参数配置，但只在部署到 swarm 集群时生效。

### 语法

例：

```yml
version: '3'                  # 声明 compose 文件的语法版本

services:                     # 开始定义服务

  redis:                      # 定义第一个服务
    image: redis:5.0.5        # 指定使用的镜像（如果该镜像不存在，且没有指定 build 选项，则尝试 pull 它）
    networks:
      - net

  web:                        # 定义第二个服务
    container_name: web       # 指定生成的容器名
    # image: centos:7
    build:                    # 使用构建出的镜像
      context: ./etc
      dockerfile: Dockerfile
      network: host
      args:
        arg1: Hello
    depends_on:               # 声明对其它服务的依赖关系
      - redis                 # 这表示：docker-compose start 时会先启动 redis 服务，再启动 web 服务；docker-compose stop 时顺序相反；但 docker-compose restart 时不控制顺序

    hostname: CentOS          # 主机名
    user: root                # 覆盖 Dockerfile 中的 USER
    working_dir: /opt         # 覆盖 Dockerfile 中的 WORKDIR
    dns:                      # 指定 DNS 服务器
      - 8.8.8.8
    init: true                # 使用 init 作为 1 号进程
    entrypoint:               # 覆盖 Dockerfile 中的 ENTRYPOINT ，取值可以为字符串类型或列表类型
      - /bin/sh               # 建议通过 shell 运行启动命令，否则不能使用环境变量等功能
      - -c
      - echo Hello            # 此时容器的启动命令为 /bin/sh -c 'echo Hello' World ，实际上只会执行 echo Hello
      - World
    command: echo Hello       # 覆盖 Dockerfile 中的 CMD
    restart: unless-stopped   # 容器的重启策略

    environment:              # 环境变量，采用数组的格式声明
      - var1=1
      - var2=hello
    # environment:            # 也可以采用键值对的格式声明
    #   var1: 1
    #   var2: hello
    env_file:                 # 从文件中导入环境变量，这些文件中每行为 VAR=VALUE 的格式，用 # 声明单行注释
      - ./test.env
      - /etc/test.env

    labels:                   # 给容器添加标签。注意 key 不加引号，而 value 必须加引号
      project: "test_1"
      branch: "dev"

    networks:                 # 使当前容器连接到一些 docker 网络
      - net
    # network_mode: host      # 网络模式，不能与 networks 同时配置
    # links:                  # 使当前容器连接到其它容器。不建议使用 links 配置，而应该使用 networks 配置
    #  - redis
    ports:                    # 映射端口
      - 9000:8000             # 注意这里的每行配置是一个字符串，因此冒号 : 之后不能加空格
      - 9090-9091:8080-8081

    volumes:                  # 挂载数据卷
      - /root/data:/root/data # 可以直接挂载目录或文件
      - ./log:/root/log       # 可以挂载相对路径（必须以 ./ 或 ../ 开头，否则会被视作数据卷名）
      - conf:/root/conf       # 可以挂载数据卷

    ulimits:                  # 设置 ulimit 参数
      nproc: 65535
      nofile:
        soft: 20000
        hard: 40000

    healthcheck:              # 健康检查
      test: curl http://localhost || exit 1
      interval: 1m30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:                     # 定义网络
  # default:                  # 如果没有自定义网络，则默认创建一个名为 default 的网络
  net:
    driver: bridge

volumes:                      # 定义数据卷（服务挂载的数据卷都必须在这里声明）
  conf:
  db:
```
- 如果用户指定了生成的容器名，则只能创建多个容器实例时会因为名字冲突而失败。
  - 如果用户不指定生成的容器名，则会自动按照 ` 当前目录名 _ 服务名 _ 第几个实例 ` 的格式命名，比如：web_web_1 。
  - 同理，如果用户不指定生成的 volume 的名称，则会自动按照 ` 当前目录名 _ 数据卷名 ` 的格式命名，比如：web_conf 。
  - 如果 Service 只运行一个实例，则指定容器名、挂载指定目录比较好，这样它们的容器名、目录位置是确定不变的。
  - 如果 Service 要运行多个实例，则不指定容器名、挂载数据卷比较好，这样多个实例会自动命名，不会冲突。
- 上例中，web 容器向宿主机映射了两个端口，而 redis 容器没有映射端口，因此不能被宿主机访问。
  - 两个容器都连接到了 net_1 网络，因此可以相互访问。比如 web 容器可以通过 `127.0.0.1:6379` 或 `redis:6379` 访问到 redis 容器。
- 使用 depends_on 并不能判断服务是否就绪，不如自定义启动脚本，自己判断等上一个服务启动就绪了，才启动当前服务。如下：
  ```yml
  command: bash -c "
    sleep 10
    && python3 manage.py runserver 0.0.0.0:80
  "
  ```
  ```yml
  command:
    - /bin/bash
    - -c
    - |
      while ! curl 127.0.0.1:80;
      do
        sleep 1;
      done
      python3 scrape.py
  ```
- docker-compose 会自动给容器添加以下 Labels ：
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
