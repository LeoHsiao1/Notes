# import pyinstaller

：Python 的第三方库，用于将 Python 脚本编译成可执行文件。
- [官方文档](https://pyinstaller.org/en/stable/)
- 安装：`pip install pyinstaller`
- 为什么使用 pyinstaller ？
  - 将 Python 脚本分享给别人运行时，别人电脑上不一定安装了 Python 解释器。如果将 Python 脚本编译成可执行文件，就可以鼠标双击，直接启动。

## 用法

- pyinstaller 命令的用法：
  ```sh
  pyinstaller  test.py    # 输入一个 Python 脚本文件，然后输出一个文件夹，包含可执行文件、一堆依赖库
          -F              # --onefile 。不输出文件夹，只输出一个可执行文件，体积较大
          -w              # --noconsole 。启动程序时，只显示 GUI 窗口，不打开一个终端窗口。缺点是，如果程序启动失败，就看不到报错

          --icon 1.ico    # 设置程序的图标
          --add-data 1.jpg:.      # 添加数据文件到 dist 中。这里是添加 1.jpg 文件，放到 dist 目录下
          --add-binary 1.dll:lib  # 添加二进制文件到 dist 中。这里是添加 1.dll 文件，放到 dist/lib 目录下
  ```
  - 在一个 Windows 主机上编译的可执行文件，可以拷贝到其它 Windows 主机上运行，但不兼容 Linux、MacOS 等其它操作系统。

- 执行 pyinstaller 命令之后，会在当前目录下，生成两个文件夹：
  - build
    - 用于存放编译过程的日志、临时文件。
  - dist
    - 用于存放编译生成的可执行文件。
