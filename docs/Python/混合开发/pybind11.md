# pybind11

：一个C++库，可以将C++代码封装成Python模块，或者在C++中导入Python模块。
- 需要使用支持C++11的编译器。在Windows上使用时，需要使用2015版本以上的Visual Studio。
- [官方文档](https://pybind11.readthedocs.io/en/master/index.html)

## 用法示例

1. 编写C++源文件api.cpp，如下：
    ```cpp
    #include <pybind11/pybind11.h>
    namespace py = pybind11;

    int sum(int x, int y)
    {
        return (x + y);
    }
    char *p1 = "Hello world!";
    ```

2. 编写绑定代码，加入到源文件api.cpp中：
    ```cpp
    PYBIND11_MODULE(api, m)                   // 创建一个Python模块，名为api，用变量m表示
    {
        m.doc() = "pybind11 example module";  // 给模块m添加说明文档
        m.def("sum", &sum, "A function");     // 给模块m定义一个函数，名为sum，绑定到C++代码中的sum函数，并添加说明文档
        m.attr("p1") = p1;                    // 给模块m定义一个变量p1，绑定到C++代码中的指针p1
        m.attr("p2") = 42;                    // 给模块m定义一个变量p2，用常量直接赋值
    }
    ```

3. 最后要编译生成pyd文件。原本是手动编译pybind11项目，但是用Python的setuptools模块可以自动编译，更方便。步骤如下：
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
    3. 执行 `python setup.py build` 编译C++代码，会生成 `build/lib.xx/*.pyd` 文件。
    4. 执行以下命令，验证能否在Python解释器中导入它：
        ```sh
        cd build/lib.xx
        python
        import api
        api.sum(1, 2)
        api.p1
        ```

## 绑定代码的语法

可以给函数声明关键字参数：
```
m.def("sum", &sum, "A function", py::arg("x"), py::arg("y")=2);
m.def("sum", &sum, "A function", "x"_a, "y"_a=2);                // 可以将py::arg(*)简写为*_a
```

可以按以下格式添加多行注释：
```cpp
m.doc() = R"pbdoc(
    Pybind11 example
    module
)pbdoc";
```
