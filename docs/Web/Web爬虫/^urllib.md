# ♢ urllib

：Python的标准库，提供了访问Web服务器的方法、URLencode的方法。

## 访问Web服务器

例：
```python
>>> from urllib import request
>>> with request.urlopen("http://www.baidu.com") as f:  # 访问指定的URL
...     data = f.read()    # 获取HTTP响应报文的body（bytes类型）
...     print(f.status)    # 获取状态码
...
200
>>> data.decode()		   # 将报文body从bytes类型解码成str类型
'<!DOCTYPE html>\n<!--STATUS OK-->\n\r...
```

## URLencode

使用quote()、unquote()可进行URL转码、反转码。如下：
```python
>>> from urllib import parse
>>> r = parse.quote("http://www.你好.com")  # 转换成 Query String 格式的字符串
>>> r
'http%3A//www.%E4%BD%A0%E5%A5%BD.com'
>>> parse.unquote(r)                        # 还原
'http://www.你好.com'
```

使用urlencode()可以直接将dict类型转换成 Query String 格式的字符串。如下：
```python
>>> dict1 = {"id": 1, "wd": "你好"}
>>> parse.urlencode(dict1)
'id=1&wd=%E4%BD%A0%E5%A5%BD'
```
- urlencode()只能转换一维字典，转换多维字典时需要先改成一维字典。

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
