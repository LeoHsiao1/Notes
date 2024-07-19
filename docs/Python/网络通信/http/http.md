# HTTP

## import http

：Python 的标准库，提供了进行 HTTP 通信的基础功能。
- [官方文档](https://docs.python.org/3/library/http.html)

### 用法

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

## import urllib

：Python 的标准库，提供了访问 HTTP 服务器的基础功能，和 URLencode 的方法。
- 不过使用 requests 更方便。

### 用法

- 例：使用 urllib 发出 HTTP 请求
  ```py
  >>> from urllib import request
  >>> with request.urlopen("http://www.baidu.com") as f:  # 访问指定的 URL
  ...     data = f.read()    # 获取 HTTP 响应报文的 body（bytes 类型）
  ...     print(f.status)    # 获取状态码
  ...
  200
  >>> data.decode()          # 将报文 body 从 bytes 类型解码成 str 类型
  '<!DOCTYPE html>\n<!--STATUS OK-->\n\r...
  ```

- 使用 quote()、unquote() 可进行 URL 转码、反转码：
  ```py
  >>> from urllib import parse
  >>> r = parse.quote("http://www.你好.com")  # 转换成 Query String 格式的字符串
  >>> r
  'http%3A//www.%E4%BD%A0%E5%A5%BD.com'
  >>> parse.unquote(r)                        # 还原
  'http://www.你好.com'
  ```

- 使用 urlencode() 可以直接将 dict 类型转换成 Query String 格式的字符串：
  ```py
  >>> dict1 = {"id": 1, "wd": "你好"}
  >>> parse.urlencode(dict1)
  'id=1&wd=%E4%BD%A0%E5%A5%BD'
  ```
  - urlencode()只能转换一维字典，转换多维字典时需要先改成一维字典。\
    如下是一个多维字典：
    ```
    {
        "status": 0,
        "params": {
            "id": 1,
            "wd": "hello"
        }
    }
    ```
    需要转换成如下格式：
    ```
    {
        "status": 0,
        "params[id]": 1,
        "params[msg]": "hello"
    }
    ```
