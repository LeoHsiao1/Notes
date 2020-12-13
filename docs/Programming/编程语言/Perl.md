# Perl

：实用报表提取语言（Practical Extraction and Report Language）
- [官网](https://www.perl.org/)
- 1987 年由加州大学伯克利分校的 Larry Wall 发布，借鉴了 C、shell、awk 等语言的特性。
- 功能特性：
  - 是高级语言、脚本语言、动态语言。
  - 内置了正则表达式，因此擅长文本处理。
  - 已扩展成为通用的编程语言，可用于 Web 开发、GUI 编程。

## 安装

- 一般的 Linux 发行版已经安装了 Perl 的解释器。
- 手动安装：
  ```sh
  yum install perl
  ```

## 语法特点

- 脚本文件的后缀名为 .pl 。
- 每行语句要以分号 ; 结尾。
- 用 # 声明单行注释。
- 字符串可以用双引号包住，也可以用单引号包住（此时不能转义字符、取变量的值）。

## 示例

- 用 Perl 解释器执行一条命令：
  ```sh
  [root@Centos ~]# perl -e 'print "Hello World\n"'
  Hello World
  ```

- Perl 脚本文件的内容示例：
  ```perl
  #!/usr/bin/perl
  
  $a = 10;
  print "a = $a\n";
  print 'a = $a\n';
  ```

- 执行 Perl 脚本文件的示例：
  ```sh
  [root@Centos ~]# perl test.pl 
  a = 10
  a = $a\n
  ```
