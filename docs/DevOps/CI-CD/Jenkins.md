# Jenkins

：一个流行的 CI/CD 网站，采用 Java 开发。
- [官方文档](https://jenkins.io/zh/doc/)
- 主要用于在 Web 网站上托管各种用途的脚本（称为任务、Job ），供用户执行，实现自动化的项目构建、测试、部署等目标。

## 相关历史

- 2005 年，Sun 公司的 Kohsuke Kawaguchi 发布了一个简单的 CI 网站，名为 Hudson 。
- 2010 年，Oracle 公司收购了 Sun 公司，拥有了 Hudson 的版权。社区被迫将项目改名为 Jenkins ，进行开发。
- 2011 年，Hudson 被交给 Eclipse 基金会管理。但它越来越落后于 Jenkins ，于 2016 年停止开发。

## 部署

- 用 war 包启动：
  1. 安装 JDK 。
  2. 下载 Jenkins 的 war 包。
  3. 启动 Jenkins ：
      ```sh
      java -jar jenkins.war --httpPort=8080
      ```
      - 然后便可以访问其 Web 网站 `http://localhost:8080` 。
      - 首次启动时，终端上会显示一个密钥，用于首次登录 Web 端。

- 或者用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    jenkins:
      container_name: jenkins
      image: jenkins/jenkins:2.289.2-lts
      restart: unless-stopped
      environment:
        JAVA_OPTS: -Duser.timezone=GMT+08
      ports:
        - 8080:8080                                   # 供用户访问 Jenkins 的 Web 页面
        # - 50000:50000                               # 供 JNLP 类型的 agent 访问 Jenkins
      volumes:
        - ./jenkins_home:/var/jenkins_home
        - /var/run/docker.sock:/var/run/docker.sock   # 使容器内的 Jenkins 能与 dockerd 通信
  ```
  - 需要先修改挂载目录的权限：
    ```sh
    mkdir jenkins_home
    chown -R 1000:1000 .
    ```

## 原理

- Jenkins 默认将自己的所有数据保存在 `~/.jenkins/` 目录下，因此拷贝该目录就可以备份、迁移 Jenkins 。
  - 在启动 Jenkins 之前，可以通过设置环境变量 `JENKINS_HOME=/opt/jenkins/` ，改变 Jenkins 的主目录。
- Jenkins 每次执行 Job 时：
  - 会先将该 Job 加入构建队列，如果相应的 node 上有空闲的执行器，则用它执行该 Job ；否则在构建队列中阻塞该 Job ，等待出现空闲的执行器。（阻塞的时间会计入 Job 的持续时长）
  - 默认会将 `$JENKINS_HOME/workspace/$JOB_NAME` 目录作为工作目录（称为 workspace ），且执行 Job 之前、之后都不会自动清空工作目录。
  - 会在 shell 中加入环境变量 `BUILD_ID=xxxxxx` ，当执行完 Job 之后就自动杀死所有环境变量 BUILD_ID 值与其相同的进程。\
    在 shell 中设置环境变量 `JENKINS_NODE_COOKIE=dontkillme` 可以阻止 Jenkins 杀死当前 shell 创建的进程。

## 用法

- 访问 `/restart` 页面，会显示一个重启按钮。
- Jenkins 的 Web 页面上，很多地方都显示了 ？ 图标，点击它就会显示此处的帮助文档。
- 新安装的 Jenkins 需要进行一些系统配置，比如添加节点、设置对外的 URL 。
  - 点击 `Manage Jenkins -> Configure System` 可进行一些系统配置，比如设置 Jenkins 对外的 URL、邮箱、全局的环境变量。
  - 用户可以将密码等私密数据保存成 Jenkins 的凭据，然后在执行 Job 时调用，从而避免泄露明文到终端上。

- Jenkins 的主页默认显示一个视图（view）。
  - 每个视图以列表形式包含多个任务（Job），便于分组管理。

- Jenkins 的主页的左侧显示了菜单列，点击新建按钮，即可创建一个 Job ，常见的几种类型如下：
  - Freestyle Project
    - ：自由风格的项目，可以通过 Web 页面上的配置实现大多数构建任务。
  - Pipeline
    - ：将项目的处理过程分成多个阶段，依次执行，称为流水线，用 Jenkinsfile 文件描述。
  - Multibranch Pipeline
    - ：多分支流水线。用于监听 SCM 仓库的事件，对各个分支分别执行流水线。
    - 需要先将 pipeline 文件保存到每个分支的 SCM 仓库中。
  - MultiJob Project
    - ：用于组合调用多个 Job 。
    - 可以设置多个阶段（Phase），每个阶段可以串行或并行执行多个 Job 。
  - Folder
    - ：用于对 Job 进行分组管理。
    - 此时 Job 的全名为 `<folder>/<job>` ，因此不同 Folder 下的 Job 可以重名。

- Job 的名称会用于组成 URL ，还会用于创建工作目录，因此应该避免包含特殊字符。
  - 可以采用 ` 项目名 _ 模块名 _ Job 类型 _ 环境 ` 的命名格式，比如 `mysite_front_DEPLOY_in_test`
  - 也可以创建多层 Folder ，分组管理 Job ，比如 `mysite / front / DEPLOY_in_test`

- 点击进入一个 Job 的详情页面，如下：

    ![](./jenkins_job.png)

  - 左上角显示：该 Job 的菜单列，比如启动（Build）、配置、删除、重命名。
  - 左下角显示：构建历史（Build History），记录每次执行该 Job 的编号、时间、结果。
  - 中上侧显示：Job 名称、描述信息。
  - 中下侧显示：构建历史中，Job 的每个阶段的耗时，便于用户发现哪个阶段的耗时比较久、哪个阶段失败了。

- 点击某次构建，可查看其详细信息，比如启动原因、持续时长、控制台输出（Console Output）、工作目录（Workspace）。
  - 常见的几种构建结果：
    - success ：执行成功，显示为蓝色。
    - failure ：执行失败，显示为红色。
    - unstable ：不稳定，显示为黄色，比如测试不通过。
    - aborted ：放弃执行，显示为灰色。比如达到超时时间、被用户主动取消。
  - Console Output 中，如果打印一个以 `http://` 开头的字符串，则会自动显示成超链接。

### 管理节点

- 用户可以添加一些主机、Docker 容器作为 Jenkins 的运行环境，称为节点（Node）、代理（agent）、slave 。
  - Jenkins 服务器所在的节点称为 master ，而其它节点称为 slave ，这些节点都可以用于运行 Job 。
  - 在每个节点上，Jenkins 都需要使用一个目录存储数据。可以指定 `/opt/jenkins/` 目录，或者创建 jenkins 用户，然后使用 `/home/jenkins/` 目录。
  - 增加节点有利于实现 Jenkins 的横向扩容。
- 添加 slave 节点时，建议通过 SSH 密钥连接。步骤如下：
  1. 安装 `SSH Build Agents` 插件。
  2. 在 slave 节点上安装 JDK 。
  3. 将 master 节点的 `~/.ssh/id_rsa.pub` 公钥拷贝到 slave 节点的 `~/.ssh/authorized_keys` 中。
  4. 在 Jenkins 上创建一个 `SSH Username with private key` 类型的凭据，填入 master 节点的 `~/.ssh/id_rsa` 私钥。
  5. 在 Jenkins 上添加该节点，选择以 `Launch agents via SSH` 方式连接。
- 当 Jenkins master 通过 SSH 连接到 slave 之后（以 notty 方式连接，不创建终端），会执行 `java -jar remoting.jar`  命令，保持运行一个客户端。
  - master 每次连接 slave 时，不会加载 `/etc/profile` 和 `~/.bash_profile` ，只会加载 `/etc/bashrc` 和 `~/.bashrc` 。
  - 建议在 slave 的配置页面添加 Prefix Start Agent Command ：`source /etc/profile;source ~/.bash_profile;` 。
  - 客户端执行的所有 shell 命令都会继承它的 shell 环境变量。因此，当用户修改 shell 环境变量时，客户端不会自动更新，必须手动将 slave 断开重连。

### 管理权限

安装 `Role-based Authorization Strategy` 插件之后便可以实现基于角色的用户权限控制。用法：
1. 进入 ` 全局安全配置 ` 页面，将授权策略改为 `Role-Based Strategy` 。
2. 进入 `Manage Jenkins -> Manage Users` 页面，创建一个用户账号。
3. 进入 `Manage Jenkins -> Manage and Assign Roles -> Manage Roles` 页面，创建角色。
    - 比如创建一个全局角色 visitor ，给予 Overall 的 Read 权限。即可以查看 Jenkins 主页，但看不到任何 Job 。
    - 比如创建几个项目角色，分别拥有对不同项目的权限。
    - 项目角色的 pattern 用于通过正则表达式选中多个项目，供他操作。
    - 建议将不同类型的 Job 采用不同的前缀命名，便于通过正则表达式分别匹配。
4. 进入 `Manage Jenkins -> Assign Roles` 页面，给各个用户分配角色。
    - 默认只能对 Jenkins 内置数据库中存储的用户进行操作，用户较多时配置很麻烦。建议使用 LDAP 服务器中存储的用户、用户组。

推荐做法：
- 只有 admin 用户拥有最高权限，比如进行 Jenkins 的系统设置。
- Jenkins 只能以 Job 为单位划分权限，因此应该给一个项目开发、测试、正式环境的构建任务分别创建 Job ，而不是通过构建参数选择它们。
  - 虽然这样会产生很多 Job ，但 Job 之间可以相互调用。
- 给每个或每组 Job 创建两种项目角色，按需要分配给各个用户。
  - `*_user` ：只是使用该 Job ，拥有 Job 的 Build、Cancel、Read 权限。
  - `*_editor` ：允许编辑该 Job ，拥有大部分权限。

### 插件

在 `Manage Jenkins -> Manage Plugins` 页面可以管理 Jenkins 的插件。
- 安装、卸载插件时都要手动重启 Jenkins 才会生效，甚至修改了插件的配置之后可能也不会立即生效。

常用插件：
- Localization: Chinese (Simplified)
  - 用于对 Jenkins 的页面进行汉化。
- Blue Ocean
  - 提供了对于流水线的一种更美观的操作页面。
- Extended Choice Parameter
  - 提供了单选框、复选框、单选按钮、多选按钮类型的输入参数。
- Generic Webhook Trigger
  - 支持以 webhook 的方式触发 Jenkins 的 Job ，需要在 Job 的配置页面定义。通过 token 指定 Job ，可以通过请求字符串或 POST body 输入参数，例如：`curl http://10.0.0.1:8080/generic-webhook-trigger/invoke?token=Sqeuu90VF0TE&action=start`
- Email Extension Plugin
  - 支持 Jenkins 发送邮件给用户。
  - Jenkins 自带的邮件通知功能比较简陋，不推荐使用。
- Job Configuration History
  - 用于记录各个 Job 以及系统配置的变更历史。
  - 原理是将每次修改后的 XML 配置文件保存一个副本到 jenkins_home/config-history/ 目录下。

## ♢ jenkinsapi

：Python 的第三方库，用于通过 HTTP 协议调用 Jenkins 的 API 。
- 安装：`pip install jenkinsapi`
- [官方文档](https://jenkinsapi.readthedocs.io/en/latest/)

### 例

- 创建客户端：
  ```py
  from jenkinsapi.jenkins import Jenkins
  
  jk = Jenkins('http://10.0.0.1:8080', username=None, password=None, timeout=10, useCrumb=True)
  ```
  - Jenkins 要求在 POST 请求中包含 Crumb 参数，避免 CSRF 攻击
  
- 查询 job ：
  ```py
  job_names = jk.keys()             # 返回一个包含所有 job 名字的列表
  jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job 名字，job 对象）
  
  job = jk.get_job('test1')         # 根据名字，获取指定的 job 对象，如果不存在则抛出异常
  job.url                           # 返回 job 的 URL
  jk.delete_job('test1')            # 删除一个 job
  ```
  
- job 的配置：
  ```py
  xml = job.get_config()            # 导出 job 的 XML 配置
  job = jk.create_job(jobname, xml) # 创建一个 job
  job.update_config(xml)            # 修改 job 的 XML 配置
  ```
  
- job 的构建：
  ```py
  jk.build_job('test_job', params={'tag': 'v1.0.0'})  # 构建一个 job（按需要发送参数）
  
  b = job.get_build(20)             # 返回指定编号的 build 对象
  b = job.get_last_build()          # 返回最后一次构建的 build 对象
  job.get_next_build_number()       # 返回下一次构建的编号（如果为 1 则说明还没有构建）
  
  b.job.name                        # 返回这次构建所属 job 的名字
  b.get_number()                    # 返回这次构建的编号
  b.get_params()                    # 返回一个字典，包含这次构建的所有参数
  b.stop()                          # 停止构建，如果成功停止则返回 True
  b.is_running()                    # 如果这次构建正在运行，则返回 True
  b.get_status()                    # 返回这次构建的结果，可能是 SUCCESS、FAILURE、ABORTED 等状态，如果仍在构建则返回 None
  b.get_console()                   # 返回这次构建的控制台 stdout
  b.get_timestamp().strftime('%Y/%m/%d-%H:%M:%S')  # 返回开始构建的时间
  b.get_duration().total_seconds()                 # 返回这次构建的耗时，如果仍在构建则返回 0
  ```
