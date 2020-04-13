# Jenkins

：一个流行的 CI/CD 平台，常用于项目构建、测试、部署。
- 基于 Java 开发，提供了 Web 操作页面。
- [官方文档](https://jenkins.io/zh/doc/)

## 启动

- 用 war 包启动：
  1. 下载 Jenkins 的 war 包。
  2. 安装 JDK 。
  3. 执行 `java -jar jenkins.war --httpPort=8080` 启动 Jenkins ，然后便可以访问其 Web 网站 `http://localhost:8080` 。

- 用 Docker 启动：
  ```sh
  mkdir /var/jenkins_home
  docker run -d \
          -p 8080:8080                                    # Jenkins 的 Web 端的访问端口
          -p 50000:50000                                  # 供 Jenkins 代理访问的端口
          -v /var/jenkins_home:/var/jenkins_home          # 挂载 Jenkins 的数据目录，从而可以随时重启 Jenkins 容器
          jenkins/jenkins
  ```
  - 第一次启动时，终端上会显示一个密钥，用于第一次登陆 Web 端。

## 用法

- Jenkins 的主页的左上角显示了一列菜单，点击其中的“新建”即可创建一个项目（Project）或任务（Job），常见的几种类型如下：
  - Freestyle ：自由风格的项目，可以实现大多数构建任务。
  - Pipeline ：将项目的处理过程分成多个阶段，依次执行，称为流水线。适合一次性执行整个 CI/CD 流程。
  - MultiJob ：用于组合调用多个 Job 。可以设置多个阶段（Phase），每个阶段可以串行或并行执行多个 Job 。
  - Folder ：用于对 Job 进行分组管理。
- 用户可以添加一些主机作为 Jenkins 的运行环境。
- 用户可以将密码等私密数据保存成 Jenkins 的“凭证”。
- Jenkins 默认把自己的所有数据保存在 `~/.jenkins/` 目录下，拷贝该目录就可以备份、迁移 Jenkins 。
  - 如果在启动 Jenkins 之前设置环境变量 `JENKINS_HOME=/opt/jenkins/` ，就可以改变 Jenkins 的主目录。

### 管理节点

- Jenkins 服务器所在的节点称为 master 节点，用户还可以添加其它 slave 节点，这些节点都可以用于运行 Job 。
- 添加 slave 节点时，一般通过 SSH 方式连接。
  - 需要安装“SSH Build Agents”插件。
  - 建议在 slave 节点上创建 jenkins 用户，使用 /home/jenkins/ 作为工作目录。或者直接使用 /opt/jenkins/ 作为工作目录。

### 管理权限

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

### 插件

在“Manage Jenkins”菜单->“Manage Plugins”页面可以管理 Jenkins 的插件。
- 安装、卸载插件时都要重启 Jenkins 才会生效。（访问 /restart 页面，会显示一个重启按钮）

一些插件：
- Localization: Chinese (Simplified)
  - 用于对 Jenkins 的页面进行汉化。
- build-metrics
  - 用于统计 Job 的构建次数。
- monitoring
  - 用于查看 Jenkins 的 master 节点的状态，或者统计 Job 的构建时间（安装该插件之后才开始记录）。注意点击 + 号可以显示一些折叠的视图。
- Blue Ocean
  - 提供了一种更美观的 Pipeline 管理页面。

## Jenkinsfile

：一个文本文件，用于描述 Pipeline 类型的 Job ，采用 Groovy 语法。
- 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，更推荐使用。
- 该文件可以保存在 Jenkins 里，也可以保存到项目的代码仓库中，被 Jenkins 引用。

### 例

```groovy
pipeline {
    agent {
        label "cvm1"    // 选择一个主机来工作
        // agent any    // 让 Jenkins 选择任一主机
    }
    environment {       // 定义全局的环境变量
        PORT = "80"
    }
    stages {

        stage("git clone") {    // 开始一个阶段
            environment {       // 定义该阶段的环境变量
                PORT = "8000"
                GIT_BRANCH = "master"
            }
            steps {             // 执行一些步骤
                echo "git clone..."
                git(
                    branch: "master",
                    credentialsId: "${git_credentialsid}",  // 使用 git 凭证
                    url : "git@${script_path}${service}.git"
                )
                sh "git checkout $tag"
            }
        }

        stage("build") {
            steps {
                docker build -t ${image_hub}/${image_project}/${build_image_name}:${build_image_tag} .
                docker login -u ${hub_user} -p ${hub_password} ${image_hub}
                docker push ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
                docker image rm ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
            }
        }

        stage("测试") {
            steps {
                parallel "单元测试": {    // 并行执行
                    echo "单元测试中..."
                    echo "单元测试完成"
                }, "接口测试": {
                    echo "接口测试中..."
                    echo "接口测试完成"
                }
            }
        }
    }
}
```

用 `sh "command"` 的格式可以执行 shell 命令。
- 每个 sh 语句会被 Jenkins 保存为一个临时的 .sh 文件，用 /bash/sh x.sh 来执行。因此每个 sh 语句都是在一个独立的子 shell 被执行。
- 例：`sh "a=1; echo $a"`
  - 命令中的 `$a` 会被当做 Jenkinsfile 的环境变量替换（如果不存在则报错）。
  - 如果要读取 shell 中的变量，则应该使用单引号，比如：sh 'a=1; echo $a'

使用变量的方式：
- 环境变量：在 environment{} 中定义，用 $ 获取变量的值。
  - Jenkins 在执行 Jenkinsfile 之前，会先把各个变量名替换成其值（相当于字符串替换）。如果找不到某个变量的值，则 Groovy 报出语法错误。
- 外部变量：从外部传入。又称为构建参数。

## ♢ jenkinsapi

：Python 的第三方库，用于调用 Jenkins 的 API 。
- 安装：pip install jenkinsapi

### 例

创建客户端：
```python
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("http://10.0.0.1:8080", username=None, password=None)
```

查询 job ：
```python
job_names = jk.keys()             # 返回一个包含所有 job 名字的列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job 名字，job 对象）

job = jk.get_job("test1")         # 根据名字，获取指定的 job 对象，如果不存在则抛出异常
job.url                           # 返回 job 的 URL
jk.delete_job("test1")            # 删除一个 job
```

job 的配置：
```python
xml = job.get_config()            # 导出 job 的 XML 配置
job = jk.create_job(jobname, xml) # 创建一个 job
job.update_config(xml)            # 修改 job 的 XML 配置
```

job 的构建：
```python
jk.build_job("test_job", params={"tag":"v1.0.0"}) # 构建一个 job（按需要发送参数）

b = job.get_build(20)        # 返回指定编号的 build 对象
b = job.get_last_build()     # 返回最后一次构建的 build 对象
job.get_next_build_number()  # 返回下一次构建的编号（如果为 1 则说明还没有构建）

b.job.name                   # 返回这次构建所属 job 的名字
b.get_number()               # 返回这次构建的编号
b.get_params()               # 返回一个字典，包含这次构建的所有参数
b.stop()                     # 停止构建，如果成功停止则返回 True
b.is_running()               # 如果这次构建正在运行，则返回 True
b.get_status()               # 返回这次构建的结果，可能是 SUCCESS、FAILURE、ABORTED 等状态，如果仍在构建则返回 None
b.get_console()              # 返回这次构建的控制台 stdout
b.get_timestamp().strftime("%Y/%m/%d-%H:%M:%S")  # 返回开始构建的时间
b.get_duration().total_seconds()                 # 返回这次构建的耗时，如果仍在构建则返回 0
```
