# Zabbix

：一个传统的运维监控工具，可以监控大量设备的运行状态。

## 架构

- zabbix server 负责收集各个被监控设备的信息，保存到数据库中，并通过 Web 页面显示给用户看。
  - 当被监控设备数量很多时，可以分成几个区域，每个区域运行一个 zabbix proxy 充当小型 server ，再将所有 proxy 的信息汇总到核心的 zabbix server 。
  - zabbix server 既可以等待 agent 发送信息过来，也可以主动拉取信息。
- zabbix server 与被监控设备的通信方式：
  - agent ：在被监控设备上安装相应的 agent 软件，将监控信息发送给 zabbix server 。
  - ssh/telnet
  - SNMP
  - IPMI
  - JMX


> TODO:待补充