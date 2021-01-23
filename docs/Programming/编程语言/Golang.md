# Golang

：Go 语言，一种编译型语言。
- [官方文档](https://golang.org/doc/)
- 于 2009 年由 Google 公司发布。
- 是强类型语言、静态语言。
- 提供了协程机制，处理并发任务的效率高。因此常用于服务器应用开发、云计算领域。

## 语法特点

- 语法与 C 语言相似。
- 源文件的扩展名为 .go 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 // 声明单行注释。
- 支持定义函数，不支持定义类，但可以通过结构体（struct）实现面向对象编程。
- 会自动回收垃圾内存。

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
  - 可以写成多行的格式：
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

## 数据类型

- 基本数据类型如下：
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
  - 区分字符、字符串常量：
    ```go
    c := 'H'        // 定界符为单引号，因此视作字符类型，存储为 rune 型
    c := 'Hello'    // 字符类型只能包含单个字符，这里编译时会报错：invalid character literal (more than one character)
    s := "Hello"    // 定界符为双引号，因此视作字符串类型，存储为 string 型
    ```

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

## 函数

- 例：
  ```go
  func fun1(x int, y string) (int) {
      fmt.Println("%d, %s", x, y)
      defer fmt.Println("done")   // 当函数退出时调用该函数
      return 0
  }

  fun1(1, "a")

  func numbers()(int,int,string){
    a , b , c := 1 , 2 , "str"
    return a,b,c    // 返回多个值
  }
  ```

## 协程

Golang 提供了 Goroutines ，可以创建轻量级的协程；还提供了 Channels 机制，用于协程之间的通信。

- 用关键字 go 可以创建一个协程：
    ```go
    go fun1(1, "a")
    ```
  - 当主线程退出时这些协程会被自动终止。

- 协程之间可以通过 channel 类型的变量进行通信：
    ```go
    ch := make(chan int, 100)  // 用关键字 chan 创建一个通道，并设置缓冲区大小为 100
    ch <- 1                    // 写入数据到通道（如果通道不带缓冲或缓冲区已满，则会陷入阻塞）
    v := <-ch                  // 从通道取出数据，并赋值给 v（如果通道为空，则会陷入阻塞）
    close(c)                   // 关闭通道

    for i := range c {         // 遍历通道，如果通道为空就保持阻塞，除非通道被关闭
        fmt.Println(i)
    }
    ```

## package

```go
import (
	"fmt"
	"time"
)

```
