# Jenkinsfile

：一个文本文件，用于描述 Jenkins 的 Pipeline Job ，可以被 Groovy 解释器执行。
- Groovy 是一种基于 JVM 的脚本语言，支持面向对象编程，可以调用 Java 的类库。
- 使用 Jenkinsfile 可以将 Jenkins Web 页面上的大部分配置内容都改为代码描述，更灵活，容易迁移。
- 可以在 Jenkins Web 页面上编写 Jenkinsfile 并保存，不过更推荐保存到项目的代码仓库里，然后被 Jenkins 引用。
- Jenkinsfile 有两种写法：
  - 脚本式（Scripted Pipeline）：将流水线定义在 node{} 中，主要内容为 Groovy 代码。
  - 声明式（Declarative Pipeline）：将流水线定义在 pipeline{} 中，更推荐使用，本文采用这种写法。

## 例

```groovy
pipeline {
    agent {                     // 声明使用的主机
        label "master"
    }
    environment {               // 定义环境变量
        PORT = "80"
    }
    stages {
        stage("拉取代码") {      // 开始一个阶段
            environment {       // 定义该阶段的环境变量
                GIT_BRANCH = "master"
            }
            steps {             // 执行一些步骤
                deleteDir()
                git(
                    branch: "master",
                    credentialsId: "${git_credentialsid}",  // 使用 git 凭证
                    url : "git@${script_path}${service}.git"
                )
                sh "git checkout $tag"
            }
        }
        stage("构建镜像") {
            steps {
                docker build -t ${image_hub}/${image_project}/${build_image_name}:${build_image_tag} .
                docker login -u ${hub_user} -p ${hub_password} ${image_hub}
                docker push ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
                docker image rm ${image_hub}/${image_project}/${build_image_name}:${build_image_tag}
            }
        }
        stage("测试") {
            steps {
                echo "单元测试中..."
                echo "单元测试完成"
            }
        }
    }
}
```

- pipeline{} 流水线的主要内容写在 stages{} 块中，其中可以写入一个或多个 stage{} 块，表示执行的各个阶段。
  - 每个 stage{} 块中包含一个 steps{} 块，表示主要执行的操作。
  - Jenkins 会按先后顺序执行各个 stage{} 块，并在 Web 页面上显示执行进度。
- 用 // 声明单行注释。
- 区分大小写。

### agent{} 块

在 pipeline{} 的开头要声明 agent{} 块，表示选择哪个主机来执行流水线。
- 可以在 stage{} 块中声明针对该阶段的 agent{} 块。
- 常见的几种声明方式：
    ```groovy
    agent {
        agent any       // 让 Jenkins 选择任一主机
    }
    ```
    ```groovy
    agent {
        label "master"  // 选择指定名字的主机
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

### 使用变量

- 用 `$变量名` 的格式可以读取变量的值。
  - Jenkins 在执行 Jenkinsfile 之前，会先将各个变量名替换成其值（相当于字符串替换）。如果使用的变量尚未定义，则会报出 Groovy 的语法错误 `groovy.lang.MissingPropertyException: No such property` 。

- 在 steps{} 块中可以写入 echo 语句，用于显示字符串。
  - 例：
    ```groovy
    steps {
        echo "Hello"
    }
    ```
  - 使用字符串时，要用双引号或单引号或三引号包住（除非是纯数字组成的字符串），否则会被当作变量取值。例如：`echo ID`会被当作`echo "$ID"`执行。

- 可以给 Job 声明构建参数，需要用户在启动 Job 时传入它们（像函数形参）。
  - 其它类型的 Job 只能在 Jenkins Web 页面中定义构建参数，而 Pipeline Job 可以在 pipeline.parameters{} 块中以代码的形式定义构建参数。如下：
    ```groovy
    pipeline {
        agent any
        parameters {
            booleanParam(name: 'A', defaultValue: true, description: '')   // 布尔参数
            string(name: "B", defaultValue: "Hello", description: '')      // 字符串参数，在 Web 页面上输入时不能换行
            text(name: 'C', defaultValue: 'Hello\nWorld', description: '') // 文本参数，输入时可以换行
            password(name: 'D', defaultValue: '123456', description: '')   // 密文参数，输入时显示成密文
            choice(name: 'E', choices: ['A', 'B', 'C'], description: '')   // 单选参数，输入时显示成下拉框
            file(name: 'F', description: '')                               // 文件参数，输入时显示一个文件上传按钮
        }
        stages {
            stage('Example') {
                steps {
                    echo "$A"
                }
            }
        }
    }
    ```
  - 如果定义了 parameters{} 块，则会移除在 Jenkins Web 页面中定义的、在上游 Job 中定义的构建参数。

- 在 environment{} 块中可以定义环境变量，它们会被 Jenkind 加入到 shell 的环境变量中。
  - 定义在 pipeline.environment{} 块中的环境变量会作用于全局，而定义在 stage.environment{} 块的只作用于该阶段。
  - 例：
    ```groovy
    stage("测试") {
        environment {
            ID = 1
            NAME = "hello"
        }
        steps {
            echo "$ID"
            sh "ID=2; echo $ID"
        }
    }
    ```
    - 以上 echo 语句、sh 语句中，`$ID`都会被视作 Jenkinsfile 的环境变量取值，如果不存在则报错。
    - 如果要读取 shell 中的变量，则应该执行被单引号包住的 sh 语句。例如：`sh 'ID=2; echo $ID'`
  - 在 environment{} 块中可以通过以下方式读取 Jenkins 的一些内置变量：
    ```groovy
    echo "任务名：${env.JOB_NAME} ，构建编号：${env.BUILD_ID} "
    ```
  - 在 environment{} 块中可以通过以下方式读取 Jenkins 的凭证：
    ```groovy
    environment {
        ACCOUNT1 = credentials('account1')
    }
    ```
    假设该凭证是 Username With Password 类型，值为"admin:123456"，则 Jenkins 会在 shell 中加入三个环境变量：
    ```sh
    ACCOUNT1=admin:123456
    ACCOUNT1_USR=admin
    ACCOUNT1_PSW=123456
    ```
    读取其它类型的凭证时，建议打印出 shell 的所有环境变量，从而发现 Jenkins 加入的环境变量的名字。
    为了保密，如果直接将上述变量打印到 stdout 上，Jenkins 会将它们的值显示成 `****` 。

### sh 语句

在 steps{} 块中可以写入 sh 语句，用于执行 shell 命令。
- 例：
    ```groovy
    steps {
        sh "echo Hello"
        sh 'echo World'
    }
    ```
- 每个 sh 语句会被 Jenkins 保存为一个临时的 x.sh 文件，用 `/bin/bash -ex x.sh` 的方式执行，且切换到该 Job 的工作目录。因此各个 sh 语句之间比较独立、解耦。
- 使用三引号时，可以编写换行的 sh 语句。如下：
    ```groovy
    sh """
        A=1
        echo $A     // 这会读取 Groovy 解释器中的变量 A
    """
    ```
    ```groovy
    sh '''
        A=1
        echo $A     // 这会读取 shell 中的变量 A
    '''
    ```
- 类似地，在 steps{} 块中可以写入 bat 语句，用于执行 CMD 命令。

### script{} 块

在 steps{} 块中可以写入 script{} 块，用于执行 Groovy 代码。
- 如下是定义一个变量，该变量会在 Groovy 解释器中一直存在，因此在该 script{} 块甚至该 stage{} 块结束之后依然可以读取，但并不会被 Jenkins 加入到 shell 的环境变量中。
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
        STDOUT = sh(script: "echo hello", returnStdout: true).trim()
        EXIT_CODE = sh(script: "echo hello", returnStatus: true)
        echo "$STDOUT"
        echo "$EXIT_CODE"
    }
    ```

### options{} 块

在 pipeline{} 块或 stage{} 块中可以写入 options{} 块，用于添加一些额外的功能。
- 例：
    ```groovy
    options {
        timestamps()                        // 输出信息到终端时，加上时间戳
        timeout(time: 60, unit: 'SECONDS')  // 超过 60 秒之后自动放弃执行该任务，还可使用 MINUTES、HOURS 单位
        retry(3)    // 当任务执行失败时（不包括语法错误、超时的情况），自动再重新执行 3-1 次，总共最多执行 3 次
    }
    ```

### post{} 块

在 stages{} 块之后可以写入 post{} 块，用于处理 Pipeline 的各种构建结果。
- 例：
    ```groovy
    pipeline {
        agent any
        stages {
            stage('Test') {
                steps {
                    sh 'make check'
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
                echo '放弃执行'
            }
            unstable {
                echo '执行状态不稳定'
            }
        }
    }
    ```

### 并行执行

使用 parallel 可以声明并行执行的内容。
- 例：
    ```groovy
    steps {
        parallel "单元测试1": {
            echo "测试中..."
            echo "测试完成"
        },
        "单元测试2": {
            echo "测试中..."
            echo "测试完成"
        }
    }
    ```
