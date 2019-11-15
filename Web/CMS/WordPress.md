# WordPress

一个CMS平台，基于Php、Mysql，可以让用户不必编程就设计网站，非常流行。

- 功能非常多，上手难度低。
- 既可以制作静态网站，也可以制作动态网站。
- 可以安装WordPress服务器，在它的Web页面上设计网站。也可以在WordPress官网（<https://wordpress.com>）上设计网站。
- 官方文档：<https://codex.wordpress.org/zh-cn:Main_Page>

## 安装

WP服务器有Linux版、Windows版，这里在Linux上安装它：

1. 安装MySQL数据库
2. 登录MySQL数据库，进行配置：

    ```shell
    create user wordpress@"%" identified by "密码";
    create database wordpress;
    grant all on wordpress.* to wordpress@"%";
    ```

3. 用docker安装WP服务器，该镜像集成了php、Apache环境

    ```shell
    docker pull wordpress:latest
    docker run -d --name wordpress -p 80:80 wordpress:latest
    ```

4. 访问<http://127.0.0.1>即可看到WP服务器的初始页面，按照提示进行安装。

## 目录结构

WP服务器的网站根目录默认是/var/www/html。

- 可以将自制的网站文件放到该目录下。
- wp-config.php文件中记录了数据库密码等信息。
