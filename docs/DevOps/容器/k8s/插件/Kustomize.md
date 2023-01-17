# Kustomize

：k8s 官方提供的一个命令行工具。
- 部署 k8s 应用的基础方案，是用 `kubectl apply -f xx` 命令导入 YAML 配置文件。而用 kustomize 命令，可以对配置文件进行简单的定制化，不过没有 helm 模板那么灵活。
- 可以下载 kustomize 的二进制文件，然后执行。不过 kubectl 命令也集成了 kustomize ，可执行命令 `kubectl kustomize -h` 。


## 用法示例

1. 假设在 k8s 中用 kubectl 命令部署 nginx ，编写了两个配置文件 daemonset.yml、service.yml 。
2. 现在想改为 kustomize 部署方式，增加一个文件 kustomization.yml 文件，内容如下：
    ```yml
    apiVersion: kustomize.config.k8s.io/v1beta1
    kind: Kustomization

    resources:
      - daemonset.yml
      - service.yml
    ```
    - 此时的目录结构如下：
      ```sh
      nginx/
      ├── daemonset.yml
      ├── kustomization.yml
      └── service.yml
      ```
    - 包含 kustomization.yml 文件的目录（不包括子目录）称为 kustomization 目录。
3. 执行以下命令，构建一个 kustomization 目录：
    ```sh
    kubectl kustomize <dir>
    ```
    - 该命令会将 kustomization.yml 中声明的所有配置文件合并成一个 YAML 文件，打印到 stdout ，然后便可用 kubectl 命令部署到 k8s 。
    - 也可用 `kubectl apply -k <dir>` 命令构建并部署 kustomization 目录。
