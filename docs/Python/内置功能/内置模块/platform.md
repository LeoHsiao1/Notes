# import platform

：Python 的标准库，用于查看本机的平台信息。
- [官方文档](https://docs.python.org/3/library/platform.html)

## 用法

- 关于操作系统：
  ```py
  >>> import platform
  >>> platform.uname()      # 返回操作系统的类型、版本等信息
  uname_result(system='Linux', node='CenOS-1', release='3.10.0-1120.51.1.el7.x86_64', version='#1 SMP Tue Jun 28 15:37:28 UTC 2022', machine='x86_64', processor='Intel64 Family 6 Model 158 Stepping 10, GenuineIntel')
  >>> platform.system()     # 返回操作系统的类型，比如 Linux、Darwin、Windows
  'Linux'
  >>> platform.release()    # 返回操作系统的版本
  '3.10.0-1120.51.1.el7.x86_64'
  >>> platform.machine()    # 返回 CPU 的架构类型。比如 x86_64、AMD64
  'x86_64'
  >>> platform.processor()  # 返回 CPU 的具体名称
  'Intel64 Family 6 Model 158 Stepping 10, GenuineIntel'
  ```

- 关于 Python 解释器：
  ```py
  >>> platform.architecture()[0]        # 返回本机的 CPU 字长
  '64bit'
  >>> platform.python_version()         # 返回 Python 解释器的版本
  '3.6.8'
  >>> platform.python_version_tuple()   # 将版本号，分割成三个字段
  ('3', '6', '8')
  >>> platform.python_implementation()  # 返回 Python 解释器的实现类型，比如 CPython、Jython、PyPy
  'CPython'
  ```
