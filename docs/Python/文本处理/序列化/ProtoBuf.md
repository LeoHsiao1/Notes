# ProtoBuf

：Protocol Buffer ，一种序列化数据的二进制格式。
- [官方文档](https://developers.google.com/protocol-buffers/docs/proto3)
- 2008 年，由 Google 公司发布。
- 与 JSON 相比， ProtoBuf 格式不能供人阅读，但被机器解析的速度更快、存储体积更小，提高了在不同程序之间传递数据的效率。
- 与 pickle 相比， ProtoBuf 格式独立于语言、平台，是一种通用的二进制格式。

## 语法

- 用 `//` 声明单行注释，用 `/*`、`*/` 声明多行注释。
- 每条语句必须以分号 ; 结尾。
- 通常在后缀名为 .proto 的文件中定义 ProtoBuf 的消息模型（message）。
  - message 中可以包含多个字段，支持 bool、int32、string 等多种数据类型。
  - message 支持嵌套。
  - message 中每个字段需要定义一个大于 1 的编号，不能重复，用于在二进制格式中定位。
  - message 中每个字段需要在开头加上一种修饰符：
    - optional ：表示创建消息时，该字段是可选的，可以不赋值。此时采用系统的默认值，比如 int32 的默认值为 0 。
    - required ：表示该字段是必须赋值的。该修饰符在 proto2 不建议使用，在 proto3 不支持。
    - repeated ：表示该字段可以重复赋值，此时视为动态大小的数组。
- 语法版本主要有两个：
  - proto2
  - proto3
    - optional 修饰符改名为 singular ，并默认采用。
    - required 修饰符被弃用。

## 例

1. 下载 [protoc](https://github.com/protocolbuffers/protobuf/releases) ，然后安装：
    ```sh
    yum install -y gcc-g++
    ./configure
    make install
    ```
    - protoc 是用 C++ 开发的命令行工具，用于编译 .proto 文件，生成各种编程语言的源文件。

2. 编写一个 .proto 文件，定义消息模型：
    ```go
    syntax = "proto3";          // 声明语法版本
    package test;               // 声明当前文件属于一个名为 test 的包
    // import "test2.proto";    // 可通过 import 导入其它包

    message Person{
        string name = 1;
        int32 age = 2;
        message Email{
            string address = 1;
        }
        repeated Email emails = 3;
    }
    ```

3. 用 protoc 将 .proto 文件编译成 py 文件：
    ```sh
    [root@CentOS ~]# protoc test.proto --python_out=.     # 还可用 -I <PATH> 指定目录用于寻找 import 的包
    [root@CentOS ~]# ls
    test_pb2.py  test.proto
    ```

4. 在 Python 解释器中调用：
    ```py
    >>> import test_pb2
    >>> p = test_pb2.Person()
    >>> p.name = 'Leo'
    >>> p.age = 12
    >>> p                       # 显示方便阅读的文本格式。 emails 字段此时取值为空，因此不显示
    name: "Leo"
    age: 12

    >>> p.SerializeToString()   # 序列化成二进制格式
    b'\n\x03Leo\x10\x0c'
    >>> p2 = test_pb2.Person()
    >>> p2.ParseFromString(p.SerializeToString())   # 反序列化，赋值给另一个消息
    ```
    ```py
    >>> p.name = 1              # 赋值错误的数据类型时会报错
    TypeError: Cannot set test.Person.name to 1: 1 has type <class 'int'>, but expected one of: (<class 'bytes'>, <class 'str'>)
    >>> p.phone = ''            # 赋值给未定义的字段时会报错
    AttributeError: 'Person' object has no attribute 'phone'
    ```
    ```py
    >>> p.emails                # repeated 类型字段保存为数组形式
    []
    >>> e = p.emails.add()      # 添加一个元素，返回其引用
    >>> e.address = 'test@qq.com'
    >>> p.emails
    [address: "test@qq.com"
    ]
    ```
    - 需要安装第三方库 `pip install protobuf` 。
