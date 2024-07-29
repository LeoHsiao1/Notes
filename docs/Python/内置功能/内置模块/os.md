# import os

：Python 的标准库，用于调用本机操作系统的 API 。
- [官方文档](https://docs.python.org/3/library/os.html)

## 关于进程

- 获取系统信息：
  ```py
  >>> import os
  >>> os.name     # 返回操作系统的接口类型。Windows 系统通常是 nt 类型，类 Unix 系统通常是 posix 类型
  'nt'
  >>> os.uname()  # 返回主机名称、系统版本（类 Unix 系统才支持该功能）
  posix.uname_result(sysname='Linux', nodename='...', release='3.10.0-1160.71.1.el7.x86_64', version='...', machine='x86_64')
  ```

- 关于环境变量：
  ```py
  >>> os.environ  # 它存储了当前进程的所有终端环境变量，取值为 Map 类型
  environ({...})
  >>> os.environ.get('PATH')        # 返回名为 'PATH' 的环境变量
  'C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;...
  >>> os.environ['DEBUG'] = 'true'  # 可以修改环境变量，不过只会作用于当前进程
  ```

- 关于进程：
  ```py
  >>> os.geteuid()  # 返回当前进程的 uid
  0
  >>> os.getlogin() # 返回当前终端登录的用户名
  'root'
  >>> os.getgid()   # 返回 user group id
  0
  >>> os.getpid()   # 返回当前进程的 pid
  18516
  >>> os.getppid()  # 返回 ppid ，也就是父进程的 pid
  6484
  >>> os.ctermid()  # 返回当前进程的终端文件（类 Unix 系统才支持该功能）
  '/dev/tty'
  ```

### os.system()

```py
os.system(cmd)
```
- 功能：创建一个终端（属于当前进程的子进程），执行一条命令。等子进程执行结束之后，将子进程的返回码（取值为 int 类型），作为该函数的返回值。
- 例：
  ```py
  >>> r = os.system('echo hello')
  hello   # 子进程的 stdout、stderr 会输出到当前进程的终端
  >>> r   # 子进程的返回码
  0
  ```

### os.popen()

```py
os.popen(cmd, mode='r', buffering=-1)
```
- 功能：创建一个终端（属于当前进程的子进程），执行一条命令。该函数返回一个管道（pipe），用于读取子进程的 stdout 。
  - 子进程的 stderr 会输出到当前进程的终端。
  - 参数 mode、buffering 的作用，与 open() 函数相同。
  - 实际上，`os.popen()` 是对 `subprocess.Popen()` 的封装。建议使用后者，功能更多。

- `os.system()` 会阻塞当前进程，直到子进程运行结束。而 `os.popen()` 会让子进程、当前进程同时运行。
  ```py
  >>> p = os.popen('ping localhost -c 3')   # 创建子进程，并开始运行
  >>> p
  <os._wrap_close object at 0x7fedc29ba470>
  >>> p.read()  # 读取子进程的 stdout 。如果子进程尚未结束，则会阻塞当前进程，直到子进程结束
  'PING localhost.localdomain (127.0.0.1) ...'
  ```

## 关于路径

- 转换路径：
  ```py
  >>> os.path.sep   # 返回本机的路径分隔符。Windows 系统通常是 '\\' ，类 Unix 系统通常是 '/'
  '\\'
  >>> os.path.normpath('/tmp/f1/')    # 将一个 path 正常化（并不会判断该路径是否存在），比如转换成本机的路径分隔符
  '\\tmp\\f1'
  >>> os.path.normpath('/tmp//f1//')  # 比如去掉多余的路径分隔符
  '\\tmp\\f1'
  >>> os.path.normpath('')            # 如果输入的 path 为空字符串，则返回 '.'
  '.'
  ```
  ```py
  >>> os.path.abspath('.')                # 输入一个 path ，将它转换成绝对路径
  'C:\\Users\\Leo'
  >>> os.path.relpath('/tmp/f1', '/tmp')  # 返回第一个 path ，相对于第二个 path ，的相对路径
  'f1'
  >>> os.path.relpath('/tmp/f1', '/tmp/test/f2')
  '..\\..\\f1'
  ```

- 分割路径：
  ```py
  >>> os.path.split('/tmp/1.py')  # 输入一个 path ，将它分割成目录名和文件名
  ('/tmp', '1.py')
  >>> os.path.split('/tmp/')      # 最后一个路径分隔符的右侧内容，会被视为文件名
  ('/tmp', '')
  >>> os.path.split('')
  ('', '')
  >>> os.path.normpath('C:/1/2.py').split(os.path.sep)  # 也可手动分割 path 这个字符串
  ['C:', '1', '2.py']
  ```
  ```py
  >>> os.path.dirname('/tmp/1.py')    # 提取目录名
  '/tmp'
  >>> os.path.basename('/tmp/1.py')   # 提取文件名
  '1.py'
  >>> os.path.join('/tmp', '1.py')    # 用本机的路径分隔符，将目录名、文件名合成一个 path
  '/tmp\\1.py'
  >>> os.path.join('/tmp', 'test', '1.py')  # 可以输入多层目录，一起合并
  '/tmp\\test\\1.py'
  ```

## 关于文件

- 关于工作目录：
  ```py
  >>> os.getcwd()       # 返回当前进程的工作目录
  'C:\\Users\\Leo'
  >>> os.chdir('D:\\')  # 将工作目录，改成指定目录
  ```

- 查看指定目录下的所有文件、文件夹：
  ```py
  >>> os.listdir('D:\\test')
  ['1.py', '__pycache__']
  ```
  - 返回结果，包括隐藏文件，但不包括 `.` 和 `..` 两个特殊文件。
  - 返回结果，不包括子目录下的内容。
  - 如果遇到异常（比如无权访问目标目录），则该函数不会返回任何结果。

- 查看指定目录以及所有子目录的内容：
  ```py
  >>> os.walk('.', onerror=print)
  <generator object walk at 0x000001CC520EBA98>
  >>> for i in _:
  >>>     print(i)
  >>>
  ('.', ['__pycache__'], ['1.py'])
  ('.\\__pycache__', [], [])
  ```
  - 该函数的返回值是一个生成器，迭代的每个元素是一个三元组：
    - 目录名
    - 该目录下的文件夹列表
    - 该目录下的文件名列表
  - 如果遇到异常，则该函数默认会忽略异常。建议传入 onerror 参数，记录遇到的异常。

- 获取文件的信息：
  ```py
  >>> os.path.exists('C:\\Users')   # 输入一个 path ，判断它是否存在于本机
  True
  >>> os.path.isfile('C:\\Users')   # 判断是否为文件，而不是目录。如果该路径不存在，则也返回 False
  False
  >>> os.path.isdir('C:\\Users')    # 判断是否为目录
  True
  >>> os.path.getsize('C:\\Users')  # 返回文件的体积，单位为 bytes 。如果该路径不存在，则抛出 OSError 异常
  4096
  >>> os.path.getctime('C:\\Users') # 返回文件的创建时间
  1546567973.6038435
  >>> os.path.getatime('C:\\Users') # 返回文件的最后访问时间
  1562806458.460649
  >>> os.path.getmtime('C:\\Users') # 返回文件的最后修改时间
  1562806458.460649
  >>> os.stat('C:\\Users')          # 返回文件的详细信息
  os.stat_result(st_mode=16749, st_ino=1407374883763938, st_dev=2351311628, st_nlink=1, st_uid=0, st_gid=0, st_size=4096, st_atime=1562806458, st_mtime=1562806458, st_ctime=1546567973)
  ```

- 修改文件：
  ```py
  >>> os.link(src, dst)                    # 创建硬链接。如果 dst 路径已存在，则抛出 OSError 异常
  >>> os.symlink(src, dst)                 # 创建符号链接
  >>> os.rename(src, dst)                  # 重命名
  >>> os.remove(path)                      # remove a file or directory
  >>> os.rmdir(path)                       # 删除目录。要求该目录不包含任何文件、子目录。如果该目录的内容不为空，则抛出 OSError 异常
  ```
  ```py
  >>> os.mkdir(path)                       # 创建目录。如果该路径已存在，则抛出 OSError 异常
  >>> os.makedirs('1/2/3')                 # 创建目录。如果中间几层目录不存在，则自动创建它们。如果最终目录已存在，则抛出 OSError 异常
  >>> os.makedirs('1/2/3', exist_ok=True)  # 如果最终目录已存在，则不报错
  ```
