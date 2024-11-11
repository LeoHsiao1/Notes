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
  - C++98 中，关键字 `auto` 用于创建一个局部变量。而 C++11 中，关键字 `auto` 用于在定义变量时，自动选择一个数据类型，但不一定符合用户需求。例：
    ```cpp
    auto a = 1; // 编译器发现 1 是 int 类型，于是自动让变量 a 采用 int 类型
    ```
  - 改进了 for 循环的语法，支持遍历一个容器中的所有元素。例如：
    ```cpp
    int array = {1, 2, 3, 4, 5};
    for (int i = 0; i < 5; i++)
        cout << arr[i] << endl;
    ```
    现在可以简化为：
    ```cpp
    int array = {1, 2, 3, 4, 5};
    for (auto i : array)
        cout << i << endl;
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
- 标准库 `<iostream>` 定义了一个 iostream 类，表示输入输出流。
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

## 数据类型

- C++ 提供了以下基本数据类型：
  ```cpp
  bool      // 布尔型，容量为 1 字节，但 8 个 bool 变量可以压缩为 1 字节

  char      // 字符型，容量为 1 字节

  short int // 短整型，容量为 2 字节
  int       // 整型，容量为 4 字节
  long int  // 长整型，容量为 8 字节

  float     // 单精度浮点型，容量为 4 字节
  double    // 双精度浮点型，容量为 8 字节
  long double // 容量为 16 字节

  void      // 无类型
  wchar_t   // 宽字符。相当于 typedef short int wchar_t;
  ```

- 字符型、整型、浮点型，还可添加 signed、unsigned 两种修饰符，例如：
  ```cpp
  signed int    // 带符号整型。最高的一个二进制位，用于存储正负号
  unsigned int  // 无符号整型。没有正负号，只能存储整数
  ```

- 除了上述基本数据类型，用户可以自定义一个类，代表一种新的数据类型。

### 字符串

C++ 中如何用变量存储字符串？有多种方式：

- 可以创建 char 数组，这像 C 语言的风格。
  ```cpp
  char str[] = "Hello"; // 会在字符串末尾，自动添加一个空字符 \0 ，表示该字符串的结束
  ```

- 可以导入标准库 `<string>` ，从 string 类创建一个对象，用于存储字符串。例：
  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;

  int main()
  {
      string str1 = string("Hello");  // string("Hello") 是创建一个 string 对象
      str1 = "Hello";                 // 可以将一个字符串常量（的首地址），赋值给 string 对象

      cout << str1 << endl;           // 输出为：Hello
      cout << str1.size() << endl;    // 输出为：5 。这是获取字符串的长度，即字符总数，不考虑末尾的空字符

      string str2 = str1 + " World";  // 可通过加号，拼接两个字符串
      cout << str2 << endl;           // 输出为：Hello World
      str2 = str1;                    // string 对象之间，可以直接赋值

      return 0;
  }
  ```
  - 如果字符串中间包含空字符 `\0` ，则会提前结束字符串。
    ```cpp
    cout << string("ab\0cd")           << endl; // 输出为：ab
    cout << string("ab\0cd").size()    << endl; // 输出为：2
    ```
    为了保留空字符，可以指定 string 的长度。这样不依靠空字符，就能判断字符串何时结束。
    ```cpp
    cout << string("ab\0cd", 5)        << endl; // 输出为：abcd
    cout << string("ab\0cd", 5).size() << endl; // 输出为：5
    ```
  - 调用 `string.c_str()` ，会返回一个 `const char*` 类型的指针，指向字符串的内存首地址，可像字符数组一样访问。
    ```cpp
    string str1 = "Hello";
    cout << str1.c_str() << endl;   // 输出为：Hello
    const char *cstr = str1.c_str();
    ```

- 可以导入标准库 `<sstream>` ，从 stringstream 类创建一个对象，表示字符串流。用法像 iostream 。
  ```cpp
  #include <sstream>

  stringstream ss;
  ss << 5;
  ss << "Hello";  // 用户可以向 stringstream ，写入多个不同类型的值，它们会拼接为一个字符串
  cout << ss.str() << endl;  // 将 stringstream ，转换成一个 string 对象。输出为：5Hello

  string str = string(ss.str()); // 调用 ss.str() 会返回一个临时的 string 对象，可将它另存为一个长期的 string 对象

  ss.str("1 3.14");   // 输入一个字符串，作为 stringstream 的内容
  float a,b;
  ss >> a >> b;       // 从 stringstream 读取两个值，赋值给到变量 a、b
  cout << a << endl;  // 输出为：1
  cout << b << endl;  // 输出为：3.14

  ss.clear();   // 清除 stringstream 的内容
  ```

### 指针

- C++ 不仅继承了 C 语言的指针语法，还通过头文件 `<memory>` 提供了几种智能指针，用于自动销毁堆区的对象：
  - `auto_ptr`
    - ：这种指针，当作用域结束时，会自动调用它所指对象的析构函数，销毁该对象。
    - 例：
      ```cpp
      #include <iostream>
      #include <memory>

      int main()
      {
          int* x = new int(5);
          auto_ptr<int> p1(x);   // 创建 auto_ptr 类型的指针 p1 ，指向 int 类型的对象 x
          // 可以合并为一行代码：auto_ptr<int> p1(new int(5));

          cout << p1 << endl;   // 语法错误，不支持将 auto_ptr 指针写入 ostream
          cout << *p1 << endl;  // 输出为：5
          cout << p1.get() << endl; // 获取对象的内存地址。输出为：0x1b2fe70

          p1.reset(new int(6)); // 重置指针，让它指向另一个对象
          cout << *p1 << endl;  // 输出为：6

          int *p2 = p1.release();   // 释放指针。这会将它置为空指针，然后返回对象的内存地址
          cout << p1.get() << endl; // 输出为：0
          cout << *p1 << endl;      // 读取空指针，这会导致程序崩溃，报错 Segmentation fault

          return 0;
      }

      ```
    - 缺点：不能将一个 auto_ptr 指针，赋值给另一个 auto_ptr 指针。因为赋值时会自动调用 release() 释放前一个指针，如果用户继续使用前一个指针，就会出错。
      ```cpp
      auto_ptr<int> p1(new int(5));
      auto_ptr<int> p2;
      p2 = p1;
      cout << *p1 << endl;  // 此时 p1 已经是空指针，读取它会导致程序崩溃
      ```

  - `unique_ptr`
    - ：每个 unique_ptr 指针，禁止赋值给其它 unique_ptr 指针。
    - 例：
      ```cpp
      unique_ptr<int> p1(new int(5));
      unique_ptr<int> p2;
      p2 = p1;  // 编译时会报错，不允许这样赋值
      ```

  - `shared_ptr`
    - ：多个 shared_ptr 指针，允许指向同一个对象。此时会自动记录，该对象被多少个指针引用了。如果引用计数变为 0 ，则自动销毁对象。
      ```cpp
      auto p1 = make_shared<int>(5);
      cout << *p1 << endl;  // 输出为：5

      auto p2 = p1;
      cout << p1.use_count() << endl;   // 查看此时的引用计数。输出为：2
      ```
    - 缺点：假设对象 A 有一个 shared_ptr 指针变量，引用对象 B 。对象 B 也有一个 shared_ptr 指针变量，引用对象 A 。此时两个对象循环引用，引用计数不会变为 0 ，除非用户主动 delete 对象。

  - `weak_ptr`
    - ：与 shared_ptr 指针类似，但 weak_ptr 指针不会影响一个对象的引用计数。因此 shared_ptr 指针全部被销毁时，不管剩下多少个 weak_ptr 指针，引用计数都为 0 ，不怕循环引用。
    - shared_ptr 被称为强引用，决定了引用计数。weak_ptr 被称为弱引用，不影响引用计数。

### 引用

- 引用类型的变量，与指针相似，也是指向某个对象的内存地址。但区别如下：
  - 访问所指对象时，指针需要加上 `*` 运算符。而引用不需要加上 `*` 运算符，更简洁。
  - 指针，可以取值为 NULL 。而引用，不能取值为空。因此每个引用在创建时，就必须进行初始化赋值。
  - 每个引用在创建之后，不能指向另一个对象，相当于指针常量。

- C++ 中，可以用 & 运算符，创建对某个对象的引用。如下：
  ```cpp
  int a = 1;
  int &b = a;         // 创建一个引用变量 b ，指向变量 a
  cout << b << endl;  // 输出为：1 。因为此时变量 b 指向变量 a
  b = 2;              // 给变量 b 赋值，实际上是给变量 a 赋值
  cout << a << endl;  // 输出为：2
  ```
  - 引用变量，相当于对象的别名。
  - 一个对象可以拥有多个引用，相当于多个标识符名称。

- 可以加上 const 关键字，声明常量引用。禁止通过该引用，修改所指对象的值。如下：
  ```cpp
  int a = 1;
  const int &b = a;
  b = 2;    // 编译时会报错： assignment of read-only reference
  ```

### vector

- C++ 在标准库 `<vector>` 中，提供了 vector 类。它是一种动态数组，可以随时增加元素、减少元素。
- 例：
  ```cpp
  #include <vector>

  vector<int> vec;            // 创建一个 vector 数组，用于存储 int 类型的元素
  vector<int> vec(2, 2);      // 创建一个 vector 数组，长度为 2 ，每个元素都赋值为 2
  vector<int> vec = {1, 2};   // 创建一个 vector 数组，并写入几个元素

  vec.push_back(3);           // 在数组末尾，添加一个元素

  cout << vec.size() << endl; // 获取数组的长度。输出为：3

  cout << vec[0] << endl;     // 访问第 0 个元素。输出为：1
  cout << vec.at(0) << endl;  // 访问第 0 个元素。输出为：1

  vec.erase(vec.begin() + 0); // 删除第 0 个元素
  vec.clear();                // 清空数组
  ```

- 调用 `vector.begin()` 会返回一个迭代器，指向数组的首个元素。每次递增迭代器，会指向下一个元素。因此可以遍历数组中的元素：
  ```cpp
  for (vector<int>::iterator it = vec.begin(); it != vec.end(); ++it)
      cout << *it << endl;
  ```
  C++11 改进了 for 循环的语法，可简化为：
  ```cpp
  for (int i : vec)
      cout << i << endl;
  ```

### template

- 使用关键字 template 可以声明泛型。
  - 如果某个值被声明为泛型，则在编译时，编译器会自动选用一种具体的数据类型。

- 将一个函数的参数声明为泛型，就可以让该函数支持不同类型的值。而不必为每种数据类型，重复定义一个函数。例：
  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;
  template <typename T>   // 创建一种泛型，名为 T 。这里的 typename 也可写作 class

  T add(T a, T b) {       // 定义一个函数，形参、返回值都是泛型
      return a + b;
  }

  int main()
  {
      cout << add(1, 2)      << endl; // 输出为：3
      cout << add(1.0, 3.14) << endl; // 输出为：4.14
      cout << add(1, 3.14)   << endl; // 编译时报错，输入的两个值分别为 int、double 类型，但 T 同时只能采用一种类型
      cout << add(string("Hello"), string("World")) << endl;  // 输出为：HelloWorld

      return 0;
  }
  ```

## 类

- 使用关键字 class ，可以定义一个类。
  - 类中可以定义多个变量、函数，统称为该类的成员。
  - 类中定义的函数，通常称为方法。

- 例：
  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;

  class Horse   // 定义一个类，名为 Horse
  {
      private:  // private 是一种修饰符，控制以下成员的访问权限
          int age;
          string name;

      public:   // public 是一种修饰符，控制以下成员的访问权限

          // 与类名同名的方法，会被编译器视作构造方法
          Horse(int a, string n)
          {
              age = a;
              name = n;
          }

          // 定义一个普通方法
          void print() {
              cout << "age: " << age << endl;
              cout << "name: " << name << endl;
          }
  };

  int main()
  {
      Horse h(5, "Jack");
      h.print();

      return 0;
  }
  ```

- 可以先在类内，声明一个方法的头部。然后在类外，定义该方法的具体内容。
  ```cpp
  class Horse
  {
      public:
          void print();
  };

  void Horse::print() {
      cout << "age: " << age << endl;
      cout << "name: " << name << endl;
  }
  ```

### 成员

- 类中声明的变量，分为几类：
  - 局部变量
    - ：在某个方法内声明的变量，作用域仅限于该方法内。
  - 实例变量
    - ：在类内、方法外声明的变量。
  - 静态变量
    - ：在类内、方法外声明的变量，并添加关键字 static 。
    - 假设从一个类，创建 n 个实例对象：
      - 这 n 个对象，会各自创建一份实例变量。修改一个对象的实例变量，不会影响其它对象。
      - 该类只存在一份静态变量，被 n 个对象共用。

- 类中声明的方法，分为几类：
  - 实例方法
    - ：像普通函数一样声明的方法。
    - 实例方法通常会调用实例变量。因此不同对象的实例方法虽然使用相同的源代码，但调用它们的结果通常不同。
  - 静态方法
    - ：添加关键字 static 的方法。
    - 静态方法通常不会调用实例变量。因此不同对象调用静态方法，结果通常相同。

- 每个成员可以用一种修饰符，声明访问权限。
  - private ：私有成员。只能从当前类中访问。
  - protected ：受保护成员。只能从当前类，或者子类中，访问。
  - public ：公有成员。可以从所有位置访问，包括类外。
  - 一个成员，如果未使用访问控制修饰符，则默认会当作 private 类型处理。

- 例：
  ```cpp
  #include <iostream>
  #include <string>
  using namespace std;

  class Horse
  {
      public:
          int age = 0;  // 在类中，定义实例变量时，可以赋值，用作每个实例的默认值
          string name;
          static string description;  // 在类中，可以声明静态变量，但不能赋值

          Horse(int a, string n)
          {
              age = a;
              name = n;
          }

          void print() {
              cout << "age: " << age << endl;
              cout << "name: " << name << endl;
          }

          static void test() {
              cout << "Hello" << endl;
          }
  };

  string Horse::description = "this is for test";   // 在类外，对静态变量赋值

  int main()
  {
      Horse h(5, "Jack");
      h.print();        // 普通方法，需要从类创建一个对象，通过对象名访问该方法
      Horse::print();   // 编译时报错：cannot call member function without object

      Horse::test();    // 静态方法，可以通过类名访问
      h.test();         // 静态方法，也可以通过对象名访问

      return 0;
  }
  ```

### 对象

- C++ 创建对象时，有两种方式：
  - 在内存的栈区，创建对象
    - 这种对象，像普通变量一样创建，声明类型、赋值。
    - 这种对象，当作用域结束时，会被自动销毁，释放内存空间。
    - 这种对象的成员，要用 `.` 运算符来访问。
    - 例：
      ```cpp
      string str = string("Hello");
      cout << str.length() << endl;
      ```
  - 在内存的堆区，创建对象
    - 这种对象，要用关键字 `new` 创建，调用一个类，传入参数。
    - 这种对象，当作用域结束时，不会自动销毁。可用关键字 `delete` 主动销毁，或者用智能指针自动销毁。
      - 关键字 `new` 默认会调用 C 语言的 malloc() 函数来分配内存。
      - 关键字 `delete` 默认会调用 C 语言的 free() 函数来释放内存。
    - 这种对象的成员，要用 `->` 运算符来访问。
    - 例：
      ```cpp
      string *str = new string("Hello");
      cout << str->length() << endl;

      delete str;
      ```
