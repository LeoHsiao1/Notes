# Perl

：实用报表提取语言（Practical Extraction and Report Language）
- 1987 年由 Larry Wall 发布。
- 是高级语言、脚本语言、动态语言。
- 擅长文本处理（因为内置了正则表达式），后来扩展成为通用的编程语言，比如 Web 开发、系统管理、图形编程。

## 语法特点

- 脚本文件的后缀名为 .pl 。
- 每行语句要以分号 ; 结尾。
- 用 # 声明单行注释。
- 字符串可以用双引号包住，也可以用单引号包住（此时不能转义字符、取变量的值）。

## 解释器

一般的 Linux 发行版已经安装了 Perl 的解释器，位于`/usr/bin/perl`。

## 示例

- 在命令行中执行一条 Perl 命令：
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
