# Grafana

：一个Web网站，实现可视化监控，基于Go语言。
- 支持多种数据源，比如MySQL、influxdb、Elasticsearch、Prometheus。
  - 可添加 TestData DB 数据源来试用。
- 提供了丰富的、美观的图表。

## 安装

运行docker镜像：
```sh
docker run -d --name grafana -p 80:3000 grafana/grafana
```
- 默认的管理员用户、密码是 admin、admin 。

## Dashboard

Grafana上可以创建多个Dashboard（仪表盘），每个DashBoard页面可以包含多个Panel（面板）。
- 可以将Dashboard或Panel导出JSON配置文件。
- 存在多个Dashboard时，可以用Folder分类管理。
- 图表一般以time为横轴，用鼠标横向拖动选中一块区域，可以缩小time range。按 Ctrl+Z 可以放大time range。
- playlist ：包含多个Dashboard的播放清单。
- snapshot ：对Dashboard或Panel的快照，只记录了此刻的数据，可以分享URL给任何人查看。

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

4. 访问Grafana网站，在它的登录页面可以看到一个新增的按钮：“Sign in with GitLab”
