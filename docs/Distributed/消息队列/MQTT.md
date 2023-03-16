# MQTT

- MQTT 是一个主要用于物联网通信的 MQ 协议。
- [MQTT v5.0 官方标准](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)

## 报文

- MQTT 协议以报文为单位传输消息。报文有多种类型，比如 PUBLISH、SUBSCRIBE 等。
- 一个 MQTT 报文的内容分为三部分：
  - 固定报头（Fixed header）：存在于所有报文中。
  - 可变报头（Variable header）：存在于某些报文中。
  - 有效载荷（payload）：存在于某些报文中，存储实际的消息内容。
- 每个报文都有一个服务质量（QoS）标志位，用两个 bit 位存储。
  - QoS=00 ：表示该消息最多发布一次，可能一次都没收到。
  - QoS=01 ：表示该消息至少发布一次，可能收到多次。
  - QoS=10 ：表示该消息仅发布一次，保证收到且只收到一次。
  - QoS=11 ：保留。
- 如果客户端或服务器收到了内容、格式不符合 MQTT 规定的消息，就必须断开本次 Session 。

## Topic

- mqtt broker 通过 topic 来分组管理消息。
- topic 的语法：
  - 采用 UTF-8 编码。
  - 可用 / 分隔出多层目录。
- 当某个 Publisher 向某个 topic 发送消息时，mqtt broker 会立即将消息推送给订阅该 topic 的所有 Subscriber 。
  - Publisher 发布消息时，必须要指定一个 topic 的完整名字。
  - Subscriber 在订阅时，必须要发送一个主题过滤器（Topic Filter）。

### Topic Filter

- 主题过滤器是一个字符串，可以是某个 topic 的完整名字，也可以使用通配符。
  - `+` ：单层通配符，匹配该层的所有主题。
  - `#` ：多层通配符，匹配该层以及其下各层的所有主题，只能用于 topic 的末尾。
- 例：
  - 主题过滤器 `sport/tennis/+` 匹配 `sport/tennis/player1`、`sport/tennis/player2` ，但不匹配 `sport/tennis/player1/ranking` 。
  - `sport/+` 匹配 `sport/` ，不匹配 `sport` 。
  - `/finance` 匹配 `+/+` 和 `/+` ，但是不匹配 `+` 。
  - `+`、`+/tennis/# `、`sport/+/player1` 是有效的。
  - `sport+` 是无效的。
  - `# ` 是有效的，会匹配所有 topic 。
  - `sport/tennis/# ` 是有效的，而 `sport/tennis# `、`sport/tennis/# /ranking` 是无效的。
- 因为 `$SYS/` 被广泛用作包含服务器特定信息或控制接口的主题的前缀，所以 `+` 和 `#` 都不会匹配以 `$` 开头的主题，需要单独订阅，比如用 `$SYS/#` 。
