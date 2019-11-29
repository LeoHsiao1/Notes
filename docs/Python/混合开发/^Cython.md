# ♢ Cython

Python的第三方库，用于Python与C/C++的混合开发。
- 安装：pip install Cython
- Cython本身是一种混编语言，可以将C代码封装成Python模块，或者将Python代码编译成C代码。
- Cython是Python的超集。不仅支持所有的Python语法，还可以使用C/C++的数据类型。将Python代码改写为Cython风格，会更接近C语言，有利于提高运行效率。

Cython主要使用的文件：
- .pyx文件：包含了主要的程序代码。
  - 通常可以把.py文件直接改名为.pyx。
- .pyd文件：声明一些通用的函数、类，类似于C语言的头文件。
  - 当Cython编译一个.pyx文件时，会寻找是否存在同名的.pyd文件。
- .pyi文件：可使用include语句导入其它文件。

## 用法示例

1.  创建一个testC.pyx文件，内容如下：

    ```python
    def fun1():
        cdef char *p="Hello World!"
        print(p)
    ```
    用 `cdef` 可以定义C语言数据类型的变量。

2.  创建一个setup.py文件，在其中声明要处理的.pyx文件。如下：

    ```python
    from distutils.core import setup
    from Cython.Build import cythonize

    setup(
        ext_modules=cythonize("testC.pyx")
    )
    ```

3.  在当前目录下执行编译命令：

    ```
    python setup.py build_ext --inplace
    ```
    默认会编译生成一个C语言文件，再链接生成一个当前平台的库文件（在Windows上是.pyd文件，在Linux上是.so文件）。

    在.pyx文件的第一行加入以下声明，就会让Cython把它编译成C++代码。
    ```
    # distutils: language=c++
    ```

4.  在Python解释器中直接导入编译生成的库文件。如下：

    ```python
    >>> import testC
    >>> testC.fun1()
    b'Hello World!'
    ```

## 其它

例：[Python调用C/C++的API](http://docs.cython.org/en/latest/src/tutorial/clibraries.html)

例：[C/C++调用Python的API](http://docs.cython.org/en/latest/src/userguide/external_C_code.html)

教程：<http://docs.cython.org/en/latest/src/tutorial/index.html>
