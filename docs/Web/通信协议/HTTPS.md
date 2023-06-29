# HTTPS

：安全超文本传输协议（Secure Hypertext Transfer Protocol）。
- HTTP 协议是明文通信，因此可能泄露隐私、被篡改。而 HTTPS 协议是基于 SSL/TLS 协议加密通信，很安全。

## 原理

- 工作流程：
  1. client 访问 server 的 TCP 端口，建立 TCP 连接。
  2. client 与 server 进行 SSL 握手，建立加密的通信信道。
  3. client 发送 HTTP 请求报文。
  4. server 回复 HTTP 响应报文。
- 一般的 Web 服务器都支持 HTTP 协议，而启用 HTTPS 需要进行一些准备工作：
  1. 生成一对 SSL 私钥和公钥。
  2. 将 SSL 公钥 提交到 CA ，申请数字证书。
  3. 将数字证书和私钥文件保存到 server 上，用于 SSL 握手。

## SSL

- 90 年代，网景公司发布了 SSL（Secure Sockets Layer ，安全套接字层）协议，用于加密传输 HTTP 报文。
  - SSL 工作在传输层与应用层之间，将应用层报文加密之后再通过传输层传输。
  - 不止是 HTTP 协议，应用层一般协议的报文都可以使用 SSL 加密传输。
  - SSLv1 版本未公开发布，在发布了 SSLv2、SSLv3 版本之后，出现了更安全的 TLS（Transport Layer Security ，安全传输层）协议，有时也统称为 SSL 协议。
    - 目前建议使用 TLSv1.2 或 TLSv1.3 协议，弃用存在一些已知漏洞的 SSLv2、SSLv3、TLSv1.0、TLSv1.1 协议。

- 因为启用 SSL ，HTTPS 比 HTTP 多了安全性，但有以下缺点：
  - 每次建立 SSL 连接，需要传输一次 SSL 证书文件，体积大概为 4KB 。
    - 假设每秒建立 100 次 SSL 连接，则累计流量为 100*4/1024≈0.4MB ，占用 3.2Mbps 的网络带宽。
    - 传输 SSL 证书文件时不应该压缩，因为存在一些已知漏洞。
    - Nginx 支持让客户端在一段时间内复用 SSL 会话，不必重复 SSL 握手。
    - 有的浏览器会缓存网站的 SSL 证书，直到用户关闭该网页。
  - 建立 SSL 连接有一定耗时，因此增加了客户端发出 HTTP 请求之后，收到 HTTP 响应的延迟。
    - TLSv1.3 的握手流程比 TLSv1.2 简化，因此耗时更短。
  - 每次传输 HTTP 报文时需要加密、解密，略微增加了 CPU 负载和耗时。

### TLSv1.2

- 2008 年发布。
- 握手流程：
  1. client 发送 Client Hello 消息，包含支持的 TLS 版本、加密算法（ciphers）、一个临时生成的随机数。
  2. server 回复 Server Hello 消息，包含采纳的 TLS 版本、加密算法、一个临时生成的随机数。
      - 再发送 Server Key Exchange 消息，包含 server 的 SSL 公钥。
      - 再发送 Certificate 消息，包含由 CA 颁发的数字证书，用于证明身份。
      - 可选发送 CertificateRequest 消息，索要 client 的数字证书，实现双向认证。
      - 最后发送 Server Hello Done 消息，表示 Hello 阶段的消息已发送完。
  3. client 收到 server 的数字证书，验证其身份。
      - 再生成一个随机字符串，称为 premaster secret 。用 SSL 公钥加密，放在 Server Key Exchange 消息中，发送给 server 。
      - 再采用某个加密算法，根据两个随机数和 premaster secret ，生成一个对称加密的会话密钥。然后发送 Change Cipher Spec 消息，表示已生成会话密钥，以后的消息都将加密传输。
      - 再发送 Finished 消息，表示握手完成。
  4. server 收到加密字符串，用 SSL 私钥解密。
      - 再采用同一个加密算法，生成的相同会话密钥。然后发送 Change Cipher Spec 消息。
      - 再发送 Finished 消息，表示握手完成。

- SNI（Server Name Indication，服务器名称指示）
  - 同一个 IP 地址的 server 可能同时运行多个 Web 网站，拥有多个 SSL 证书。因此，在 SSL 握手时 server 需要判断使用哪个 SSL 证书。
    - 为了解决该问题，通常在 TLS 握手的第一步，在 client 发送的 Client Hello 消息中包含 SNI 信息，说明 client 想访问的 Host 目标域名是什么，于是 server 可找到对应的 SSL 证书。
    - 如果没有 SNI 信息，server 一般会使用一个默认的 SSL 证书，可能握手失败。
  - 发送的 SNI 信息默认未加密，第三方可能发现 client 访问的域名地址，进行审查、拦截。
    - 可采取一些措施来提高安全性。比如加密的 SNI、加密的 Client Hello、加密的 DNS 。

### TLSv1.3

- 2018 年发布。
- 握手流程：
  1. client 发送 Client Hello 消息。
  2. server 发送数字证书，并生成会话密钥。
  3. client 验证数字证书，生成会话密钥，发送 Finished 消息。
- 启用 TLSv1.3 时，需要 HTTP 服务器、客户端同时支持该功能。而 SSL 证书与使用的 SSL 版本无关。
  - 例如 OpenSSL 从 1.1.1 版本开始支持 TLSv1.3 ，而 Nginx 从 1.13 版本开始将构建时依赖的 OpenSSL 升级到 1.1.1 ，从而支持 TLSv1.3 。
  - TLSv1.3 采用一些新的加密算法，与 TLSv1.2 不兼容。
  - 可访问网站 howsmyssl.com 测试浏览器支持的 SSL 版本、加密算法。
  - 访问一个网站时，在 Chrome 浏览器的开发者工具 -> 安全页面，可查看当前采用的 SSL 版本、加密算法。

## PKI

- 公开密钥基础设施 （Public Key Infrastructure，PKI）
  - ：一套关于创建、使用、管理公钥和数字证书的策略、程序。
  - 例如 CentOS 系统默认将数字证书等文件保存在 `/etc/pki/` 目录下。
- 证书授权中心（Certificate Authority ，CA）
  - ：PKI 系统中，一些负责颁发数字证书、存储公钥的机构。
  - 多个 CA 可以建立树形关系，上级 CA 可以向下级 CA 颁发证书，证明后者的身份，让公众可以信任。最上级 CA 使用一个自签名的根证书，作为信任的源头。
- 注册机构（Registration Authorities，RA）
  - ：PKI 系统中，CA 可以委派一些机构担任 RA ，有资格用 CA 证书签发新的数字证书。
  - 用户可以找互联网上的 RA 平台申请一个数字证书，可能要付费。也可以自己部署 CA 服务器，创建自签名证书，但不会被公众信任，通常只能用于私有网络。

- SSL 数字证书
  - ：是 PKI 的常见用途，由 CA 颁发一个文件，用于证明某个 SSL 公钥属于某个实体。
  - 主要包含以下信息：
    - 证书的颁发者，即 CA 机构。
    - 证书的使用者，包括域名、机构名、联系方式等。
      - 可以允许多个域名使用同一个证书。
      - 域名中可以使用通配符，比如 *.test.com ，表示所有子级域名都可以使用该证书。
    - SSL 公钥
    - 证书的有效期，包括开始时间、截止时间。
  - 证书由 CA 的私钥加密，避免伪造。用户可以将证书分享给任何人，后者可以用 CA 的公钥解密，查看其内容。
  - 例如，一些 HTTPS 网站提供 SSL 证书证明自己的身份。当用户的浏览器访问 HTTPS 网站时，会下载其 SSL 证书，如果证书使用者与当前域名不匹配，则浏览器会警告该网站不安全。
  - 证书通常颁发给域名，也可以颁发给 IP 地址，但一般的 CA 机构会拒绝颁发给私有 IP 。
    - 可以用 openssl 命令创建自签名证书，绑定到私有 IP 。
    - 可以修改主机的 hosts 文件，将域名解析到私有 IP ，然后访问该域名。
