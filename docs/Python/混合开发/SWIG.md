# SWIG

一个编译器，可以将C/C++代码编译成供C#、Java、Python等多种语言调用的文件。
- SWIG本身是一种混编语言。
- 兼容性很好。
  - 支持的操作系统：Unix、Linux、Windows、MacOS等。
  - 支持C/C++的几乎所有版本，包括C99、C++17。
  - 支持的目标语言：C#、Java、JS、Perl、PHP、Python、Ruby、Go等。
- [官方文档](http://www.swig.org/Doc4.0/Contents.html)
- 安装：
  - 在Linux上，SWIG发布的是源代码，要执行以下命令编译、安装：
  
      ```shell
      cd swig-4.0.1/
      ./configure
      make
      make install
      ```
  
  - 在Windows上，SWIG会发布一个可执行文件，可以直接使用它。

## 用法示例

1. 创建一个api.c，内容如下：

    ```C
    int sum(int x, int y)
    {
        return (x + y);
    }
    char *p = "Hello world!";
    ```

2. 创建相应的头文件api.h，内容如下：

    ```C
    int sum(int x, int y);
    char *p;
    ```

3. 再创建一个相应的接口文件api.i，声明要暴露的接口。如下：

    ```
    %module api        // 设置最后要生成的Python模块名

    %{
    #include "api.h"      // 导入头文件
    %}

    // int sum(int x, int y);  // 声明要暴露给Python的接口
    %include "api.h"      // 声明所有接口
    ```

4. 用swig生成封装后的C文件：

    ```
    swig -python api.i
    ```
    这会生成一个api_wrap.c文件。

5. 编译生成动态链接库。
    <br />原本是使用gcc等命令手动编译，但是用Python的distutils模块可以自动编译，更方便。
    <br />先创建一个setup.py文件，内容如下：

    ```python
    from distutils.core import setup, Extension

    module = Extension('_api', sources=['api.c', 'api_wrap.c'])    # 这里要在模块名之前加上 _ 前缀

    setup(name='api',
        ext_modules=[module],
        py_modules=["api"],
        )
    ```

    然后在Linux或Windows上执行以下命令，生成动态链接库。

    ```
    python setup.py build_ext --inplace
    ```
    --inplace选项是用于将编译结果保存在当前目录

    编译之后，会生成一个_api.so（或_api.pyd）和一个api.py文件


6.  在Python中调用：

    ```python
    >>> import api
    >>> api.sum
    <function sum at 0x000001B2FF948D08>
    >>> api.sum(1,2)
    3
    >>> api.cvar.p      # 通过cvar属性访问全局变量
    'Hello world!'
    >>> type(api.cvar.p)
    <class 'str'>      # SWIG生成的模块已经封装成了Python的数据类型
    ```

## 其它

暴露C++的类：

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
