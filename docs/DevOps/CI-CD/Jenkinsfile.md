# Jenkinsfile

：一个文本文件，用于描述 Jenkins 的 Pipeline Job ，可以被 Groovy 解释器执行。
- 在 Jenkins 上编辑 Job 时，可以通过 Web 表单填写多种配置参数。
  - 使用 Jenkinsfile 时，可以将大部分 Web 表单的配置参数用代码描述，更灵活，容易迁移。
  - 每执行一次 Jenkinsfile ，Jenkins 会自动识别其中的配置参数，导入相应的 Web 表单中，实现向下兼容。
    - 不过，有的配置参数是 Jenkinsfile 独有的，不支持导入。
- Jenkinsfile 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中，内容为可执行的 Groovy 脚本。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，内容为声明式的语句。本文采用这种写法。
- 所有 Pipeline Job 的 Web 页面中都有一个名为 "流水线语法" 的链接，点击之后可以查看一些关于 Pipeline 的帮助文档。
  - 比如可以使用 "片段生成器" ，将 Web 表单中的配置参数转换成流水线代码。

## 示例

```groovy
pipeline {
    agent {                     // 声明使用的节点
        label 'master'
    }
    environment {               // 定义环境变量
        GIT_REPO = 'https://github.com/xx'
    }
    options {
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
    }
    stages {
        stage('拉取代码') {      // 开始一个阶段
            environment {       // 定义该阶段的环境变量
                BRANCH = 'master'
            }
            steps {             // 该阶段需要执行一些步骤
                sh """
                    git clone $GIT_REPO
                    git checkout $BRANCH"
                """
            }
        }
        stage('构建镜像') {
            steps {
                sh '''
                    IMAGE=${image_hub}/${image_project}/${image_name}:${image_tag}
                    docker build . -t $IMAGE
                    docker push $IMAGE
                    docker image rm $IMAGE
                '''
            }
        }
    }
    post {
        always {            // 任务结束时总是执行以下操作
            deleteDir()     // 递归地删除当前目录。这里是作用于当前 agent 的 ${env.WORKSPACE} 目录
        }
    }
}
```
- 用 // 声明单行注释。
- 每个 {} 的内容不能为空。

## 变量

Pipeline 中可以创建多种变量，比如 Groovy 变量、Shell 变量。

### Groovy变量

- 在 script{} 中可以执行 Groovy 代码，创建变量：
  ```groovy
  script {
      ID = "1"            // 创建变量
      NAME = "man" + ID   // 拼接字符串
      echo NAME           // 打印 Groovy 变量
      echo "$ID"          // 字符串定界符为双引号时，支持用 $ 插入变量或表达式的值
      echo '$ID'          // 字符串定界符为双引号时，不支持用 $ 取值
  }
  ```
  - 在 script{} 中创建的变量会在 Groovy 解释器中一直存在，因此在当前 script{} 或 stage{} 结束之后依然可以读取。
  - Groovy 语言中，字符串的定界符为双引号时，支持用 `$var` 或 `${expression}` 的格式，插入变量或表达式的值。
    - 如果通过 `$A` 格式读取的变量不存在，则会抛出 Groovy 的语法异常：`groovy.lang.MissingPropertyException: No such property`
    - 如果通过 `${env.A}` 格式读取的变量不存在，则会返回 null ，不会报错。
    - 如果想让 Groovy 将字符串中的 `$` 当作普通字符处理，则需要以单引号作为字符串定界符，或者使用转义字符 `\$` 。
  - Jenkinsfile script{} 中创建的 Groovy 变量名区分大小写，但 environment、parameters 变量名不区分大小写，不过它们加入 shell 环境变量时会区分大小写。

### Shell变量

- 每次执行 sh 语句时，Jenkins 会将 Groovy 解释器中的 env、params 字典中的所有变量，加入 Shell 环境变量，因此可以在 Shell 中读取。例：
  ```groovy
  script {
      echo env.NODE_NAME          // 在 Groovy 代码中，通过 env 字典读取
      echo "${env.NODE_NAME}"     // 在字符串中，通过 $ 取值

      sh "echo ${env.NODE_NAME}"
      sh 'echo $NODE_NAME'

      A = 'Hello'                 // 创建 Groovy 变量，可以在 Groovy 脚本中读取，但不会加入 Shell 环境变量
      env.A = 'Hello'             // 可以直接在 env 字典中添加变量，从而加入 Shell 环境变量
  }
  ```
  - 调试时，可以在 Shell 中执行 `env` ，打印所有 Shell 环境变量。

- 普通的 Groovy 变量不会加入 Shell 环境变量，除非执行 withEnv() 语句。例：
  ```groovy
  script {
      ID = "1"
      sh "echo $ID"   // 字符串定界符为双引号，因此会读取一个名为 ID 的 Groovy 变量，然后执行 sh 命令
      sh 'echo $ID'   // 字符串定界符为单引号，因此会读取一个名为 ID 的 Shell 变量，会发现不存在
  }
  ```

### environment

- 在 environment{} 中可以定义环境变量，这些变量首先会保存为 Groovy 变量，其次会加入 env 字典。例：
  ```groovy
  stage('测试') {
      environment {
          ID = 1
      }
      steps {
          echo ID         // 读取 Groovy 变量
          echo env.ID     // 读取 env 字典中的变量
          echo "$ID"
          sh "echo $ID"   // 执行 sh 语句，字符串定界符为双引号时，会先在 Groovy 解释器中根据 $ 读取变量，再将字符串作为 Shell 命令执行
          sh 'echo $ID'   // 执行 sh 语句，字符串定界符为单引号时，会直接作为 Shell 命令执行，因此 $ 会读取 Shell 变量
      }
  }
  ```
  - 定义在 pipeline.environment{} 中的环境变量会作用于 pipeline 全局。而定义在 stage.environment{} 中的只作用于当前 stage ，在当前 stage 结束之后会自动删除。
  - 还可以在 Jenkins 系统配置页面，定义作用于所有 Job 的环境变量。或者启用 Folder Properties 插件，在 Job 文件夹中定义环境变量。
  - 如果给 environment 变量赋值为空，则会自动删除该变量。

### parameters

- 可以通过 params 字典读取 Pipeline 的构建参数。如下：
  ```sh
  params.A
  params.B
  ```

- 用户启动 Job 时，必须传入构建参数，除非 Job 未定义构建参数，或者构建参数有默认值。
  - Pipeline 类型的 Job 可以在 parameters{} 中以代码的形式定义构建参数，而其它类型的 Job 只能在 Jenkins Web 页面中定义构建参数。
  - Pipeline 只支持定义 pipeline.parameters{} ，不支持定义 stage.parameters{} 。

- 在 parameters{} 中可以定义构建参数，这些变量首先会保存为 Groovy 变量，其次会加入 params 字典。例：
  ```groovy
  pipeline {
      agent any
      parameters {
          booleanParam(name: 'B', defaultValue: true, description: '')   // 布尔参数
          choice(name: 'C', choices: ['A', 'B', 'C'], description: '')   // 单选参数，输入时会显示成下拉框
          string(name: 'S', defaultValue: 'Hello', description: '')      // 字符串参数，在 Web 页面上输入时不能换行
          text(name: 'T', defaultValue: 'Hello\nWorld', description: '') // 文本参数，输入时可以换行
          password(name: 'P', defaultValue: '123456', description: '')   // 密文参数，输入时会显示成密文
          file(name: 'F', description: '')                               // 文件参数，输入时会显示文件上传按钮
      }
      stages {
          stage('Test') {
              steps {
                  echo B
                  echo "$B"
                  echo params.B
              }
          }
      }
  }
  ```
  - 如果定义了 parameters{} ，则会移除在 Jenkins Web 页面中定义的、在上游 Job 中定义的构建参数。
  - 每次修改了 parameters{} 之后，要执行一次 Job 才会在 Jenkins Web 页面上生效。
  - password 类型的参数虽然在输入时显示成密文，但打印到终端上时会显示成明文，不如 Jenkins 的 credentials 安全。
  - file 类型的参数上传的文件会存储到 `${workspace}/${job_name}/f1` 路径处，而用 `$f1` 可获得上传的文件名。
    - pipeline job 的文件参数功能无效，不能上传文件。可采用以下两种替代方案：
      - 创建一个普通类型的 job ，供用户上传文件，保存到主机的 /tmp 目录下。然后让其它 job 从这里拷贝文件。
      - 在 Jenkins 之外搭建一个文件服务器，供用户上传文件。然后让其它 job 从这里下载文件。这样上传文件时麻烦些，但方便跨主机拷贝文件。

- 在 shell 命令中调用构建参数时，可能被注入攻击。
  - 比如脚本执行 `ls $file` ，而用户输入构建参数 `file=a;rm -rf *` 就会注入攻击。
  - 如果让用户输入 booleanParam、choice 类型的构建参数，则在 Web 页面上只能选择有限的值。
    - 即使用户通过 HTTP API 输入构建参数，Jenkins 也会自动检查参数的值是否合法。如果不合法，则采用该参数的默认值。
  - 如果让用户输入 string、text 类型的构建参数，则应该过滤之后再调用。如下：
    ```groovy
    parameters {
        string(name: 'file')
    }
    environment {
        file = file.replaceAll('[^\\w /:,.*_-]', '_').trim()    // 将构建参数替换特殊字符，然后赋值给一个环境变量
    }
    ```

### 内置变量

- env 字典除了用户添加的 environment 变量，还有一些 Jenkins 内置变量，例如：
  ```sh
  env.JENKINS_HOME    # Jenkins 部署的主目录
  env.NODE_NAME       # 节点名
  env.WORKSPACE       # 在当前节点上的工作目录

  env.JOB_NAME        # 任务名
  env.JOB_URL         # 任务链接
  env.BUILD_NUMBER    # 构建编号
  env.BUILD_URL       # 构建链接

  env.BRANCH_NAME     # 分支名
  env.CHANGE_AUTHOR   # 版本的提交者
  env.CHANGE_URL      # 版本的链接
  ```
  - 这些变量的值都是 String 类型。

- 可以通过 currentBuild 字典获取当前的构建信息。如下：
  ```sh
  currentBuild.buildCauses       # Build 的执行原因，返回一个字典，包括 userId、userName 等
  currentBuild.displayName       # Build 的名称，格式为 #number
  currentBuild.fullDisplayName   # Build 的全名，格式为 JOB_NAME #number
  currentBuild.description       # Build 的描述，默认为 null
  currentBuild.duration          # Build 的持续时长，单位 ms
  currentBuild.result            # Build 的结果。如果构建尚未结束，则返回值为 null
  currentBuild.currentResult     # Build 的当前状态。开始执行时为 SUCCESS ，受每个 stage 影响，不会变为 null
  ```
  - 只有 displayName、description 变量支持修改。修改其它变量时会报错：`RejectedAccessException: No such field`
  - 例：
    ```groovy
    script {
        jenkins_user = "${currentBuild.buildCauses}".findAll('userName:([^,\\]]+)')[0].replaceAll('userName:', '')
        currentBuild.displayName = "#${env.BUILD_NUMBER}    $jenkins_user"
        currentBuild.description = "BRANCH=${env.BRANCH}"
    }
    ```

## agent{}

：用于控制在哪个 Jenkins 代理上执行流水线。
- 可用范围：
  - 在 pipeline{} 中必须定义 agent{} ，作为所有 stage{} 的默认代理。
  - 在单个 stage{} 中可选定义 agent{} ，只作用于该阶段。
- agent 常见的几种定义格式：
  ```groovy
  agent none          // 不设置全局的 agent ，此时要在每个 stage{} 中单独定义 agent{}
  ```
  ```groovy
  agent any           // 让 Jenkins 选择任一代理
  ```
  ```groovy
  agent {
      label 'master'  // 选择指定名字的代理
  }
  ```
  ```groovy
  agent {
      node {          // 选择指定名字的代理，并指定工作目录
          label 'master'
          customWorkspace '/opt/jenkins_home/workspace/test1'
      }
  }
  ```

### docker

- 可以创建临时的 docker 容器作为 agent ：
  ```groovy
  agent {
      docker {
          // label 'master'
          // customWorkspace "/opt/jenkins_home/workspace/test1"
          image 'centos:7'
          // args  '-v /tmp:/tmp'
      }
  }
  ```
  - 这会在指定节点上创建一个 docker 容器，执行 pipeline ，然后自动删除该容器。
  - 该容器默认的启动命令如下：
    ```sh
    docker run -t -d \
        -u 0:0 \                                    # 默认会设置容器内用户为 root
        -w /opt/jenkins/workspace/test_pipeline \   # 默认会自动挂载 workspace 目录，并将其设置为容器的工作目录
        -v /opt/jenkins/workspace/test_pipeline:/opt/jenkins/workspace/test_pipeline:rw,z \
        -e ******** -e ******** -e ******** \       # 默认会传入 Jenkins 的环境变量
        centos:7 cat
    ```

- 也可以在 script{} 中运行容器：
  ```groovy
  script{
      // 运行一个容器，在 Groovy 中保存为 container1 对象
      docker.image('mysql:5.7').withRun('-p 3306:3306') { container1 ->
          // 等待服务启动
          sh """
              while ! curl 127.0.0.1:3306
              do
                  echo 'Wait until service is up...'
                  sleep 1
              done
          """

          // 支持嵌套，从而同时运行多个容器
          docker.image('centos:7').inside("--link ${container1.id}:db") {
              sh """
                  sh test.sh
              """
          }
      }
  }
  ```
  - withRun() 方法执行完之后会自动删除容器。
  - inside() 方法启动容器时，会加上像 agent.docker 的默认配置。

## stages{}

pipeline{} 流水线的主要内容写在 stages{} 中，其中可以定义一个或多个 stage{} ，表示执行的各个阶段。
- Jenkins 会按先后顺序执行各个 stage{} ，并在 Web 页面上显示执行进度。
- 每个 stage{} 的名称不能重复。
- 每个 stage{} 中必须定义一个以下类型的语句块，且只能定义一个：
  ```sh
  stages{}
  steps{}
  matrix{}
  parallel{}
  ```
- 例：
  ```groovy
  stages {
      stage('测试 1') {
          steps {...}
      }
      stage('测试 2') {
          stages('嵌套阶段') {
              stage('单元测试 1') {
                  steps {...}
              }
              stage('单元测试 2') {
                  steps {...}
              }
          }
      }
  }
  ```

## steps{}

在 steps{} 中可以使用多种 DSL 语句。
- [官方文档](https://www.jenkins.io/doc/pipeline/steps/)

### archiveArtifacts

：用于将指定路径的文件归档。
- 归档文件会被保存到 master 节点的 `$JENKINS_HOME/jobs/$JOB_NAME/builds/$BUILD_ID/archive/` 目录下。
  - 可以在 Jenkins 的 job 页面查看、下载归档文件。
- 例：
  ```groovy
  archiveArtifacts artifacts: 'dist.zip'
  ```
  - 目标文件的路径可以使用通配符：
    ```
    target/*.jar
    **/*.log
    ```

### bat

：用于在 Windows 系统上执行 CMD 命令。

### build

：用于执行一个 Job 。
- 在流水线上，被执行的 job 位于当前 job 的下游。
- 例：
  ```groovy
  build (
      job: 'job1',
      parameters: [
          string(name: 'AGENT', value: 'master'),  // 这里的 string 是指输入值的类型，可输入给大部分类型的 parameters
      ]
      // wait: true,        // 是否等待下游 job 执行完毕，才继续执行当前 job
      // propagate: true,   // 是否让下游 job 的构建结果影响当前 job 。需要启用 wait 才生效
      // quietPeriod: 5,    // 设置静默期，默认为 5 秒
  )
  ```
  - 如果给下游 job 传入未定义的 parameters ，则后者并不会接收。

### checkout

：用于拉取代码仓库。
- 例：拉取 Git 仓库
  ```groovy
  checkout([
      $class: 'GitSCM',
      branches: [[name: "$BRANCH"]],    // 切换到指定的分支，也可以填 tag 或 commit ID 。不过该插件最终会切换到具体的 commit ID
      extensions: [
        [$class: 'CleanBeforeCheckout'],  // 清理项目文件，默认启用。相当于 git clean -dfx 加 git reset --hard
        // [$class: 'RelativeTargetDirectory', relativeTargetDir: '.'], // 本地仓库的保存目录，默认为 .
        // [$class: 'CloneOption', shallow: true, depth: 1],            // 浅克隆，只下载最近 1 个版本的文件
        // [$class: 'SubmoduleOption', recursiveSubmodules: true, parentCredentials: true, shallow: true, depth: 1], // 递归克隆 submodule ，采用父 Git 项目的凭据，并采用浅克隆
      ],
      userRemoteConfigs: [[
        credentialsId: 'account_for_git', // 登录 git 服务器的凭据，为 Username With Password 类型
        url: "$repository_url"            // git 远程仓库的地址
      ]]
  ])
  ```
  - 也可直接执行 git 命令：
    ```groovy
    withCredentials([gitUsernamePassword(credentialsId:'account_for_git')]){  // 这会自动将 git 账号密码保存为 Shell 环境变量 GIT_USERNAME、GIT_PASSWORD
        sh """
            git clone $repository_url
        """
    }
    ```
  - 与直接使用 git 命令相比，使用 checkout 语句会将 git commit、diff 等信息收集到 Jenkins 中并显示。

- 例：拉取 SVN 仓库
  ```groovy
  checkout([
      $class: 'SubversionSCM',
      locations: [[
          remote: "$repository_url"
          credentialsId: 'account_for_svn',
          local: '.',                               // 本地仓库的保存目录，默认是创建一个与 SVN 最后一段路径同名的子目录
          // depthOption: 'infinity',               // 拉取的目录深度，默认是无限深
      ]],
      quietOperation: true,                         // 不显示拉取代码的过程
      workspaceUpdater: [$class: 'UpdateUpdater']   // 使本地目录更新到最新版本
  ])
  ```

### dir

：用于暂时切换工作目录，执行一些指令之后又回到 WORKSPACE 。
- 例：
  ```groovy
  steps {
    dir("/tmp") {
        sh "pwd"
    }
    sh "pwd"
  }
  ```

### echo

：用于显示字符串。
- 例：
  ```groovy
  steps {
      echo 'Hello'
  }
  ```
- echo 语句只能显示 String 类型的值，而使用 println 可以显示任意类型的值。
- 打印字符串时，要加上双引号 " 或单引号 ' 作为定界符（除非是纯数字组成的字符串），否则会被当作 Groovy 的变量名。
  - 例如：`echo ID` 会被当作 `echo "$ID"` 执行。
  - 使用三引号 """ 或 ''' 包住时，可以输入换行的字符串。
- 在 Console Output 中显示一个字符串时，如果以 http:// 开头，则会自动显示成超链接。
  - 也可用以下代码，主动显示超链接：
    ```groovy
    import hudson.console.HyperlinkNote
    echo hudson.console.HyperlinkNote.encodeTo('https://baidu.com', 'baidu')
    ```

### emailext

：用于发送邮件。
- 需要先在 Jenkins 系统配置中配置 SMTP 服务器。
- 例：
  ```groovy
  emailext (
      subject: "[${currentBuild.fullDisplayName}]的构建结果为${currentBuild.currentResult}",
      from: "123456@email.com",
      to: '123456@email.com',
      body: """
          任务名：${env.JOB_NAME}
          任务链接：${env.JOB_URL}
          构建编号：${env.BUILD_NUMBER}
          构建链接：${env.BUILD_URL}
          构建耗时：${currentBuild.duration} ms
      """
  )
  ```

### error

：用于让 Job 立即终止，变为 Failure 状态，并显示一行提示文本。
- 例：
  ```groovy
  error '任务执行出错'
  ```

### lock

：用于获取一个全局锁，可避免并发任务同时执行时冲突。
- 可用范围：steps{}、options{}
- 该功能由插件 Lockable Resources 提供。
- 例：
  ```groovy
  lock('resource_1') {    // 锁定一个名为 resource-1 的资源。如果该资源不存在则自动创建（任务结束之后会删除）。如果该资源已经被锁定，则一直等待获取
      sleep 10            // 获取锁之后，执行一些语句
      echo 'done'
  }                       // 执行完之后，会自动释放锁定的资源
  ```
- lock 函数的可用参数如下：
  ```groovy
  lock(resource: 'resource_1',        // 要锁定的资源名
        // label: 'my_resource',      // 通过标签筛选锁定多个资源
        // quantity: 0,               // 至少要锁定的资源数量、默认为 0 ，表示锁定所有
        // variable: 'LOCK',          // 将资源名赋值给一个变量
        // inversePrecedence: false,  // 如果有多个任务在等待获取锁，是否插队到第一个
        // skipIfLocked: false        // 如果需要等待获取锁，是否跳过执行
        ) {
      ...
  }
  ```

### retry

：用于当任务执行失败时（不包括语法错误），自动重试。
- 例：
  ```groovy
  retry(3) {       // 最多尝试执行 3 次（包括第一次执行）
      sh 'ls /tmp/f1'
  }
  ```

### script

：用于执行 Groovy 代码。

- 例：将 shell 命令执行后的 stdout 或返回码赋值给变量
  ```groovy
  script {
      STDOUT = sh(script: 'echo hello', returnStdout: true).trim()
      EXIT_CODE = sh(script: 'echo hello', returnStatus: true)
      echo "$STDOUT"
      echo "$EXIT_CODE"
  }
  ```

- 例：从 shell 中获得数组并遍历它
  ```groovy
  script {
      FILE_LIST = sh(script: "ls /", returnStdout: true)
      for (f in FILE_LIST.tokenize("\n")){
          sh "echo $f"
      }
  }
  ```
  - .tokenize() 方法用于将字符串分割成多个字段的数组，并忽略内容为空的字段。

- 例：捕捉异常
  ```groovy
  script {
      try {
          sh 'exit 1'
      } catch (err) {     // 将异常捕捉之后，构建状态就会依然为 SUCCESS
          echo "${err}"
      } finally {
          echo "finished"
      }
  }
  ```
  - 也可以用 post{} 语句块实现异常处理。

- 例：修改 Job 的描述
  ```groovy
  script {
      currentBuild.rawBuild.project.description = 'Hello'
  }
  ```
  - 执行时可能报错：`RejectedAccessException: Scripts not permitted to use method xxx` \
    需要到 Jenkins 管理页面，点击 `Script Approval` ，批准该方法被脚本调用。

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
        echo Hello 你好         # 建议不要在 sh 语句中通过 echo 命令添加注释，因为该注释会打印一次，执行命令时又会记录一次，而且命令中包含中文时还会转码
        : 测试开始               # 可通过 : 命令加入注释
        comment=( 测试开始 )     # 可通过数组加入注释，此时数组内的中文不会转码
    """
    ```
    执行后的 Console Output 为：
    ```sh
    + echo Hello $'\344\275\240\345\245\275'
    Hello 你好
    + : 测试开始
    + comment=( 测试开始 )
    ```
  - 每次执行 sh 语句需要耗时 300ms ，因此建议将多个 sh 语句合并。

### timeout

：用于设置超时时间。
- 超时之后则立即终止 Job ，变为 ABORTED 状态。
- 例：
  ```groovy
  timeout(time: 3, unit: 'SECONDS') {     // 时间单位可以是 SECONDS、MINUTES、HOURS
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

：用于导入 Jenkins 凭据。
- 例：
  ```groovy
  withCredentials([
      usernamePassword(
          credentialsId: 'credential_1',
          usernameVariable: 'USERNAME',   // 将凭据的值存到变量中
          passwordVariable: 'PASSWORD'
      )]) {
      sh '''                              // 此时 sh 语句需要用单引号，避免票据变量被导入 shell 的环境变量
          docker login -u ${USERNAME} -p ${PASSWORD} ${image_hub}
      '''
  }
  ```
- 也可以直接将 Jenkins 凭据赋值给环境变量：
  ```groovy
  environment {
      ACCOUNT1 = credentials('account1')
  }
  ```
  假设该凭据是 `Username With Password` 类型，值为 `admin:123456` ，则 Jenkins 会在 Shell 中加入三个环境变量：
  ```sh
  ACCOUNT1=admin:123456
  ACCOUNT1_USR=admin
  ACCOUNT1_PSW=123456
  ```
  - 为了保密，如果直接将上述变量打印到 Shell stdout ，Jenkins 会将它们的值显示成 `****` 。

### withEnv

：用于临时添加 Shell 环境变量。
- 例：
  ```groovy
  withEnv(['A=Hello', 'B=World']) {
        sh 'echo $A $B'
  }
  ```

## matrix{}

：包含一个 axes{} 和一个 stages{} ，用于将一个 stages{} 在不同参数的情况下，并行执行一次。
- 可用范围：stage{}
- 每个并行任务称为一个 Branch 。
  - 只要有一个并行执行的任务失败了，最终结果就是 Failure 。
- 例：
  ```groovy
  matrix {
      axes {
          axis {
              name 'PLATFORM'
              values 'linux', 'darwin', 'windows'
          }
          axis {
              name 'PYTHON_VERSION'
              values '3.5', '3.6', '3.7', '3.8'
          }
      }
      stages {
          stage('单元测试') {
              steps {
                  echo PLATFORM
                  echo PYTHON_VERSION
              }
          }
      }
  }
  ```
  - axes{} 用于定义并发任务的矩阵，可以包含多个 axis{} 。
    - 每个 axis{} 用于定义一个矩阵变量。
    - 上例中定义了两个 axis{} ，矩阵变量 PLATFORM、PYTHON_VERSION 分别有 3、4 种取值，因此会执行 3*4=12 个并发任务。


## parallel{}

：包含多个 stage{} ，会并行执行。
- 可用范围：stage{}
- 例：
  ```groovy
  stage('单元测试') {
      parallel {
          stage('单元测试 1') {
              steps {
                  echo '测试完成'
              }
          }
          stage('单元测试 2') {
              steps {
                  echo '测试完成'
              }
          }
      }
  }
  ```
- matrix{} 用于并行执行同一个任务，只是参数不同。而 parallel{} 用于并行执行多个不同的任务。

## options{}

：用于给 Pipeline 添加一些可选配置。
- 可用范围：pipeline{}、stage{}
- 例：
  ```groovy
  options {
      buildDiscarder logRotator(daysToKeepStr: '30',          // 限制 build 记录的保留天数
                                numToKeepStr: '100',          // 限制 build 记录的保留数量
                                artifactDaysToKeepStr: '10',  // 限制 build 归档文件的保留天数。删除一次 build 记录时，也会删除其包含的 archive
                                artifactNumToKeepStr: '10')   // 限制 build 归档文件的保留数量

      disableConcurrentBuilds()           // 不允许同时执行该 job ，会排队执行
      lock('resource-1')                  // 获取全局锁
      parallelsAlwaysFailFast()           // 用 matrix{}、parallel{} 执行并发任务时，如果有某个任务失败，则立即放弃执行其它任务
      quietPeriod(5)                      // 设置静默期，默认为 5 秒
      retry(3)                            // 最多尝试执行 3 次（包括第一次执行）
      timeout(time: 60, unit: 'SECONDS')  // 执行整个 Job 的超时时间
      timestamps()                        // 输出内容到终端时，加上时间戳
  }
  ```

## triggers{}

：用于在满足条件时自动触发 Pipeline 。
- 可用范围：pipeline{}
- 例：
  ```groovy
  triggers {
      cron('H */4 * * 1-5')       // 定期触发。其中 H 表示一个随机值，用于分散执行多个同时触发的任务
      pollSCM('H */4 * * 1-5')    // 定期检查 SCM 仓库，如果提交了新版本代码则构建一次
  }
  ```

## when{}

：用于在满足条件时才执行某个 stage 。
- 可用范围：stage{}
- 不满足 when{} 的条件时，会跳过执行该 stage ，但并不会导致执行状态变为 Failure 。
- 例：
  ```groovy
  when {
      environment name: 'A', value: '1'  // 当环境变量等于指定值时
  }
  ```
  ```groovy
  when {
      expression {            // 当 Groovy 表达式为 true 时
          currentBuild.currentResult == 'SUCCESS'
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
      anyOf {                 // 当任一子条件为 true 时
          environment name: 'A', value: '1'
          environment name: 'B', value: '2'
      }
      // when{} 子句中的多个条件默认为 allOf{} 的关系
  }
  ```
  - environment 表达式只能处理环境变量，而 expression{} 能处理环境变量、普通 Groovy 变量。

## input{}

：用于暂停某个阶段的执行，等待用户输入某些参数。
- 可用范围：stage{}
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

：用于当构建状态满足某些条件时，才执行操作。
- 可用范围：pipeline{}、stage{}
- pipeline 出现语法错误时，Jenkins 会直接报错，而不会执行 post 部分。
- 可用条件：
  ```sh
  success       # 状态为成功
  failure       # 失败
  unstable      # 不稳定
  aborted       # 放弃执行

  unsuccessful  # 不成功，包括 failure、unstable、aborted
  always        # 匹配任何状态
  cleanup       # 匹配任何状态，且放在其它所有 post 条件之后执行，通常用于清理
  changed       # 与上一次执行的状态不同
  regression    # 状态为 failure、unstable 或 aborted ，且上一次执行的状态为 success
  fixed         # 状态为 success ，且上一次执行的状态为 failure 或 unstable
  ```
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
