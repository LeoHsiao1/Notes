# Grafana

：一个 Web 网站，实现可视化监控，基于 Go 语言。
- 支持多种数据源，比如 MySQL、influxdb、Elasticsearch、Prometheus 。
  - 可添加 TestData DB 数据源来试用。
- 提供了丰富、美观的图表，并可以配置告警策略。
- [官方文档](https://grafana.com/docs/grafana/latest/)

## 安装

- 下载 rpm 包然后安装：
    ```sh
    wget https://dl.grafana.com/oss/release/grafana-6.7.3-1.x86_64.rpm
    yum install grafana-6.7.3-1.x86_64.rpm
    systemctl enable grafana-server
    systemctl start grafana-server
    ```
  - 安装之后访问 <http://127.0.0.1:3000> 即可查看 Web 页面。默认的用户、密码是 admin、admin 。

- 或者运行 Docker 镜像：
    ```sh
    docker run -d --name grafana -p 3000:3000 grafana/grafana
    ```

## 配置

- 配置文件的位置：
  - Grafana 默认的配置文件位于 $WORKING_DIR/conf/defaults.ini 。
  - 用户自定义的配置文件位于 $WORKING_DIR/conf/defaults.ini 。
  - 采用 rpm 包安装方式时，Grafana 的启动选项中用 `--config=/etc/grafana/grafana.ini` 指定了唯一的配置文件。
- 修改配置文件之后，要重启 Grafana 才会生效。
- Grafana 默认将自己的数据保存在 SQLite 数据库中。

## Dashboard

Grafana 上可以创建多个 Dashboard（仪表盘），每个 DashBoard 页面可以包含多个 Panel（面板）。
- 可以将 Dashboard 或 Panel 导出 JSON 配置文件。
- 存在多个 Dashboard 时，可以用 Folder 分类管理。
- 图表一般以 time 为横轴，用鼠标横向拖动选中一块区域，可以缩小 time range 。按 Ctrl+Z 可以放大 time range 。
- playlist ：包含多个 Dashboard 的播放清单。
- snapshot ：对 Dashboard 或 Panel 的快照，只记录了此刻的数据，可以分享 URL 给任何人查看。

## 第三方登录

Grafana 支持通过 GitLab、GitHub 等第三方账号登录。

启用 GitLab OAuth 的方法：
1. 进入 GitLab 的"User Settings"->"Applications"页面，添加一个应用：
    - Name ：填 Grafana
    - Redirect URI ：填入 Grafana 的 URI ，格式为：https://mygrafana.com/login/gitlab
    - Scopes ：选择 api
    注册成功后，GitLab 将生成一对 Application ID 和 Secret 。

2. 修改 Grafana 配置文件中的部分内容：
    ```ini
    [server]
    protocol = http
    http_addr =             # 默认绑定 0.0.0.0
    http_port = 3000        # Grafana 对外的访问端口
    domain = mygrafana.com  # Grafana 对外的访问 IP 或域名

    [auth.gitlab]
    enabled = true
    allow_sign_up = true
    client_id = 9c6b79bf4714e5f8cdbcffad0e2d0fe74   # 填 Application ID
    client_secret = 86a39f5b9f779791aac631704ee0b0  # 填 Secret
    scopes = api
    auth_url = http://mygitlab.com/oauth/authorize  # 改为 Gitlab 的域名
    token_url = http://mygitlab.com/oauth/token
    api_url = http://mygitlab.com/api/v4
    allowed_groups =
    ```

3. 访问 Grafana 网站，在它的登录页面可以看到一个新增的按钮：“Sign in with GitLab”

## 告警

使用告警功能的步骤：
1. 进入"Alerting"页面，创建至少一个"Notification Channel"，表示发送告警信息到哪里。
  - 如果以 Email 的形式发送告警，则需要先在 Grafana 的配置文件中配置邮箱信息，如下：
      ```ini
      [smtp]
      enabled = true
      host = 10.0.0.1:25      # SMTP 服务器的位置
      user =                  # 登录 SMTP 服务器的账号
      password =              # If the password contains # or ; you have to wrap it with triple quotes. Ex """#password;"""
      cert_file =
      key_file =
      skip_verify = false     # 与 SMTP 服务器通信时是否跳过 SSL 协议
      from_address = admin@grafana.localhost    # 邮件的发件方邮箱
      from_name = Grafana                       # 邮件的发送方名称
      ```

2. 进入"Dashboard"页面，编辑任意 panel ，添加 Alert 告警规则。
