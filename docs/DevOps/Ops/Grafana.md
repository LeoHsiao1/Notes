# Grafana





## 第三方登录

Grafana支持通过GitLab、GitHub等第三方账号登录。

启用GitLab OAuth的方法：
1. 进入GitLab的"User Settings"->"Applications"页面，添加一个应用：
    - Name ：填Grafana
    - Redirect URI ：填入Grafana的URI，格式为：https://mygrafana.com/login/gitlab
    - Scopes ：选择api
    注册成功后，GitLab将生成一对 Application ID 和 Secret 。

2. 修改Grafana的配置文件 grafana/conf/defaults.ini 中的 [auth.gitlab] 部分内容，格式如下：
    ```ini
    [auth.gitlab]
    enabled = true
    allow_sign_up = true
    client_id = 9c6b79bf4714e5f8cdbcffad0e2d0fe74   # 填Application ID
    client_secret = 86a39f5b9f779791aac631704ee0b0  # 填Secret
    scopes = api
    auth_url = http://mygitlab.com/oauth/authorize  # 改为Gitlab的域名
    token_url = http://mygitlab.com/oauth/token
    api_url = http://mygitlab.com/api/v4
    allowed_groups =
    ```

3. 再修改该配置文件中的以下配置：
    ```ini
    protocol = http
    http_port = 3000        # Grafana对外的访问端口
    domain = mygrafana.com  # Grafana对外的访问域名
    ```

4. 启动Grafana，在它的登录页面可以看到一个新增的按钮：“Sign in with GitLab”
