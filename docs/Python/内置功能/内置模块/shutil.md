# import shutil

：Python 的标准库，用于管理磁盘文件。用途像 Linux 的 cp、mv、rm 等命令。
- [官方文档](https://docs.python.org/3/library/shutil.html)

## 用法

- 关于文件：
  ```py
  >>> import shutil
  >>> shutil.copy('f1', '/tmp/f1')    # 拷贝文件，保存为路径为 /tmp/f1 的文件。如果目标文件已存在，则会自动覆盖
  '/tmp/f1'                           # 拷贝成功之后，会返回目标路径
  >>> shutil.copy('f1', '/tmp')       # 拷贝文件，保存到 /tmp 目录下
  '/tmp/f1'
  >>> shutil.copy('f1', '/tmp/test/f1') # 如果目标目录不存在，则报错
  FileNotFoundError: [Errno 2] No such file or directory: '/tmp/test/f1'
  ```
  ```py
  >>> shutil.move('f1', '/tmp/f1')  # 移动文件或目录
  '/tmp/f1'
  ```

- 关于目录：
  ```py
  >>> shutil.copytree('/tmp/dir1', '/tmp/dir2') # 拷贝目录。如果目标目录已存在，则报错
  '/tmp/dir2'
  >>> shutil.rmtree('/tmp/dir1')  # 删除目录
  ```
