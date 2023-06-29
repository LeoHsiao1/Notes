# Nexus

：NXRM（Nexus Repository Manager），一个 Web 服务器，提供了多种格式的工件仓库。
- [官方文档](https://help.sonatype.com/repomanager3)
- 采用 Java 开发，由 Sonatype 公司开源。
  - 分为社区版（OSS）、专业版（PRO）。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    nexus:
      container_name: nexus
      image: sonatype/nexus3:3.37.3
      restart: unless-stopped
      environment:
        INSTALL4J_ADD_VM_PARAMS: -Xms2G -Xmx2G -XX:MaxDirectMemorySize=1G -Djava.util.prefs.userRoot=/nexus-data/javaprefs -Duser.timezone=GMT+08
      ports:
        - 8081:8081
      volumes:
        - ./data:/nexus-data
  ```
  - 需要调整挂载目录的权限：
    ```sh
    chown -R 200 .
    ```
  - 默认用户名为 admin ，初始密码记录在 admin.password 文件中。

## 用法

### Web UI

- Nexus 的 Web 页面分为两大区域：
  - Browse ：浏览页面，可以对工件进行浏览（呈树形图）、搜索、上传、删除。
  - Administration ：后台管理。

- 浏览仓库列表：

  ![](./Nexus.png)

### 后台管理

- 在 Repositories 页面可以管理仓库。

- 在 Cleanup Policy 页面可以创建自动清理策略。
  - 比如 Last Downloaded Before 策略是删除最后下载日期在 n 天以前的工件，但忽略从未下载的工件。
  - 创建策略之后，需要在某个仓库的配置页面采用。

- 在 Capabilities 页面可以启用一些次要功能。

- 在 Task 页面可以创建多种类型的定时任务，例如：
  ```sh
  Admin - Cleanup repositories using their associated policies   # 根据 Cleanup Policy 清理各个仓库。默认添加了该任务，每天执行一次
  Admin - Compact blob store        # 压缩 Blob ，这会释放 deleted 文件的存储空间。建议添加该任务
  Maven - Delete SNAPSHOT           # 同一快照至少保留 m 个，并根据包名中的时间戳，删除早于 n 天的快照
  Maven - Delete unused SNAPSHOT    # 删除超过 n 天未使用（包括上传、下载）的快照
  ```

### 仓库

- 根据存储的工件（Component）格式对仓库（Repository）分类：
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
    - docker ：在 Docker 仓库的场景，Nexus 比 Harbor 少了很多功能。
    - helm
  - 关于文件：
    - gitlfs
    - raw ：将工件以二进制形式存储。

- 仓库有多种存储类型：
  - hosted ：普通仓库。
  - proxy ：对远程仓库的代理和缓存。当用户请求下载一个工件时，先尝试从本地缓存获取。如果不存在，则从远程仓库获取并缓存。
  - group ：组，可以包含多个任意类型的仓库，在逻辑上合并它们的工件。
    - 默认创建了 hosted 类型的 maven-releases、maven-snapshots 仓库，proxy 类型的 maven-central 仓库，三者都包含于 group 类型的 maven-public 仓库。
    - 从 maven-public 仓库下载工件时，会自动到 3 个成员仓库中寻找。但上传工件时，必须区分 maven-releases 和 maven-snapshots 仓库。

- 在 Nexus 底层，仓库需要存储在 Blob 中。
  - Blob 是在本机或云端创建的存储空间。
    - 默认创建了一个名为 default 的 Blob ，存储所有仓库。
  - Blob 采用软删除（soft deleted）。
    - 删除一个工件时，只是标记为 deleted 状态，但并不会立即释放存储空间。
  - Blob 分为多种类型：
    - File ：存储在本机的文件系统中。
    - AWS S3

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
  - 对仓库的操作分为：
    ```sh
    browse    # 通过 Web UI 浏览
    read      # 通过 HTTP 请求读取工件
    add       # 通过 HTTP 请求添加工件
    edit
    delete
    ```
  - 对于 npm 类型的仓库，需要启用 `npm Bearer Token Realm` ，提供身份认证的 token 。

### Restful API

- 关于工件的 API ：
  ```sh
  GET     /service/rest/repository/browse/$repository/        # 以 HTML 基本视图显示文件列表

  GET     /service/rest/v1/components?repository=$repository  # 列出某个仓库的工件信息，默认只显示第一页
  POST    /service/rest/v1/components?repository=$repository  # 上传工件到指定仓库。上传成功时的响应为空
  GET     /service/rest/v1/components/$component_id           # 获取指定工件的信息，需要指定工件在所有仓库中的唯一 ID
  DELETE  /service/rest/v1/components/$component_id           # 删除工件
  ```
- 例：上传一个二进制文件
  ```sh
  curl -X POST 'http://localhost:8081/service/rest/v1/components?repository=test'
        -u admin:******
        -F raw.assetN=@f1         # 要上传的本机文件路径
        -F raw.assetN.filename=f1 # 上传之后的文件名
        -F raw.directory=/        # 上传到哪个目录
  ```
