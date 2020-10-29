# Nginx

：一个轻量级的 Web 服务器软件。
- 发音相当于 engine + x 。
- 特点：
  - 支持反向代理、负载均衡。
  - 不仅支持 HTTP、HTTPS 协议，也支持 IMAP、POP3、SMTP 协议。
  - 支持第四层的 TCP 代理、第七层的 HTTP 代理。
  - 一般用作静态服务器，处理静态文件的效率高。
- [官方文档](http://nginx.org/en/docs/)

## 部署

- 用 yum 安装：
  ```sh
  yum install nginx  
  ```
  然后启动：
  ```sh
  nginx                     # 启动 nginx 服务器（默认作为守护进程运行）
        -c /root/nginx.conf # 使用指定的配置文件（默认使用 /etc/nginx/nginx.conf ）
        -g 'daemon off;'    # 加上指令（这里是要求在前台运行）
        -t                  # 不启动，而是测试配置文件的语法是否正确
        -s quit             # 向 Nginx 进程发送一个 quit 信号（Nginx 处理完当前的 HTTP 请求之后才会终止）
        -s reload           # 重新加载配置文件
  ```

- 或者运行 Docker 镜像：
  ```sh
  docker run -d --name nginx -p 80:80
        -v /opt/web/dist:/usr/share/nginx/html         # 挂载静态文件目录
        -v /opt/web/nginx.conf:/etc/nginx/nginx.conf   # 挂载配置文件
        nginx
  ```

## 配置文件

Nginx 默认使用 `/etc/nginx/nginx.conf` 作为主配置文件（用于保存全局配置），还会导入 `/etc/nginx/conf.d/` 目录下的其它配置文件（通常用于保存一些 server{} 的配置）。
- 这些配置文件的后缀名为 .conf ，采用 Nginx 自定的语法，用 # 声明单行注释。

### nginx.conf

`/etc/nginx/nginx.conf` 的默认内容：
```sh
user  nginx;          # 启动 Nginx 进程的用户名，可能需要给该用户分配权限
worker_processes  1;  # 启动的 Nginx 进程数，与 CPU 核数相等时性能最高
#daemon off;          # 默认以 daemon 方式运行
error_log  /var/log/nginx/error.log warn;   # 设置 error_log 的路径、日志格式
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;   # 每个 Nginx 进程支持的最大连接数
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '   # 定义一种名为 main 的日志格式
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;    # 设置 access_log 的路径、日志格式

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```
- mime.types 中记录了一些文件后缀名与文件类型的映射表，比如后缀名 html 对应的文件类型是 text/html ，当 Nginx 回复 html 文件时就会将 HTTP 响应报文 Header 中的 Content-Type 设置成 text/html 。如果一个文件的后缀名在 mime.types 中找不到，就用 default_type 的值设置 Content-Type 。
- 当 Nginx 经常回复小文件时，使用 sendfile 模式可以提高传输速度；当 Nginx 经常回复大文件时，应该关闭 sendfile 模式，否则磁盘 I/O 负载会太高.
- sendfile 模式：让 Linux 内核从磁盘读取文件内容之后，直接写入 TCP 缓冲区，而不载入 Nginx 的内存空间。这样能提高文件传输速度。
- tcp_nopush 模式与 tcp_nodelay 模式只能二选一：
  - tcp_nopush 模式：有数据时先不发送，而是等缓冲区满了才发送。这样能降低网络 I/O 量，不容易阻塞网络。
  - tcp_nodelay 模式：一有数据就立即发送。这样能减少通信延迟。
- keepalive_timeout 表示客户端 TCP 连接的最大时长（单位为秒），超过该时间之后，Nginx 会关闭连接。

### default.conf

`/etc/nginx/conf.d/` 目录下默认存在一个 `default.conf` ，配置了 Nginx 的初始 Web 页面，如下：
```sh
server {
    listen       80;            # 定义该 server 监听的 TCP 端口（必填）
    server_name  localhost;     # 监听的域名（不必填）

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
    
    error_page   500 502 503 504  /50x.html;  # 当客户端的 HTTP 请求出错时，返回这些 html 文件
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
- http{} 模块中可以定义多个 server{} 模块，每个 server{} 模块代表一个 HTTP 服务器。
- server{} 中的其它配置项：
    ```sh
    charset  utf-8;       # 配置 HTTP 响应报文的 Content-Type
    root  /www/;          # 配置网站的根目录，当没有 HTTP 请求没有找到匹配的 location 时就到该目录下寻找文件
    access_log off;       # 在 server{} 之外配置的日志是全局日志，在 server{} 之内配置的日志是局部日志
    ```

## 指令

- Nginx 的配置文件中可以写入多种指令（directives）。
- 有的指令允许重复配置。
  - 在配置文件中，写在在局部作用域的指令，比起外部作用域的指令，优先级更高。
  - 在同一个作用域内，写在前面的指令，比起写在后面的指令，优先级更高。（因为 Nginx 一读取到前面的指令就开始应用了）

### listen

：用于声明 server 监听的 IP:Port 。
- 可用上下文：server{}
- 它是硬性要求，server 只会接收满足 listen 条件的 HTTP 请求。
- 例：
    ```sh
    listen      80;              # 相当于 listen *:80
    listen      127.0.0.1:80;
    listen      unix:/var/run/nginx.sock;
    ```

### server_name

：用于声明 server{} 监听的域名（但并不是硬性要求）。
- 可用上下文：server{}
- 当 Nginx 在某个 TCP 端口收到一个 HTTP 请求时，会交给监听该端口的 server 处理。
  - 如果监听该端口的 server 有多个，则考虑 Request Header 中的 Host 与哪个 server 监听的 server_name 匹配。
  - 如果没有匹配的 server_name ，或者 Request Header 中的 Host 是 IP 地址，则交给监听该端口的默认 server 处理。
  - 监听一个端口的默认 server 是 nginx.conf 中最先定义的那个，也可以手动指定。如下：
    ```sh
    listen       80  default_server;
    ```
  - server_name 有以下几种格式，排在前面的优先匹配：
    ```sh
    server_name  www.test.com localhost;    # 匹配明确的域名（可以填多个，Nginx 不会去验证 DNS）
    server_name  *.test.com;                # 以 *. 开头，模糊匹配
    server_name  www.test.*;                # 以 .* 结尾
    server_name  ~^(?<www>.+)\.test\.com$;  # 正则表达式
    server_name  "";                        # 空字符串，相当于不填 server_name ，不会匹配任何域名
    ```
  - 如果有两个 server 监听的端口、域名都相同，则启动 Nginx 时会报错：`conflicting server name`

### location{}

：用于定义 URI 路由规则。
- 可用上下文：server{}、location{}
- 语法为 `location <type> <URI> {...}` ，可以定义多个，可以嵌套。
- 匹配类型 type 有以下几种，排在前面的优先匹配：
  - `=`  ：字符串精确匹配，即匹配与该字符串完全相同的 URI 。
  - `^~` ：字符串前缀匹配，即匹配以该字符串开头的 URI 。
  - `~`  ：正则匹配。如果某个 URI 同时匹配多个正则 location ，则采用正则表达式最长的那个。
  - `~*` ：不区分大小写的正则匹配。
  - 不指定 type 时，匹配规则相当于 `^~` ，但优先级最低。

- URI 以 `/` 结尾则会转发相对路径，不以 `/` 结尾则会转发绝对路径。如下：
    ```sh
    location /img {
        root /www/;
    }
    ```
    ```sh
    location /img/ {
        root /www/;
    }
    ```
    - 访问 `http://127.0.0.1/img/1.html` 时，会转发绝对路径 `img/1.html` ，转发到 `http://127.0.0.1:80/www/img/1.html` 。
    - 访问 `http://127.0.0.1/img/1.html` 时，会转发相对路径 `1.html` ，转发到 `http://127.0.0.1:80/www/1.html` 。

- 如果有两个 location 的 type、URI 都相同，则启动 Nginx 时会报错：`duplicate location` 。

### allow 、deny

：用于允许或禁止某些 IP 地址的访问。
- 可用上下文：http{}、server{}、location{}
- 例：
    ```sh
    deny    192.168.1.1;
    allow   192.168.1.0/24;    # 允许一个网段访问
    deny    all;               # 禁止所有 IP
    allow   all;
    ```
- Nginx 会给禁止访问的 IP 回复 HTTP 403 报文。

### auth_basic

：用于启用 HTTP Basic Auth 。
- 可用上下文：http{}、server{}、location{}
- 例：
    ```sh
    auth_basic              "";                 # 只要不设置成 auth_basic off; 就会启用认证
    auth_basic_user_file    /etc/nginx/passwd;  # 使用哪个密码文件
    ```
- 密码文件中保存了可用的用户名、密码，在运行时修改也会自动刷新。可用以下命令生成：
    ```sh
    yum install httpd-tools
    htpasswd -cb passwd leo 123456   # 往密码文件 passwd 中添加一个用户 leo ，并保存其密码的 MD5 值。加上 -c 选项会创建该文件，如果该文件已存在则会被覆盖
    htpasswd -b passwd leo 1234      # 往密码文件 passwd 中添加一个用户 leo 。如果该用户名已存在，则会覆盖其密码
    htpasswd -D passwd leo           # 删除一个用户
    ```

### gzip

：用于 gzip 压缩响应报文 body 。
- 可用上下文：http{}、server{}、location{}
- 例：
    ```sh
    location ~ .*\.(jpg|gif|png|bmp)$ {
        gzip on;                    # 启用 gzip
        gzip_vary on;               # 在响应头中加入 Vary: Accept-Encoding ，告诉浏览器这是 gzip 报文
        gzip_min_length 1k;         # 启用压缩的文件的最小体积（低于该值则不会压缩）
        gzip_comp_level 1;          # 压缩率（取值为 1~9 ，1 的压缩率最低，CPU 负载也最小）
        gzip_http_version 1.0;      # 基于哪个版本的 HTTP 协议来传输 gzip 报文（默认为 HTTP 1.1）
        gzip_types text/plain application/json application/x-javascript application/css application/xml application/xml+rss text/javascript application/x-httpd-php image/jpeg image/gif image/png image/x-ms-bmp;  # 压缩哪些类型的响应报文 body
    }
    ```
- 这样能降低通信耗时，但是会增加 Nginx 的 CPU 负载。
- 版本较老的浏览器可能只支持 HTTP 1.0 协议，甚至不能解析 gzip 报文。

### proxy_pass

：将收到的 HTTP 请求转发给某个服务器，实现反向代理。
- 可用上下文：location{}
- 例：
    ```sh
    location / {
        proxy_pass    http://127.0.0.1:79;
        # proxy_cache cache;                # 使用缓存
        # inactive 3;                       # 将缓存文件保存 3 分钟
        # proxy_cache_valid 200 304 2m;     # 客户端 2 分钟之内发出状态码为 200、304 的 HTTP 请求都会使用缓存
    }
    ```
- 如果 proxy_pass 的 URL 以 / 结尾，则转发相对路径，否则转发绝对路径。
- 使用 proxy_cache 时，Nginx 会将 proxy_pass 服务器响应的静态文件缓存一段时间，如果客户端发来的请求 URL 与缓存的某个 URL 的 hash 值相同，则直接从缓存中取出静态文件回复给客户端（响应头中包含 Nginx-Cache: HIT），否则将 HTTP 请求转发给 proxy_pass 服务器处理（响应头中包含 Nginx-Cache: MISS）。

### rewrite

：将收到的 HTTP 请求重定向到某个 URL 。
- 可用上下文：server{}、location{}
- 例：
    ```sh
    rewrite  /1.html  /2.html ;         # 将访问 1.html 的请求重定向到 2.html
    rewrite  ^(.*)$  https://$host$1;   # 可以使用正则匹配、正则替换
    ```
- 如果目标 URL 以 http:// 或 https:// 开头，则返回 301 永久重定向，否则返回 302 临时重定向。

### return

：直接返回 HTTP 响应报文给客户端。
- 可用上下文：server{}、location{}
- 例：
    ```sh
    server{
        listen  80;
        return  403;                                # 只返回状态码
        return  200 OK\n;                           # 返回状态码和一个字符串（字符串可以不加定界符）
        return  200 '{"name":"test","id":"001"}';   # 返回状态码和 JSON 格式的字符串
        return  200 'uri: $uri';                    # 可以使用变量

    }
    ```
- 当 Nginx 执行到 return 指令时会立即返回 HTTP 响应，不会执行之后的指令。

### ssl_protocols

：用于启用 HTTPS 协议。
- 可用上下文：http{}、server{}
- 例：
    ```sh
    server {
        listen    443  ssl;                     # 监听时采用 ssl 协议
        server_name localhost;
        
        ssl_certificate /etc/nginx/conf.d/cert.pem;       # 指明.crt 文件的路径
        ssl_certificate_key /etc/nginx/conf.d/cert.key;   # 指明.key 文件的路径
        
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;  # 设置 ssl 加密套件
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;    # 设置可用的 ssl 协议版本
        ssl_prefer_server_ciphers on;           # 在 ssl 握手时使用 server 的密码

        # 在一段时间内复用一个 ssl 会话，以节省 ssl 握手的时间
        ssl_session_cache   shared:SSL:10m;     # 设置 ssl 缓存的大小，10M 大概可以存储 40000 个 ssl 会话
        ssl_session_timeout 10m;                # 设置缓存的失效时间
        ...
    }
    ```

### stream

：用于实现 TCP 代理。
- 可用上下文：与 http{} 同级
- 例：
    ```sh
    stream {
        upstream mysql {
            hash $remote_addr consistent;
            server 10.0.0.1:3306 weight=5;
            server 10.0.0.2:3306 weight=10;
        }
        server {
            listen 3306;
            proxy_pass mysql;
            proxy_timeout 3s;
            proxy_connect_timeout 1s;
        }
    }
    ```

### upstream

：用于定义任意个可用的 server（即后端服务器），从而可以将收到的 HTTP 请求按某种策略转发给 server 处理，实现负载均衡。
- 可用上下文：http{}

常见的分配策略：
- 按轮询分配：将 HTTP 请求按时间顺序依次分配给各个 server ，实现简单的平均分配。配置如下：
    1. 在 http{} 之内、server{} 之外定义 upstream 。
    ```sh
    upstream my_cluster {         # 定义一个 upstream ，名为 my_cluster
        server 127.0.0.1:8085;    # 添加一个 server
        server 127.0.0.1:8086;
    }
    ```
    2. 设置 proxy_pass 指令，将 HTTP 请求转发到 my_cluster 。
    ```sh
    location / {
        proxy_pass    http://my_cluster;    # 这个域名会在 Nginx 每次启动时解析
    }
    ```

- 按轮询加权重分配：权重较大的 server 优先被分配。适合处理几台 server 性能不均的情况。
    ```sh
    upstream my_cluster {
        server 127.0.0.1:8085 weight=5; 
        server 127.0.0.1:8086 weight=10;
    }
    ```

- 按响应时间分配：响应时间短的 server 优先被分配。
    ```sh
    upstream my_cluster {
        fair; 
        server 127.0.0.1:8085 weight=5; 
        server 127.0.0.1:8086 weight=10;
    }
    ```

- 按 ip_hash 分配：将客户端 ip 的 hash 值相同的 HTTP 请求分配给同一个 server 。适合保持 session 。
    ```sh
    upstream my_cluster {
        ip_hash;
        server 127.0.0.1:8085; 
        server 127.0.0.1:8086;
    }
    ```

- 按 url_hash 分配：将目标 url 的 hash 值相同的 HTTP 请求分配给同一个 server 。适合利用缓存。
    ```sh
    upstream my_cluster { 
        url_hash;
        server 127.0.0.1:8085; 
        server 127.0.0.1:8086;
    }
    ```

## 变量

Nginx 提供了以下内置变量。可以通过 `$` 取值，变量名不区分大小写，如果变量名或变量值不存在则取值为空。

用法示例：
```
location /name/ {
    proxy_pass http://127.0.0.1$request_uri;
}
```

- 关于 HTTP 请求报文：
```sh
remote_addr     # 客户端的地址
remote_port     # 客户端的端口
request         # 请求报文的第一行，比如 GET /static/index.html HTTP/1.1
request_body    # 请求 body 。只有当 Nginx 执行了 proxy_pass,fastcgi_pass,uwsgi_pass,scgi_pass 时才会将请求 body 载入内存，使得该变量取值不为空
request_length  # 请求报文的长度
request_method  # 请求的方法名，采用大写，比如 GET
request_uri     # 请求 URI
uri             # 请求 URI 中的路径部分，比如原始 URI 为 /static/index.html?id=1 时，路径部分为 /static/index.html
args            # 请求 URL 中的 Query String
is_args         # 如果存在 Query String 则取值为 ? （即使格式不正确），否则取值为空
args_NAME       # Query String 中指定参数的值，不区分大小写
http_NAME       # headers 中指定参数的值，不区分大小写
cookie_NAME     # cookie 中指定参数的值，不区分大小写

scheme    # 请求采用的协议，取值为 http 或 https
https     # 如果采用了 HTTPS 协议则取值为 on ，否则取值为空

request_filename # 请求 URI 指向的服务器文件，比如 /www/static/index.html
document_root   # request_filename 文件在服务器上所处的根目录，比如 Nginx 配置的 root /www/;
host #优先级：HTTP请求行的主机名>"HOST"请求头字段>符合请求的服务器名.请求中的主机头字段，如果请求中的主机头不可用，则为服务器处理请求的服务器名称





server_addr     # 服务器的 IP ，由 HTTP 请求指向的 IP 决定，比如 127.0.0.1
server_name     # 服务器的名称，由 Nginx 中 server{} 模块配置的 server_name 参数决定，采用小写
server_port     # 服务器的端口号
server_protocol   # 服务器的 HTTP 协议版本，比如HTTP/1.0" 或 "HTTP/1.1"

```



- 关于 HTTP 响应报文：
```
status      # 响应报文的状态码
request_completion
request_time

```


- 其它：
```sh
hostname        # 服务器的主机名，由服务器所在主机决定
msec            # Unix 时间戳格式的服务器时间，比如 1603792024.820
time_iso8601    # ISO 格式的服务器时间，比如 2020-10-28T10:27:14+08:00
time_local      # 日志格式的服务器时间，比如 28/Oct/2020:10:27:14 +0800

nginx_version   # Nginx 的版本号
pid             # Nginx 当前 worker process 的 PID


```

自定义变量：
```
if ($request_uri ~ /wap/(\d+)/(.+)){
    set $bucketid $1;
    set $params $2;
}
```

可以主动赋值的变量：
```
$sent_http_content_length 4096
```


```
location / {
    root /data/front/emcd/;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
    add_header Cache-Control "no-cache, no-store";
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1";
}
```

```
location ^~/test/play {
    proxy_pass_request_body on;
    proxy_pass_request_headers on;
    proxy_pass http://xyz.com/play;
    proxy_redirect off;
    proxy_cookie_path / /;
}
```
