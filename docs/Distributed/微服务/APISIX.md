# APISIX

- ：一个 API 网关。
- [官方文档](https://apisix.apache.org/docs/)
- 2019 年开源，由 ASF 基金会管理。
- 特点：
  - 提供了动态路由、负载均衡、限流等功能。
  - 支持动态更新，可在运行时更新配置、插件，不需重启。
  - 性能高。用作反向代理时，单核 CPU 的 QPS 为 18000 ，平均延迟为 0.2ms 。

## 原理

- APISIX 系统需要部署以下软件：
  - apisix ：包含以下模块：
    - openresty ：APISIX 基于它来收发、管理 HTTP 流量。因此部署 apisix 进程时，实际上是运行多个 Nginx 进程。
    - core ：APISIX 的核心代码。
    - plugin runtime ：运行一些插件。
      - APISIX 内置了一些插件，用户也可添加 Lua、Java、Golang、Python、JS 等语言开发的插件，还支持 WASM 插件。
  - dashboard ：提供对 APISIX 的 Web 管理页面。
  - etcd ：APISIX 默认将配置文件等数据存储在自身，可以改为存储到 etcd 数据库，从而可部署多个 apisix 实例，实现高可用。
  <!-- - Prometheus、Grafana ：用于获取可观测性 -->
- apisix 进程通常监听多个 TCP 端口：
  - 9080 ：用于接收一般的 HTTP 请求。
  - 9443 ：用于接收一般的 HTTPS 请求。
  - 9180 ：提供 HTTP 协议的 admin API ，用于修改 APISIX 的配置。详见 [官方文档](https://apisix.apache.org/docs/apisix/admin-api/) 。
  - 9090 ：提供 HTTP 协议的 control API ，用于查询 APISIX 的配置、运行状态。
  - 9091 ：提供 exporter 接口，供 Prometheus 采集监控指标，URI 为 /apisix/prometheus/metrics 。

## 部署

APISIX 有多种部署方式：
- 下载二进制程序，直接部署在主机上。这样比较麻烦。
- 通过 Docker 容器部署：
  ```sh
  docker run -d --name apisix \
      -p 9080:9080 \
      -e APISIX_STAND_ALONE=true \
      apache/apisix:3.0.0-debian
  ```
- 通过 docker-compose 部署，参考 [官方示例](https://github.com/apache/apisix-docker/blob/master/example/docker-compose.yml) 。
- 通过 k8s Ingress Controller 部署，然后作为 Ingress 使用。

### 版本

- v2.0
- v3.0
  - 2022 年发布。
  - 有很多不向下兼容的改动，因此建议旧版本先升级到 v2.15 ，再升级到 v3.0 。

## 用法

### route




### upstream

