# Python各版本的差异

Python的版本主要分为 2.× 、 3.× 两个系列。
- 使用时当然选择越新的Python版本越好，但维护老版本的代码时，需要了解各版本之间的主要差异。
- 有时看到一些代码的语法特点，可以大致猜出它是什么版本，版本越老的代码越难维护。

## Python2与Python3

从Python2到Python3是一个大版本升级，有很多不向下兼容的差异，导致很多Python2的代码不能被Python3解释器运行，或者反之。
- Python2的最后一个子版本是Python2.7，此后没有再发布新版本，只是发布一些维护补丁。
- 到2020年，Python官方将停止对Python2的维护，所有老代码都会超过保质期。
- Python3计划每年发布一个新的子版本。

差异点|Python2|Python3
-|-|-
输出方式|用print关键字，比如`print "Hello"`|用print()函数，比如`print("Hello")`
输入方式|用raw_input()函数|用input()函数
字符串的编码格式|默认采用ASCII|默认采用Unicode
格式化字符串的方式|用 % ，比如`"Hello, %s" % ("World")`|用format()函数，比如`"Hello, {}".format('World')`
源文件的编码格式|默认采用ASCII，因此使用中文时要在源文件开头加上一行`# -*- coding: utf-8 -*-`|默认采用uft-8
...|...|...

## Python2系列

- Python2.0：于2000年[发布](https://www.python.org/downloads/release/2.0/)
- Python2.1 ~ Python2.6 略
- Python2.7：于2010年[发布](https://www.python.org/downloads/release/python-270/)

## Python3系列

- Python3.0：于2008年[发布](https://www.python.org/download/releases/3.0/)
- Python3.1 ~ Python3.3 略

### Python3.4

- 于2014年[发布](https://www.python.org/downloads/release/python-340/)
- 采用`pip`作为Python包的默认安装方式。
- 增加了标准库`pathlib`，用于按面向对象的方式操作文件路径。如下：

  ```python
  >>> from pathlib import Path
  >>> p = Path('/root/test/1.py')
  >>> p.name
  '1.py'
  >>> p.suffix
  '.py'
  >>> p.exists()
  False
  ```

- 增加了标准库`enum`，用于定义枚举类。如下：

  ```python
  >>> from enum import Enum
  >>>
  >>> class Test(Enum):
  ...     a = 1
  ...     b = 2
  ...     c = 3
  ...
  >>> Test.a
  <Test.a: 1>
  >>> Test['a']     # 可按名字索引
  <Test.a: 1>
  >>> list(Test)    # 可迭代
  [<Test.a: 1>, <Test.b: 2>, <Test.c: 3>]
  ```

- 增加了标准库`asyncio`，用于实现异步IO。
- 增加了标准库`statistics`，提供了求平均值、中位数、方差等运算的函数。
- 增加了标准库`tracemalloc`，用于跟踪内存分配的情况，方便调试。

### Python3.5

- 于2015年[发布](https://www.python.org/downloads/release/python-350/)
- 扩展了迭代拆包运算符 * 、字典拆包运算符 ** 的用法：
  - 可以在元组、列表、集合、字典表达式中使用

    ```python
    >>> *range(4)
    SyntaxError: can't use starred expression here
    >>> *range(4), 4
    (0, 1, 2, 3, 4)
    >>> [*range(4), 4]
    [0, 1, 2, 3, 4]
    >>> {'a': 1, **{'b': 2}}
    {'a': 1, 'b': 2}
    ```

  - 可以同时使用多次

    ```python
    >>> print(*[1], *[2], *{'c': 3})
    1 2 c
    >>> dict(**{'a': 1}, **{'b': 2})
    {'a': 1, 'b': 2}
    ```

- 允许使用Python2风格的 % 格式化字符串，如下：

  ```python
  >>> '%a' % 3.14
  '3.14'
  >>> b'%a' % 3.14
  b'3.14'
  ```

- 增加了函数注释的语法，用于说明形参、返回值的类型。
  - 它只是注释，不影响程序运行。
  - 它存储在函数的__annotations__属性中。

  ```python
  >>> def fun1(a, b: "字符串或None", c: int = 0)-> int:
  ...     pass
  ...
  >>> fun1.__annotations__
  {'b': '字符串或None', 'c': <class 'int'>, 'return': <class 'int'>}
  ```

- 增加了用`async`、`await`关键字定义协程的语法：

  ```python
  async def read_db(db):
      data = await db.fetch('SELECT ...')
  ```

- 增加了标准库`zipapp`，用于将Python脚本打包成可执行的归档文件，后缀名为 .pyz。

### Python3.6

- 于2016年[发布](https://www.python.org/downloads/release/python-360/)
- dict中的元素会按插入顺序存储。
- 可以在数字中插入下划线作为分隔符，提高可读性。如下：

  ```python
  >>> 1_000_111_000
  1000111000
  >>> '{:_}'.format(1000000)    # 格式化字符串时也可输出下划线
  '1_000_000'
  ```

- 给字符串加上前缀f之后，就会执行花括号 {} 内的语句。如下：

  ```python
  >>> a = 1
  >>> f'a={a}'
  'a=1'
  >>> f'{int(1) + 2}'
  '3'
  ```

- 定义元类的更好方法：给类定义__init_subclass__()方法，用于初始化子类。如下：

  ```python
  class TestBase:
      subclasses = []
  
      def __init_subclass__(cls, *args, **kwargs):
          super().__init_subclass__(*args, **kwargs)
          cls.subclasses.append（cls）
  ```

- 增加了标准库`secrets`，用于生成安全的随机数，可用作密码、加密密钥。（random模块生成的随机数是不安全的哦）

### Python3.7

- 于2018年[发布](https://www.python.org/downloads/release/python-370/)

### Python3.8

- 于2019年[发布](https://www.python.org/downloads/release/python-380/)
- 增加了赋值表达式的语法，可以给表达式中的变量赋值。如下：

  ```python
  if a := input():    # a = input(); if a:
      print(a)
  ```

  ```python
  >>> (a := 0) + 1
  1
  >>> a
  0
  ```

- 定义函数时，在正斜杆 / 之前的参数都会被视作位置参数。如下：

  ```python
  >>> def fun1(a, b, c=0, /, *args, **kwargs):
  ...     pass
  ...
  >>> fun1(1, 2, 3)
  >>> fun1(1, 2)
  ```

- 可以在f字符串中用`变量= `的形式打印变量的值，这在调试时很方便。如下：

  ```python
  >>> x = 1
  >>> print(f'{x=}')
  x=1
  ```

- 可以在finally语句块中使用continue关键字。
- multiprocessing模块增加了一个SharedMemory类，用于创建进程之间的共享内存。
