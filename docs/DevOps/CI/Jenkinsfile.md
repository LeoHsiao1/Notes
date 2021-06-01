# Jenkinsfile

：一个文本文件，用于描述 Jenkins 的 Pipeline Job ，可以被 Groovy 解释器执行。
- 使用 Jenkinsfile 可以将 Jenkins Web 页面上的大部分配置内容都改为代码描述，更灵活，容易迁移。
- 可以在 Jenkins Web 页面上编写 Jenkinsfile 并保存，不过更推荐保存到项目的代码仓库里，然后被 Jenkins 引用。
- Jenkinsfile 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中，主要内容为 Groovy 代码。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，更推荐使用，本文采用这种写法。
- 所有 Pipeline Job 的 Web 页面中都有一个通往 "流水线语法" 的链接，点击之后可以查看一些关于 Pipeline 的帮助文档。
  - 比如可以使用 "片段生成器" ，将通过 Web 表单配置的功能转换成流水线代码。

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
        always {            // 任务结束时总是执行以下操作
            deleteDir()     // 清空全局 agent 的 ${env.WORKSPACE} 目录，但不考虑局部的 agent
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

## 使用变量

- Jenkinsfile 中可以按 `$变量名 ` 的格式读取变量的值。如下：
    ```groovy
    script {
        ID = "1"            // 执行 Groovy 代码，创建变量
        NAME = "man" + ID
        echo NAME
        echo "$ID"          // 普通的 Groovy 语句，以双引号作为定界符时，会读取 Groovy 变量
        echo '$ID'          // 普通的 Groovy 语句，以单引号作为定界符时，关于直接打印字符串 '$ID'
        sh "echo $ID"       // sh 语句，以双引号作为定界符时，会先读取 Groovy 变量，再作为 Shell 命令执行
        sh 'echo $ID'       // sh 语句，以单引号作为定界符时，会直接作为 Shell 命令执行，因此会读取 Shell 变量
    }
    ```
  - 实际上，Jenkins 在执行 Jenkinsfile 之前，会先渲染以双引号作为定界符的字符串，如果其中存在 $ 符号，则尝试对 Groovy 解释器中的变量进行取值。
  - 如果使用的 Groovy 变量不存在，则报出 Groovy 的语法错误 `groovy.lang.MissingPropertyException: No such property` 。
  - 以单引号作为定界符的字符串不会渲染，而是直接使用。

### 环境变量

- 在 environment{} 中可以定义环境变量，它们会保存为 Groovy 变量和 Shell 变量。如下：
  ```groovy
  stage('测试') {
      environment {
          ID = 1
      }
      steps {
          sh "echo $ID"
          sh 'echo $ID'
      }
  }
  ```
  - 定义在 pipeline.environment{} 中的环境变量会作用于全局，而定义在 stage.environment{} 中的只作用于该阶段。

- Jenkins 还提供了一些内置的环境变量，如下：
  ```sh
  NODE_NAME       # 节点名
  JENKINS_HOME    # Jenkins 主目录
  WORKSPACE       # 该 Job 的工作目录

  JOB_NAME        # 任务名
  JOB_URL         # 任务链接
  BUILD_NUMBER    # 构建编号
  BUILD_URL       # 构建链接

  BRANCH_NAME     # 分支名
  CHANGE_AUTHOR   # 版本的提交者
  CHANGE_URL      # 版本的链接
  ```
  - 这些变量的值都是 String 类型。
  - 这些变量可以按以下格式读取：
    ```groovy
    script {
        echo env.NODE_NAME              // 在 Groovy 代码中，通过 env 字典读取
        echo "${env.NODE_NAME}"         // 在字符串中，通过 $ 取值
        sh "echo ${env.NODE_NAME}"
        sh 'echo $NODE_NAME'            // 内置变量会加入 Shell 的环境变量，可以直接读取
    }
    ```
  - 例：修改本次构建的名称
    ```groovy
    script {
        currentBuild.displayName = "#${BUILD_NUMBER}, branch=${BRANCH}"
    }
    ```
    - 不过如果名称过长，显示时会被截断。

- 在 environment{} 中可以导入 Jenkins 的凭据作为环境变量：
  ```groovy
  environment {
      ACCOUNT1 = credentials('account1')
  }
  ```
  假设该凭据是 Username With Password 类型，值为 `admin:123456` ，则 Jenkins 会在 Shell 中加入三个环境变量：
  ```sh
  ACCOUNT1=admin:123456
  ACCOUNT1_USR=admin
  ACCOUNT1_PSW=123456
  ```
  - 读取其它类型的凭据时，建议打印出 Shell 的所有环境变量，从而发现 Jenkins 加入的环境变量的名字。
  - 为了保密，如果直接将上述变量打印到 stdout 上，Jenkins 会将它们的值显示成 `****` 。

### 构建参数

- 可以给 Job 声明构建参数，它们会保存为 Groovy 变量和 Shell 变量。
  - 用户在启动 Job 时，必须传入构建参数，除非它们有默认值。
- Pipeline Job 可以在 pipeline.parameters{} 中以代码的形式定义构建参数，而其它类型的 Job 只能在 Jenkins Web 页面中定义构建参数。如下：
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
  - 对于文件参数，上传的文件会存储到 `${workspace}/${job_name}/f1` 路径处，而用 $f1 可获得上传的文件名。
    - pipeline job 的文件参数功能无效，不能上传文件。可采用以下两种替代方案：
      - 创建一个普通类型的 job ，供用户上传文件，保存到主机的 /tmp 目录下。然后让其它 job 从这里拷贝文件。
      - 在 Jenkins 之外搭建一个文件服务器，供用户上传文件。然后让其它 job 从这里下载文件。这样上传文件时麻烦些，但方便跨主机拷贝文件。
  - 在 shell 命令中调用 text 类型的参数时，可能被注入攻击。比如脚本执行 `ls $file` ，而用户输入构建参数 `file=1;rm -rf /` 。

## agent{}

- 在 pipeline{} 中必须要定义 agent{} ，表示选择哪个节点来执行流水线，适用于所有 stage{} 。
  - 也可以在一个 stage{} 中单独定义该阶段的 agent{} 。
- agent 常见的几种定义方式：
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
        -w /opt/.jenkins/workspace/test_pipeline@2 \    # 因为宿主机上已存在该项目的工作目录了，所以加上后缀 @2 避免同名
        -v /opt/.jenkins/workspace/test_pipeline@2:/opt/.jenkins/workspace/test_pipeline@2:rw,z \
        -e ********                                     # 传入 Jenkins 的环境变量
        centos:7 cat
    ```

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
- echo 语句只能显示 String 类型的值，使用 println 可以显示任意类型的值。
- 使用字符串时，要用双引号 " 或单引号 ' 包住（除非是纯数字组成的字符串），否则会被当作变量取值。
  - 例如：`echo ID` 会被当作 `echo "$ID"` 执行。
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
- 每个 sh 语句会被 Jenkins 保存为一个临时的 x.sh 文件，用 `/bin/bash -ex x.sh` 的方式执行，且切换到该 Job 的工作目录。
  - 因此各个 sh 语句之间比较独立、解耦。
  - 因此会记录下执行的每条 shell 命令及其输出。例如执行以下 sh 语句：
    ```groovy
    sh """
        echo hello 你好         # 建议不要在 sh 语句中通过 echo 命令添加注释，因为该注释会打印一次，执行命令时又会记录一次，而且命令中包含中文时还会转码
        comment=测试开始：       # 建议通过给变量赋值的方式加入注释
        comment=( 测试开始 )     # 赋值为数组类型，则可以加入空格
    """
    ```
    执行后记录的 Console Output 为：
    ```sh
    +echo hello $'\344\275\240\345\245\275'
    hello 你好
    +comment=测试开始：
    +comment=( 测试开始 )
    ```

### bat

：用于执行 CMD 命令。

### build

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

### script

：用于执行 Groovy 代码。
- 可以用赋值号 = 直接创建变量。如下：
    ```groovy
    steps {
        script {
            A = 1
        }
        echo "$A"
    }
    ```
    - 在 script{} 中创建的变量会在 Groovy 解释器中一直存在，因此在该 script{} 甚至该 stage{} 结束之后依然可以读取，但并不会被 Jenkins 加入到 shell 的环境变量中。

- 可以将 shell 命令执行后的 stdout 或返回码赋值给变量，如下：
    ```groovy
    script {
        STDOUT = sh(script: 'echo hello', returnStdout: true).trim()
        EXIT_CODE = sh(script: 'echo hello', returnStatus: true).trim()
        echo "$STDOUT"
        echo "$EXIT_CODE"
    }
    ```
    - .trim() 方法用于去掉字符串末尾的空字符、换行符。

- 例：从 shell 中获得数组并遍历它：
    ```groovy
    script {
        FILE_LIST = sh(script: "ls /", returnStdout: true)
        for (f in FILE_LIST.tokenize("\n")){
            sh "echo $f"
        }
    }
    ```
    - .tokenize() 方法用于将字符串分割成多个字段的数组，并忽略内容为空的字段。

### parallel

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
          usernameVariable: 'USERNAME',   // 将凭据的值存到变量中（如果在终端显示该变量的值，Jenkins 会自动隐藏）
          passwordVariable: 'PASSWORD'
      )]) {
      sh """
          docker login -u ${USERNAME} -p ${PASSWORD} ${image_hub}
      """
  }
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

### 拉取代码

- 例：从 Git 仓库拉取代码
  ```groovy
  git(
      branch: 'master',
      credentialsId: 'credential_for_git',
      url : 'git@g${repository_url}.git'
  )
  ```

- 例：从 SVN 仓库拉取代码
  ```groovy
  script {
      checkout([
          $class: 'SubversionSCM',
          locations: [[
              remote: 'https://svnserver/svn/${repository_url}'
              credentialsId: 'credential_for_svn',
              local: '.',                               // 保存目录，默认是创建一个与 SVN 最后一段路径同名的子目录
              // depthOption: 'infinity',               // 拉取的目录深度，默认是无限深
          ]],
          quietOperation: true,                         // 不显示拉取代码的过程
          workspaceUpdater: [$class: 'UpdateUpdater']   // 使本地目录更新到最新版本
      ])
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
        disableConcurrentBuilds()           // 禁止同时执行该 job
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
