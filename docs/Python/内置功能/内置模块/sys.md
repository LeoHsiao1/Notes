# import sys

：Python 的标准库，用于调用 Python 解释器的 API 。
- [官方文档](https://docs.python.org/3/library/sys.html)

## 用法

- 关于当前进程：
  ```py
  >>> import sys
  >>> sys.argv        # 返回当前进程启动时，被传入的命令行参数。不过手动解析 sys.argv 比较麻烦，更推荐使用 argparse 标准库
  ['']
  >>> sys.executable  # 返回当前进程的可执行文件的路径
  '/usr/bin/python3'
  ```
  ```py
  >>> sys.exit()      # 退出当前 Python 解释器，也就是终止当前进程。默认返回 0 ，作为当前进程的返回码
  >>> sys.exit(1)     # 返回指定数字
  >>> exit()          # 也可调用内置函数 exit()
  ```

- 关于 Python 解释器：
  ```py
  >>> sys.path        # 记录几个常用目录。执行 import 语句时，会到这些目录下查找文件
  ['', '/usr/lib64/python36.zip', '/usr/lib64/python3.6', ...]
  >>> sys.modules     # 取值为 dict 类型，存储当前加载的所有 Python 模块
  {'sys': <module 'sys' (built-in)>, 'builtins': <module 'builtins' (built-in)>, ...}
  >>> sys.platform    # 返回本机操作系统的类型，比如 linux、darwin、win32
  'linux'
  >>> sys.implementation  # 返回 Python 解释器的版本信息。不过这些信息不多，更推荐使用 platform 模块
  namespace(_multiarch='x86_64-linux-gnu', cache_tag='cpython-36', hexversion=50727152, name='cpython', version=sys.version_info(major=3, minor=6, micro=8, releaselevel='final', serial=0))
  ```

- 以下三个对象，表示当前终端的标准输入、输出、错误：
  ```py
  sys.stdin
  sys.stdout
  sys.stderr
  ```
  - 例：写入字符串到 stdout
    ```py
    >>> sys.stdout    # 标准输出的存在，像一个文本文件
    <_io.TextIOWrapper name='<stdout>' mode='w' encoding='utf-8'>
    >>> count = sys.stdout.write('hello')   # 向 stdout 写入一个字符串，然后返回写入的字符数
    hello
    ```
  - 例：将 stdout、stderr 重定向到一个磁盘文件
    ```py
    >>> f = open('output.txt', 'w')
    >>> sys.stdout = f
    >>> sys.stderr = f
    >>> print('hello')    # print() 函数会将字符串作为 stdout 输出
    >>> raise RuntimeError('testing...')    # 抛出异常，这会作为 stderr 输出
    >>> sys.__stdout__    # 如果想恢复原来的 stdout ，则可使用该内置变量
    <_io.TextIOWrapper name='<stdout>' mode='w' encoding='utf-8'>
    ```

- 关于异常：
  ```py
  >>> a
  NameError: name 'a' is not defined
  >>> sys.last_type     # 返回最近一个异常的类型
  <class 'NameError'>
  >>> sys.last_value    # 返回最近一个异常的描述
  NameError("name 'a' is not defined",)
  ```

- 关于对象：
  ```py
  >>> sys.getrefcount(object()) # 返回对象的引用计数
  1
  >>> sys.getsizeof(object())   # 返回对象占用的内存大小，单位为 bytes
  50
  ```
