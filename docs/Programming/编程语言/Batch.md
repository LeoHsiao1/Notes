# Batch

：一种脚本语言，中文名为 “批处理” 。
- 它主要用于微软的磁盘操作系统（Mircro Software Disk Operating System ，MS-DOS），用 cmd.exe 解释执行。
- 与 shell 语言相比，功能很少，也不灵活。

## 语法特点

- 在行首用 :: 声明单行注释。
- 命令的一般格式为：
  ```batch
  命令名 [选项] [参数]
  ```
  - 命令名和选项不区分大小写。
  - 选项以 / 开头，比如：`dir /?` 。
  - 如果参数中包含空格，需要用双引号作为定界符包住。比如：`dir "C:/Program Files"`
  - 如果参数中包含双引号，需要写作两个双引号进行转义。比如：`echo "Hello ""World"" "`
  - 参数中可以使用通配符，`*` 表示匹配任意个字符，`?` 表示匹配一个字符或空格。

## 变量

### 定义变量

```batch
D:\>set x=Hello       :: 用 set 定义变量

D:\>echo %x%          :: 用百分号作为变量的定界符，进行取值
Hello

D:\>echo %y%          :: 如果变量不存在，则取值符号不会生效
%y%
```

### 字符串

```batch
D:\>echo %x:~0,1%     :: 获取字符串的切片
H

D:\>echo %x:~0,-1%    :: 切片的索引可以是负数
Hell

D:\>echo %x%World     :: 字符串合并
HelloWorld

D:\>echo %x:He=he%    :: 字符串替换
hello
```

### 内置变量

关于时间：
```batch
D:\>echo %date%       :: 当前日期
2020/12/21 周一

D:\>echo %time%       :: 当前时刻
20:36:38.00
```

关于目录：
```batch
D:\>echo %cd%         :: 当前目录
D:\

D:\>echo %PATH%       :: 寻找可执行文件的目录
C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;...

D:\>echo %HOMEPATH%   :: 用户的家目录
\Users\Leo

D:\>echo %APPDATA%    :: 存储应用数据的默认目录
C:\Users\Leo\AppData\Roaming

D:\>echo %TEMP%       :: 临时存储应用数据的目录
C:\Users\Leo\AppData\Local\Temp
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
dir                   :: 显示当前目录下的所有文件
dir D:\1\             :: 显示指定目录下的所有文件

copy D:\1\* D:\       :: 拷贝文件（目标目录必须存在）
move D:\1\* D:\       :: 移动文件（目标目录必须存在）
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
