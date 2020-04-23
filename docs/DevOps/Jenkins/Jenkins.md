# Jenkins

：一个流行的 CI/CD 平台，常用于项目构建、测试、部署。
- 基于 Java 开发，提供了 Web 操作页面。
- 老版本名为 Hudson 。
- [官方文档](https://jenkins.io/zh/doc/)

## 安装

- 用 war 包启动：
  1. 下载 Jenkins 的 war 包。
  2. 安装 JDK 。
  3. 执行 `java -jar jenkins.war --httpPort=8080` 启动 Jenkins ，然后便可以访问其 Web 网站 `http://localhost:8080` 。

- 或者运行 Docker 镜像：
  ```sh
  mkdir /var/jenkins_home
  docker run -d \
          -p 8080:8080                                    # Jenkins 的 Web 端的访问端口
          -p 50000:50000                                  # 供 Jenkins 代理访问的端口
          -v /var/jenkins_home:/var/jenkins_home          # 挂载 Jenkins 的数据目录，从而可以随时重启 Jenkins 容器
          -v /var/run/docker.sock:/var/run/docker.sock    # 使容器内的 Jenkins 能与 docker daemon 通信
          jenkins/jenkins
  ```
  - 第一次启动时，终端上会显示一个密钥，用于第一次登陆 Web 端。

## 运行原理

- 用户创建一个任务之后，就可以让 Jenkins 去执行，类似执行 shell 脚本。
- Jenkins 默认将自己的所有数据保存在 `~/.jenkins/` 目录下，因此拷贝该目录就可以备份、迁移 Jenkins 。
  - 如果在启动 Jenkins 之前设置环境变量 `JENKINS_HOME=/opt/jenkins/` ，就可以改变 Jenkins 的主目录。
- Jenkins 每次执行 Job 时，默认会将 `$JENKINS_HOME/workspace/$JOB_NAME` 目录作为工作目录（称为 workspace ）。
  - Jenkins 每次执行 Job 之前、之后都不会自动清空工作目录。
- Jenkins 每次执行 Job 时会在 shell 中加入环境变量 `BUILD_ID=xxxxxx` ，当执行完 Job 之后就自动杀死所有环境变量 BUILD_ID 值与其相同的进程。
  - 在 shell 中设置环境变量 `JENKINS_NODE_COOKIE=dontkillme` 可以阻止 Jenkins 杀死当前 shell 创建的进程。

## 基本用法

- Jenkins 的主页的左上角显示了一列菜单，点击其中的“新建”即可创建一个项目（Project）或任务（Job），常见的几种类型如下：
  - Freestyle ：自由风格，可以通过 Web 页面上的配置实现大多数构建任务。
  - Pipeline ：将项目的处理过程分成多个阶段，依次执行，称为流水线，用 Jenkinsfile 文件描述。
  - Multibranch Pipeline ：多分支流水线，可以对一个 SCM 仓库的多个分支执行流水线。
  - MultiJob ：用于组合调用多个 Job 。可以设置多个阶段（Phase），每个阶段可以串行或并行执行多个 Job 。
  - Folder ：用于对 Job 进行分组管理。
- 新安装的 Jenkins 需要进行一些系统配置，比如添加节点、设置对外的URL
- 点击 "Manage Jenkins" -> "Configure System" 可进行一些系统配置，比如设置 Jenkins 对外的URL、邮箱、全局的环境变量。
- 用户可以将密码等私密数据保存成 Jenkins 的“凭据”，然后在执行 Job 时调用，从而避免泄露明文到终端上。

## 管理节点

- 用户可以添加一些主机作为 Jenkins 的运行环境，称为节点（Node）。
- Jenkins 服务器所在的节点称为 master 节点，用户还可以添加其它 slave 节点，这些节点都可以用于运行 Job 。
- 添加 slave 节点时，一般通过 SSH 方式连接。步骤如下：
  1. 安装“SSH Build Agents”插件。
  2. 在 slave 节点上安装 JDK 。
     建议再创建 jenkins 用户，以便使用 /home/jenkins/ 作为工作目录。或者直接使用 /opt/jenkins/ 作为工作目录。
  3. 将 master 节点的 ~/.ssh/id_rsa.pub 公钥拷贝到 slave 节点的 ~/.ssh/authorized_keys 中。
  4. 在 Jenkins 上创建一个“SSH Username with private key”类型的凭据，填入 master 节点的 ~/.ssh/id_rsa 私钥。
  5. 在 Jenkins 上新建一个节点，选择以“Launch agents via SSH”方式连接。

## 管理权限

安装 Role-based Authorization Strategy 插件之后便可以实现基于角色的用户权限控制。用法：
1. 进入“Manage Jenkins”页面，点击“Manage Users”，创建一个用户账号。
2. 进入“Manage Jenkins”页面，点击“Manage and Assign Roles”->“Manage Roles”，创建角色。
    - 建议创建一个全局角色 visitor ，给予 Overall 的 Read 权限 —— 可以查看 Jenkins 主页，但不能看不见任何 Job 。
    - 创建几个项目角色，分别拥有对不同项目的权限。
    - 项目角色的 pattern 用于通过正则表达式选中多个项目，供他操作。
    - 建议将不同类型的 Job 采用不同的前缀命名，方便通过正则表达式分别匹配。
3. 进入“Manage Jenkins”页面，点击“Assign Roles”，给各个用户分配角色。

管理权限的策略：
- 给每个或每组 Job 创建两种项目角色，按需要分配给各个用户。
  - *_user ：只是使用该 Job ，拥有 Job 的 Build、Cancel、Read 权限。
  - *_admin ：负责管理该 Job ，拥有大部分权限。
- 只有 admin 用户拥有最高权限，比如进行 Jenkins 的系统设置。

## 插件

在“Manage Jenkins”菜单->“Manage Plugins”页面可以管理 Jenkins 的插件。
- 安装、卸载插件时都要手动重启 Jenkins 才会生效。（访问 /restart 页面，会显示一个重启按钮）

一些插件：
- Localization: Chinese (Simplified)
  - 用于对 Jenkins 的页面进行汉化。
- build-metrics
  - 用于统计 Job 的构建次数。
- monitoring
  - 用于查看 Jenkins 的 master 节点的状态，或者统计 Job 的构建时间（安装该插件之后才开始记录）。注意点击 + 号可以显示一些折叠的视图。
- Blue Ocean
  - 提供了对于流水线的一种更美观的操作页面。
- Jenkins Email Extension Plugin
  - 用于让 Jenkins 发送邮件给用户。
  - Jenkins 自带的邮件通知功能比较简陋，因此放弃不用。
- Job Configuration History
  - 用于记录各个 Job 以及系统配置的变更历史。
  - 原理是将每次修改后的 XML 配置文件保存一个副本到 jenkins_home/config-history/ 目录下。
- Disk usage
  - 用于记录各个 Job 占用的磁盘空间。
