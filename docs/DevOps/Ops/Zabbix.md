# Zabbix

：一个运维监控工具，可以监控大量设备的运行状态。

## 架构

- zabbix server负责收集各个被监控设备的信息，保存到数据库中，并通过Web页面显示给用户看。
  - 当被监控设备数量很多时，可以分成几个区域，每个区域运行一个zabbix proxy充当小型server，再将所有proxy的信息汇总到核心的zabbix server。
  - zabbix server既可以等待agent发送信息过来，也可以主动拉取信息。
- zabbix server与被监控设备的通信方式：
  - agent：在被监控设备上安装相应的agent软件，将监控信息发送给zabbix server。
  - ssh/telnet
  - SNMP
  - IPMI
  - JMX


，，，待续