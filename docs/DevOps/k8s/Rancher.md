# Rancher

：一个基于 k8s 的容器管理平台，提供了 Web 操作界面。
- 由 Rancher Labs 公司推出。
- RKE ：Rancher Kubernetes Engine

使用经验：
- 一个 Rancher 服务器可以管理多个 k8s 集群，每个集群可以包含多个项目（Rancher 定义的一个抽象层），每个项目可以包含多个命名空间。
- 创建对象时有两种方式：
  - 填写 Web 表单
  - 导入 YAML 配置文件
- 每个对象的右上角有一个菜单按钮，点击后会显示一个下拉框。然后点击“升级”按钮可以修改其配置，点击“查看/编辑 YAML”按钮可查看其 YAML 信息。
- 在“工作负载”页面，显示了已部署的各个应用。
  - 点击一个应用可查看其下的所有 Pod 。此时点击“查看/编辑 YAML”按钮查看的是 Controller 的 YAML 信息。
  - 再点击 Pod 可查看其下的所有容器。此时点击“查看/编辑 YAML”按钮查看的是 Pod 对象的 YAML 信息。
  - 配置“健康检查”时，默认是同时配置 livenessProbe 和 readinessProbe ，也可以分别配置。
- Service 称为“DNS 记录”。
  - 部署应用时，如果添加了端口映射，会自动在“服务发现”页面创建相应的 Service ，与应用同名。也可以不添加端口映射，手动创建 Service 。
  - Service 可以是多种类型：ClusterIP、NodePort、负载均衡、Headless Service 。
  - Service 可以解析到多种 EndPoint ：外部 IP、外部域名、Service 名、工作负载、Pod 。
