# SonarQube

：一个开源的、检查代码质量的平台。
- 主要用于扫描静态代码，找出语法错误、漏洞，以及可优化之处。
- 支持 C、C++、C#、Java、JavaScrip、PHP、Python、Golang 等语言。
- 工作架构：
  - 先运行一个 SonarQube 服务器。
  - 然后执行一次 SonarScanner 扫描器，它会扫描代码，并将扫描结果上传到 SonarQube 服务器。
- [官方文档](https://docs.sonarqube.org/latest/)

## 部署

1. 配置以下内核参数：
    ```ini
    sysctl vm.max_map_count=262144
    sysctl fs.file-max=65536
    ```
2. 用 docker-compose 部署：
    ```yaml
    version: "3"

    services:
    sonarqube:
        image: sonarqube:8-community
        restart: unless-stopped
        ports:
        - 9000:9000
        networks:
        - sonarqube_net
        environment:
        - sonar.jdbc.url=jdbc:postgresql://db:5432/sonarqube
        - sonar.jdbc.username=sonarqube
        - sonar.jdbc.password=******
        volumes:
        - /opt/sonarqube/conf:/opt/sonarqube/conf
        - /opt/sonarqube/data:/opt/sonarqube/data
        - /opt/sonarqube/extensions:/opt/sonarqube/extensions
        - /opt/sonarqube/logs:/opt/sonarqube/logs

    postgres:
        image: postgres:12
        restart: unless-stopped
        networks:
        - sonarqube_net
        environment:
        - POSTGRES_USER=sonarqube
        - POSTGRES_PASSWORD=******
        - POSTGRES_DB=sonarqube
        volumes:
        - /opt/opt/sonarqube/postgresql/data:/var/lib/postgresql/data

    networks:
    sonarqube_net:
        driver: bridge
    ```
    - 默认用户名、密码为 admin、admin 。
    - SonarQube 支持的外部数据库包括：Oracle、PostgreSQL、SQL Server 。如果不配置外部数据库，默认会使用内置数据库，但不方便迁移数据、不支持版本更新。

## 用法

- 初次运行时的配置：
    1. 进入 "配置（Administration）" -> "权限（Security）" 页面，修改 admin 用户的密码，并取消默认所有人都可以访问 SonarQube 。
    2. 启动服务器，进入 "配置（Administration）" -> "应用市场（Marketplace）" 页面，下载有用的插件。
       比如 "Chinese Pack" 插件可以汉化页面。
       下载插件之后，网页会提示需要重启服务器才能安装。

- 从 [官网](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/) 下载 SonarScanner 扫描器的二进制文件，按以下格式执行它：
    ```sh
    ./sonar-scanner \
        -Dsonar.projectKey=test \                               # SonarQube 服务器上的项目名
        -Dsonar.sources=. \                                     # 待扫描的源代码目录
        -Dsonar.host.url=http://10.0.0.1:9000 \                 # SonarQube 服务器的 URL
        -Dsonar.login=31bbe4de2a8260ef2f427c6e318f05dbc8e92af6  # SonarQube 服务器上的用户密钥
    ```
    如果 SonarQube 服务器上不存在该项目，则会自动创建。
