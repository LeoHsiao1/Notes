# gcc

：GNU 编译器的一部分。
- GNU 编译器套件（GNU Compiler Collection）是类 Unix 系统上的标准编译器。
- gcc 最初只支持 C 语言，后来还支持 C++、Objective-C、Fortran、Java 等语言，并且被移植到多个平台。
- gcc 是 C 语言的编译器，g++是 C++的编译器。

## 编译过程

gcc 的编译过程分为四个步骤：

1. **预处理(Pre-Processing)**：主要是处理 C 语言源文件中的预处理命令，生成一个**中间文件 *.i** 。
    ```sh
    gcc -E test.c -o test.i      # -o 选项表示 output
    ```

2. **汇编（Assembling）**：由中间文件 *.i 生成**汇编语言文件 *.s**。
    ```sh
    gcc -S test.i -o test.s
    ```

3. **编译(Compiling）**：由汇编语言文件 *.s 生成目标文件。
    ```sh
    gcc -c test.s -o test.o
    ```
    - 目标文件又称为对象文件，它是二进制文件，与最终的可执行文件很像。
    - Linux、Windows 系统上，**目标文件的后缀名分别为 .o 、.obj**。

4. **链接(Linking)**：由目标文件生成最终的可执行文件。
    ```sh
    gcc test.o -o 1
    ```
    - Linux 系统的可执行文件没有后缀名，Windows 系统的可执行文件的后缀名为 .exe 。

这四个阶段可以简化为一个步骤：
```sh
gcc test.c -o test
    -I /root/test/include  # 添加头文件的检索目录
    -L /root/test/lib      # 添加库文件的检索目录
    -l lib1                # 链接一个名为 lib1 的库文件
    -static                # 只使用静态链接库
```
- 用到头文件或库文件时，gcc 会先检索-I、-L 指定的目录，再检索环境变量 PATH 路径。

编译时出现的报错有两种：
- Error ：致命错误，导致编译失败。
- Warning ：警告，可以成功编译、链接，但运行时可能出错。

## make

当源文件的规模较大、引用关系较复杂时，用 gcc 逐个编译比较麻烦，可以用工具 make 批量编译。
- make 会读取 Makefile 文件中的指令，获取模块间的依赖关系，判断哪些文件过时了需要重新编译，然后生成中间代码或最终的可执行程序。
- 命令：
    ```sh
    make           # 开始编译（默认使用当前目录下的 Makefile）
        clean      # 删除所有被 make 创建的文件
        install    # 编译并安装到系统中
        uninstall  # 卸载
    ```
- 相关概念：
    - 一些 IDE 能自动使用 make 完成编译。
    - cmake 工具：可以根据 CMakeList.txt 文件自动生成 Makefile 文件。（在 Windows 上则是生成 visual studio 的 project 文件）
    - qmake 工具：用于生成 Qt 项目的 Makefile 文件。

## 库文件

：包含了一些代码，可以被程序导入、调用。

库文件的用途。
- 可以将程序的代码分离成多个模块，方便调整。
- 可以将一个程序的部分代码解耦出来，保存在库文件中，给另一个程序调用，提高代码的复用性。
- 可以将某种语言的程序保存在库文件中，给另一种语言的程序调用，提高代码的通用性。

库文件的分类：
- 动态链接库：又称为共享库，在程序运行时才被动态导入。
  - 这会减小程序文件的体积，但在运行时需要花时间加载。
  - Linux、Windows 系统上**静态链接库的后缀名分别为 .so 、.dll** 。
- 静态链接库：在程序编译时的“链接”阶段被导入，保留在可执行文件中。
  - 这会增加程序文件的体积，但运行时不必花时间加载。
  - Linux、Windows 系统上**静态链接库的后缀名分别为 .a 、.lib** 。

库文件的命名格式为 **lib + 库名 + 后缀名** 。
- gcc 在编译时会根据库名去寻找相应的库文件，且优先使用动态链接库，当动态链接库文件不存在时才寻找相同库名的静态链接库。

从目标文件生成动态链接库：
```sh
gcc -shared test.o... -o test.so    # 可以调用多个目标文件，还可以从.c 文件生成
    -fPIC      # 使生成的代码全部采用相对地址，这样就可以被加载到内存的任意位置
    -shared    # 生成共享动态链接库
```

从目标文件生成静态链接库：
```sh
ar -rc lib1.a 1.o  ...          # 可以加上多个目标文件
```

## 移植 Linux 程序

在 Linux 上编译的程序，
- 如果程序没有调用 Linux 上特有的库文件、API ，则可以直接放到 Windows 上运行。
- 如果程序依赖 Linux ，则可以用 Visual Studio、MinGW、Cygwin 等工具编译成 Window 的可执行文件。

相关概念。
- MinGW（Minimalist GNU For Windows）：将 GNU 套件移植到了 Windows 上，让用户可以在 Windows 上使用 GNU 编译器（一般是在 DOS 窗口中使用），编译生成的可执行文件是 .exe 格式。
  - MinGW 在编译时，会将源代码中调用的 Linux 库文件、API 转换成 Windows 库文件、API 。
  - MinGW 有一个子项目 Msys ，提供了一个在 Windows 上运行的简单 Linux 系统。
- Visual Studio 可以像 MinGW 一样编译代码，而且更好用。
- Cygwin ：一个可以在 Windows 上运行的简单 Linux 系统。
  - Cygwin 将一些 Linux 特有的库文件、API 移植到了 Windows 上，模拟出 Linux 的运行环境。被 Cygwin 编译出的程序在运行时会调用这些库文件。
- Java 通过 JVM 的机制与底层平台解耦，只要编译一次，就可以放到多个平台上直接运行。Python 也是同理。
- Qt ：一个跨平台框架，在该框架中编译的程序可以编译成 Linux、Windows、MacOS 等多平台的可执行文件。
