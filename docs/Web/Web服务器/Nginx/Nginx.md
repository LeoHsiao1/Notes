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
