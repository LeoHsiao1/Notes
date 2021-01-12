# Lua

：一种脚本语言，基于 ANSI C 实现。
- [官方文档](http://www.lua.org/manual/)
- 1993 年，由里约热内卢天主教大学的 Roberto Ierusalimschy 等人发明。
- 标准库很小，因此编写的脚本容易嵌入基于 C、C++、Java 等语言开发的其它程序，实现混合开发。

## 语法特点

- 脚本文件的扩展名为 .lua 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 `--` 声明单行注释，用 `--[[` 和 `--]]` 声明多行注释。
- 支持定义函数，支持面向对象编程。

## 解释器

- 安装 Lua 解释器：
  ```sh
  yum install lua
  ```

- 进入交互式终端 irb ：
  ```lua
  [root@Centos ~]# lua
  Lua 5.1.4  Copyright (C) 1994-2008 Lua.org, PUC-Rio
  > print("Hello")
  Hello
  > x = 1 + 2 % 3
  > print(x)
  3
  ```

- 执行脚本文件：
  ```sh
  lua test.lua
  ```

- 脚本文件的内容示例：
  ```lua
  x = 10

  if(x > 0)
  then
      print("true")
  else
      print("false")
  end
  ```

## 函数

- 定义函数：
  ```lua
  function max(x, y)
    if (x > y) then
        result = x;
    else
        result = y;
    end
    return result;
  end
  ```

- 调用函数：
  ```lua
  print("最大值为：", max(10,4))
  ```
