# Nextcloud

：一个开源的网盘服务器。
- 提供了 Web 操作页面，但没有提供上传、下载文件的 HTTP API 。
- 提供了 Linux、MacOS、Windows、Android、IOS 版的客户端。
- 功能丰富，接近商业级网盘。
- [官方文档](https://docs.nextcloud.com/server/10/user_manual/contents.html)

## 部署

- 创建 docker-compose.yml 文件来部署：
    ```yml
    version: '3'

    services:
      mysql:
        image: percona
        restart: on-failure
        volumes:
        - ./mysql:/var/lib/mysql
        environment:
        - MYSQL_ROOT_PASSWORD=******    # 设置 root 密码
        - MYSQL_DATABASE==nextcloud
        - MYSQL_USER=nextcloud
        - MYSQL_PASSWORD=******         # 设置密码
        networks:
        - net

      web:
        image: nextcloud
        depends_on:
        - mysql
        restart: on-failure
        ports:
        - 2380:80
        volumes:
        - ./html:/var/www/html
        networks:
        - net

    networks:
      net:
    ```
