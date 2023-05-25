# GitLab

：一个 Web 网站，用于托管 Git 仓库。
- [官方文档](https://docs.gitlab.com/ee/)
- 采用 Ruby 开发，基于 Rails 框架。
- 可以访问公网上的 GitLab 官方网站，也可以自己部署社区版（CE）或企业版（EE）。
- 除了托管 Git 仓库，还提供了 Issue、任务看板、Wiki、CI/CD、WebIDE 等丰富的功能。

## 架构

- GitLab 的内部服务：
  - puma ：一个 HTTP 服务器。
  - workhorse ：反向代理 puma ，用于加速体积较大的 HTTP 请求，比如静态文件、上传文件。
  - sidekiq ：负责在后台执行任务。
  - gitaly ：负责处理 Git 请求。收到用户访问 Git 仓库的请求时，会去访问磁盘中的 Git 仓库。

- GitLab 依赖的外部服务：
  - redis
  - postgreSQL
  - nginx ：用于反向代理各个内部服务，作为用户访问 GitLab 的入口。
  - grafana、prometheus、exporter ：用于监控 Gitlab 自身。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    gitlab:
      container_name: gitlab
      image: gitlab/gitlab-ee:14.3.3-ee.0
      restart: unless-stopped
      hostname: gitlab.example.com
      ports:
        - 80:80
        - '1022:22'
      volumes:
        - ./config:/etc/gitlab
        - ./data:/var/opt/gitlab
        - /tmp/gitlab-log:/var/log/gitlab  # GitLab 会生成大量日志文件，因此挂载到 /tmp 目录，自动清理
  ```
  - 执行 `gitlab-rake "gitlab:password:reset"` ，根据提示输入用户名 root ，即可设置其密码。
  - 官方 Docker 镜像中集成了多个进程，因此比较臃肿，启动时需要几分钟。

- GitLab 企业版增加了少许功能。
  - 与社区版兼容。部署企业版时，如果未激活，则只能使用社区版的功能。
  - 激活步骤：
    1. 部署 gitlab-ee 。
    2. 进入 admin 页面，点击 Subscription ，输入激活码，或者上传许可证文件。

## 配置

- 配置文件默认位于 `/etc/gitlab/gitlab.rb` ，配置示例：
  ```sh
  # GitLab 地址
  external_url "https://gitlab.example.com"     # GitLab 供用户访问的地址，会影响 git clone 地址
  nginx['listen_port']  = 80                    # GitLab 实际监听的端口。默认会根据 external_url 选择监听的端口、协议
  nginx['listen_https'] = false                 # 监听的端口是否采用 HTTPS 协议
  gitlab_rails['gitlab_shell_ssh_port'] = 1022  # SSH 端口，会影响 git clone 地址，不过 GitLab 实际监听的依然是 22 端口

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

  # 建议禁用一些很少使用的组件，减少内存占用
  grafana['enable']                = false
  prometheus['enable']             = false
  prometheus_monitoring['enable']  = false    # 与 prometheus 相关的 exporter
  # puma['worker_processes']       = 2        # puma 的 worker 进程数，每个 worker 可能占用 1G 内存，但多个 worker 之间会共享内存
  gitlab_rails['packages_enabled'] = false    # GitLab 提供的 maven、npm、pypi 等仓库

  # 建议默认禁用项目的一些功能，简化界面
  # gitlab_rails['gitlab_default_projects_features_issues']             = true
  # gitlab_rails['gitlab_default_projects_features_merge_requests']     = true
  # gitlab_rails['gitlab_default_projects_features_wiki']               = true
  gitlab_rails['gitlab_default_projects_features_snippets']             = false  # 代码片段
  gitlab_rails['gitlab_default_projects_features_builds']               = false  # CI/CD 功能
  gitlab_rails['gitlab_default_projects_features_container_registry']   = false  # Docker 镜像仓库
  ```
  - 修改配置文件之后，需要执行 `gitlab-ctl reconfigure` 才能生效，而重启不一定生效。
- 可以执行 `gitlab-rails console` 进入 Ruby 终端。
  - 测试发送邮件：
    ```ruby
    Notify.test_email('test@qq.com', 'Test Email', 'This is for test.').deliver_now
    ```
- 登录 GitLab 之后，点击网页右上角的头像下拉框 -> Preferences ，可设置语言、每周起始日、时间偏好。
- 建议在 admin 页面进行以下配置：
  - 禁止新用户注册。
  - 设置仓库的默认分支名为 master 。
  - 禁止在项目中不存在 CI 配置文件时，默认使用 Auto DevOps 流水线。
- 建议对 group 进行以下配置：
  - 配置推送规则，比如限制单个文件的体积。
  - 将 Default branch protection 策略设置为完全保护：Developer 不能 git push 该分支，Maintainer 才可以。

## 用法

- Project
  - ：项目，即一个 Git 仓库。
- Group
  - ：群组，用于批量管理一组项目，类似于文件夹。
  - 支持创建嵌套的子群组。
  - 群组级别的配置，会被其下的子群组、项目继承。
  - 用户名、群组名都属于命名空间，可以在这些命名空间下创建项目，项目的 URL 格式为 `<gitlab_url>/<namesapce>/<project>` 。
    - 用户有权创建个人项目、群组，但看不到其他人创建的项目、群组，除非被邀请加入。
- GitLab 不支持创建用户组，而是以 Group 成员的方式批量管理用户。Group 成员分为几种预设的角色，权限从高到低如下：
  - Owner ：拥有当前 Group 的所有权限，接近于管理员。
  - Maintainer ：维护人员，拥有大部分权限。
  - Developer ：开发人员，拥有一般的编辑权限，不能 git push 主分支。
  - Reporter ：测试人员，有 Git 仓库的只读权限，可以编辑任务看板。
  - Guest ：只能读取 issue、wiki、CI/CD 等信息。不能读取 Git 仓库，除非该项目是公开的。
- CI/CD
  - GitLab 支持在代码仓库中添加一个 .gitlab-ci.yml 文件，配置要执行的 CI/CD 流水线。类似于 GitHub Actions 。

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
