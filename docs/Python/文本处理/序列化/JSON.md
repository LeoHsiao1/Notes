# JSON

：JSON（JavaScript Object Notation），一种序列化数据的文本格式。
- JSON 原本是 JavaScript 的对象表示格式，后来发展成一种独立于语言、平台的文本格式，常用于在不同编程语言之间传递数据。

## 语法

- JavaScript 中可以用 // 声明单行注释，但 JSON 中不允许使用注释，否则会导致解析出错。
- JSON 中可以记录多个键值对（key-value）格式的字段，每个键值对之间用逗号分隔。
  - key 必须是字符串类型，用双引号包住，且同一作用域下不能重名。
  - key 与 value 之间用冒号 : 连接。
  - 例如，JSON 中的字段 `"name": "Hello"` 相当于 JavaScript 中的变量 `name = "Hello"`。
  - value 可以是以下数据类型：
    ```sh
    number    # 数值，取值为整数或浮点数
    boolean   # 布尔，取值为小写的 true 或 false
    string    # 字符串，用双引号作为定界符
    array     # 数组，用中括号包住，有序地存储多个键值对
    object    # 对象，用花括号包住，无序地存储多个键值对
    null      # 空，代表 value 不存在
    ```
- 为了方便阅读，JSON 文本通常采用 4 个空格作为行首缩进。
  - 字段之间可以插入任意个空字符，不影响语法。
- 例：
  ```json
  {
      "name": "Leo",
      "age": 12,
      "emails": [
          "test@qq.com",
          "test@gmail.com"
      ]
  }
  ```

## ♢ json

：Python 的标准库，用于生成、解析 JSON 格式的文本。

- 使用 json.dumps() 可将 Python 基本数据类型的对象转换成 JSON 中的数据类型。转换关系如下：
  ```sh
  int,  long, float —> number
  str,  unicode     —> string
  list, tuple       —> array
  dict  —> object
  True  —> true
  False —> false
  None  —> null
  ```
- 例：JSON 序列化
  ```py
  >>> import json
  >>> dic1 = {'a': 1, 'b': True}
  >>> json.dumps(dic1)
  '{"a": 1, "b": true}'
  >>> print(json.dumps(dic1, indent=4, sort_keys=True)) # 默认 indent=None ，在输出时不换行、不缩进。这里设置 4 个空格的缩进，并对 key 排序
  {
      "a": 1,
      "b": true
  }
  ```
  ```py
  >>> json.dumps(json)                        # 非基本数据类型的对象，在序列化时会报错
  TypeError: Object of type module is not JSON serializable
  >>> json.dumps('你好')                      # Unicode 字符会按 str.encode("unicode_escape") 编码
  '"\\u4f60\\u597d"'
  >>> json.dumps("你好", ensure_ascii=False)  # 默认为 ensure_ascii=True ，将输出的字符全部转换成 ASCII 码。这里采用 False
  '"你好"'
  ```

- 例：JSON 反序列化
  ```py
  >>> json.loads('true')
  True
  >>> json.loads('{"你好": 1}')
  {'你好': 1}
  ```
