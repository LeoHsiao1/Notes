# Prometheus

：一个监控系统，基于 Go 语言开发。
- 源于 Google Borg 系统的监控系统，后来成长为一个独立项目。
- 擅长从大量节点上采集指标数据。
- [官方文档](https://prometheus.io/docs/introduction/overview/)

## 原理

- 在被监控对象的主机上运行一个 exporter 进程，负责采集指标数据（metrics）。
  - 主流软件都提供了自己的 exporter 程序，例如：mysql_exporter、redis_exporter 。
- Prometheus Server 会定时向各个 exporter 发出 HTTP 请求，获取指标数据，并存储到时序数据库 TSDB 中。
  - 属于离散采样，可能有遗漏、有误差。
- 建议先用 Prometheus 采集指标数据并存储到 TSDB 中，再交给 Grafana 显示监控页面。

## 相关概念

PromQL ：Prometheus 自带的查询语言，用于查询监控数据。

Push Gateway ：允许 exporter 主动推送数据到这里，相当于一个缓存，会被 Prometheus 定时拉取。

Alertmanager ：提供告警功能。
