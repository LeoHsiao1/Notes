# Lisp

：一种古老的编译型语言。
- 虽然古老，但是诞生之后有多次改进，扩展了许多现代编程语言的功能。
- 存在多种方言：
  - Scheme ：于 1975 年发布。
  - [Common Lisp](https://lisp-lang.org/learn/) ：于 1984  年发布，本文介绍其语法。
  - Racket ：于 1995 年发布。
  - Clojure ：于 2007 年发布。源代码编译成 Java 字节码之后由 JVM 运行。

## 相关历史

- 1936 年，剑桥大学的图灵设想出一种能自动计算的机器：在一条纸带上的每一格记下一个简单符号，一台机器像人脑一样依次读取每格的符号，根据符号执行某种操作。
  - 这种机器被称为图灵机，特点：
    - 一台图灵机可以执行任何算法。
    - 如果一个问题可以表示成算法形式，即可计算，则可以被图灵机解决。
  - 这设计了计算机的基本运行逻辑。
  - 如果一个编程语言能实现图灵机的基本功能，比如算术运算、逻辑运算、条件判断、循环，则称为图灵完备（Turing Completeness）。
- 1945 年，参与美国原子弹研制的冯·诺依曼起草了一份论述 EDVAC（Electronic Discrete Variable Automatic Computer）的报告。
  - 它将计算机设计成五个基本部分：运算器、控制器、存储器、输入设备、输出设备。
  - 它设计了计算机的基本架构，被人们沿用至今。
- 1950 年，图灵发表论文《计算机器与智能》，提出了图灵测试：如果一台机器让人不能分辨出它是机器，则可以判断该机器具备人工智能。
- 1954 年，IBM 公司的 John Backus 发明了 Fortran 语言。
  - 它是世界上第一种高级编程语言，主要用于公式计算。
- 1956 年，John McCarthy 在 Dartmouth 学院发起一场会议，与香农、Nathaniel Rochester、Marvin Minsky 等人在讨论中首次提出了人工智能的概念。
- 1958 年，John McCarthy 因为 Fortran 的功能不满足需求，发明了 Lisp 语言。
  - 它是第一种支持递归函数的高级编程语言。

## 语法特点

- 源文件的扩展名为 .lisp 或 .lsp 。
- 代码可以编译后执行，也可以通过解释器直接执行。
- 用分号 `;` 声明单行注释，用 `#|` 和 `|#` 声明多行注释。
- 标识符不区分大小写。
- 支持定义函数，支持面向对象编程。

## 括号表达式

- Lisp 程序的主要组成单位：
  - atom ：一个数字或标识符。
    - 如果代码中的一个字符串没有用双引号作为定界符，则被当做 atom 。如果它全由数字字符或小数点组成，则视作数字，否则视作变量名、函数名等标识符。如下：
      ```lisp
      3.14        ; 数字
      var1        ; 标识符
      Hello       ; 标识符
      "Hello"     ; 字符串
      ```
    - 特别地，字母 `t` 表示逻辑真，`nil` 表示逻辑假或空列表。
  - string ：字符串，用双引号作为定界符，支持用反斜杠 \ 转义字符。
  - list ：列表，是一个包含任意个 atom 或 list 的括号表达式。
    - 如下：
      ```lisp
      (0 1 2 3)
      (0 ( 1 2 ) 3 Hello)
      ( )
      ```

- Lisp 的每个语句都放在括号表达式中：
  ```lisp
  (write 6)                     ; 调用函数 write 打印一个值，前后要加上括号
  (write-line "Hello World")    ; 打印一个值并换行
  ```
  - 函数本身不需要括号就可以传入参数，即不需要 `( write(6) )` 。
  - 缺点是括号嵌套多层之后的可读性较差。

- Lisp 的括号表达式采用前缀表示法：将运算符写在操作数之前。
  ```lisp
  (write (+ 1 2 3))             ; 相当于 write(1 + 2 + 3)
  (write (* 3 (+ 1 2) ))        ; 相当于 write((1 + 2) * 3)
  ```

## 变量

- 定义全局变量：
  ```lisp
  (defvar x 3.14)
  (write x)
  ```
  - 变量的值只能是数字类型。

- 定义局部变量：
  ```lisp
  (setq x 3.14)
  (setq y x)
  (write y)
  ```

## 流程控制

- if 语句：
  ```lisp
  (setq x 3.14)
  (if (> x 3)
    (format t "~% x is large enough")       ; if 条件为真时，执行第一个代码块
    (format t "~% x is not big enough")     ; if 条件为假时，执行第二个代码块
  )
  ```

## 函数

- 定义函数：
  ```lisp
  (defun average (x y)
    (/ ( + x y) 2)
  )
  ```
  - 函数内最后一个执行的表达式的取值会作为函数的返回值。

- 调用函数：
  ```lisp
  (write(average 10 20))
  ```
