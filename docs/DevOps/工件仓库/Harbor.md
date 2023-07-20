# Harbor

：一个 Web 服务器，提供了容器镜像仓库。
- [官方文档](https://goharbor.io/docs/2.2.0/)
- 采用 Golang 开发，由 VMware 公司开源。
- 支持存储 container image 和 Helm chart 。

## 同类产品

- Docker Hub
  - ：Docker 官方的镜像仓库，地址为 `https://hub.docker.com` 。
  - 公开的镜像不需登录就可以 pull ，但 push 镜像时需要登录。
- Docker Registry
  - ：一个提供私有镜像仓库的服务器，由 Docker 官方开源。
  - 功能比 Harbor 少，没有提供 Web UI 。

## 部署

- 下载官方发行版：
  ```sh
  wget https://github.com/goharbor/harbor/releases/download/v2.7.1/harbor-online-installer-v2.7.1.tgz
  ```
  解压后，编辑配置文件 harbor.yml ，然后执行脚本：
  ```sh
  sh install.sh
                # --with-chartmuseum  # 启用 chart repository
                # --with-notary       # 启用 notary ，检查镜像的数字签名。这需要 Harbor 采用 HTTPS
                --with-trivy          # 启用 trivy 漏洞扫描器
  ```
  - 这会基于 docker-compose 部署 Harbor ，包含 harbor-core、harbor-db、registry、Nginx、Redis 等多个服务。
    - 不会将日志输出到 docker 容器，而是保存到日志目录。
    - 部署时至少需要 4G 内存。
  - 部署之后，如果修改配置文件 harbor.yml ，则需要执行：
    ```sh
    ./prepare --with-trivy
    docker-compose up -d
    ```
- 用 Nginx 的 HTTPS 端口反向代理 Harbor 时，需要在 Nginx 中加入 `proxy_set_header X-Forwarded-Proto $scheme;` ，并在 `harbor/common/config/nginx/nginx.conf` 中删除相同配置。

### 版本

- v2.6.0
  - 于 2022 年发布。
  - 增加缓存层（cache layer），但默认禁用。它用于将客户端对 repository、artifact 等信息的查询结果缓存在 Redis 中，从而减少查询耗时。不会缓存 image blob 。
  - 弃用 notary ，建议改用 cosign 。
  - 弃用 chartmuseum 。因为 helm v3.8.0 连接到符合 OCI 标准的 Docker 镜像仓库就可以推送、拉取 chart ，不需要专门的 chartmuseum 仓库。

## 功能

- 项目（Projects）
  - 每个项目是一个命名空间（namespace），其下可以存储一些 image 或 Helm chart 。
    - 默认存储在本机文件系统中。以 layer 为单位进行存储，因此存储多个相似的镜像时，只会占用少量存储空间。
  - 拉取镜像的命令格式如下：
    ```sh
    docker pull <harbor_url>/<project>/<REPOSITORY>[:tag]
    ```
    - 每个镜像 Image 划分一个镜像仓库（repository），其下可以存储多个 tag 的镜像。
    - 网页上显示的镜像大小是压缩之后的。
  - 每个项目可以添加多个用户作为成员，担任某种角色。角色按权限从高到低如下：
    ```sh
    项目管理员  # 可以管理该项目的其他成员
    维护人员    # 可以扫描镜像、复制镜像、删除镜像
    开发者      # 可以读写镜像
    访客        # 只能拉取镜像
    受限访客    # 只能拉取镜像
    ```
    - 如果项目的访问级别为 Private ，则允许被未登录用户拉取镜像。

  - 新建项目时，可以设置为对其它远程仓库的 "代理" 。
    - 当用户请求拉取该项目下的镜像时，会自动从远程仓库拉取同名镜像，并默认缓存 7 天。
    - 不过，拉取缓存镜像时，需要增加一层路径，声明远程镜像的命名空间。如下：
      ```sh
      docker pull <harbor_url>/<proxy_project>/<remote_namespace>/<REPOSITORY>[:tag]
      ```
  - 支持设置 Tag 的保留规则、项目的磁盘定额，从而限制存储的镜像数量。
    - 推送镜像到 Harbor 时，默认会覆盖 image:tag 相同的 artifact 。可以将一些 tag 声明为不可变的，不允许被覆盖、删除。
  - 支持漏洞扫描。
  - 支持设置 Webhook ：当项目发生 push、pull 等事件时，发送一个 JSON 格式的消息到某个 URL 。

- 仓库管理（Registries）
  - ：用于定义一些远程的仓库服务器，供其它功能调用。

- 复制（Replications）
  - ：用于在本地 Harbor 仓库与其它远程仓库之间 push 或 pull 镜像。
  - 拉取 Docker Hub 的官方镜像时，需要指定源命名空间为 library ，比如 `library/hello-world` 。
  - pull 镜像时，如果不指定存储到哪个命名空间，则默认采用源命名空间的名称。
    - 如果不存在该命名空间则自动创建，且访问级别为 Private 。
  - pull 镜像时，指定的源镜像名支持模糊匹配。如下：
    ```sh
    library/*                 # 匹配 library 目录下的所有镜像，但不包括子目录
    library/*/*               # 匹配两级子目录
    library/**                # 匹配所有层级的子目录
    library/hello*            # 匹配 library 目录下，以 hello 开头的所有镜像
    library/hello?            # ? 匹配单个字符，不包括斜杆 /
    {library,amazon}/**       # 匹配多个字符串，用逗号分隔
    ```
  - 触发复制规则时，会创建一个复制任务，在队列中执行。
    - 可以手动触发，也可以定时自动触发，或通过事件触发。
    - 如果任务执行失败，则会在几分钟之后重试。

- 机器人账户（Robot）
  - ：供自动化脚本使用，可用于 docker login 命令，但不能用于访问 Harbor Web 页面。

- 垃圾清理
  - 当用户删除镜像时，Harbor 并不会在磁盘中实际删除其使用的 layer 。
  - 可以在 Web 页面上手动执行垃圾清理，或者定时执行，找出可以删除的 layer ，然后删除。
