# HTTP

：超文本传输协议（Hyper Text Transfer Protocol），可以传输文本或文件，是Web服务器的核心通信协议。

特点：
- 属于应用层协议，基于TCP通信。
- 采用C/S工作模式。
  - 一般的工作流程：客户端发出一个HTTP请求报文，服务器返回一个HTTP响应报文。
- 无连接：客户端与服务器通信时不会保持连接，每次通信都要重新建立连接。
  - 每次通信时，客户端首先与服务器建立TCP连接，然后发送HTTP请求报文，等服务器返回HTTP响应报文之后就断开TCP连接。
  - HTTP1.1开始支持长连接。
- 无状态：HTTP协议不会记录通信过程中的任何信息，每次通信都是独立的。
  - 尽管如此，服务器或客户端的程序可以自己记录通信过程中的一些信息。
  - 虽然HTTP协议不会记录客户端的身份，但服务器可以通过IP地址、cookie辨认不同的客户端。

版本：
- HTTP 1.0
  - 版本较老的浏览器可能只支持HTTP 1.0。
- HTTP 1.1
  - 支持TCP长连接，允许客户端使用同一个TCP连接多次发送HTTP请求报文。
    - 长连接适用于客户端频繁发出请求的情况，节省服务器反复建立TCP连接的耗时。
    - 服务器应该要限制同时保持的长连接的最大数量。
- HTTP 2.0
  - 采用二进制格式传输报文。
  - 支持TCP连接的多路复用，即同一个TCP连接可以被多个HTTP通信共用。
  - 可以压缩报文header。
  - 支持服务器主动推送报文到客户端。

## URI

：统一资源标识符（Uniform Resource Identifier)，用于表示网络中某个资源的名称或位置。
- HTTP通信中，客户端常常通过URI定位服务器上的资源，比如图片、文件。

URI分为两种形式：
- 统一资源名称（Uniform Resource Name，URN）：用于表示资源的名称。
- 统一资源定位符（Uniform Resource Locator，URL）：用于表示资源的位置。

URL的一般格式为：`protocol://hostname:port/path/?querystring# fragment`
- protocol：采用的通信协议，比如HTTP、HTTPS、FTP。
- hostname：服务器的主机名、域名或IP地址，用于定位服务器。
  - protocol、hostname不区分大小写，但一般小写。
  - hostname填错的话就不能定位服务器，protocol、port填错的话就不能与服务器建立连接。
- port：端口号。
  - 如果省略不填，则使用当前通信协议的默认端口，比如HTTP的默认端口为80。
- path：服务器上某个资源的路径。
  - 如果省略不填，则会访问根目录 / 。比如 www.baidu.com 相当于 www.baidu.com/ 。
  - **path是否区分大小写取决于服务器所在的文件系统。比如Linux的文件系统区分大小写，Windows的NTFS文件系统不区分大小写。**
- querystring：查询字符串，传递一些键值对参数。
- fragment：片段，以 # 开头。用于定位到资源中的某一片段。
  - querystring、fragment都区分大小写。

## 报文

HTTP协议以报文为单位传输消息，分为两种：
- 请求报文：Request message，由客户端发出。
- 响应报文：Response message，由服务器发出。

每个HTTP报文由以下内容组成：
- 请求行/状态行 ：请求报文/响应报文的第一行内容。
- 头部          ：headers，包含一些键值对参数，每对参数独占一行。
- 一个空行      ：表示头部的结束。
- 主体          ：body，用于存放一段数据，可以为空。

### 请求报文

例：
```
GET /index.html HTTP/1.1
accept: text/html,application/xhtml+xml,application/xml
cookie: gid=1311812194.1563255462; t=1

ie=UTF-8&wd=1
```
- 请求行：由请求方法名、请求的URL路径（域名之后的部分）、协议版本组成。
- 更多的请求头示例：
  ```
  Content-Encoding: gzip                     # 该报文body的编码
  Content-Length: 348                        # 该报文body的长度
  Content-Type: text/html; charset=utf-8     # 该报文body的类型

  User-Agent: Chrome/75.0.3770.100           # 客户端的信息
  Accept: text/html,application/xml;q=0.8    # 客户端能接受的响应body类型
  Accept-Charset: GB2312,utf-8;q=0.7,*;q=0.7 # 客户端能接受的响应body编码格式
  Accept-Language: zh-CN,zh;q=0.9            # 客户端能接受的响应body语言，q表示选择这种情况的优先级，默认为1
  Accept-Encoding: gzip, deflate             # 客户端能接受的响应body压缩格式

  Host: www.baidu.com                        # 请求的服务器域名
  Connection: keep-alive                     # 该请求是长连接
  X-Requested-With: XMLHTTPRequest           # 该请求是AJAX异步请求
  Referer: HTTPS://www.cnblogs.com/          # 客户端从哪个URL跳转到当前URL
  Cookie: gid=1311812194.1563255462; t=1
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
- 更多的响应头示例：
  ```
  Status Code: 200 OK                    # 返回的状态码
  Allow: GET, HEAD                       # 服务器允许的HTTP请求方法
  Server: Tengine                        # 服务器的名字
  Date: Wed, 17 Jul 2019 00:59:49 GMT
  Expires: Wed, 17 Jul 2019 01:59:49 GMT # 该响应的过期时刻，在此之后不能再使用其缓存，需要重新请求
  Cache-Control: max-age=0               # 缓存类型
  ```

浏览器可以将服务器的返回的HTML文件缓存在本地，下次再请求该资源时就直接从本地缓存中读取数据。Cache-Control的常见取值如下：
- max-age=0 ：该缓存在0秒后过期，相当于no-cache。
- no-cache  ：不能直接使用缓存，要先向服务器重新请求该资源，如果服务器返回304才可以使用缓存。
- no-store  ：不进行缓存。
- private   ：允许客户端缓存。
- public    ：客户端和代理服务器都可以缓存。

### 报文body

报文body可以存储多种类型的数据。根据MIME协议进行分类，需要在headers中声明其Content-Type。如下：

Content-Type|说明
-|-
application/x-www-form-urlencoded            | 默认格式，与Query String格式相同，通常用于传输form表单
application/json                             | JSON格式的文本
application/javascript                       | js代码，且会被浏览器自动执行
application/octet-stream                     | 二进制数据，通常用于传输单个文件
text/plain                                   | 纯文本
text/html                                    | HTML格式的文本
text/javascript                              | js代码
image/jpeg、image/png、image/gif等           | 图片
multipart/form-data; boundary=----7MA4YWxkT  | 传输多个键值对，用boundary的值作为分隔符

## 请求方法

HTTP 1.0 定义了 GET、POST、HEAD 三种请求方法，HTTP 1.1 增加了五种请求方法。

- GET：用于请求获得（根据URL指定的）资源。
  - 客户端发送GET请求报文时，报文的第一行包含了请求的URL。服务器一般会将回复的内容放在响应报文的body中，发给客户端。
  - GET请求报文还可以在URL的尾部加上一些键值对参数，称为查询字符串（Query String）。做法如下：
    1. 将每个键值对的内部用 = 连接，外部用 & 分隔，合并成一个字符串。
    2. 将该字符串经过URLencode编码，放到URL的 ? 之后。
       <br>例如：`HTTPS://www.baidu.com/s?ie=UTF-8&wd=hello%20world`

- POST：用于向（根据URL指定的）资源提交数据。比如上传HTML表单数据、上传文件。
  - 客户端发送POST请求报文时，通常将要提交的数据放在报文body中，发给服务器。服务器一般会回复一个状态码为200的报文，表示已成功收到。

- HEAD：与GET相似，但要求服务器不返回报文body。
- PUT：与POST相似，但常用于更新数据。
  - 常用于具有幂等性的操作。
- DELETE
- CONNECT
- TRACE
- OPTIONS

比较GET方法与POST方法：
- GET方法通常用于只读操作，而写操作、读写操作都要用POST方法。
- 需要传递数据给服务器时，用POST方法比GET方法更好。因为：
  - GET方法只能传递键值对格式的数据。
  - 某些浏览器限制了URL的最大长度（比如1M），因此不能用GET方法传递较多的数据。

## 状态码

服务器返回响应报文时，报文的第一行包含了一个状态码（Status Code），表示对请求报文的处理结果。

根据最高位数字的不同，可将状态码分为5类。常见的如下：
- 1××：表示服务器收到了请求，请客户端继续它的行为。
- 2××：表示服务器接受了请求。
  - 200：OK。服务器已执行请求的操作。
  - 201：Created，服务器已创建了请求的资源。
  - 202：Accepted，服务器接受了请求，但还没有执行请求的操作。常用于异步处理。
  - 204：No Centent，服务器没有返回任何内容。常用于不需要返回值的HTTP请求。
- 3××：表示资源重定向。
  - 301：Moved Permanently，资源已经被永久移动，请客户端换到新的URL。
  - 302：Moved Temporarily，资源被临时移动了。
  - 304：Not Modified，资源并没有改变。比如当客户端刷新网页时，一些静态文件通常使用304，可以从客户端的缓存中载入。
- 4××：表示客户端出错。
  - 400：Bad Request，客户端请求报文的语法错误。
  - 403：Forbidden，服务器理解了该请求，但是禁止执行它。
  - 404：Not Found，服务器找不到该资源。
  - 405：Method Not Allowed，服务器不接受这种HTTP请求方法。比如向POST接口发送GET请求时会报错405。
- 5××：表示服务器出错。

## HTTPS

：安全超文本传输协议（Secure Hypertext Transfer Protocol），是基于SSL/TLS协议加密通信的HTTP协议。
- HTTP协议采用明文传输报文，不安全，可能被泄露、篡改。而HTTPS协议是在加密信道中传输HTTP报文，很安全。
- Web服务器可以直接使用HTTP协议，而使用HTTPS时需要先完成一些麻烦的准备工作。如下：
  1. 首先，server用OpenSSL生成一个 .csr 文件（用于申请证书，包含SSL公钥、网站所有者等信息）和一个 .key 文件（配套的SSL私钥）。
  2. 然后，server将 .csr 文件提交到一个CA(Certificate Authority，证书授权中心)，被CA的私钥加密生成数字证书（.crt文件或.pem文件）。
  3. 最后，server将数字证书和 .key 文件保存到服务器上，当有客户端来访问时，就将数字证书发给它。
  4. 客户端要用CA的公钥解密该数字证书，查看其内容。
- 单向认证：client验证server的数字证书，或反之。
- 双向认证：client和server互相验证对方的数字证书。

### SSL

90年代，网景公司推出了SSL(Secure Sockets Layer，安全套接层)协议，用于加密HTTP的通信过程。
- SSL工作在传输层与应用层之间。工作时，先基于TCP建立加密的通信信道，然后在该信道中传输HTTP报文。
- 当SSL更新到3.0版本时，演化出了更安全的TLS（Transport Layer Security，安全传输层）协议，但有时也统称为SSL。
- HTTPS开始通信时，要先按以下步骤建立SSL加密信道：
  1. client向server发出请求，索要SSL公钥。
  2. server将自己的SSL公钥（通常放在数字证书中，证明它是真的、没有被篡改）回复给client。
  3. client收到SSL公钥，用它加密一个随机数发送给server。
  4. server收到加密的消息后，用自己的SSL私钥解密它，得到随机数。然后把该随机数回复给client，表示自己能解开该公钥，证明自己的身份。
      <br>同时，server随机生成一个对称加密的密钥，然后把该密钥用SSL公钥加密，发送给client。以后双方的HTTP通信报文都使用该密钥加密。
    - 这四次握手的通信过程是明文传输的，不怕泄露。
- OpenSSL：一个开源的SSL库，提供了一些SSL签名算法。

## ♢ http

可以用Python自带的http模块启动一个简单的HTTP服务器：
```sh
python -m http.server
        80                 # 监听的端口（默认是8000）
        --bind 127.0.0.1   # 绑定IP（默认是0.0.0.0）
        --directory /root  # 指定网站的根目录（默认是当前目录）
```
