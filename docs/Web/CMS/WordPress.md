# WordPress

：一个 CMS 平台，基于 Php、Mysql ，可以让用户不必编程就设计网站，非常流行。
- [官方文档](https://www.tutorialspoint.com/wordpress/)
- 功能丰富，使用门槛难度低。
- 既可以制作静态网站，也可以制作动态网站。
- 可以安装 WordPress 服务器，在它的 Web 页面上设计网站。也可以在其 [官网](https://wordpress.com) 上设计网站。

## 部署

WordPress 服务器有 Linux 版、Windows 版，这里在 Linux 上安装它：
1. 安装 MySQL 数据库，并创建账号：
    ```sh
    create database wordpress;
    create user wordpress@"%" identified by "******";
    grant all on wordpress.* to wordpress@"%";
    ```

2. 用 docker-compose 部署 WordPress 服务器，该镜像集成了 php、Apache 环境
    ```yml
    version: "3"

    services:
      wordpress:
      container_name: wordpress
      image: wordpress:6.4.3-apache
      restart: unless-stopped
      ports:
        - 80:80
      volumes:
        - ./data:/var/www/html
    ```

3. 访问 `http://127.0.0.1` 即可看到 WordPress 服务器的初始页面，按照提示配置数据库参数。

## 目录结构

WordPress 服务器的网站根目录默认是 `/var/www/html` 。
- 将网站文件放到该目录下，即可被访问。
- wp-config.php 文件中记录了数据库密码等信息。
