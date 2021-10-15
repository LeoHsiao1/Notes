# HTTP

：超文本传输协议（Hyper Text Transfer Protocol），可以传输文本或文件，是 Web 服务器的核心通信协议。

## 原理

- 属于应用层协议，基于 TCP 通信。
- 采用 C/S 架构，工作流程如下：
  1. client 访问 server 的 TCP 端口，进行 TCP 握手。
  2. client 发送 HTTP 请求报文。
  3. server 回复 HTTP 响应报文。

## 版本

- HTTP 协议存在多个版本，服务器、客户端程序不一定兼容该协议的所有版本、特性。

### HTTP/1.0

- 1996 年发布。
- 特点：无连接。
  - ：server 每次回复响应报文之后，server 和 client 就可以断开 TCP 连接。
  - 因此每次 client 发出请求报文时，都要重新建立 TCP 连接，在网络延迟较大时有明显耗时。
  - 如果在报文 Headers 中添加 `Connection: keep-alive` ，则会保持 TCP 连接，直到 server 或 client 主动断开连接。
    - 使用长连接时，可通过一个 TCP 连接先后传输多个 HTTP 报文，避免了 TCP 握手的耗时。
    - 服务器通常会限制长连接的数量、存在时间。

- 特点：无状态。
  - ：HTTP 协议不会记录通信过程中的任何信息，每次通信都是独立的。
  - 尽管如此，server 或 client 的程序可以自己记录通信过程中的一些信息。
    - 比如 server 可以通过 IP 地址、cookie 记录 client 的身份。

### HTTP/1.1

- 1997 年发布。是目前最常用的版本。
- 向下兼容 HTTP/1.0 。
- 默认启用 TCP 长连接，除非在报文 Headers 中添加 `Connection: close` 。
- 增加 PUT、DELETE 等请求方法。
- 增加 Host、Upgrade、If-Modified-Since、Cache-Control 等 Headers 。

### HTTP/2.0

- 2015 年发布。
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

URL 的一般格式为：`protocol://host:port/path/?querystring#fragment`
- protocol ：采用的通信协议，比如 HTTP、HTTPS、FTP 。
- host ：服务器主机，可以是主机名、域名或 IP 地址。
  - protocol、host 不区分大小写，但一般小写。
- port ：端口号。
  - 如果省略不填，则使用当前通信协议的默认端口。比如 HTTP 的默认端口为 80 。
  - 一个主机上可能运行了多个服务器软件，分别监听不同的端口。通过 host、port 才能定位一个唯一的服务器。
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

HTTP/1.0 定义了 GET、HEAD、POST 三种请求方法，HTTP/1.1 增加了六种请求方法。

- GET
  - ：用于请求获得（根据 URL 指定的）资源。
  - 客户端发送 GET 请求报文时，报文的第一行包含了请求的 URL 。服务器一般会将回复的内容放在响应报文的 body 中，发给客户端。
- HEAD
  - ：与 GET 相似，但要求服务器不返回报文 body 。
- POST
  - ：用于向（根据 URL 指定的）资源提交数据。比如上传 HTML 表单数据、上传文件。
  - 客户端发送 POST 请求报文时，通常将要提交的数据放在报文 body 中，发给服务器。服务器一般会回复一个状态码为 200 的报文，表示已成功收到。
  - GET 方法常用于只读操作，而 POST 方法常用于写操作。

- PUT
  - ：用于更新资源。
  - POST 偏向于上传整个资源，而 PUT 偏向于上传资源中的部分数据，覆盖原数据。
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
  - PUT 偏向于覆盖式更新，通常具有幂等性。而 PATCH 偏向于追加式更新。

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
- 请求报文的多种 Headers 示例：
  ```sh
  Content-Encoding: gzip                      # 该报文 body 的编码
  Content-Length: 348                         # 该报文 body 的长度
  Content-Type: text/html; charset=utf-8      # 该报文 body 的类型

  Host: www.baidu.com                         # 请求的服务器域名
  Connection: keep-alive                      # 表示本次 HTTP 通信之后怎么处理 TCP 连接，默认为 close 。设置成 keep-alive 则保持连接
  X-Requested-With: XMLHTTPRequest            # 说明该请求是 AJAX 异步请求
  Origin: http://test.com                     # 说明客户端从哪个网站发出 HTTP 请求
  Referer: HTTPS://test.com/                  # 说明客户端从哪个 URL 跳转到当前 URL
  Cookie: gid=1311812194.1563255462; t=1

  User-Agent: Chrome/75.0.3770.100            # 客户端的信息
  Accept: text/html,application/xml;q=0.8     # 客户端能接受的响应 body 的 Content-Type 。可以声明多个方案，用逗号分隔。q 表示选择这种方案的优先级，默认为 1
  Accept-Charset: GB2312,utf-8;q=0.7,*;q=0.7  # 客户端能接受的响应 body 编码格式
  Accept-Encoding: gzip,deflate               # 客户端能接受的响应 body 压缩格式
  Upgrade: HTTP/2.0,websocket                 # 仅 HTTP/1.1 支持该字段，表示客户端除了 HTTP/1.1 ，可切换到哪些通信协议。设置了此字段时必须设置 Connection: Upgrade

  If-Modified-Since: Fri, 5 Jun 2019 12:00:00 GMT # 如果响应报文 body 在 Last-Modified 时刻之后并没有被修改，则请服务器返回 304 报文，让客户端使用本地缓存
  If-None-Match: 5edd15a5-e42                     # 如果响应报文 body 的标签值依然为 ETag ，则请服务器返回 304 报文，让客户端使用本地缓存
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

### 状态码

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

## 相关概念

### Basic Auth

：HTTP 协议定义的一种简单的身份认证方式。
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
- 优点：过程简单，容易实现。
- 缺点：将用户名、密码以明文方式传输，容易泄露。

### REST

：表述性状态转移（Representational State Transfer）
- 一种与 HTTP 协议类似的 HTTP API 规范，大致如下：
  - 将每个资源用一个唯一的 URL 标识。
  - URL 应该是名词性的，且区分单复数。比如 /students/names 要优于 /students/getName 。
  - 主要使用 GET、POST、PUT、DELETE 四种 HTTP 方法，实现 CRUD 操作。
  - 报文 body 通常采用 JSON 格式。
  - 客户端与服务器之间采用无状态通信，所以客户端的每个请求都应该自带上下文信息。
- 符合 REST 规范的 API 称为 RESTful API 。
  - 还有其它的 API 规范，比如模仿数据库的 CRUD 操作。
- 优点：
  - 简单易懂，了解 HTTP 协议即可理解 REST 规范。
  - 服务器与客户端基本解耦。
- 缺点：
  - 操作对象不一定是一个具体的资源，不一定适合用 URL 表示。
  - 只有少数几种 HTTP 方法，不能体现某些特别的操作，比如既需要读、又需要写的操作。

### RPC

：远程过程调用（Remote Procedure Call）
- 一种 API 规范，用于在本机代码中调用其它主机上的进程的方法。
- 常用于分布式系统中，实现不同主机的进程之间的相互调用。
- RPC 与 REST 的区别：
  - 两者不是同一层级的概念。
  - 基于 TCP、UDP、HTTP 等协议都可以实现 RPC 。
  - 实现 RESTful API 只需要修改 HTTP 服务器的 API 格式 ，而实现 RPC 需要使用一个分布式框架。
- gRPC ：一个 RPC 框架，基于 HTTP/2 协议，由 Google 公司发布。
