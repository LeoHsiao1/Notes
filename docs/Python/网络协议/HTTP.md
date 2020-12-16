# HTTP

## ♢ http

：Python 的标准库，提供了 HTTP 通信的部分基础功能。
- [官方文档](https://docs.python.org/3/library/http.html)
- 用 `http.server` 模块可以启动一个简单的 HTTP 服务器。它的功能很少，只适用于临时测试。
  - 可以直接在终端启动：
    ```sh
    python -m http.server
            8000                # 监听端口
            --bind 0.0.0.0      # 绑定 IP
            --directory /tmp    # 指定网站的根目录（默认是当前目录）
    ```
  - 也可以在 Python 中调用：
    ```py
    >>> from http import server
    >>> server.test(HandlerClass=server.SimpleHTTPRequestHandler, bind='0.0.0.0', port='8000')
    Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
    
    # 该函数会阻塞当前线程
    ```

- `http.HTTPStatus` 是一个枚举类，定义了几十种 HTTP 状态码。
  ```py
  >>> from http import HTTPStatus
  >>> list(HTTPStatus)
  [<HTTPStatus.CONTINUE: 100>, <HTTPStatus.SWITCHING_PROTOCOLS: 101>, <HTTPStatus.PROCESSING: 102>, ...]
  >>> HTTPStatus['OK']            # 通过名称索引一种状态码
  <HTTPStatus.OK: 200>
  >>> HTTPStatus['OK'].value
  200
  >>> HTTPStatus['OK'].phrase
  'OK'
  >>> HTTPStatus['OK'].description
  'Request fulfilled, document follows'
  ```
