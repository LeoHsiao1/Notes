# Python解释器

安装Python解释器之后就可以执行Python脚本，也可以打开一个终端进行交互式编程。

Python解释器有多种。
- CPython：基于C语言实现，使用最广泛。
  - 执行Python脚本时，会先把它解释成C语言代码，再编译成可执行文件。
- Jython：基于Java实现。
  - 执行Python脚本时，会先把它解释成Java字节码文件，再编译成可执行文件。
- PyPy：基于RPython实现。
  - 采用JIT技术进行动态编译（不是解释），使代码的执行速度大幅提高。
- IPython：提供了功能更强的shell，通常与Jupyter编辑器搭配使用。

本文使用的解释器是CPython。

## 安装

- 在Window上，要去[官网](https://www.python.org/downloads/windows/)下载Python的安装包。
- 在Linux上，执行`yum/apt intall python3`不一定能找到Python的安装包，因此建议从[官网](https://www.python.org/downloads/source/)下载源代码包再编译安装：

  ```shell
  python_version=3.8.0      # 指定Python版本
  yum install -y gcc make openssl-devel zlib zlib-devel libffi-devel   # 安装编译环境
  curl -O https://www.python.org/ftp/python/${python_version}/Python-${python_version}.tgz
  tar -zxvf Python-${python_version}.tgz
  cd Python-${python_version}
  ./configure --prefix=/usr/local/python/Python-${python_version} --enable-optimizations
  make
  make install
  cd ..
  rm -rf Python-${python_version}.tgz Python-${python_version}
  ln -s /usr/local/python/Python-${python_version}/bin/* /usr/local/bin/    # 添加软链接
  ```

  安装之后，执行`python3.8`或`python3`即可启动解释器。

## 交互式编程

在终端执行`python`，打开Python解释器的终端，进行交互式编程。如下：

```python
C:\Users\Leo>Python
python 3.7.1 (v3.7.1:260ec2c36a, Oct 20 2018, 14:05:16) [MSC v.1915 32 bit (Intel)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> 1 + \
... 2
3
>>> print("Hello!"
...)
Hello!
```

- 三个大于号 >>> 是主提示符，表示等待用户输入一行语句
- 输入反斜杠 \ 再按回车就可以换行输入
- 使用括号（）、[]、{}时，在输入后半边括号之前，也可按回车换行输入
- 三个小数点 ... 是从属提示符，在换行时出现，表示等待用户输入一个语句块
- 每条语句执行后的返回值会自动显示在终端上

## 执行Python脚本

将Python代码保存为一个 .py 文件，便可以用Python解释器执行它。

命令：

    python <脚本名>

- 第一个字段是Python解释器的名字，比如：python3.8、/usr/bin/python3.8
- 第二个字段是Python脚本的名字，可以使用相对路径或绝对路径，比如：1.py、test/1.py
- 如果文件路径中包含空格，就要加上双引号强调为字符串。比如：python "test/Hello world.py"

当Python解释器运行脚本时，会在导入的每个模块的同目录下生成一个__pycache__文件夹，用于缓存该模块预编译生成的字节码文件（后缀名为.pyc或.pyo）。

- 当下一次运行脚本时，Python解释器会检查被导入的模块是否有改动，没有的话就使用之前的__pycache__，从而更快地运行。
- .pyd文件是用其它语言生成的扩展模块，可被Python导入。
