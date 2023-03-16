# Groovy

：一种基于 Java 的脚本语言。
- [官方文档](https://groovy-lang.org/documentation.html)
- 2007 年由 James Strachan 发布，后来交给 ASF 基金会管理。

## 语法特点

- 源代码编译成 Java 字节码之后由 JVM 运行。兼容大部分 Java 的语法。
- 脚本文件的扩展名为 .groovy 。
- 每个语句的末尾以换行符或分号 `;` 作为分隔符。
- 用 `//` 声明单行注释，用 `/*` 和 `*/` 声明多行注释。
- 支持定义函数，支持面向对象编程。

## 变量

- 变量名区分大小写。

### 静态类型

- 可用基本数据类型的关键字定义变量，属于静态类型。如下：
  ```groovy
  byte    x = 1
  char    x = 'A'
  short   x = 1
  int     x = 5
  long    x = 100L
  float   x = 3.14f
  double  x = 3.14
  boolean x = true

  int[]   x = [1, 2, 3]     // 数组，只能包含同种类型的元素
  ```

### 动态类型

- 可用关键字 `def` 定义 Object 类型的变量，也可以省略该关键字。
  - Object 类型的变量可以存储各种类型的值。
  - 例：
    ```groovy
    def a = 1
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

- 查询对象的类型：
  ```groovy
  a = 1
  a.getClass()
  ```

### 字符串

- 字符串的定界符可以是：
  ```groovy
  'xx'        // 单引号
  "xx"        // 双引号
  '''xx'''    // 三重单引号，支持字符串换行
  """xx"""    // 三重双引号，支持字符串换行
  ```

- 字符串的常见用法：
  ```groovy
  String x = 'Hello'  // 可省略 String 关键字
  x += ' World'       // 字符串之间可以用 + 或 .plus() 方法拼接
  x += 123            // 其它类型的值与字符串拼接时，会自动转换成字符串类型
  println x
  // 显示：Hello World123
  println x.length()  // 获取字符串的长度
  // 显示：14
  println x[0]        // 通过索引取值
  // 显示：H
  println x[0..3]     // 获取切片
  // 显示：Hell
  ```
  ```groovy
  println '_' + " Hello\t\n\r ".trim() + '_'  // .trim() 方法可去掉字符串开头、末尾的空白字符
  // 显示：_Hello_
  ```

- 字符串的定界符为双引号时，支持用 `$var` 或 `${expression}` 的格式，插入变量或表达式的值。
  ```groovy
  a = "Hello ${1+2}"
  println a
  // 显示：Hello 3
  b = "$a !"
  println b
  // 显示：Hello 3 !
  ```

- 字符串的类型转换：
  ```groovy
  x = '' + 12                   // 从其它类型转换成字符串类型
  println Integer.parseInt(x)   // 从字符串类型转换成 int 类型
  ```

- 关于正则表达式：
  ```groovy
  pattern = ~'\\w'                    // 用 ~ 将一个字符串声明为正则表达式
  matcher = pattern.matcher('Hello')  // 执行正则匹配（只需部分匹配）
  println matcher
  // 显示：java.util.regex.Matcher[pattern=\w region=0,5 lastmatch=]
  println matcher ? true : false      // matcher 对象可用于条件判断，如果部分匹配，则视作 true
  // 显示：true
  println matcher.size()              // 返回匹配的元组数
  // 显示：5
  println matcher[0..4]               // 根据索引获取元组
  // 显示：[H, e, l, l, o]
  println matcher.findAll()           // 返回匹配的所有元组
  // 显示：[H, e, l, l, o]
  println matcher.matches()           // 判断是否完全正则匹配
  // 显示：true
  ```
  ```groovy
  println 'Hello'.findAll('\\w')            // String.findAll() 用于找出所有正则匹配的元组
  // 显示：[H, e, l, l, o]
  println 'Hello'.replaceAll('He.*', 'Hi')  // 正则替换，返回替换之后的字符串
  // 显示：Hi
  println 'Hello'.matches('He')             // 判断是否完全正则匹配
  // 显示：false
  println 'Hello' =~ 'He'                   // =~ 运算符相当于 pattern.matcher()
  // 显示：java.util.regex.Matcher[pattern=He region=0,5 lastmatch=]
  println 'Hello' ==~ 'He.*'                // ==~ 运算符相当于 String.matches()
  // 显示：true
  println !('Hello' ==~ 'He.*')             // 否定整个表达式
  // 显示：false
  println 'Hello    World'.split('\\s+')    // 用正则表达式分割字符串，默认用连续的空字符分割
  // 显示：[Hello, World]
  ```
  - Groovy 的正则表达式中，转义符 `\` 本身也需要转义，因此转义字符 `\n` 要写作 `\\n` ，转义字符 `\\` 要写作 `\\\\` 。

### 列表

- 列表（array）可以同时包含多种数据类型的元素。
- 列表支持嵌套，从而可以创建多维列表。
- 例：
  ```groovy
  List a = [1, 2]       // 可省略关键字 List
  a << 'Hello'          // 追加元素
  println a
  // 显示：[1, 2, Hello]
  println a.size()      // 获取列表的长度
  // 显示：3
  println a[0]          // 通过索引取值
  // 显示：1
  println a[0..-1]      // 获取切片
  // 显示：[1, 2, Hello]
  println a.join(', ')  // 将列表元素拼接成字符串
  // 显示：1, 2, Hello
  println a.unique()    // 将列表元素去重之后返回
  // 显示：[1, 2, Hello]
  ```

### 字典

- 例：
  ```groovy
  def map = [a:1, b:'Hello', c:[1, 2]]  // 可省略关键字 def
  println map
  // 显示：[a:1, b:Hello, c:[1, 2]]
  println map['a']      // 通过索引取值
  // 显示：1
  println map.a         // 通过属性取值
  // 显示：1
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

### if

- 例：
  ```groovy
  if ( 1 > 2 ) {
      echo 'A'
  } else if ( 'Hello' == 'Hello' ) {
      echo 'B'
  } else {
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

### switch

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


### for

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
- 例：遍历字典
  ```groovy
  map = [a:1, b:'Hello']
  for ( i in map ) {
      println "${i.key}: ${i.value}"
  }
  ```

### while

- 例：
  ```groovy
  x = 0
  while(x <= 3) {
      println x
      x++
  }
  ```

## 函数

- 内置函数：
  ```groovy
  print(x)      // 打印一个值
  println(x)    // 打印一个值并换行
  ```
- 调用函数时，可以省略最外层的括号。如下：
  ```groovy
  println("Hello")
  println "Hello"
  ```

- 可用关键字 `def` 定义函数：
  ```groovy
  def fun1(a, b = 0) {
      return a+b
  }

  println fun1(2)
  ```
  - 可以给函数形参设置默认值。
  - 如果函数中没有 return 语句，则最后一个执行的表达式的值会被用作 return 返回值。如下：
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
  ```

- 可用关键字 `assert` 声明断言。如果表达式结果为 false ，则抛出异常。例：
  ```groovy
  assert 1 > 3
  assert 1 in [1, 2, 3]
  ```
