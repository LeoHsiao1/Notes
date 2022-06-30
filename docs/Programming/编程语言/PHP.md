# PHP

：超文本预处理器（Hypertext Preprocessor），一种脚本语言。
- [官方文档](https://www.php.net/manual/en/)
- 1994 年，加拿大的 Rasmus Lerdorf 为了维护个人网页而用 Perl 语言编写了一些程序，后来改进成一种新语言 PHP 。
- 常用于 Web 程序开发。

## 语法特点

- 脚本文件的扩展名为 .php 。
- 每个语句的末尾以分号 ; 作为分隔符。
- 用 // 声明单行注释，用 /* 和 */ 声明多行注释。
- 支持定义函数，支持面向对象编程。
- PHP 代码可以通过标签 `<?php` 和 `?>` 嵌入到 HTML 文件中，但此时要将文件扩展名改为 .php 。如下：
  ```php
  <!DOCTYPE html>
  <html>
  <body>

  <?php
  echo "Hello World!";
  ?>

  </body>
  </html>
  ```

## 解释器

- 版本：
  - PHP 5.6 ：于 2014 年发布。
  - PHP 6 ：被跳过。
  - PHP 7 ：于 2015 年底发布，优化了很多性能。
  - PHP 8 ：于 2020 年底发布。

- 安装 PHP 解释器：
  ```sh
  yum install epel-release
  yum install http://rpms.remirepo.net/enterprise/remi-release-7.rpm
  yum install php72
  ```

## 输入输出

- 可以用关键字 echo 显示字符串，如下：
  ```php
  echo $x,"\nhello";
  echo PHP_EOL;        // 显示换行符
  ```
  - 也可以换成关键字 print ，但它同时只能显示一个字符串。
- 可以用函数 `print_r()` 或 `var_dump()` 按适当的排版显示变量的值，并且 `var_dump()` 还会显示变量的类型、长度。

## 变量

- 变量的命名规范与 C 语言相同，但是变量名要加上 $ 前缀。
- 变量会在第一次赋值时被自动创建，不需要声明变量的类型，因此 PHP 是一种弱类型语言。如下：
  ```php
  $x = 1;
  echo $x;
  ```

### 变量的作用域

- 局部变量：在函数之内创建，只能在函数之内访问。
  - 局部变量在函数执行完成之后会被自动销毁，也可以用关键字 static 声明为静态变量，避免被销毁。
- 全局变量：在函数之外创建，可以从脚本的任意位置访问，但是在函数之内访问时要用 global 关键字声明，或者通过超全局变量 $GLOBALS[] 访问。
  - 例：
    ```php
    $x = 1;
    function fun1()
    {
        global $x;
        echo $x;
        echo $GLOBALS["x"];
    }
    ```

### 超全局变量

：一些关联数组，由 PHP 解释器提供，不需要声明就可以在所有 PHP 脚本中使用。
- `$GLOBALS` ：存储了所有全局变量。
- `$_SERVER` ：存储了一些服务器的信息。
  - 执行 `print_r($_SERVER);` 即可查看其具体内容，如下：
    ```php
    $_SERVER["SERVER_ADDR"] = 127.0.0.1   // 服务器的 IP 地址
    $_SERVER["SERVER_PORT"] = 80          // 服务器的端口号
    $_SERVER["REMOTE_ADDR"] = 127.0.0.1   // 客户端的 IP 地址
    $_SERVER["REMOTE_PORT"] = 51362       // 客户端的端口号
    $_SERVER["REQUEST_METHOD"] = "GET"    // 客户端的请求方法
    $_SERVER["REQUEST_URI"] = "/index.php?id=1&page=2"   // 客户端请求的 URI（域名之后的部分）
    $_SERVER["QUERY_STRING"] = "id=1&page=2"             // 客户端请求的 query string
    $_SERVER["SCRIPT_FILENAME"] => "/php/WWW/index.php"  // 该脚本在主机上的绝对路径
    $_SERVER["SCRIPT_NAME"] = "/index.php"               // 该脚本在网站中的相对路径
    ```
- `$_REQUEST` ：存储了 HTTP 请求的表单数据。如下：
    ```php
    echo $_REQUEST["username"];
    ```
- `$_POST` ：存储了 HTTP 请求的表单数据。如下：
    ```php
    echo $_POST["username"];
    ```
- `$_GET` ：存储了 HTTP 请求的 query string 中的参数。如下：
    ```php
    echo $_REQUEST["kw"];
    ```
- `$_COOKIE`
- `$_SESSION`
- `$_ENV` ：存储了 PHP 脚本的所有环境变量。
- `$_FILES` ：存储了 Web 客户端上传的文件。

## 数据类型

- null ：空值。
- int
- float
- bool ：布尔型，取值为 true 或 false 。
- string
  - 用单引号 ' 或双引号 " 作为定界符。
  - 用 `<<<EOF` 和 `EOF;` 作为定界符时，会使字符串中的转义字符无效，但可以直接嵌入 PHP 的变量。如下：
    ```php
    str1 = <<<EOF
        <h1>标题一</h1>
        <p>x 的值是：$x</p>
    EOF;
    echo strlen($str1);    // 获取字符串的长度
    ```
  - 标识符的值不一定要是 EOL ，只需保证开始标识符与结束标识符相同。

- array ：数组。用 array() 函数定义，支持嵌套。
  - 数值数组：访问时使用数字作为下标，像 C 语言的普通数组。如下：
    ```php
    $text = array("hello","world","!");
    $text[0] = "hi";
    echo count($text);  // 获取数组的长度
    sort($text);        // 升序排列
    rsort($text);       // 降序排列
    ```
  - 关联数组：访问时使用键名作为下标，像 Python 的字典。每个键值对用 => 连接。
    ```php
    $text = array("line1" => "hello", "line2" => "world","line3"=>"!");
    $text["line1"] = "hi";
    ksort($text);       // 根据键名升序排列
    krsort($text);      // 根据键名降序排列
    ```
- 常量：用 define() 函数定义，常量名不需要加 $ 前缀。如下：
  ```php
  define("URL", "www.baidu.com");
  echo URL;
  ```
  - 常量的值不能修改。
  - 常量都是全局变量，而且可以在函数内直接访问，不需要用 global 关键字。

## 运算符

- 支持 C 语言的算术运算符、赋值符号、自加和自减、比较运算符、逻辑运算符。
- 例：判断两个变量相同
  ```php
  $a == $b    // 两个变量的值相同
  $a === $b   // 两个变量的类型和值都相同（完全相同）
  ```
  - 0 与 "0"、0 与 "" 的值相同、类型不同。
  - "0" 与 "" 的值不同（完全不同）。
  - 0 与 ""、false、null 的值相同、类型不同。
  - false 与 "false" 、null 与 "null" 完全不同。

## 流程控制

- 支持 C 语言的 if-else、switch、for、while、do-while 语句。

## 函数

- 用关键字 function 定义函数：
  ```php
  function fun1($x)
  {
      echo $x;
  }
  fun1("hello");
  ```

## 相关概念

- 基于 PHP 运行 Web 网站时，常见的几种运行环境：
  - LAMP ：Linux + Apache + MySql + PHP
  - LNMP ：Linux + Nginx + MySql + PHP
  - WAMP ：Windows + Apache + MySql + PHP
  - WNMP ：Windows + Nginx + MySql + PHP
  - WampServer ：一款 WAMP 软件。
  - phpStudy ：一款兼容 WAMP 和 WNMP 的软件。

- php-fpm
  - ：PHP 的一个进程管理（FastCGI Process Manage ，FPM）工具，用于将一个提供 FastCGI 服务的 PHP 进程运行多个实例，并进行管理。
  - 单个 PHP 进程的配置文件默认位于 `/etc/php.ini` 和 `/etc/php.d/*.ini` 。
  - php-fpm 的配置文件默认位于 `/etc/php-fpm.conf` 和 `/etc/php-fpm.d/*.conf` 。
