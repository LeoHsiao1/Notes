# Nginx

：一个轻量级的 HTTP 服务器。
- [官方文档](http://nginx.org/en/docs/)
- 读音相当于 engine x 。
- 特点：
  - 支持反向代理、负载均衡。
  - 不仅支持 HTTP、HTTPS 协议，也支持 IMAP、POP3、SMTP 协议。
  - 支持第四层的 TCP 代理、第七层的 HTTP 代理。
  - 一般用作静态服务器，处理静态文件的效率高。

## 部署

- 用 yum 安装：
  ```sh
  yum install nginx
  ```
  然后启动：
  ```sh
  nginx                     # 启动 nginx 服务器。默认作为守护进程运行
        -c /root/nginx.conf # 使用指定的配置文件。默认使用 /etc/nginx/nginx.conf
        -g 'daemon off;'    # 加上指令，这里是要求在前台运行
        -t                  # 不启动，而是测试配置文件的语法是否正确
        -T                  # 测试配置文件，并打印当前配置
        -s quit             # 让 Nginx 优雅地退出。这会等处理完当前的 HTTP 请求才终止
        -s exit             # 让 Nginx 立即终止
        -s reload           # 重新加载配置文件。这会创建一组新的 worker 进程，而旧的 worker 进程会等处理完旧的 HTTP 请求才终止
  ```
  或者用 systemctl 启动：
  ```sh
  systemctl start nginx
  systemctl enable nginx
  ```

- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    nginx :
      container_name: nginx
      image: nginx:1.20
      restart: unless-stopped
      ports:
        - 80:80
      volumes:
        - /etc/localtime:/etc/localtime:ro
        # - ./nginx.conf:/etc/nginx/nginx.conf
        - ./dist:/usr/share/nginx/html
  ```

## 原理

- Nginx 主进程启动之后，会创建多个 worker 子进程负责处理 HTTP 请求。
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
- 配置文件的扩展名为 .conf ，采用 Nginx 自定的语法，用 # 声明单行注释。
  - 配置文件分为多个层级，最外层称为 main ，其下可以包含 events、http 等区块。
  - 每个层级的缩进距离为 4 格，但并不影响语法。
  - 每条指令大多独占一行，以 ; 结尾。
- 有的指令可以重复使用。
  - 写在局部作用域的指令，比起外部作用域的指令，优先级更高。
  - 在同一个作用域内，写在前面的指令，比写在后面的指令，优先级更高。因为 Nginx 一读取到前面的指令就开始应用了。

### nginx.conf

`/etc/nginx/nginx.conf` 的默认内容：
```sh
user  nginx;                                # 启动 Nginx 主进程的用户名，可能需要给该用户分配权限
worker_processes  1;                        # 启动的 worker 进程数，设置成 auto 则会自动与 CPU 核数相等
# daemon off;                               # 是否以 daemon 方式运行，默认为 on
error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;              # 将 Nginx 主进程的 PID 记录到该文件中

events {
    worker_connections  1024;               # 每个 worker 支持的最大连接数
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;
    sendfile        on;
    # tcp_nopush     on;
    keepalive_timeout  65;
    # gzip  on;
    include /etc/nginx/conf.d/*.conf;
}
```
- 用 `include` 可导入指定文件的内容，加入当前配置。

### default.conf

`/etc/nginx/conf.d/` 目录下默认存在一个 `default.conf` ，配置了 Nginx 的初始 Web 页面，如下：
```sh
server {
    listen       80;            # 该 server 监听的地址（必填）
    server_name  localhost;     # 监听的域名（可选）

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
  listen      80;              # 相当于 listen 0.0.0.0:80
  listen      127.0.0.1:80;
  listen      unix:/var/run/nginx.sock;
  ```
- listen 指令决定了 server 绑定一个什么样的 Socket 并监听，只会接收发送到该 Socket 的 TCP 数据包。
- 如果有多个 server 监听同一个端口，则第一个定义的 server 是默认 server 。也可以手动指定，如下：
  ```sh
  listen       80  default_server;
  ```

### server_name

：声明 server 监听的域名。
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
  - location 语句可以嵌套到 location 内，但不支持写在 if 语句内。
- 语法：
  ```sh
  location [type] URI {
      ...
  }
  ```
  - 匹配类型 type 有以下几种，优先级从高到低如下：
    - `=`  ：字符串精确匹配，即匹配与该字符串完全相同的 URI 。
    - `^~` ：字符串前缀匹配，即匹配以该字符串开头的 URI 。
      - 如果某个 URI 同时匹配多个前缀匹配规则，则采用前缀最长的那个规则。
    - `~`  ：正则匹配。
      - 如果某个 URI 同时匹配多个正则匹配规则，则采用第一个匹配的那个规则。
    - `~*` ：不区分大小写的正则匹配。（其它匹配类型都区分大小写，除非是 Cygwin 等操作系统）
    - 不指定 type 时，匹配类型相当于 `^~` ，但优先级最低。
  - 如果有两个 location 的 type、URI 都相同，则启动 Nginx 时会报错：`duplicate location` 。
- 例：
  ```sh
  location /img/ {
      root /www/;
  }
  ```
  - 服务器收到指向 `http://127.0.0.1/img/1.html` 的请求时，会匹配该 location 。于是尝试获取文件 /www/img/1.html ，返回 200 响应报文。如果不存在该文件，则返回 404 响应报文。
  - 服务器收到指向 `http://127.0.0.1/img` 的请求时，不会匹配该 location ，可能返回 404 响应报文。
    - 特别地，如果 location 区块内包含了 proxy_pass、fastcgi_pass、uwsgi_pass 等代理指令之一（即使没有被执行），则此时会匹配该 location ，返回一个 301 重定向报文，指向 /img/ 。

- 另一种语法：
  ```sh
  location @name {
      ...
  }
  ```
  - 这是将 location 命名，从而可以在其它位置调用。像一个 URI ，可以将请求内部重定向到它。
  - 这种语法不支持嵌套：不能被 location 包含，也不能包含 location 。
  - 例：
    ```sh
    location  / {
        root /usr/share/nginx/html;
        error_page 404 @test;
    }

    location  @test {
        return 200 'Hello\n';
    }
    ```
    - 该例中把所有 `@test` 替换成 `/test` ，效果一样。

### root

：到指定目录下寻找路径与 URI 匹配的文件作出响应报文。
- 可用范围：http、server、location
- 默认值：
  ```sh
  root html;
  ```

## 关于重定向

### index

：如果请求的 URI 以 / 结尾，则通过内部重定向将请求转发到 `$uri/index` 。
- 可用范围：http、server、location
- 例：
  ```sh
  index index.html index.htm;
  ```
  - 可以定义多个文件，如果前一个文件不存在，则查找后一个文件。

### autoindex

：如果请求的 URI 以 / 结尾，则返回一个 HTML 页面，显示 URI 对应的磁盘目录的文件列表。
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

### rewrite

：如果请求 URI 中的部分字符串与正则表达式匹配，则重写 URI 。
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

- 例：将 HTTP 请求重定向为 HTTPS 请求
  ```sh
  server {
      listen 80;
      rewrite ^(.*)$  https://$host$1   permanent;  # 可以使用正则替换
      # return  301   https://$host$request_uri;    # return 语句比 rewrite 更快
  }
  ```
- 下例中，请求 /www/1.html 时会重写成 /index.html ，然后被第二个 rewrite 重定向到 `http://$host:80/index.html` 。
  ```sh
  location  /www/ {
      rewrite   /www/1.html  /index.html;        # 只要 URI 包含 /www/1.html ，就重写成 /index.html
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

### try_files

：尝试寻找多个位置的文件作为响应报文。
- 可用范围：server、location
- 语法：
  ```sh
  try_files file ...  uri;
  try_files file ...  =code;
  ```
  - 可以指定一个或多个 file 参数，寻找对应的文件作为响应报文。如果所有 file 都不存在，则返回最后一个参数对应的响应报文。
    - file 参数只能是本机上有效的文件路径，不能指向 URL 。
    - 最后一个参数可以是一个 uri 或 code 。
  - 该命令属于内部重定向，不会改变客户端请求的 URL 。
- 例：
  ```sh
  try_files $uri $uri/index.html $uri.html  /index.html;
  try_files $uri $uri/index.html $uri.html  =404;
  ```

### error_page

：将指定状态码的响应报文内部重定向到某个 URI 。
- 可用范围：http、server、location
- 语法：
  ```sh
  error_page code ... [=[response]] uri;
  ```
  - 状态码 code 的取值范围为 300~599 。
- 例：
  ```sh
  error_page 404  /404.html;
  error_page 401  =200 /login;            # 401 时重定向到登录页面
  error_page 500 502 503 504  /50x.html;  # 可以同时指定多个状态码

  location = /50x.html {
      root   /usr/share/nginx/html;
  }
  ```

### absolute_redirect

：服务器返回重定向的响应报文时，重定向之后的地址是完整的 URL （即绝对路径，从 http 协议头开始），还是 URI （即相对路径）。
- 可用范围：http、server、location
- 默认值：
  ```sh
  absolute_redirect on;
  ```
- 例如：如果启用该参数时，重定向报文的 Headers 中包含了 `Location: http://localhost/index.html` ，则禁用该参数时就会变成 `Location: /index.html` 。

### server_name_in_redirect

：启用 absolute_redirect 时，重定向之后的 URL 中，服务器地址是否采用 Nginx 配置的 server_name 参数。
- 可用范围：http、server、location
- 默认值：
  ```sh
  server_name_in_redirect on;
  ```
- 如果禁用该参数，则采用请求头中的 Host 字段，或者服务器的 IP 地址。

### port_in_redirect

：启用 absolute_redirect 时，重定向之后的 URL 中，服务器的端口是否采用 Nginx 配置的 listen 参数。
- 可用范围：http、server、location
- 默认值：
  ```sh
  port_in_redirect on;
  ```
- 如果禁用该参数，则不注明端口号，即采用默认的 80 端口。

## 关于流程控制

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
  - Nginx 不支持 else 子句。
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
- ngx_http_rewrite_module 模块的指令包括 if、break、return、rewrite、set 等

### return

：直接返回 HTTP 响应报文给客户端。（不会执行后续指令）
- 可用范围：server、location
- 例：
  ```sh
  server{
      listen  80;
      return  404;                                # 只返回状态码
      return  200 OK\n;                           # 返回状态码和一个字符串（字符串可以不加定界符）
      return  200 '{"name":"test","id":"001"}';   # 返回状态码和 JSON 格式的字符串
      return  302 /index.html;                    # 返回 302 状态码，并指定重定向的目标
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

          # proxy_http_version 1.0;         # 转发时的 HTTP 协议版本，默认为 1.0 ，还可取值为 1.1
          # proxy_pass_request_body on;     # 是否转发请求 body ，默认为 on
          # proxy_set_body $request_body;   # 设置转发过去的请求 body
          # proxy_request_buffering on;     # 接收客户端的请求时，缓冲之后再转发给上游服务器
          # proxy_connect_timeout 60s;      # 与上游服务器建立连接的超时时间
          # proxy_send_timeout 60s;         # 限制发送请求给上游服务器时，写操作中断的超时时间
          # proxy_read_timeout 60s;         # 限制从上游服务器读取响应时，读操作中断的超时时间
      }
  }

  server {
      listen 79;
      location / {
          return 200 '$request_uri\n';
      }
  }
  ```
- 如果 proxy_pass 目标地址中包含 URI ，则将原 URI 被 location 匹配之后剩下的部分附加到目标地址之后（即转发相对路径）。否则直接将原 URI 附加到目标地址之后（即转发绝对路径）。如下，测试发送指向 `127.0.0.1:80/www/1.html` 的请求：
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79;    # 转发到 /www/1.html
  }
  ```
  ```sh
  location /www {
      proxy_pass  http://127.0.0.1:79/;   # 转发到 //1.html
  }
  ```
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79/;   # 转发到 /1.html
  }
  ```
- 如果 proxy_pass 目标地址中包含 URI 且调用了变量，则直接将它的值作为转发结果，不考虑原 URL 。
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79$request_uri; # 转发到 /www/1.html
  }
  ```
- 如果将 proxy_pass 与正则表达式、if 模块一起使用，则目标地址不能包含 URI ，否则启动 Nginx 时会报错。
  ```sh
  location ~ ^/www/\d*.html {
      proxy_pass  http://127.0.0.1:79/;         # 不可行
  }
  ```
  ```sh
  location ~ ^/www/(\d*.html) {
      proxy_pass  http://127.0.0.1:79/$1;       # 可行，转发到 /1.html
  }
  ```
- 如果在 `rewrite ... ... break;` 之后使用 proxy_pass ，则会将被 rewrite 重写之后的 URI 作为转发结果。
  ```sh
  location /www/ {
      rewrite     1.html  /index.html     break;
      proxy_pass  http://127.0.0.1:79/test/;    # 转发到 /index.html
  }
  ```

- 反向代理多个后端服务器时，可以通过 URL 的差异，区分发向不同后端服务器的 HTTP 请求：
  ```sh
  location /www/ {
      proxy_pass  http://127.0.0.1:79/;
  }
  location /www2/ {
      proxy_pass  http://127.0.0.1:78/;
  }
  ```
  - 也可以给多个后端服务器分配不同的子域名，通过 server_name 区分。

### proxy_redirect

：对上游服务器发出的响应头中的 Location、Refresh 字段进行字符串替换。
- 可用范围：http、server、location
- 例：
  ```sh
  location /www/ {
      proxy_pass      http://127.0.0.1:79/;
      proxy_redirect  default;
      # proxy_redirect  http://localhost:80/      http://$host:$server_port/;
      # proxy_redirect  http://localhost:(\d*)/   http://$host:$1/;
      # proxy_redirect  /   /;
      # proxy_redirect off;
  }
  ```
  - 默认会启用 `proxy_redirect default;` ，其规则为 `proxy_redirect <proxy_pass_url> <location_url>;` 。
    - 在上例中相当于 `proxy_redirect http://127.0.0.1:79/ /www/;` 。
    - 如果 proxy_pass 中调用了变量，则默认规则会失效。

### proxy_set_header

：转发 HTTP 请求给上游服务器时，添加 Header 。
- 可用范围：http、server、location
- 默认值：
  ```sh
  proxy_set_header Host $proxy_host;
  proxy_set_header Connection close;    # 默认对上游服务器禁用 TCP 长连接
  ```
- 反向代理时的一般设置：
  ```sh
  proxy_http_version 1.1;
  proxy_set_header Host              $http_host;                  # 记录客户端原始请求指向的域名
  proxy_set_header X-Real-IP         $remote_addr;                # 记录客户端的真实 IP
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;  # 按顺序记录该请求经过的每层代理服务器的 IP ，第一个地址是客户端的真实 IP
  proxy_set_header X-Forwarded-Proto $scheme;                     # 记录该请求与代理服务器之间，采用 http 还是 https 协议
  ```
  - 如果设置的值是空字符串 '' ，则会删除该字段。
- 反向代理 websocket 时，需要以下配置：
  ```sh
  proxy_http_version 1.1;
  proxy_set_header Upgrade    $http_upgrade;
  proxy_set_header Connection Upgrade;
  ```
- 以下变量只支持被 proxy_set_header 指令调用：
  ```sh
  proxy_host                  # proxy_pass 指定的上游服务器的 host:port
  proxy_port
  proxy_add_x_forwarded_for   # 取值等于请求头的 字段，加上 $remote_addr 值，用逗号分隔
  ```
- 如下，Nginx 有些指令支持多次配置，但不支持部分继承。如果当前作用域没有配置该指令，则继承自上级作用域，否则不继承。
  - proxy_set_header
  - add_header
  - limit_req
  - limit_conn

### proxy_buffering

：是否启用缓冲。
- 可用范围：http、server、location
- 例：
  ```sh
  proxy_buffering on;             # 启用缓冲（默认启用）
  proxy_buffers 8 4k;             # 用于接收每个响应报文，的缓冲区的数量和大小。默认为一个内存页大小
  proxy_buffer_size 4k;           # 用于接收每个响应报文的第一部分，的缓冲区大小。默认为一个内存页大小
  proxy_busy_buffers_size  8k;    # busy 状态的缓冲区的最大大小，一般为 2 个缓冲区

  proxy_temp_path /tmp/nginx/proxy_temp 1 2;  # 在一个磁盘目录下创建临时文件来缓冲数据，划分 2 层子目录
  proxy_temp_file_write_size  16k;            # 每次写入临时文件的最大数据量
  proxy_max_temp_file_size 1024m;             # 所有临时文件的总大小
  ```

当 Nginx 执行 proxy_pass 接收上游服务器的响应报文时，默认启用了缓冲，但没有启用缓存。
- 缓冲（buffer）
  - ：暂存几秒钟，等整个接收之后，再发送给客户端。
    - 如果该响应报文超出内存缓冲区，则暂存到磁盘的 proxy_temp_path 目录下，并在 error_log 中记录：`	[warn] an upstream response is buffered to a temporary file`
    - 还没有完全接收该响应报文时，最多可以将缓冲区中 proxy_busy_buffers_size 大小的部分，发送给客户端。这部分缓冲称为 busy 状态。
  - 优点：
    - 适用于 Nginx 与上游服务器的通信速度，比 Nginx 与客户端的通信速度快很多的情况。可以尽早与上游服务器断开连接，减少其负载。
  - 缺点：
    - 增加了客户端等待响应的时间。
  - 如果不启用缓冲，则 Nginx 每次接收 proxy_buffer_size 大小的响应数据就发送给客户端。这样通信延迟更低，但是效率低。
    - 启用了 cache 时，可以不启用 buffer ，反正都要暂存到磁盘。
- 缓存（cache）
  - ：暂存几分钟甚至几天，当客户端再次请求同一个响应报文时就拿缓存文件回复，不必请求上游服务器。
  - 优点：
    - 可以避免重复向上游服务器请求一些固定不变的响应报文，减少上游服务器的负载，减少客户端等待响应的时间。
  - 缺点：
    - 增加了磁盘 IO 。

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
  # proxy_cache_lock_age 5s;                  # 一组请求每被阻塞 5 s ，就解锁一个请求，转发给上游服务器
  # proxy_cache_lock_timeout 5s;              # 一组请求最多被阻塞 5 s 。超过该时间则全部解锁，但不会缓存响应报文
  ```

- 如果客户端发来的请求 URL 与缓存的某个 URL 的 hash 值相同，则直接从缓存中取出数据回复给客户端，此时响应头中包含 `Nginx-Cache: HIT` 。
  - 否则，将请求转发给上游服务器处理，此时响应头中包含 `Nginx-Cache: MISS` 。
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

：用于定义一组上游服务器，按某种策略将请求转发给这些 server 处理，实现负载均衡，高可用。
- 可用范围：http
- 例：
  ```sh
  upstream my_cluster {           # 定义一个 upstream ，名为 my_cluster
      server 127.0.0.1:81;        # 添加一个 server
      server 127.0.0.1:82   down;
      server test.backend.com;
      server unix:/tmp/backend;
  }
  server {
      listen 80;
      location / {
          proxy_pass  http://my_cluster;  # 将请求转发给上游服务器
      }
  }
  ```
- server 的可用参数：
  ```sh
  weight=1          # 权重，默认为 1
  max_conns=0       # 限制该 server 同时处理的 TCP 连接数。默认为 0 即没有限制
  max_fails=1       # 默认值为 1 ，取值为 0 则不限制
  fail_timeout=10s  # 如果在一个 fail_timeout 周期内，与该 server 通信失败 max_fails 次，则在该周期内认为它不可用
  backup            # 将该 server 标记为备份服务器，当所有非 backup 服务器不可用时才使用它
  down              # 将该 server 标记为不可用
  ```
- 安装第三方模块 lua-nginx-module 之后，可以通过 lua 脚本动态生成 upstream 配置，实现动态路由。

常见的分配策略：
- 轮询分配：将 HTTP 请求按时间顺序依次分配给各个 server ，实现简单的平均分配。
  ```sh
  upstream my_cluster {
      server 127.0.0.1:81;
      server 127.0.0.1:82;
      server test.backend.com;
  }
  ```
  - Nginx 在启动时会解析域名。如果一个域名解析到多个 IP ，则对这些 IP 采用轮询分配。
  - 如果一个 server 不可用，则分配给下一个 server 处理。如果所有 server 都不可用，则将最后一个 server 的报错返回给客户端。

- 加权轮询分配：权重越大的 server 被分配的概率越大。适合处理几台 server 性能不均的情况。
  ```sh
  upstream my_cluster {
      server 127.0.0.1:81 weight=5;
      server 127.0.0.1:82 weight=10;
  }
  ```
  - 默认采用加权轮询分配。

- 按响应时间分配：响应时间越短的 server 被分配的概率越大。
  ```sh
  upstream my_cluster {
      fair;
      server 127.0.0.1:81;
      server 127.0.0.1:82;
  }
  ```
  - 需要安装第三方模块 nginx-upstream-fair 。

- 按 ip 的哈希分配：保证将客户端 ip 的 hash 值相同的 HTTP 请求分配给同一个 server 。适合保持 session 、利用缓存。
  ```sh
  upstream my_cluster {
      ip_hash;
      server 127.0.0.1:81;
      server 127.0.0.1:82;
  }
  ```

- 自定义的哈希分配：
  ```sh
  upstream my_cluster {
      hash $remote_addr consistent;
      server 127.0.0.1:81;
      server 127.0.0.1:82;
  }
  ```
  - 启用 consistent 参数则会采用 ketama 一致性哈希算法，使得改变 upstream 中的 server 数量时，绝大部分哈希值依然映射到原来的 server 。

### stream

：用于定义 TCP 代理。
- 可用范围：main
- 例：
  ```sh
  stream {
      upstream mysql {
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

### access_log

：配置 Nginx 的访问日志，它会记录 Nginx 处理的所有 HTTP 请求。
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
  ```sh
  access_log off;       # 取消当前作用域的访问日志
  ```
  ```sh
  access_log logs/access.log combined gzip=1 flush=5m if=$need_log;
  ```

### error_log

：配置 Nginx 的错误日志，它会记录 Nginx 的内部运行信息。
- 可用范围：main ，http ，mail ，stream ，server ，location
- 语法：
  ```sh
  error_log path [level];
  ```
  - 日志级别从复杂到简单依次为：debug, info, notice, warn, error, crit, alert, emerg

### log_format

：定义日志格式。该格式只能被 access_log 命令调用。
- 可用范围：http
- 默认值：
  ```sh
  log_format combined '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent"';

  ```
- log_format 指令只能定义 access_log 的格式，不能改变 error_log 的格式。

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
  request_uri       # 请求 URI （取值不会因为 rewrite、alias 而改变）
  uri               # 请求 URI 中的路径部分，比如原始 URI 为 /static/1.html?id=1 时，路径部分为 /static/1.html
  args              # 请求 URL 中的 Query String
  is_args           # 如果存在 Query String 则取值为 ? （即使格式不正确），否则取值为空
  args_XXX          # Query String 中指定参数的值，不区分大小写

  host              # 请求指向的主机名，取值来自：请求行中的主机名、请求头中的 Host 字段、处理该请求的 server_name
  request_filename  # 请求 URI 指向的服务器文件，比如 /www/static/1.html
  document_root     # request_filename 文件在服务器上所处的根目录，通常由 root 指令决定

  request_length    # 请求报文的长度
  server_protocol   # 请求采用的协议及版本，通常取值为 HTTP/1.0、HTTP/1.1 或 HTTP/2.0
  scheme            # 请求采用的协议，取值为 http 或 https
  https             # 如果请求采用了 HTTPS 协议则取值为 on ，否则取值为空

  http_XXX          # headers 中指定参数的值，不区分大小写
  cookie_XXX        # cookie 中指定参数的值，不区分大小写

  request_body      # 请求 body 。只有当 Nginx 执行了 proxy_pass、fastcgi_pass、uwsgi_pass 或 scgi_pass 时才会将请求 body 载入内存，否则该变量取值为空
  ```

- 关于 HTTP 响应报文：
  ```sh
  status            # 响应报文的状态码
  bytes_sent        # 响应报文的大小，单位为 bytes
  body_bytes_sent   # 响应报文 body 的大小
  ```

- 关于客户端：
  ```sh
  remote_addr       # 客户端的地址
  remote_port       # 客户端的端口
  remote_user       # 客户端的用户名（用于 HTTP Basic Auth）
  http_referer
  http_user_agent
  ```

- 关于服务器：
  ```sh
  server_addr       # 服务器的 IP ，由请求指向的 IP 决定，比如 127.0.0.1
  server_name       # 服务器的名称，由 Nginx 中 server{} 模块配置的 server_name 参数决定，采用小写
  server_port       # 服务器监听的端口号
  request_time      # 请求的处理时长，单位 ms

  hostname          # 服务器的主机名，由服务器所在主机决定
  pid               # Nginx 当前 worker process 的 PID
  nginx_version     # Nginx 的版本号

  upstream_addr
  upstream_response_time

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
  - 密码文件用于保存一组用户名、哈希密码，可通过 htpasswd 命令生成。

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

## 关于限流

### limit_rate

：用于限制响应报文的传输速率，单位为 Bytes/s 。
- 可用范围：http、server、location
- 例：
  ```sh
  location /www/ {
      limit_rate  10k;
  }
  ```
- 默认值为 0 ，表示不限制。

### limit_req

：用于限制客户端的请求数。
- 可用范围：http、server、location
- 例：
  ```sh
  http {
      # 创建一个 zone ，以 binary_remote_addr 作为限流的 key
      # zone  ：创建一个指定大小的共享内存区域，用于记录 key 信息
      # rate  ：限制速率。例如 10r/s 表示每秒 10 个请求，10r/m 表示每分钟 10 个请求
      limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;
      # 创建一个 zone ，以 server_name 作为限流的 key
      limit_req_zone $server_name zone=perserver:10m rate=100r/s;

      server {
          location / {
              proxy_pass http://10.0.0.1;
              limit_req zone=perip;       # 采用 zone ，限制每个 IP 地址的请求数
              limit_req zone=perserver;
              # burst 队列的长度默认为 0 ，启用它有利于处理客户端的突发大量请求
              # limit_req zone=perip burst=20 nodelay;

              # limit_req_status 503;
              # limit_req_log_level error;
          }
      }
  }
  ```
  - rate 不支持小数，且实际工作时会转换成每 100ms 的平均阈值，不能准确限制。
    - 例如 rate=10r/s 时，实际限制大概为 1 r/100ms 。
    - 例如 rate=1r/m 时，在接收一个请求之后的 1 min 内，拒绝新请求。
  - limit_req 采用漏斗算法（leaky bucket）：
    - 每 100ms 为一个处理周期。如果当前周期内，收到的请求数超过 rate 限制，则将请求放入称为 burst 的 FIFO 队列中。
      - 每隔一个周期，从队列中取出请求，正常处理。
      - 如果队列溢出，则拒绝新请求：返回 limit_req_status 状态码，并记录报错日志：`limiting requests, excess 0.340 by zone "perip"` ，其中 excess = 根据当前请求估测的每毫秒请求数 - 平均每毫秒允许的 rate 。
    - 启用 nodelay 策略时，会将超过 rate 限制的请求立即处理，同时将 burst 队列中相应数量的槽位标记为已占用。每隔一个周期，尝试释放一次槽位。
  - 以 binary_remote_addr 作为限流的 key 时，每个 key 需要 128bytes 来存储状态信息，因此 10MB 内存可以记录 8W 个 key。
    - 每次记录一个新 key 时，会尝试删除两个最近 60s 未使用的 key 。
    - 如果 zone 内存耗尽，也会拒绝新请求。

### limit_conn

：用于限制并发连接数。
- 可用范围：http、server、location
  ```sh
  http {
      limit_conn_zone $binary_remote_addr zone=perip:10m;
      limit_conn_zone $server_name zone=perserver:10m;

      server {
          location / {
              proxy_pass http://10.0.0.1;
              limit_conn perip 10;        # 采用 zone ，限制每个 IP 地址的并发连接数
              limit_conn perserver 100;

              # limit_conn_status 503;
              # limit_conn_log_level error;
          }
      }
  }
  ```
  - 当 Nginx 读取完请求的 Headers 之后，才会将该请求计入并发连接数。
  - 以 binary_remote_addr 作为限流的 key 时，每个 key 需要 64bytes 来存储状态信息，因此 10MB 内存可以记录 16W 个 key。

## 关于 TCP

### keepalive

：用于配置到上游服务器的 TCP 长连接。
- 可用范围：upstream
- 例：
  ```sh
  keepalive 16;               # 启用长连接，并限制每个 worker 保持的空闲连接数。这并不能控制长连接总数
  # keepalive_requests 1000;  # 限制每个长连接可以发送的请求数。如果超过，则关闭 TCP 连接
  # keepalive_time 1h;        # 限制每个长连接的存在时间。如果超过，则在当前 HTTP 请求结束后关闭 TCP 连接
  # keepalive_timeout 60s;    # 限制每个长连接的空闲时间。如果超过，则关闭 TCP 连接
  ```

- Nginx 默认支持长连接。但反向代理时，与上游服务器之间默认不用长连接。
  - 因此，上游服务器发出响应报文之后，就会主动关闭连接，让 Socket 变成 TIME_WAIT 状态。
  - 如果由 Nginx 主动关闭 TCP 连接，则会让 Nginx 上的 Socket 变成 TIME_WAIT 状态。
  - 保留的 TCP 长连接较多时，会占用较多内存。

- 例：启用到上游服务器的长连接
  ```sh
  upstream my_cluster {
      server 127.0.0.1:81;
      server 127.0.0.1:82;
      keepalive 16;
  }
  server {
      listen 80;
      location / {
          proxy_pass  http://my_cluster;
          proxy_http_version 1.1;
      }
  }
  ```

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

：用于提高发送本机文件的速度。
- 可用范围：http、server、location
- 默认值：
  ```sh
  sendfile    off;
  ```

### tcp_nodelay

：一有数据就立即发出 TCP 包。
- 可用范围：http、server、location
- 默认值：
  ```sh
  tcp_nodelay   on;
  ```
- 仅在 TCP 长连接中有效。这样会增加网络 I/O 量，但是能减少通信延迟。

### tcp_nopush

：有数据时先不发送，而是等满足 TCP 包最大段大小（Maximum Segment Size ，MSS）时才发送。
- 可用范围：http、server、location
- 默认值：
  ```sh
  tcp_nopush    off;
  ```
- 仅在 sendfile 模式中有效。这样能降低网络 I/O 量，不容易阻塞网络。
- 如果同时启用 tcp_nodelay ，tcp_nopush ，则最后一个 TCP 包采用 tcp_nodelay ，其它 TCP 包采用 tcp_nopush 。

## 关于 HTTP

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

### add_header

：用于添加响应报文的 header 。
- 可用范围：http、server、location
- 语法：
  ```sh
  add_header name value [always];
  ```
  - 该指令可以多次使用。
  - 默认如果响应报文的状态码属于 200, 201, 206, 301, 302, 303, 307, 308 ，则在头部末尾添加 header 。
    - 如果声明了 always ，则无论状态码是什么，都会添加 header 。
  - 默认如果当前级别没有定义任何 add_header 指令，则继承上一级别的 add_header 指令。
- 例：
  ```sh
  location /api {
      add_header Content-Type 'application/json; charset=utf-8';
      return  200 '{"code": 200, "msg": "请求成功"}';
  }
  ```
- 例：允许 CORS 请求
  ```sh
  add_header Access-Control-Allow-Origin * always;
  add_header Access-Control-Allow-Credentials true;
  add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
  add_header Access-Control-Allow-Headers 'Content-Type,User-Agent,X-Requested-With';
  if ($request_method = 'OPTIONS') {
    add_header Access-Control-Max-Age 1728000;
    return 204;
  }
  ```

### charset

：用于在响应报文的 Content-Type 中加入 charset 。
- 可用范围：http、server、location
- 默认值：
  ```sh
  charset off;
  ```
- 例：
  ```sh
  charset utf-8;
  ```

### expires

：用于设置响应报文的缓存过期时间。
- 可用范围：http、server、location
- 语法：
  ```sh
  expires [modified] time;
  expires epoch | max | off;
  ```
  - 启用 expires 指令时，如果响应报文的状态码属于 200, 201, 204, 206, 301, 302, 303, 304, 307, 308 ，则会设置响应报文头部的 Expires、Cache-Control 字段。
- 例：
  ```sh
  location ~ ^/static/(.+\.(gif|jpe?g|png))$ {    # 设置静态文件的过期时间
      expires 365d;
  }
  ```
  ```sh
  expires   10m;              # 过期时间为 10m 之后
  expires   modified  10m;    # 过期时间为文件的最后修改时间 + 10m

  expires   epoch;            # 不缓存。这会设置 Expires: "Thu, 01 Jan 1970 00:00:01 GMT"; Cache-Control: "no-cache"
  expires   max;              # 最长缓存。这会设置 Expires: "Thu, 31 Dec 2037 23:55:55 GMT"; Cache-Control: "max-age=315360000"
  expires   off;              # 禁用 expires 指令，这是默认值
  ```

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
  ```sh
  default_type    text/plain;
  ```

### client_*

：关于接收 HTTP 请求报文的配置参数。
- 可用范围：http、server
- 默认值：
  ```sh
  client_header_buffer_size 1k;   # 读取请求报文头部的缓冲区大小
  client_body_buffer_size   4k;   # 读取请求报文 body 的内存缓冲区大小，默认为一个内存页大小。超出内存缓冲区的部分会写入 client_body_temp_path 目录下的临时文件中，并记录 warn 日志： a client request body is buffered to a temporary file
  client_body_temp_path     /tmp/nginx/client_temp 1 2;

  client_header_timeout   60s;    # 读取请求报文头部的超时时间。如果超时，则返回响应报文：408 Request Time-out
  client_body_timeout     60s;    # 限制读取请求报文 body 时，读操作中断的超时时间。如果超时，则返回响应报文：408 Request Time-out
  client_max_body_size    1m;     # 限制请求报文 body 的最大体积。如果超过限制，则返回响应报文：413 Request Entity Too Large 。设置成 0 则取消限制
  ```

### ssl_*

：关于 HTTPS 协议的配置参数。
- 可用范围：http、server
- 例：
  ```sh
  server {
      listen    443  ssl;                     # 监听时采用 ssl 协议
      server_name localhost;

      ssl_certificate /ssl/cert.crt;          # 数字证书
      ssl_certificate_key /ssl/cert.key;      # SSL 私钥

      # ssl_ciphers HIGH:!aNULL:!MD5;         # 设置 SSL 加密算法
      # ssl_protocols TLSv1 TLSv1.1 TLSv1.2;  # 设置可用的 SSL 协议版本
      ssl_prefer_server_ciphers on;           # 在 SSL 握手时使用 server 的加密算法

      # 在一段时间内复用一个 SSL 会话，以节省 SSL 握手的时间
      ssl_session_cache   shared:SSL:10m;     # 设置 SSL 缓存的大小，10M 大概可以存储 40000 个 SSL 会话
      ssl_session_timeout 10m;                # 设置缓存的失效时间
  }
  ```
- 如果 Nginx 的某个 SSL 端口被多个 server 监听，则会采用默认 server 的 SSL 证书进行 SSL 握手。
  - 因为在 SSL 握手时，还没有开始 HTTP 通信，所以 Nginx 不能根据 server_name 进行路由。
- HTTP、HTTPS 协议分别默认采用 TCP 80、443 端口，互不兼容。
  ```sh
  [root@CentOS ~]# curl  https://127.0.0.1:80/    # 不支持向 HTTP 端口发送 HTTPS 请求
  curl: (35) SSL received a record that exceeded the maximum permissible length.
  [root@CentOS ~]# http://127.0.0.1:443/          # 不支持向 HTTPS 端口发送 HTTP 请求
  <html>
  <head><title>400 The plain HTTP request was sent to HTTPS port</title></head>
  <body bgcolor="white">
  <center><h1>400 Bad Request</h1></center>
  ```
  - 当用户访问 HTTPS 网站时，浏览器通常会禁止发出 HTTP 请求，比如 chrome 浏览器会报错：`blocked:mixed-content`
