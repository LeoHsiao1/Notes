# Docker

：一个管理容器的软件。
- [官方文档](https://docs.docker.com/reference/)
- 采用 Golang 开发，在 Moby 项目中开源。
- 提供了用于 Linux、MacOS、Windows 系统的软件安装包。

## 安装

- 在 CentOS 上安装：
  ```sh
  yum install -y yum-utils       # 安装 yum-config-manager
  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo   # 添加 docker 的官方镜像源
  yum install -y docker-ce      # 下载 docker 社区版
  systemctl start docker        # 启动 dockerd
  systemctl enable docker       # 使 dockerd 开机自启
  ```

- 在 ubuntu 上，可以用官方脚本自动安装：
  ```sh
  curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
  ```

### 版本

- 2017 年 3 月，Docker 的软件版本号从 v1.13 升级到 17.03 ，从数字编号改为日期格式。并且分为两种发行版：
  - Docker CE ：社区版（Community Edition），免费提供。
  - Docker EE ：企业版（Enterprise Edition），增加了一些收费的功能。

## 配置

- dockerd 的配置文件默认位于 `/etc/docker/daemon.json` ，且默认未创建。内容示例：
  ```json
  {
    // dockerd 的配置
    // "containerd": "/run/containerd/containerd.sock",
    // "containerd-namespace": "docker",
    // "data-root": "/var/lib/docker",        // dockerd 的数据目录
    // "debug": false,                        // 是否开启调试模式
    // "exec-root": "/var/run/docker",        // dockerd 的工作目录
    "insecure-registries" : ["10.0.0.1:80"],  // dockerd 默认以 HTTPS 方式访问镜像仓库服务器。如果服务器不支持 SSL 认证，则需要将其地址加入白名单
    "live-restore": true,                     // 当 dockerd 终止时，是否保持容器运行。默认为 false ，建议启用，方便重启 dockerd
    // "oom-score-adjust": -500,              // dockerd 的 oom_score_adj
    // "selinux-enabled": false,

    // 创建容器时的默认配置。修改这些配置不会影响已创建的容器，只会影响到新创建的容器
    // "default-address-pools": [
    //   {
    //     "base": "172.30.0.0/16",
    //     "size": 24
    //   },
    //   {
    //     "base": "172.31.0.0/16",
    //     "size": 24
    //   }
    // ],
    // "default-runtime": "runc",
    // "default-shm-size": "64M",
    // "default-ulimits": {
    //   "nofile": {
    //     "Name": "nofile",
    //     "Hard": 64000,
    //     "Soft": 64000
    //   }
    // },
    // "dns": ["8.8.8.8"],          // 容器默认的 DNS 服务器
    "log-driver": "json-file",      // 设置日志驱动器的类型，默认为 json-file
    "log-opts": {
      "max-size": "1g"              // 日志文件的最大大小。超过该大小则滚动一次，创建一个新日志文件继续写入
      "max-file": "1"               // 最多保留多少份日志文件。即使只保留 1 份，每次滚动时也会创建一个新日志文件
    },
    // "shutdown-timeout": 15,      // 停止容器时的超时时间

    // 是否启用可选功能
    // "features": {
    //     "buildkit": false
    // }
  }
  ```
  - 修改配置之后，需要重启 dockerd 。

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
