# ♢ subprocess

：Python 的标准库，用于创建一个子进程去执行命令。
- 与 `os.system()`、`os.popen()` 类似，但功能更强。

## Popen

### 定义

```py
class Popen(args, bufsize=-1, stdin=None, stdout=None, stderr=None, shell=False, cwd=None, ...)
```
- `args` ：待执行的命令。
  - 一般是执行某个可执行文件，与在系统终端执行命令类似。
  - 可以是一个字符串，表示可执行文件名或路径（可以是相对路径）。
  - 也可以是一个字符串列表，其中第一个字符串表示可执行文件，之后的字符串表示命令参数。

- `bufsize` ：使用 Pipe 时的缓存大小，取值如下：
  - 0 ：无缓冲
  - 1 ：行缓冲
  - +int ：使用 int 大小的缓冲
  - -int ：使用系统默认大小的缓冲（默认是8KB）

- `stdin`、`stdout`、`stderr` ：存储子进程输入、输出的文件描述符，取值如下：
  - `None` ：重定向到当前进程
  - `subprocess.PIPE` ：缓存到 Pipe 中
  - `subprocess.STDOUT` ：重定向到 stdout
  - `subprocess.DEVNULL` ：丢弃

- `shell=False` ：默认不会直接在系统终端中执行该命令，因此不能使用系统终端内置的命令和语法。
- `cwd` ：工作目录，默认是当前目录。

### 例

- 常用方法：
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
  >>> p.wait(timeout=10)                  # 等待子进程退出
  0
  >>> p.returncode                        # 获取子进程的返回码，如果它尚未退出则返回 None
  0
  >>> p.kill()                            # 终止子进程（在 POSIX 系统上是发送 SIGKILL 信号）
  >>> import signal
  >>> p.send_signal(sig=signal.SIGTERM)   # 发送信号
  ```

- 控制输出：
  ```py
  >>> p = subprocess.Popen(['echo', 'Hello'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
  >>> p.communicate()
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


- 可以不指定可执行文件的后缀名，Python 会自动根据当前的操作系统进行判断：
  ```py
  >>> p = subprocess.Popen(r'C:\Windows\SysWOW64\ping.exe')   # 这里可以省略后缀 .exe
  用法: ping [-t] [-a] [-n count] [-l size] [-f] [-i TTL] [-v TOS]
              [-r count] [-s count] [[-j host-list] | [-k host-list]]
  ```
  不过如果不是系统定义的可执行文件，比如是脚本文件 `.sh` ，则不能省略后缀名。

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
