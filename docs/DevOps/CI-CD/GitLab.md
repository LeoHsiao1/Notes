# GitLab

：一个 Web 网站，用于托管 Git 仓库。
- [官方文档](https://docs.gitlab.com/ee/)
- 采用 Ruby 开发，基于 Rails 框架。
- 可以访问公网上的 GitLab 官方网站，也可以自己部署。
- 除了托管 Git 仓库，还提供了 Issue、任务看板、Wiki、CI/CD、WebIDE 等丰富的功能。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    gitlab:
      container_name: gitlab
      image: gitlab/gitlab-ce:14.1.5-ce.0
      restart: unless-stopped
      hostname: gitlab.example.com
      ports:
        - 80:80
      volumes:
        - ./config:/etc/gitlab
        - ./logs:/var/log/gitlab
        - ./data:/var/opt/gitlab
  ```
  - 执行 `gitlab-rake "gitlab:password:reset"` ，根据提示输入用户名 root ，即可设置其密码。
  - 官方 Docker 镜像中集成了多个进程，比如 Nginx、Prometheus、Grafana ，比较臃肿。

## 配置

- 配置文件默认位于 `/etc/gitlab/gitlab.rb` ，配置示例：
  ```sh
  external_url "http://gitlab.example.com"
  # nginx['listen_port'] = 80                 # GitLab 监听的端口。默认会根据 external_url 选择监听的端口、协议
  # nginx['listen_https'] = false             # 监听的端口是否采用 HTTPS 协议

  # SMTP 配置
  gitlab_rails['smtp_enable']               = true
  gitlab_rails['smtp_domain']               = "exmail.qq.com"
  gitlab_rails['smtp_address']              = "smtp.exmail.qq.com"
  gitlab_rails['smtp_port']                 = 465
  gitlab_rails['smtp_user_name']            = "test@qq.com"
  gitlab_rails['smtp_password']             = "******"
  gitlab_rails['smtp_authentication']       = "login"
  gitlab_rails['smtp_enable_starttls_auto'] = true
  gitlab_rails['smtp_tls']                  = true
  gitlab_rails['gitlab_email_from']         = 'test@qq.com'
  ```
  - 修改配置文件之后，需要执行 `gitlab-ctl reconfigure` 才能生效，而重启不一定生效。
  - 可以执行 `gitlab-rails console` 进入 Ruby 终端，测试发送邮件：
    ```ruby
    Notify.test_email('test@qq.com', 'Test Email', 'This is for test.').deliver_now
    ```
- 登录 GitLab 之后，点击网页右上角的头像下拉框 -> Preferences ，可设置语言、每周起始日、时间偏好。
- 建议在 admin 页面进行如下配置：
  - 禁止新用户注册。
  - 设置仓库的默认分支名为 master 。
  - 禁止在项目中不存在 CI 配置文件时，默认执行 Auto DevOps 任务。

## 用法

- Project
  - ：项目，即一个 Git 仓库。
- Group
  - ：群组，用于批量管理一组项目，类似于文件夹。
  - 支持创建嵌套的子群组。
  - 用户名、群组名都属于命名空间，可以在这些命名空间下创建项目，项目的 URL 格式为 `<gitlab_url>/<namesapce>/<project>` 。
  - 用户默认有权创建个人项目、群组，但看不到其他人创建的项目、群组，除非被邀请加入。
- CI/CD
  - GitLab 支持在代码仓库中添加一个 .gitlab-ci.yml 文件，声明要执行的 CI/CD 流水线。

## API

- GitLab 提供了丰富的 Restful API 。
- 客户端使用 API 时可通过以下几种方式进行身份认证：
  - 个人 token
  - 项目 token
  - OAuth2 token
  - session cookie

- 例：通过 curl 命令下载文件
  ```sh
  gitlab_url=10.0.0.1
  project_id=5
  branch=master
  file_path=README.md
  token=KqKuksUwwcuyvnc8tEw1
  curl "http://${gitlab_url}/api/v4/projects/${project_id}/repository/files/${file_path}/raw?ref=${branch}&private_token=${token}"
  ```
