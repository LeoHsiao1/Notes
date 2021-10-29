# Artifactory

：一个 Web 服务器，提供了多种格式的工件仓库。
- [官方文档](https://www.jfrog.com/confluence/display/RTF6X)
- 采用 Java 开发，由美国 Jfrog 公司发布。
  - 分为社区版（OSS）、专业版（PRO）。
  - OSS 版只支持创建少数几种仓库。
- 特点：
  - 可以通过浏览器访问，也可以生成文件的 URL ，通过 HTTP API 上传、下载文件。
- 同类产品：
  - Nexus ：功能类似，属于竞品。支持多种格式的文件存储，不支持修改文件名、移动文件。
  - FTP 服务器：只支持二进制格式的文件存储，而且 FTP 协议比 HTTP 协议的通用性低。
  - Nextcloud ：网盘，只支持二进制格式的文件存储，而且访问时需要使用浏览器或专用客户端。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    artifactory:
      container_name: artifactory
      image: docker.bintray.io/jfrog/artifactory-oss:7.18.6
      restart: unless-stopped
      environment:
        JAVA_OPTS: -Duser.timezone=GMT+08
      ports:
        - 8082:8082
      volumes:
        - ./data:/var/opt/jfrog/artifactory
  ```
  - 需要调整挂载目录的权限：
    ```sh
    chown -R 1030 .
    ```
  - 默认用户名、密码为 admin、password 。

## 用法

### Web UI

Web 页面示例：

![](./Artifactory_1.png)

- 在 Web 页面左侧，可选择一个仓库。点击右上角的 "Deploy" 就会弹出一个上传文件的窗口。
- 上传文件时，会根据文件名自动生成上传路径（Target Path）。
  - 如果已存在该路径的文件，则会覆盖它。
  - 可以主动设置上传路径，比如划分出子目录。
- 每个文件有一个唯一的 URL ，可供用户上传、下载该文件。
  - 文件的 URL 等于 ` 仓库 URL + 文件上传路径 ` 。可以从网页上拷贝该 URL ，也可以自己拼凑出来。
- 每个文件会显示其修改时间。
  - 建议在 General Settings 页面设置 Date Format 为 `yyyy-MM-dd HH:mm:ss ZZ` 。
- 在浏览器上访问仓库或目录的 URL ，会以 HTML 基本视图显示文件列表。如下：

  ![](./Artifactory_2.png)

### 仓库

- 管理员可以创建仓库（Repository），设置哪些用户有权向该仓库上传、下载文件。
- 仓库有多种存储类型：
  - 本地仓库(Local)
  - 远程仓库(Remote)：通过 URL 拉取其它仓库的内容，缓存到本地。
  - 虚拟仓库(Virtual)
- 根据存储的文件格式对仓库分类：
  - Generic ：按二进制格式保存文件。
  - Gradle
  - Maven

- 节省存储空间的措施：
  - Maven、Gradle 等类型的仓库，可以设置 "Max Unique Snapshots" 参数，只保留每个工件版本最大的 n 个快照（SNAPSHOT）。
  - Artifactory Pro 版可以安装 artifactCleanup 插件，定时删除本地仓库中未使用的文件。
  - Remote 类型的仓库可以设置 "Unused Artifacts Cleanup Period" 参数，将 n 小时未使用的缓存标记为 Unused 。然后在高级设置 Advanced -> Maintenance 页面，设置定时执行 "Cleanup Unused Cached Artifacts" 。
  - 默认启用了 Backup 任务，每日备份所有数据库，可在设置页面取消。

### 访问控制

- 采用基于角色的访问控制。
- 默认定义了一个匿名用户（anonymous），代表没有登录的用户。
  - 可以在 Security -> Settings 页面中允许 "Allow Anonymous Access" 。

### Restful API

- 上传文件：
  ```sh
  curl -u 用户名:密码 'http://10.0.0.1:8082/artifactory/anonymous/test/1.zip' -T 1.zip > /dev/null
  ```

- 下载文件：
  ```sh
  curl -O -u 用户名:密码 <URL>
  ```

- 删除文件：
  ```sh
  curl -X DELETE -u 用户名:密码 <URL>
  ```
