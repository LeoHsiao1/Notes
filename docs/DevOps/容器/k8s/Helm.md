# Helm

：一个包管理工具，用于在 k8s 中按模板文件部署应用。相当于 yum 是 CentOS 系统的包管理工具。
- [官方文档](https://helm.sh/docs/)
- 优点：
  - 一些 k8s 应用可能包含大量配置文件，打包成一个 Chart 更方便部署。
  - 重复部署一个 k8s 应用时，通过 Chart 模板文件可以方便地修改一些配置参数。
  - 很多开源软件提供了 Helm Chart 发行版，方便用户一键部署。
- 缺点：
  - 部署 k8s 应用之前，需要事先编写 Chart 。如果部署过程经常变化，还需要经常修改 Chart 。
  - 使用 Chart 之前，需要了解它会对 k8s 做出哪些修改，有哪些配置参数以及默认值。因此存在信任、学习的成本，可能不值得使用 Helm 。

## 原理

- 使用流程：
  1. 用户准备一个要部署到 k8s 中的应用（比如一个 Web 服务器），编写所有配置文件（比如 deployment.yaml ），并按特定格式存放在一个目录下，称为 Chart 。
  3. 用 helm 命令读取 Chart 目录或压缩包，渲染成 Release ，然后部署到 k8s 中。

- 通常将 Chart 目录打包成一个 .tgz 压缩包，方便传输。
  - 给 helm 客户端添加 repo 仓库之后，就可以在本机、远程仓库之间上传、下载 Chart 压缩包。
  - artifacthub.io 汇总了很多个 repo 仓库的 Chart 。

- Chart 中的配置文件通常使用 Golang Template 模板语法，需要渲染之后才能得到最终的配置文件，称为 Release 。
  - 渲染时，传入不同的模板变量，就可以从一个 Chart 模板创建不同的 Release 实例。在不冲突的情况下，可以部署到同一个 k8s 中。

- Helm 将 Release 部署到 k8s 中时，如果包含多种 k8s 对象，则会按以下顺序创建：
  ```sh
  Namespace
  NetworkPolicy
  ServiceAccount
  Secret
  ConfigMap
  ...
  ```

## 安装

- 下载二进制包：
  ```sh
  VERSION=3.10.3
  wget https://get.helm.sh/helm-v$VERSION-linux-amd64.tar.gz
  tar -xf helm-v$VERSION-linux-amd64.tar.gz
  install linux-amd64/helm /usr/bin/
  ```

### 版本

- Helm v2.0 采用 C/S 架构。
  - 客户端名为 helm ，负责管理 Chart 。
  - 服务器名为 tiller ，会将客户端发来的 Chart 渲染成 Release ，然后传给 k8s apiserver 进行部署。
- Helm v3.0 于 2019 年 11 月发布，与 Helm2 不兼容，移除了 Tiller ，成为了一个纯客户端工具。

## 命令

```sh
helm
    # 关于制作 Chart
    create <name>         # 创建一个新的 Chart 目录，会包含一些模板文件
    lint <chart>...       # 检查 Chart 的语法是否正确
    template <name> <chart>   # 将一个 Chart 渲染成指定 name 的 Release
        --set key1=value1,... # 渲染时，传入一些模板变量。可多次使用该选项，比如 --set ids={1,2,3},servers[0].port=80
        -f values.yaml        # --values ，从 YAML 文件导入模板变量
        --version <string>    # 存在多个版本的 Chart 时，选择其中一个版本。默认会选择最新的一个版本
        > release.yml         # 渲染的 Release 默认会输出到 stdout ，可以保存到一个文件中
    package <path>            # 将一个 Chart 目录打包成一个 .tgz 压缩包，命名格式为 <name>-<version>.tgz ，这会读取 Chart.yaml 中的简介信息
    show
        chart  <chart>    # 查看 Chart 中的 Chart.yaml
        readme <chart>    # 查看 README.md
        values <chart>    # 查看 value.yaml

    # 关于仓库
    repo
        add [name] [url]  # 添加一个远程仓库
        remove [name]...  # 删除仓库
        update [name]...  # 获取仓库的最新信息。如果不指定 name ，则更新所有仓库
        list              # 列出所有仓库
    search repo <string>  # 在已添加的所有仓库中，搜索名称包含该字符串的 Chart 。这会使用本机缓存的仓库信息进行搜索，因此需要事先执行 helm repo update
    search hub <string>   # 在 artifacthub.io 搜索 Chart ，这会实时查询远程仓库
    pull <chart>          # 下载 Chart 到本机。可以指定位于远程的 Chart URL ，或位于仓库的 Chart name
    push <path> <repo>    # 指定位于本机的 Chart ，上传到仓库

    # 关于 Release
    list                      # 列出当前 k8s 中的所有 Release
    install <name> <chart>    # 将一个 Chart 渲染成指定 name 的 Release ，然后部署到 k8s 。可使用 helm template 命令的 --set 等命令行参数
        --create-namespace    # 如果 Release 使用的 k8s 命名空间不存在，则自动创建
        --dry-run             # 模拟执行命令，但并不会实际部署 Release
        -g                    # --generate-name ，自动命名 Release 。此时可省略 install <name> <chart> 中的 name ，因此可以重复 install ，不会命名冲突
        --wait                # 等待 Release 成功启动，比如 Pod 变为 Ready 状态。默认不会等待，创建 Release 包含的所有 k8s 对象之后，就结束 helm 命令
        --timeout 5m          # 当前命令执行的超时时间
    uninstall <release>...    # 卸载 k8s 中的 Release 。等价于 helm delete 命令
        --wait                # 等待所有相关的 k8s 资源被删除
    upgrade <release> <chart>
        # 升级 k8s 中一个 Release 。可使用 helm template 命令的 --set 等命令行参数
        # upgrade 命令会比较当前 Release 与 Chart 的差异，然后对 Release 做出修改。因此 upgrade 时使用的 Chart name ，与 install 时可以不同，但 upgrade 过程更不可控
    rollback <release> [revision]
        # 将 Release 回滚到指定版本。如果未指定 revision ，则回滚到上一个版本
        # Release 在 install 之后的版本号为 revision=1 ，每次 upgrade、rollback ，都会使 revision 加 1

    --debug               # 打印调试信息
    --kubeconfig ~/.kube/config
    -n default            # --namespace ，指定 k8s 命名空间
    -A                    # --all-namespaces ，指定所有 k8s 命名空间
```
- 例：
  ```sh
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm search repo nginx
  helm install nginx bitnami/nginx -n test --wait
  ```
- 执行 helm 命令时，会读取一些环境变量作为配置参数。例如：
  ```sh
  KUBECONFIG="~/.kube/config"           # 表示到哪读取 kubeconfig 配置文件
  HELM_CACHE_HOME="~/.cache/helm"       # Helm 的缓存文件目录
  HELM_CONFIG_HOME="~/.config/helm"     # Helm 的配置文件目录
  HELM_DATA_HOME="~/.local/share/helm"  # Helm 的数据文件目录
  ```
- 可以指定多种位置的 Chart ：
  ```sh
  helm install nginx bitnami/nginx      # 指定位于仓库的 Chart name
  helm install nginx nginx-13.2.21.tgz  # 指定位于本机的 Chart 压缩包
  helm install nginx nginx              # 指定位于本机的 Chart 目录
  helm install nginx https://xxx/charts/nginx-13.2.21.tgz   # 指定位于远程的 Chart URL
  ```

## Chart

- 执行 `helm create mysite` 新建一个 Chart 目录，如下：
  ```sh
  mysite/
  ├── charts/             # 存放当前 Chart 依赖的其它 Chart
  ├── Chart.yaml          # 记录该 Chart 的简介信息
  ├── .helmignore         # 记录一些文件路径，在打包 Chart 时忽略
  ├── README.md
  ├── templates           # 存放该 k8s 应用的配置文件，通常使用 Golang Template 模板语法
  │   ├── deployment.yaml
  │   ├── NOTES.txt       # 用 helm install 部署该 Chart 时，显示一些提示语
  │   └── service.yaml
  └── values.yaml         # 用于给 templates 中的变量赋值
  ```

- Chart.yaml 文件的示例：
  ```yaml
  apiVersion: v2
  name: mysite
  description: A Helm chart for Kubernetes
  type: application
  version: 0.1.0          # 该 Chart 自身的版本
  appVersion: "1.16.0"    # 该 Chart 要部署的 k8s 应用的版本
  ```

- values.yaml 文件的示例：
  ```yaml
  replicaCount: 1
  image:
    repository: nginx
    pullPolicy: IfNotPresent
  ```

- 在 deployment.yaml 中使用模板的示例：
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: {{ include "mysite.fullname" . }}
    labels:
      {{- include "mysite.labels" . | nindent 4 }}
  spec:
    {{- if not .Values.autoscaling.enabled }}
    replicas: {{ .Values.replicaCount }}
    {{- end }}
    selector:
      matchLabels:
        {{- include "mysite.selectorLabels" . | nindent 6 }}
    spec:
      ...
  ```
