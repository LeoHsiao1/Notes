# HTTPS

：安全超文本传输协议（Secure Hypertext Transfer Protocol）。
- HTTP 协议是明文通信，因此可能泄露隐私、被篡改。而 HTTPS 协议是基于 SSL/TLS 协议实现加密通信，很安全。

## 原理

- 采用 HTTPS 协议时，client 与 server 的通信流程如下：
  1. client 进行 DNS 查询，得知 server 的 IP 地址。不过这里假设 client 距离 DNS 服务器很近，耗时可忽略。
  1. client 与 server 进行 TCP 握手，建立 TCP 连接，相当于一个明文的通信信道。耗时为 1 RTT 。
  2. client 与 server 进行 SSL 握手，建立 SSL 连接，相当于一个加密的通信信道。耗时为 1 RTT （假设采用 TLSv1.3 ）。
  3. client 生成 HTTP 请求，用 SSL 加密，发送给 server 。
  4. server 收到 HTTP 请求，用 SSL 解密。然后生成 HTTP 响应报文，用 SSL 加密，发送给 client 。

- 一般的 Web 服务器都支持 HTTP 协议，而启用 HTTPS 需要进行一些准备工作：
  1. 生成一对 SSL 私钥和公钥。
  2. 将 SSL 公钥提交到 CA ，申请数字证书。
  3. 将数字证书和私钥文件上传到 Web 服务器，用于 SSL 握手。

- 因为使用 SSL ，HTTPS 实现了加密通信，但有以下缺点：
  - 每次建立 SSL 连接，需要传输一次 SSL 证书文件，体积大概为 4KB 。
    - 假设每秒建立 100 次 SSL 连接，则累计流量为 100*4/1024≈0.4MB ，占用 3.2Mbps 的网络带宽。
    - 传输 SSL 证书文件时不应该压缩，因为存在一些已知漏洞。
    - Nginx 支持让客户端在一段时间内复用 SSL 会话，不必重复 SSL 握手。
    - 有的浏览器会缓存网站的 SSL 证书，直到用户关闭该网页。
  - 采用 HTTP 协议时，客户端发出第一个 HTTP 请求之前，需要 TCP 握手，等待 1 RTT 。而采用 HTTPS 协议时，需要 TCP 握手、SSL 握手，等待 2 RTT ，耗时更久。
  - 每次传输 HTTP 报文时需要加密、解密，略微增加了 CPU 负载和耗时。

- SNI（Server Name Indication，服务器名称指示）
  - 同一个 IP 地址的 server 可能同时运行多个 Web 网站，拥有多个 SSL 证书。因此，在 SSL 握手时 server 需要判断使用哪个 SSL 证书。
    - 为了解决该问题，通常在 TLS 握手的第一步，在 client 发送的 Client Hello 消息中包含 SNI 信息，说明 client 想访问的 Host 目标域名是什么，于是 server 可找到对应的 SSL 证书。
    - 如果没有 SNI 信息，server 一般会使用一个默认的 SSL 证书，可能握手失败。
  - 发送的 SNI 信息默认未加密，第三方可能发现 client 访问的域名地址，进行审查、拦截。
    - 可采取一些措施来提高安全性。比如加密的 SNI、加密的 Client Hello、加密的 DNS 。

## SSL

- 90 年代，Netscape 公司发布了 SSL（Secure Sockets Layer ，安全套接字层）协议，主要用于加密传输 HTTP 报文。
  - SSL 工作在传输层与应用层之间。
  - 应用层协议（比如 HTTP ）可以将一段 payload 数据用 SSL 协议传输。而 SSL 会将 payload 加密之后，用传输层协议（比如 TCP ）传输。

- 关于版本。
  - SSLv1 版本未公开发布，在发布了 SSLv2、SSLv3 版本之后，过渡到更安全的 TLS（Transport Layer Security ，安全传输层）协议。有时也将 SSL、TLS 统称为 SSL 协议。
  - 目前建议最好采用 TLSv1.3 。其次采用 TLSv1.2 ，但握手耗时更久。不应该采用 SSLv2、SSLv3、TLSv1.0、TLSv1.1 ，因为存在一些漏洞。

- SSL 协议提供了多个方面的安全性：
  - 身份验证
    - 通信双方可使用数字证书，证明自己的身份。
  - 加密传输 payload ，保护隐私，避免被窃听
    - SSL 协议采用对称加密的方式。发送方将 payload 用密钥加密之后才发送，接收方用同一密钥才能解密 payload 。
    - 每个 SSL 会话会临时生成一个随机的会话密钥，互不相同，因此隔离了风险。
    - 不过 SSL 只是加密了 payload ，其它信息没有加密。比如第三方可以抓包查看 TCP 头，得知通信双方的 IP 地址。
  - 避免重放攻击
    - 每发送一个 SSL 数据包，会包含一个从 0 开始递增的序列号（sequence number），从而保证 SSL 数据包的有序传输。
  - 校验数据一致性，避免 payload 传输出错、被篡改
    - 发送方会根据会话密钥生成 MAC（Message Authentication Code，消息验证码）密钥。然后使用 MAC 密钥搭配一个哈希算法，将 payload、sequence number、ssl version 等信息拼凑在一起计算哈希值，作为 MAC 验证码。最后将 MAC 验证码加入 SSL 包一起发送。
    - 接收方会根据 MAC 验证码，检查 payload 是否传输出错。
    - 只有通信双方知道 MAC 密钥，能计算出 MAC 验证码。而第三方不能伪造 MAC 验证码，因此不能篡改 payload 。
    - TLSv1.3 弃用单纯的 MAC 算法，改用包含 MAC 算法的 AEAD 算法。

### TLSv1.2

- 2008 年发布。
- 握手流程：
  1. client 发送 Client Hello 消息，说明自己支持哪些 TLS 版本、哪些加密算法（ciphers），请 server 决定选用哪个。还包含一个临时生成的随机数，称为 client random 。
  2. server 回复 Server Hello 消息，说明决定采用哪个 TLS 版本、哪个加密算法。还包含另一个临时生成的随机数，称为 server random 。
      - 再发送 Server Key Exchange 消息。
      - 再发送 Certificate 消息，包含由 CA 颁发的数字证书（其中包含了 SSL 公钥），用于证明身份。
      - 可选发送 CertificateRequest 消息，索要 client 的数字证书，实现双向认证。
      - 最后发送 Server Hello Done 消息，表示 Hello 阶段的消息已发送完。
  3. client 收到 server 的数字证书，验证 server 的身份。
      - 再临时生成一个随机数，称为预主密钥（pre-master secret）。用 SSL 公钥加密，放在 Server Key Exchange 消息中，发送给 server 。这样只有 server 能解密，第三方即使监听了通信，也不能解密。
      - 再使用上述采纳的加密算法，根据上述三个随机数，生成一个会话密钥（master secret）。然后发送 Change Cipher Spec 消息，表示已生成会话密钥，以后的消息都将加密传输。
      - 再发送 Finished 消息，表示握手完成。
  4. server 收到 Server Key Exchange 消息，用 SSL 私钥解密，得到 pre-master secret 。
      - 再使用上述采纳的加密算法，根据上述三个随机数，生成一个会话密钥。然后发送 Change Cipher Spec 消息。因此 client、server 会分别生成一个会话密钥，但取值相同，属于对称加密。
      - 再发送 Finished 消息，表示握手完成。

- 总结：
  - 握手流程的第 1、2 步，是 client 与 server 协商采用哪个 TLS 版本、哪个加密算法。
  - 握手流程的第 3、4 步，是先基于 SSL 非对称加密，交换随机数。然后根据随机数，生成对称加密的会话密钥，用于之后的 TLS 加密通信。
  - TLSv1.2 握手需要两次往返通信，client 需要等待 2 RTT ，才能开始发送 HTTP 请求。

### TLSv1.3

- 2018 年，IETF 发布 [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446) 规范，定义了 TLSv1.3 。
- 握手流程：
  1. client 发送 Client Hello 消息，与 TLSv1.2 相似，但还包含 pre-master secret 。
  2. server 回复 Server Hello 消息，与 TLSv1.2 相似，但还包含 server 的数字证书。同时，server 已得到三个随机数，可以生成会话密钥，发送 Finished 消息。
  3. client 验证 server 的数字证书，然后生成会话密钥，发送 Finished 消息。同时，开始发送 HTTP 请求。
- 由上可见，与 TLSv1.2 相比，TLSv1.3 简化了握手流程，client 只需等待 1 RTT ，在第 3 步就能开始发送 HTTP 请求。

- TLSv1.3 还提供了 0-RTT 会话恢复模式，用于将重复握手的耗时缩短到 0 。
  - 流程：
    1. 当 client 与 server 第一次 TLSv1.3 握手时，server 在收到 client 的 Finished 消息之后，可发送一个 NewSessionTicket 消息，包含一个临时生成的随机密钥 PSK（Pre-Shared Key）及其有效期。
        - PSK 是 client 在当前 TLS 会话的凭证（session ticket）。类似于浏览器访问网站时用 cookie 作为身份凭证。
        - server 会为每个 TLS 会话生成不同的 PSK 。
    2. 当 client 重新向 server 建立 TCP 连接时（例如浏览器重新打开一个网站），可不遵循标准握手流程，而是请求恢复之前的 TLS 会话。做法为发送 Client Hello 消息，包含：PSK （用于证明该 client 曾经握手成功、经过 server 身份认证）、early data （此时就可发送 HTTP 请求，用 PSK 加密）。
    3. server 收到 Client Hello 消息之后，如果认为其中的 PSK 有效，则回复 Server Hello 消息，包含新的 PSK （表示新的 TLS 会话）、HTTP 响应。同时发送 Finished 消息。
    4. client 发送 Finished 消息。
  - 优点：
    - 跳过了重复 TLS 握手的耗时，不过依然要重新 TCP 握手。
    - 跳过了身份认证，不必传输数字证书，节省了网络流量。
  - 缺点：
    - TLS 会话传输的每个数据包都包含序列号，不怕重放攻击。但 0-RTT 数据包的作用是创建一个新的 TLS 会话，不受序列号限制。因此第三方可以监听 client 发送的 0-RTT 数据包（包含已加密的 HTTP 请求），重复发送给 server ，造成重放攻击。
  - 可以在应用层采用几种措施，防御 0-RTT 重放攻击：
    - 禁用 0-RTT 功能。例如 nginx 在采用 TLSv1.3 协议时，默认禁用 0-RTT 。
    - 如果 0-RTT 数据包中的 HTTP 请求是 GET 类型，则 server 正常响应，否则拒绝服务。因为 GET 类型的 HTTP 请求通常具有幂等性。
    - client 给 0-RTT 的 HTTP 请求添加一个 header ，取值唯一。当 server 收到重复的 HTTP 请求时，就能发现该 header 取值重复出现，因此拒绝服务。该方案比较麻烦。

- 启用 TLSv1.3 时，需要 HTTP 服务器、客户端同时支持该功能。而 SSL 证书通常同时支持多种 SSL 版本，不必额外配置。
  - 例如 OpenSSL 从 1.1.1 版本开始支持 TLSv1.3 ，而 Nginx 从 1.13 版本开始将构建时依赖的 OpenSSL 升级到 1.1.1 ，从而支持 TLSv1.3 。
  - TLSv1.3 采用一些新的加密算法，与 TLSv1.2 不兼容。
  - 可访问网站 <howsmyssl.com> 测试本机浏览器支持哪些 SSL 版本、加密算法。
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

### 数字证书

- SSL 数字证书（digital certificate）是 PKI 的常见用途。由 CA 颁发一个证书文件，用于证明某个 SSL 公钥属于某个实体。
- 证书文件主要包含以下信息：
  - 证书的颁发者，即 CA 机构。
  - 证书的使用者，包括域名、机构名、联系方式等。
    - 可以允许多个域名使用同一个证书。
    - 域名中可以使用通配符，比如 *.test.com ，表示所有子级域名都可以使用该证书。
  - SSL 公钥
  - 证书的有效期，包括开始时间、截止时间。
- 证书由 CA 的私钥加密，避免伪造。用户可以将证书分享给任何人，后者可以用 CA 的公钥解密，查看其内容。
- 证书通常颁发给域名，也可以颁发给 IP 地址，但一般的 CA 机构会拒绝颁发给私有 IP 。
  - 例如：一些 HTTPS 网站提供 SSL 证书证明自己的身份。当用户的浏览器访问 HTTPS 网站时，会下载其 SSL 证书，如果证书使用者与当前域名不匹配，则浏览器会警告该网站不安全。
  - 可以用 openssl 命令创建自签名证书，绑定到私有 IP 。
  - 可以修改主机的 hosts 文件，将域名解析到私有 IP ，然后访问该域名。
