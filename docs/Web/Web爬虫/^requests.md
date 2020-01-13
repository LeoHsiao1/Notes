# ♢ requests

：Python的第三方库，基于Python的标准库urllib，提供了一些很方便的访问Web服务器的方法。

## 关于请求报文

### GET方法

发出GET请求：
```python
>>> import requests
>>> r = requests.get("http://www.baidu.com")
>>> r					      # 返回值是一个Response对象，代表响应报文
<Response [200]>
```

在URL中添加Query String：
```python
>>> params= {'key1': 'value1', 'key2': 'value2', 'key3': None}
>>> r = requests.get("http://httpbin.org/get", params=params)   # 添加的params会被转换成Query String
>>> r.url                                                       # 查看最终的URL
'http://httpbin.org/get?key1=value1&key2=value2'	              # params字典中value为None的key会被忽略
```

查看请求报文的信息：
```python
>>> r.url                   # 查看请求的URL
'http://www.baidu.com/'
>>> r.request               # 获取请求报文的Request对象
<PreparedRequest [GET]>
>>> print(r.request.body)   # 查看请求报文的body
None
```

### POST方法

发出POST请求：
```python
>>> data = {'key1': 'value1', 'key2': 'value2'}	
>>> r = requests.post("http://httpbin.org/post", data=data)   # 发出POST请求，body默认采用x-www-form-urlencoded格式
```

POST请求报文的body默认采用x-www-form-urlencoded格式，也可以主动指定body的格式：
```python
>>> headers = {'Content-Type': 'application/json'}
>>> r = requests.post("http://httpbin.org/post", json=data, headers=headers)
```

### timeout

为了不阻塞进程，建议设置HTTP请求的超时时间：
```python
>>> r = requests.get('http://www.baidu.com', timeout=1)
```
- 当requests发出HTTP请求后，如果超过timeout秒之后还没有收到服务器的响应，就会抛出异常requests.exceptions.Timeout。
- 如果不设置超时时间，程序就会一直等待，阻塞当前进程。

### Session

创建Session之后可以在同一个会话中多次发出HTTP请求：
```python
>>> s = requests.Session()		        # 创建一个会话
>>> s.auth = ('user', 'pass')		      # 设置该会话的一些属性，作为HTTP通信的默认值
>>> r = s.get("http://www.baidu.com")
>>> s.close()                         # 关闭会话
```

可以用with关键字创建一个会话，确保它会被关闭：
```python
with requests.Session() as s:
    r = s.get("http://www.baidu.com")
    ...
```

### headers

```python
>>> headers = {'user': 'me'}
>>> r = requests.get(url, headers=headers)    # 设置请求报文的headers
```
- 设置的headers可能会在某些情况下被覆盖掉。例如，如果在.netrc中设置了用户认证信息，则headers中设置的授权就不会生效。而如果设置了参数auth=... ，则.netrc的设置就无效了。

### cookies

```python
>>> r = requests.get(url, cookies={'k1': 'hello'})  # 在请求报文中添加cookies
>>> r.cookies                                       # 查看响应报文中的cookies
<RequestsCookieJar[Cookie(version=0, name='BDORZ', value='27315', domain='.baidu.com', ...)]>
```

### 代理服务器

```python
>>> proxies = {"http": "http://10.10.1.10:3128", "https": "http://10.10.1.10:1080", 'http://10.20.1.128': 'http://10.10.1.10:5323'}
>>> r = requests.get("http://example.org", proxies=proxies)
```

## 关于响应报文

```python
>>> r.status_code        # 查看响应报文的状态码
200
>>> r.reason             # 查看状态码对应的原因
'OK'
>>> r.raise_for_status() # 如果状态码是4xx或5xx就自动抛出异常
>>> r.headers            # 查看响应报文的headers
{'Cache-Control': 'private, no-cache, no-store, proxy-revalidate, no-transform', 'Connection': 'keep-alive', 'Content-Encoding': 'gzip', 'Content-Type': 'text/html', ...}
>>> r.encoding           # 查看响应报文的编码格式（requests会先检查r.headers中是否说明了编码格式，如果没说明则进行猜测）
'ISO-8859-1'
>>> r.encoding="utf-8"   # 可以修改r.encoding的值，指定一种编码格式
>>> r.content            # 查看响应报文的body（bytes类型）
b'<!DOCTYPE html>\r\n<!--STATUS OK--><html> <head>...
>>> r.text               # 查看响应报文的body（根据r.encoding自动解码成str类型）
'<!DOCTYPE html>\r\n<!--STATUS OK--><html> <head>...
```

### 重定向

当Web服务器的响应报文要求重定向时，requests会自动跳转。如下：
```python
>>> r = requests.get('http://github.com')
>>> r
<Response [200]>
>>> r.url
'https://github.com/'		# 查看当前的url，可见http请求被重定向到了https
```

可以主动禁止重定向：
```python
>>> r = requests.get('http://github.com', allow_redirects=False)
>>> r
<Response [301]>
```

HEAD方法默认禁止重定向，可以主动开启：
```python
>>> r = requests.head('http://github.com', allow_redirects=True)
>>> r
<Response [200]>
```

### 历史记录

Reponse对象的history属性记录了已经发出的每个HTTP请求的响应报文：
```python
>>> r.history
[<Response [301]>]            # 它是一个Reponse对象的列表
>>> r.history[0].status_code
301
```

## HTTPS

requests会自动验证Web服务器的SSL证书（像浏览器一样）：
```python
>>> r = requests.get('https://kennethreitz.org', verify=False)		# 设置不验证SSL证书
InsecureRequestWarning: Unverified HTTPS request is being made.		# requests发出警告
>>> r
<Response [200]>
```
- 调用 requests.urllib3.disable_warnings() 可以关掉因为没有验证SSL证书而出现的警告。

设置客户端的证书：
```python
>>> r=requests.get('https://kennethreitz.org', cert=('/path/to/client.cert', '/path/to/client.key'))
```
- 需要将证书和私钥（必须是解密状态）的文件路径传给cert参数。

## 例

下例是爬取百度首页上的图片：
```python
import re
import requests


url = 'https://www.baidu.com'
r = requests.get(url, timeout=1)
if r.status_code != 200:
    raise RuntimeError
r.encoding = 'utf-8'
html = r.text

# 从html中筛选png图片的链接
# html中的目标数据为 src=//www.baidu.com/img/bd_logo1.png
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
