# GitLab

：一个流行的代码托管网站。
- [官方文档](https://docs.gitlab.com/omnibus/README.html)

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    gitlab:
      container_name: gitlab
      image: gitlab/gitlab-ce:latest
      hostname: 10.0.0.1
      restart: unless-stopped
      environment:
        GITLAB_OMNIBUS_CONFIG: |
          external_url 'http://10.0.0.1:80'
      ports:
        - 80:80
      volumes:
        - ./gitlab/config:/etc/gitlab
        - ./gitlab/logs:/var/log/gitlab
        - ./gitlab/data:/var/opt/gitlab
  ```

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
