# FastDFS

：一个轻量级的分布式文件系统。
- 提供文件存储、上传、下载等功能，适合管理海量的中小文件（4KB~500MB）。
- 通常将 FastDFS 与 Nginx 搭配使用。

## 架构

FastDFS 的服务器分为两部分：
- tracker server
  - ：负责处理客户端的访问请求，并将请求经过负载均衡之后转发给 storage server 。
  - 可以部署多个实例，避免单点故障，提高可用性。
- storage server
  - ：负责存储文件，可以上传、下载文件。
  - 基于操作系统本身的文件系统来管理文件，可以在终端里查看存储目录。
  - 部署成集群形式：
    - storage 集群由一组或多组 storage server 组成，每组存储一部分文件。
    - 每组可以包含多个 storage server ，各自存储相同的文件，实现冗余备份，还可以分担用户的访问流量。
    - 往某组加入一个新的 storage server 时，它会自动与同组的其它 storage server 通信，同步文件。
    - 增加某个组的服务器数量，就可以纵向扩展该组的负载能力。
    - 增加组的数量，就可以横向扩展集群的存储容量。

## 部署

### 启动 tracker server

1. 运行 Docker 镜像：
    ```sh
    docker pull delron/fastdfs
    docker run -d --name tracker --network host -v /var/fdfs/tracker:/var/fdfs delron/fastdfs tracker
    ```
    
2. 执行`docker exec -it tracker bash`进入容器，再执行`vi /etc/fdfs/tracker.conf`，修改配置文件：
    ```ini
    port=22122    # tracker server 监听的端口
    ```

### 启动 storage server

1. 运行 Docker 镜像：
    ```sh
    docker run -d --name storage --network host -v /var/fdfs/storage:/var/fdfs -e TRACKER_SERVER=172.17.0.1:22122 delron/fastdfs storage
    ```

2. 执行`docker exec -it storage bash`进入容器，再执行`vi /etc/fdfs/storage.conf`，修改配置文件：
    ```ini
    base_path=/var/fdfs        # 存储数据和日志的基础目录
    store_path0=/var/fdfs        # 存储目录，可以设置多个，从 0 开始编号
    tracker_server=172.17.0.1:22122  # tracker_server 的位置
    http.server_port=80        # storage server 的 HTTP 端口号
    ```

3. 重启 storage server ：
    ```sh
    /usr/bin/fdfs_storaged /etc/fdfs/storage.conf restart
    ```

4. 执行`vi /usr/local/nginx/conf/nginx.conf`，修改 Nginx 的配置文件：
    ```
        server {
            listen       80;
            server_name  localhost;
            location /group[0-9]/ {
                ngx_fastdfs_module;
            }
            error_page   500 502 503 504  /50x.html;
            location = /50x.html {
                root html;
            }
        }
    ```
5. 重载 Nginx 的配置文件：
    ```sh
    /usr/local/nginx/sbin/nginx -s reload
    ```

### 试用 client

1. 进入 storage 容器，执行`vi /etc/fdfs/client.conf`，修改配置文件：
    ```ini
    tracker_server=172.17.0.1:22122
    ```

2. 上传文件：
    ```sh
    /usr/bin/fdfs_upload_file /etc/fdfs/client.conf f1
    ```

3. 上传成功之后会返回文件的路径，可通过 HTTP 请求访问它：
    ```sh
    curl http://172.17.0.1:80/<path>
    ```
