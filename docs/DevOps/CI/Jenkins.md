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
  - 在启动 Jenkins 之前，可以通过设置环境变量 `JENKINS_HOME=/opt/jenkins/` ，改变 Jenkins 的主目录。
- Jenkins 每次执行 Job 时：
  - 会先将该 Job 加入构建队列，如果相应的 node 上有空闲的执行器，则用它执行该 Job ；否则在构建队列中阻塞该 Job ，等待出现空闲的执行器。（阻塞的时间会计入 Job 的持续时长）
  - 默认会将 `$JENKINS_HOME/workspace/$JOB_NAME` 目录作为工作目录（称为 workspace ），不过执行 Job 之前、之后都不会自动清空工作目录。
  - 会在 shell 中加入环境变量 `BUILD_ID=xxxxxx` ，当执行完 Job 之后就自动杀死所有环境变量 BUILD_ID 值与其相同的进程。
    在 shell 中设置环境变量 `JENKINS_NODE_COOKIE=dontkillme` 可以阻止 Jenkins 杀死当前 shell 创建的进程。

## 用法

- 访问 "/restart" 页面，会显示一个重启按钮。
- Jenkins 的 Web 页面上，很多地方都显示了 ？ 图标，点击它就会显示此处的帮助文档。
- Jenkins 的主页的左上角显示了一列菜单，点击其中的“新建”即可创建一个项目（Project）或任务（Job），常见的几种类型如下：
  - Freestyle Project ：自由风格的项目，可以通过 Web 页面上的配置实现大多数构建任务。
  - Pipeline ：将项目的处理过程分成多个阶段，依次执行，称为流水线，用 Jenkinsfile 文件描述。
  - Multibranch Pipeline ：多分支流水线，可以对一个 SCM 仓库的多个分支执行流水线。
  - MultiJob Project ：用于组合调用多个 Job 。可以设置多个阶段（Phase），每个阶段可以串行或并行执行多个 Job 。
  - Folder ：用于对 Job 进行分组管理。
- 新安装的 Jenkins 需要进行一些系统配置，比如添加节点、设置对外的 URL 。
- 点击 "Manage Jenkins" -> "Configure System" 可进行一些系统配置，比如设置 Jenkins 对外的 URL、邮箱、全局的环境变量。
- 用户可以将密码等私密数据保存成 Jenkins 的“凭据”，然后在执行 Job 时调用，从而避免泄露明文到终端上。

### 管理节点

- 用户可以添加一些主机作为 Jenkins 的运行环境，称为节点（Node）。
- Jenkins 服务器所在的节点称为 master 节点，用户还可以添加其它 slave 节点，这些节点都可以用于运行 Job 。
- 添加 slave 节点时，一般通过 SSH 密钥连接。步骤如下：
  1. 安装 “SSH Build Agents” 插件。
  2. 在 slave 节点上安装 JDK 。
     建议再创建 jenkins 用户，以便使用 /home/jenkins/ 作为工作目录。或者直接使用 /opt/jenkins/ 作为工作目录。
  3. 将 master 节点的 ~/.ssh/id_rsa.pub 公钥拷贝到 slave 节点的 ~/.ssh/authorized_keys 中。
  4. 在 Jenkins 上创建一个“SSH Username with private key”类型的凭据，填入 master 节点的 ~/.ssh/id_rsa 私钥。
  5. 在 Jenkins 上新建一个节点，选择以“Launch agents via SSH”方式连接。
- 当 Jenkins master 通过 SSH 连接到 slave 之后（以 notty 方式连接，不创建终端），会执行 java -jar remoting.jar  命令，保持运行一个客户端。
  - master 每次连接 slave 时，不会加载 /etc/profile 和 ~/.bash_profile ，只会加载 /etc/bashrc 和 ~/.bashrc 。因此，需要在 slave 的配置页面添加 refix Start Agent Command ：`source /etc/profile;source ~/.bash_profile;` 。
  - 客户端执行的所有 shell 命令都会继承它的 shell 环境变量。因此，当用户修改 shell 环境变量时，客户端不会自动更新，必须手动将 slave 断开重连。

### 管理权限

安装 Role-based Authorization Strategy 插件之后便可以实现基于角色的用户权限控制。用法：
1. 进入“Manage Jenkins”页面，点击“Manage Users”，创建一个用户账号。
2. 进入“Manage Jenkins”页面，点击“Manage and Assign Roles”->“Manage Roles”，创建角色。
    - 建议创建一个全局角色 visitor ，给予 Overall 的 Read 权限 —— 可以查看 Jenkins 主页，但不能看不见任何 Job 。
    - 创建几个项目角色，分别拥有对不同项目的权限。
    - 项目角色的 pattern 用于通过正则表达式选中多个项目，供他操作。
    - 建议将不同类型的 Job 采用不同的前缀命名，方便通过正则表达式分别匹配。
3. 进入“Manage Jenkins”页面，点击“Assign Roles”，给各个用户分配角色。

推荐做法：
- 给每个或每组 Job 创建两种项目角色，按需要分配给各个用户。
  - *_user ：只是使用该 Job ，拥有 Job 的 Build、Cancel、Read 权限。
  - *_admin ：负责管理该 Job ，拥有大部分权限。
- 只有 admin 用户拥有最高权限，比如进行 Jenkins 的系统设置。

### 插件

在“Manage Jenkins”菜单->“Manage Plugins”页面可以管理 Jenkins 的插件。
- 安装、卸载插件时都要手动重启 Jenkins 才会生效，甚至修改了插件的配置之后可能也不会立即生效。

常用的插件：
- Localization: Chinese (Simplified)
  - 用于对 Jenkins 的页面进行汉化。
- Blue Ocean
  - 提供了对于流水线的一种更美观的操作页面。
- Disk usage
  - 用于统计各个 Project 占用的磁盘空间（不包括 Job ）。
  - 设置 Project 或 Job 的 Discard old builds 策略，可以限制其占用的磁盘空间，比如频繁执行的任务最多保留 14 天日志。不过这会导致统计的总构建次数变少。
- Extended Choice Parameter
  - 提供了单选框、复选框、单选按钮、多选按钮类型的输入参数。
- Generic Webhook Trigger
  - 支持以 webhook 的方式触发 Jenkins 的 Job ，需要在 Job 的配置页面定义。通过 token 指定 Job ，可以通过请求字符串或 POST body 输入参数，例如：`curl http://10.0.0.1:8080/generic-webhook-trigger/invoke?token=Sqeuu90VF0TE&action=start`
- Jenkins Email Extension Plugin
  - 支持 Jenkins 发送邮件给用户。
  - Jenkins 自带的邮件通知功能比较简陋，不推荐使用。
- Job Configuration History
  - 用于记录各个 Job 以及系统配置的变更历史。
  - 原理是将每次修改后的 XML 配置文件保存一个副本到 jenkins_home/config-history/ 目录下。


## Jenkinsfile

：一个文本文件，用于描述 Jenkins 的 Pipeline Job ，可以被 Groovy 解释器执行。
- Groovy 是一种基于 JVM 的脚本语言，支持面向对象编程，可以调用 Java 的类库。
- 使用 Jenkinsfile 可以将 Jenkins Web 页面上的大部分配置内容都改为代码描述，更灵活，容易迁移。
- 可以在 Jenkins Web 页面上编写 Jenkinsfile 并保存，不过更推荐保存到项目的代码仓库里，然后被 Jenkins 引用。
- Jenkinsfile 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中，主要内容为 Groovy 代码。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，更推荐使用，本文采用这种写法。
- 所有 Pipeline Job 的 Web 页面中都有一个通往“流水线语法”的链接，点击之后可以查看一些关于 Pipeline 的帮助文档。
  - 比如可以使用“片段生成器”，将通过 Web UI 配置的功能转换成流水线代码。

### 例

```groovy
pipeline {
    agent {                     // 声明使用的节点
        label 'master'
    }
    environment {               // 定义环境变量
        PORT = '80'
    }
    options {
        timestamps()
        timeout(time: 5, unit: 'MINUTES')
    }
    stages {
        stage('拉取代码') {      // 开始一个阶段
            environment {       // 定义该阶段的环境变量
                GIT_BRANCH = 'dev'
            }
            steps {             // 执行一些步骤
                sh "git checkout $GIT_BRANCH"
                echo '已切换分支'
            }
        }
        stage('构建镜像') {
            steps {
                docker build -t ${image_hub}/${image_project}/${build_image_name}:${build_image_tag} .
                docker push ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
                docker image rm ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
            }
        }
        stage('测试') {
            steps {
                echo '测试中...'
                echo '测试完成'
            }
        }
    }
    post {
        always {
            deleteDir()     // 任务结束时总是清空工作目录
        }
    }
}
```

- 区分大小写。
- 用 // 声明单行注释。
- 每个 {} 的内容不能为空。
- pipeline{} 流水线的主要内容写在 stages{} 中，其中可以定义一个或多个 stage{} ，表示执行的各个阶段。
  - 每个 stage{} 中只能定义一个 steps{} ，表示主要执行的操作步骤。
  - Jenkins 会按先后顺序执行各个 stage{} ，并在 Web 页面上显示执行进度。

### 使用变量

- 用 `$变量名 ` 的格式可以读取变量的值。
- Jenkins 在执行 Jenkinsfile 之前，会先将各个变量名替换成其值（相当于字符串替换）。如果使用的变量尚未定义，则会报出 Groovy 的语法错误 `groovy.lang.MissingPropertyException: No such property` 。

#### 构建参数

可以给 Job 声明构建参数，需要用户在启动 Job 时传入它们（像函数形参）。
- 其它类型的 Job 只能在 Jenkins Web 页面中定义构建参数，而 Pipeline Job 可以在 pipeline.parameters{} 中以代码的形式定义构建参数。如下：
    ```groovy
    pipeline {
        agent any
        parameters {
            booleanParam(name: 'A', defaultValue: true, description: '')   // 布尔参数
            string(name: 'B', defaultValue: 'Hello', description: '')      // 字符串参数，在 Web 页面上输入时不能换行
            text(name: 'C', defaultValue: 'Hello\nWorld', description: '') // 文本参数，输入时可以换行
            password(name: 'D', defaultValue: '123456', description: '')   // 密文参数，输入时会显示成密文
            choice(name: 'E', choices: ['A', 'B', 'C'], description: '')   // 单选参数，输入时会显示成下拉框
            file(name: 'f1', description: '')                              // 文件参数，输入时会显示文件上传按钮
        }
        stages {
            stage('Test') {
                steps {
                    echo "$A"   // 也可通过 $params.A 的格式读取构建参数，避免与环境变量重名
                }
            }
        }
    }
    ```
- 如果定义了 parameters{} ，则会移除在 Jenkins Web 页面中定义的、在上游 Job 中定义的构建参数。
- 每次修改了 parameters{} 之后，要执行一次 Job 才会在 Jenkins Web 页面上生效。
- password 参数虽然在输入时显示成密文，但打印到终端上时会显示成明文，不如 credentials 安全。
- 对于文件参数，上传的文件会存储到 ${workspace}/${job_name}/f1 路径处，而用 $f1 可获得上传的文件名。

#### 环境变量

在 environment{} 中可以定义环境变量，它们会被 Jenkind 加入到 shell 的环境变量中。
- 定义在 pipeline.environment{} 中的环境变量会作用于全局，而定义在 stage.environment{} 中的只作用于该阶段。
- 例：
    ```groovy
    stage('测试') {
        environment {
            ID = 1
            NAME = 'hello'
        }
        steps {
            echo '$ID'
            sh "ID=2; echo $ID"
        }
    }
    ```
- 以上 echo 语句、sh 语句中，`$ID` 都会被视作 Jenkinsfile 的环境变量取值，如果不存在则报错。
- 如果要读取 shell 中的变量，则应该执行被单引号包住的 sh 语句。例如：`sh 'ID=2; echo $ID'`
- 在 environment{} 中可以通过以下方式读取 Jenkins 的一些内置变量：
    ```groovy
    echo "分支名：${env.BRANCH_NAME} ，提交者：${env.CHANGE_AUTHOR} ，版本链接：${env.CHANGE_URL}"
    echo "节点名：${env.NODE_NAME} ，Jenkins 主目录：${env.JENKINS_HOME} ，工作目录：${env.WORKSPACE}"
    echo "任务名：${env.JOB_NAME} ，任务链接：${env.JOB_URL} ，构建编号：${env.BUILD_NUMBER} ，构建链接：${env.BUILD_URL}"
    ```
- 在 environment{} 中可以通过以下方式读取 Jenkins 的凭据：
    ```groovy
    environment {
        ACCOUNT1 = credentials('account1')
    }
    ```
    假设该凭据是 Username With Password 类型，值为“admin:123456”，则 Jenkins 会在 shell 中加入三个环境变量：
    ```sh
    ACCOUNT1=admin:123456
    ACCOUNT1_USR=admin
    ACCOUNT1_PSW=123456
    ```
    读取其它类型的凭据时，建议打印出 shell 的所有环境变量，从而发现 Jenkins 加入的环境变量的名字。
    为了保密，如果直接将上述变量打印到 stdout 上，Jenkins 会将它们的值显示成 `****` 。

### agent{}

在 pipeline{} 中必须要定义 agent{} ，表示选择哪个节点来执行流水线，适用于所有 stage{} 。
- 也可以在一个 stage{} 中单独定义该阶段的 agent{} 。
- 常见的几种 agent 定义方式：
    ```groovy
    agent none          // 不设置全局的 agent ，此时要在每个 stage{} 中单独定义 agent{}
    ```
    ```groovy
    agent any           // 让 Jenkins 选择任一节点
    ```
    ```groovy
    agent {
        label 'master'  // 选择指定名字的节点
    }
    ```
    ```groovy
    agent {
        node {          // 选择指定名字的节点，并指定工作目录
            label 'master'
            customWorkspace '/opt/jenkins_home/workspace/test1'
        }
    }
    ```
- 可以临时创建 docker 容器作为 agent ：
    ```groovy
    agent {
        docker {
            // label 'master'
            image 'centos:7'
            // args  '-v /tmp:/tmp'
        }
    }
    ```
    - 这会在指定节点（默认是 master 节点）上创建一个 docker 容器，执行 pipeline ，然后自动删除该容器。
    - 该容器的启动命令的格式如下：
        ```sh
        docker run -t -d -u 1000:1000 \
            -w /opt/.jenkins/workspace/test_pipeline@2 \        // 因为宿主机上已存在该项目的工作目录了，所以加上后缀 @2 避免同名
            -v /opt/.jenkins/workspace/test_pipeline@2:/opt/.jenkins/workspace/test_pipeline@2:rw,z \
            -e ********                                         // 传入 Jenkins 的环境变量
            centos:7 cat
        ```

### steps{}

在 steps{} 中可以使用以下 DSL 语句：

#### echo

：用于显示字符串。
- 例：
    ```groovy
    steps {
        echo 'Hello'
    }
    ```
- 使用字符串时，要用双引号 " 或单引号 ' 包住（除非是纯数字组成的字符串），否则会被当作变量取值。
  - 例如：`echo ID` 会被当作 `echo "$ID"` 执行。
  - 使用三引号 """ 或 ''' 包住时，可以输入换行的字符串。

#### sh

：用于执行 shell 命令。
- 例：
    ```groovy
    steps {
        sh "echo Hello"
        sh 'echo World'
        sh """
            A=1
            echo $A     // 这会读取 Groovy 解释器中的变量 A
        """
        sh '''
            A=1
            echo $A     // 这会读取 shell 中的变量 A
        '''
    }
    ```
- 每个 sh 语句会被 Jenkins 保存为一个临时的 x.sh 文件，用 `/bin/bash -ex x.sh` 的方式执行，且切换到该 Job 的工作目录。因此各个 sh 语句之间比较独立、解耦。

#### bat

：用于执行 CMD 命令。

#### build

：触发一个 Job 。
- 例：
    ```groovy
    build (
        job: 'job1',
        parameters: [
            string(name: 'AGENT', value: 'master'),  // 这里的 string 是指输入值的类型，可输入给大部分类型的 parameters
        ]
    )
    ```
- 一个 Job 可以不指定 agent 、不执行具体命令，只是调用另一个 Job 。

#### emailext

：用于发送邮件。
- 需要先在 Jenkins 系统配置中配置 SMTP 服务器。
- 例：
    ```groovy
    emailext (
        subject: "[${currentBuild.fullDisplayName}]已构建，结果为${currentBuild.currentResult}",
        to: '123456@email.com',
        from: "Jenkins <123456@email.com>",
        body: """
            任务名：${env.JOB_NAME}
            任务链接：${env.JOB_URL}
            构建编号：${env.BUILD_NUMBER}
            构建链接：${env.BUILD_URL}
            构建耗时：${currentBuild.duration} ms
        """
    )
    ```

#### parallel

：用于并行执行一些步骤。
- 只要有一个并行执行的步骤失败了，最终结果就是 Failure 。
- 例：
    ```groovy
    steps {
        parallel '单元测试 1': {
            echo '测试中...'
            echo '测试完成'
        },
        '单元测试 2': {
            echo '测试中...'
            echo '测试完成'
        }
    }
    ```

#### retry

：用于当某段任务执行失败时（不包括语法错误、超时的情况），自动重试。
- 例：
    ```groovy
    retry(3) {       // 加上第一次失败的次数，最多执行 3 次
        sh 'ls /tmp/f1'
    }
    ```

#### timeout

：用于设置超时时间。
- 超时之后则放弃执行，并将任务的状态标记成 ABORTED 。
- 例：
    ```groovy
    timeout(time: 3, unit: 'SECONDS') {     // 单位可以是 SECONDS、MINUTES、HOURS
        sh 'ping baidu.com'
    }
    ```

#### waitUntil

：用于暂停执行任务，直到满足特定的条件。
- 例：
    ```groovy
    waitUntil {
        fileExists '/tmp/f1'
    }
    ```

#### withCredentials

：用于调用 Jenkins 的凭据。
- 例：
    ```groovy
    withCredentials([
        usernamePassword(
            credentialsId: 'credential_1',
            usernameVariable: 'USERNAME',   // 将凭据的值存到变量中
            passwordVariable: 'PASSWORD'
        )]) {
        sh """
            set -eu
            set +x      # 避免密码被打印到终端上
            docker login -u ${USERNAME} -p ${PASSWORD} ${image_hub}
        """
    }
    ```

#### 拉取代码

- 例：从 Git 仓库拉取代码
    ```groovy
    git(
        branch: 'master',
        credentialsId: 'credential_1',
        url : 'git@github.com/${repository}.git'
    )
    ```

- 例：从 SVN 仓库拉取代码
    ```groovy
    script {
        checkout([
            $class: 'SubversionSCM',
            locations: [[
                remote: 'https://svnserver/svn/${repository}'
                credentialsId: 'credential_2',
                local: '.',
                depthOption: 'infinity',
                ignoreExternalsOption: true,
                cancelProcessOnExternalsFail: true,
            ]],
            quietOperation: true,
            workspaceUpdater: [$class: 'UpdateUpdater']
        ])
    }
    ```

### script{}

在 steps{} 中可以定义 script{} ，用于执行 Groovy 代码。
- 可以用赋值号 = 直接创建变量。如下：
    ```groovy
    steps {
        script {
            A = 1
        }
        echo "$A"
    }
    ```
    该变量会在 Groovy 解释器中一直存在，因此在该 script{} 甚至该 stage{} 结束之后依然可以读取，但并不会被 Jenkins 加入到 shell 的环境变量中。

- 可以将 shell 命令执行后的 stdout 或返回码赋值给变量，如下：
    ```groovy
    script {
        STDOUT = sh(script: 'echo hello', returnStdout: true).trim()
        EXIT_CODE = sh(script: 'echo hello', returnStatus: true).trim()
        echo "$STDOUT"
        echo "$EXIT_CODE"
    }
    ```
    .trim() 方法用于去掉字符串末尾的空字符、换行符。

- 例：从 shell 中获得数组并遍历它：
    ```groovy
    script {
        FILE_LIST = sh(script: "ls /", returnStdout: true)
        for (f in FILE_LIST.tokenize("\n")){
            sh "echo $f"
        }
    }
    ```
    .tokenize() 方法用于将字符串分割成多个字段的数组，并忽略内容为空的字段。

### options{}

在 pipeline{} 或 stage{} 中可以定义 options{} ，用于添加一些可选功能。
- 例：
    ```groovy
    options {
        retry(3)
        timestamps()                        // 输出信息到终端时，加上时间戳
        timeout(time: 60, unit: 'SECONDS')
        disableConcurrentBuilds()           // 禁止同时执行该 job
    }
    ```

### triggers{}

在 pipeline{} 中可以定义 triggers{} ，用于在特定情况下自动触发该 Pipeline 。
- 例：
    ```groovy
    triggers {
        cron('H */4 * * 1-5')       // 定期触发
        pollSCM('H */4 * * 1-5')    // 定期检查 SCM 仓库，如果提交了新版本代码则构建一次
    }
    ```

### when{}

在 stage{} 中可以定义 when{} ，用于限制在特定条件下才执行该阶段。
- 不满足 when{} 的条件时会跳过该阶段，但并不会导致执行结果为 Failure 。
- 常见的几种定义方式：
    ```groovy
    when {
        environment name: 'A', value: '1'  // 当环境变量等于指定值时
    }
    ```
    ```groovy
    when {
        branch 'dev'            // 当分支为 dev 时（仅适用于多分支流水线）
    }
    ```
    ```groovy
    when {
        expression {            // 当 Groovy 表达式为 true 时
            return params.A
        }
    }
    ```
    ```groovy
    when {
        not {                   // 当子条件为 false 时
            environment name: 'A', value: '1'
        }
    }
    ```
    ```groovy
    when {
        allOf {                 // 当子条件都为 true 时
            environment name: 'A', value: '1'
            environment name: 'B', value: '2'
        }
        branch 'dev'            // 默认就可以包含多个条件，相当于隐式的 allOf{}
    }
    ```
    ```groovy
    when {
        anyOf {                 // 当子条件只要有一个为 true 时
            environment name: 'A', value: '1'
            environment name: 'B', value: '2'
        }
    }
    ```

### input{}

在 stage{} 中可以定义 input{} ，用于暂停任务，等待用户输入某些参数。
- 例：
    ```groovy
    input {
        message '等待输入...'
        ok '确定'
        submitter 'admin, ops'  // 限制有输入权限的用户
        parameters {            // 等待用户输入以下参数
            string(name: 'NODE', defaultValue: 'master', description: '部署到哪个节点？')
        }
    }
    ```

### post{}

在 pipeline{} 或 stage{} 中可以定义 post{} ，用于处理 Pipeline 的各种构建结果。
- 例：
    ```groovy
    pipeline {
        agent any
        stages {
            stage('Test') {
                steps {
                    echo 'testing ...'
                }
            }
        }
        post {
            always {
                echo '任务结束，'
            }
            changed {
                echo '执行结果与上一次不同'
            }
            success {
                echo '执行成功'
            }
            failure {
                echo '执行失败'
            }
            unstable {
                echo '执行状态不稳定'
            }
            aborted {
                echo '放弃执行'
            }
        }
    }
    ```
- pipeline 出现语法错误时，Jenkins 会直接报错，而不会执行 post 部分。

## ♢ jenkinsapi

：Python 的第三方库，用于通过 HTTP 协议调用 Jenkins 的 API 。
- 安装：pip install jenkinsapi

### 例

创建客户端：
```py
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("http://10.0.0.1:8080", username=None, password=None)
```

查询 job ：
```py
job_names = jk.keys()             # 返回一个包含所有 job 名字的列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job 名字，job 对象）

job = jk.get_job("test1")         # 根据名字，获取指定的 job 对象，如果不存在则抛出异常
job.url                           # 返回 job 的 URL
jk.delete_job("test1")            # 删除一个 job
```

job 的配置：
```py
xml = job.get_config()            # 导出 job 的 XML 配置
job = jk.create_job(jobname, xml) # 创建一个 job
job.update_config(xml)            # 修改 job 的 XML 配置
```

job 的构建：
```py
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
