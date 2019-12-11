# Rancher

：一个基于k8s的容器管理平台，提供了Web操作界面。
- 由Rancher Labs公司推出。
- RKE：Rancher Kubernetes Engine

使用经验：
- 一个Rancher服务器可以管理多个k8s集群，每个集群可以包含多个项目（Rancher定义的一个抽象层），每个项目可以包含多个命名空间。
- 在“工作负载”页面可部署“服务”，部署之后点“升级”按钮可修改其配置。
  - 部署服务时，如果添加了端口映射，会自动在“服务发现”页面创建相应的“DNS记录”，与服务同名。
- Service称为“DNS记录”。
  - 访问一个Service的名字，可以解析到多种目标：外部IP、外部域名、其它Service、工作负载、Pod。
- 一个存储类（Volume Class）上可以创建多个持久卷（PV）。
