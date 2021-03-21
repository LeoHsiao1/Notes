# Zabbix

：一个传统的监控系统，可以监控大量设备的运行状态。
- 使用范围广，但是技术比较旧，配置比较繁琐。

## 架构

- zabbix server 负责收集各个被监控设备的信息，保存到 MySQL 数据库中，并通过 Web 页面显示给用户看。
  - 当被监控设备数量很多时，可以分成几个区域，每个区域运行一个 zabbix proxy 充当小型 server ，再将所有 proxy 的信息汇总到核心的 zabbix server 。
  - zabbix server 既可以等待 agent 发送信息过来，也可以主动拉取信息。
- zabbix server 与被监控设备的通信方式：
  - agent ：在被监控设备上安装相应的 agent 程序，将监控信息发送给 zabbix server 。这是最常用的方式。
  - ssh/telnet
  - SNMP
  - IPMI
  - JMX
- 用户可以手动在 zabbix server 上添加 agent ，也可以让 agent 主动将监控数据推送到 zabbix server ，实现自动注册。
- 添加一个 agent 之后，可以给它创建多个监控项、触发器。
  - 触发器用于在满足特定条件时发出告警消息。
- 用户可以通过修改 agent 的配置文件，自定义它的监控指标，比如执行某个脚本去采集监控数据。
