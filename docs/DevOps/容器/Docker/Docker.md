# Docker

：一个管理容器的软件。
- [官方文档](https://docs.docker.com/reference/)
- 采用 Golang 开发，在 Moby 项目中开源。
- 提供了用于 Linux、MacOS、Windows 系统的软件安装包。
- dotCloud 公司于 2013 年发布 Docker 软件，成为了最流行的容器引擎。
  - 后来公司改名为 Docker 公司。

## 安装

- 在 Centos 上安装：
  ```sh
  yum install -y yum-utils       # 安装 yum-config-manager
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加 docker 的官方镜像源
  yum install -y docker-ce      # 下载 docker 社区版
  systemctl start docker        # 启动 dockerd
  systemctl enable docker       # 使 docker 开机自启
  ```

- 在 ubuntu 上，可以用官方脚本自动安装：
  ```sh
  curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
  ```

### 版本

- 2017 年 3 月，Docker 的软件版本号从 v1.13 升级到 17.03 ，从数字编号改为日期格式。并且分为两种发行版：
  - Docker CE ：社区版（Community Edition），免费提供。
  - Docker EE ：企业版（Enterprise Edition），增加了一些收费的功能。

### 配置

- 配置 dockerd 时，需要创建 `/etc/docker/daemon.json` 文件，写入配置信息，然后重启 dockerd 。
  - dockerd 默认以 HTTPS 方式访问镜像仓库服务器。如果服务器不支持 SSL 认证，则需要将其地址加入白名单：
    ```json
    "insecure-registries" : ["10.0.0.1:8080"]
    ```
- 如果想让 dockerd 使用代理，需要在 `/usr/lib/systemd/system/docker.service` 中加入环境变量：
  ```sh
  [Service]
  Environment="HTTP_PROXY=socks5://10.0.0.1:1080"
  ```
  然后重启 dockerd ：
  ```sh
  systemctl daemon-reload
  systemctl restart docker
  ```
  - 同理，也可以在容器内添加环境变量 HTTP_PROXY ，一些容器内应用支持通过这种方式配置代理。
