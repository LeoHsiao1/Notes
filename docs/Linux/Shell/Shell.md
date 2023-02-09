# Shell

- 广义的 shell 泛指各种操作系统中的命令行解释器，它允许用户在 CLI 界面中输入命令并执行。
  - 它是位于用户与操作系统内核之间的壳程序，使得用户可以与操作系统内核进行交互。
- 狭义的 shell 是指类 Unix 操作系统中的命令行解释器。
  - 比如 sh、bash 等，它们的命令语法相似，是一种脚本语言，称为 shell 。
  - 用户登录 Linux 系统后，会启动一个 shell 解释器，作为一个进程运行，显示 CLI 界面供用户操作。
  - 用户可以在 shell 终端直接执行命令，也可以将多条 shell 命令保存为 shell 脚本（shell scrpts），然后交给 shell 解释器执行。
  - shell 解释器会将 shell 命令解释成可以被 Linux 内核执行的代码，然后传给内核去执行。

## 语法特点

- 脚本文件的扩展名为 .sh 。
- 每个语句的末尾以换行符或分号 ; 作为分隔符。
- 用 # 声明单行注释。
- 支持定义函数，不支持面向对象编程。
- shell 脚本的示例：
  ```sh
  #!/bin/bash

  if [ $# -ge 2 ];then
      echo "The input are:"$*
  else
      echo "The input should be at least 2 args."
      exit 1
  fi
  ```
  - 脚本的第一行可以用 #! 声明一个 shell 解释器的绝对路径（也可以不声明），这样使用 ./test.sh 的方式执行该脚本时，系统就会自动采用该 shell 解释器。

## 解释器

- 1971 年，Ken Thompson 在开发 Unix 系统时设计了一个命令行解释器，称为 sh 。
  - 当时它只支持在终端直接执行命令，不支持执行脚本。
- 后来，Unix 系统上出现了多种 shell 解释器。
  - 其中名为 bash 的 shell 解释器最流行，成为了大部分 Linux 发行版默认的 shell ，它兼容 sh 。
- 例：查看系统可用的所有 shell 解释器
  ```sh
  [root@CentOS ~]# cat /etc/shells
  /bin/sh
  /bin/bash
  /sbin/nologin
  /usr/bin/sh
  /usr/bin/bash
  ```
- 例：查看当前的 shell 解释器
  ```sh
  [root@CentOS ~]# sh   # 进入 sh 终端
  sh-4.2# echo $SHELL   # 查看用户的 login shell
  /bin/bash
  sh-4.2# echo $0       # 查看当前使用的 shell
  sh
  sh-4.2# e             # 输入一条不存在的命令，可以从报错信息中判断出当前使用的 shell
  sh: e: command not found
  ```
- shell 解释器在启动时，会检查其输入、输出是否指向终端，如果是，则进入交互模式（interactive）。
  - 比如让 shell 解释器从文件中读取输入，就是非交互模式。
  - 可以根据变量 PS1 是否存在，判断当前是否处于交互模式。

## 执行脚本

### 脚本路径

可以直接在终端输入 shell 脚本的文件路径，执行它：
```sh
[root@CentOS ~]# ./1.sh
-bash: ./1.sh: Permission denied
```
- 此时系统会自动选择一个 shell 解释器来执行它。
- 通常会因为没有该文件的可执行权限而报错，需要先执行： `chmod +x 1.sh`
- 执行 shell 脚本时可以输入参数，比如：`./1.sh arg1 arg2`

### bash

可以用指定的 shell 解释器执行 shell 脚本，例如 bash ：
```sh
$ bash
      [xx.sh]       # 创建一个子 shell 来执行 shell 脚本，执行完之后该子 shell 会自动退出
      -x            # 打印出执行的每条命令（每行开头会显示加号 + ）
      -n            # 不执行脚本，而是检查是否有语法错误
      -c <comman>   # 不执行脚本，而是执行一条命令
      -i            # 让 shell 解释器采用交互模式
      -l            # --login ，让 shell 解释器模拟 login shell
```

### source

```sh
$ source <xx.sh>      # 读取 shell 脚本的内容，放到当前 shell 中执行
```
- source 命令又称为点命令，可以用一个点表示，比如：`. 1.sh`

### exec

```sh
$ exec <command>...   # 执行一条命令
```
- 关于子进程：
  - 用 bash 等 shell 解释器执行脚本时，会先 fork 一个子 shell 进程来执行脚本，然后每执行一个命令就 fork 一个子进程，因此有两层子进程。
  - 用 source 执行脚本时，会在当前 shell 中执行脚本，每执行一个命令就 fork 一个子进程。
  - 用 exec 执行命令时，会用该命令进程替换当前 shell 进程，因此执行完命令就会退出当前终端。
