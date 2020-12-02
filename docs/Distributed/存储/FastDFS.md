# FastDFS

：一个轻量级的分布式文件服务器，基于 C 开发。
- 没有提供 Web 操作页面，只能通过命令行操作。
- 提供了文件存储、上传、下载等功能，适合管理海量的中小型文件（4KB~500MB）。
- [GitHub 页面](https://github.com/happyfish100/fastdfs)
- 同类产品：
  - go-fastdfs ：国内开源软件，使用更方便，功能更多。

## 原理

FastDFS 的服务器分为两种角色：
- tracker server
  - ：负责处理客户端的访问请求，并将请求经过负载均衡之后重定向到某个 storage 。
  - 当客户端发出下载文件的请求时，tracker 会回复该文件存储在哪个 storage 上的哪个路径。然后，客户端再访问相应的 storage ，下载文件。
  - 可以部署多个 tracker 实例，提高可用性。
  - 部署了多个 tracker 时，应该再部署一个 Nginx 对它们进行反向代理、负载均衡，让客户端统一访问该 Nginx 。
- storage server
  - ：负责存储文件，并提供上传文件、下载文件的 HTTP API 。
  - 基于操作系统本身的文件系统，将文件直接存储到主机的某个目录下。
  - 可以部署一组或多组 storage 实例，组成 storage 集群。
    - 每组存储集群的一部分文件。因此增加组的数量，就可以横向扩展集群的存储容量。
    - 组内的每个实例都存储该组文件的一个副本，从而实现冗余备份，还可以分担用户的访问流量，提高负载能力。
    - 往某组加入一个新实例时，它会自动与同组的其它 storage 通信，同步文件。
  - 可以部署 Nginx 代理 storage 的 store_path 目录下的文件，从而允许客户端以文件的 path 作为 URI ，直接通过 Nginx 下载文件。

## 部署

### tracker server

1. 启动 Docker 镜像：
    ```sh
    docker run -d -p 22122:22122 --name tracker  delron/fastdfs tracker
    ```

2. 执行 `docker exec -it tracker bash` 进入容器，再执行 `vi /etc/fdfs/tracker.conf` ，修改配置文件：
    ```ini
    port=22122    # 该 tracker 监听的端口
    ```

### storage server

1. 启动 Docker 镜像：
    ```sh
    docker run -d -p 23000:23000 -v /var/fdfs/storage:/var/fdfs -e TRACKER_SERVER=10.0.0.1:22122 --name storage delron/fastdfs storage
    ```

2. 执行 `docker exec -it storage bash` 进入容器，再执行 `vi /etc/fdfs/storage.conf` ，修改配置文件：
    ```ini
    base_path=/var/fdfs             # 工作目录，用于存储数据和日志
    store_path0=/var/fdfs           # 存储文件的目录，可以重复设置多个，从 0 开始编号
    #store_path1=/var/fdfs2
    tracker_server=10.0.0.1:22122   # tracker 的地址，可以重复设置多个
    http.server_port=23000          # 该 storage 监听的端口
    ```

3. 重启 storage ：
    ```sh
    /usr/bin/fdfs_storaged /etc/fdfs/storage.conf restart
    ```

4. 执行 `vi /usr/local/nginx/conf/nginx.conf` ，修改 Nginx 的配置文件：
    ```sh
    server {
        listen       80;
        location ~ /group[0-9]/ {
            ngx_fastdfs_module;     # 该模块用于对 storage 进行代理，其配置文件是 /etc/fdfs/mod_fastdfs.conf
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

## 用法

### 上传、下载文件

1. 进入 fastdfs 容器，执行 `vi /etc/fdfs/client.conf` ，修改配置文件：
    ```ini
    tracker_server=10.0.0.1:22122
    ```

2. 上传文件：
    ```sh
    [root@Centos ~]# /usr/bin/fdfs_upload_file /etc/fdfs/client.conf test.txt
    group1/M00/00/00/lRyeml-QA76AWkC1AAAAAAAAAAA357.txt
    ```
    上传成功之后会返回该文件的逻辑存储路径 path ，其格式为：
    - `group1` ：表示 storage 所属组。
    - `M00`    ：表示 store_path 的编号。
    - `00/00/` ： 表示 store_path 之下的子目录，总共有两级，取值为十六进制的 00~FF 。
    - `lRyeml-QA76AWkC1AAAAAAAAAAA357.txt` ：按特定规则生成的文件名。

    storage 不支持文件去重，重复上传同一个文件时，会存储到不同的 path 。

3. 下载文件：
    ```sh
    /usr/bin/fdfs_download_file /etc/fdfs/client.conf <path>
    ```
    或者直接通过 Nginx 下载：
    ```sh
    wget http://10.0.0.1:80/<path> -O test.txt
    ```

4. 查看文件信息：
    ```sh
    [root@Centos ~]# /usr/bin/fdfs_file_info /etc/fdfs/client.conf group1/M00/00/00/lRyeml-QA76AWkC1AAAAAAAAAAA357.txt
    source storage id: 0
    source ip address: 10.0.0.1
    file create timestamp: 2020-10-30 12:42:49
    file size: 49
    file crc32: 1050033651 (0x3E963DF3)
    ```

### 常用命令

```sh
fdfs_upload_file    <config_file> <filename> [storage_ip:port] [store_path_index]           # 上传文件
fdfs_append_file    <config_file> <path> <filename>                                         # 追加上传文件
fdfs_download_file  <config_file> <path> [filename] [<download_offset> <download_bytes>]    # 下载文件
fdfs_delete_file    <config_file> <path>                    # 删除文件
fdfs_file_info      <config_file> <path>                    # 查询文件的信息

fdfs_storaged       <config_file> [start|stop|restart]      # 启动或停止 storage
fdfs_monitor        <config_file>                           # 查询服务器的状态信息
```
