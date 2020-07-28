# Docker Compose

：一个 Docker 容器的编排工具，由 Docker 公司推出，基于 Python 开发。

- 只能管理当前宿主机上的容器，不能管理服务器集群。
- 它根据 compose 文件来创建、管理 docker 容器。
  - compose 文件保存为 yaml 格式，后缀名为 .yml 或 .yaml 。
  - 每个 compose 文件定义一种或多种服务，每种服务可以运行一个或多个容器实例。
  - 单个服务运行多个容器实例时可能会因为使用相同的端口、容器名等资源，产生冲突。
- [官方文档](https://docs.docker.com/compose/compose-file/)

## 安装

- 用 pip 安装：
    ```sh
    pip3 install docker-compose
    ```

## 命令

```sh
docker-compose
            -f <file>                 # 指定 compose 文件（默认使用当前目录下的 docker-compose.yml）

            up                        # 启动服务（会重新加载 compose 文件，可能会删除容器或重新创建容器）
                -d                    # 在后台运行（否则会阻塞当前终端）
                --scale web=2 mysql=1 # 设置服务运行的实例数量
                --build               # 在启动容器之前，先构建镜像
            down <service>...         # 销毁服务（默认会删除用到的容器、网络）
                -v                    # 再删除 compose 文件中定义的 volumes 以及用到的匿名 volumes
                --rmi all             # 再删除该服务用到的所有镜像

            ps                        # 显示所有正在运行的容器
            stop <service>...         # 停止服务
            start <service>...        # 启动已停止的服务
            restart <service>...      # 重启服务

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
  docker-compose up -d      # 正式在后台运行
  docker-compose down       # 销毁服务
  ```

## compose 文件的语法

```yaml
version: '3'                  # 声明 compose 文件的版本

services:                     # 开始定义服务
  web:                        # 第一个服务的名称
    # container_name: web     # 指定容器名
    image: centos             # 使用的镜像名
    command: [tail, -f, /dev/null]  # 启动命令
    init: true                # 使用 init 作为 1 号进程
    restart: unless-stopped   # 容器的重启策略
    environment:              # 定义环境变量
      var1: 1
      var2: hello
    ports:                    # 映射端口
      - 9000:8000             # 注意这里的每行配置是一个字符串，因此冒号 : 之后不能加空格
      - 9001:8001
    networks:                 # 连接到的 docker 网络
      - net
    # network_mode: "host"    # 网络模式
    volumes:                  # 挂载目录
      - /root/data:/root/data # 可以直接挂载目录
      - ./log:/root/log       # 可以挂载相对路径（必须以 ./ 或 ../ 开头，否则会被视作数据卷名）
      - conf:/root/conf       # 可以挂载数据卷
    
  redis:                      # 定义第二个服务
    image: redis:5.0.5
    restart: unless-stopped
    networks:
      - net
    volumes:                  # 挂载目录
      - db:/etc/redis

networks:                     # 定义网络（默认会创建一个 compose_default 网络）
  net:
    driver: bridge

volumes:                      # 定义数据卷（服务挂载的数据卷都必须在这里声明）
  conf:
  db:
```
- compose 文件还支持写入 Dockerfile 的构件参数，在创建容器之前先构建镜像。
- 如果用户不指定生成的容器名，则会自动按照 "当前目录名_服务名_第几个实例" 的格式命名，比如：web_web_1 。
  - 如果用户不指定生成的 volume 的名称，则会自动按照 "当前目录名_数据卷名" 的格式命名，比如：web_conf 。
  - 如果 Service 只运行一个实例，则指定容器名、挂载指定目录比较好，这样它们的容器名、目录位置是确定不变的。
  - 如果 Service 要运行多个实例，则不指定容器名、挂载数据卷比较好，这样多个实例会自动命名，不会冲突。
- 上例中，web 容器向宿主机映射了两个端口，而 redis 容器没有映射端口，因此不能被宿主机访问。
  两个容器都连接到了 net_1 网络，因此可以相互访问。比如 web 容器可以通过 `127.0.0.1:6379` 或 `redis:6379` 访问到 redis 容器。
