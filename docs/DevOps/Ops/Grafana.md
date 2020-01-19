# Grafana

：一个 Web 网站，实现可视化监控，基于 Go 语言。
- 支持多种数据源，比如 MySQL、influxdb、Elasticsearch、Prometheus 。
  - 可添加 TestData DB 数据源来试用。
- 提供了丰富的、美观的图表。

## 安装

运行 docker 镜像：
```sh
docker run -d --name grafana -p 80:3000 grafana/grafana
```
- 默认的管理员用户、密码是 admin、admin 。

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

2. 修改 Grafana 的配置文件 grafana/conf/defaults.ini 中的 [auth.gitlab] 部分内容，格式如下：
    ```ini
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

3. 再修改该配置文件中的以下配置：
    ```ini
    protocol = http
    http_port = 3000        # Grafana 对外的访问端口
    domain = mygrafana.com  # Grafana 对外的访问域名
    ```

4. 访问 Grafana 网站，在它的登录页面可以看到一个新增的按钮：“Sign in with GitLab”
