# HTTP

：超文本传输协议（Hyper Text Transfer Protocol），可以传输文本或文件，是 Web 服务器的核心通信协议。
- 属于应用层协议，基于 TCP 通信。
- 采用 C/S 架构，工作流程如下：
  1. client 访问 server 的 TCP 端口，建立 TCP 连接。
  2. client 发送 HTTP 请求报文。
  3. server 回复 HTTP 响应报文。

## URI

：统一资源标识符（Uniform Resource Identifier)，用于表示网络中某个资源的名称或位置。
- 资源可以是实际存在的图片、文本文件，也可以是提供某种服务的 API 。
- HTTP 通信中，客户端通常通过 URI 定位服务器上的资源。
- URI 分为两种形式：
  - 统一资源名称（Uniform Resource Name ，URN）：用于表示资源的名称。
  - 统一资源定位符（Uniform Resource Locator ，URL）：用于表示资源的位置。

### URL

URL 的一般格式为：`protocol://host:port/path/?querystring#fragment`
- protocol
  - ：采用的通信协议，比如 HTTP、HTTPS、FTP 。
- host
  - ：服务器主机，可以是主机名或 IP 地址。
  - protocol、host 不区分大小写，但一般小写。
- port
  - ：端口号。
  - 如果省略不填，则使用当前通信协议的默认端口。比如 HTTP 的默认端口为 80 。
  - 一个主机上可能运行了多个服务器软件，分别监听不同的端口。通过 host、port 才能定位一个唯一的服务器。
- path
  - ：服务器上某个资源的路径。
  - 如果省略不填，则会访问根目录 / 。比如 www.baidu.com 相当于 www.baidu.com/ 。
  - path 是否区分大小写，取决于服务器是否支持。比如 Linux 的文件系统区分大小写，因此运行的 HTTP 服务器默认区分大小写。而 Windows 的 NTFS 文件系统不区分大小写。
- querystring
  - ：查询字符串，用于传递一些键值对形式的参数（称为 Query Param）。
  - 其语法格式如下：
    1. 将每个键值对的内部用 = 连接，外部用 & 分隔，拼接成一个字符串。
    2. 将该字符串经过 URLencode 编码，放到 URL 的 ? 之后。例如：`HTTPS://www.baidu.com/s?ie=UTF-8&wd=hello%20world`
  - 某些浏览器、服务器限制了 URL 的最大长度（比如 1M），因此不能通过 querystring 传递较多的数据。
- fragment
  - ：片段，以 # 开头。用于定位到资源中的某一片段。
  - querystring、fragment 都区分大小写。

## 请求方法

HTTP/1.0 定义了 GET、HEAD、POST 三种请求方法，HTTP/1.1 增加了六种请求方法。

- GET
  - ：用于请求获得（根据 URL 指定的）资源。
  - 客户端发送 GET 请求报文时，报文的第一行包含了请求的 URL 。服务器一般会将回复的内容放在响应报文的 body 中，发给客户端。
- HEAD
  - ：与 GET 相似，但要求服务器不返回报文 body 。
- POST
  - ：用于向（根据 URL 指定的）资源提交数据。比如上传 HTML 表单数据、上传文件。
  - 客户端发送 POST 请求报文时，通常将要提交的数据放在请求报文 body 中，发给服务器。服务器一般会回复一个状态码为 200 的报文，表示已成功收到。
  - GET 偏向于只读操作，请求报文 body 为空，而 POST 偏向于写操作。

- PUT
  - ：用于向（根据 URL 指定的）资源更新数据。
  - POST 偏向于新增资源，而 PUT 偏向于修改资源，用新数据覆盖原数据，通常具有幂等性。
- DELETE
  - ：用于删除资源。
- CONNECT
  - ：用于与代理服务器建立连接。
- OPTIONS
  - ：用于询问指定的 URL 允许使用哪些请求方法。
  - 服务器可以在响应报文中加入 `Allow: GET, HEAD` 形式的 Header ，作为答复。
- TRACE
  - ：用于测试网络连通性。
  - 要求服务器将 request body 作为 response body 。
- PATCH
  - ：用于给资源添加数据。
  - PUT 偏向于覆盖式更新，而 PATCH 偏向于追加式更新。

## 报文

HTTP 协议以报文为单位传输消息，分为两种：
- 请求报文：Request message ，由客户端发出。
- 响应报文：Response message ，由服务器发出。

一个 HTTP 报文的结构类似于一个文本文件，从上到下分为以下几部分：
- 请求行 / 状态行
  - ：报文的第一行内容，用于简单介绍该报文。
- 头部（headers）
  - ：每行声明一个 `header: value` 格式的参数，用于描述报文的属性。
  - header 名称由 ASCII 字符组成，不区分大小写。
  - HTTP 协议有一些规范用途的 header ，用户也可以自定义 header 。
- 一个空行
  - ：用于标志头部的结束。
- 主体（body）
  - ：可以为空，也可以存放一段任意内容的数据。
  - HTTP 报文的 url、header、body 都可以用于传递有意义的数据，不过 body 适合承载大量数据。

### 请求报文

例：
```
GET /index.html HTTP/1.1
accept: text/html,application/xhtml+xml,application/xml
cookie: gid=1311812194.1563255462; t=1

ie=UTF-8&wd=1
```
- 请求行：由请求方法名、请求的 URI 路径（域名之后的字符串）、协议版本组成。
- 请求报文的多种 Headers 示例：
  ```sh
  Content-Encoding: gzip                      # 该报文 body 的编码
  Content-Length: 348                         # 该报文 body 的长度
  Content-Type: text/html; charset=utf-8      # 该报文 body 的类型

  Host: www.baidu.com                         # 请求的服务器地址，可以包含端口号
  Connection: keep-alive                      # 表示本次 HTTP 通信之后怎么处理 TCP 连接，默认为 close 。设置成 keep-alive 则保持连接
  X-Requested-With: XMLHTTPRequest            # 说明该请求是 AJAX 异步请求
  Origin: http://test.com                     # 说明客户端从哪个网站发出 HTTP 请求
  Referer: HTTPS://test.com/                  # 说明客户端从哪个 URL 跳转到当前 URL
  Cookie: gid=1311812194.1563255462; t=1

  User-Agent: Chrome/75.0.3770.100            # 客户端的信息
  Accept: text/html,application/xml;q=0.8     # 客户端能接受的响应 body 的 Content-Type 。可以声明多个方案，用逗号分隔。q 表示选择这种方案的优先级，默认为 1
  Accept-Charset: GB2312,utf-8;q=0.7,*;q=0.7  # 客户端能接受的响应 body 编码格式
  Accept-Encoding: gzip,deflate               # 客户端能接受的响应 body 压缩格式
  Upgrade: websocket                          # 仅 HTTP/1.1 支持该字段，表示客户端请求切换到其它通信协议。设置此字段时，必须同时设置 Connection: Upgrade
  ```

### 响应报文

例：
```
HTTP/1.1 200 OK
Server: nginx/1.20.1
Content-Type: text/html; charset=utf-8

<html><head><title>Index</html></head><body><h1>Hello world!</h1></body></html>
```
- 状态行：由协议版本、状态码、状态码的简单描述组成。
- 响应报文的多种 Headers 示例：
  ```sh
  Status Code: 200 OK   # 返回的状态码
  Allow: GET, HEAD      # 服务器允许的 HTTP 请求方法
  Server: Tengine       # 服务器的名字

  Location: http://127.0.0.1/index.html         # 常用于重定向的响应报文，声明一个 URL 让客户端去访问
  Refresh: 5                                    # 让客户端 5 秒之后重新请求本页面
  Refresh: 5; url=http://127.0.0.1/index.html   # 让客户端 5 秒之后重定向到该 URL

  Date: Wed, 17 Jul 2019 10:00:00 GMT           # 服务器生成该响应报文的时刻（代理服务器不会改变该值）
  Age: 2183                                     # 表示该响应报文来自代理服务器的缓存，这是该缓存的存在时长
  ```

### 状态码

服务器返回响应报文时，报文的第一行包含了一个状态码（Status Code），表示对请求报文的处理结果。

根据最高位数字的不同，可将状态码分为 5 类。常见的如下：
- 1××：表示服务器收到了请求，请客户端继续它的行为。
  - 101 ：Switching Protocol 。客户端可在 HTTP 请求头中加入 Upgrade 字段，表示请求切换协议。而服务器可返回 HTTP 101 响应，表示同意切换协议。
- 2××：表示服务器接受了请求。
  - 200 ：OK 。服务器已执行请求的操作。
  - 201 ：Created ，服务器已创建了请求的资源。
  - 202 ：Accepted ，服务器接受了请求，但还没有执行请求的操作。常用于异步处理。
  - 204 ：No Centent ，服务器没有返回任何内容。常用于不需要返回值的 HTTP 请求。
- 3××：表示资源重定向。
  - 301 ：Moved Permanently ，资源被永久移动位置，请客户端重新发送请求到新 URI ，并且以后的请求都这样。
    - 例：客户端访问的 URI 为 /home/login 时，服务器访问 301 响应，并在响应报文的 Headers 中声明新地址 `Location: /home/login/` ，请客户端访问它。
    - 浏览器会自动处理重定向请求，访问新 URI 。
  - 302 ：Moved Temporarily ，资源被临时移动位置，请客户端重新发送请求到新 URI ，但以后的请求不必使用新 URI 。
  - 303 ：See Other ，资源已找到，但请客户端继续向另一个 URI 发出 GET 请求。
    - 例：当客户端向 /home/login/ 发出 POST 请求进行登录之后，服务器返回 303 报文，让客户端继续向 /home/index.html 发出 GET 请求。
  - 304 ：Not Modified ，资源并没有改变。
    - 例：当浏览器刷新网页时，一些静态文件通常使用 304 ，可以从浏览器的缓存中载入。
  - 307 ：Temporary Redirect ，临时重定向。与 302 相似，但要求客户端在重定向之后不要改变请求方法。
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
  - 499 ：Client Closed Request 。这不是 HTTP/1 定义的标准状态码，主要被 Nginx 使用，表示服务器返回响应报文时，发现客户端已经关闭了连接。
- 5××：表示服务器出错。
  - 500 ：Internal Server Error ，通常是因为服务器执行内部代码时出错。
  - 502 ：Bad Gateway ，通常是因为作为网关或代理的服务器，从上游服务器收到的 HTTP 响应报文出错。
  - 503 ：Service Unavailable ，请求的服务不可用。比如服务器过载时不能提供服务。
  - 504 ：Gateway Timeout ，通常是因为作为网关或代理的服务器，没有及时从上游服务器收到 HTTP 响应报文。
  - 505 ：HTTP Version Not Supported ，服务器不支持该请求报文采用的 HTTP 版本。

### Content-Type

- 报文 Headers 中的 Content-Type 用于声明报文 body 的数据类型，便于解析报文 body 。常见的几种 MIME 类型如下：

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

- 可以在 Content-Type 中同时声明 MIME 类型和编码格式，用分号分隔，例如：`Content-Type: text/html; charset=utf-8`

### 缓存

- 客户端每次发出 HTTP 请求之后，需要等待几秒时间，才能收到 HTTP 响应。这是 Web 服务的主要耗时。
  - 为了缩短耗时，客户端可以缓存一些 HTTP 请求对应的响应内容（比如响应是一个图片文件），如果之后出现相同的 HTTP 请求，则不必实际发送该 HTTP 请求，而是复用响应内容。
  - 基础的 HTTP 客户端（比如 curl 命令）没有缓存功能，而 Web 浏览器通常会自动缓存响应报文，并自动清理。
- Web 浏览器有多种缓存位置，优先级从高到低如下：
  - Service Worker ：允许通过 JS 拦截当前网页发出的所有请求，可以控制缓存，甚至自己编写响应内容。
  - Memory Cache ：容量小，访问速度快，关闭浏览器时会丢失缓存。
  - Disk Cache ：容量大，访问速度慢，允许同一个缓存文件被不同网站使用。

- 服务器可以在响应报文加入以下 Header ，让客户端自行判断是否使用缓存：
  ```sh
  Expires: Wed, 17 Jul 2019 14:00:00 GMT    # 该响应的过期时刻，采用 GMT 时区。过期之前建议客户端使用本地缓存，过期之后再重新请求
  Cache-Control: max-age=0                  # 缓存策略
  ```
  - Cache-Control 的取值示例：
    ```sh
    max-age=10      # 该缓存在 10 秒后过期。缓存过期后，需要重新向服务器请求该资源，但如果不能连接服务器，则依然使用缓存
    max-age=0       # 该缓存在 0 秒后过期
    must-revalidate # 缓存过期后，必须重新向服务器请求该资源
    no-cache        # 不能直接使用缓存，要先向服务器重新请求该资源，如果服务器返回 304 才使用缓存。相当于 max-age=0,must-revalidate
    no-store        # 不保存缓存
    private         # 默认值，只能在客户端缓存，不能在代理服务器缓存
    public          # 客户端和代理服务器都可以缓存
    ```
  - 例如浏览器访问一个网页时：
    - 如果按 F5 刷新，则重新发出请求，根据 Header 控制缓存。
    - 如果按 Ctrl+F5 强制刷新，则重新发出请求，且声明 `Cache-control: no-cache` 。
    - 如果通过前进、后退切换网页，则不会重新发出请求，不会检查响应是否过期。

- 服务器可以在响应报文加入以下 Header ，让客户端与服务器协商是否使用缓存：
  ```sh
  Last-Modified: Fri, 5 Jun 2019 12:00:00 GMT     # 该响应 body 最后一次修改的时刻
  ETag: 5edd15a5-e42                              # 该响应 body 的标签值，比如哈希值
  ```
  客户端需要在请求报文加入以下 Header ：
  ```sh
  If-Modified-Since: Fri, 5 Jun 2019 12:00:00 GMT # 如果响应 body 在 Last-Modified 时刻之后并没有被修改，则请服务器返回 304 响应，让客户端使用本地缓存
  If-None-Match: 5edd15a5-e42                     # 如果响应 body 的 Etag 值等于它，则请服务器返回 304 响应，让客户端使用本地缓存
  ```

- 允许在响应报文中同时声明多种缓存字段：
  - HTTP/1.0 可以用 Expires、Last-Modified 字段控制缓存，而 HTTP/1.1 增加了 Cache-Control、Etag 字段，功能更多、优先级更高。
  - 强缓存：比如 Expires、Cache-Control 两种缓存方式，不会发出请求。例如 Chrome 浏览器会为该请求显示预配的请求头（Provisional headers），和缓存的响应头、状态码。
  - 协商缓存：比如 Etag、Last-Modified 两种缓存方式，依然有通信耗时，只是减少了响应 body 。
  - 启发式缓存：如果响应报文中没有声明缓存字段，则浏览器默认设置响应的缓存时长为 `(Now - Last-Modified)*10%` ，这属于强缓存。

## 版本

- Tim Berners-Lee 发明 Web 服务时，设计了简单的 HTTP 协议。后来由互联网工程任务组（IETF）负责制定 HTTP 协议的标准。
- HTTP 协议存在多个版本，服务器、客户端程序不一定兼容所有版本的特性。

### HTTP/1.0

- 于 1996 年由 IETF 发布。

- 特点：无连接。
  - client 访问 server 时，需要先建立 TCP 连接，再发送 HTTP 请求报文。而 server 发送响应报文之后，就会主动关闭该 TCP 连接。
    - 因此每次 HTTP 通信之后，不会长时间保持 TCP 连接，称为无连接。
  - 缺点：
    - client 多次发送 HTTP 请求时，需要多次建立 TCP 连接，耗时较大。
    - server 因为主动关闭 TCP 连接，会产生大量 TIME-WAIT 状态的 Socket ，浪费内存。
  - 建议进行以下配置，启用 TCP 长连接，使得 client 可复用同一个 TCP 连接，传输多个 HTTP 请求报文、响应报文，性能更好。
    - 修改 server 的配置，允许 TCP 长连接。
    - 让 client 在 HTTP 请求报文 Headers 中加入 `Connection: keep-alive` ，申请保持 TCP 长连接。

- 特点：无状态。
  - HTTP 协议不会记录通信过程中的任何信息，每次 HTTP 通信都是独立的。
  - 尽管如此，server 或 client 的程序可以自己记录通信过程中的一些信息。比如 server 可以记录 client 的 IP、cookie 。

- 缺点：
  - client 每发送一个 HTTP 请求，就要与 server 建立一个新的 TCP 连接，增加了耗时、Socket 数量。

### HTTP/1.1

- 于 1997 年由 IETF 发布，向下兼容 HTTP/1.0 。
- 优点：
  - 默认启用 TCP 长连接，除非在请求报文 Headers 中加入 `Connection: close` 。这样弥补了 HTTP/1.0 的主要缺点，不必建立大量 TCP 连接。
  - 增加了 PUT、DELETE 等请求方法。
  - 增加了 Host、Upgrade、Cache-Control 等 Headers 。

- 缺点：
  - HTTP/1.1 虽然支持 TCP 长连接，但通过同一个 TCP 连接发送多个 HTTP 请求时，只能串行发送。
    - 等发送完一个 HTTP 请求并收到 HTTP 响应，才能发送下一个 HTTP 请求。
    - 总耗时可能还不如 HTTP/1.0 建立多个 TCP 连接，分别发送 HTTP 请求。

### HTTP/2

- 相关历史：
  - 2009 年，Google 公司发布了一个网络协议 SPDY ，旨在替代 HTTP/1.1 ，通过压缩 headers、TCP 多路复用来减少耗时。
  - 2012 年，Google 等公司讨论了 HTTP/2 的草案，它源自 SPDY 协议。而 SPDY 协议停止研发。
  - 2015 年，IETF 发布 [RFC 7540](https://datatracker.ietf.org/doc/html/rfc7540) 规范，定义了 HTTP/2 协议，它不兼容 HTTP/1 。

- 如何启用？
  - 目前 Nginx 等大部分 Web 服务器，默认采用 HTTP/1 。需要添加额外的配置参数，才能启用 HTTP/2 。
  - 目前 Chrome 等大部分 Web 浏览器，会自动协商 HTTP 协议的版本。
    - client 连接到 server 时，如果 URL 的协议头为 http:// ，则采用 HTTP/1 。
    - client 连接到 server 时，如果 URL 的协议头为 https:// ，则在 TLS 握手时发送 ALPN 信息，协商双方采用 HTTP 协议的哪个版本，优先采用最高版本。
    - HTTP/2 协议规范中，可使用 TLS 加密，也可不使用。但大部分 Web 浏览器强制要求在 TLS 加密的基础上进行 HTTP/2 通信，使得 HTTP/2 的 URL 协议头总是 https:// 。
    - ALPN（Application-Layer Protocol Negotiation，应用层协议协商）是 TLS 协议的一个扩展，用于协商 client 与 server 在应用层采用什么协议。可执行命令 `curl -v $server` 查看 SSL 握手过程中的 ALPN 信息。
    - 另一种方案：client 先采用 HTTP/1.1 协议与 server 通信，然后在请求报文头部添加字段 `Connection: Upgrade; Upgrade: HTTP/2.0` ，请求切换到 HTTP/2 ，但这样会产生 1 RTT 的耗时。

- 修改了 HTTP 报文的传输格式：
  - 以二进制格式传输 HTTP 报文，而不是 HTTP/1 的纯文本。
    - 采用 HPACK 算法压缩报文 headers ，大幅减小其体积。
    - 每个 HTTP 报文分成多个二进制帧（Frame），然后通过 TCP 协议传输。
  - 所有 header 采用小写字母。
  - 将 HTTP/1 报文开头的请求行、状态行拆分成几个伪标头（Pseudo Header），例如：
    ```sh
    # 拆分自请求行 GET /index.html HTTP/1.1
    :authority: test.com
    :method: GET
    :path: /index.html
    :scheme: https

    # 拆分自响应行 HTTP/1.1 200 OK
    :status: 200
    ```
    - 伪标头以冒号 : 作为前缀，且位于普通标头之前。
    - 伪标头省略了 HTTP 版本号。
    - 请求报文必须包含 `:method`、`:path`、`:scheme` 三个伪标头，除非是 CONNECT 请求。
      - 如果请求报文不包含 `:authority` 伪标头，则服务器会读取 Host 标头。
    - 响应报文必须包含 `:status` 伪标头。

- 支持 TCP 多路复用（multiplexing）：可通过同一个 TCP 连接，并行传输多个指向同一个域名的 HTTP 请求报文。
  - HTTP/1.1 开启 TCP 长连接时，客户端可以在同一个 TCP 连接中发送多个请求报文，但只能串行传输。否则并行传输多个请求报文时，不能区分发出的 TCP 包属于哪个请求报文。
    - 假设客户端先后发出 a、b、c 三个请求报文，如果某个请求报文没传输完，则之后的请求报文都不能开始传输。该问题称为队头堵塞（Head-of-line blocking）。同理，服务器也只能按 a、b、c 的顺序回复响应报文。
  - HTTP/2 的每个 HTTP 报文会分成多个 Frame ，这些 Frame 包含同样的 Stream ID ，标识它们属于同一个 HTTP 报文、同一个通信流（Stream）。
    - 因此客户端可以并行发送多个请求报文，服务器可以并行发送多个响应报文，实现时分多路复用，大幅提高通信效率。
  - 因为 TCP 多路复用，HTTP/2 与 HTTP/1.1 相比，存在以下优点：
    - 不必多次创建 TCP 连接，减少了耗时、Socket 数量。
    - 共用一个 TCP 连接时，因为 TCP 慢启动，能提高传输速度。
  - 不过 HTTP/2 不能保证总是并行传输，可能降级为串行传输。
    - 每个 TCP 连接只能传输一个通信流，可以同时发送多个 TCP 包，但所有 TCP 包必须按顺序被接收。
    - 假设同时发送多个 HTTP 请求报文，封装为多个 TCP 包之后发送。如果某个 TCP 包未被接收，则之后所有 TCP 包都不能被接收，处于阻塞等待状态。
    - 综上，HTTP/2 解决了 HTTP 应用层的队头阻塞，但没有解决 TCP 传输层的队头阻塞。
    - 当丢包率较高时，HTTP/2 完成多个 HTTP 请求的总耗时，可能还不如 HTTP/1.0 建立多个 TCP 连接，分别发送 HTTP 请求。

- 支持服务器主动推送多个响应报文给浏览器，该操作称为 Server Push 。
  - 采用 HTTP/1 时，浏览器访问网页的一般流程：
    1. 浏览器发送一个 HTTP 请求。
    2. 服务器返回一个 HTTP 响应，包含一个 HTML 文件。
    3. 浏览器解析 HTML 文件，发现其中依赖的 CSS 等资源，于是再发出多个 HTTP 请求。
  - 采用 HTTP/2 且启用 Server Push 时，流程变成：
    1. 浏览器发送一个 HTTP 请求。
    2. 服务器返回一个 HTTP 响应，包含一个 HTML 文件。并且预测到浏览器还需要 CSS 等资源，于是主动推送多个响应报文，将这些资源发给浏览器。
        - HTML 的响应报文，与其它响应报文，会同时发给浏览器。
        - 服务器会在 HTML 的响应报文中，添加一些 Headers ，声明哪些资源可以预加载（preload）。例如：
          ```sh
          Link: </css/styles.css>; rel=preload; as=style
          Link: </img/logo.jpg>; rel=preload; as=image
          ```
          浏览器看到 Link 报文头，就知道从 preload 缓存中获取这些资源，不必发出 HTTP 请求。
        - Nginx 服务器的配置示例：
          ```sh
          server {
              listen 443 ssl http2;
              root /var/www/html;
              location = /index.html {
                  # 如果浏览器请求 index.html ，则主动推送以下资源
                  http2_push /style.css;
                  http2_push /logo.jpg;
              }
          }
          ```
  - 优点：
    - 减少浏览器发出的 HTTP 请求数。
    - 浏览器在解析 HTML 之前就得到了 CSS 等资源，使网页的加载耗时减少至少 1 RTT 。
  - 缺点：
    - 可能造成负优化效果。服务器主动推送的资源，浏览器可能并不需要，或者浏览器之前已获取并缓存了，造成无用的网络传输。
    - 目前 Server Push 技术没有普及。2022 年，Chrome 浏览器从 v106 版本开始默认禁用 Server Push 功能。

### HTTP/3

- 相关历史：
  - 2012 年，Google 公司提出了一个新的传输层协议 QUIC ，全称为 Quick UDP Internet Connections ，发音相当于英文单词 quick 。它旨在替代 TCP 协议，从而改善 HTTP 协议的传输效率。
  - 2018 年，IETF 决定将基于 QUIC 协议传输的 HTTP 协议，称为 HTTP/3 。
  - 2021 年，IETF 发布 [RFC 9000](https://datatracker.ietf.org/doc/html/rfc9000) 规范，定义了 QUIC 协议。
  - 2022 年，IETF 发布 [RFC 9114](https://datatracker.ietf.org/doc/html/rfc9114) 规范，定义了 HTTP/3 协议，它不兼容 HTTP/2 。
  - 2023 年，Nginx 发布 v1.25 版本，开始支持 QUIC 和 HTTP/3 协议。

- 如何启用？
  - 目前 Nginx 等大部分 Web 服务器，默认采用 HTTP/1 。需要添加额外的配置参数，才能启用 HTTP/3 。
  - 目前 Chrome 浏览器会自动协商 HTTP 协议的版本。流程如下：
    1. client 先采用 HTTP/1 或 HTTP/2 协议发送 HTTP 请求给 server 。
    2. 如果 server 支持 HTTP/3 协议，则在 HTTP 响应报文头部添加 alt-svc 字段，例如 `alt-svc 'h3=":443"; ma=2592000; persist=1` 。
        - alt-svc 是 Alternative Services 的缩写，表示 server 存在其它访问地址（比如其它协议、其它域名、其它端口），可供 client 访问。
        - 例如 `alt-svc 'h2="test.com:443";` 表示可访问 HTTP/2 协议的指定地址。
        - ma 是 max-age 的缩写，表示该 alt-svc 的有效时长，单位为秒。如果 alt-svc 过期，则 client 不应该再访问它。如果不配置 max-age ，则默认为 24h 。
        - persist=1 表示当网络变化时，该 alt-svc 依然有效，不必被 client 删除。
    3. client 访问 server 的 alt-svc 地址。如果连接失败，则继续访问 server 的旧地址。
        - 因此，HTTP/3 连接失败时，会自动降级到 HTTP/2 。

- HTTP/3 采用的传输层协议从 TCP 改为 QUIC 。
  - 采用 HTTP/2 时，程序在应用层发出的 HTTP 报文，会依次经过多层网络协议封包：HTTP -> TLS -> TCP -> IP -> 以太网帧 ，最后从网卡发出。
  - 采用 HTTP/3 时，HTTP 报文会依次经过这些网络协议封包：HTTP -> QUIC -> UDP -> IP -> 以太网帧。
    - QUIC 协议内置了 TLSv1.3 协议，从而可以在 QUIC 握手的同时进行 TLS 握手。
    - QUIC 协议是基于 UDP 协议进行通信。因为目前的计算机设备通常只支持 TCP、UDP 两种传输层协议，研发一个全新的传输层协议的话，还需要时间推广。

- 因为 QUIC 协议，HTTP/3 具有以下优点：
  - 通信安全
    - QUIC 数据包的 payload 和大部分 headers 会加密传输，不允许明文通信，因此不会泄露隐私、被篡改。

  - 传输可靠
    - 虽然 QUIC 基于 UDP 通信，但像 TCP 一样面向连接，实现了顺序控制、差错控制、流量控制、拥塞控制等功能。而且参考 TCP 几十年的实践经验，做了一些优化。
    - QUIC 通信时，会基于 UDP 通信，在两个主机之间建立 QUIC 连接。
      - QUIC 协议会将每个 QUIC 数据包封装成一个 UDP 报文然后发送。而 UDP 协议只管发送 UDP 报文，不会考虑 QUIC 。
      - 建立多个 QUIC 连接时，依然只使用一个 UDP 端口，只是在逻辑上对所有 QUIC 数据包进行分组。与之相比，建立多个 TCP 连接时，需要使用多个 TCP 端口。
      - 每个 QUIC 数据包的 headers 中有个 connection id 字段，声明该 QUIC 数据包属于哪个 QUIC 连接。
    - 每个 QUIC 连接的用法像一个 TCP 连接。
      - 每个 QUIC 连接可以按顺序传输一组 QUIC 数据包，称为一个通信流（stream）。比如将一个 HTTP 报文封装成多个 QUIC 数据包，作为一个 stream ，按顺序传输。
      - 每个 QUIC 连接独立工作。任一 QUIC 连接发生丢包时，会自动重传，不会影响其它 QUIC 连接。

  - 避免队头阻塞
    - HTTP/3 每传输一个 HTTP 报文，就会视作一个 stream ，创建一个专用的 QUIC 连接来传输。使用多个 QUIC 连接，就可以并发传输多个 HTTP 报文。
    - 因此，HTTP/2 解决了 HTTP 应用层的队头阻塞，但没有解决 TCP 传输层的队头阻塞。而 HTTP/3 把传输层的队头阻塞也解决了，实现了稳定的并行通信。
    - 缺点：QUIC 并行传输多个 HTTP 报文时不能控制先后顺序，导致一些重要性低、体积大的 HTTP 报文可能抢占网络带宽。
      - 对策：在 HTML 文件中声明不同资源的优先级，让浏览器优先对重要的资源发出 HTTP 请求。对于不重要的资源，浏览器暂时不会发出 HTTP 请求，因此不会抢占网络带宽。例如：
        ```html
        <script src="/assets/js/test.js" fetchpriority="high"></script>
        <img src="test.jpg" fetchpriority="low">
        ```

  - 首次建立连接的耗时更短
    - 采用 HTTP/2 时，client 需要与 server 先进行 TCP 握手（耗时为 1 RTT），再进行 TLSv1.3 握手（耗时为 1 RTT），总耗时为 2 RTT ，然后才能开始发送 HTTP 请求。
    - 采用 HTTP/3 时，client 可以与 server 同时进行 QUIC 握手和 TLSv1.3 握手，总耗时为 1 RTT 。流程如下：
      1. client 向 server 发送 Client Hello 消息，包含 QUIC 握手信息、TLSv1.3 握手信息。
      2. server 回复 Server Hello 消息，包含握手信息、server 的数字证书。同时发送 Finished 消息。
      3. client 发送 Finished 消息，表示握手成功。同时开始发送加密的 HTTP 请求报文。

  - 重复建立连接的耗时为 0
    - 采用 HTTP/2 时，如果 client 重新连接 server ，即使启用 TLSv1.3 0-RTT 功能，依然要重新 TCP 握手，总耗时为 1 RTT 。
    - 采用 HTTP/3 时，如果 client 重新连接 server ，则不必重新 QUIC 握手，总耗时为 0 RTT。不过，依然需要在应用层采用措施，防御 0-RTT 重放攻击。

  - 当网络变化时，支持连接迁移（Connection Migration），避免重新建立连接
    - TCP 通信时，会根据五元组 protocol、src_addr、src_port、dst_addr、dst_port 创建 Socket 。如果服务器、客户端的 IP、端口变化，则需要重新创建 Socket ，重新建立 TCP 连接。
    - QUIC 使用 connection id 标识每个 QUIC 连接，因此当 client 的 ip、port 变化时（比如切换 wifi ），可以继续使用之前的 QUIC 连接（比如从之前的进度继续下载文件）。
    - 不过，有的 server 运行了多个实例，用网关反向代理。 client 多次发出的 HTTP 请求，不一定会到达同一个 client 实例，导致不支持 0-RTT 握手、连接迁移。

- 其它特点：
  - HTTP/2 采用 HPACK 算法，在 TCP 数据包中压缩 HTTP headers 。HTTP/3 不能采用为 TCP 设计的 HPACK 算法，而是采用 QPACK 算法，在 QUIC 数据包中压缩 HTTP headers 。
  - QUIC 协议运行在 Linux 用户空间，而不是内核空间。
    - 优点：减少了与内核的耦合，使得 QUIC 协议的功能更灵活、更容易版本升级。
    - 缺点：增加了 CPU 负载，因为需要更多地 CPU 上下文切换、在内核空间与用户空间之间拷贝数据。

- 缺点：
  - 尚未推广使用，软件生态尚未成熟。
  - 一些路由器、防火墙会限制 UDP 流量的带宽。因为以往只有 DNS 请求会产生少量 UDP 流量，出现大量 UDP 流量时会被怀疑是 DoS 攻击。
