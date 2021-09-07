# GitLab

：一个 Web 网站，用于托管 Git 仓库。
- [官方文档](https://docs.gitlab.com/omnibus/README.html)
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
      environment:
        GITLAB_OMNIBUS_CONFIG: |
          external_url 'http://10.0.0.1'
      ports:
        - 80:80
      volumes:
        - ./config:/etc/gitlab
        - ./logs:/var/log/gitlab
        - ./data:/var/opt/gitlab
  ```
  - 然后执行 `gitlab-rake "gitlab:password:reset"` ，根据提示输入用户名 root ，即可重置其密码。

## 配置

- 配置文件默认位于 `/etc/gitlab/gitlab.rb` 。
- 官方 Docker 镜像中集成了多个进程，比如 Prometheus、Grafana 监控系统，比较臃肿。
- SMTP 的配置示例：
  ```sh
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
  然后执行 `gitlab-rails console` 进入 Ruby 终端，测试发送邮件：
  ```ruby
  Notify.test_email('test@qq.com', 'Test Email', 'This is for test.').deliver_now
  ```

## 用法

- Project
  - ：项目，即一个 Git 仓库。
- Group
  - ：群组，用于批量管理一组项目，类似于文件夹。
  - 支持创建嵌套的子群组。
  - 组名、用户名都属于命名空间，其下项目的 URL 格式为 `<gitlab_url>/<namesapce>/<project>` 。
  - 用户默认有权创建个人项目、群组，但看不到其他人创建的项目、群组，除非被邀请加入。

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
