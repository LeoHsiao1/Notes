# Golang

：Go 语言，一种编译型语言。
- [官方文档](https://golang.org/doc/)
- 于 2009 年由 Google 公司发布。
- 是强类型语言、静态语言。
- 提供了协程机制，处理并发任务的效率高。因此常用于服务器应用开发、云计算领域。

## 语法特点

- 语法与 C 语言相似，支持定义结构体、指针。
- 源文件的扩展名为 .go 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 `//` 声明单行注释，用 `/*`、`*/` 声明多行注释。
- 支持定义函数，不支持定义类，但可以通过结构体（struct）实现面向对象编程。
- 会自动回收垃圾内存。

## 编译

- 安装编译器：
  ```sh
  yum install golang
  ```

- 使用编译器：
  ```sh
  go
      run test.go     # 编译并执行一个源文件
      run .           # 指定一个目录时，会自动执行该目录下包含 main 包及 main 函数的源文件

      build test.go   # 编译一个源文件，这会生成一个名为 test 的可执行文件
  ```

## 程序示例

编写一个源文件 test.go ：
```go
package main      // 声明当前文件属于一个名为 main 的包

import "fmt"      // 导入名为 fmt 的包

func main() {
    var x = "Hello World!"
    fmt.Println(x)
}
```
- 启动一个 Golang 程序时，会找到其中名为 main 的包，执行其中名为 main 的函数。
- 包 fmt 提供了一些输入输出的函数，如下：
  ```go
  fmt.Print("Hello")                    // 打印一个值到终端
  fmt.Println("Hello")                  // 打印一个值并换行
  fmt.Println("Hello\nWorld", 1, 3.14)  // 可以打印任意个值
  fmt.Printf("%d, %d\n", 1, 2)          // 格式化输出
  ```
- Golang 要求左花括号 `{` 不能独占一行，如下：
  ```go
  func main()
  {                           // 编译时会报错：unexpected semicolon or newline before {
      fmt.Println("Hello")
  }
  ```

## 变量

- 用关键字 var 可以创建变量。
  - 常见的几种格式如下：
    ```go
    var x int       // 创建变量，在变量名之后声明其数据类型，但不赋值。此时变量采用默认值
    ```
    ```go
    var x int = 1   // 创建变量，声明数据类型，并赋值
    ```
    ```go
    var x = 1       // 创建变量，省略数据类型，并赋值。此时会根据赋值自动确定数据类型
    ```
  - 可以同时创建多个变量：
    ```go
    var x, y int
    var a, b, c = 1, true, "Hello"
    ```
  - 可以通过括号写成多行的格式：
    ```go
    var (
        a int
        b bool
        c string
    )
    ```
    ```go
    var (
        a int
        b bool = true
        c = "Hello"
    )
    ```
  - 创建变量时，如果该变量名已存在，则编译时会报错：`variable redeclared`
  - 如果创建了一个局部变量，但并没有在其作用域内读取其值，则编译时会报错：`variable declared and not used`

- 在函数内可以用 `:=` 创建变量：
  ```go
  x := 1      // 相当于 var x = 1
  ```
  - 函数外的每个语句都必须以关键字开头，因此不能使用 `:=` 。

- 用关键字 const 可以创建常量，格式与 var 相似：
  ```go
  const LENGTH int = 10
  const a, b, c = 1, true, "Hello"
  ```

- `_` 是一个特殊的标识符，可以作为变量被赋值，但不能被读取。因此通常将一些不需要保存的值赋值给它。如下：
  ```go
  result, _ := do_sth()
  fmt.Println(_)          // 不能读取 _ 的值，编译时会报错：cannot use _ as value
  ```

- 变量的作用域：
  - 全局变量：在函数外、包内创建。
  - 局部变量：在函数、for 语句块等区域内创建。

## 数据类型

### 基本数据类型

```go
int         // 整型
int8        // 别名为 byte
int16
int32       // 别名为 rune
int64

uint        // 无符号整型 ，还有 uint8、uint16、uint32、uint64
uintptr     // 无符号整型，用于存储指针

float32     // 浮点型
float64

complex64   // 复数，比如 c := 1 + 2i
complex128

bool        // 布尔类型，取值为 true 或 false

string      // 字符串类型，采用 UTF-8 编码
```
- int、uint、uintptr 在 32 位系统上容量为 4 bytes ，在 64 位系统上容量为 8 bytes 。
- 创建不同数据类型的变量时，其默认值如下：
  - 数值类型，默认值为 0 。
  - 布尔类型，默认值为 false 。
  - 字符类型，默认值为 '' 。
  - 字符串类型，默认值为 "" 。
- 通过定界符区分字符、字符串常量：
  ```go
  c := 'H'        // 定界符为单引号，因此视作字符类型，存储为 rune 型
  c := 'Hello'    // 字符类型只能包含单个字符，这里编译时会报错：invalid character literal (more than one character)
  s := "Hello"    // 定界符为双引号，因此视作字符串类型，存储为 string 型
  ```

### 类型转换

- 不支持自动类型转换：
  ```go
  i := 42     // 创建的变量为 int 型
  i  = 3.14   // int 型变量不能被 float 型常量赋值，此时会报错：constant 3.14 truncated to integer
  ```
  ```go
  f := 3.14   // 创建的变量为 float64 型
  f  = 42     // float64 型变量可以被 int 型常量赋值
  f  = i      // 不同类型的变量不能相互赋值。此时会报错：cannot use i (type int) as type float64 in assignment
  ```
- 支持强制类型转换：
  ```go
  var i int     = 42
  var f float64 = float64(i)  // 相当于 f := float64(i)
  ```

### 数组

- 数组（array）：用 `[n]type` 的格式创建，长度固定。
- 创建数组：
  ```go
  var array [10] int                // 创建一个指定长度的数组，不赋值
  array2 := [10]int{0, 1, 2, 3}     // 创建一个指定长度的数组，并赋值部分元素
  ```
  - 数组中的元素必须属于同一数据类型。
- 访问数组：
  ```go
  array[0] = 10   // 给指定位置的元素赋值
  array[0]        // 读取指定位置的元素
  len(inArr)      // 获取数组的长度
  ```

### 切片

- 切片（slice）：引用数组的某个区间的元素，也可以用 `[]type` 的格式创建，长度可变。
  - 修改数组的元素时，其切片看到的元素也会改变。反之也成立。
- 获取数组的切片：
  ```go
  array := []int{0, 1, 2, 3}
  array[0:3]      // 获取区间 [0, 3) 的切片，这里会返回一个数组 [0 1 2]
  array[0:0]      // 获取区间 [0, 0) 的切片，这里会返回一个数组 []
  ```
  - 切片的上标、下标可以缺省，默认值分别为 0、len(array) ，因此支持以下写法：
    ```go
    array[0:]     // 这里会返回一个数组 [0 1 2 3]
    array[:3]     // 这里会返回一个数组 [0 1 2]
    array[:]      // 这里会返回一个数组 [0 1 2 3]
    ```
  - 切片的上标、下标出错的几种情况：
    ```go
    array[-1:0]   // 上标、下标不能为负数，这里编译时会报错：invalid slice index -1 (index must be non-negative)
    array[1:0]    // 上标不能大于下标，这里编译时会报错：invalid slice index: 1 > 0
    array[0:6]    // 下标不能大于数组长度，这里运行时会报错：runtime error: slice bounds out of range [:6] with capacity 5
    ```
- 创建切片：
  ```go
  slice := []int{0, 1, 2, 3}      // 这会先创建一个数组 [4]int{0, 1, 2, 3} ，再返回其切片
  ```
- 对切片追加元素：
  ```go
  slice = append(slice, 4)        // 追加一个元素
  slice = append(slice, 5, 6, 7)  // 可以同时追加多个元素
  fmt.Println(slice)              // 这里会打印：[0 1 2 3 4 5 6 7]
  ```
- 调用 make 函数可以创建 slice、Map、channel 等类型的内存空间。
  ```go
  slice := make([]int, 4)         // 创建一个切片，长度为 4
  ```

### 结构体

- 用关键字 `type ... struct` 可以定义一个结构体，从而自定义一种数据类型。
- 定义结构体：
  ```go
  type Book struct {  // 定义一个结构体，名为 Book
      id int          // 给该结构体定义一个成员，名为 id ，数据类型为 int
      title string
      author string
  }
  ```
- 使用结构体：
  ```go
  var book1 Book      // 创建结构体 Book 的一个实例，名为 book1
  book1.id            // 读取结构体的成员。这里 id 还未赋值，所以采用 int 型变量的默认值
  book1.id = 1        // 给成员赋值
  fmt.Println(book1)  // 打印结构体时，会按顺序打印各个成员的值。这里会打印：{0  }
  ```
  ```go
  book2 := Book{2, "Hello", "unknown"}   // 创建一个实例，并赋值。此时如果只给部分成员赋值，则编译时会报错：too few values in Book literal
  ```
  ```go
  book3 := Book{title: "Hello", author: "unknown"}   // 可以通过键值对的形式赋值，并且此时可以只给部分成员赋值
  fmt.Println(book3)  // 这里会打印：{0 Hello unknown}
  ```

### Map

- Map（映射）是包含一组键值对的集合，类似于 Python 的字典类型。
  - 各键值对是无序存储的。
- 创建 Map ：
  ```go
  m := make(map[string]int) // 创建一个 Map 变量，名为 m ，键值对的数据类型分别为 string、int
  m["A"] = 1                // 添加一个键值对
  m["B"] = 2
  delete(m, "B")            // 从 Map 中删除一个 key 及其值。如果该 key 不存在，并不会报错
  ```
- 检查一个 key 是否存在：
  ```go
  value, ok := m["A"]
  if (ok) {
      fmt.Println("key 存在", value)
  } else {
      fmt.Println("key 不存在", value)
  }
  ```
  - 读取一个 key 对应的值时，如果该 key 不存在，则读取到的值为其数据类型的默认值，但并不会报错。
- 遍历 Map ：
  ```go
  for key := range m {
      fmt.Println(key, "=", m[key])
  }
  ```
  ```go
  for key, value := range m {
      fmt.Println(key, "=", value)
  }
  ```

### 指针

- 使用指针：
  ```go
  x := 42
  var p *int          // 创建一个变量，并声明为 *int 型指针
  p = &x              // 用 & 运算符获取一个变量的地址，赋值给指针变量
  fmt.Println(p)      // 获取指针变量本身的值，即十六进制地址，这里会打印：0xc000086020
  fmt.Println(*p)     // 用 * 运算符取消指针的引用，读取其引用地址的值。这里会打印：42
  ```
  - 创建指针时可简写为：
    ```go
    x := 42
    p := &x
    ```

- 取值为 nil 的指针称为空指针，相当于 C 语言的 null 指针。
  - 刚创建的指针变量，默认值都为 nil 。
  - 例：
    ```go
    p = nil
    fmt.Println(p)    // 这里会打印： nil
    fmt.Println(*p)   // 空指针不能读取其引用地址的值，这里运行时会报错：runtime error: invalid memory address or nil pointer dereference
    ```

- 与 C 语言相比，Golang 禁止了一些指针运算：
  ```go
  x := 42
  y := 3.14
  p := &x
  p = &y      // 指针不能存储其它数据类型的地址，这里编译时会报错：cannot use &y (type *float64) as type *int in assignment
  p += 1      // 指针存储的值不能进行算术运算，这里编译时会报错：invalid operation: p += 1 (mismatched types *int and int)
  ```

- 使用结构体指针：
  ```go
  var book1 Book
  book_p := &book1

  fmt.Println(book1)    // 这里会打印：{0  }
  fmt.Println(book_p)   // 这里会打印：&{0  }

  (*book_p).id          // 用 * 运算符取消引用，再访问结构体的成员
  book_p.id             // 也可以用 book_p.id 直接访问结构体的成员，它会被 Golang 当作 (*book_p).id 处理
  ```

## 流程控制

### if 语句

- 例：
  ```go
  if x := 1; x < 2 {    // 可以在条件表达式之前加上一个子句
      fmt.Println(true)
  } else {
      fmt.Println(false)
  }
  ```

- 多层判断：
  ```go
  x := 1
  if x == 1 {
      fmt.Println(1)
  } else if x == 2 {
      fmt.Println(2)
  } else {
      fmt.Println(0)
  }
  ```

### for 语句

- 例：
  ```go
  sum := 0
  for i := 0; i < 10; i++ {
      sum += i
  }
  ```
  - 当条件表达式的布尔值为 false 时，for 循环才结束。

- 可以省略初始化子句、后置子句，只留下条件表达式子句：
  ```go
  sum := 1
  for ; sum < 10; {
      sum += sum
  }
  ```
  还可以再省略分号，格式相当于 Python 的 while 循环：
  ```go
	sum := 1
	for sum < 10 {
		  sum += sum
	}
  ```
- 可以省略所有子句，写成无限循环：
  ```go
  for {
  }
  ```

- 可以将 for 与 range 搭配使用，进行遍历：
  ```go
  for index, value := range "Hello" {
      fmt.Println(index, value)
  }
  // 打印如下：
  // 0 72
  // 1 101
  // 2 108
  // 3 108
  // 4 111
  ```
  - 每次遍历时会返回两个值：元素的索引、元素的值。可以只获取其中一个：
    ```go
    for index := range "Hello" { }
    for _, value := range "Hello" { }
    ```

## 函数

- 例：
  ```go
  func fun1(x int, y int){    // 定义一个函数，名为 fun1 ，形参为 (x int, y int)
      fmt.Println(x, y)
  }

  fun1(1, 2)                  // 调用函数
  ```
  - 函数可以没有形参，或声明多个形参。
  - 函数可以没有返回值，或者返回多个值。
  - 函数不支持嵌套，不能在一个函数内定义另一个函数。

- 如果函数有返回值，则必须在函数头末尾声明返回值列表：
  ```go
  func fun1() (int, int) {
      return 1, 2
  }

  fmt.Println(fun1())
  ```
  - 这里声明了返回值列表为 `(int, int)` ，因此函数必须返回两个 int 类型的值，否则编译时会报错。

- 可以在返回值列表中指定变量名：
  ```go
  func fun1() (a, b int) {
      a = 1
      return
      // return 1, 2
  }

  fmt.Println(fun1())
  ```
  - 这里声明了返回值列表为 `(a, b int)` ，因此会在函数开始时就创建这两个局部变量。
  - 如果 return 语句的内容为空，则会返回 a、b 两个变量作为返回值。

- 用关键字 defer 调用一个函数，会推迟执行它：
  ```go
  func fun1(){
      defer fmt.Println("defer...")   // 使用 defer 语句
      fmt.Println("function end")
  }

  fun1()
  ```
  - defer 语句只能在一个函数内使用，在该函数退出时才执行。
  - 如果有多个 defer 语句，则按后进先出的顺序执行。

## package

- 导入包：
  ```go
  import "fmt"
  import "math"
  ```
  - 可以通过括号写成多行的格式：
    ```go
    import (
        "fmt"
        "math"
    )
    ```
- Golang 根据包内的成员是否以大写字母开头，控制包外的访问权限。
  - 以大写字母开头的成员会被导出（export），可以被外部调用，相当于 Java 的 public 权限。
  - 其它成员不会被导出，对外部不可见，相当于 Java 的 protected 权限。
  - 例：
    ```go
    fmt.Println(math.Pi)    // 可以访问
    fmt.Println(math.pi)    // 不可以访问，编译时会报错：cannot refer to unexported name
    ```

## 协程

- Golang 提供了 Goroutines 机制，用于创建轻量级的协程。还提供了 Channels 机制，用于协程之间的通信。
- 用关键字 go 调用一个函数，会创建一个协程去执行它：
  ```go
  func fun1(x int){
      fmt.Println(x)
  }

  go fun1(1)
  ```
  - 创建协程的当前线程，称为主线程。
  - 协程会共享主线程的内存，但不会共享 stdin、stdout 。
  - 当主线程退出时，其下所有协程会被自动终止。

- 协程之间可以通过 channel 类型的变量进行通信：
  ```go
  func fun1(ch chan int){
      for i := 0; i < 100; i++ {
          ch <- i               // 写入一个值到通道。如果通道的缓冲区没有可用空间，则一直等待写入，陷入阻塞
      }
      close(ch)                 // 关闭通道。只有发送者能关闭通道
  }

  func main() {
      ch := make(chan int, 10)  // 用关键字 chan 创建一个通道，其数据类型为 int ，缓冲区可存储 10 个 int 型值
      go fun1(ch)               // 创建协程，并传递通道以便通信
      for value := range ch {   // 遍历通道。如果通道为空，则一直等待读取，陷入阻塞，除非通道被关闭
          fmt.Println(value)
      }
  }
  ```
  - 可以主动判断通道是否关闭：
    ```go
    value, ok := <-ch           // 从通道取出一个值，如果 ok 为 false 则说明通道已被关闭
    ```

- 可以用 for + select 语句同时读取多个通道：
  ```go
  for {
    select {
        case ch := <- 1:
            fmt.Println("写入一次")
        case <- quit:
            fmt.Println("终止执行")
            return
        default:
            fmt.Println("sleep ...")
            time.Sleep(1000 * time.Millisecond)
    }
  }
  ```
  - 这里 select 语句会检查哪个 case 条件满足，执行相应的语句块，都不满足则执行 default 语句块。
  - 如果没有 default 语句，则 select 语句会阻塞等待，直到某个 case 条件满足。
