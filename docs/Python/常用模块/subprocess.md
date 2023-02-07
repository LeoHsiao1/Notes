# ♢ subprocess

：Python 的标准库，用于创建一个子进程去执行命令。
- [官方文档](https://docs.python.org/3/library/subprocess.html)
- 与 `os.system()`、`os.popen()` 的用途相同，但功能更强。

## Popen

### 定义

```py
class Popen(args,           # 待执行的命令
            bufsize=-1,     # 使用 Pipe 时的缓冲区大小
            stdin=None,     # 提供子进程标准输入的文件描述符
            stdout=None,
            stderr=None,
            shell=False,    # 是否在系统 shell 终端中执行命令
            cwd=None,       # 执行命令时的工作目录，默认是当前目录
            env=None,       # 可以传入一个字典，作为子进程的所有环境变量。默认继承当前进程的所有环境变量
            ...)
```
- `args` 是在系统终端执行的命令，不是 Python 语句。
  - 可以是一个字符串，表示可执行文件名或路径（可以是相对路径）。比如 `args='ls'` 。
  - 也可以是一个字符串列表，其中第一个字符串表示可执行文件，之后的字符串表示命令参数。比如 `args=['echo', 'Hello']` 。
- `bufsize` 可用的取值如下：
  ```sh
  0       # 无缓冲
  1       # 行缓冲
  +int    # 使用 int 大小的缓冲
  -int    # 使用系统默认大小的缓冲（默认是 8KB）
  ```
- `stdin`、`stdout`、`stderr` 可用的取值如下：
  ```sh
  None                # 重定向到当前进程
  subprocess.PIPE     # 缓存到 Pipe 中
  subprocess.STDOUT   # 重定向到 stdout
  subprocess.DEVNULL  # 丢弃
  ```

### 例

- 常用属性和方法：
  ```py
  >>> import subprocess
  >>> p = subprocess.Popen('pwd')              # 输入一个字符串作为 args
  /root
  >>> p = subprocess.Popen(['echo', 'Hello'])  # 输入一个字符串列表作为 args
  Hello
  >>> p.args
  ['echo', 'Hello']
  >>> p.pid
  30760
  >>> p.communicate()                     # 调用 communicate(input=None, timeout=None) 会返回子进程的 (stdout, stderr)
  (None, None)
  >>> p.wait(timeout=10)                  # 等待子进程退出，并返回其退出码。默认是一直等待，可以指定等待的超时时间。重复调用该方法会立即返回退出码
  0
  >>> p.returncode                        # 获取子进程的返回码，如果它尚未退出则返回 None
  0
  >>> p.kill()                            # 终止子进程（在 POSIX 系统上是发送 SIGKILL 信号）
  >>> import signal
  >>> p.send_signal(sig=signal.SIGTERM)   # 发送信号
  ```

- 可以不指定可执行文件的扩展名，Python 会自动根据当前的操作系统进行判断：
  ```py
  >>> p = subprocess.Popen(r'C:\Windows\SysWOW64\ping.exe')   # 这里可以省略后缀 .exe
  用法: ping [-t] [-a] [-n count] [-l size] [-f] [-i TTL] [-v TOS]
              [-r count] [-s count] [[-j host-list] | [-k host-list]]
  ```
  不过如果不是操作系统已定义的可执行文件，比如是脚本文件 `.sh` ，则不能省略扩展名。

- 可以用 `shlex.split()` 将一条命令分割成字符串列表：
  ```py
  >>> import shlex
  >>> shlex.split('echo "Hello World"')
  ['echo', 'Hello World']
  ```
  默认不会解析注释：
  ```py
  >>> shlex.split('D:/test/1.py # test')
  ['D:/test/1.py', '#', 'test']
  >>> shlex.split('D:/test/1.py # test', comments=True)
  ['D:/test/1.py']
  ```
  默认按 POSIX 风格处理命令，在 Windows 系统上要禁用 POSIX 风格：
  ```py
  >>> shlex.split(r'D:\test\1.py')
  ['D:test1.py']
  >>> shlex.split(r'D:\test\1.py', posix=False)
  ['D:\\test\\1.py']
  >>> shlex.split(r'D:\test\1.py', posix=os.name=='posix')
  ['D:\\test\\1.py']
  ```

- 控制输出：
  ```py
  >>> p = subprocess.Popen(['echo', 'Hello'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  >>> p.communicate()                     # 建议赋值为 stdout, stderr = p.communicate()
  (b'Hello\n', None)                      # 输入、输出的内容默认为 bytes 类型
  >>> p.communicate()
  ValueError: read of closed file         # 不能重复读取输出
  ```

- 控制输入：
  ```py
  stdin = 'Hello World'.encode()
  with subprocess.Popen('cat', stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT) as p:
      try:
          output  = p.communicate(stdin, timeout=10)[0]
      except subprocess.TimeoutExpired:
          p.kill()
          output  = p.communicate()[0]
  ```

- 在当前环境变量的基础上，更新环境变量：
  ```py
  import os
  env_dict = os.environ.copy()
  env_dict.update({'test_id': '1'})
  p = subprocess.Popen('env', env=env_dict)
  ```

- 默认不会将 args 命令放在系统 shell 终端中执行，因此不能使用系统终端内置的命令和语法。比如在 Windows 上执行以下命令：
  ```py
  >>> subprocess.Popen('echo Hello')                              # 不是在系统终端中执行，因此找不到 echo 命令
  FileNotFoundError: [WinError 2] 系统找不到指定的文件。
  >>> subprocess.Popen(['cmd', '/c', 'echo Hello']).communicate() # 换成用系统终端执行
  Hello
  (None, None)
  >>> subprocess.Popen('echo Hello', shell=True).communicate()    # 换成用系统终端执行
  Hello
  (None, None)
  ```
