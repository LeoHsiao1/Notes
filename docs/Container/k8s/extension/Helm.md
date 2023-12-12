# Helm

：一个 k8s 的包管理工具。用 helm 命令在 k8s 中部署应用，相当于用 yum 命令在 CentOS 中安装软件。
- [官方文档](https://helm.sh/docs/)

## 同类产品

- 在 k8s 中部署应用的几种方式：
  - kubectl
    - 流程：通常先为 k8s 应用编写 Deployment、Service 等 YAML 配置文件，然后用 `kubectl apply -f xx` 命令将它们导入 k8s ，从而部署应用。
    - 优点：最基础的部署方式，适合部署少量、简单的 k8s 应用。
  - kustomize
    - 流程：先将 k8s 应用的配置文件封装成 kustomization 目录，然后用 kustomize 命令部署。
    - 优点：可将配置文件进行简单的模板化，便于复用。
  - helm
    - 流程：先将 k8s 应用的配置文件封装成 chart 包，然后用 helm 命令部署。
    - 优点：
      - 可将配置文件进行复杂的模板化，便于复用。
      - 重复部署一个 k8s 应用时，通过 chart 模板文件可以方便地修改一些配置参数。
      - 很多开源软件提供了 Helm chart 发行版，方便用户一键部署。
    - 缺点：
      - 部署 k8s 应用之前，需要事先编写 chart 。如果部署过程经常变化，还需要经常修改 chart 。
      - 使用 chart 之前，需要了解它会对 k8s 做出哪些修改，有哪些配置参数以及默认值，因此存在信任、学习的成本。
    - 综上，使用 helm 可能大幅简化部署 k8s 应用的工作量。但也可能使用不当，导致工作效率比 kubectl 还低。
  - operator
    - 流程：先为 k8s 应用开发一个 operator ，需要编程。然后用 operator 在 k8s 中自动部署应用。
    - 优点：helm 专注于应用的部署环节，而 operator 能自动完成应用的部署、运维工作，功能更多。
    - 缺点：开发、维护 operator 的成本比 helm 更高。

## 原理

- 使用流程：
  1. 用户准备一个要部署到 k8s 中的应用（比如一个 Nginx 服务器），编写所有配置文件（比如 deployment.yaml、service.yaml ），并按特定格式存放在一个目录下，称为 chart 。
  2. 用 helm 命令读取 chart 目录或压缩包，渲染成 release ，然后部署到 k8s 中。

- 通常将 chart 目录打包成一个 .tgz 压缩包，方便传输。
  - 给 helm 客户端添加 repo 仓库之后，就可以在本机、远程仓库之间推送、拉取 chart 压缩包。
  - artifacthub.io 汇总了很多个 repo 仓库的 chart 。

- chart 中的配置文件通常使用 Golang Template 模板语法，需要渲染之后才能得到最终的配置文件，称为 release 。
  - 渲染时，传入不同的模板变量，就可以从一个 chart 模板创建不同的 release 实例。在不冲突的情况下，可以部署到同一个 k8s 中。

## 安装

- 下载二进制包：
  ```sh
  VERSION=3.10.3
  wget https://get.helm.sh/helm-v$VERSION-linux-amd64.tar.gz
  tar -xf helm-v$VERSION-linux-amd64.tar.gz
  install linux-amd64/helm /usr/bin/
  ```

### 版本

- v2.0
  - 采用 C/S 架构。
    - 客户端名为 helm ，负责管理 chart 。
    - 服务器名为 tiller ，会将客户端发来的 chart 渲染成 release ，然后传给 k8s apiserver 进行部署。
- v3.0
  - 于 2019 年发布，与 Helm v2 不兼容，移除了 Tiller ，成为了一个纯客户端工具。
  - helm 支持使用两种类型的远程仓库：
    - chart repository ：专用于存储 chart 压缩包，不能存储 Docker 镜像。
    - OCI registry ：v3.8.0 开始，helm 支持使用符合 OCI 标准的 Docker 镜像仓库。这样就不必专门部署 chart repository 服务器。

## 命令

```sh
helm
    # 关于制作 chart
    create <name>         # 创建一个新的 chart 目录，会包含一些模板文件
    lint <chart>...       # 检查 chart 的语法是否正确
    template <name> <chart>   # 将一个 chart 渲染成指定 name 的 release
        --set key1=value1,... # 渲染时，传入一些模板变量。可多次使用该选项，比如 --set ids={1,2,3},servers[0].port=80
        -f values.yaml        # --values ，从 YAML 文件导入模板变量
        --version <string>    # 存在多个版本的 chart 时，选择其中一个版本。默认会选择最新的一个版本
        > release.yml         # 渲染的 release 默认会输出到 stdout ，可以保存到一个文件中
    package <path>            # 将一个 chart 目录打包成一个 .tgz 压缩包，命名格式为 <name>-<version>.tgz ，这会读取 chart.yaml 中的简介信息
    show
        chart  <chart>    # 查看 chart 中的 chart.yaml
        readme <chart>    # 查看 README.md
        values <chart>    # 查看 value.yaml

    # 关于 chart repository
    repo
        add [name] [url]  # 添加一个远程仓库
        remove [name]...  # 删除仓库
        update [name]...  # 获取仓库的最新信息。如果不指定 name ，则更新所有仓库
        list              # 列出所有仓库
    search repo <string>  # 在已添加的所有仓库中，搜索名称包含该字符串的 chart 。这会使用本机缓存的仓库信息进行搜索，因此需要事先执行 helm repo update
    search hub <string>   # 在 artifacthub.io 搜索 chart ，这会实时查询远程仓库
    pull <chart>          # 拉取 chart 到本机。可以指定位于远程仓库的 chart name ，或者 chart URL
    push <chart> <repo>   # 指定位于本机的 chart ，推送到仓库

    # 关于 release
    list                      # 列出当前 k8s 中的所有 release
    install <release> <chart> # 将一个 chart 渲染成指定名称的 release ，然后部署到 k8s 。兼容 helm template 的命令行参数
        --create-namespace    # 如果 release 使用的 k8s 命名空间不存在，则自动创建
        --dry-run             # 模拟执行命令，但并不会实际部署 release
        -g                    # --generate-name ，自动命名 release 。此时可省略 install <name> <chart> 中的 name ，因此可以重复 install ，不会命名冲突
        --wait                # 等待 release 成功启动，比如 Pod 变为 Ready 状态。默认不会等待，创建 release 包含的所有 k8s 对象之后，就结束 helm 命令
        --timeout 5m          # 当前命令执行的超时时间
        --atomic              # 启用 --wait 选项，并且在部署失败时，自动删除该 release 创建的所有 k8s 对象，从而实现原子性操作
    uninstall <release>...    # 卸载 k8s 中的 release 。等价于 helm delete 命令
        --wait                # 等待所有相关的 k8s 对象被删除
    upgrade <release> <chart> # 升级 k8s 中一个 release 。兼容 helm install 的命令行参数
        # upgrade 命令会比较当前 release 与 chart 的差异，然后对 release 做出修改。因此 upgrade 时使用的 chart name ，与 install 时可以不同，但 upgrade 过程更不可控
    rollback <release> [revision] # 将 release 回滚到指定版本。如果未指定 revision ，则回滚到上一个版本
        # release 在 install 之后的版本号为 revision=1 ，每次 upgrade、rollback ，都会使 revision 加 1

    --debug               # 打印调试信息
    --kubeconfig ~/.kube/config
    -n default            # --namespace ，指定 k8s 命名空间
    -A                    # --all-namespaces ，指定所有 k8s 命名空间
```
- 例：
  ```sh
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm search repo nginx
  helm install nginx bitnami/nginx -n test --atomic
  ```
- 执行 helm 命令时，会读取一些环境变量作为配置参数。例如：
  ```sh
  KUBECONFIG="~/.kube/config"           # 表示到哪读取 kubeconfig 配置文件
  HELM_CACHE_HOME="~/.cache/helm"       # helm 的缓存文件目录
  HELM_CONFIG_HOME="~/.config/helm"     # helm 的配置文件目录
  HELM_DATA_HOME="~/.local/share/helm"  # helm 的数据文件目录
  ```
- 可以指定多种位置的 chart ：
  ```sh
  helm install nginx bitnami/nginx      # 指定位于远程仓库的 chart name
  helm install nginx nginx-13.2.21.tgz  # 指定位于本机的 chart 压缩包
  helm install nginx nginx              # 指定位于本机的 chart 目录
  helm install nginx https://xxx/charts/nginx-13.2.21.tgz   # 指定位于 chart URL
  ```
- 使用 OCI registry 的示例：
  ```sh
  helm registry login arbor.test.com -u test              # 登录远程仓库
  helm push nginx-12.0.tgz oci://harbor.test.com/test     # 指定位于本机的 chart ，推送到仓库。注意 URL 必须以 oci:// 协议开头
  helm pull oci://harbor.test.com/ops/nginx --version 12.0
  helm install release-nginx oci://harbor.test.com/ops/nginx --version 12.0
  ```

## chart

- 执行 `helm create mysite` 新建一个 chart 目录，如下：
  ```sh
  mysite/
  ├── charts/             # 存放当前 chart 依赖的其它 chart
  ├── chart.yaml          # 记录该 chart 的简介信息
  ├── .helmignore         # 记录一些文件路径，在打包 chart 时忽略
  ├── README.md
  ├── crds/               # 存放 CRD 的定义文件，不支持使用 Golang Template 模板语法，被 helm install 之后也不支持 upgrade、uninstall
  ├── templates/          # 存放该 k8s 应用的配置文件，通常使用 Golang Template 模板语法
  │   ├── deployment.yaml
  │   ├── NOTES.txt       # 用 helm install 部署该 chart 时，显示一些提示语
  │   └── service.yaml
  └── values.yaml         # 用于给 templates 中的变量赋值
  ```

- chart.yaml 文件的示例：
  ```yaml
  apiVersion: v2
  name: mysite
  description: A Helm chart for Kubernetes
  type: application
  version: 0.1.0          # 该 chart 本身的版本
  appVersion: "1.16.0"    # 该 chart 要部署的 k8s 应用的版本
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

### Hook

- release 被 helm 部署到 k8s 中时，如果包含多种 k8s 对象，则会按以下顺序创建：
  ```sh
  Namespace
  NetworkPolicy
  ServiceAccount
  Secret
  ConfigMap
  ...
  ```
  使用 helm 钩子，可以在正常部署顺序之外，执行一些操作。

- 可以给 `chart/templates/` 目录下一些 k8s 对象添加 hook 注释，将该对象声明为 helm 钩子，在特定阶段执行。
  - 例如将一个 k8s Job 声明为钩子：
    ```yml
    apiVersion: batch/v1
    kind: Job
    metadata:
      name: "{{ .release.Name }}"
      annotations:
        "helm.sh/hook": pre-install,post-delete,pre-upgrade,pre-rollback  # 表示在哪些阶段执行该 hook
        "helm.sh/hook-weight": "-5"                   # 该 hook 的权重，可以为正数、负数。同一阶段存在多个 hook 时，会先执行权重更大的 hook
        "helm.sh/hook-delete-policy": hook-succeeded  # 表示何时删除该 hook 。默认为 before-hook-creation ，即在执行新 hook 之前删除旧的 hook
    ```
  - 例如 helm install 命令的执行流程如下：
    1. helm 进程从 chart 文件渲染出 release 文件，并取出其中的 Hook 。
    2. 执行 pre-install 阶段的所有 hook 。
        - 按照 weight 从大到小的顺序依次执行 hook 。等一个 hook 执行完毕（比如 k8s Job 变为 Complete 状态），才执行下一个 hook 。
    3. 创建 release 包含的所有 k8s 对象。
    4. 执行 post-install 阶段的所有 hook 。
    5. helm 进程退出。
  - Hook 不包含在 release 中，执行之后通常会被删除。
  - 通过 helm 钩子可以执行一些自定义的操作，比如在部署 k8s 应用时执行 SQL 。但在 helm 命令之外，用 shell 脚本来执行自定义操作，可能更方便。
