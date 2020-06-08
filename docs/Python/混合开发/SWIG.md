# SWIG

：一个编译器，可以将 C/C++代码编译成供 C#、Java、Python 等多种语言调用的文件。
- SWIG 本身是一种混编语言。
- 兼容性很好。
  - 支持的操作系统：Unix、Linux、Windows、MacOS 等。
  - 支持 C/C++的几乎所有版本，包括 C99、C++17 。
  - 支持的目标语言：C#、Java、JS、Perl、PHP、Python、Ruby、Go 等。
- [官方文档](http://www.swig.org/Doc4.0/Contents.html)
- 安装：
  - 在 Linux 上，SWIG 发布的是源代码，要执行以下命令编译、安装：
  
      ```sh
      cd swig-4.0.1/
      ./configure
      make
      make install
      ```
  
  - 在 Windows 上，SWIG 会发布一个可执行文件，可以直接使用它。

## 用法示例

1. 创建一个 api.c ，内容如下：

    ```C
    int sum(int x, int y)
    {
        return (x + y);
    }
    char *p = "Hello world!";
    ```

2. 创建相应的头文件 api.h ，内容如下：

    ```C
    int sum(int x, int y);
    char *p;
    ```

3. 再创建一个相应的接口文件 api.i ，声明要暴露的接口。如下：

    ```
    %module api        // 设置最后要生成的 Python 模块名

    %{
    #include "api.h"      // 导入头文件
    %}

    // int sum(int x, int y);  // 声明要暴露给 Python 的接口
    %include "api.h"      // 声明所有接口
    ```

4. 用 swig 生成封装后的 C 文件：

    ```
    swig -python api.i
    ```
    这会生成一个 api_wrap.c 文件。

5. 编译生成动态链接库。
    <br>原本是使用 gcc 等命令手动编译，但是用 Python 的 distutils 模块可以自动编译，更方便。
    <br>先创建一个 setup.py 文件，内容如下：

    ```py
    from distutils.core import setup, Extension

    module = Extension('_api', sources=['api.c', 'api_wrap.c'])    # 这里要在模块名之前加上 _ 前缀

    setup(name='api',
        ext_modules=[module],
        py_modules=["api"],
        )
    ```

    然后在 Linux 或 Windows 上执行以下命令，生成动态链接库。

    ```
    python setup.py build_ext --inplace
    ```
    --inplace 选项是用于将编译结果保存在当前目录

    编译之后，会生成一个 _api.so（或 _api.pyd）和一个 api.py 文件


6.  在 Python 中调用：

    ```py
    >>> import api
    >>> api.sum
    <function sum at 0x000001B2FF948D08>
    >>> api.sum(1,2)
    3
    >>> api.cvar.p      # 通过 cvar 属性访问全局变量
    'Hello world!'
    >>> type(api.cvar.p)
    <class 'str'>      # SWIG 生成的模块已经封装成了 Python 的数据类型
    ```

## 其它

暴露 C++的类：

```
% module api

%{
#include "api.h"
%}

class List{
public:
    List();
    ~List();
    void insert(char *);
    void remove(char *);
    char *get(int n);
    int length;
};
```
