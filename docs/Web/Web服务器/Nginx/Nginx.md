# Nginx

：一个轻量级的 HTTP 服务器。
- [官方文档](http://nginx.org/en/docs/)
- 读音相当于 engine x 。
- 于 2004 年发布，采用 C 语言开发。
- 特点：
  - 一般用作静态服务器，处理静态文件的效率高。也可用作动态服务器，支持 FastCGI、WSGI 应用。
  - 支持 HTTP、HTTPS 协议，还支持 IMAP、POP3、SMTP 协议。
  - 支持反向代理、负载均衡。支持第四层的 TCP 代理、第七层的 HTTP 代理。

## 部署

- 用 yum 安装：
  ```sh
  yum install nginx
  ```
  然后用 systemctl 启动：
  ```sh
  systemctl start nginx
  systemctl enable nginx
  ```
  或者手动启动：
  ```sh
  nginx                     # 启动 nginx 服务器。默认作为守护进程运行
        -c /root/nginx.conf # 使用指定的配置文件。默认使用 /etc/nginx/nginx.conf
        -g 'daemon off;'    # 加上指令，这里是要求在前台运行
        -t                  # 不启动，而是测试配置文件的语法是否正确
        -T                  # 测试配置文件，并打印当前配置
        -s stop             # 让 Nginx 立即终止
        -s quit             # 让 Nginx 优雅地终止。这会等 worker 进程处理完当前的 HTTP 请求，即没有正在使用的 TCP 连接，才终止 worker
        -s reload           # 重新加载配置文件。这会先创建新 worker 进程，而旧 worker 进程会优雅地终止
  ```

- 或者用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    nginx :
      container_name: nginx
      image: nginx:1.23
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
  - Nginx 启动时，会加载所有配置文件，拆分为不同阶段的指令，按阶段顺序执行，而不是按配置文件的顺序执行。
  - 用户可以自定义模块，注册到某个阶段。
  - find-config、post-rewrite、post-access 三个阶段不支持注册模块。
