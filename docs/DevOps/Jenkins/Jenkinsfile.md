# Jenkinsfile

：一个文本文件，用于描述 Jenkins 的 Pipeline Job ，可以被 Groovy 解释器执行。
- Groovy 是一种基于 JVM 的脚本语言，支持面向对象编程，可以调用 Java 的类库。
- 使用 Jenkinsfile 可以将 Jenkins Web 页面上的大部分配置内容都改为代码描述，更灵活，容易迁移。
- 可以在 Jenkins Web 页面上编写 Jenkinsfile 并保存，不过更推荐保存到项目的代码仓库里，然后被 Jenkins 引用。
- Jenkinsfile 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中，主要内容为 Groovy 代码。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，更推荐使用，本文采用这种写法。
- 所有 Pipeline Job 的 Web 页面中都有一个通往“流水线语法”的链接，点击之后可以查看一些关于 Pipeline 的帮助文档。
  - 比如可以使用“片段生成器”，将通过 Web UI 配置的功能转换成流水线代码。

## 例

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

## agent{}

在 pipeline{} 的开头要定义 agent{} ，表示选择哪个节点来执行流水线，适用于所有 stage{} 。
- 也可以在一个 stage{} 中单独定义该阶段的 agent{} 。
- 常见的几种定义方式：
    ```groovy
    agent {
        agent none       // 不设置全局的 agent ，此时要在每个 stage{} 中单独定义 agent{}
    }
    ```
    ```groovy
    agent {
        agent any       // 让 Jenkins 选择任一节点
    }
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
    ```groovy
    agent {
        docker {        // 运行一个容器
            image 'centos:7'
            label 'jenkins_workspace'
            args  '-v /tmp:/tmp'
        }
    }
    ```

## 使用变量

- 用 `$变量名` 的格式可以读取变量的值。
  - Jenkins 在执行 Jenkinsfile 之前，会先将各个变量名替换成其值（相当于字符串替换）。如果使用的变量尚未定义，则会报出 Groovy 的语法错误 `groovy.lang.MissingPropertyException: No such property` 。

- 可以给 Job 声明构建参数，需要用户在启动 Job 时传入它们（像函数形参）。
  - 其它类型的 Job 只能在 Jenkins Web 页面中定义构建参数，而 Pipeline Job 可以在 pipeline.parameters{} 中以代码的形式定义构建参数。如下：
    ```groovy
    pipeline {
        agent any
        parameters {
            booleanParam(name: 'A', defaultValue: true, description: '')   // 布尔参数
            string(name: 'B', defaultValue: 'Hello', description: '')      // 字符串参数，在 Web 页面上输入时不能换行
            text(name: 'C', defaultValue: 'Hello\nWorld', description: '') // 文本参数，输入时可以换行
            password(name: 'D', defaultValue: '123456', description: '')   // 密文参数，输入时显示成密文
            choice(name: 'E', choices: ['A', 'B', 'C'], description: '')   // 单选参数，输入时显示成下拉框
            file(name: 'F', description: '')                               // 文件参数，输入时显示一个文件上传按钮
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

- 在 environment{} 中可以定义环境变量，它们会被 Jenkind 加入到 shell 的环境变量中。
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
    - 以上 echo 语句、sh 语句中，`$ID`都会被视作 Jenkinsfile 的环境变量取值，如果不存在则报错。
    - 如果要读取 shell 中的变量，则应该执行被单引号包住的 sh 语句。例如：`sh 'ID=2; echo $ID'`
  - 在 environment{} 中可以通过以下方式读取 Jenkins 的一些内置变量：
    ```groovy
    echo "分支名：${env.BRANCH_NAME} ，提交者：${env.CHANGE_AUTHOR} ，版本链接：${env.CHANGE_URL}"
    echo "节点名：${env.NODE_NAME} ，Jenkins主目录：${env.JENKINS_HOME} ，工作目录：${env.WORKSPACE}"
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

## steps{}

在 steps{} 中可以使用以下 DSL 语句：

### echo

：用于显示字符串。
- 例：
    ```groovy
    steps {
        echo 'Hello'
    }
    ```
- 使用字符串时，要用双引号 " 或单引号 ' 包住（除非是纯数字组成的字符串），否则会被当作变量取值。
  - 例如：`echo ID`会被当作`echo "$ID"`执行。
  - 使用三引号 """ 或 ''' 包住时，可以输入换行的字符串。

### sh

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

### bat

：用于执行 CMD 命令。

### build

：触发一个 Job 。
- 例：
    ```groovy
    build (
        job: 'job1',
        parameters: [
            string(name: 'ACTION', value: 'start'),
        ]
    )
    ```

### emailext

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

### parallel

：，用于并行执行一些步骤。
- 只要有一个并行执行的步骤失败了，最终结果就是 Failure 。
- 例：
    ```groovy
    steps {
        parallel '单元测试1': {
            echo '测试中...'
            echo '测试完成'
        },
        '单元测试2': {
            echo '测试中...'
            echo '测试完成'
        }
    }
    ```

### retry

：用于当某段任务执行失败时（不包括语法错误、超时的情况），自动重试。
- 例：
    ```groovy
    retry(3) {       // 加上第一次失败的次数，最多执行 3 次
        sh 'ls /tmp/f1'
    }
    ```

### timeout

：用于设置超时时间。
- 超时之后则放弃执行，并将任务的状态标记成 ABORTED 。
- 例：
    ```groovy
    timeout(time: 3, unit: 'SECONDS') {     // 单位可以是 SECONDS、MINUTES、HOURS
        sh 'ping baidu.com'
    }
    ```

### waitUntil

：用于暂停执行任务，直到满足特定的条件。
- 例：
    ```groovy
    waitUntil {
        fileExists '/tmp/f1'
    }
    ```

### withCredentials

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

### 拉取代码

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

## script{}

在 steps{} 中可以定义 script{} ，用于执行 Groovy 代码。
- 如下是定义一个变量，该变量会在 Groovy 解释器中一直存在，因此在该 script{} 甚至该 stage{} 结束之后依然可以读取，但并不会被 Jenkins 加入到 shell 的环境变量中。
    ```groovy
    steps {
        script {
            A = 1
        }
        echo "$A"
    }
    ```
- 可以将 shell 命令执行后的 stdout 或返回码赋值给变量，如下：
    ```groovy
    script {
        STDOUT = sh(script: 'echo hello', returnStdout: true).trim()
        EXIT_CODE = sh(script: 'echo hello', returnStatus: true)
        echo "$STDOUT"
        echo "$EXIT_CODE"
    }
    ```

## options{}

在 pipeline{} 或 stage{} 中可以定义 options{} ，用于添加一些可选功能。
- 例：
    ```groovy
    options {
        retry(3)
        timestamps()                        // 输出信息到终端时，加上时间戳
        timeout(time: 60, unit: 'SECONDS')
        disableConcurrentBuilds()           // 不允许在同一节点上同时执行其它构建任务
    }
    ```

## triggers{}

在 pipeline{} 中可以定义 triggers{} ，用于在特定情况下自动触发该 Pipeline 。
- 例：
    ```groovy
    triggers {
        cron('H */4 * * 1-5')       // 定期触发
        pollSCM('H */4 * * 1-5')    // 定期检查 SCM 仓库，如果提交了新版本代码则构建一次
    }
    ```

## when{}

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

## input{}

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

## post{}

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
