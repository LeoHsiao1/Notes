# ♢ requests

：Python 的第三方库，提供了访问 HTTP 服务器的功能。
- [官方文档](https://requests.readthedocs.io/en/master/)
- 安装：`pip install requests`
- 基于 Python 的标准库 urllib 实现，但是功能更多，更加便捷。

## 关于请求报文

### GET

- 发出 GET 请求：
  ```py
  >>> import requests
  >>> r = requests.get("http://www.baidu.com")    # 目标 URL 的开头必须说明协议，比如 http://
  >>> r                                           # 返回值是一个 Response 对象，通过它可以获取响应报文
  <Response [200]>
  ```

- 在 URL 中添加 Query String ：
  ```py
  >>> params= {'key1': 'value1', 'key2': 'value2', 'key3': None}
  >>> r = requests.get("http://httpbin.org/get", params=params)   # 添加的 params 会被转换成 Query String
  >>> r.url                                                       # 查看最终的 URL
  'http://httpbin.org/get?key1=value1&key2=value2'                # params 字典中 value 为 None 的 key 会被忽略
  ```

### POST

- 发出 POST 请求：
  ```py
  >>> url = "http://httpbin.org/post"
  >>> r = requests.post(url, data='你好'.encode())
  ```
  - data 为 bytes 类型时，会直接作为 body 发送。
  - data 为 str 类型时，会经过 str.encode('latin-1') 转换成 bytes 类型，再作为 body 发送。
  - data 为 dict 类型时，会经过 URLencode ，再作为 body 发送。

- 查看请求报文的信息：
  ```py
  >>> r.url                   # 请求的 URL
  'http://httpbin.org/post'
  >>> r.request               # 请求报文对应的 Request 对象
  <PreparedRequest [POST]>
  >>> r.request.body          # 请求报文的 body
  b'\xe4\xbd\xa0\xe5\xa5\xbd'
  >>> r.request.headers       # 请求报文的 headers （这些是默认加上的）
  {'User-Agent': 'python-requests/2.23.0', 'Accept-Encoding': 'gzip, deflate', 'Accept': '*/*', 'Connection': 'keep-alive', 'Content-Length': '6'}
  ```

- 给 json 参数传入 dict 类型的值，就可以直接发出 'application/json' 类型的 POST 请求：
  ```py
  >>> data = {'key1': 'value1', 'key2': 'value2'}
  >>> r = requests.post(url, json=data)
  ```
  其对应的源码如下：
  ```py
  if not data and json is not None:
      content_type = 'application/json'
      body = complexjson.dumps(json)
      if not isinstance(body, bytes):
          body = body.encode('utf-8')
  ```

### timeout

- 为了不阻塞进程，建议设置 HTTP 请求的超时时间：
  ```py
  >>> r = requests.get('http://www.baidu.com', timeout=1)
  ```
  - 当 requests 发出 HTTP 请求后，如果超过 timeout 秒之后还没有收到服务器的响应，就会抛出异常 requests.exceptions.Timeout 。
  - 如果不设置超时时间，程序就会一直等待，阻塞当前进程。

### Session

- 创建 Session 之后，可以在同一个会话中多次发出 HTTP 请求：
  ```py
  >>> s = requests.Session()             # 创建一个会话
  >>> s.auth = ('user', 'pass')          # 设置该会话的一些属性，作为 HTTP 通信的默认值
  >>> r = s.get("http://www.baidu.com")
  >>> s.close()                          # 关闭会话
  ```

- 可以通过 with 关键字创建一个会话，确保它会被关闭：
  ```py
  with requests.Session() as s:
      r = s.get("http://www.baidu.com")
      ...
  ```

### headers

```py
>>> headers = {'user': 'me'}
>>> r = requests.get(url, headers=headers)    # 设置请求报文的 headers
```
- 设置的 headers 可能会在某些情况下被覆盖掉。例如，如果在.netrc 中设置了用户认证信息，则 headers 中设置的授权就不会生效。而如果设置了参数 auth=... ，则.netrc 的设置就无效了。

### cookies

```py
>>> r = requests.get(url, cookies={'k1': 'hello'})  # 在请求报文中添加 cookies
>>> r.cookies                                       # 查看响应报文中的 cookies
<RequestsCookieJar[Cookie(version=0, name='BDORZ', value='27315', domain='.baidu.com', ...)]>
```

### 代理服务器

- requests 支持使用 HTTP 协议的代理服务器：
  ```py
  proxies = {"http": "http://10.0.0.1:1080", "https": "http://10.0.0.1:1081"}
  r = requests.get("http://example.org", proxies=proxies)
  ```

- 也可使用 SOCKS 协议的代理服务器。需要先安装 `pip install requests[socks]` ，然后配置：
  ```py
  proxies = {
      'http': 'socks5://user:password@host:port',
      'https': 'socks5://user:password@host:port'
  }
  ```

## 关于响应报文

```py
>>> r.status_code        # 查看响应报文的状态码
200
>>> r.reason             # 查看状态码对应的原因
'OK'
>>> bool(r)              # 如果状态码不是 4xx 或 5xx ，则判断为访问成功
True
>>> r.raise_for_status() # 如果访问失败，则自动抛出异常
>>> r.headers            # 查看响应报文的 headers
{'Cache-Control': 'private, no-cache, no-store, proxy-revalidate, no-transform', 'Connection': 'keep-alive', 'Content-Encoding': 'gzip', 'Content-Type': 'text/html', ...}
>>> r.encoding           # 查看响应报文的编码格式（ requests 会根据响应报文的 Content-Type 选择编码格式，如果没有则默认为 ISO-8859-1 ）
'ISO-8859-1'
>>> r.encoding = "utf-8" # 可以修改 r.encoding 的值，指定一种编码格式
>>> r.content            # 查看响应报文的 body（bytes 类型）
b'<!DOCTYPE html>\r\n<!--STATUS OK--><html> <head>...
>>> r.text               # 查看响应报文的 body（根据 r.encoding 自动解码成 str 类型）
'<!DOCTYPE html>\r\n<!--STATUS OK--><html> <head>...
>>> r.elapsed.total_seconds() # 计算从开始发送请求报文，到解析完响应报文 Headers 的耗时
0.231441
```

### 重定向

- 当 HTTP 服务器返回一个重定向的响应报文时，requests 会自动跳转。如下：
  ```py
  >>> r = requests.get('http://github.com')
  >>> r
  <Response [200]>
  >>> r.url
  'https://github.com/'    # 查看当前的 url ，可见 http 请求被重定向到了 https
  ```

- 可以主动禁止重定向：
  ```py
  >>> r = requests.get('http://github.com', allow_redirects=False)
  >>> r
  <Response [301]>
  ```

- HEAD 方法默认禁止重定向，可以主动开启：
  ```py
  >>> r = requests.head('http://github.com', allow_redirects=True)
  >>> r
  <Response [200]>
  ```

### 历史记录

- Reponse 对象的 history 属性记录了已经发出的每个 HTTP 请求的响应报文：
  ```py
  >>> r.history
  [<Response [301]>]            # 它是一个 Reponse 对象的列表
  >>> r.history[0].status_code
  301
  ```

## HTTPS

- requests 会自动验证 HTTP 服务器的 SSL 证书（像浏览器一样）：
  ```py
  >>> r = requests.get('https://kennethreitz.org', verify=False)    # 设置不验证 SSL 证书
  InsecureRequestWarning: Unverified HTTPS request is being made.   # requests 发出警告
  >>> r
  <Response [200]>
  ```
  调用 requests.urllib3.disable_warnings() 可以关掉因为没有验证 SSL 证书而出现的警告。

- 设置客户端的证书：
  ```py
  >>> r=requests.get('https://kennethreitz.org', cert=('/path/to/client.cert', '/path/to/client.key'))
  ```
  需要将证书和私钥（必须是解密状态）的文件路径传给 cert 参数。

## 例

下例是爬取百度首页上的图片：
```py
import re
import requests


url = 'https://www.baidu.com'
r = requests.get(url, timeout=1)
if r.status_code != 200:
    raise RuntimeError
r.encoding = 'utf-8'
html = r.text

# 从 html 中筛选 png 图片的链接
# html 中的目标数据为 src=//www.baidu.com/img/bd_logo1.png
result = re.findall(r'src=(.*\.png)', html)
print(result)

# 合成图片的有效链接，下载到本地
for i in result:
    url = 'https:' + i
    filename = i.split('/')[-1]
    r = requests.get(url, timeout=1)
    if r.status_code != 200:
        raise RuntimeError
    with open(filename, 'wb') as f:
        f.write(r.content)
```
