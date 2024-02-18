# FastDFS

：一个文件服务器，不提供 Web UI 。
- [GitHub](https://github.com/happyfish100/fastdfs)
- 2008 年，由中国工程师余庆开源，采用 C 语言开发。
- 基于 TCP 通信。
- 特点：
  - 提供了文件存储、上传、下载等功能，适合存储大量的小型文件。
  - 支持分布式部署。

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

1. 用 Docker 运行 tracker server ：
    ```sh
    docker run -d --name tracker    \
             -p 22122:22122         \
             # -v /opt/fdfs/tracker.conf:/etc/fdfs/tracker.conf           \  # 挂载配置文件
             delron/fastdfs tracker
    ```

2. 用 Docker 运行 storage server ：
    ```sh
    docker run -d --name storage                \
        -p 23000:23000 -p 8888:8888             \
        -e TRACKER_SERVER=10.0.0.1:22122        \   # 声明 tracker server 的地址，该配置会保存到配置文件中
        # -v /opt/fdfs:/var/fdfs                                     \  # 挂载数据目录
        # -v /opt/fdfs/storage.conf:/etc/fdfs/storage.conf           \  # 挂载配置文件
        # -v /opt/fdfs/nginx.conf:/usr/local/nginx/conf/nginx.conf   \  # 挂载 Nginx 的配置文件
        delron/fastdfs storage
    ```

3. storage.conf 的配置示例：
    ```ini
    bind_addr=0.0.0.0
    port=23000

    group_name=group1               # 该 storage 属于哪个组
    base_path=/var/fdfs             # 工作目录，用于存储数据和日志
    store_path0=/var/fdfs           # 存储文件的目录。该参数可以设置多个，从 0 开始编号
    # store_path1=/var/fdfs2

    tracker_server=10.0.0.1:22122   # tracker 的地址。该参数可以配置多个
    # tracker_server=10.0.0.2:22122
    ```

4. nginx.conf 的配置示例：
    ```sh
    server {
        listen       8888;
        location ~ /group[0-9]/ {
            ngx_fastdfs_module;     # 该模块用于对 storage 进行代理，其配置文件是 /etc/fdfs/mod_fastdfs.conf
        }
    }
    ```

## 用法

### 上传文件

1. 进入 fastdfs 容器，执行 `vi /etc/fdfs/client.conf` ，修改配置文件：
    ```ini
    tracker_server=10.0.0.1:22122
    ```

2. 通过客户端上传文件：
    ```sh
    [root@CentOS ~]# /usr/bin/fdfs_upload_file /etc/fdfs/client.conf test.txt
    group1/M00/00/00/lRyeml-QA76AWkC1AAAAAAAAAAA357.txt
    ```
    上传成功之后会返回该文件的逻辑存储路径 path ，其格式为：
    - `group1` ：表示 storage 所属组。
    - `M00`    ：表示 store_path 的编号。
    - `00/00/` ： 表示 store_path 之下的子目录，总共有两级，取值为十六进制的 00~FF 。
    - `lRyeml-QA76AWkC1AAAAAAAAAAA357.txt` ：按特定规则生成的文件名。

    storage 不支持文件去重，重复上传同一个文件时，会存储到不同的 path 。

3. 可以查看文件信息：
    ```sh
    [root@CentOS ~]# /usr/bin/fdfs_file_info /etc/fdfs/client.conf group1/M00/00/00/lRyeml-QA76AWkC1AAAAAAAAAAA357.txt
    source storage id: 0
    source ip address: 10.0.0.1
    file create timestamp: 2020-10-30 12:42:49
    file size: 49
    file crc32: 1050033651 (0x3E963DF3)
    ```

### 下载文件

1. 通过客户端下载文件：
    ```sh
    /usr/bin/fdfs_download_file /etc/fdfs/client.conf <path>
    ```

2. 也可以直接通过 Nginx 下载：
    ```sh
    wget http://10.0.0.1:8888/<path> -O test.txt
    ```

### 常用命令

```sh
fdfs_trackerd       <config_file>                           # 启动 tracker server
fdfs_storaged       <config_file> [start|stop|restart]      # 启动或停止 storage server
fdfs_monitor        <config_file>                           # 查询服务器的状态信息

fdfs_upload_file    <config_file> <filename> [storage_ip:port] [store_path_index]           # 上传文件
fdfs_append_file    <config_file> <path> <filename>                                         # 追加上传文件
fdfs_download_file  <config_file> <path> [filename] [<download_offset> <download_bytes>]    # 下载文件
fdfs_delete_file    <config_file> <path>                    # 删除文件
fdfs_file_info      <config_file> <path>                    # 查询文件的信息
```
