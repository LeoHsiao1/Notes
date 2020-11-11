# Nginx

：一个轻量级的 Web 服务器软件。
- 读音相当于 engine x 。
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

## 原理

- Nginx 主进程启动之后，会运行多个 worker 进程负责处理 HTTP 请求。
- Nginx 处理每个 HTTP 请求的过程分为 11 个阶段（phase）：
  ```sh
  post-read       # 在读取了 HTTP 请求之后开始执行
  server-rewrite  # 执行在 server 内、location 外配置的 rewrite 指令
  find-config     # 选择一个 location 来处理 HTTP 请求
  rewrite         # 执行在 location 内配置的 rewrite 指令
  post-rewrite    # 如果请求的 URI 被 rewrite 了，则将请求回退到 find-config 阶段重新处理
  preaccess       # 执行 limit_rate 等指令，限制访问效率
  access          # 执行 allow、deny、auth 等指令，控制访问权限
  post-access     # 执行 satisfy any 指令
  try-files       # 检查 URI 指向的本机文件是否存在
  content         # 生成 HTTP 响应报文
  log             # 记录日志
  ```

- Nginx 官方提供了多种模块，每种模块包含多种可执行的指令（directives）。
  - Nginx 会按阶段依次执行配置文件中的指令。
  - 用户可以自定义模块，注册到某个阶段。
  - find-config、post-rewrite、post-access 三个阶段不支持注册模块。


## 配置文件

- Nginx 默认使用 `/etc/nginx/nginx.conf` 作为主配置文件，还会导入 `/etc/nginx/conf.d/` 目录下的其它配置文件。
- 配置文件的后缀名为 .conf ，采用 Nginx 自定的语法，用 # 声明单行注释。
  - 配置文件分为多个层级，最外层称为 main ，其下可以包含 events、http 等区块。
  - 每个层级的缩进距离为 4 格，但并不影响语法。
  - 每条指令大多独占一行，以 ; 结尾。
- 有的指令可以重复使用。
  - 写在局部作用域的指令，比起外部作用域的指令，优先级更高。
  - 在同一个作用域内，写在前面的指令，比写在后面的指令，优先级更高。因为 Nginx 一读取到前面的指令就开始应用了。

### nginx.conf

`/etc/nginx/nginx.conf` 的默认内容：
```sh
user  nginx;                                # 启动 Nginx 进程的用户名，可能需要给该用户分配权限
worker_processes  1;                        # 启动的 Nginx worker 进程数，设置成 auto 则会自动与 CPU 核数相等
#daemon off;                                # 是否以 daemon 方式运行，默认为 on
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;              # 将 Nginx 主进程的 PID 记录到该文件中

events {
    worker_connections  1024;               # 每个 Nginx worker 支持的最大连接数
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
- 用 `include` 可导入指定文件的内容作为配置。
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

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
- http{} 区块中至少要定义一个 server{} ，才能监听 TCP 端口，接收 HTTP 请求。
- server{} 区块中至少要定义一个 location{} ，才能对 HTTP 请求进行路由处理。
- server{} 中的其它配置项：
  ```sh
  charset  utf-8;
  
  ```

## 关于路由

- 当 Nginx 在某个 TCP 端口收到一个 HTTP 请求时，会交给监听该端口的 server 处理。
  - 如果监听该端口的 server 有多个，则考虑请求头中的 Host 参数与哪个 server 监听的 server_name 匹配。
  - 如果没有匹配的 server_name ，则交给监听该端口的默认 server 处理。

- 当 server 收到请求时，会从多个地方查找与请求 URI 匹配的资源，作出响应报文。包括：
  ```sh
  location
  proxy_pass
  index
  autoindex
  ```
  如果前一个资源不存在，则查找后一个资源。如果都没找到匹配 URI 的资源，则返回响应报文：`404 Not Found`

### listen

：声明 server 监听的 IP:Port 。
- 可用范围：server
- 例：
  ```sh
  listen      80;              # 相当于 listen *:80
  listen      127.0.0.1:80;
  listen      unix:/var/run/nginx.sock;
  ```
- 如果有多个 server 监听同一个端口，则第一个定义的 server 是默认 server 。也可以手动指定，如下：
  ```sh
  listen       80  default_server;
  ```

### server_name

：声明 server{} 监听的域名。
- 可用范围：server
- server_name 有以下几种格式，排在前面的优先匹配：
  ```sh
  server_name  www.test.com localhost;    # 匹配明确的域名（可以声明多个，Nginx 不会去验证 DNS）
  server_name  *.test.com;                # 以 *. 开头，模糊匹配
  server_name  www.test.*;                # 以 .* 结尾
  server_name  ~^(?<www>.+)\.test\.com$;  # 正则表达式
  server_name  "";                        # 空字符串，相当于不填 server_name ，不会匹配任何域名
  ```
- 如果有两个 server 监听的端口、域名都相同，则启动 Nginx 时会报错：`conflicting server name`

### alias

：修改请求的 URI 。
- 可用范围：server
- 例：
  ```sh
  root   /usr/share/nginx/html;
  location /www/ {
      alias /static/img/;     # 比如请求 /www/1.jpg 时，URI 会变成 /static/img/1.jpg
  }
  ```
  ```sh
  location ~ ^/www/(.+\.(gif|jpe?g|png))$ {
      alias /static/img/$1;   # 正则匹配时可以使用正则替换
  }
  ```

### location

：用于定义 URI 路由规则。
- 可用范围：server、location
- 语法：
  ```sh
  location [type] URI {
      [Directives]...
  }
  ```
  - 匹配类型 type 有以下几种，排在前面的优先匹配：
    - `=`  ：字符串精确匹配，即匹配与该字符串完全相同的 URI 。
    - `^~` ：字符串前缀匹配，即匹配以该字符串开头的 URI 。
    - `~`  ：正则匹配。如果某个 URI 同时匹配多个正则 location ，则采用正则表达式最长的那个。
    - `~*` ：不区分大小写的正则匹配。（其它匹配类型都区分大小写）
    - 不指定 type 时，匹配类型相当于 `^~` ，但优先级最低。
  - 如果有两个 location 的 type、URI 都相同，则启动 Nginx 时会报错：`duplicate location` 。

- 例：
  ```sh
  location /img/ {
      root /www/;
  }
  ```
  - 服务器收到指向 `http://127.0.0.1/img/1.html` 的请求时，会获取文件 /www/img/1.html ，返回 200 响应报文。如果不存在该文件则返回 404 响应报文。
  - 服务器收到指向 `http://127.0.0.1/img` 的请求时，会返回一个 301 永久重定向报文，指向 `http://127.0.0.1/img/` 。

### root

- 到 root 目录下寻找与 URI 匹配的文件作出响应报文。
- 可用范围：http、server、location
- 默认值：
  ```sh
  root html;
  ```

### index

- 如果请求的 URI 以 / 结尾，则通过内部重定向将请求指向 `URI/index` 。
- 可用范围：http、server、location
- 例：
  ```sh
  index index.html index.htm;
  ```
  - 可以定义多个文件，如果前一个文件不存在，则查找后一个文件。

### autoindex

- 如果请求的 URI 以 / 结尾，则返回一个 HTML 页面，显示该磁盘目录的文件列表。
- 可用范围：http、server、location
- 默认值：
  ```sh
  autoindex off;
  ```

### internal

：限制指定 location 只能被内部重定向的请求访问到。
- 可用范围：location
- 例：
  ```sh
  location /index.html {
      internal;
  }
  ```
- 如果被外部请求直接访问，则返回 404 响应报文。

## ngx_http_rewrite_module

### if

：如果条件为真，则执行括号内的指令。
- 可用范围：server、location
- 例：
  ```sh
  if ($request_uri ~ /www/(\d+)/(.+)) {
      set $param1 $1;
      set $param2 $2;
      return  200 '$param1, $param2\n';
  }
  ```
- 条件表达式有多种类型：
  - 取值为空字符串 `''` 或 `0` 则为假，否则为真
  - 使用 `=`、`!=` 进行比较运算
  - 使用 `~`、`~*` 进行正则匹配
  - 使用 ` -f`、`!-f` 判断文件是否存在
  - 使用 `!-d`、`!-d` 判断目录是否存在

### break

：跳过执行 ngx_http_rewrite_module 模块的指令。
- 可用范围：server、location
- 例：
  ```sh
  if ($slow) {
      limit_rate 10k;
      break;
  }
  ```

### return

：直接返回 HTTP 响应报文给客户端。（不会执行后续指令）
- 可用范围：server、location
- 例：
  ```sh
  server{
      listen  80;
      return  403;                                # 只返回状态码
      return  200 OK\n;                           # 返回状态码和一个字符串（字符串可以不加定界符）
      return  200 '{"name":"test","id":"001"}';   # 返回状态码和 JSON 格式的字符串
  }
  ```

### rewrite

- 如果请求报文的 URI 中的部分字符串与正则表达式匹配，则重写 URI 。
- 可用范围：server、location
- 语法：
  ```sh
  rewrite regex replacement [flag];
  ```
  flag 有多种取值：
  - 不填 ：先执行完 ngx_http_rewrite_module 模块的指令（不会执行其它指令），然后：
    - 如果 replacement 以 http:// 或 https:// 开头，则返回 302 临时重定向报文，指向 replacement 。
    - 如果 replacement 不以它们开头，则将请求回退到 find-config 阶段重新处理（属于内部重定向）。
  - permanent ：立即返回 301 永久重定向报文。
  - redirect ：立即返回 302 临时重定向报文。
  - break ：跳过执行 ngx_http_rewrite_module 模块的指令，继续执行后续指令。
  - last ：跳过执行 ngx_http_rewrite_module 模块的指令，将请求回退到 find-config 阶段重新处理。
    - 此时总是会内部重定向，不会返回重定向报文。

- rewrite 指令的执行结果要么是将请求内部重定向，要么是返回一个外部重定向报文。
  - 每个 HTTP 请求最多被内部重定向 10 次，超过该次数则返回响应报文：`500 Internal Server Error`
  - 当 server 接收一个 HTTP 请求时，会首先解析出 request_uri 等变量的值，即使发生内部重定向也不会改变，除非转发到其它 server 。

- 下例中，请求 /www/1.html 时会重写成 /index.html ，然后被第二个 rewrite 重定向到 `http://$host:80/index.html` 。
  ```sh
  location  /www/ {
      rewrite   /www/1.html  /index.html;        # 只要 URI 包含 /www/1.html ，就重写成 /index.html
      rewrite   ^(.*)$       http://$host:80$1;  # 可以使用正则替换
      root      /usr/share/nginx/html;
  }
  ```
- 下例中，请求 /www/1.html 时会返回 /index.html 文件。请求 /www/2.html 时会交给第二个 location 处理，返回字符串 /www/2.html 。
  ```sh
  location  /www/ {
      rewrite   1.html  /index.html     break;
      rewrite   2.html  /debug/2.html   last;
      root      /usr/share/nginx/html;
  }
  location  /debug/ {
      return    200   '$request_uri\n';
  }
  ```

## 关于代理

### proxy_pass

：将请求转发给指定的服务器，实现反向代理。
- 可用范围：location
- 例：
  ```sh
  server {
      listen 80;
      location / {
          proxy_pass  http://127.0.0.1:79;
          # proxy_pass http://unix:/tmp/backend.socket:/uri/;   # 可以转发给 Unix 套接字

          # proxy_set_header  Host       $host;           # 转发时加入请求头
          # proxy_set_header  X-Real-IP  $remote_addr;
          # proxy_pass_request_body on;                   # 转发请求 body
          # proxy_set_body    $request_body;              # 设置转发过去的请求 body

          # proxy_request_buffering on;   # 接收客户端的 请求时，缓冲之后再转发给上游服务器
          # proxy_connect_timeout 60s;    # 与上游服务器建立连接的超时时间
          # proxy_send_timeout 60s;       # 限制发送请求给上游服务器时，写操作中断的超时时间
          # proxy_read_timeout 60s;       # 限制从上游服务器读取响应时，读操作中断的超时时间
      }
  }

  server {
      listen 79;
      location / {
          return 200 '$request_uri\n';
      }
  }
  ```

判断转发结果的 URI 的取值：
- 如果 proxy_pass 目标地址中包含 URI ，则将原 URI 被 location 匹配之后剩下的部分附加到目标地址之后（即转发相对路径）。否则直接将原 URI 附加到目标地址之后（即转发绝对路径）。如下，测试发送指向 `127.0.0.1:80/www/1.html` 的请求
  ```sh
  location /www {
      proxy_pass  http://127.0.0.1:79;  # 转发结果为 /www/1.html
  }
  ```
  ```sh
  location /www {
      proxy_pass  http://127.0.0.1:79/; # 转发结果为 //1.html
  }
  ```
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79/; # 转发结果为 /1.html
  }
  ```
- 如果 proxy_pass 目标地址中包含 URI 且调用了变量，则将它的值作为转发结果。
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79$request_uri; # 转发结果为 /www/1.html
  }
  ```
- 如果将 proxy_pass 与正则表达式、if 模块一起使用，则目标地址不能包含 URI ，否则启动 Nginx 时会报错。
  ```sh
  location ~ ^/www/\d*.html {
      proxy_pass  http://127.0.0.1:79/;     # 不可行
  }
  ```
  ```sh
  location ~ ^/www/(\d*.html) {
      proxy_pass  http://127.0.0.1:79/$1;   # 可行，转发结果为 /1.html
  }
  ```
- 如果在 `rewrite ... ... break;` 之后使用 proxy_pass ，则将被 rewrite 重写之后的 URI 作为转发结果。
  ```sh
  location /www/ {
      rewrite     1.html  /index.html     break;
      proxy_pass  http://127.0.0.1:79/test/;      # 转发结果为 /index.html
  }
  ```

### proxy_redirect

：对上游服务器发出的响应头中的 Location、Refresh 字段进行字符串替换。
- 可用范围：http、server、location
- 例：
  ```sh
  location /www/ {
      proxy_pass      http://127.0.0.1:79/;
      proxy_redirect  default;
      proxy_redirect  http://localhost:80/      http://$host:$server_port/;
      proxy_redirect  http://localhost:(\d*)/   http://$host:$1/;
      proxy_redirect  /   /;
      # proxy_redirect off;
  }
  ```
  - 默认会启用 `proxy_redirect default;` ，其规则为 `proxy_redirect <proxy_pass_url> <location_url>;`。
    - 在上例中相当于 `proxy_redirect http://127.0.0.1:79/ /www/;` 。
    - 如果 proxy_pass 中调用了变量，则默认规则会失效。

### proxy_buffering

：是否启用缓冲。
- 可用范围：http、server、location
- 例：
  ```sh
  proxy_buffering on;             # 启用缓冲（默认启用）	
  proxy_buffers 8 8k;             # 缓冲区的最大数量和大小（默认等于一个内存页大小）
  proxy_buffer_size 8k;           # 读取响应头的缓冲区大小（默认等于一个内存页大小）
  proxy_busy_buffers_size 16k;    # busy 状态的缓冲区的最大大小（一般为 2 个缓冲区）

  proxy_temp_path /tmp/nginx/proxy_temp 1 2;  # 在一个磁盘目录下创建临时文件来缓冲数据，划分 2 层子目录
  proxy_temp_file_write_size  16k;            # 每次写入临时文件的最大数据量
  proxy_max_temp_file_size 1024m;             # 所有临时文件的总大小
  ```
- 当 Nginx 将客户端的请求转发给 proxy_pass 上游服务器时，默认会启用缓冲，但不会启用缓存。
  - 缓冲（buffer）
    - ：Nginx 将上游服务器的响应报文保存几秒钟，等整个接收之后，再发送给客户端。
    - 会作用于所有响应报文。
    - 可以尽早与上游服务器断开连接，减少其负载，但是会增加客户端等待响应的时间。
    - 如果不启用缓冲，则 Nginx 收到上游服务器的一部分响应就会立即发送给客户端，通信延迟低。
  - 缓存（cache）
    - ：Nginx 将上游服务器的响应报文保存几分钟，当客户端再次请求同一个响应报文时就直接回复，不必请求上游服务器。
    - 只作用于部分响应报文。
    - 可以避免重复向上游服务器请求一些固定不变的响应报文，减少上游服务器的负载，减少客户端等待响应的时间。
- 优先使用内存中的缓冲区，如果满了就缓冲到磁盘的 proxy_temp_path 目录下。
- 当 Nginx 读取一个响应报文时，一般会等全部读取完之后再发送给客户端。
  - 如果该响应报文大于 proxy_busy_buffers_size ，则会一边读取响应报文，一边将缓冲的数据发送给客户端（这部分缓冲称为 busy 状态）。

### proxy_cache

：是否启用缓存。
- 可用范围：http、server、location
- 例：
  ```sh
  proxy_cache  cache1;                        # 定义一个名为 cache1 的共享内存空间，用于记录缓存项的索引，可以被多个地方使用（默认为 off ）
  proxy_cache_path  /tmp/nginx/proxy_cache    # 在一个磁盘目录下创建临时文件来缓存数据
                    levels=1:2                # 划分 2 层子目录
                    keys_zone=cache1:10m      # 在缓存空间 cache1 中占用 10 MB 的内存
                    max_size=10g              # 最多缓存 10 GB 的数据（缓存空间满了时会自动删掉较少访问的缓存项）
                    inactive=60m              # 如果一个缓存项一直没有被访问，则超过 60 min 之后就删除
                    use_temp_path=off;        # 待缓存数据会先写入临时文件，再重命名为缓存文件。该参数是指是否在其它目录写入临时文件

  proxy_no_cache $cookie_nocache $arg_nocache $arg_comment;  # 定义不使用缓存的条件（只要任一变量值为真）
  # proxy_cache_background_update off;        # 是否允许更新过期的缓存项
  proxy_cache_valid 200 302 10m;              # 限制不同状态码的响应的缓存时间
  proxy_cache_valid 404      1m;
  proxy_cache_valid any      5m;              # 限制所有响应报文的缓存时间

  proxy_cache_revalidate on;                  # 刷新过期的缓存项时，向上游服务器发出的请求头中包含 If-Modified-Since、If-None-Match
  proxy_cache_min_uses 3;                     # 当同一个响应被客户端请求至少 3 次之后，才缓存它（调大该参数可以只缓存频繁请求的响应）
  proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504; # 刷新过期的缓存项时，如果上游服务器报出这些错误而不能响应，则将已过期的缓存项发送给客户端
  
  # proxy_cache_key $scheme$proxy_host$request_uri;   # 定义每个缓存项的标签值（用于判断内容是否变化）
  proxy_cache_lock on;                        # 多个请求指向同一个缓存项且没有命中缓存时，只将一个请求转发给上游服务器，其它请求则被阻塞直到从缓存区获得响应
  # proxy_cache_lock_age 5s;                  # 一组请求每被阻塞 5 s  ，就解锁一个请求，转发给上游服务器
  # proxy_cache_lock_timeout 5s;              # 一组请求最多被阻塞 5 s 。超过该时间则全部解锁，但不会缓存响应报文
  ```

- 如果客户端发来的请求 URL 与缓存的某个 URL 的 hash 值相同，则直接从缓存中取出数据回复给客户端，此时响应头中包含 `Nginx-Cache: HIT` 。
  - 否则，将请求转发给上游服务器处理，此时响应头中包含 `Nginx-Cache: MISS`。
  - 如果响应头中的 Cache-Control 取值为 Private、No-Cache、No-Store 或 Set-Cookie ，则不缓存。

- 可以给客户端加上一个响应头，表示缓存的使用情况。
  ```sh
  add_header X-Cache-Status $upstream_cache_status;
  ```
  其可能的取值如下：
  ```sh
  BYPASS       # 该响应不应该使用缓存，这是 proxy_no_cache 参数在起作用
  MISS         # 该响应存在缓存
  HIT          # 该响应不存在缓存
  EXPIRED      # 该响应存在缓存，但是过期了
  UPDATING     # 该响应的缓存已过期，这是刚刚请求的新响应
  STALE        # 这是 proxy_cache_use_stale 参数在起作用
  REVALIDATED  # 这是 proxy_cache_revalidate 参数在起作用
  ```

### upstream

：用于定义任意个 server ，从而可以将收到的 HTTP 请求按某种策略转发给 server 处理，实现负载均衡。
- 可用范围：http

常见的分配策略：
- 按轮询分配：将 HTTP 请求按时间顺序依次分配给各个 server ，实现简单的平均分配。配置如下：
    1. 定义 upstream 。
    ```sh
    upstream my_cluster {         # 定义一个 upstream ，名为 my_cluster
        server 127.0.0.1:8085;    # 添加一个 server
        server 127.0.0.1:8086;
    }
    ```
    2. 通过 proxy_pass 指令将 HTTP 请求转发到 my_cluster 。
    ```sh
    location / {
        proxy_pass    http://my_cluster;    # 这个域名会在 Nginx 每次启动时解析
    }
    ```

- 按轮询加权重分配：权重较大的 server 优先被分配。适合处理几台 server 性能不均的情况。
    ```sh
    upstream my_cluster {
        server 127.0.0.1:8085 weight=5;     # weight 默认为 1
        server 127.0.0.1:8086 weight=10;
    }
    ```

- 按响应时间分配：响应时间短的 server 优先被分配。
    ```sh
    upstream my_cluster {
        fair;
        server 127.0.0.1:8085;
        server 127.0.0.1:8086;
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

### stream

：用于定义 TCP 代理。
- 可用范围：main
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

## 关于日志

### error_log

- 配置 Nginx 的错误日志，它会记录 Nginx 的内部运行信息。
- 可用范围：main，http，mail，stream，server，location
- 语法：
  ```sh
  error_log path [level];
  ```
  - 日志级别从复杂到简单依次为：debug, info, notice, warn, error, crit, alert, emerg

### access_log

- 配置 Nginx 的访问日志，它会记录 Nginx 处理的所有 HTTP 请求。
- 可用范围：http、server、location、limit_except
- 语法：
  ```sh
  access_log path [format [buffer=size] [gzip[=level]] [flush=time] [if=condition]];
  ```
  - 日志文件所在目录必须存在。
  - Nginx 每次写入日志时会打开文件描述符，写完之后就会关闭。
  - buffer 的默认大小为 64k 。
  - 启用 buffer 时，Nginx 不会立即将日志写入文件，而是先放入 buffer 缓存，直到满足以下任一条件：
    - buffer 满了。
    - buffer 中保留的日志超过 flush 秒。
    - Nginx worker 正在关闭或重新打开日志文件。
  - gzip 的默认压缩级别为 1 。取值为 9 时压缩率最高，速度最慢。
- 例：
  ```
  access_log off;       # 取消当前作用域的访问日志
  ```
  ```sh
  access_log logs/access.log combined gzip=1 flush=5m if=$need_log;
  ```

### log_format

- 定义日志格式。（该格式只能被 access_log 使用）
- 可用范围：http
- 默认值：
  ```sh
  log_format combined '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent"';
  ```
- 例：
  ```sh
  log_format  debug '[$time_local] $remote_addr:$remote_port to $server_addr:$server_port  "$request" $status\n'
                    'content_type: $http_content_type\n'
                    'body: $request_body\n';       # 定义一种日志格式，名为 debug
  access_log  /var/log/nginx/access.log  debug;    # 设置 access_log 的路径、日志格式
  ```

## 关于变量

- Nginx 提供了一些内置变量，用户也可以自定义变量。
- 变量可以通过 `$var` 的格式取值。
  - 变量名不区分大小写。
  - 如果变量不存在，则报错：`unknown variable`
  - 内置变量的默认值为 - 。
- 例：
  ```sh
  location / {
      return  200 '$request_uri\n';
  }
  ```

### set

：为一个变量赋值。如果该变量不存在则自动创建它。
- 可用范围：server
- 语法：
  ```sh
  set $variable value;
  ```
- 例：
  ```sh	
  server {
      listen  80;
      set     $port_type 8x;
  }
  ```
- 注意被赋值的变量名之前要加前缀 $ 。
- 不能给 Nginx 的内置变量赋值，否则会报错：`duplicate variable`
- 变量的值可以是数字或字符串类型。

### map

：用于将源变量输入字典取值，并赋值给目标变量。
- 可用范围：http
- 例：
  ```sh	
  map $server_port $port_type{
      # default   '';   # 如果字典中没有匹配的 key ，则取默认值
      80        8x;     # 将源变量与 key 进行字符串匹配
    ~ 9\d       9x;     # 正则匹配
    ~*9\d       9x;     # 不区分大小写的正则匹配
  }
  ```

### 内置变量

- 关于 HTTP 请求报文：
  ```sh
  request           # 请求报文的第一行，比如 GET /static/1.html HTTP/1.1
  request_method    # 请求的方法名，采用大写，比如 GET
  request_uri       # 请求 URI （不受 rewrite、alias 影响）
  uri               # 请求 URI 中的路径部分，比如原始 URI 为 /static/1.html?id=1 时，路径部分为 /static/1.html
  args              # 请求 URL 中的 Query String
  is_args           # 如果存在 Query String 则取值为 ? （即使格式不正确），否则取值为空
  args_NAME         # Query String 中指定参数的值，不区分大小写

  host              # 请求指向的主机名，取值来自：请求行中的主机名、请求头中的 Host 字段、处理该请求的 server_name
  request_filename  # 请求 URI 指向的服务器文件，比如 /www/static/1.html
  document_root     # request_filename 文件在服务器上所处的根目录，通常由 root 指令决定

  request_length    # 请求报文的长度
  scheme            # 请求采用的协议，取值为 http 或 https
  https             # 如果采用了 HTTPS 协议则取值为 on ，否则取值为空

  http_NAME         # headers 中指定参数的值，不区分大小写
  cookie_NAME       # cookie 中指定参数的值，不区分大小写

  request_body      # 请求 body 。只有当 Nginx 执行了 proxy_pass、fastcgi_pass、uwsgi_pass 或 scgi_pass 时才会将请求 body 载入内存，否则该变量取值为空
  ```

- 关于 HTTP 响应报文：
  ```sh
  status            # 响应报文的状态码
  request_time      # 请求的处理时长，单位 ms
  ```

- 关于客户端：
  ```sh
  remote_addr       # 客户端的地址
  remote_port       # 客户端的端口
  ```

- 关于服务器：
  ```sh
  server_addr       # 服务器的 IP ，由请求指向的 IP 决定，比如 127.0.0.1
  server_name       # 服务器的名称，由 Nginx 中 server{} 模块配置的 server_name 参数决定，采用小写
  server_port       # 服务器监听的端口号
  server_protocol   # 服务器采用的 HTTP 协议版本，通常为 HTTP/1.0 或 HTTP/1.1

  hostname          # 服务器的主机名，由服务器所在主机决定
  pid               # Nginx 当前 worker process 的 PID
  nginx_version     # Nginx 的版本号

  msec              # Unix 时间戳格式的服务器时间，比如 1603792024.820
  time_iso8601      # ISO 格式的服务器时间，比如 2020-10-28T10:27:14+08:00
  time_local        # 日志格式的服务器时间，比如 28/Oct/2020:10:27:14 +0800
  ```

## 关于访问权限

### allow 、deny

：允许、禁止某些 IP 地址的访问。
- 可用范围：http、server、location、limit_except
- 例：
  ```sh
  deny    192.168.1.1;       # 禁止一个 IP
  allow   192.168.1.0/24;    # 允许一个网段
  deny    all;               # 禁止所有 IP
  allow   all;
  ```
- 收到客户端的 HTTP 请求时，Nginx 会从上到下检查访问规则，采用第一条与客户端 IP 匹配的规则。
- 如果客户端被禁止访问，则返回响应报文：`403 Forbidden`

### auth_basic

：用于启用 HTTP Basic Auth 。
- 可用范围：http、server、location
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

### auth_delay

：当客户端认证失败时，延迟一段时间再作出响应。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  auth_delay 0s;
  ```
- 可以与 auth_basic 等认证措施搭配使用，避免暴力破解，不过客户端依然会保持 TCP 连接，占用资源。

### limit_except

：只允许接收指定的 HTTP 请求方法，对其它方法做出限制（通过 deny 限制）。
- 可用范围：location
- 例：
  ```sh
  location / {
      limit_except GET POST {
          deny    all;
      }
  }
  ```
- 允许 GET 方法时也会允许 HEAD 方法。

### limit_rate

：限制响应报文的传输速率，单位为 Bytes/s 。
- 可用范围：http、server、location
- 例：
  ```sh
  location /www/ {
      limit_rate  10k;
  }
  ```
- 默认值为 0 ，代表不限制。

### satisfy

：如果 ngx_http_access_module、ngx_http_auth_basic_module、ngx_http_auth_request_module、ngx_http_auth_jwt_module 模块都允许访问（或任一允许），则最终允许访问。
- 可用范围：http、server、location
- 语法：
  ```sh	
  satisfy all | any;
  ```
- 默认值：
  ```sh	
  satisfy all;
  ```

## 关于 TCP 通信

### keepalive_requests

：限制每个 TCP 长连接最多可以发送的请求数。（从而限制每个连接占用的最大内存）
- 可用范围：http、server、location
- 默认值：
  ```sh
  keepalive_requests 100;
  ```
- 如果超过该数量，Nginx 会关闭该 TCP 连接。

### keepalive_timeout

：限制每个 TCP 长连接的最长持续时间。
- 可用范围：http、server、location
- 默认值：
  ```sh
  keepalive_timeout 75s;
  ```
- 如果超过该时间，Nginx 会关闭该 TCP 连接。
- 如果该参数设置得过大，则容易遗留大量无用的 HTTP 连接占用资源。
- 如果需要延长持续时间，比如传输大文件，则建议划分出多个 location 分别设置 keepalive_timeout 。

### send_timeout

：限制发送响应报文时，写操作中断的超时时间。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  send_timeout 60s;
  ```
- 如果超过该值，关闭 TCP 连接。
- timeout 之类的参数取值过大时容易遭受 DDOS 攻击，取值过小时对网速较慢的客户端不友好。

### sendfile

- 仅当 Nginx 发送本机上的文件时有效，提高发送文件的效率。
- 可用范围：http、server、location
- 默认值：
  ```sh
  sendfile    off;
  ```
- 传统进程发送一个文件时，要先从磁盘读取文件内容，载入内核缓冲区，再载入进程的用户缓冲区，最后拷贝到 Socket 缓冲区发送。
- sendfile 是 Linux 系统提供的一种零拷贝技术，可以将内核缓冲区的指针直接传给 Socket 使用，从而减少发送文件时的负载和耗时。

### tcp_nodelay

- 一有数据就立即发出 TCP 包。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  tcp_nodelay   on;
  ```
- 仅在 TCP 长连接中有效。这样会增加网络 I/O 量，但是能减少通信延迟。

### tcp_nopush

- 有数据时先不发送，而是等满足 TCP 包最大段大小（Maximum Segment Size，MSS）时才发送。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  tcp_nopush    off;
  ```
- 仅在 sendfile 模式中有效。这样能降低网络 I/O 量，不容易阻塞网络。
- 如果同时启用 tcp_nodelay，tcp_nopush ，则最后一个 TCP 包采用 tcp_nodelay ，其它 TCP 包采用 tcp_nopush 。

## 关于 HTTP 通信

### gzip

：以 gzip 方式压缩响应报文 body 。这样能减少通信耗时，但是会增加 Nginx 的 CPU 负载。
- 可用范围：http、server、location
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
- 版本较老的浏览器可能只支持 HTTP 1.0 协议，甚至不能解析 gzip 报文。

### types

：用于定义 MIME 类型与文件扩展名（不区分大小写）的映射关系。
- 可用范围：http、server、location
- 默认值：
  ```sh
  types {
      text/html   html;
      image/gif   gif;
      image/jpeg  jpg;
  }
  ```
- Nginx 会根据该映射关系设置响应报文头部中 Content-Type 的值。比如发送一个扩展名为 html 的文件时，就设置 `Content-Type: text/html` 。
- /etc/nginx/mime.types 文件中通过 types 指令记录了很多 MIME 类型与文件扩展名的映射关系。

### default_type

：设置响应报文头部中 Content-Type 的默认值。
- 可用范围：http、server、location
- 默认值：
  ```
  default_type    text/plain;
  ```

### client_header_buffer_size

：限制读取请求报文头部的缓冲区大小。
- 可用范围：http、server
- 默认值：
  ```sh	
  client_header_buffer_size   1k;
  ```

### client_header_timeout

：限制读取请求报文头部的超时时间。
- 可用范围：http、server
- 默认值：
  ```sh	
  client_header_timeout   60s;
  ```
- 如果超过该值，则返回响应报文：`408 Request Time-out`

### client_max_body_size

：限制请求报文 body 的最大值。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  client_max_body_size  1m;
  ```
- 如果超过该值，则返回响应报文：`413 Request Entity Too Large`
- 设置成 0 则取消限制。

### client_body_timeout

：限制读取请求报文 body 时，读操作中断的超时时间。
- 可用范围：http、server、location
- 默认值：
  ```sh	
  client_body_timeout   60s;
  ```
- 如果超过该值，则返回响应报文：`408 Request Time-out`

### ssl_protocols

：用于启用 HTTPS 协议。
- 可用范围：http、server
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
