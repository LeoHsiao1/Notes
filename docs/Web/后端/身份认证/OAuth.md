# OAuth

：一个实现 SSO 的协议。
- 允许用户通过平台 A 的账号登录第三方应用，也允许第三方应用获取用户在平台 A 上的某些资源。
- 常用的版本是 v2.0 ，它不兼容 v1.0 。

## 架构

角色划分：
- 用户：要通过平台 A 的身份认证登录 app 。
- 第三方应用：简称为 app 。
- 资源服务器：存储着用户在平台 A 上的资源。
- 授权服务器：完成身份认证之后，返回一个 token（访问令牌）给 app ，允许 app 拿着这个 token 发出 HTTP 请求到资源服务器，获取用户在平台 A 上的某些资源。
  - 平台 A 的资源服务器、授权服务器可能是同一台服务器。

## 工作模式

- 授权码模式
  - ：app 先向授权服务器申请 code（授权码），拼接出申请 token 的登录 URL 。
  - 由平台 A 完成统一的身份认证，避免了用户在每个网站上创建账号的麻烦。
  - 由平台 A 负责实际的身份认证，第三方应用不会知道用户的真实密码，因此这种模式最安全。
- 简化模式
  - ：app 直接向授权服务器申请 token 。当用户从授权服务器跳转回来时，token 会被放在 URL 中，容易泄露。
  - 适用于 app 只有网页，没有后端服务器的情况，比如手机应用。
- 密码模式
  - ：用户将自己的账号密码告诉 app ，让 app 拿着账号密码去获取 token 。这样 app 有权访问用户的所有资源。
- 客户端模式
  - ：授权服务器收到 app 的请求时直接返回 token ，不需要身份认证。

### 授权码模式

工作流程示例：
1. 用户在 app 的网页上点击 “以其它方式登录” 的链接。
2. app 构造出平台 A 的 OAuth 登录 URL ，让用户 302 重定向到它（采用 GET 请求）。
    - app 要在登录 URL 的请求字符串中加入以下参数：
      ```sh
      client_id       # app 在平台 A 上注册的 id
      redirect_uri    # app 的回调 URL
      response_type   # 表示希望服务器返回的值类型。必须设置为  "code"
      scope           # 表示 app 请求授权的范围
      state           # 一个针对该请求的随机数，用于防止 CSRF 攻击。
      ```
    - 例如：`…….com/oauth/authorize?client_id=……&redirect_uri=……&response_type=code`
    - app 需要事先平台 A 上注册，设置自己的 redirect_uri ，被分配 client_id、client_secret 。
3. 用户在平台 A 的页面上，同意授权给 app 。
    - 平台 A 要验证用户的身份（可能要让用户通过账号密码或其它方式完成登录），然后验证登录 URL 中是否包含了必须参数、这些参数是否有效，最后循环用户是否同意授权给 app 。
    - 如果授权失败或出错，平台 A 应该在自己的网页上告诉用户。
4. 平台 A 构造出 app 的 redirect_uri ，让用户 302 重定向到它（采用 GET 请求）。
    - 平台 A 要在 redirect_uri 的请求字符串中加入以下参数：
      ```sh
      code            # 一个根据 client_id 和 redirect_uri 生成的随机值
      state           # 原样返回 app 的 state
      ```
    - code 应该在几分钟之内过期，减少泄漏的风险。
    - code 是一次性的，如果有 app 拿着用过的 code 来请求平台 A 发放 token ，平台 A 应该拒绝该请求，并撤销基于该 code 发放的 token 。
    - app 应该检查该 state 参数是否与自己发送的相同（可以事先保存在用户的 session 中）。
5. 当用户重定向回到 app 时，app 从 redirect_uri 中解析出 code ，向平台 A 请求 token 。
    - app 的后端服务器发出 POST 报文到平台 A ，请求获取 token 。报文 body 中应该采用 application/x-www-form-urlencoded 格式，包含以下参数：
      ```sh
      client_id
      client_secret
      redirect_uri
      code            # 填入 app 从 redirect_uri 中解析出的 code
      grant_type      # 表示授权模式。必须设置为 "authorization_code"
      ```
    - 平台 A 的响应报文 body 中包含以下参数：
      ```sh
      access_token    # 访问令牌
      expires_in      # token 的过期时间
      refresh_token   # 当 access_token 过期之后，用 refresh_token 来请求新的 access_token
      token_type      # token 的类型，通常为 “bearer”
      scope           # token 的授权范围
      ```
    - 如果 refresh_token 也过期了，就需要用户重新授权。
    - 有的平台只有 access_token ，没有 refresh_token 。
6. app 收到 token ，拿着它向平台 A 请求用户的身份信息（比如用户名）。
    - app 拥有 token 之后，就有权限调用平台 A 的一些 API 了。
7. app 同意用户登录，将用户重定向到自己的业务页面。
