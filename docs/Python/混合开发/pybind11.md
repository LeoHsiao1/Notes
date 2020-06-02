# pybind11

：一个 C++库，可以将 C++ 代码封装成 Python 模块，或者在 C++ 中导入 Python 模块。
- 用 pybind11 编译出 Python 模块之后，用户不需要安装 pybind11 也可以导入该模块，但是必须使用与编译时版本一致的 Python 解释器。
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

2. 在 api.cpp 中加入绑定代码，供 pybind11 读取：
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
4. 在 Python 解释器中试用：
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

在 Linux 上：
1. 安装 g++ 。
2. 编译：
    ```sh
    g++ api.cpp -o api.so -O3 -Wall -std=c++11 -shared -fPIC `python3 -m pybind11 --includes`
    ```
    - 03 表示绑定到 Python3 。
    - 编译时，需要指定头文件、库文件的查找目录。
    
在 Windows 上：
1. 安装 2015 版本以上的 Visual Studio 。
2. 打开 DOS 窗口，执行以下文件，从而初始化环境。
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

## 绑定 C++ 的变量和函数

例：
- 编写 C++代码：
    ```cpp
    #include <pybind11/pybind11.h>
    #include <iostream>

    namespace py = pybind11;

    char *p1 = "Hello world!";

    void test_print()
    {
        std::cout << p1 << std::endl;
    }

    PYBIND11_MODULE(api, m)
    {
        m.doc() = "pybind11 example module";
        m.def("test_print", &test_print);
        m.attr("p1") = p1;
    }
    ```
- 编译后，在 Python 终端中测试：
    ```python
    >>> import api
    >>> api.p1
    'Hello world!'
    >>> api.test_print()
    Hello world!
    ```
- C++ 中的变量绑定到 Python 中时，是拷贝了一份值。修改拷贝时不会影响到原变量，如下：
    ```python
    >>> api.p1 = 'Hi'
    >>> api.fun1()
    Hello world!
    ```

其它特性：
- 可以给函数添加说明文档：
    ```cpp
    m.def("sum", &sum, "Calculate the sum of two numbers.");
    ```

- 可以将函数的定义语句与绑定语句合并：
    ```cpp
    m.def("sum", [](int x, int y) { return (x + y); });
    ```
    - 该函数的形参是`(int x, int y)`。
    - 该函数的返回类似不必声明，因为 pybind11 会自动处理。

- 可以给函数声明关键字参数：
    ```cpp
    m.def("sum", &sum, "A function", py::arg("x"), py::arg("y")=2);
    m.def("sum", &sum, "A function", "x"_a, "y"_a=2);                // 可以将 py::arg(*) 简写为 *_a
    ```

## 绑定 C++ 的类

例：
- 编写 C++代码：
    ```cpp
    #include <pybind11/pybind11.h>
    #include <iostream>

    namespace py = pybind11;

    class Pet
    {
    public:
        std::string name;
        int age;
        Pet(std::string name_, int age_){
            name = name_;
            age = age_;
        }
        ~Pet(){
            std::cout << "destructed" << std::endl;
        }
        void setName(std::string name_)
        {
            name = name_;
        }
        const std::string getName()
        {
            return name;
        }
    };

    PYBIND11_MODULE(api, m) {
        py::class_<Pet>(m, "Pet")                   // 用 class_ 可以绑定一个 C++ 的 class 或 struct
            .def(py::init<std::string, int &>())    // 绑定构造函数（用 py::init<> 包装初始化参数）
            .def_readwrite("name", &Pet::name)      // 绑定类变量
            .def_readonly("age", &Pet::age)         // 绑定类变量并限制为只读（修改时会抛出 AttributeError 异常）
            .def("setName", &Pet::setName)          // 绑定类方法
            .def("getName", &Pet::getName);         // 类的绑定代码只有一条语句，在最后才加分号 ;
    }
    ```
    类的构造函数需要主动绑定，而析构函数会自动绑定，且会自动被 Python 的内存回收机制调用。
    
- 编译后，在 Python 终端中测试：
    ```python
    >>> import api
    >>> p = api.Pet('puppy', '3')
    >>> p
    <api.Pet object at 0x000001EC69DD63E8>
    >>> p.name 
    'puppy'
    >>> p.name = 'AA' 
    >>> p.name
    'AA'
    >>> p.setName('BB')
    >>> p.getName()
    'BB'
    >>> del p
    'destructed'        # 不一定会立即调用析构函数
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
- 如果 Python 输出的字符串为 bytes 类型，则会被 pybind11 直接传递。
- 如果 Python 输出的字符串为 str 类型，则会被 pybind11 自动经过 str.encode('utf-8') 之后再传递。
  - 如果编码失败，则会抛出 UnicodeDecodeError 异常。
- 例：
    编写 C++代码：
    ```cpp
    #include <pybind11/pybind11.h>
    #include <iostream>

    namespace py = pybind11;

    PYBIND11_MODULE(api, m)
    {
        m.def("test_print",
              [](const std::string &a, const char *b) {
                  std::cout << a << std::endl;
                  std::cout << b << std::endl;
              });
    }
    ```
    编译后，在 Python 终端中测试：
    ```python
    >>> import api
    >>> api.test_print(b'hello', 'hello')
    hello
    hello
    >>> api.test_print('你好'.encode(), '你好')
    浣犲ソ      # 因为 C++在打印时没有解码，所以乱码了
    浣犲ソ
    ```

将 C++ 中的字符串传给 Python 时：
- 如果 C++ 输出的字符串为 std::string 或 char * 类型，则会被 pybind11 自动经过 bytes.decode('utf-8') 之后再传递。如下：
    ```cpp
    m.def("return_str",
          []() {
              return std::string("Hello");
          });
    ```
    ```python
    >>> import api
    >>> api.return_str()
    'Hello'
    ```

- 也可以先在 C++ 中转换成 py::str 对象，再传给 Python ：
    ```cpp
    m.def("return_str",
          []() {
              return py::str(std::string("Hello"));
          });
    ```

- 如果将 C++ 输出的字符串转换为 py::bytes 对象，则会被 pybind11 当做 bytes 类型直接传递。如下：
    ```cpp
    m.def("return_str",
          []() {
              std::string s("\xe4\xbd\xa0\xe5\xa5\xbd");
              return py::bytes(s);
              // return py::bytes("\xe4\xbd\xa0\xe5\xa5\xbd");
          });
    ```
    ```python
    >>> import api
    >>> api.return_str()
    b'\xe4\xbd\xa0\xe5\xa5\xbd'
    >>> api.return_str().decode()
    '你好'
    ```
- pybind11 读取 C++ 的字符串时，遇到空字符才会终止。如果没有空字符，则会一直读取，直到发生内存越界访问。如下：
    ```cpp
    m.def("return_str",
          []() {
              return py::bytes("Hello\x00\x00World"); // Python 得到的返回值为 "Hello"
              // return py::str("Hello\x00\x00World");
              // return std::string("Hello\x00\x00World");
          });
    ```

## 在 C++ 中使用 Python 的数据类型

可以在 C++ 中转换 py::str 与 py::bytes 类型，如下：
```cpp
void test_bytes(py::str str, py::str encoding)
{
    py::bytes bytes = str.attr("encode")(encoding);
    std::cout << std::string(bytes) << std::endl;
}
```

大部分数据类型都可以与 py::str 相互转换，如下：
```cpp
void test_str(py::object x)     // 可以用 py::object 类型的形参接收各种 Python 对象
{
    py::str a = x;              // 各种 Python 对象可以转换成 py::str
    a = "hello";                // C++ 的字符串可以转换成 py::str
    a = std::string("hello");
    a = py::list(a);
    std::cout << std::string(a) << std::endl;   // py::str 可以转换成 C++ 的 std::string
}
```

使用 list 的示例：
```cpp
py::object fun1()
{
    py::list list1;                  // 创建一个空列表

    list1.append("hello");           // 添加一项元素
    list1[0] = py::str("Hello");     // 赋值
    list1.insert(0, "inserted-0");   // 插入

    std::cout << std::string(py::str(list1[0])) << std::endl;   // 读取列表中的一个元素

    int index = 0;
    for (auto item : list1)          // 遍历列表（这里的 item 属于 pybind11::handle 类型，不能转换成 pybind11::list 类型）
        std::cout << "list[" << index++ << "]: " << std::string(py::str(item)) << std::endl;

    return list1;
}
```
- 用 auto 关键字虽然可以方便地进行遍历，但得到的元素属于 pybind11::handle 类型，不能当作 Python 类型使用。可以按以下方法转换成 Python 类型：
    ```cpp
    for (auto _line : table){
        py::list line;
        for (auto item : _line)
            line.append(item);
    }
    ```

使用 dict 的示例：
```cpp
py::object test_dict()
{
    auto d1 = py::dict();   // 创建一个空字典，相当于 py::list d1;
    auto d2 = py::dict("a"_a=1, "b"_a=2);  // 创建一个字典并赋值

    d1["a"] = 1;            // 给字典添加键值对
    d1["b"] = 2;

    if(d1.contains("a"))    // 判断指定 key 是否存在
        std::cout << "a=" << std::string(py::str(d1["a"])) << std::endl;    // 取出指定 key 的值

    for (auto item : d1)    // 遍历字典
        std::cout << "key=" << std::string(py::str(item.first)) << ", "
                  << "value=" << std::string(py::str(item.second)) << std::endl;
    
    return d1;              // 将字典作为 py::object 传给 Python
}
```
- 用 `d1["a"]` 这样的格式即可查询字典中某个 key 的值。如果该 key 不存在，则会在 Python 解释器中抛出异常：KeyError 。


其它示例：<https://github.com/pybind/pybind11/blob/master/tests/test_pytypes.cpp>

不能将 C++ 的全局变量声明为 Python 的数据类型，否则其占用的内存不会被自动释放，从而引发内存错误。

## 映射对象

将 C++对象映射到 Python 中：
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
        py::class_<Pet>(m, "Pet");
    }
    ```
    ```python
    >>> import api
    >>> api.test_cast()
    <Pet: >
    ```
    如果没有绑定 Pet 类，则 pybind11 就不知道如何转换函数 test_cast()的返回值，会报错：
    ```python
    >>> import api       
    >>> api.test_cast()
    TypeError: Unable to convert function return value to a Python type! The signature was
            () -> object
    ```
- 这只是映射了类名，并不会自动绑定类的成员，因此不能调用该类的方法、属性。如下：
	```py
	>>> api.Pet
	<class 'api.Pet'>
	>>> api.Pet.name
	AttributeError: type object 'api.Pet' has no attribute 'name'
	```

将 Python 对象映射到 C++中：
```cpp
py::object obj = ...;
MyClass *p = obj.cast<MyClass *>();
```

## 在 C++ 中调用 Python 模块

pybind11 支持在 C++ 中调用 Python 模块中的变量、函数、方法，如下：
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

        // 调用 Python 的内建函数
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

- 当 Python 调用的 C++ 代码抛出异常时，会被 pybind11 自动转换成 Python 的异常。
- 当 C++ 调用的 Python 代码抛出异常时，会被 pybind11 自动转换成 C++ 的异常。
- [相关文档](https://pybind11.readthedocs.io/en/master/advanced/exceptions.html#built-in-exception-translation)
