# import Cython

：Python 的第三方库，用于 Python 与 C/C++ 的混合开发。
- [官方文档](https://cython.readthedocs.io/en/latest/)
- 安装：`pip install Cython`
- Cython 本身是一种混编语言，可以将 C 代码封装成 Python 模块，或者将 Python 代码编译成 C 代码。
- Cython 是 Python 的超集。不仅支持所有的 Python 语法，还可以使用 C/C++ 的数据类型。
  - 将 Python 代码改写为 Cython 风格，会更接近 C 语言，有利于提高运行效率。

## 原理

Cython 主要使用以下几种文件：
- .pyx 文件
  - ：包含了主要的程序代码。
  - 通常可以把.py 文件直接改名为.pyx 。
- .pyd 文件
  - ：声明一些通用的函数、类，类似于 C 语言的头文件。
  - 当 Cython 编译一个.pyx 文件时，会寻找是否存在同名的.pyd 文件。
- .pyi 文件
  - ：可通过 include 语句导入其它文件。

## 用法示例

1.  创建一个 testC.pyx 文件，内容如下：
    ```py
    def fun1():
        cdef char *p="Hello World!"
        print(p)
    ```
    用 `cdef` 可以定义 C 语言数据类型的变量。

2.  创建一个 setup.py 文件，在其中声明要处理的.pyx 文件。如下：
    ```py
    from distutils.core import setup
    from Cython.Build import cythonize

    setup(
        ext_modules=cythonize("testC.pyx")
    )
    ```

3.  在当前目录下执行编译命令：
    ```sh
    python setup.py build_ext --inplace
    ```
    默认会编译生成一个 C 语言文件，再链接生成一个当前平台的库文件（在 Windows 上是.pyd 文件，在 Linux 上是.so 文件）。

    在 .pyx 文件的第一行加入以下声明，就会让 Cython 把它编译成 C++ 代码。
    ```py
    # distutils: language=c++
    ```

4.  在 Python 解释器中直接导入编译生成的库文件。如下：
    ```py
    >>> import testC
    >>> testC.fun1()
    b'Hello World!'
    ```

## 其它

例：[Python 调用 C/C++ 的 API](http://docs.cython.org/en/latest/src/tutorial/clibraries.html)

例：[C/C++ 调用 Python 的 API](http://docs.cython.org/en/latest/src/userguide/external_C_code.html)

教程：<http://docs.cython.org/en/latest/src/tutorial/index.html>
