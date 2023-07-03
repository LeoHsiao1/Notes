# Prometheus

：一个 Web 服务器，用于采集大量对象的监控指标，供用户查询。
- [官方文档](https://prometheus.io/docs/introduction/overview/)
- 采用 Golang 开发。
- 由 SoundCloud 公司的前 Google 员工于 2015 年发布，它起源于 Google 内部用于监控 Borg 系统的 Borgmon 系统。
- 优点：
  - 采集文本格式的监控指标。
  - 可监控主机、进程、容器等多种对象，通用性强。
- 缺点：
  - 属于离散采样，可能有遗漏、有延迟、有误差。
  - Prometheus 的图表功能很少，建议将它的数据交给 Grafana 显示。
