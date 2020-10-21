# GitLab

：一个流行的代码托管网站。
- [官方文档](https://docs.gitlab.com/omnibus/README.html)

## 部署

- 用 docker-compose 部署：
    ```yml
    version: "3"

    gitlab:
      image: gitlab/gitlab-ce:latest
      restart: on-failure
      hostname: 10.0.0.1
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
