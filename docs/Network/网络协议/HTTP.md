# HTTP

：超文本传输协议（Hyper Text Transfer Protocol），可以传输文本或文件，是 Web 服务器的核心通信协议。

## 特点

- 属于应用层协议，基于 TCP 通信。
- 采用 C/S 架构。
  - 一般的工作流程：客户端发出一个 HTTP 请求报文给服务器，然后服务器返回一个 HTTP 响应报文给客户端。
- 无连接
  - ：客户端与服务器通信时不会保持连接，每次通信都要重新建立连接。
  - 每次通信时，客户端首先与服务器建立 TCP 连接，然后发送 HTTP 请求报文，等服务器返回 HTTP 响应报文之后就断开 TCP 连接。
  - HTTP1.1 开始支持长连接。
- 无状态
  - ：HTTP 协议不会记录通信过程中的任何信息，每次通信都是独立的。
  - 尽管如此，服务器或客户端的程序可以自己记录通信过程中的一些信息。
  - 虽然 HTTP 协议不会记录客户端的身份，但服务器可以通过 IP 地址、cookie 辨认不同的客户端。

## 版本

- HTTP 1.0
  - 版本较老的浏览器可能只支持 HTTP 1.0 。
- HTTP 1.1
  - 支持 TCP 长连接，允许客户端使用同一个 TCP 连接多次发送 HTTP 请求报文。
    - 长连接适用于客户端频繁发出请求的情况，节省服务器反复建立 TCP 连接的耗时。
    - 服务器应该要限制同时保持的长连接的最大数量。
- HTTP 2.0
  - 采用二进制格式传输报文。
  - 支持 TCP 连接的多路复用，即同一个 TCP 连接中可以发出多个 HTTP 请求。
  - 支持压缩报文 header 。
  - 支持服务器主动推送报文到客户端。

## URI

：统一资源标识符（Uniform Resource Identifier)，用于表示网络中某个资源的名称或位置。
- 资源可以是实际存在的图片、文本文件，也可以是提供某种服务的 API 。
- HTTP 通信中，客户端通常通过 URI 定位服务器上的资源。
- URI 分为两种形式：
  - 统一资源名称（Uniform Resource Name ，URN）：用于表示资源的名称。
  - 统一资源定位符（Uniform Resource Locator ，URL）：用于表示资源的位置。

### URL

URL 的一般格式为：`protocol://hostname:port/path/?querystring#fragment`
- protocol ：采用的通信协议，比如 HTTP、HTTPS、FTP 。
- hostname ：服务器的主机名称，可以是主机名、域名或 IP 地址。
  - protocol、hostname 不区分大小写，但一般小写。
- port ：端口号。
  - 如果省略不填，则使用当前通信协议的默认端口。比如 HTTP 的默认端口为 80 。
  - 一个主机上可能运行了多个服务器软件，分别监听不同的端口。通过 hostname、port 才能定位一个唯一的服务器。
- path ：服务器上某个资源的路径。
  - 如果省略不填，则会访问根目录 / 。比如 www.baidu.com 相当于 www.baidu.com/ 。
  - path 是否区分大小写取决于服务器所在的文件系统。比如 Linux 的文件系统区分大小写，Windows 的 NTFS 文件系统不区分大小写。
- querystring ：查询字符串，用于传递一些键值对形式的参数（称为 Query Param）。
  - 其语法格式如下：
    1. 将每个键值对的内部用 = 连接，外部用 & 分隔，拼接成一个字符串。
    2. 将该字符串经过 URLencode 编码，放到 URL 的 ? 之后。例如：`HTTPS://www.baidu.com/s?ie=UTF-8&wd=hello%20world`
  - 某些浏览器、服务器限制了 URL 的最大长度（比如 1M），因此不能通过 querystring 传递较多的数据。
- fragment ：片段，以 # 开头。用于定位到资源中的某一片段。
  - querystring、fragment 都区分大小写。

## 请求方法

HTTP 1.0 定义了 GET、POST、HEAD 三种请求方法，HTTP 1.1 增加了五种请求方法。

- GET
  - ：用于请求获得（根据 URL 指定的）资源。
  - 客户端发送 GET 请求报文时，报文的第一行包含了请求的 URL 。服务器一般会将回复的内容放在响应报文的 body 中，发给客户端。

- POST
  - ：用于向（根据 URL 指定的）资源提交数据。比如上传 HTML 表单数据、上传文件。
  - 客户端发送 POST 请求报文时，通常将要提交的数据放在报文 body 中，发给服务器。服务器一般会回复一个状态码为 200 的报文，表示已成功收到。
  - GET 方法常用于只读操作，而 POST 方法常用于写操作。

- HEAD
  - ：与 GET 相似，但要求服务器不返回报文 body 。
- PUT
  - ：与 POST 相似，但常用于更新数据。
  - 常用于具有幂等性的操作。
- DELETE
- CONNECT
- TRACE
- OPTIONS

## 报文

HTTP 协议以报文为单位传输消息，分为两种：
- 请求报文：Request message ，由客户端发出。
- 响应报文：Response message ，由服务器发出。

一个 HTTP 报文的结构类似于一个文本文件，分为以下几部分：
- 请求行 / 状态行 ：报文的第一行内容，用于简单介绍该报文。
- 头部（headers）：每行声明一个 `key: value` 格式的参数，主要用于描述报文的属性。key 不区分大小写。
- 一个空行 ：用于标志头部的结束。
- 主体（body）：可以为空，也可以存放一段任意内容的数据。
  - 总而言之，客户端可以通过请求报文的 url、header、body 向服务器传递有意义的数据，不过最常用的是 body 。

### 请求报文

例：
```
GET /index.html HTTP/1.1
accept: text/html,application/xhtml+xml,application/xml
cookie: gid=1311812194.1563255462; t=1

ie=UTF-8&wd=1
```
- 请求行：由请求方法名、请求的 URL 路径（域名之后的部分）、协议版本组成。
- 多种请求头示例：
  ```sh
  Content-Encoding: gzip                     # 该报文 body 的编码
  Content-Length: 348                        # 该报文 body 的长度
  Content-Type: text/html; charset=utf-8     # 该报文 body 的类型

  Host: www.baidu.com                        # 请求的服务器域名
  Connection: keep-alive                     # 申请保持 TCP 长连接
  X-Requested-With: XMLHTTPRequest           # 说明该请求是 AJAX 异步请求
  Referer: HTTPS://www.cnblogs.com/          # 说明客户端从哪个 URL 跳转到当前 URL
  Cookie: gid=1311812194.1563255462; t=1

  User-Agent: Chrome/75.0.3770.100           # 客户端的信息
  Accept: text/html,application/xml;q=0.8    # 客户端能接受的响应 body 类型
  Accept-Charset: GB2312,utf-8;q=0.7,*;q=0.7 # 客户端能接受的响应 body 编码格式
  Accept-Language: zh-CN,zh;q=0.9            # 客户端能接受的响应 body 语言，q 表示选择这种情况的优先级，默认为 1
  Accept-Encoding: gzip, deflate             # 客户端能接受的响应 body 压缩格式

  If-Modified-Since: Fri, 5 Jun 2019 12:00:00 GMT  # 如果响应报文 body 在 Last-Modified 时刻之后并没有被修改，则请服务器返回 304 报文，让客户端使用本地缓存
  If-None-Match: 5edd15a5-e42                # 如果响应报文 body 的标签值依然为 ETag ，则请服务器返回 304 报文，让客户端使用本地缓存
  ```

### 响应报文

例：
```
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
Server: Apache/2.4.7 (Ubuntu)

<html><head><title>Index</html></head><body><h1>Hello world!</h1></body></html>
```
- 状态行：由协议版本、状态码、状态码的简单描述组成。
- 多种响应头示例：
  ```sh
  Status Code: 200 OK   # 返回的状态码
  Allow: GET, HEAD      # 服务器允许的 HTTP 请求方法
  Server: Tengine       # 服务器的名字

  Location: http://127.0.0.1/index.html         # 常用于重定向的响应报文，声明一个 URL 让客户端去访问
  Refresh: 5                                    # 让客户端 5 秒之后重新请求本页面
  Refresh: 5; url=http://127.0.0.1/index.html   # 让客户端 5 秒之后重定向到该 URL

  Date: Wed, 17 Jul 2019 10:00:00 GMT           # 服务器生成该响应报文的时刻（代理服务器不会改变该值）
  Age: 2183                                     # 表示该响应报文来自代理服务器的缓存，这是该缓存的存在时长

  Cache-Control: max-age=0                      # 缓存策略
  Expires: Wed, 17 Jul 2019 14:00:00 GMT        # 该响应的过期时刻，过期之前客户端应该使用本地缓存，过期之后再重新请求

  Last-Modified: Fri, 5 Jun 2019 12:00:00 GMT   # 该响应报文 body 最后一次修改的时刻（用于判断内容是否变化）
  ETag: 5edd15a5-e42                            # 响应 body 的标签值（用于判断内容是否变化，比 Last-Modified 更准确）
  ```

- 浏览器可以将服务器的返回的 HTML 文件缓存在本地，下次再请求该资源时就直接从本地缓存中读取数据。
  - 用 Cache-Control 和 Expires 字段都可以控制缓存，但前者的优先级更高，常见的取值如下：
    ```sh
    max-age=10  # 该缓存在 10 秒后过期，到时需要重新向服务器请求该资源
    max-age=0   # 该缓存在 0 秒后过期，相当于 no-cache
    no-cache    # 不能直接使用缓存，要先向服务器重新请求该资源，如果服务器返回 304 才可以使用缓存
    no-store    # 不进行缓存
    private     # 允许客户端缓存
    public      # 客户端和代理服务器都可以缓存
    ```

### 报文 body

报文 body 可以存储多种 MIME 类型的数据，但需要在报文头部声明其 Content-Type 。如下：

Content-Type|含义
-|-
application/x-www-form-urlencoded            | 默认格式，与 Query String 格式相同，通常用于传输 form 表单
application/json                             | JSON 格式的文本
application/javascript                       | js 代码，且会被浏览器自动执行
application/octet-stream                     | 二进制数据，通常用于传输单个文件
text/plain                                   | 纯文本
text/html                                    | HTML 格式的文本
text/javascript                              | js 代码
image/jpeg, image/png, image/gif             | 图片
multipart/form-data; boundary=----7MA4YWxkT  | 传输多个键值对，用 boundary 的值作为分隔符

## 状态码

服务器返回响应报文时，报文的第一行包含了一个状态码（Status Code），表示对请求报文的处理结果。

根据最高位数字的不同，可将状态码分为 5 类。常见的如下：
- 1××：表示服务器收到了请求，请客户端继续它的行为。
- 2××：表示服务器接受了请求。
  - 200 ：OK 。服务器已执行请求的操作。
  - 201 ：Created ，服务器已创建了请求的资源。
  - 202 ：Accepted ，服务器接受了请求，但还没有执行请求的操作。常用于异步处理。
  - 204 ：No Centent ，服务器没有返回任何内容。常用于不需要返回值的 HTTP 请求。
- 3××：表示资源重定向。
  - 301 ：Moved Permanently ，资源被永久移动位置，请客户端重新发送请求到新 URI ，并且以后的请求都这样。
    - 例：客户端访问的 URI 为 /home/login 时，服务器访问 301 响应，并在响应报文的 Headers 中声明新地址 `Location: /home/login/` ，请客户端访问它。
  - 302 ：Moved Temporarily ，资源被临时移动位置，请客户端重新发送请求到新 URI ，但以后的请求不必使用新 URI 。
  - 303 ：See Other ，资源已找到，但请客户端继续向另一个 URI 发出 GET 请求。
    - 例：当客户端向 /home/login/ 发出 POST 请求进行登录之后，服务器返回 303 报文，让客户端继续向 /home/index.html 发出 GET 请求。
  - 304 ：Not Modified ，资源并没有改变。
    - 例：当浏览器刷新网页时，一些静态文件通常使用 304 ，可以从浏览器的缓存中载入。
  - 307 ：Temporary Redirect ，临时重定向。与 302 相似，但是要求客户端在重定向之后不要改变请求方法。
    - 例：如果客户端原本发出 POST 请求，则重定向之后重新发出的请求应该依然是 POST 方法。
    - 301、302 表示客户端的请求未被服务器接受，请重新向新 URI 发出之前的请求。而 303 表示客户端的请求已被服务器接受，请继续向新 URI 发出后续请求。
      - 但大部分浏览器将 301、302 像 303 一样处理，因此后来又定义了 307 ，强调了临时重定向的规范。
    - 大部分浏览器处理 301、302 响应报文的措施：
      - 如果被重定向的是 GET、HEAD 请求，则浏览器会重新向新 URI 发出请求，沿用之前的 Query String 和 Headers 。
      - 如果被重定向的是 POST、PUT、DELETE 请求，则浏览器会重新向新 URI 发出 GET 请求，但是丢掉了之前的 POST 报文 body 。

- 4××：表示客户端出错。
  - 400 ：Bad Request ，请求报文有错误。
  - 401 ：Unauthorized ，拒绝客户端访问该资源，因为没有通过身份认证。
  - 403 ：Forbidden ，禁止客户端访问该资源，且不说明理由。
  - 404 ：Not Found ，服务器找不到该资源。
  - 405 ：Method Not Allowed ，服务器不支持这种 HTTP 请求方法。比如向 POST 接口发送 GET 请求时会报错 405 。
- 5××：表示服务器出错。
  - 500 ：Internal Server Error ，通常是因为服务器执行内部代码时出错。
  - 502 ：Bad Gateway ，通常是因为作为网关或代理的服务器，从上游服务器收到的 HTTP 响应报文出错。
  - 503 ：Service Unavailable ，请求的服务不可用。比如服务器过载时不能提供服务。
  - 504 ：Gateway Timeout ，通常是因为作为网关或代理的服务器，没有及时从上游服务器收到 HTTP 响应报文。
  - 505 ：HTTP Version Not Supported ，服务器不支持该请求报文采用的 HTTP 版本。

## Basic Auth

：HTTP 协议定义的一种简单的认证方式。
- 原理：HTTP 客户端将用户名、密码以明文方式发送给 HTTP 服务器，如果服务器认证通过则允许客户端访问，否则返回 HTTP 401 报文。
  - 例如，当用户使用 Web 浏览器访问该 HTTP 服务器时，通常会显示一个对话框，要求输入用户名、密码即可。
  - 实际上，HTTP 客户端会将 `username:password` 经过 Base64 编码之后，放在 HTTP header 中发送给 HTTP 服务器。如下：
    ```sh
    curl 127.0.0.1 -H "Authorization: Basic YWRtaW46MTIzNA=="
    ```
  - 大部分 HTTP 客户端也支持按以下格式发送用户名、密码：
    ```sh
    curl http://username:password@127.0.0.1:80
    ```
  - Basic Auth 没有通过 Cookie 记录用户登录状态，因此浏览器重启之后，用户需要重新登录。
- 优点：认证过程简单，容易实现。
- 缺点：将用户名、密码以明文方式传输，容易泄露。

## HTTPS

：安全超文本传输协议（Secure Hypertext Transfer Protocol），是基于 SSL/TLS 协议加密通信的 HTTP 协议。
- HTTP 协议采用明文传输报文，不安全，可能被泄露、篡改。而 HTTPS 协议是在加密信道中传输 HTTP 报文，很安全。
- HTTP 服务器默认支持 HTTP 协议，而启用 HTTPS 需要先完成一些麻烦的准备工作。如下：
  1. 首先，server 用 OpenSSL 生成一个 .csr 文件（用于申请证书，包含 SSL 公钥、网站所有者等信息）和一个 .key 文件（配套的 SSL 私钥）。
  2. 然后，server 将 .csr 文件提交到一个 CA(Certificate Authority ，证书授权中心)，被 CA 的私钥加密生成数字证书（.crt 文件或.pem 文件）。
  3. 最后，server 将数字证书和 .key 文件保存到服务器上，当有客户端来访问时，就将数字证书发给它。
  4. 客户端要用 CA 的公钥解密该数字证书，查看其内容。
- 单向认证：client 验证 server 的数字证书，或反之。
- 双向认证：client 和 server 互相验证对方的数字证书。

## SSL

90 年代，网景公司推出了 SSL(Secure Sockets Layer ，安全套接层)协议，用于加密 HTTP 的通信过程。
- SSL 工作在传输层与应用层之间。工作时，先基于 TCP 建立加密的通信信道，然后在该信道中传输 HTTP 报文。
- 当 SSL 更新到 3.0 版本时，演化出了更安全的 TLS（Transport Layer Security ，安全传输层）协议，但有时也统称为 SSL 。
- HTTPS 开始通信时，要先按以下步骤建立 SSL 加密信道：
  1. client 向 server 发出请求，索要 SSL 公钥。
  2. server 将自己的 SSL 公钥（通常放在数字证书中，证明它是真的、没有被篡改）回复给 client 。
  3. client 收到 SSL 公钥，用它加密一个随机数发送给 server 。
  4. server 收到加密的消息后，用自己的 SSL 私钥解密它，得到随机数。然后把该随机数回复给 client ，表示自己能解开该公钥，证明自己的身份。
     - 同时，server 随机生成一个对称加密的密钥，然后把该密钥用 SSL 公钥加密，发送给 client 。以后双方的 HTTP 通信报文都使用该密钥加密。
    - 这四次握手的通信过程是明文传输的，不怕泄露。
- OpenSSL ：一个开源的 SSL 库，提供了一些 SSL 签名算法。

