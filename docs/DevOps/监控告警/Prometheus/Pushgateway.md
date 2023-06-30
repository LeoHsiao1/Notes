# Pushgateway

：一个 Web 服务器，支持第三方程序推送 metrics 到这里并缓存。
- [GitHub](https://github.com/prometheus/pushgateway)
- Prometheus 只支持主动从 exporter 拉取数据，不支持被 exporter 推送数据。而使用 Pushgateway ，可允许第三方程序推送 metrics 到 Pushgateway ，再由 Prometheus 定时从 Pushgateway 拉取。
- 优点：
  - 解耦了第三方程序与 Prometheus ，允许它们异步工作。
- 缺点：
  - 原本 Prometheus 采集 exporter 时，才会触发一次 metrics 生成。而使用 Pushgateway ，不能控制第三方程序生成 metrics 的间隔时间。
  - 如果第三方程序离线，则 Pushgateway 会一直记录最后一次推送的 metrics ，导致 Prometheus 采集到的 metrics 是过时的。需要根据 push_time_seconds 进行判断。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    pushgateway:
      container_name: pushgateway
      image: prom/pushgateway:v1.4.1
      restart: unless-stopped
      command:
        - --web.config.file=web.yml
      #   - --web.listen-address=:9091
      #   - --web.telemetry-path=/metrics
        - --persistence.file=metrics.bak     # 将 metrics 备份到该文件中（默认不会备份，因此重启后会丢失）
      ports:
        - 9091:9091
      volumes:
        - .:/pushgateway
  ```

## 配置


- 在 Prometheus 的配置文件中加入如下配置，使其抓取 Pushgateway ：
  ```yaml
  scrape_configs:
  - job_name: pushgateway
    honor_labels: true
    static_configs:
    - targets:
      - 10.0.0.1:9091
  ```

## 用法

- 例：推送指标到 Pushgateway
  ```sh
  cat <<EOF | curl --data-binary @- http://localhost:9091/metrics/job/pushgateway/instance/10.0.0.1
  # HELP test_metric Just an example.
  # TYPE test_metric gauge
  test_metric{name="one"} 42
  EOF
  ```
  - Pushgateway 会将收到的指标按 job、instance 的值进行分组。
    - 如果 URL 中不指定 job ，则会报错 404 。
    - 如果 URL 中不指定 instance ，则会默认设置为 instance="" 。

- 推送之后，Pushgateway 会记录以下指标：
  ```sh
  test_metric{job="pushgateway", instance="10.0.0.1", name="one"}  42               # 该 metric 最后一次推送的值
  push_failure_time_seconds{job="pushgateway", instance="10.0.0.1"}  0              # 该组 metric 最后一次失败推送的时间戳
  push_time_seconds{job="pushgateway", instance="10.0.0.1"}  1.5909774528190377e+09 # 该组 metric 最后一次成功推送的时间戳
  ```
  重复推送 test_metric 指标时，只会更新这三个指标的值，不会保留旧值。

## HTTP API

```sh
curl -X DELETE http://localhost:9091/metrics/job/pushgateway/instance/10.0.0.1      # 删除某个指标
```
