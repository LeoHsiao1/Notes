# MQTT

：消息队列遥测传输协议（Message Queuing Telemetry Transport），常用于物联网通信。
- 属于应用层协议，基于TCP通信。
- 适用于低带宽、不可靠网络中的通信。
- 采用C/S架构。
  - mqtt server又称为mqtt broker，常见的服务器软件有ActiveMQ、mosquitto、EMQ等。
  - mqtt client与mqtt broker建立连接之后就构成了一个会话（Session）。
- 采用发布/订阅（publish/subscribe）模式。
  - mqtt client可以发布消息到mqtt broker的某个topic下（此时称为Publisher），也可以订阅mqtt broker的某个topic下的消息（此时称为Subscriber）。
- [MQTTv5.0标准文档](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)

## 报文

- MQTT协议的报文有多种类型，比如PUBLISH、SUBSCRIBE等。
- 一个MQTT报文的内容分为三部分：
  - 固定报头（Fixed header）：存在于所有报文中。
  - 可变报头（Variable header）：存在于某些报文中。
  - 有效载荷（payload）：存在于某些报文中，存储实际的消息内容。
- 每个报文都有一个服务质量（QoS）标志位，用两个bit位存储。
  - QoS=00：表示该消息最多发布一次，可能一次都没收到。
  - QoS=01：表示该消息至少发布一次，可能收到多次。
  - QoS=10：表示该消息仅发布一次，保证收到且只收到一次。
  - QoS=11：保留。
- 如果客户端或服务器收到了内容、格式不符合MQTT规定的消息，就必须断开本次Session。

## Topic

- mqtt broker通过topic来分组管理消息。
- topic的语法
  - 采用UTF-8编码。
  - 可以用 / 分隔出多层目录。
- 当某个Publisher向某个topic发送消息时，mqtt broker会立即将消息推送给订阅该topic的所有Subscriber。
  - Publisher发布消息时，必须要指定一个topic的完整名字。
  - Subscriber在订阅时，必须要发送一个主题过滤器（Topic Filter）。

## Topic Filter

- 主题过滤器是一个字符串，可以是某个topic的完整名字，也可以使用通配符。
  - `+` ：单层通配符，匹配该层的所有主题。
  - `#` ：多层通配符，匹配该层以及其下各层的所有主题，只能用于topic的末尾。
- 例：
  - 主题过滤器`sport/tennis/+`匹配`sport/tennis/player1`、`sport/tennis/player2`，但不匹配`sport/tennis/player1/ranking`。
  - `sport/+`匹配`sport/`，不匹配`sport`。
  - `/finance`匹配`+/+`和`/+`，但是不匹配`+`。
  - `+`、`+/tennis/# `、`sport/+/player1`是有效的。
  - `sport+`是无效的。
  - `# `是有效的，会匹配所有topic。
  - `sport/tennis/# `是有效的，而`sport/tennis# `、`sport/tennis/# /ranking`是无效的。
- 因为`$SYS/`被广泛用作包含服务器特定信息或控制接口的主题的前缀，所以`+`和`#`都不会匹配以`$`开头的主题，需要单独订阅，比如用`$SYS/#`。
