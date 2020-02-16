# pybind11

：一个 C++库，可以将 C++ 代码封装成 Python 模块，或者在 C++ 中导入 Python 模块。
- 用 pybind11 编译出Python模块之后，用户不需要安装 pybind11 也可以导入该模块，但是必须使用与编译时版本一致的Python解释器。
- 需要使用支持 C++11 的编译器。
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
        m.def("sum", &sum);                   // 给模块 m 定义一个函数，名为 sum ，绑定到 C++代码中的 sum 函数
        m.attr("p1") = p1;                    // 给模块 m 定义一个变量 p1 ，绑定到 C++代码中的指针 p1
        m.attr("p2") = 42;                    // 给模块 m 定义一个变量 p2 ，用常量直接赋值
    }
    ```

3. 编译成 pyd 文件 或 so 文件。
4. 在Python解释器中试用：
    ```python
    >>> import api
    >>> api.sum(1, 2)
    3
    >>> api.p1
    'Hello world!'
    ```

## 编译

首先要安装：pip install pybind11
然后才可以开始编译。

### 手动编译

在Linux上：
1. 安装 g++ 。
2. 编译：
    ```sh
    g++ api.cpp -o api.so -O3 -Wall -std=c++11 -shared -fPIC `python3 -m pybind11 --includes`
    ```
    - 03 表示绑定到 Python3 。
    - 编译时，需要指定头文件、库文件的查找目录。
    
在Windows上：
1. 安装 2015 版本以上的 Visual Studio 。
2. 打开DOS窗口，执行以下文件，从而初始化环境。
    ```cmd
    "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars64.bat"
    ```
3. 编译：
    ```cmd
    cl /MD /LD api.cpp /EHsc -I C:\Users\Leo\AppData\Local\Programs\Python\Python37\include /link C:\Users\Leo\AppData\Local\Programs\Python\Python37\libs\python37.lib /OUT:api.pyd
    del api.exp api.obj api.lib
    ```

### 通过 setuptools 编译

1. 编写一个 setup.py 文件：
    ```python
    from setuptools import setup, Extension
    import pybind11

    ext_modules = [
        Extension(
            name='api',
            sources=['api.cpp'],
            language='c++',
            include_dirs=[      # 添加编译时用到的头文件目录
                get_pybind_include(),
                get_pybind_include(user=True)
            ],
            # libraries=['mylib'],
            # library_dirs=['/path/to/lib'],
            # extra_compile_args=['-std=c++11'],
        )
    ]

    setup(
        name='api',
        version='0.0.1',
        ext_modules=ext_modules,
        install_requires=['pybind11>=2.4'],
        setup_requires=['pybind11>=2.4'],
    )
    ```
2. 执行 `python setup.py build` 编译 C++代码，这会生成 `build/lib.xx/*.pyd` 文件。

## 绑定C++的函数

给函数添加说明文档：
```cpp
m.def("sum", &sum, "A function");
```

将函数的定义语句与绑定语句合并：
```cpp
m.def("sum", [](int x, int y) { return (x + y); });
```
- 该函数的形参是`(int x, int y)`。
- 该函数的返回类似不必声明，因为pybind11会自动处理。

给函数声明关键字参数：
```cpp
m.def("sum", &sum, "A function", py::arg("x"), py::arg("y")=2);
m.def("sum", &sum, "A function", "x"_a, "y"_a=2);                // 可以将 py::arg(*) 简写为 *_a
```

## 绑定C++的类

例：
- 编写C++代码：
    ```cpp
    #include <pybind11/pybind11.h>
    #include <iostream>

    namespace py = pybind11;

    class Pet
    {
    public:
        std::string name;
        void setName(std::string _name)
        {
            name = _name;
        }
        const std::string getName()
        {
            return name;
        }
    };

    PYBIND11_MODULE(api, m) {
        py::class_<Pet>(m, "Pet")               // 用 class_ 可以绑定一个 C++ 的 class 或 struct
            .def(py::init<>())                  // 绑定构造函数
            .def_readwrite("name", &Pet::name)  // 绑定普通的类变量
            .def("setName", &Pet::setName)      // 绑定类方法
            .def("getName", &Pet::getName);     // 类的绑定代码只有一条语句，在最后才加分号 ;
    }
    ```
- 编译后，在Python终端中测试：
    ```python
    >>> import api       
    >>> p = api.Pet()
    >>> p
    <api.Pet object at 0x000001EC69DD63E8>
    >>> p.name 
    ''
    >>> p.name = 'AA' 
    >>> p.name
    'AA'
    >>> p.setName('BB') 
    >>> p.getName()      
    'BB'
    ```
- 可以定义对象的 `__repr__()` 方法：
    ```cpp
            .def("__repr__",
                [](const Pet &p) {
                    return "<Pet: " + p.name + ">";
                });
    ```
    效果如下：
    ```python
    >>> import api
    >>> p = api.Pet()    
    >>> p
    <Pet: >
    >>> p.name = 'AA' 
    >>> p
    <Pet: AA>
    ```

## 传递字符串

将 Python 中的字符串传给 C++ 时：
- C++函数接收字符串的形参可以为 std::string 或 char * 类型。
- 如果Python输出的字符串为bytes类型，则会被pybind11直接传递。
- 如果Python输出的字符串为str类型，则会被pybind11经过 str.encode('utf-8') 之后再传递。
  - 如果编码失败，则会抛出UnicodeDecodeError异常。
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

将 C++ 中的字符串传给 Python 时：
- 如果C++输出的字符串为 std::string 或 char * 类型，则会被pybind11经过 bytes.decode('utf-8') 之后再传递。如下：
    ```cpp
    m.def("return_str",
        []()
        {
            return std::string("Hello");
        }
    );
    ```
    ```python
    >>> import api
    >>> api.return_str()
    'Hello'
    ```

- 也可以先在C++中转换成py::str对象，再传给Python：
    ```cpp
    m.def("return_str", []() { return py::str(std::string("Hello")); });
    ```

- 如果将C++输出的字符串转换为 py::bytes 对象，则会被pybind11当做bytes类型直接传递。如下：
    ```cpp
    m.def("return_str",
        []()
        {
            std::string s("\xe4\xbd\xa0\xe5\xa5\xbd");
            return py::bytes(s);    // 可以合并为 return py::bytes("\xe4\xbd\xa0\xe5\xa5\xbd");
        }
    );
    ```
    ```python
    >>> import api
    >>> api.return_str()
    b'\xe4\xbd\xa0\xe5\xa5\xbd'
    >>> api.return_str().decode()
    '你好'
    ```
- pybind11读取C++的字符串时，遇到null才会终止。如果没有null，则会发生缓冲区溢出。

可以在C++中转换 py::str 与 py::bytes 如下：
```cpp
void test_bytes(py::str str, py::str encoding)
{
    py::bytes bytes = str.attr("encode")(encoding);
    std::cout << std::string(bytes) << std::endl;
}
```

大部分数据类型都可以与 py::str 相互转换如下：
```cpp
void test_str(py::object x)     // 可以用 py::object 类型的形参接收各种Python对象
{
    py::str a = x;              // 各种Python对象可以转换成 py::str
    a = "hello";                // C++的字符串可以转换成 py::str
    a = std::string("hello");
    a = py::list(a);
    std::cout << std::string(a) << std::endl;   // py::str 可以转换成C++的 std::string
}
```

## 在C++中使用Python的数据类型

使用list的示例：
```cpp
py::object fun1()
{
    py::list list1;                  // 创建一个空列表

    list1.append("hello");           // 添加一项元素
    list1[0] = py::str("Hello");     // 赋值
    list1.insert(0, "inserted-0");   // 插入

    std::cout << std::string(py::str(list1[0])) << std::endl;   // 读取列表中的一个元素

    int index = 0;
    for (auto item : list1)          // 遍历列表（这里的item属于pybind11::handle类型，不能转换成pybind11::list类型）
        std::cout << "list[" << index++ << "]: " << std::string(py::str(item)) << std::endl;

    return list1;
}
```
- 用 auto 关键字虽然可以方便地进行遍历，但得到的元素属于pybind11::handle类型，不能当作Python类型使用。可以按以下方法转换成Python类型：
    ```cpp
    for (auto _line : table){
        py::list line;
        for (auto item : _line)
            line.append(item);
    }
    ```

使用dict的示例：
```cpp
py::object test_dict()
{
    auto d1 = py::dict();   // 创建一个空字典，相当于 py::list d1;
    auto d2 = py::dict("a"_a=1, "b"_a=2);  // 创建一个字典并赋值

    d1["a"] = 1;            // 给字典添加键值对
    d1["b"] = 2;

    if(d1.contains("a"))    // 判断指定key是否存在
        std::cout << "a=" << std::string(py::str(d1["a"])) << std::endl;    // 取出指定key的值

    for (auto item : d1)    // 遍历字典
        std::cout << "key=" << std::string(py::str(item.first)) << ", "
                  << "value=" << std::string(py::str(item.second)) << std::endl;
    
    return d1;              // 将字典作为 py::object 传给Python
}
```
- 用 `d1["a"]` 这样的格式即可查询字典中某个key的值。如果该key不存在，则会在Python解释器中抛出异常：KeyError。


其它示例：<https://github.com/pybind/pybind11/blob/master/tests/test_pytypes.cpp>


## 映射对象

将C++对象映射到Python中：
```cpp
MyClass *p = ...;
py::object obj = py::cast(p);
```
- 例：
    ```cpp
    py::object test_cast()
    {
        Pet *p = new Pet();
        return py::cast(p);
    }

    PYBIND11_MODULE(api, m) {
        m.def("test_cast", &test_cast);
        py::class_<Pet>(m, "Pet")...
    }
    ```
    ```python
    >>> import api
    >>> api.test_cast()
    <Pet: >
    ```
    如果没有绑定Pet类，则pybind11就不知道如何转换函数test_cast()的返回值，会报错：
    ```python
    >>> import api       
    >>> api.test_cast()
    TypeError: Unable to convert function return value to a Python type! The signature was
            () -> object
    ```

将Python对象映射到C++中：
```cpp
py::object obj = ...;
MyClass *p = obj.cast<MyClass *>();
```

## 在C++中调用Python模块

pybind11支持在C++中调用Python模块中的变量、函数、方法，如下：
```cpp
m.def("test_import",
    []()
    {
        // 调用变量
        py::object os = py::module::import("os");
        py::object sep = os.attr("path").attr("sep");   // 可以重复用 .attr() 提取成员
        std::cout << std::string(py::str(sep)) << std::endl;

        // 调用函数
        py::object listdir = os.attr("listdir");
        py::str ret = listdir("/root");
        std::cout << std::string(ret) << std::endl;

        // 调用Python的内建函数
        py::print("listdir:", listdir("/root"));

        // 调用方法
        py::str str = py::str("hello world");
        py::object split = str.attr("split");
        py::str ret = split(" ");       // 可以合并为 str.attr("split")(" ");
        std::cout << std::string(ret) << std::endl;
    }
);
```

## 处理异常

- 当Python调用的 C++ 代码抛出异常时，会被 pybind11 自动转换成 Python 的异常。
- 当C++ 调用的Python代码抛出异常时，会被 pybind11 自动转换成 C++ 的异常。
- [相关文档](https://pybind11.readthedocs.io/en/master/advanced/exceptions.html#built-in-exception-translation)
