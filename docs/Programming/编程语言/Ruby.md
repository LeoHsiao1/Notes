# Ruby

：一种脚本语言。
- 1995 年由日本的松本行弘发布，借鉴了 Lisp、Perl 等语言的特性。
- [官方文档](http://www.ruby-lang.org/zh_cn/documentation/)

## 语法特点

- 脚本文件的后缀名为 .rb 。
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

- 安装 Ruby 解释器：
  ```sh
  yum install ruby
  ```

- 进入交互式终端 irb ：
  ```ruby
  [root@Centos ~]# irb
  irb(main):001:0> puts "Hello"
  Hello
  => nil
  irb(main):002:0>
  ```

- 执行脚本文件：
  ```sh
  ruby test.rb
  ```

- 脚本文件的内容示例：
  ```ruby
  #!/usr/bin/ruby
  # -*- coding : utf-8 -*-

  print <<EOF         # 声明多行字符串
      Hello,
      world!
  EOF

  BEGIN {             # 在程序运行之前被执行的代码
  puts "初始化..."
  }

  END {               # 在程序运行结束时被执行的代码
  puts "结束..."
  }
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
