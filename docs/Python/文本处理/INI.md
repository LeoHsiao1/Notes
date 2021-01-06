# INI

INI 文件用于存储一些键值对格式的参数，只支持简单的单层结构。
- 最初是 Windows 系统采用的一种配置文件格式，但类 Unix 系统中也存在类似的文件格式，只是没有明确的标准。

## 语法

- 文件后缀名为 .ini 。
- 用分号 `;` 声明单行注释，有的解析器也支持用 `#` 。
- 每行声明一对键值对参数，用等号 `=` 连接 key 和 value 。
  - key 、 value 都是字符串类型，有的解析器也能识别 true、false 等特殊值。
  - key 、 value 前后的空格会被忽略，除非用双引号作为定界符包住。
- 用中括号 `[ ]` 声明一个段（Section）。
  - 中括号内的字符串会作为段名，不会忽略空格。
  - 每个段中， key 不能重复。

## 例

```ini
[Section 1]
id = 1
tips = Hello World

[MySQL]
runner = root
work_dir = /opt/mysql
```
