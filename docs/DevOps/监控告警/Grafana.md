# Grafana

：一个 HTTP 服务器，基于 Golang 开发，可以在 Web 页面上显示丰富、美观的数据图表。
- 常用作监控系统、数据分析的前端。
- [官方文档](https://grafana.com/docs/grafana/latest/)

## 安装

- 下载二进制包：
  ```sh
  wget https://dl.grafana.com/oss/release/grafana-7.0.0.linux-amd64.tar.gz
  ```
  解压后启动：
  ```sh
  bin/grafana-server
  ```
  - 默认的访问地址为 <http://localhost1:3000> 。默认的用户名、密码是 admin、admin 。

- 或者运行 Docker 镜像：
  ```sh
  docker run -d --name grafana -p 3000:3000 grafana/grafana
  ```

## 用法

基本用法：
1. 进入 "Configuration" -> "Data Sources" 页面，添加数据源。
2. 进入 "Dashboard" 页面，利用数据源的数据绘制图表。

- Grafana 支持多种数据源，比如 MySQL、influxdb、Elasticsearch、Prometheus 。
  - 默认有一个 TestData DB 数据源可供试用。
  - 某些数据源自带了一些 Dashboard 模板，可以导入试用。

- Grafana 上可以创建多个 Dashboard（仪表盘），每个 DashBoard 页面可以包含多个 Panel（面板）。
  - 可以将 Dashboard 或 Panel 导出 JSON 配置文件。
  - 存在多个 Dashboard 时，可以用 Folder 分类管理。
  - 官网提供了一些 Dashboard 示例，可供参考。
- playlist ：用于自动循环显示一些 Dashboard 。
- snapshot ：对 Dashboard 或 Panel 的快照。只记录了此刻的数据，可以分享 URL 给别人查看。
- [官方的 Dashboard 市场](https://grafana.com/grafana/dashboards)
  - Node Exporter Full ：显示 node_exporter 的指标。
- [官方的 Plugins 市场](https://grafana.com/grafana/plugins)
  - Zabbix 插件：用于分析 Zabbix 的监控数据，包含 Dashboard 模板。
  - Pie Chart 插件：允许绘制饼状图。

### Panel

- 一个 panel 中存在多个图例（legend）的曲线时，用鼠标单击某个图例的名字，就会只显示该图例的曲线。按住 Ctrl 再单击，就可以同时选择多个图例。
- 修改 Panel 时，是以 Dashboard 为单位进行修改，要点击"Save Dashboard"才会保存。
  - 比如调整一个 Dashboard 显示的时间范围（time range）时，会影响到该 Dashboard 中的所有 panel 。
- 用鼠标横向拖动选中 panel 中的一块区域，可以缩小 time range ；按 Ctrl+Z 可以放大 time range 。

Panel 的主要配置项：
- Queries ：数据源。
  - 首先要在 Grafana 的 Configuration 页面添加至少一个数据源（Data Sources），然后才能给 Panel 配置数据源、查询语句。
  - 下例是从 MySQL 数据库中查询数据的配置：
    ```sh
    FROM process_num                      # 查询 process_num 表
    Time column update_time               # 取 update_time 列作为时间轴
    Metric column none
    SELECT Column: num    Alias: 数量     # 取 num 列的值，并设置别名
    WHERE Macro: $__timeFilter            # 允许调整查询的时间范围
    GROUP BY time ($__interval, none)     # 将数据按特定时间间隔分组，采样点没有数据的话赋值为 none

    Min time interval 1m                  # group by 分组的最短时间间隔（建议与查询间隔一致）
    ```
- Visualization ：显示样式。
  - 大多数情况可采用以时间为横轴的曲线图，从而方便查看数据的变化历史。
  - 每个曲线图上可以输入多个图例，从而显示多条曲线。
- General ：一般的配置项，比如 Panel 的名字。
- Alert ：告警规则。

## 告警

- 使用告警功能的步骤：
    1. 进入 Alerting 页面，创建至少一个"Notification Channel"，表示发送告警信息到哪里。
    2. 进入任意 Panel 的编辑页面，添加 Alert 告警规则。
- 在 Alerting 页面可以看到用户创建的所有 Alert Rule 。
- 在 Panel 的 Alert 编辑页面，
  - 点击 "State history" 可以查看告警历史。
  - 点击 "Test Rule" 可以测试告警条件。

- 下例是一种 Alert 的触发条件：
    ```
    Evaluate every 1m, For 5m
    ```
  - 它表示每隔 1m 查询一次，如果满足告警条件，则将该 Panel 从 OK 状态标为 Pending 状态；如果保持 Pending 状态超过 5m ，则标为 Alerting 状态，并发送告警信息。
  - 如果该 Panel 一直处于 Alerting 状态，Grafana 不会再重复告警，除非用户手动暂停再启用其 Alert Rule 。
  - 如果该 Panel 不再满足告警条件，Grafana 会立即将它的状态标为 OK ，并且默认也会发送一条告警消息（除非在配置"Notification Channel"时，勾选"Disable Resolve Message"）。

- 下例是一种 Alert 的告警条件：
    ```
    WHEN avg() OF query(A, 5m, now-1m) IS ABOVE 10
    ```
    它表示查询最近 5 分钟之内、1 分钟之前的图例 A 的数据，看平均值是否大于 10 。
    如果图例 A 包含多个 Metric ，则只要有一个 Metric 的值符合条件就会告警。
    截止时间设置成 now-1m 是为了避免最近 1 分钟之内尚未采集到数据，导致报错：NO DATA 

- 下例是查询最后一次数据，因此不必担心尚未采集到数据：
    ```
    WHEN last() OF query(A, 5m, now) IS ABOVE 10
    ```

- 下例是查询当前数据减去 5 分钟之前的数据的差值（可能为负）：
    ```
    WHEN diff() OF query(A, 5m, now) IS ABOVE 10
    ```

- Grafana 支持定义变量并在 pannel 中调用，从而动态地改变 pannel 的数据，但是这样就不支持设置告警条件。
  
## 配置

- 以 rpm 包的方式安装 Grafana 时，有以下几个重要文件，拷贝它们就可以备份 Grafana ：
  - /etc/grafana/grafana.ini ：配置文件。
  - /var/lib/grafana/grafana.db ：保存 Grafana 运行时的数据、页面配置。
  - /var/lib/grafana/plugins/ ：插件目录。
  - /var/log/grafana/ ：日志目录。日志文件会被按天切割，最多保存 7 天。
- 以二进制版的方式运行 Grafana 时，上述文件都保存在工作目录下：
  - conf/defaults.ini
  - data/grafana.db
  - data/plugins/
  - data/log/
- 修改配置文件之后，要重启 Grafana 才会生效。

### 启用 Email

在配置文件中按如下格式配置邮箱，就可以以 Email 的形式发送告警。
```ini
[smtp]
enabled = true
host = 10.0.0.1:25      # SMTP 服务器的位置
user =                  # 登录 SMTP 服务器的账号
password =              # If the password contains # or ; you have to wrap it with triple quotes. Ex """#password;"""
cert_file =
key_file =
skip_verify = false     # 与 SMTP 服务器通信时是否跳过 SSL 认证
from_address = admin@grafana.localhost    # 邮件的发件方邮箱
from_name = Grafana                       # 邮件的发送方名称
```

### 第三方登录

Grafana 支持通过 GitLab、GitHub 等第三方账号登录。

启用 GitLab OAuth 的方法：
1. 进入 GitLab 的 "User Settings" -> "Applications" 页面，添加一个应用：
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
