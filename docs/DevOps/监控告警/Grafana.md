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

- 使用步骤：
  1. 进入 "Configuration" -> "Data Sources" 页面，配置至少一个数据源。
  2. 进入 "Dashboard" 页面，创建一个 Panel 。
  3. 配置 Panel ，从某个数据源按某个查询表达式获得数据，然后显示出图表。

- Grafana 支持多种数据源，比如 MySQL、influxdb、Elasticsearch、Prometheus 。
  - 默认有一个 TestData DB 数据源可供试用。
  - 某些数据源自带了一些 Dashboard 模板，可以导入试用。

- Grafana 上可以创建多个 Dashboard（仪表盘），每个 DashBoard 页面可以包含多个 Panel（面板）。
  - 可以将 Dashboard 或 Panel 导出 JSON 配置文件。
  - 可以给 Dashboard 加上 tags 来分类管理，也可以创建 Folder 来分组管理。
  - [官方及社区分享的 Dashboard ](https://grafana.com/grafana/dashboards)

- Playlist ：用于自动循环显示一些 Dashboard 。
- Snapshot ：对 Dashboard 或 Panel 的快照。只记录了此刻的数据，可以分享 URL 给别人查看。

## Panel

Panel 是 Grafana 的基本显示模块，每个 Panel 负责显示一张图表。
- 一个 Panel 中存在多个图例（legend）的曲线时，用鼠标单击某个图例的名字，就会只显示该图例的曲线。按住 Ctrl 再单击，就可以同时选择多个图例。
- 修改 Panel 时，是以 Dashboard 为单位进行修改，要点击"Save Dashboard"才会保存。
  - 比如调整一个 Dashboard 显示的时间范围（time range）时，会影响到该 Dashboard 中的所有 Panel 。
- 用鼠标横向拖动选中 Panel 中的一块区域，可以缩小 time range ；按 Ctrl+Z 可以放大 time range 。

Panel 的主要配置：
- General ：一般的配置项，比如 Panel 的名字。
- Query ：查询。
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
  - 查询到的数据主要分为以下几种形式：
    - Time Series ：时间序列，包含多个时间点的数据。
      勾选 "Instant" 选项之后，只会查询最后一个时间点的数据，就会从 Time Series 形式转换成 Table 形式，并极大地减少查询耗时。
    - Table
    - Heatmap

- Visualization ：显示样式。主要包括：
  - Graph ：曲线图。适用于显示时间序列形式的数据，可以方便地看出数据的变化历史。
    - 输入的数据包含多个图例时，会显示成多条曲线。
  - Stat ：显示单个字段的值，可以选择在背景中显示其变化曲线。
    - 输入的数据包含多个图例时，会显示成多行值。
  - Gauge ：显示单个字段的值，并在背景中显示其取值范围。
  - Bar Gauge ：条形图。
  - Table ：表格。
  - Heatmap ：热图。适用于显示大量同类型数据，可以方便地看出各种数值的分布位置。

- Axes ：坐标轴。
  - 坐标轴有很多种单位（Unit），比如：
    - none ：不显示单位。
    - short ：当数值达到千、百万等量级时，显示 k、m 等缩写单位。
    - percent(0-100) ：显示百分数，数值 0-100 分别对应 0%-100% 。
    - percent(0.0-1.0)
    - bytes(IEC) ：按二进制转换千、百万等量级，即 `1 MiB = 1024 KiB = 1024^2 Bytes` 。
    - bytes(Metric) ：按十进制转换千、百万等量级，即 `1 MB = 1000 KB = 1000^2 Bytes` 。
    - seconds

- Transform ：Grafana 7.0 新增的模块，用于转换显示的数据。包括以下功能：
  - Merge
    - 用于自动将当前 Panel 中的所有 Query 的数据合并成一个 Query 。
    - 可用于将多个表格组合成一个表格，它会自动去掉重复的列。
  - Outer join
    - 用于将输入的所有数据按某个字段合并。可用于合并多个时间序列、多个 Query 。
    - 例如：将所有数据按字段 A 合并后，会得到一个以字段 A 作为第一列的新表格，显示字段 A 每种取值时对应的其它字段的取值。
    - 与 Merge 功能相比，它不会自动去掉重复的列。但是如果有多行数据的第一列取值重复，则只会保留其中一行，丢失其它行，因此应该确保数据的第一列取值不会重复。
  - Reduce
    - 用于显示数据的每个字段的 Min、Max 等统计值，并隐藏具体的值。
    - 可用于将一个包含很多行数据的表格转换成一个行数较少的表格。
  - Add field from calculation
    - 用于增加一个新字段。其值可以是 Min、Max 等统计值，也可以是已有的某两个字段作加减乘除的运算结果。
    - Reduce 功能是显示所有数据的字段 A 的统计值（即统计表格的每列），而该功能是显示每条数据的某些字段的统计值（即统计表格的每行）。
  - Filter data by query
    - 用于筛选显示当前 Panel 中的各个 Query 。
  - Filter by name
    - 用于筛选显示各个字段，支持正则匹配。
    - 可以同时作用于多个 Query 。
  - Organize fields
    - 用于筛选显示各个字段，支持重命名、排序。
    - 当前 Panel 中只有一个 Query 时才能进行该配置。


## 告警

- 使用步骤：
    1. 进入 Alerting 页面，创建至少一个"Notification Channel"，表示发送告警信息到哪里。
    2. 进入任意 Panel 的编辑页面，添加 Alert 告警规则。

- 在 Alerting 页面可以看到用户创建的所有 Alert Rule 。
- 在 Panel 的 Alert 编辑页面，
  - 点击 "State history" 可以查看告警历史。
  - 点击 "Test Rule" 可以测试告警条件。

- 缺点：
  - Grafana 支持定义变量并在 pannel 中调用，从而动态地改变 pannel 的数据，但此时不支持设置告警条件。
  - Grafana 不擅长处理大量告警，没有一个全局统计面板。

配置规则：
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

## 插件

- 安装插件时，需要到 Grafana 工作目录下执行以下命令，然后重启 Grafana ：
  ```sh
  bin/grafana-cli plugins install <plugin_name>
                  --pluginsDir $PWD/data/plugins      # 指定插件的安装目录
  ```
- [官方的 Plugins 市场](https://grafana.com/grafana/plugins)
- 常用插件：
  - Zabbix 插件：用于分析 Zabbix 的监控数据，包含 Dashboard 模板。
  - Pie Chart 插件：允许绘制饼状图。


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
