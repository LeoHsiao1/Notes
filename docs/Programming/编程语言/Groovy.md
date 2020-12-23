# Groovy

：一种脚本语言，基于 Java 实现。
- [官网](https://groovy-lang.org/)
- 于 2007 年发布。

## 语法特点

- 兼容大部分 Java 的语法。
  - 在 JVM 上运行，可以转换成 Java 字节码。
- 脚本文件的后缀名为 .groovy 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 // 声明单行注释，用 /* 和 */ 声明多行注释。
- 支持定义函数，支持面向对象编程。

## 变量

- Groovy 既支持静态类型，也支持动态类型。
- 可以用基本数据类型的关键字定义变量。如下：
  ```groovy
  byte x = 1
  char x = 'A'
  short x = 1
  int x = 5
  long x = 100L
  float x = 3.14f
  double x = 3.14
  boolean x = true

  int[] x = [1, 2, 3]     // 数组，只能包含同种类型的元素
  ```

- 可以用 `def` 关键字定义 Object 类型的变量，甚至可以省略该关键字。
  - Object 类型的变量可以存储各种类型的值。
  - 例：
    ```groovy
    a = 1
    b = 'Hello'
    println a + b
    // 显示：1Hello
    ```

- 用关键字或类名的方式定义变量时，不能定义重名的变量。如下：
  ```groovy
  int a = 1
  def a = 2
  // 运行时会报错：The current scope already contains a variable of the name a
  ```

### 字符串

- 例：
  ```groovy
  String x = 'Hello'
  x += ' World'       // 字符串可以直接拼接，甚至
  x += 123
  println x
  // 显示：Hello World123
  println x.length()  // 获取字符串的长度
  // 显示：14
  println x[0]        // 通过索引取值
  // 显示：H
  println x[0..3]     // 获取切片
  // 显示：Hell
  ```

- 可以进行正则匹配：
  ```groovy
  println x.matches('He')
  // 显示：false
  println x.matches('He.*')
  // 显示：true
  ```

### 列表

- 列表可以包含多种类型的元素。
- 列表支持嵌套，从而可以创建多维列表。
- 例：
  ```groovy
  List x = [1, 2]
  x << 'Hello'        // 追加元素
  println x
  // 显示：[1, 2, Hello]
  println x.size()    // 获取列表的长度
  // 显示：3
  println x[0]        // 通过索引取值
  // 显示：1
  println x[0..-1]    // 获取切片
  // 显示：[1, 2, Hello]
  ```

### 字典

- 例：
  ```groovy
  def x = [red: '#FF0000', green: '#00FF00']
  println x
  // 显示：[red:#FF0000, green:#00FF00]
  println x['red']    // 通过索引取值
  // 显示：#FF0000
  println x.red       // 通过属性取值
  // 显示：#FF0000
  ```

## 运算符

- Groovy 支持 C 语言的运算符，还支持一些扩展的运算符。
- 比较两个值：
  ```groovy
  a = 123456
  b = 123456
  println a == b    // 判断两者的值是否相等
  // 显示：true
  println a.is(b)   // 判断两者是否为同一个对象
  // 显示：false
  ```

## 流程控制

### if 语句

- 例：
  ```groovy
  if ( 1 > 2 ) {
      echo 'A'
  } else if ( 'Hello' == 'Hello' ) {
      echo 'B'
  }  else {
      echo 'C'
  }
  ```

- 所有表达式的值都可以转换成布尔值。如下：
  ```groovy
  x = 1 ? true : false        // x = true
  x = 0 ? true : false        // x = false
  x = null ? true : false     // x = false
  x = '' ? true : false       // x = false
  ```
  ```groovy
  x = ''
  if(x) {
      println true
  }
  ```

### switch 语句

- 例：
  ```groovy
  x = 1
  switch(x) {
      case 'Hello':
          println 'A'
          break;
      case [1, 2, 'Hi']:
          println 'B'
          break;
      default:
          println 'C'
          break;
  }
  ```


### for 语句

- 例：循环
  ```groovy
  for(i = 0; i <= 3; i++) {
      println i
  }
  ```

- 例：遍历数组
  ```groovy
  for(i in [0, 1, 2, 3]) {
      println i
  }
  ```

### while 语句

- 例：
  ```groovy
  x = 0
  while(x <= 3) {
      println x
      x++
  }
  ```

## 函数

- 用 `print()` 显示一个值，用 `println()` 显示一个值并换行。
- 调用函数时，可以省略最外层的括号。如下：
  ```groovy
  println("Hello")
  println "Hello"
  ```

- 用 `def` 关键字定义函数：
  ```groovy
  def fun1(a, b = 0) {
      return a+b
  }

  println fun1(2)
  ```
- 可以给函数形参设置默认值。
- 函数中最后一个执行的表达式的值会被用作 return 返回值。如下：
  ```groovy
  def fun1(x) {
      if(x == 1) {
          true
      } else {
          false
      }
  }

  println fun1(2)
  ```

## 类

- 类和方法的的可见性分为三种：
  - public ：默认
  - private
  - protected

- 例：
  ```groovy
  class Test {
  int x = 100

  int get_value() {
      return this.x
  }

  static void main(String[] args) {
      Test t = new Test()
      println t.get_value()
  }
  }
  ```

## 异常处理

- 例：
  ```groovy
  script {
      try {
          ...
      }catch (Exception e) {
          ...
      }catch(any){
          ...
      }
      finally {
          ...
      }
  }
  ```

- 可以用 `assert` 关键字定义断言。
  - 如果条件满足则无影响，如果条件不满足则抛出异常。
  - 例：
    ```groovy
    assert 1 > 3
    assert 1 in [1, 2, 3]
    ```
