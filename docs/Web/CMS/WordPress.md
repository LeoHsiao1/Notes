# WordPress

：一个 CMS 平台，基于 Php、Mysql ，可以让用户不必编程就设计网站，非常流行。
- 功能非常多，上手难度低。
- 既可以制作静态网站，也可以制作动态网站。
- 可以安装 WordPress 服务器，在它的 Web 页面上设计网站。也可以在其[官网](https://wordpress.com)上设计网站。
- [官方文档](https://www.tutorialspoint.com/wordpress/)

## 安装

WP 服务器有 Linux 版、Windows 版，这里在 Linux 上安装它：
1. 安装 MySQL 数据库
2. 登录 MySQL 数据库，进行配置：

    ```sh
    create user wordpress@"%" identified by "密码";
    create database wordpress;
    grant all on wordpress.* to wordpress@"%";
    ```

3. 用 docker 安装 WP 服务器，该镜像集成了 php、Apache 环境

    ```sh
    docker pull wordpress:latest
    docker run -d --name wordpress -p 80:80 wordpress:latest
    ```

4. 访问<http://127.0.0.1>即可看到 WP 服务器的初始页面，按照提示进行安装。

## 目录结构

WP 服务器的网站根目录默认是/var/www/html 。
- 将网站文件放到该目录下，即可被访问。
- wp-config.php 文件中记录了数据库密码等信息。
