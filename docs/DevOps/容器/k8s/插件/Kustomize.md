# Kustomize

：k8s 官方提供的一个命令行工具，用于对一些 YAML 配置文件进行组合、修改。
- kubectl 命令集成了 kustomize ，可执行命令 `kubectl kustomize -h` 。也可以单独下载 kustomize 编译后的可执行文件。

## 示例

### 组合配置

假设原本在 k8s 中用 kubectl 命令部署 nginx ，编写了两个配置文件 deployment.yml、service.yml 。现在改为 kustomize 部署方式，步骤如下：
1. 增加一个文件 kustomization.yml ，内容如下：
    ```yml
    apiVersion: kustomize.config.k8s.io/v1beta1
    kind: Kustomization
    resources:          # 指定一些配置文件，或 kustomization 目录，将它们组合成一个 YAML 文件
    - deployment.yml
    - service.yml
    ```
    - 此时的目录结构如下：
      ```sh
      nginx/
      ├── deployment.yml
      ├── kustomization.yml
      └── service.yml
      ```
    - 包含 kustomization.yml 文件的目录（不包括子目录）称为 kustomization 目录。
2. 执行以下命令，构建 kustomization 目录：
    ```sh
    kubectl kustomize nginx/
    ```
    - 该命令会将所有 resources 配置文件组合成一个 YAML 文件，打印到 stdout ，然后便可用 kubectl 命令部署到 k8s 。
    - 也可用 `kubectl apply -k <dir>` 命令构建并部署 kustomization 目录。

### 修改配置

假设想在 k8s 中部署多个版本的 nginx ，不同版本的大部分配置参数相同。为每个版本单独编写一套 YAML 配置文件比较麻烦，更好的方案是复用一套配置文件，用 kustomize 命令在每次部署时，根据当前版本修改少量配置参数。步骤如下：
1. 准备一个配置文件目录，结构如下：
    ```sh
    nginx/
    ├── base/
    │   ├── deployment.yml
    │   ├── kustomization.yml
    │   └── service.yml
    ├── v1
    │   ├── replicas.yml
    │   └── kustomization.yml
    └── v2
        └── ...
    ```
    - base 目录的文件内容如同上一个示例。而 v1、v2 目录会引用 base 目录，在其基础上修改少量配置参数。
    - `nginx/v1/kustomization.yml` 的内容如下：
      ```yml
      apiVersion: kustomize.config.k8s.io/v1beta1
      kind: Kustomization
      resources:
      - ../base
      patchesStrategicMerge:  # 添加一些补丁，用于修改 resources 中指定 kind、metadata.name 的配置文件中的字段
      - replicas.yml
      ```
    - `nginx/v1/replicas.yml` 的内容如下：
      ```yml
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: nginx
      spec:
        replicas: 3
      ```
2. 执行以下命令，构建 kustomization 目录：
    ```sh
    kubectl kustomize nginx/v1
    ```
