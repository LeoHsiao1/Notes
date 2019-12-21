# Nginx

：一个轻量级的Web服务器软件。
- 发音相当于 engine + x
- 适合用于HTTP反向代理，也提供了IMAP、POP3、SMTP代理。
- 支持负载均衡。
- 处理静态文件的效率高。

## 启动

- 用yum安装：
  ```shell
  yum install nginx  
  ```

- 启动：
  ```shell
  nginx                     # 启动nginx服务器（默认作为守护进程运行）
        -c /root/nginx.conf # 使用指定的配置文件（默认使用/etc/nginx/nginx.conf）
        -t                  # 不启动，而是测试配置文件的语法是否正确
        -s quit             # 向Nginx进程发送一个quit信号（Nginx处理完当前的HTTP请求之后才会终止）
        -s reload           # 重新加载配置文件
  ```

- 不安装，而是运行docker镜像：
  ```shell
  docker run -d --name=nginx -p 80:80 nginx
  ```
 
## 主要配置

Nginx默认使用`/etc/nginx/nginx.conf`作为主配置文件，用于保存全局配置，如下：
```
user  nginx;          # 使用nginx用户运行Nginx，可能需要给该用户分配权限
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```
- Nginx的配置文件的后缀名必须为 .conf ，采用Nginx自创的语法，用 # 声明单行注释。


Nginx默认会导入`/etc/nginx/conf.d/`目录下的其它配置文件，它们用于保存一些server块的配置。比如默认存在一个default.conf，配置了Nginx的初始Web页面，如下：
```
server {
    listen       80;            # 监听的TCP端口（必填）
    server_name  localhost;     # 监听的域名（不必填）

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
    
    error_page   500 502 503 504  /50x.html;  # 当客户端的HTTP请求出错时，返回这些html文件
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
- http块中可以定义多个server块，表示服务器的配置。
- 当Nginx在某个TCP端口收到一个HTTP请求时，会交给监听该端口的server处理。
  - 如果监听该端口的server有多个，则考虑Request Header中的Host与哪个server监听的server_name匹配。
  - 如果没有匹配的server_name，或者Request Header中的Host是IP地址，则交给监听该端口的默认server处理。
  - 监听一个端口的默认server是nginx.conf中最先定义的那个，也可以手动指定。如下：
    ```
    listen       80  default_server;
    ```
  - server_name有以下几种格式，排在前面的优先匹配：
    ```
    server_name  www.test.com localhost;    # 匹配明确的域名（可以填多个，Nginx不会去验证DNS）
    server_name  *.test.com;                # 以 *. 开头，模糊匹配
    server_name  www.test.*;                # 以 .* 结尾
    server_name  ~^(?<www>.+)\.test\.com$;  # 正则表达式
    server_name  "";                        # 空字符串，相当于不填server_name，不会匹配任何域名
    ```
  - 如果两个server监听的端口和域名都相同，则启动Nginx时会报错：conflicting server name

- server块中可以定义多个location块，表示URL路由规则。如下：
  - location以 = 开头表示精确匹配，以 ~ 开头表示区分大小写（默认这样），以 ~* 开头表示不区分大小写。
  - location 以 / 结尾时会转发相对路径，不以 / 结尾时会转发绝对路径。
  - 例：
    ```
    location = / {       # 匹配以 / 开头的URL
        # root /www/;
        # proxy_pass http://127.0.0.1:79/;    # 把请求转发到另一个服务器（前提是不匹配其它规则）
    }
    ```
    ```
    location /img {      # 匹配以 /img 开头的URL
        root /www/;
    }
    ```
    - 比如访问http://127.0.0.1/img/1.html时，会转发绝对路径img/1.html，转发到http://127.0.0.1:80/www/img/1.html
    ```
    location /img/ {     # 匹配以 /img 开头的URL
        root /www/;
    }
    ```
    - 比如访问http://127.0.0.1/img/1.html时，会转发相对路径1.html，转发到http://127.0.0.1:80/www/1.html

- server块中的其它配置项：
    ```
    charset  utf-8;
    root /www/;          # 设置网站的根目录，当没有HTTP请求没有找到匹配的location时就到该目录下寻找文件
    ```
 


## 其它配置

- allow、deny语句：允许或禁止某些IP地址的访问。
deny    192.168.1.1;
allow   192.168.1.0/24;    # 允许一个内网网段访问
deny    all;          # 禁止所有IP
allow    all;
  - 该语句可以写在http{} 、server{} 或 location{}中。写在局部作用域的规则的优先级更高，而同一个作用域内，写在前面的规则的优先级更高。
  - Nginx会给禁止访问的IP回复403。
- proxy_pass语句：将HTTP请求转发到某个服务器，实现反向代理。
location / {
proxy_pass    http://127.0.0.1:79;
# proxy_cache cache;    # 使用缓存
# inactive 3;        # 将缓存文件保存3分钟
# proxy_cache_valid 200 304 2m;# 客户端2分钟之内发出状态码为200、304的HTTP请求都会使用缓存
}
  - 该语句只能写在location{}中。
  - proxy_pass的URL以 / 结尾时会转发相对路径，不以 / 结尾时会转发绝对路径。
  - 使用proxy_cache时，Nginx会将proxy_pass服务器响应的静态文件缓存一段时间，如果客户端发来的请求URL与缓存的某个URL的hash值相同，则将缓存的静态文件回复给客户端（响应头中包含Nginx-Cache: HIT）；否则把HTTP请求转换给proxy_pass服务器（响应头中包含Nginx-Cache: MISS）。
- return语句：直接返回HTTP响应。
server{
    listen  80;
    return  403;      # 只返回状态码
    return 200 "hello";  # 返回状态码和一个字符串
    return  200 '{"name":"test","id":"001"}';    # 返回状态码和JSON格式的字符串
}
  - 该语句可以写在server{} 或 location{}中。
  - 当Nginx执行到return语句时会立即返回HTTP响应，不会执行之后的语句。
- rewrite语句：使HTTP请求重定向到某个URL。
rewrite  /1.html  /2.html ;      # 访问1.html时重定向到2.html
rewrite  ^(.*)$  https://$host$1;    # 重定向到https的URL
  - 该语句可以写在server{} 或 location{}中。
  - 当目标URL以http://或https://开头时，则返回301永久重定向，否则返回302临时重定向。
- 让服务器使用HTTPS：
server {
    listen    443  ssl;    # 采用ssl协议监听一个端口
    server_name localhost;
    
    ssl_certificate /etc/nginx/conf.d/cert.pem;       # 指明.crt文件的路径
    ssl_certificate_key /etc/nginx/conf.d/cert.key;   # 指明.key文件的路径
    
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
                    # 设置ssl加密套件
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;  # 设置可用的ssl协议版本
    ssl_prefer_server_ciphers on;      # 在ssl握手时使用server的密码

    # 在一段时间内复用一个ssl会话，以节省ssl握手的时间
    ssl_session_cache   shared:SSL:10m;  # 设置ssl缓存的大小，10M大概可以存储40000个ssl会话
    ssl_session_timeout 10m;        # 设置缓存的失效时间

    ...
}
- 使用gzip压缩响应报文。这会降低通信延迟，但是会增加Nginx的CPU负载。
location ~ .*\.(jpg|gif|png|bmp)$ {
gzip on;            # 启用压缩
gzip_vary on;        # 在响应头中加入Vary: Accept-Encoding，告诉浏览器这是gzip报文
gzip_min_length 1k;      # 启用压缩的文件的最小体积（低于该值则不会压缩）
gzip_comp_level 1;      # 压缩率（取值为1~9，1的压缩率最低，CPU负载也最小）
gzip_http_version 1.0;    # 基于哪个版本的HTTP协议来传输gzip报文（默认为HTTP 1.1）
gzip_types text/plain application/json application/x-javascript application/css application/xml application/xml+rss text/javascript application/x-httpd-php image/jpeg image/gif image/png image/x-ms-bmp;    # 对哪些类型的响应报文body进行压缩
}
  - 该语句可以写在http{} 、server{} 或 location{}中。
  - 版本较老的浏览器可能只支持HTTP 1.0协议，甚至不能解析gzip报文。
## 
## Nginx配置参数中文说明
## https://mp.weixin.qq.com/s?__biz=MzI5ODQ2MzI3NQ==&mid=2247488524&idx=2&sn=d44b1bc4b5517a809242c6a71c16bc91&chksm=eca42d48dbd3a45e31e89dcd3daa5f08196efe5ac3fcf1191e36d00217ea09682aedbf403574&scene=0&xtrack=1&key=83644d814d6a4c0bbf9802bc0c7d2d1b4c7ee760bdcd57cc5d08ab3d6f8e2344d64c2c3d4935af9973e9a5464d667d62cd42ab4a987125de0a8cc6b209eb03d6edc89e2963b1f775473670f672590f99&ascene=1&uin=MTQxMjM2ODkyNQ%3D%3D&devicetype=Windows+10&version=62070158&lang=zh_CN&pass_ticket=MEWmVwE4YtSIQ0EODiOkMU1ZTN7%2FWBWc3kOacWGrzUAPUf%2BRk5G3PU%2FW9vS1%2Fz29
## 
 
## 负载均衡

可以用upstream设置多台可用的服务器，进行负载均衡。
- 按轮询分配：将HTTP请求按时间顺序依次分配到不同后端服务器。只是进行简单的平均分配。
1.  在http{}之内、server{}之外定义upstream。
upstream my_cluster {        # 定义一个upstream，名为my_cluster
    server 127.0.0.1:8085; 
    server 127.0.0.1:8086;
}
2.  设置proxy_pass语句，将HTTP请求转发到my_cluster。
location / {
proxy_pass    http://my_cluster;    # 这个域名会在Nginx每次启动时解析
}
- 按轮询加权重分配：权重较大的后端服务器优先被分配。适合处理几台后端服务器性能不均的情况。
upstream my_cluster {
    server 127.0.0.1:8085 weight=5; 
    server 127.0.0.1:8086 weight=10;
}
- 按响应时间分配：响应时间短的后端服务器优先被分配。
upstream my_cluster {
    fair; 
    server 127.0.0.1:8085 weight=5; 
    server 127.0.0.1:8086 weight=10;
}
- 按ip_hash分配：将客户端ip的hash值相同的HTTP请求分配到同一个后端服务器。适合保持session。
upstream my_cluster {
    ip_hash;
    server 127.0.0.1:8085; 
    server 127.0.0.1:8086;
}
- 按url_hash分配：将目标url的hash值相同的HTTP请求分配到同一个后端服务器。适合利用缓存。
upstream my_cluster { 
    url_hash;
    server 127.0.0.1:8085; 
    server 127.0.0.1:8086;
}