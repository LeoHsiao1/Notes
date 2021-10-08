# Nexus

：一个 Web 服务器，提供了工件仓库的功能。
- [官方文档](https://help.sonatype.com/repomanager3)
- 全名为 Nexus Repository Manager 。
- 由 Sonatype 公司开源。分为社区版（OSS）、专业版（PRO）。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    nexus:
      container_name: nexus
      image: sonatype/nexus3:3.34.1
      restart: unless-stopped
      # environment:
      #   INSTALL4J_ADD_VM_PARAMS: -Xms2703m -Xmx2703m -XX:MaxDirectMemorySize=2703m -Djava.util.prefs.userRoot=/nexus-data/javaprefs
      ports:
        - 8081:8081
      volumes:
        - ./data:/nexus-data
  ```
  - 需要调整挂载目录的权限：
    ```sh
    chown -R 200 .
    ```
  - 默认用户名为 admin ，密码记录在 admin.password 文件中。


## 用法

- Nexus 的 Web 页面分为两大区域：
  - Browse ：浏览页面，可以对工件进行浏览（呈树形图）、搜索、上传、删除。
  - Administration ：后台管理。

- Nexus 支持创建多种格式的仓库（Repository），用于存储工件（Component）。
  - 关于软件包：
    - apt
    - conda
    - yum
  - 关于代码包：
    - go
    - maven
    - npm
    - nuget
    - pypi
    - r
    - rubygems
  - 关于 Docker 镜像：
    - docker
    - helm
  - 关于文件：
    - gitlfs
    - raw

- 仓库有多种存储类型：
  - hosts ：普通仓库。
  - proxy ：对远程仓库的代理和缓存。当用户请求下载一个工件时，先尝试从本地缓存获取。如果不存在，则从远程仓库获取并缓存。
  - group ：组，可以包含多个任意类型的仓库，合并它们的工件。
    - 例如默认创建了 hosts 类型的 maven-releases、maven-snapshots 仓库， proxy 类型的 maven-central 仓库，并包含于 group 类型的 maven-public 仓库。

- 在 Nexus 底层，仓库需要存储在 Blob 中。
  - Blob 是在本机或云端创建的存储空间。
    - 默认创建了一个名为 default 的 Blob ，存储所有仓库。
  - Blob 分为多种类型：
    - File ：存储在本机的文件系统中。
    - AWS S3

- 支持创建自动清理策略（Cleanup Policy）
  - 创建清理策略之后，需要在仓库的管理页面应用。


### 访问控制

- 采用基于角色的访问控制。
  - 默认禁止匿名用户访问。
  - 每个用户（User）可以分配多个角色（Role），每个角色可以分配多种权限（Privilege）。
  - 权限示例：
    ```sh
    nx-userschangepw      # 修改密码
    nx-search-read        # 允许搜索
    nx-component-upload   # 允许上传

    nx-repository-view-*-*-*            # 对 nexus 仓库的访问权限：允许对 * 类型的、名为 * 的仓库，进行 * 操作
    nx-repository-view-maven2-*-browse  # 允许对 maven2 类型的、名为 * 的仓库，进行 browse 操作
    ```
    对仓库的操作分为：
    ```sh
    browse    # 通过 Web UI 浏览
    read      # 通过 HTTP 请求读取工件
    add       # 通过 HTTP 请求添加工件
    edit
    delete
    ```
