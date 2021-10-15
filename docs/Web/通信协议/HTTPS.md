# HTTPS

：安全超文本传输协议（Secure Hypertext Transfer Protocol），是让 HTTP 协议基于 SSL/TLS 协议加密通信。

## 原理

- HTTP 协议采用明文传输报文，不安全，可能被泄露、篡改。而 HTTPS 协议是在 SSL/TLS 加密信道中传输 HTTP 报文，很安全。
- 工作流程：
  1. client 访问 server 的 TCP 端口，进行 TCP 握手。
  2. client 与 server 进行 SSL 握手，建立加密的通信信道。
  3. client 与 server 在加密信道中传输 HTTP 报文。
- 一般的 Web 服务器默认支持 HTTP 协议，而启用 HTTPS 需要进行一些准备工作：
  1. 用 OpenSSL 生成一对 SSL 私钥和公钥。
  2. 将 SSL 公钥 提交到 CA ，申请数字证书。
  3. 将数字证书和私钥文件保存到 server 上，用于 SSL 握手。

## SSL

- 90 年代，网景公司发布了 SSL（Secure Sockets Layer ，安全套接字层）协议，用于加密传输 HTTP 报文。
  - SSL 工作在传输层与应用层之间。
  - SSL 更新到 v3.0 版本时，演化出了更安全的 TLS（Transport Layer Security ，安全传输层）协议，有时也统称为 SSL 协议。
- TLS 1.2 握手的流程：
  1. client 发送 Client Hello 消息，包含支持的 TLS 版本、加密算法、一个临时生成的随机数。
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
- TLS 1.3 握手的流程：
  1. client 发送 Client Hello 消息。
  2. server 发送数字证书，并生成会话密钥。
  3. client 验证数字证书，生成会话密钥，发送 Finished 消息。
- SSL 的缺点：
  - 每次传输 HTTP 报文时需要加密、解密，消耗更多 CPU 和时间。
  - 需要 TLS 握手，在网络延迟较大时有明显耗时。
    - TLS 1.3 握手的步骤比 TLS 1.2 少，因此耗时更短。

## CA

- CA（Certificate Authority，证书授权中心）：一些负责颁发、管理数字证书的机构，也可以自己部署 CA 服务器。
- SSL 数字证书：一个由可信任的 CA 提供的文件。用于证明某个 SSL 公钥，属于某个实体。
  - 主要包含以下信息：
    - 证书的颁发者，即 CA 机构。
    - 证书的使用者，包括域名、机构名、联系方式等。
      - 可以允许多个域名使用同一个证书。
      - 域名中可以使用通配符，比如 *.test.com ，表示所有子级域名都可以使用该证书。
    - SSL 公钥
    - 证书的有效期，包括开始时间、截止时间。
  - 证书由 CA 的私钥加密，避免伪造。用户可以将证书分享给任何人，后者可以用 CA 的公钥解密，查看其内容。
  - 用浏览器访问 HTTPS 网站时会检查证书，如果请求的域名与证书使用者不匹配，则警告该网站不安全。
    - 例如通过 IP 访问网站，就不匹配证书。
  - 证书也可以颁发给 IP 地址，一般的 CA 机构会拒绝颁发给私有 IP 。
    - 可以用 openssl 创建自签名证书，绑定到私有 IP 。
    - 可以修改 hosts 文件，将域名解析到私有 IP ，然后访问域名。
