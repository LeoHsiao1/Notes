# WebSocket

：HTML5 标准定义的一个协议。

## 原理

- 属于应用层协议，基于 TCP 通信。
- 通过 HTTP 协议握手，步骤如下：
  1. 客户端发出一个 HTTP/1.1 请求，请求头包含 `Upgrade: websocket` 和 `Connection: Upgrade` ，表示切换到 WebSocket 协议。
  2. 服务器返回一个响应报文，状态码为 101 (Switching Protocols) 。
  3. 双方通过该 HTTP 端口建立 TCP 长连接，进行全双工通信。
- URL 分为两种格式：
  - ws ：格式为 `ws://host:port/path` ，类似于 HTTP ，默认使用 TCP 80 端口。
  - wss ：格式为 `wss://host:port/path` ，类似于 HTTPS ，默认使用 TCP 443 端口。

## 例

- 客户端的 JS 代码示例：
  ```js
  var ws = new WebSocket("ws://10.0.0.1/test");
  ws.send("Hello World!");
  ws.close();
  ```
