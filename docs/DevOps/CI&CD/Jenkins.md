# Jenkins

：一个流行的 CI/CD 平台，常用于项目构建、测试、部署。
- 基于 Java 开发，提供了 Web 操作页面。

- [官方文档](https://jenkins.io/zh/doc/)

## 启动

用 Docker 启动：
```sh
docker pull jenkins/jenkins
docker run -p 8080:8080 jenkins/jenkins

mkdir /var/jenkins_home
docker run -d \
        -p 8080:8080                                    # Jenkins 的 Web 端的访问端口
        -p 50000:50000                                  # 供 Jenkins 代理访问的端口
        -v /var/jenkins_home:/var/jenkins_home          # 挂载 Jenkins 的数据目录，从而可以随时重启 Jenkins 容器
        -v /var/run/docker.sock:/var/run/docker.sock    # 挂载 docker.sock ，使得 Jenkins 可以与 docker daemon 通信
        jenkins/jenkins
```
- 第一次启动时，终端上会显示一个密钥，用于第一次登陆 Web 端。

## 用法

- Jenkins的主页的左上角显示了一列菜单，点击其中的“新建”即可创建一个项目（Project）或任务（Job），常见的几种类型如下：
  - Freestyle ：自由风格的项目。
  - Pipeline ：将项目的处理过程按先后顺序分为多个步骤，称为流水线，用 Jenkinsfile 描述。
  - MultiJob ：用于组合调用多个Job。可以设置多个阶段（Phase），每个阶段可以串行或并行执行多个Job。
  - Folder ：用于对项目进行分组管理。
- 用户可以添加一些主机作为 Jenkins 的运行环境。
- 用户可以将密码等私密数据保存成 Jenkins 的“凭证”。

## Jenkinsfile

：用于描述 Jenkins 流水线，基于 Groovy 语言。

Jenkinsfile 有两种写法：
- 脚本式（Scripted Pipeline）：将流水线定义在 node{}中。
- 声明式（Declarative Pipeline）：将流水线定义在 pipeline{}中，更推荐使用。

用 `sh "command"` 的格式可以执行 shell 命令。
- 每个 sh 语句会被 Jenkins 保存为一个临时的 .sh 文件，用 /bash/sh x.sh 来执行。因此每个 sh 语句都是在一个独立的子 shell 被执行。
- 例如：sh "a=1; echo $a"
  <br>命令中的 $a 会被当做 Jenkinsfile 的环境变量替换（如果不存在则报错）。
  <br>如果要读取 shell 中的变量，则应该使用单引号，比如：sh 'a=1; echo $a'

使用变量的方式：
- 环境变量：在 environment{} 中定义，用 $ 获取变量的值。
  - Jenkins 在执行 Jenkinsfile 之前，会先把各个变量名替换成其值（相当于字符串替换）。如果找不到某个变量的值，则 Groovy 报出语法错误。
- 外部变量：从外部传入。又称为构建参数。

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

## ♢ jenkinsapi

：Python 的第三方库，用于调用 Jenkins 的 API 。
- 安装：pip install jenkinsapi

### 用法示例

创建客户端：
```python
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("10.0.0.1", username=None, password=None)
```

查询 job ：
```python
job_names = jk.keys()             # 返回 job 的名字列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job 名字，job 对象）
jk.get_jobs_info()                # 返回一个可迭代对象，每次迭代返回一个二元组（job 的 URL ，job 名字）

job = jk.get_job("test1")         # 根据名字，获取指定的 job 对象，如果不存在则抛出异常
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

b = job.get_build(20)    # 返回指定编号的 build 对象
b = job.get_last_build() # 返回最后一次构建的 build 对象
job.get_last_build()

b.job.name               # 返回这次构建所属 job 的名字
b.get_number()           # 返回这次构建的编号
b.get_timestamp()        # 返回开始构建的时间
b.get_params()           # 返回一个字典，包含这次构建的所有参数

b.is_running()           # 如果这次构建正在运行，则返回 True
b.get_status()           # 如果项目运行成功，则返回'SUCCESS'，否则返回'FAILURE'
b.get_console()          # 返回这次构建的控制台 stdout
b.stop()                 # 停止构建，如果成功停止则返回 True
```
