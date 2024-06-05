# import ctypes

：Python 的标准库。
- [官方文档](https://docs.python.org/3/library/ctypes.html)
- 允许 Python 加载 C 的动态链接库，直接调用其中的函数，或者将 Python 函数作为回调函数传给 C 函数。

## 用法示例

1. 将 C 代码文件编译成动态链接库：
    ```sh
    gcc –o 1.so -shared –fPIC 1.c    # 在 Linux 上用 gcc 编译 C 代码
    g++ –o 1.so -shared –fPIC 1.cpp  # 在 Linux 上用 g++ 编译 C++ 代码
    cl /LD 1.c                       # 在 Windows 上用 Virtual Studio 的 cl 命令编译
    ```
    如果想调用 C++ 代码，则要将待调用的函数用 `extern "C"` 声明，再编译成库文件。如下：
    ```c
    extern "C" {
        Class1 obj;    # 可以在 extern "C" 内调用 C++ 的方法，但不能定义 C++ 特有的对象
        void fun1() {
            obj.method();
        }
    ```
    如果想在 Windows 上编译成库文件，则要将 C、C++ 代码中待调用的函数加上前缀 __declspec(dllexport)、extern "C" __declspec(dllexport)声明。

2. 在 Python 中调用：
    ```py
    import ctypes
    lib = ctypes.CDLL("msvcrt.dll")
    lib.printf(b"hello world!")

    lib = ctypes.CDLL("./1.so")
    r = lib.fun1(ctypes.c_int(1))
    ```

## 创建 C 变量

ctypes 支持创建任意 C 语言数据类型的变量，包括数组、指针、结构体。
- 创建这些变量是为了传给 C 函数，不能在 Python 中使用。
- 例：
  ```py
  i = ctypes.c_int(1)              # 创建一个 C 语言的 int 型变量
  print(i.value)                   # 获取 C 语言变量的值

  c = ctypes.c_char(b"A")          # 创建一个 C 语言的 char 型变量
  array = ctypes.c_char * 10       # 创建一个数组（格式为 数据类型名*整数 ）
  p = ctypes.c_char_p(id("hello")) # 创建一个 C 语言的 char 型指针

  ctypes.byref(ctypes.c_int(1))    # 返回一个 C 语言变量实例的指针
  ctypes.POINTER(ctypes.c_char)    # 返回指向某种数据类型的指针类型（可用作声明函数原型）
  ```
- 调用动态库时，C 函数返回的变量可能会被内存回收，因此要注意及时在 Python 中拷贝它的值。

## 传递字符串

如果想让 C 函数返回一个字符串，可以传入一个字符数组作为实参，让 C 函数修改它。也可以让 C 函数在运行时创建一个字符数组或动态内存，返回其指针。

ctypes 提供了一种创建字符串缓存的方法，可以把它传给 C 函数作为实参。如下：
1. 创建字符串缓存：
    ```py
    >>> p = ctypes.create_string_buffer(10)         # 创建一个 char 型数组，用作缓存，长度为 10
    >>> p = ctypes.create_string_buffer(b"hello\n") # 也可以根据 bytes 创建数组缓存
    >>> p.value       # 获取数组存储的字符串内容
    b'hello\n'
    >>> p.raw         # 获取数组存储的原始值（并且可通过 p.raw 修改这个值）
    b'hello\n\x00'
    >>> ctypes.create_unicode_buffer(10)            # 创建一个 wchar 型数组缓存
    <ctypes.c_wchar_Array_10 object at 0x000001F879539248>
    ```

2. 编写 C 函数：
    ```C
    int fun1(char *buffer){  
        printf("%s", buffer);
        *buffer = 'A';
        *(buffer+1) = 'a';
        return 0;
    }
    ```

3. 在 Python 中调用：
    ```py
    >>> lib.fun1(p)
    hello
    0
    >>> p.value
    b'Aallo\n'
    ```

下例是让 C 代码创建一个动态内存，存储字符串并返回：
1. 定义 C 函数：
    ```C
    #include <stdlib.h>
    char *buffer = NULL;

    char *fun1(void){
        buffer = (char *)malloc(1*1024);
        memset(buffer , 'a', 1*1024);
        return buffer;
    }

    int free_buffer(void){
        free(buffer);
        return 0;
    }
    ```

2. 在 Python 中调用：
    ```py
    >>> lib.fun1.restype = ctypes.c_char_p    # 声明 C 函数的返回类型（默认采用 int 型）
    >>> a = lib.fun1(p)
    >>> a          # 可以直接查看 a 的值，因为它被 ctypes 自动转换成了 bytes 类型
    b'aaaaaaaaaaa……
    >>> lib.free_buffer()
    0
    ```

## 回调函数

可以在 Python 中写一个回调函数，作为参数传给 C 函数，让 C 程序调用。例：
1. 在 Python 中定义：
    ```py
    # 声明回调函数的返回值类型、各个形参的类型
    @ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int, ctypes.c_int)
    def callback(a, b):
        print("hello world")
        return a ** b
    lib.fun1(ctypes.c_int(1), ctypes.c_int(2), callback)
    ```

2. 在 C 中调用：
    ```C
    int fun1(int x,int y,int (*callback)(int,int)){
        return callback(x,y);
    }
    ```
