# YAML

：一种序列化数据的文本格式。与 JSON 类似，但更简单易读。
- 发音为 `/ˈjæməl/` 。

## 语法

- YAML 格式的文本文件的扩展名为 .yaml 或 .yml 。
- 区分大小写。
- 用 # 声明单行注释。
- 必须用缩进表示层级关系。
  - 每层缩进通常为 2 个空格，不支持 Tab 等空字符。
  - 缩进的空格数可以任意，但同一层级的空格数要相同。
- 可以在一个文件中保存多个 YAML 文档，每个文档用一行 --- 表示开头、用一行 ... 表示结尾。
  - 也可只在每个文档之间用一行 --- 分隔。
- 例：
  ```yml
  debug: true
  env: test
  server:             # value 为数组类型
    - 10.0.0.1
    - 10.0.0.2
  environment:        # value 为字典类型
    var1: 1
    var2: Hello
  ```

- YAML 中可以记录多个键值对（key-value）格式的字段。
  - key 必须是字符串类型，且同一作用域下不能重名。
  - key 与 value 之间用 `: ` 连接。
    - 注意冒号 : 右侧必须存在空格，否则冒号左右的内容会被看作一个字符串。
  - value 为字符串类型时，可以采用单引号、双引号作为定界符，也可以省略。
  - value 为数组类型时，有两种写法：
    ```yml
    env: ['dev', 'test']
    ```
    ```yml
    env:
      - dev       # 数组元素多一层缩进，每个元素以 - 开头
      - test
    ```
  - value 为空时，写作 `null` 或 `~` 。为空字符串时，写作 `''` 或 `""` 。

## import yaml

：Python 的第三方库，用于生成、解析 YAML 格式的文本。
- [官方文档](https://pyyaml.org/wiki/PyYAMLDocumentation)
- 安装：`pip install PyYAML`

- 例：序列化
  ```py
  >>> import yaml
  >>> dic1 = {'a': 1, 'b': True}
  >>> yaml.dump(dic1)
  'a: 1\nb: true\n'
  ```
  ```py
  >>> yaml.dump('你好')   # Unicode 字符会按 str.encode('unicode_escape') 编码
  '"\\u4F60\\u597D"\n'
  >>> yaml.dump('你好', allow_unicode=True) # 保留 Unicode 字符
  '你好\n...\n'
  ```
  - 序列化时，默认会将 Python 字典的 key 按升序排列。

- 例：反序列化
  ```py
  >>> yaml.load('a: 1\nb: true\n', Loader=yaml.CLoader)
  {'a': 1, 'b': True}
  ```
