# Ruby

：一种脚本语言。
- [官方文档](http://www.ruby-lang.org/zh_cn/documentation/)
- 1995 年由日本的松本行弘发布，借鉴了 Lisp、Perl 等语言的特性。

## 语法特点

- 脚本文件的扩展名为 .rb 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 # 声明单行注释。
- 支持定义函数，支持面对对象编程。
- Ruby 代码可以通过标签 `<ruby>` 和 `</ruby>` 嵌入到 HTML 文件中。如下：
  ```html
  <ruby>
  汉 <rp>(</rp><rt>Han</rt><rp>)</rp>   <!-- 用标签<rp>加上拼音 -->
  字 <rp>(</rp><rt>zi</rt><rp>)</rp>
  </ruby>
  ```

## 解释器

- 流行的 Ruby 解释器：
  - Ruby MRI ：又称为 CRuby ，采用 C 语言开发。
  - JRuby ：将 Ruby 代码解释成 Java 字节码，在 JVM 上运行。
  - YARV ：又称为 Ruby VM ，将 Ruby 代码解释成 YARV 指令，在 Ruby 虚拟机上执行。
  - Rubinius

- 安装 CRuby 解释器：
  ```sh
  yum install ruby
  ```

- 进入交互式终端 irb ：
  ```ruby
  [root@CentOS ~]# irb
  irb(main):001:0> puts "Hello"
  Hello
  => nil
  irb(main):002:0>
  ```

- 执行脚本文件：
  ```sh
  ruby test.rb
  ```

- 脚本文件示例：
  ```ruby
  #!/usr/bin/ruby
  # -*- coding : utf-8 -*-

  print "Hello", "World"    # 打印任意个值到终端，每个值之间没有分隔符，挨在一起
  puts  "Hello", "World"    # 打印任意个值到终端，每个值之间加上换行符作为分隔符

  BEGIN {                   # 在程序运行之前被执行的代码
  puts "初始化..."
  }

  END {                     # 在程序运行结束时被执行的代码
  puts "结束..."
  }
  ```

## 变量

- 根据变量名的开头字符划分变量的类型：
  - 普通变量（Variable）：以小写字母或下划线开头。
  - 常量（Constant）：以大写字母开头。不能在方法内定义。
  - 全局变量（Global Variable）：以 `$` 开头。
  - 实例变量（Instance Variable）：以 `@` 开头。
  - 类变量（Class Variable）：以 `@@` 开头。
- 例：
  ```ruby
  x = 0
  puts x
  ```
  ```ruby
  $global_variable = 10
  puts $global_variable
  ```
  - 如果引用的变量不存在，则会报错：`undefined variable`
- 变量在创建之后，初始值为 nil 。

## 数据类型

### 整型

- 例：
  ```ruby
  123
  -123    # 可以为负
  0xff    # 十六进制
  ```

### 浮点型

- 例：
  ```ruby
  3.14
  -3.14
  1.0e6    # 科学计数法
  ```

### 字符串

- 字符串的定界符可以是单引号或双引号。
  - 采用双引号时，包含的转义字符才会生效。如下：
    ```ruby
    puts 'Hello\n World'
    puts "Hello\n World"
    ```
  - 采用双引号时，可以通过 `#expression` 或 `#{expression}` 的格式插入一个表达式的值。如下：
    ```ruby
    x = 1
    puts "#{x+1}"
    ```
    ```ruby
    $y = 2
    puts "#$y"
    ```
- 可以声明多行字符串：
  ```ruby
  puts <<EOF
  Hello,
  world!
  EOF
  ```

### 数组

- 数组包含一组任意类型的元素。
- 例：
  ```ruby
  array = ["Hello", 1, 3.14, [0, 1]]
  array.each do |i|             # 遍历数组
      puts i
  end
  ```
  ```ruby
  array = Array.new             # 创建一个数组对象
  array = Array[1, 2, 3, 4]     # 创建一个数组对象并初始化
  puts array[0]                 # 获取数组中的元素
  puts array.size               # 获取数组的大小，即包含多少个元素
  ```

### Hash 字典

- Hash 字典包含一组键值对。
  - 键为字符串类型，值为任意类型。
  - 键与值之间通过 `=>` 连接。
  - 键值对之间通过逗号 `,` 分隔。
- 例：
  ```ruby
  hash = { "A" => 1, "B" => "Hello"}
  hash.each do |key, value|           # 遍历 Hash
      print key, '=', value, "\n"
  end
  ```
  ```ruby
  hash = Hash.new                     # 创建一个 Hash 对象
  hash = Hash["A" => 1, "B" => 2]     # 创建一个 Hash 对象并初始化
  hash['B'] = "Hello"
  puts hash['B']
  ```

## 函数

- 定义函数：
  ```ruby
  def fun1(x=0, y='Hello')
  　  puts x,y
  end
  ```

- 调用函数：
  ```ruby
  fun1
  fun1(1)
  fun1 1, 'Hi'
  ```

## 类

- 例：
  ```ruby
  class Class1
      @@id=0

      def initialize(x, y)    # 构造方法，可以不定义
          @x=x
          @y=y
      end

      def fun1
          puts "#@x , #@y"
          puts "#@@id"
      end

  end

  c1 = Class1.new(1, 2)
  c1.fun1
  ```

## 相关概念

- Ruby on Rails ：简称为 Rails ，一个采用 Ruby 开发的 Web 应用开发框架，采用 MVC 设计模式。
