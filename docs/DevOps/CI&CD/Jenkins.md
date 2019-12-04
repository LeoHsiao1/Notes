# Jenkins

：一个开源的CI/CD工具，基于Java，主要用于项目构建、测试、部署，还提供了Web操作页面。
- 把项目的处理过程称为流水线，用Jenkinsfile描述。
- 用户可以添加一些主机作为Jenkins的运行环境。
- 用户可以将密码等私密数据保存成Jenkins的“凭证”。

## Jenkinsfile

：用于描述Jenkins流水线，基于Groovy语言。

Jenkinsfile有两种写法：
- 脚本式（Scripted Pipeline）：将流水线定义在node{}中。
- 声明式（Declarative Pipeline）：将流水线定义在pipeline{}中，更推荐使用。

用 `sh "command"` 的格式可以执行shell命令。
- 每个sh语句会被Jenkins保存为一个临时的 .sh 文件，用 /bash/sh x.sh 来执行。因此每个sh语句都是在一个独立的子shell被执行。
- 例如：sh "a=1; echo $a"
  <br>命令中的 $a 会被当做Jenkinsfile的环境变量替换（如果不存在则报错）。
  <br>如果要读取shell中的变量，则应该使用单引号，比如：sh 'a=1; echo $a'

使用变量的方式：
- 环境变量：在environment{} 中定义，用 $ 获取变量的值。
  - Jenkins在执行Jenkinsfile之前，会先把各个变量名替换成其值（相当于字符串替换）。如果找不到某个变量的值，则Groovy报出语法错误。
- 外部变量：从外部传入。又称为构建参数。

### 例

```groovy
pipeline {
    agent {
        label "cvm1"    // 选择一个主机来工作
        // agent any    // 让Jenkins选择任一主机
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
                    credentialsId: "${git_credentialsid}",  // 使用git凭证
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
