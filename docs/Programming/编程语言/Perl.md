# Perl

：实用报表提取语言（Practical Extraction and Report Language），一种脚本语言。
- [官方文档](https://www.perl.org/docs.html)
- 1987 年由加州大学伯克利分校的 Larry Wall 发布，借鉴了 C、shell、awk 等语言的特性。
- 内置了正则表达式，因此适用于文本处理。最初只有这一种用途，后来扩展成为通用的编程语言，可用于 Web 开发、GUI 编程。

## 语法特点

- 脚本文件的扩展名为 .pl 。
- 每个语句的末尾以分号 ; 作为分隔符。
- 用 # 声明单行注释。
- 支持定义函数，支持面向对象编程。
- 字符串可以用双引号包住，也可以用单引号包住（此时不能转义字符、取变量的值）。

## 解释器

- 一般的 Linux 发行版已经安装了 Perl 解释器。也可以手动安装解释器：
  ```sh
  yum install perl
  ```

- 用解释器执行一条命令：
  ```sh
  [root@CentOS ~]# perl -e 'print "Hello World\n"'
  Hello World
  ```

- 执行脚本文件：
  ```sh
  [root@CentOS ~]# perl test.pl 
  a = 10
  a = $a\n
  ```

- 脚本文件示例：
  ```perl
  #!/usr/bin/perl
  
  $a = 10;
  print "a = $a\n";
  print 'a = $a\n';
  ```
