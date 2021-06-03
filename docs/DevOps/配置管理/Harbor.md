# Harbor

：一个提供 Docker 镜像仓库的服务器软件，由 VMware 公司开源。
- [官方文档](https://goharbor.io/docs/2.2.0/)
- 支持存储 Docker Image 和 Helm Chart 。

## 同类产品

- Docker Hub
  - ：Docker 官方的镜像仓库，地址为 https://hub.docker.com 。
  - 公开的镜像不需登录就可以 Pull ，但 Push 镜像时需要登录
- Docker Registry
  - ：一个提供私有镜像仓库的服务器软件，由 Docker 官方开源。
  - 功能比 Harbor 少。

## 部署

- 下载官方发行版，用脚本部署：
  ```sh
  sh install.sh
                --with-notary         # 启用 notary ，检查镜像的数字签名。这需要 Harbor 采用 HTTPS
                --with-trivy          # 启用 trivy 漏洞扫描器
                --with-chartmuseum    # 启用 Chart 仓库
  ```
  - 部署时至少需要 4G 内存。
  - 包含多个模块，基于 docker-compose 启动。

- dockerd 默认以 HTTPS 方式访问镜像仓库服务器。因此，如果 Harbor 以 HTTP 方式部署，则需要在 dockerd 的 daemon.json 中添加白名单：
  ```json
  "insecure-registries" : ["10.0.0.1:8080"]
  ```
- 在 Harbor 网页上的操作失败时，可能缺乏详细的报错信息，此时建议看日志。

## 功能

- 项目（Projects）
  - 每个项目是一个命名空间（namespace），其下可以存储多个镜像。
    - 默认存储在本机文件系统中。以 layer 为单位进行存储，因此存储多个相似的镜像时，只会占用少量存储空间。
  - 拉取镜像的命令格式如下：
    ```sh
    docker pull <harbor_url>/<project>/<REPOSITORY>[:tag]
    ```
    - 每个镜像 Image 划分一个镜像仓库（repository），其下可以存储多个 tag 的镜像。
  - 每个项目可以添加多个用户作为成员，担任某种角色。角色按权限从高到低如下：
    ```sh
    项目管理员  # 可以管理该项目的其他成员
    维护人员    # 可以扫描镜像、复制镜像、删除镜像
    开发者      # 可以读写镜像
    访客        # 只能拉取镜像
    受限访客    # 只能拉取镜像
    ```

  - 如果项目的访问级别为 Private ，则其下的所有镜像可以被未登录用户拉取。
  - 新建项目时，可以设置为对其它远程仓库的 "代理" 。
    - 当用户请求拉取该项目下的镜像时，会自动从远程仓库拉取同名镜像，并默认缓存 7 天。
    - 不过，拉取缓存镜像时，需要增加一层路径，声明远程镜像的命名空间。如下：
      ```sh
      docker pull <harbor_url>/<proxy_project>/<remote_namespace>/<REPOSITORY>[:tag]
      ```

- 仓库管理（Registries）
  - ：用于定义一些远程的仓库服务器，供其它功能调用。

- 复制（Replications）
  - ：用于在本地 Harbor 仓库与其它远程仓库之间 Push 或 Pull 镜像。
  - 拉取 Docker Hub 的官方镜像时，需要指定源命名空间为 library ，比如 `library/hello-world` 。
  - Pull 镜像时，如果不指定存储到哪个命名空间，则默认采用源命名空间的名称。
    - 如果不存在该命名空间则自动创建，且访问级别为 Private 。
  - Pull 镜像时，指定的源镜像名支持模糊匹配。如下：
    ```sh
    library/*                 # 匹配 library 目录下的所有镜像，但不包括子目录
    library/*/*               # 匹配两级子目录
    library/**                # 匹配所有层级的子目录
    library/hello*            # 匹配 library 目录下，以 hello 开头的所有镜像
    library/hello?            # ? 匹配单个字符，不包括斜杆 /
    {library,amazon}/**       # 匹配多个字符串，用逗号分隔
    ```
  - 触发复制规则时，会创建一个复制任务，在队列中执行。
    - 可以手动触发，也可以定时自动触发。
    - 如果任务执行失败，则会在几分钟之后重试。
