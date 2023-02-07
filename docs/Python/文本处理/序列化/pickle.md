# ♢ pickle

：Python 的标准库，可以将 Python 对象序列化成二进制形式。
- [官方文档](https://docs.python.org/3/library/pickle.html)
- 它序列化后的数据不是 XML、JSON 等通用格式，只能被 Python 解析读取。

## 例

- 序列化：
  ```py
  >>> import pickle
  >>> pickle.dumps('Hello')   # 序列化一个字符串
  b'\x80\x04\x95\t\x00\x00\x00\x00\x00\x00\x00\x8c\x05Hello\x94.'
  >>> with open('f1', 'wb') as f:
  ...     f.write(pickle.dumps('Hello'))       # 将序列化的数据保存到文件中
  ...
  24
  ```
  ```py
  >>> class Test:
  ...     a = 1
  ...
  >>> Test()
  <__main__.Test object at 0x0000018564081490>
  >>> pickle.dumps(_)         # 序列化自定义类型的对象
  b'\x80\x04\x95\x18\x00\x00\x00\x00\x00\x00\x00\x8c\x08__main__\x94\x8c\x04Test\x94\x93\x94)\x81\x94.'
  ```
- 反序列化：
  ```py
  >>> with open('f1', 'rb') as f:
  ...     data = f.read()
  ...
  >>> pickle.loads(data)
  'Hello'
  ```
