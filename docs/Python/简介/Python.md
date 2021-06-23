# Python

：一个流行的脚本语言。
- [官网](https://www.python.org/)
- 1989 年圣诞节期间，荷兰人 Guido van Rossum 在参与开发了 ABC 语言之后，开始开发一种更好的脚本语言，取名为 Python 。
  - 取名为 Python 是为了致敬英国的喜剧团体 Monty Python 。
  - Python 借鉴了 C、Shell 等语言的特性，比如标识符的命名规则、运算符。

## 语法特点

- 脚本文件的扩展名为 .py 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 # 声明单行注释。
- 将缩进作为语法的一部分，强制要求代码缩进，从而提高可读性。
- 支持定义函数，支持面对对象编程。
- 会自动回收垃圾内存。
- 代码与平台解耦，同一段 Python 代码可以被不同平台的 Python 解释器执行。

## 程序示例

编写一个脚本文件 test.py ：
```py
#!/usr/bin/python
# -*- coding : utf-8 -*-

x = 1                       # 创建一个变量，名为 x ，赋值为 1
x = "Hello World!"          # 给变量 x 赋值一个字符串
print(x)                    # 将一个值打印到终端

def test_print(x, y):       # 定义一个函数
    print(x, y)

test_print(3.14, "Hello")   # 调用函数
```
- 第一行的 `#!/usr/bin/python` 是可选的，用于在类 Unix 系统上执行该脚本时，自动找到解释器。
- 第二行的 `# -*- coding: utf-8 -*-` 是可选的，用于声明该脚本的编码格式。
  - Python2 的脚本才需要加入该声明，Python3 默认按 utf-8 编码读取脚本文件。
