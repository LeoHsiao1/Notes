# pybind11

：一个 C++库，可以将 C++代码封装成 Python 模块，或者在 C++中导入 Python 模块。
- 需要使用支持 C++11 的编译器。在 Windows 上使用时，需要使用 2015 版本以上的 Visual Studio 。
- [官方文档](https://pybind11.readthedocs.io/en/master/index.html)

## 基本示例

1. 编写 C++源文件 api.cpp ，如下：
    ```cpp
    #include <pybind11/pybind11.h>
    namespace py = pybind11;

    int sum(int x, int y)
    {
        return (x + y);
    }
    char *p1 = "Hello world!";
    ```

2. 在 api.cpp 中加入pybind11的绑定代码：
    ```cpp
    PYBIND11_MODULE(api, m)                   // 创建一个 Python 模块，名为 api ，用变量 m 表示
    {
        m.doc() = "pybind11 example module";  // 给模块 m 添加说明文档
        m.def("sum", &sum, "A function");     // 给模块 m 定义一个函数，名为 sum ，绑定到 C++代码中的 sum 函数，并添加说明文档
        m.attr("p1") = p1;                    // 给模块 m 定义一个变量 p1 ，绑定到 C++代码中的指针 p1
        m.attr("p2") = 42;                    // 给模块 m 定义一个变量 p2 ，用常量直接赋值
    }
    ```

3. 最后要编译生成 pyd 文件。可以手动编译，也可以自动编译。

手动编译的步骤：
，，，


用 Python 的 setuptools 模块可以自动编译，更方便。步骤如下：
1. 安装：pip install pybind11
2. 下载[setup.py](https://github.com/pybind/python_example/blob/master/setup.py)模板，修改其中的部分内容：
    ```python
    ext_modules = [
        Extension(
            'api',
            ['api.cpp'],
            include_dirs=[      # 添加编译时用到的头文件目录
                get_pybind_include(),
                get_pybind_include(user=True)
            ],
            language='c++'
        )
    ]

    setup(
        name='api',
        version='0.0.1',
        ext_modules=ext_modules,
        install_requires=['pybind11>=2.4'],
        setup_requires=['pybind11>=2.4'],
        cmdclass={'build_ext': BuildExt},
    )
    ```
3. 执行 `python setup.py build` 编译 C++代码，会生成 `build/lib.xx/*.pyd` 文件。
4. 执行以下命令，打开Python解释器：
    ```sh
    cd build/lib.xx
    python
    ```
   尝试调用：
    ```python
    >>> import api
    >>> api.sum(1, 2)
    3
    >>> api.p1
    'Hello world!'
    ```


## 绑定代码的语法

可以给函数声明关键字参数：
```cpp
m.def("sum", &sum, "A function", py::arg("x"), py::arg("y")=2);
m.def("sum", &sum, "A function", "x"_a, "y"_a=2);                // 可以将 py::arg(*)简写为*_a
```

可以按以下格式添加多行注释：
```cpp
m.doc() = R"pbdoc(
    Pybind11 example
    module
)pbdoc";
```

## 传递字符串

将Python中的字符串传给 C++ 时：
- 如果Python输出的字符串为bytes类型，则会被pybind11直接传递。
- 如果Python输出的字符串为str类型，则会被pybind11经过 str.encode('utf-8') 之后再传递。
  - 如果编码失败，则会抛出UnicodeDecodeError异常。
- C++函数接收字符串的形参可以为 std::string 或 char * 类型。
- 例：
    编写C++代码：
    ```cpp
    #include <pybind11/pybind11.h>
    #include <iostream>

    namespace py = pybind11;

    PYBIND11_MODULE(api, m)
    {
        m.def("test_print",
            [](const std::string &a, const char *b)
            {
                std::cout << a << std::endl;
                std::cout << b << std::endl;
            }
        );
    }
    ```
    编译后，在Python终端中测试：
    ```python
    >>> import api
    >>> api.test_print(b'hello', 'hello')
    hello
    hello
    >>> api.test_print('你好'.encode(), '你好')
    浣犲ソ      # 因为C++在打印时没有解码，所以乱码了
    浣犲ソ
    ```

将C++中的字符串传给 Python 时：
- 如果C++输出的字符串为 std::string 或 char * 类型，则会被pybind11经过 bytes.decode('utf-8') 之后再传递。如下：
    ```cpp
    m.def("test_return",
        []()
        {
            return std::string("Hello");
        }
    );
    ```
    ```python
    >>> import api
    >>> api.test_return()
    'Hello'
    ```
- 如果将C++输出的字符串转换为 py::bytes 对象，则会被pybind11当做bytes类型直接传递。如下：
    ```cpp
    m.def("test_return",
        []()
        {
            std::string s("\xe4\xbd\xa0\xe5\xa5\xbd");
            return py::bytes(s);    // 可以合并为 return py::bytes("\xe4\xbd\xa0\xe5\xa5\xbd");
        }
    );
    ```
    ```python
    >>> import api
    >>> api.test_return()
    b'\xe4\xbd\xa0\xe5\xa5\xbd'
    >>> api.test_return().decode()
    '你好'
    ```
- pybind11读取C++的字符串时，遇到null才会终止。如果没有null，则会发生缓冲区溢出。
