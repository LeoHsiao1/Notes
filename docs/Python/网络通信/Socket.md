# Socket

## import socket

：Python 的标准库，用于调用本机操作系统的 Socket API ，进行 TCP/UDP 通信。
- [官方文档](https://docs.python.org/3/library/socket.html)
- 例：运行 TCP 服务器
  ```py
  import socket

  # 创建一个 Socket ，并且用 with 关键字管理上下文
  with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
      # 将 Socket 绑定到指定地址
      sock.bind(('0.0.0.0', 80))
      # 开始监听 Socket ，并设置 accept 队列的容量，即最多容纳多少个等待 accept 的 TCP 连接
      sock.listen(1)
      # 接受一个 TCP 连接
      # 如果 accept 队列中不存在 TCP 连接，则阻塞等待
      # 返回 client_sock 表示该连接对应的 Socket 对象，返回 client_addr 表示客户端的 (ip,port)
      client_sock, client_addr = sock.accept()
      with client_sock:
          print('Got connection from', client_addr)
          # 循环检查 client_sock 是否收到数据，直到 client_sock 被关闭
          # 由于陷入循环，该代码同时只能处理一个 client_sock
          while True:
              # 从 Socket 接收最多 1024 bytes 数据
              # 如果不存在数据，则阻塞等待
              # 如果对端已经关闭 TCP 连接，则返回 None
              data = client_sock.recv(1024)
              if not data:
                  break
              print(data)
  ```

- 例：运行 TCP 客户端
  ```py
  >>> import socket
  >>> sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  >>> sock.connect(('127.0.0.1', 80))
  >>> sock.send(b'hello')  # 向 Socket 发送数据，然后返回已发送的字节数
  5
  ```

- 例：运行 UDP 客户端
  ```py
  >>> import socket
  >>> sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
  >>> sock.sendto(b'hello', ('localhost', 80))
  >>> sock.recvfrom(1024)
  ```

## import socketserver

：Python 的标准库，提供了 TCPServer、UDPServer 等类，从而简化开发服务器的工作量。
- [官方文档](https://docs.python.org/3/library/socketserver.html)
- 例：运行 TCP 服务器
  ```py
  from socketserver import BaseRequestHandler, TCPServer

  class MyHandler(BaseRequestHandler):
      def handle(self):
          print('Got connection from', self.client_address)
          while True:
              data = self.request.recv(1024)
              if not data:
                  break
              print(data)

  if __name__ == '__main__':
      serv = TCPServer(('0.0.0.0', 80), MyHandler)
      serv.serve_forever()
  ```

- 例：运行 UDP 服务器
  ```py
  from socketserver import BaseRequestHandler, UDPServer

  class MyHandler(BaseRequestHandler):
      def handle(self):
          print('Got connection from', self.client_address)
          data, sock = self.request
          print(data, sock)

  if __name__ == '__main__':
      serv = UDPServer(('0.0.0.0', 80), MyHandler)
      serv.serve_forever()
  ```
