# FastDFS

：一个轻量级的分布式文件服务器，基于 C 开发。
- 提供文件存储、上传、下载等功能，适合管理海量的中小文件（4KB~500MB）。
- 通常将 FastDFS 与 Nginx 搭配使用。
- [GitHub 页面](https://github.com/happyfish100/fastdfs)

## 原理

FastDFS 的服务器分为两种角色：
- tracker server
  - ：负责处理客户端的访问请求，并将请求经过负载均衡之后重定向到某个 storage server 。
  - 当客户端发出下载文件的请求时，tracker server 会回复该文件存储在哪个 storage server 上的哪个路径。然后，客户端再访问相应的 storage server ，下载文件。
  - 可以部署多个 tracker server 实例，提高可用性。再部署一个 Nginx ，代理这些实例，进行负载均衡。客户端统一访问该 Nginx 。
- storage server
  - ：负责存储文件，并提供上传文件、下载文件的 HTTP API 。
  - 基于操作系统本身的文件系统，将文件直接存储到主机的某个目录下。
  - 可以部署一组或多组 storage server 实例，组成 storage 集群。
    - 每组存储集群的一部分文件。因此增加组的数量，就可以横向扩展集群的存储容量。
    - 组内的每个实例都存储该组文件的一个副本，从而实现冗余备份，还可以分担用户的访问流量，提高负载能力。
    - 往某组加入一个新实例时，它会自动与同组的其它 storage server 通信，同步文件。

## 部署

### tracker server

1. 启动 Docker 镜像：
    ```sh
    docker run -d --name tracker --network host -v /var/fdfs/tracker:/var/fdfs delron/fastdfs tracker
    ```
    
2. 执行 `docker exec -it tracker bash` 进入容器，再执行 `vi /etc/fdfs/tracker.conf` ，修改配置文件：
    ```ini
    port=22122    # 该 tracker server 监听的端口
    ```

### storage server

1. 启动 Docker 镜像：
    ```sh
    docker run -d --name storage --network host -v /var/fdfs/storage:/var/fdfs -e TRACKER_SERVER=10.0.0.1:22122 delron/fastdfs storage
    ```

2. 执行 `docker exec -it storage bash` 进入容器，再执行 `vi /etc/fdfs/storage.conf` ，修改配置文件：
    ```ini
    base_path=/var/fdfs             # 工作目录，用于存储数据和日志
    store_path0=/var/fdfs           # 存储文件的目录，可以重复设置多个，从 0 开始编号
    #store_path1=/var/fdfs2
    tracker_server=10.0.0.1:22122   # tracker server 的地址，可以重复设置多个
    http.server_port=80             # 该 storage server 监听的端口
    ```

3. 重启 storage server ：
    ```sh
    /usr/bin/fdfs_storaged /etc/fdfs/storage.conf restart
    ```

4. 执行 `vi /usr/local/nginx/conf/nginx.conf` ，修改 Nginx 的配置文件：
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

### client

1. 进入 fastdfs 容器，执行 `vi /etc/fdfs/client.conf` ，修改配置文件：
    ```ini
    tracker_server=10.0.0.1:22122
    ```

2. 上传文件：
    ```sh
    [root@Centos ~]# /usr/bin/fdfs_upload_file /etc/fdfs/client.conf test.txt
    group1/M00/00/00/lRyeml-QA76AWkC1AAAAAAAAAAA357.txt
    ```
    上传成功之后会返回该文件的 URI ，其格式为：
    - `group1` ：storage server 所属组。
    - `M00`    ：对应 store_path 。
    - `00/00/` ： store_path 之下的子目录，总共有两级，取值为十六进制的 00~FF 。
    - `lRyeml-QA76AWkC1AAAAAAAAAAA357.txt` ：按特定规则生成的文件名。
    
    storage server 不支持文件去重，重复上传同一个文件时，会生成不同的 URI 。
    
3. 使用 URI 就可以下载文件：
    ```sh
    wget http://10.0.0.1:80/<uri> -O text.txt
    ```
