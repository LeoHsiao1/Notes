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
- 用 `//` 声明单行注释，用 `/*`、`*/` 声明多行注释。
- 支持定义函数，不支持定义类，但可以通过结构体（struct）实现面向对象编程。
- 支持指针。
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

## 基础示例

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
- 包 fmt 提供了格式化输入输出的函数。如下：
  ```go
  fmt.Print("Hello")                    // 打印一个值到终端
  fmt.Println("Hello")                  // 打印一个值并换行
  fmt.Println("Hello\nWorld", 1, 3.14)  // 可以打印任意个值
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

### 数组

- 创建数组的示例：
  ```go
  var array [10] int              // 创建一个指定长度的数组，不赋值
  ```
  ```go
  array := [10]int{0, 1, 2, 3, 4} // 创建一个指定长度的数组，并赋值部分元素
  ```
  ```go
  array := []int{0, 1, 2, 3, 4}   // 创建数组时省略长度，此时会根据赋值的元素数量确定数组长度
  ```
  - 数组中的元素必须属于同一数据类型。

- 访问数组的元素：
  ```go
  array[0] = 10   // 给指定位置的元素赋值
  array[0]        // 读取指定位置的元素
  len(inArr)      // 获取数组的长度
  ```
- 数组支持切片：
  ```go
  array := []int{0, 1, 2, 3, 4}
  array[0:3]      // 获取区间 [0, 3) 的切片，这里会返回一个数组 [0 1 2]
  array[0:0]      // 获取区间 [0, 0) 的切片，这里会返回一个数组 []
  ```
  - 切片的上标、下标可以缺省，默认值分别为 0、len(array) ，因此支持以下写法：
    ```go
    array[0:]     // 这里会返回一个数组 [0 1 2 3 4]
    array[:3]     // 这里会返回一个数组 [0 1 2]
    array[:]      // 这里会返回一个数组 [0 1 2 3 4]
    ```
  - 切片出错的几种情况：
    ```go
    array[-1:0]   // 上标、下标不能为负数，这里编译时会报错：invalid slice index -1 (index must be non-negative)
    array[1:0]    // 上标不能大于下标，这里编译时会报错：invalid slice index: 1 > 0
    array[0:6]    // 下标不能大于数组长度，这里运行时会报错：runtime error: slice bounds out of range [:6] with capacity 5
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
- 函数可以没有参数或接受多个参数。

## package

```go
import "fmt"
import "math"

import (
	"fmt"
	"time"
)

```


## 协程

Golang 提供了 Goroutines 机制，用于创建轻量级的协程。还提供了 Channels 机制，用于协程之间的通信。

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
