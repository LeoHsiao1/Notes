# Nextcloud

：一个开源的网盘服务器，适用于在公司内部存储、分享文件。
- 优点：
  - 提供了 Web 页面，以及 Linux、MacOS、Windows、Android、IOS 版的客户端。
  - 主要功能是上传、下载、分享文件，支持搜索，支持文本文件、图片、视频的在线预览。
  - 用户还可以添加其它功能的应用。
- 用 Docker-compose 部署的配置：
    ```yaml
    version: '2'

    services:
    db:
        image: mariadb
        command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
        restart: on-failure
        volumes:
        - /opt/nextcloud/mysql:/var/lib/mysql      # 挂载 MySQL 的数据目录
        environment:
        - MYSQL_ROOT_PASSWORD=******               # 设置密码
        - MYSQL_PASSWORD==******                   # 设置密码
        - MYSQL_DATABASE=nextcloud
        - MYSQL_USER=nextcloud

    app:
        image: nextcloud
        restart: on-failure
        ports:
        - 80:80
        links:
        - db
        volumes:
        - /opt/nextcloud/html:/var/www/html        # 挂载 Nextcloud 的数据目录
    ```
    具体配置[参考](https://hub.docker.com/_/nextcloud)
