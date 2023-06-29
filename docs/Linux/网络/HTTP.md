# HTTP

## curl

：一个命令行工具，常用于访问 HTTP 服务器。
- 基于 libcurl 库开发，支持 HTTP、HTTPS、FTP、SMTP 等多种通信协议。

命令：
```sh
curl <URL>...                   # 访问指定网址（默认为 GET 方法），并将 HTTP 响应内容打印到 stdout
    -X POST                     # --request ，使用指定类型的 HTTP 方法
    -H "Connection: Keep-Alive" # --header ，加上 header（可以重复使用该命令选项）
    -b "name=leo"               # --cookie ，加上 cookies
    -I                          # --head ，发送 HEAD 请求
    -L                          # --location ，如果 HTTP 响应报文是重定向，则自动跟随

    # 关于下载
    -o <PATH>                   # --output ，将 URL 指向的资源保存为指定路径的文件
    -O                          # 保存为当前目录下的同名文件
    -C <offset>                 # --continue-at ，从 offset 处继续下载，offset 为 - 则会自动计算。这需要响应报文包含 Content-Range 字段，声明数据片段的起始、结束位置

    # 关于身份认证
    -k                          # --insecure ，不验证网站的 SSL 证书是否有效，但依然会建立 SSL 连接
    -u USER[:PASSWORD]          # 发送用户名，或者用户名加密码

    # 发送 POST body 的选项
    -d "id=001&name=leo"        # --data ，在请求报文的 body 中，以纯文本形式发送数据。此时默认采用 POST 方法，并自动添加 HTTP 头部 "Content-Type : application/x-www-form-urlencoded"
    --data-ascii "Hello"        # 等价于 -d
    --data-urlencode "Hello"    # 经过 URLencode 之后再以纯文本形式发送
    --data-binary "Hello"       # 以二进制形式发送
    --data-binary @f1           # 上述选项都可以通过 @filepath 的格式发送文件的内容。不过 --data-binary 是以二进制格式发送，避免乱码
    -F key1=Hello               # 发送 form 表单格式的 POST body ，此时默认采用 POST 方法，并自动添加 HTTP 头部 "Content-Type: multipart/form-data"
    -F file1=@f1                # 该选项可以多次使用
    -T f1                       # 上传文件，此时默认采用 PUT 方法

    # 关于通信协议
    --ipv4                      # 强制 curl 将目标域名解析到 ipv4 地址
    --ipv6
    --tlsv1.3                   # 采用 TLS 1.3 协议
    --http1.0                   # 采用 HTTP/1.0 协议。默认优先采用 HTTP/1.1
    --http2                     # 采用 HTTP/2.0 协议，这需要 curl 7.43 以上版本

    # 关于通信过程
    -v                          # 显示通信过程的详细信息（包括请求报文、响应报文）
    --progress-bar              # 显示进度条
    -m 10                       # 设置整个操作的超时时间（单位为秒）
    --connect-timeout 3         # 设置连接上 Web 服务器的超时时间（单位为秒）

    # 使用代理
    -x [PROTOCOL://][user:password@]HOST:PORT   # --proxy
    -x http://admin:123456@10.0.0.1:80
    -x socks5://10.0.0.1:1080
```
- 如果 URL 包含特殊字符，则要用单引号或双引号作为定界符，以免引发歧义。
- 使用 curl 时，默认不会显示进度表。
  - 通过 -o 或 -O 选项下载文件时，会显示进度表。
  - 将 stdout 从终端重定向到其它位置时，会通过 stderr 显示一个进度表。如下：
    ```sh
    [root@CentOS ~]# curl 127.0.0.1 | grep ok
      % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                    Dload  Upload   Total   Spent    Left  Speed
    100   495  100   495    0     0   905k      0 --:--:-- --:--:-- --:--:--  483k
    ```
    - 可以改为显示一行简单的进度条：
      ```sh
      [root@CentOS ~]# curl 127.0.0.1 --progress-bar > /dev/null
      ######################################################################## 100.0%
      ```
    - 或者隐藏进度条，但这样可能隐藏其它报错信息：
      ```sh
      curl 127.0.0.1 2> /dev/null
      ```
- 虽然 curl 命令提供的 HTTP 客户端的功能少，不如浏览器。但日常工作中经常要用 curl 命令下载文件，或进行测试。
  - 执行 `curl <ip>:<port>` ，可测试本机能否向某个端口建立 TCP 连接。这里也可用 telnet 命令测试。
  - 执行 `curl cip.cc` ，可查询本机使用的公网 IP 、地理位置。
  - 执行 `curl -v -X GET https://httpbin.org/get -H "accept: application/json"` ，可测试本机发出的 HTTP headers 有哪些。

## wget

：一个命令行工具，与 curl 类型，只支持 HTTP、HTTPS、FTP 协议。

命令：
```sh
wget <URL>...                # 访问指定网址（默认为 GET 方法），并将 HTTP 响应 body 保存为当前目录下的文件
    -b                       # 在后台下载
    -c                       # --continue ，如果要保存的文件已存在，则从该文件的长度之后继续下载（默认是保存为另一个文件，文件名加上递增的编号后缀）
    -O f1.zip                # 保存为指定路径的文件
    -t 10                    # 设置下载失败时的重试次数（0 是无限次）

    --http-user=xxx          # 发送用户名
    --http-password=xxx      # 发送密码
    --limit-rate=300k        # 限制下载速度
    --no-check-certificate   # 不检查 HTTPS 网址的证书
    --spider                 # 不下载文件，可用于检测该网址是否有效
```
- 执行命令 `wget <url>` ，相当于执行 `curl -LO <url>` 。
- 例：爬取网页
  ```sh
  wget -e robots=off -r -np -p -k <url>
        -e robots=off # 忽略 robot 协议
        -r            # 递归下载该目录下的所有文件
        -np           # 递归下载时不遍历上层目录
        -p            # 下载显示在网页中的所有文件
        -k            # 将网页中的绝对链接改为本地链接
  ```
