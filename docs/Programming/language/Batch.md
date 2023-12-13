# Batch

：一种脚本语言，中文名为 "批处理" 。
- 主要用于微软的磁盘操作系统（Mircro Software Disk Operating System ，MS-DOS），用 cmd.exe 解释执行。
- 与 shell 语言相比，功能很少，也不灵活，且语法差异很大。

## 语法特点

- 脚本文件的扩展名为 .bat 或 .cmd 。
- 每个语句的末尾以换行符或与运算符 `&` 作为分隔符。
- 用 `::` 声明单行注释，且必须在行首声明。
- 支持定义函数，不支持面向对象编程。
- 命令的一般格式为：
  ```batch
  命令名 [选项] [参数]
  ```
  - 命令名和选项不区分大小写。
  - 选项以正斜杠 / 开头，比如：`dir /?` 。
  - 如果参数中包含空格，则可能会被忽略，建议用双引号作为定界符包住。例如：`dir "C:/Program Files"`
  - 如果参数中包含双引号，需要写作两个双引号进行转义。例如：`echo "Hello ""World"" "`
  - 参数中可以使用通配符，`*` 表示匹配任意个字符，`?` 表示匹配一个字符或空格。
- 在每行末尾加上 `^` ，即可在输入一条命令时换行：
  ```batch
  D:\>echo 1 ^
  More? 2 ^           :: 换行输入时，行首会显示 More? 作为提示词
  More? 3
  1 2 3
  ```

## 变量

### echo 命令

```batch
D:\>echo %x%          :: 用百分号作为变量的定界符，进行取值
1

D:\>echo %y%          :: 如果变量不存在，则取值符号不会生效
%y%
```

### set 命令

```batch
D:\>set               :: 查询所有环境变量
ALLUSERSPROFILE=C:\ProgramData
APPDATA=C:\Users\Leo\AppData\Roaming
CommonProgramFiles=C:\Program Files\Common Files
...

D:\>set x             :: 查询以 x 开头的所有环境变量
x=1

D:\>set x=1           :: 定义变量

D:\>set x=            :: 给变量赋值为空，会删除该变量

D:\>set x
环境变量 x 没有定义
```

- 使用 set 给变量赋值时，会将等号 = 之后的所有字符都视作值。如下：
  ```batch
  D:\>set A=Hello World       :: test

  D:\>echo __%A%__
  __Hello World    :: test__  :: 赋值的字符串包括了尾部的空字符、注释。可以用 set A=%A: =% 过滤空格
  ```

- 使用 /a 选项时，会将赋值表达式当做算术表达式处理，并在赋值的同时打印出算术值。
  ```batch
  D:\>set /a x=1*2%3
  2

  D:\>set /a x = 1 * 2 % 3 + 4    :: 赋值表达式可以包含任意个空格，会被忽略
  6

  D:\>set /a x=Hello              :: 如果赋值表达式为字符串，则算术值为 0
  0

  D:\>echo %x%
  0
  ```

- 使用 /p 选项时，会以交互模式赋值，先显示一行提示词，再将用户输入的内容赋值给变量。
  ```batch
  D:\>set /p x=请输入变量的值：
  请输入变量的值：
  ```

- batch 不支持管道符，因此想将某个命令的输出赋值给一个变量时，需要先保存到一个文件中。如下：
  ```batch
  dir > tmp.out
  set /p A=<tmp.out
  echo %A%
  del tmp
  ```

### 字符串

```batch
D:\>set x=Hello

D:\>echo %x:~0,1%     :: 获取字符串的切片
H

D:\>echo %x:~0,-1%    :: 切片的索引可以是负数
Hell

D:\>echo %x%World     :: 字符串合并
HelloWorld

D:\>echo %x:He=he%    :: 字符串替换
hello
```

### 系统环境变量

CMD 终端可使用一些系统内置的环境变量。比如关于时间：
```batch
D:\>echo %date%       :: 当前日期
2020/12/21 周一

D:\>echo %time%       :: 当前时刻
20:36:38.00
```

关于随机数：
```batch
D:\>echo %random%                 :: 返回一个随机数，取值为 0~32767
19181

D:\>set /a a=%RANDOM% % 100 + 1   :: 返回一个随机数，取值为 1~100
77
```

关于目录：
```batch
D:\>echo %CD%         :: 当前目录
D:\

D:\>echo %PATH%       :: 寻找可执行文件的目录
C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;...

D:\>echo %USERNAME%   :: 用户名
Leo

D:\>echo %HOMEPATH%   :: 用户的家目录
\Users\Leo

D:\>echo %APPDATA%    :: 存储应用数据的默认目录
C:\Users\Leo\AppData\Roaming

D:\>echo %TEMP%       :: 临时存储应用数据的目录
C:\Users\Leo\AppData\Local\Temp
```

## 函数

- 只能在 Batch 脚本中定义函数、调用函数，不能在 DOS 终端直接使用函数。否则会报错：
  ```batch
  D:\>CALL :Fun1
  从批脚本外面调用批处理标签的操作无效。
  ```
- 函数名的命名格式为 `:Name` 。
- 例：
  ```batch
  setlocal                  :: 备份当前的环境变量，当遇到 endlocal 命令或脚本结束时，将环境变量还原成备份的状态。常用于隔离局部变量
  call :Fun1  A  B          :: 用 call 命令调用函数，函数实参之间可以用逗号或空格分隔

  exit /B %ERRORLEVEL%      :: 用于分隔主程序与函数定义

  :Fun1                               :: 定义函数，函数头不必声明形参列表
  echo The first  parameter is %~1    :: 通过 %~n 的方式读取第 n 个函数参数，如果该参数不存在则取值为空
  echo The second parameter is %~2
  pause
  exit /B 0                           :: 函数的返回值
  ```

## 常用命令

### 终端

```batch
D:\>echo Hello        :: 显示一个字符串
Hello

D:\>echo Hello    !   :: 空格也会被视作字符串的一部分，一起打印
Hello    !
```

```batch
echo Hello > null     :: 重定向 stdout
echo Hello >> f1 2>&1
```

```batch
cls                   :: 清空终端
pause                 :: 阻塞终端，直到用户按下任意按键

dir | findstr .py     :: 通过管道符传递输出，并用 findstr 命令筛选

where curl            :: 查询命令对应的可执行文件的绝对路径
type 1.py             :: 显示文件的内容

help                  :: 显示帮助信息
```

### 文件

```batch
dir [path]            :: 显示指定目录（默认是当前目录）下的所有文件
    /a                :: 显示所有类型的文件， 包括隐藏文件
    /s                :: 递归显示所有子目录中的文件

copy D:\1\*  D:\      :: 拷贝文件（目标目录必须存在）
move D:\1\*  D:\      :: 移动文件（目标目录必须存在）
rename 1 2            :: 修改文件名或目录名
del D:\1\*            :: 删除文件（不能删除目录）
```

### 目录

```batch
D:                    :: 切换盘符
cd 1                  :: 切换到当前盘符下的其它目录
cd \                  :: 切换到当前盘符的根目录
cd                    :: 显示当前路径

mkdir D:\1\           :: 创建一个目录
rmdir D:\1\           :: 删除一个目录（必须是空目录）
    /s                :: 如果是非空目录的话也删除
    /q                :: 安静模式，删除时不需要确认
```

### 进程

```batch
tasklist              :: 显示当前的所有进程
taskkill /pid 66 /f   :: 杀死一个进程，其 pid 为 66 ，f 代表 force ，即强制杀死
```

## 相关概念

- 盘符：软盘出现后在计算机里的盘符是 A ，后来出现了容量更大的软盘，在计算机里的盘符是 B 。再然后进入硬盘的时代，使用盘符 C 。
  - Windows 系统默认安装在 C 盘，其根目录为 C:\ 。通常还划分多个盘符，比如 C 盘、D 盘、E 盘。
- 钩子（Hook）
  - ：用于监听某个进程或窗口的消息。
  - 在 Windows 上，一般进程、窗口的消息都会经过钩子平台中转，因此可以被监听或拦截。
- 句柄（Handler）
  - ：对象的唯一标识符。比如窗口的句柄、钩子的句柄。
  - 在 32 位系统中，它存储为一个 32 位的无符号整型。
- PowerShell
  - ：微软于 2006 年推出的新一代脚本语言、shell 程序，基于 .NET Framework 运行，能实现强大、丰富的功能。
- NuGet
  - ：.NET 平台的代码包管理工具。
  - .NET 代码包的扩展名为 .nupkg ，默认仓库为 nuget.org 。
