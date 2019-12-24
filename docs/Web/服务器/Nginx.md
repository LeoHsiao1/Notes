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
 
## 主配置文件

Nginx默认使用`/etc/nginx/nginx.conf`作为主配置文件（用于保存全局配置），还会导入`/etc/nginx/conf.d/`目录下的其它配置文件（用于保存一些 server{} 的配置）。
- 这些配置文件的后缀名为 .conf ，采用Nginx自定的语法，用 # 声明单行注释。

`/etc/nginx/nginx.conf`的默认内容：
```
user  nginx;          # 启动Nginx进程的用户名，可能需要给该用户分配权限
worker_processes  1;  # 启动的Nginx进程数，与CPU核数相等时性能最高

error_log  /var/log/nginx/error.log warn;   # 全局的报错日志，及其日志等级
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;   # 每个Nginx进程支持的最大连接数
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '   # 日志格式
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;    # 全局的访问日志，及其日志等级

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```
- mime.types中记录了一些文件后缀名与文件类型的映射表，比如后缀名 html 对应的文件类型是 text/html ，当Nginx回复 html 文件时就会将HTTP响应报文Header中的Content-Type设置成 text/html 。如果一个文件的后缀名在 mime.types 中找不到，就用default_type的值设置Content-Type。
- 当Nginx经常回复小文件时，使用sendfile模式可以提高传输速度；当Nginx经常回复大文件时，应该关闭sendfile模式，否则磁盘I/O负载会太高.
- sendfile模式：让Linux内核从磁盘读取文件内容之后，直接写入TCP缓冲区，而不载入Nginx的内存空间。这样能提高文件传输速度。
- tcp_nopush模式与tcp_nodelay模式只能二选一：
  - tcp_nopush模式：有数据时先不发送，而是等缓冲区满了才发送。这样能降低网络I/O量，不容易阻塞网络。
  - tcp_nodelay模式：一有数据就立即发送。这样能减少通信延迟。
- keepalive_timeout表示客户端TCP连接的最大时长（单位为秒），超过该时间之后，Nginx会关闭连接。

## server配置

`/etc/nginx/conf.d/`目录下默认存在一个`default.conf`，配置了Nginx的初始Web页面，内容如下：
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
- http{} 中可以定义多个 server{} ，表示服务器的配置。
- 在 server{} 之外设置的日志是全局日志，在 server{} 之内设置的日志是局部日志。
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

- server{} 中可以定义多个 location{} ，表示URL路由规则。如下：
  - location以 = 开头表示精确匹配，以 ~ 开头表示区分大小写（默认是这种），以 ~* 开头表示不区分大小写。
  - location 以 / 结尾时会转发相对路径，不以 / 结尾时会转发绝对路径。
  - 例：
    ```
    location = / {       # 匹配以 / 开头的URL
        root /www/;
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

- server{} 中的其它配置项：
    ```
    charset  utf-8;
    root  /www/;          # 设置网站的根目录，当没有HTTP请求没有找到匹配的location时就到该目录下寻找文件
    ```

## 其它配置

### 控制语句

- **allow**、**deny**语句：允许或禁止某些IP地址的访问。如下：
    ```
    deny    192.168.1.1;
    allow   192.168.1.0/24;    # 允许一个网段访问
    deny    all;               # 禁止所有IP
    allow   all;
    ```
  - 该语句可以写在 http{} 、server{} 或 location{} 中。写在局部作用域的规则的优先级更高，而同一个作用域内，写在前面的规则的优先级更高。
  - Nginx会给禁止访问的IP回复HTTP 403 。

- **proxy_pass**语句：将收到的HTTP请求转发给某个服务器，实现反向代理。如下：
    ```
    location / {
        proxy_pass    http://127.0.0.1:79;
        # proxy_cache cache;                # 使用缓存
        # inactive 3;                       # 将缓存文件保存3分钟
        # proxy_cache_valid 200 304 2m;     # 客户端2分钟之内发出状态码为200、304的HTTP请求都会使用缓存
    }
    ```
  - 该语句只能写在 location{} 中。
  - 如果proxy_pass的URL以 / 结尾，则转发相对路径，否则转发绝对路径。
  - 使用proxy_cache时，Nginx会将proxy_pass服务器响应的静态文件缓存一段时间，如果客户端发来的请求URL与缓存的某个URL的hash值相同，则直接从缓存中取出静态文件回复给客户端（响应头中包含Nginx-Cache: HIT），否则将HTTP请求转发给proxy_pass服务器处理（响应头中包含Nginx-Cache: MISS）。

- **rewrite**语句：将收到的HTTP请求重定向到某个URL。如下：
    ```
    rewrite  /1.html  /2.html ;         # 访问1.html时重定向到2.html
    rewrite  ^(.*)$  https://$host$1;   # 重定向到https的URL
    ```
  - 该语句可以写在 server{} 或 location{} 中。
  - 如果目标URL以 http:// 或 https:// 开头，则返回301永久重定向，否则返回302临时重定向。

- **return**语句：收到HTTP请求时直接返回HTTP响应。如下：
    ```
    server{
        listen  80;
        return  403;                                # 只返回状态码
        return  200 "hello";                        # 返回状态码和一个字符串
        return  200 '{"name":"test","id":"001"}';   # 返回状态码和JSON格式的字符串
    }
    ```
  - 该语句可以写在 server{} 或 location{} 中。
  - 当Nginx执行到return语句时会立即返回HTTP响应，不会执行之后的语句。

### 负载均衡

可以定义 upstream{} ，添加多个可用的server（即后端服务器），将受到的HTTP请求按某种策略转发给server处理，实现负载均衡。

常见的分配策略如下：
- 按轮询分配：将HTTP请求按时间顺序依次分配给各个server，实现简单的平均分配。配置如下：
    1. 在 http{} 之内、server{} 之外定义upstream。
    ```
    upstream my_cluster {         # 定义一个upstream，名为my_cluster
        server 127.0.0.1:8085;    # 添加一个server
        server 127.0.0.1:8086;
    }
    ```
    2. 设置proxy_pass语句，将HTTP请求转发到my_cluster。
    ```
    location / {
        proxy_pass    http://my_cluster;    # 这个域名会在Nginx每次启动时解析
    }
    ```

- 按轮询加权重分配：权重较大的server优先被分配。适合处理几台server性能不均的情况。
    ```
    upstream my_cluster {
        server 127.0.0.1:8085 weight=5; 
        server 127.0.0.1:8086 weight=10;
    }
    ```

- 按响应时间分配：响应时间短的server优先被分配。
    ```
    upstream my_cluster {
        fair; 
        server 127.0.0.1:8085 weight=5; 
        server 127.0.0.1:8086 weight=10;
    }
    ```

- 按ip_hash分配：将客户端ip的hash值相同的HTTP请求分配给同一个server。适合保持session。
    ```
    upstream my_cluster {
        ip_hash;
        server 127.0.0.1:8085; 
        server 127.0.0.1:8086;
    }
    ```

- 按url_hash分配：将目标url的hash值相同的HTTP请求分配给同一个server。适合利用缓存。
    ```
    upstream my_cluster { 
        url_hash;
        server 127.0.0.1:8085; 
        server 127.0.0.1:8086;
    }
    ```

### 启用HTTPS

让服务器启用HTTPS的配置：
```
server {
    listen    443  ssl;     # 采用ssl协议监听一个端口
    server_name localhost;
    
    ssl_certificate /etc/nginx/conf.d/cert.pem;       # 指明.crt文件的路径
    ssl_certificate_key /etc/nginx/conf.d/cert.key;   # 指明.key文件的路径
    
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;  # 设置ssl加密套件
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;    # 设置可用的ssl协议版本
    ssl_prefer_server_ciphers on;           # 在ssl握手时使用server的密码

    # 在一段时间内复用一个ssl会话，以节省ssl握手的时间
    ssl_session_cache   shared:SSL:10m;     # 设置ssl缓存的大小，10M大概可以存储40000个ssl会话
    ssl_session_timeout 10m;                # 设置缓存的失效时间
    ...
}
```

### 启用gzip

启用gzip压缩响应报文body之后，可以降低通信耗时，但是会增加Nginx的CPU负载。

启用gzip的配置如下：
```
location ~ .*\.(jpg|gif|png|bmp)$ {
    gzip on;                    # 启用gzip
    gzip_vary on;               # 在响应头中加入Vary: Accept-Encoding，告诉浏览器这是gzip报文
    gzip_min_length 1k;         # 启用压缩的文件的最小体积（低于该值则不会压缩）
    gzip_comp_level 1;          # 压缩率（取值为1~9，1的压缩率最低，CPU负载也最小）
    gzip_http_version 1.0;      # 基于哪个版本的HTTP协议来传输gzip报文（默认为HTTP 1.1）
    gzip_types text/plain application/json application/x-javascript application/css application/xml application/xml+rss text/javascript application/x-httpd-php image/jpeg image/gif image/png image/x-ms-bmp;  # 压缩哪些类型的响应报文body
}
```
- 该语句可以写在 http{} 、server{} 或 location{} 中。
- 版本较老的浏览器可能只支持 HTTP 1.0 协议，甚至不能解析gzip报文。
