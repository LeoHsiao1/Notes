# FastDFS

：一个轻量级分布式文件系统，提供文件存储、上传、下载等功能，适合管理海量的中小文件（4KB~500MB）。
- FastDFS系统分为client、tracker server和storage server三种角色。
- tracker server：负责处理客户端的访问请求，并将请求经过负载均衡之后转发给storage server。
  - 可以有多个，避免单点故障。
- storage server：负责存储文件，可以上传、下载文件。
  - storage server是基于操作系统本身的文件系统来管理文件，可以在终端里查看存储目录。
  - storage集群分为一个或多个组，每组用于存储一部分文件。每组可以包含多个服务器，它们存储相同的内容，实现冗余备份。
  - 在某一组中加入一台新服务器时，它会自动与同组的其它服务器通信，同步所有文件。
  - 增加组，可以横向扩展系统的存储容量。增加某个组的服务器，可以纵向扩展该组的负载能力。
 
- 通常将FastDFS与Nginx搭配使用。
## 使用docker镜像运行FastDFS。
- 运行tracker server：
docker run -d --network=host --name tracker -v /var/fdfs/tracker:/var/fdfs delron/fastdfs tracker
  - 输入docker exec -it tracker bash进入容器，输入vi /etc/fdfs/tracker.conf，修改配置文件：
port=22122    # tracker server监听的端口

- 运行storage server：
docker run -d --network=host --name storage -v /var/fdfs/storage:/var/fdfs -e TRACKER_SERVER=172.17.0.1:22122 delron/fastdfs storage
  - 输入docker exec -it storage bash进入容器，输入vi /etc/fdfs/storage.conf，修改配置文件：
base_path=/var/fdfs        # 存储数据和日志的基础目录
store_path0=/var/fdfs        # 存储目录，可以设置多个，从0开始编号
tracker_server=172.17.0.1:22122  # tracker_server的位置
http.server_port=80        # storage server的HTTP端口号
  - 重启storage server：
/usr/bin/fdfs_storaged /etc/fdfs/storage.conf restart
  - 输入vi /usr/local/nginx/conf/nginx.conf，修改Nginx的配置文件：
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
  - 重载Nginx：
/usr/local/nginx/sbin/nginx -s reload
- 使用client：
  - 进入storage容器，输入vi /etc/fdfs/client.conf，修改配置文件：
tracker_server=172.17.0.1:22122
  - 上传文件：
/usr/bin/fdfs_upload_file /etc/fdfs/client.conf f1
  - 上传成功后会返回文件的路径，可通过Web访问它：
curl http://172.17.0.1:80/<路径>
