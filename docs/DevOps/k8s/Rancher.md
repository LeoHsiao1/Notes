# Rancher

：一个基于k8s的容器管理平台，提供了Web操作界面。
- 由Rancher Labs公司推出。
- RKE：Rancher Kubernetes Engine

使用经验：
- 一个Rancher服务器可以管理多个k8s集群，每个集群可以包含多个项目（Rancher定义的一个抽象层），每个项目可以包含多个命名空间。
- 创建对象时有两种方式：
  - 填写Web表单
  - 导入YAML配置文件
- 创建一个对象之后，点击“升级”按钮可以修改其配置，点击“查看YAML”按钮可查看其YAML配置文件。
- 应用称为“工作负载”。
- Service称为“DNS记录”。
  - 部署应用时，如果添加了端口映射，会自动在“服务发现”页面创建相应的“DNS记录”，与应用同名。
  - Service可以是多种类型：ClusterIP、NodePort、负载均衡、Headless Service。
  - Service可以解析到多种EndPoint：外部IP、外部域名、Service名、工作负载、Pod。
- 一个存储类（Volume Class）上可以创建多个持久卷（PV）。
