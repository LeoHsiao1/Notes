# Jenkins

：一个流行的CI/CD工具，基于Java，主要用于项目构建、测试、部署，提供了Web操作页面。
- 把项目的处理过程称为流水线，用Jenkinsfile描述。
- 用户可以添加一些主机作为Jenkins的运行环境。
- 用户可以将密码等私密数据保存成Jenkins的“凭证”。
- [官方文档](https://jenkins.io/zh/doc/)

## 启动

用Docker启动：
```sh
docker pull jenkinsci/blueocean
docker run -p 8080:8080 jenkinsci/blueocean

mkdir /var/jenkins_home
docker run -d \
        -p 8080:8080                                    # Jenkins的Web端的访问端口
        -p 50000:50000                                  # 供Jenkins代理访问的端口
        -v /var/jenkins_home:/var/jenkins_home          # 挂载Jenkins的数据目录，从而可以随时重启Jenkins容器
        -v /var/run/docker.sock:/var/run/docker.sock    # 挂载docker.sock，使得Jenkins可以与docker daemon通信
        jenkinsci/blueocean
```
- 第一次启动时，终端上会显示一个密钥，用于第一次登陆Web端。


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

## ♢ jenkinsapi

：Python的第三方库，用于调用Jenkins的API。
- 安装：pip install jenkinsapi

### 用法示例

创建客户端：
```python
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("10.0.0.1", username=None, password=None)
```

查询job：
```python
job_names = jk.keys()             # 返回job的名字列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job名字，job对象）
jk.get_jobs_info()                # 返回一个可迭代对象，每次迭代返回一个二元组（job的URL，job名字）

job = jk.get_job("test1")         # 根据名字，获取指定的job对象，如果不存在则抛出异常
jk.delete_job("test1")            # 删除一个job
```

job的配置：
```python
xml = job.get_config()            # 导出job的XML配置
job = jk.create_job(jobname, xml) # 创建一个job
job.update_config(xml)            # 修改job的XML配置
```

job的构建：
```python
jk.build_job("test_job", params={"tag":"v1.0.0"}) # 构建一个job（按需要发送参数）

b = job.get_build(20)    # 返回指定编号的build对象
b = job.get_last_build() # 返回最后一次构建的build对象
job.get_last_build()

b.job.name               # 返回这次构建所属job的名字
b.get_number()           # 返回这次构建的编号
b.get_timestamp()        # 返回开始构建的时间
b.get_params()           # 返回一个字典，包含这次构建的所有参数

b.is_running()           # 如果这次构建正在运行，则返回True
b.get_status()           # 如果项目运行成功，则返回'SUCCESS'，否则返回'FAILURE'
b.get_console()          # 返回这次构建的控制台stdout
b.stop()                 # 停止构建，如果成功停止则返回True
```
