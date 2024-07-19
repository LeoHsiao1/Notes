# import io

：Python 的标准库，用于进行 IO 操作，也可用于创建缓存区。
- [官方文档](https://docs.python.org/3/library/io.html)

## IO 对象

- IO 操作的对象称为流对象，可以像文件一样读写。
  - 流对象可能是只读、只写，或可读可写的。
  - 流对象可能支持顺序读写，或者随机位置读写。
- IOBase 类是所有 IO 类的抽象基类。通常使用它的子类：
  - BytesIO ：用作字节流、二进制流，只能写入 bytes 类型的值。
  - StringIO ：用作字符流，只能写入 str 类型的值。
- 使用 open() 函数打开文件时，会返回一个文件对象，实际上是对 IO 对象的封装。因此文件对象与 IO 对象的大部分方法一致。

### 例

- 用法示例：
  ```py
  >>> import io
  >>> s = io.StringIO('Hello\n')  # 创建 IO 对象，并初始化其内容
  >>> s.write('World')            # 创建 IO 对象之后，指针最初指向第 0 个字节处，此时写入可能覆盖原有数据
  5
  >>> s.read()                    # 当前指针倒数第二个字节处，因此只会读取到 '\n'
  '\n'
  >>> s.seek(0)                   # 将指针指向 IO 对象的首部
  0
  >>> s.read()
  'Hello\n'
  >>> s.getvalue()                # 获取 IO 对象的全部内容，该方法不受指针位置的影响
  'Hello\n'
  >>> s.truncate(3)               # 截断 IO 对象
  3
  >>> s.getvalue()
  'Wor'
  >>> s.close()
  ```
- 操作完 IO 对象之后，应该调用 close() 方法关闭它。或者通过 with 关键字创建 IO 对象，会自动关闭它：
  ```py
  with io.StringIO() as s:
      s.write('Hello')
      s.getvalue()
  ```
- 可以读取文件内容，存储到 BytesIO 中，然后便可以在内存中读写文件。如下：
  ```py
  buf = io.BytesIO()
  with open('1.jpg', 'rb') as f:
      buf.write(f.read())

  buf.close()
  ```
