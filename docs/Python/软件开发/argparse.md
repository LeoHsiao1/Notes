# import argparse

：Python 的标准库，用于解析 Python 脚本启动时的命令行参数。
- [官方文档](https://docs.python.org/3/library/argparse.html)

## 用途

- 使用 Python 解释器，可以直接启动 Python 脚本。如下：
  ```sh
  python test.py
  ```

- 有时，希望在启动 Python 脚本时，添加命令行参数，从而给 Python 脚本传入一些变量。
  - 例如编写以下脚本：
    ```py
    import sys
    print(sys.argv)   # 查看当前进程启动时，传入的命令行参数
    ```
    然后执行脚本：
    ```sh
    [root@CentOS ~]# python3 test.py
    ['test.py']                                 # sys.argv 中第一个参数，是当前脚本的文件名
    [root@CentOS ~]# python3 test.py --debug    # 输入一个名为 debug 的参数（argument），又称为选项（option）
    ['test.py', '--debug']
    [root@CentOS ~]# python3 test.py --debug 1  # 输入 debug 参数，并且赋值为 1
    ['test.py', '--debug', '1']
    ```
- 手动解析 `sys.argv` 比较麻烦，推荐使用 argparse 标准库。

## 示例

- 例：编写一个 test.py 脚本
  ```py
  import argparse

  parser = argparse.ArgumentParser(prog='test.py', description='This script is used for testing.')
      # prog 表示将该 Python 脚本视作一个程序，起个名字。默认值等于 sys.argv[0]
      # description 是当前脚本的说明文档，使用选项 --help/-h 时会显示它

  parser.add_argument('--debug', '-d', help='just for debug', action='store_true')
      # 这里添加了一个参数 --debug ，也可缩写为 -d
      # help 是该选项的说明文档，使用选项 --help/-h 时会显示它
      # action='store_true' 表示用户使用选项 --debug/-d 时，如果没有赋值，则将该选项赋值为 true

  parser.add_argument('--level', '-l', type=int, default=0, required=False)
      # type 是限制该参数的取值类型。如果类型不对，则报错
      # default 表示该参数的默认值
      # required 表示用户是否必须使用该参数。默认为 False

  args = parser.parse_args()  # 解析所有命令行参数，保存为 args 对象
  print(args.debug)           # 获取 debug 参数的值
  print(args.level)
  ```
  然后执行脚本：
  ```sh
  [root@CentOS ~]# python3 test.py -h
  usage: test.py [-h] [--debug] [--level LEVEL]

  This script is used for testing.

  optional arguments:
    -h, --help            show this help message and exit
    --debug, -t           just for debug
    --level LEVEL, -l LEVEL
  ```
  ```py
  [root@CentOS ~]#python3 test.py
  False
  0
  ```
  ```py
  [root@CentOS ~]# python3 test.py --debug --level 1
  True
  1
  ```
