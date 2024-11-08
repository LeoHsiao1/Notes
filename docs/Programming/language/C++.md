# C++

- C++ 是 C 语言的升级版。在 C 原有语法的基础上，增加了面向对象编程等语法。
- 用 C++ 语言编写的源代码，一般保存为两种文件：
  - 源文件（source file）：扩展名为 `.cpp` 。
  - 头文件（header file）：扩展名为 `.h` 或 `.hpp` 或没有后缀。

## 相关历史

- 1967 年，挪威的 Ole Johan Dahl 和 Kristen Nygaard 发布了 Simula 语言。
  - 它是世界上第一个面向对象的编程语言，引入了对象、类、继承的概念。
- 1975 年，施乐公司的 Alan Kay 发明了 Smalltalk 语言。它是世界上第二个面向对象的编程语言，并提供了世界上第一个集成开发环境（IDE）。
- 1979 年，Bjarne Stroustrup 来到贝尔实验室工作。他借鉴 Simula 等语言，开始将 C 语言改进为一个新语言，称为 C Plus Plus ，简称为 Cpp、C++ 。
- 1985 年，Bjarne Stroustrup 出版书籍《The C++ Programming Language》，介绍 C++ 的各种语法。此后几年，又给 C++ 增加了一些语法。
- 1998 年，ISO 发布了新的 C++ 语言标准，被称为 C++98 。2000 年代的程序员们，大多使用 C++98 标准。
- 2011 年，ISO 发布了新的 C++ 语言标准，被称为 C++11 。
  - 增加了一个常量 `nullptr` 表示空指针。
    - 以前，按照 C 语言的习惯，用 `#define NULL 0` 表示空指针。但 NULL 既属于指针类型，又属于 int 类型，容易引发歧义。因此建议改用 `nullptr` 。
  - 增加关键字 `auto` ，用于在定义变量时，自动选择一个数据类型。但自动推导的数据类型，不一定符合用户需求。例：
    ```cpp
    auto a = 1; // 编译器发现 1 是 int 类型，于是自动让变量 a 采用 int 类型
    ```
  - 改进了 for 循环的语法，支持遍历一个容器中的所有元素。例如：
    ```cpp
    int array = {1, 2, 3, 4, 5};
    for (int i = 0; i < 5; i++)
        std::cout << arr[i] << std::endl;
    ```
    现在可以简化为：
    ```cpp
    int array = {1, 2, 3, 4, 5};
    for (auto i : array)
        std::cout << i << std::endl;
    ```
  - 头文件 `<memory>` 中，弃用 `auto_ptr` 类型的指针，增加 `unique_ptr`、`shared_ptr`、`weak_ptr` 三种类型的指针。
  - 增加头文件 `<regex>` ，用于处理正则表达式。
- 2017 年，ISO 发布了新的 C++ 语言标准，被称为 C++17 。

## 程序示例

编写一个源文件 test.cpp ：
```cpp
#include <iostream>       // 导入头文件
// using namespace std;

int main()
{
    std::cout << "Hello" << std::endl;
    return 0;
}
```
- C++ 早期的头文件，扩展名 `.h` 或 `.hpp` 。但 C++98 修改了头文件的格式，去掉了扩展名。
- C++98 的头文件，引入了 namespace 的机制，用于分组管理标识符。
  - 每个 namespace 用于容纳一组标识符。同一 namespace 的各个标识符不能重名，不同 namespace 的各个标识符可以重名。
  - iostream 等标准库的所有标识符，都位于 std 命名空间。因此，用户可通过两种方式来调用这些标识符：
    - 每次调用标识符时，都加上 std 命名空间的前缀，比如 `std::cout` 。
    - 在源文件中声明 `using namespace std;` ，选用 std 命名空间，然后可以直接调用其中的标识符，比如 `cout` 。
- 标准库 iostream 定义了一个 iostream 类，表示输入输出流。
  - `cout` 是从 iostream 类创建的一个对象，表示 character output 。
    - 用户可通过 `<<` 运算符，向 `cout` 写入一个值，该值会被输出到终端。
    - `endl` 表示输出一个换行符，并刷新缓冲区。`std::cout << std::endl;` 相当于 `std::cout << '\n' << std::flush;`
  - `cin` 是从 iostream 类创建的一个对象，表示 character input 。
    - 用户可通过 `>>` 运算符，从 `cin` 读取一个值，赋值给一个变量。
      ```cpp
      char name[10];
      std::cin >> name;
      std::cout << "name: " << name << std::endl;
      ```

## 变量

## 字符串


## 类

- 类是一个模板，用于描述一类对象的状态和行为。
  - 对象的状态，又称为属性，在代码中用变量表示。
  - 对象的行为，又称为方法，在代码中用函数表示。

- 在类中定义的变量，分为几类：
  - 实例变量
    - 创建每个对象时，会为该对象单独存储一份实例变量，专门给该对象使用。当该对象被销毁时，其实例变量也会被销毁。
  - 类变量
    - 声明为 static 类型，又称为静态变量。
    - 每个类，只存储一份类变量，被该类的所有对象共用。

- 在类中定义的方法，分为几类：
  - 实例方法
  - 类方法

## 对象

- C++ 中创建对象时，有两种方式：
  - 在内存的栈区，创建对象
    - 这种对象，像普通变量一样创建，声明类型、赋值。
    - 这种对象，当作用域结束时，会被自动销毁，释放内存空间。
    - 这种对象的成员，要用 `.` 运算符来访问。
    - 例：
      ```cpp
      std::string str1 = "Hello";
      std::cout << str1.length() << std::endl;
      ```
  - 在内存的堆区，创建对象
    - 这种对象，要用关键字 `new` 创建，调用一个类，传入参数。
    - 这种对象，当作用域结束时，不会自动销毁。可用关键字 `delete` 主动销毁，或者用智能指针自动销毁。
      - 关键字 `new` 默认会调用 C 语言的 malloc() 函数来分配内存。
      - 关键字 `delete` 默认会调用 C 语言的 free() 函数来释放内存。
    - 这种对象的成员，要用 `->` 运算符来访问。
    - 例：
      ```cpp
      std::string *str2 = new std::string("Hello");
      std::cout << str2->length() << std::endl;

      delete str2;
      ```

### 指针

C++ 的头文件 `<memory>` 提供了几种智能指针，用于自动销毁堆区的对象：
- `auto_ptr`
  - ：这种指针，当作用域结束时，会自动调用它所指对象的析构函数，销毁该对象。
  - 例：
    ```cpp
    #include <iostream>
    #include <memory>

    int main()
    {
        int* x = new int(5);
        std::auto_ptr<int> p1(x);   // 创建 auto_ptr 类型的指针 p1 ，指向 int 类型的对象 x
        // 可以合并为一行代码：std::auto_ptr<int> p1(new int(5));

        std::cout << p1 << std::endl;   // 语法错误，不支持将 auto_ptr 指针写入 ostream
        std::cout << *p1 << std::endl;  // 输出为：5
        std::cout << p1.get() << std::endl; // 获取对象的内存地址。输出为：0x1b2fe70

        p1.reset(new int(6));           // 重置指针，让它指向另一个对象
        std::cout << *p1 << std::endl;  // 输出为：6

        int *p2 = p1.release();         // 释放指针。这会将它置为空指针，然后返回对象的内存地址
        std::cout << p1.get() << std::endl; // 输出为：0
        std::cout << *p1 << std::endl;  // 读取空指针，这会导致程序崩溃，报错 Segmentation fault

        return 0;
    }

    ```
  - 缺点：不能将一个 auto_ptr 指针，赋值给另一个 auto_ptr 指针。因为赋值时会自动调用 release() 释放前一个指针，如果用户继续使用前一个指针，就会出错。
    ```cpp
    std::auto_ptr<int> p1(new int(5));
    std::auto_ptr<int> p2;
    p2 = p1;
    std::cout << *p1 << std::endl;  // 此时 p1 已经是空指针，读取它会导致程序崩溃
    ```

- `unique_ptr`
  - ：每个 unique_ptr 指针，禁止赋值给其它 unique_ptr 指针。
  - 例：
    ```cpp
    std::unique_ptr<int> p1(new int(5));
    std::unique_ptr<int> p2;
    p2 = p1;  // 编译时会报错，不允许这样赋值
    ```

- `shared_ptr`
  - ：多个 shared_ptr 指针，允许指向同一个对象。此时会自动记录，该对象被多少个指针引用了。如果引用计数变为 0 ，则自动销毁对象。
    ```cpp
    auto p1 = std::make_shared<int>(5);
    std::cout << *p1 << std::endl;  // 输出为：5

    auto p2 = p1;
    std::cout << p1.use_count() << std::endl;   // 查看此时的引用计数。输出为：2
    ```
  - 缺点：假设对象 A 有一个 shared_ptr 指针变量，引用对象 B 。对象 B 也有一个 shared_ptr 指针变量，引用对象 A 。此时两个对象循环引用，引用计数不会变为 0 ，除非用户主动 delete 对象。

- `weak_ptr`
  - ：与 shared_ptr 指针类似，但 weak_ptr 指针不会影响一个对象的引用计数。因此 shared_ptr 指针全部被销毁时，不管剩下多少个 weak_ptr 指针，引用计数都为 0 ，不怕循环引用。
  - shared_ptr 被称为强引用，决定了引用计数。weak_ptr 被称为弱引用，不影响引用计数。

### 引用

- C++ 中，可以用 & 运算符，创建对某个对象的引用。如下：
  ```cpp
  int a = 1;
  int &b = a;                   // 创建一个引用 b ，指向变量 a
  std::cout << b << std::endl;  // 输出为：1 。因为此时变量 b 指向变量 a
  b = 2;                        // 给变量 b 赋值，实际上是给变量 a 赋值
  std::cout << a << std::endl;  // 输出为：2
  ```
  - 创建一个引用时，必须同时对它进行初始化赋值，而且以后不能改变它的指向。
  - 引用相当于对象的别名。如果一个对象拥有多个引用，则相当于拥有多个标识符名称。
  - 引用的效果，与指针类似，也是指向对象的内存地址，不需要拷贝值。而且不需要 `*` 取消引用运算符就可以访问该对象，比使用指针更简洁。

- 常引用：禁止通过该引用，修改目标对象的值。如下：
  ```cpp
  int a = 1;
  const int &b = a;
  b = 2;    // 编译时会报错： assignment of read-only reference
  ```
