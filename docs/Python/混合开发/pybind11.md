# pybind11

：一个C++库，可以将C++代码封装成Python模块，或者在C++中导入Python模块。

- [官方文档](https://pybind11.readthedocs.io/en/master/index.html)
- 需要使用支持C++11的编译器。（在Windows上需要Visual Studio不低于2015版本）

## 用法示例

1. 编写C++源文件api.cpp，如下：
    ```cpp
    #include <pybind11/pybind11.h>
    namespace py = pybind11;

    int sum(int x, int y)
    {
        return (x + y);
    }
    char *p = "Hello world!";
    ```

2. 编写绑定代码，加入到源文件api.cpp中：

    ```cpp
    PYBIND11_MODULE(api, m) {   // 生成一个Python模块，名为api，用变量m表示
        m.doc() = "pybind11 example module";  // 添加模块的说明
        m.def("sum", &sum, "A function");  // 绑定函数并添加说明
        m.attr("p");  // 绑定变量
    }
    ```

3. 编译生成pyd文件。
    <br>原本是手动编译pybind11项目，但是用Python的setuptools模块可以自动编译，更方便。
    <br>先安装：pip install pybind11
    <br>然后下载[setup.py](https://github.com/pybind/python_example/blob/master/setup.py)文件，修改如下内容：
    ```python
    ext_modules = [
        Extension(
            'api',
            ['api.cpp'],
            include_dirs=[
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
    最后执行 `python setup.py build` 编译C++代码，会生成 `./build/lib.*/*.pyd` 。

## 绑定代码

可以声明关键字参数：
```
m.def("sum", &sum, "A function", py::arg("x"), py::arg("y")=2);
m.def("sum", &sum, "A function", "x"_a, "y"_a=2);   // 可以将py::arg(*)简写为*_a
```



可以按以下格式输入多行注释：
```cpp
m.doc() = R"pbdoc(
    Pybind11 example
    module
)pbdoc";
```
