# XML

：可扩展标记语言（X Extensive Markup Language），一种序列化数据的文本格式。
- 由于 HTML 不支持自定义标签，通用性低，不适合保存结构化数据。1998 年，W3C 发布了 XML 1.0 标准。
  - XML 主要使用与 HTML 标签类似的语法来保存数据，但比较繁琐，可读性差。
  - 虽然都是文本格式，但 HTML 是用于在网页上显示数据，而 XML、JSON、YAML 是用于将数据序列化，方便传输、存储。

## 语法

- XML 格式的文本文件的扩展名为 .xml 。
- 区分大小写。
- 空格、换行符不会被忽略。
- 用 `<!-- ... -->` 声明注释。
- 必须在第一行声明 XML 的版本：
  ```xml
  <?xml version='1.1' encoding='UTF-8'?>
  ```

### 元素

- XML 以元素为单位存储数据，每个元素是用一对标签包住一个值，格式如下：
  ```xml
  <tag>value</tag>
  ```
  - 标签用尖括号标记。
  - 标签、值都是字符串，但是不必加引号作为定界符。

- 每个元素有两个标签，前一个标签称为开始标签，前一个标签称为结束标签。如果元素没有值，则可以合并成一个标签，如下：
  ```xml
  <name />
  <name id='1' />
  ```

- 可以在开始标签中加上属性。属性是键值对格式，且它的值必须要用双引号作为定界符。如下：
  ```xml
  <note date="20201001" time="12:00">
  Hello World
  </note>
  ```

- 一个元素的值可以是一个或多个子元素，构成嵌套的层级结构。如下：
  ```xml
  <student>
    <id>1</id>
    <name>one</name>
  </student>
  ```
  - 一个 XML 文档中最外层的元素称为根元素。

### 转义字符

- 在 XML 文本中，以下左侧字符需要替换成右侧的转义字符：
  ```sh
  <     &lt;
  >     &gt;
  &     &amp;
  '     &apos;
  "     &quot;
  ```

## ♢ xml

：Python 的标准库，用于解析或导出 XML 格式的文本。
- [官方文档](https://docs.python.org/3/library/xml.html)

### 用法

- 创建元素：
  ```py
  >>> from xml.etree import ElementTree
  >>> root = ElementTree.Element('test')  # 创建一个元素
  >>> root
  <Element 'test' at 0x7fe42c2d1e08>
  >>> root.tag                            # 获取元素的标签名（str 类型）
  'test'
  >>> root.text = 'Hello World'           # 设置元素的值（str 类型）
  >>> root.text
  'Hello World'
  ```
  - 将 XML 元素映射为 `xml.etree.ElementTree.Element` 对象。

- 操作元素的属性：
  ```py
  >>> root.set('date', '20191001')        # 设置一个属性（如果该属性已存在则覆盖其值）
  >>> root.set('time', '12:00')
  >>> root.attrib                         # 获取元素的全部属性（dict 类型）
  {'date': '20191001', 'time': '12:00'}
  ```

- 操作子元素：
  ```py
  >>> sub = ElementTree.Element('sub')
  >>> root.append(sub)        # 添加一个子元素（可以添加多个）
  >>> root.append(sub)
  >>> root[:]                 # Element 对象支持 list 的大部分操作方法
  [<Element 'sub' at 0x7efd36b9a278>, <Element 'sub' at 0x7efd36b9a278>]
  >>> root.find('sub')        # 根据 tag 名查找一个子元素，返回第一个匹配的，没找到则返回 None
  <Element 'sub' at 0x7fe4247fb278>
  >>> root.findall('sub')     # 根据 tag 名查找所有匹配的子元素，没找到则返回[]
  [<Element 'sub' at 0x7fe4247fb278>, <Element 'sub' at 0x7fe4247fb278>]
  >>> root.remove(sub)        # 删除一个子元素
  >>> root.clear()            # 删除 text、子元素、attrib
  ```

- 与字符串的转换：
  ```py
  >>> root = ElementTree.XML('<test />')            # 解析 XML 格式的字符串（返回的是根元素）
  >>> root
  <Element 'test' at 0x7fe42c2d1e08>
  ```
  ```py
  >>> ElementTree.tostring(root, encoding='utf-8')  # 导出 XML 格式（返回的是 bytes 类型）
  b'<test />'
  ```

## ♢ lxml

：Python 的第三方库，用于解析或导出 XML、HTML 格式的文本。
- [官方文档](https://lxml.de/)
- 安装：`pip install lxml`
- 兼容标准库 xml 的大部分操作方法，且功能更强，比如支持自动缩进。

### 用法

- 创建元素：
  ```py
  >>> from lxml import etree
  >>> root = etree.Element('test')    # 创建一个元素
  >>> root
  <Element test at 0x243576e9d40>
  >>> root.tag                        # 获取元素的标签名（str 类型）
  'test'
  >>> root.text = 'Hello World'       # 设置元素的值（str 类型）
  >>> root.text
  'Hello World'
  ```
  - 将 XML 元素映射为 `lxml.etree.Element` 对象。

- 操作元素的属性：
  ```py
  >>> root.set('date', '20191001')    # 设置一个属性（如果该属性已存在则覆盖其值）
  >>> root.set('time', '12:00')
  >>> root.attrib                     # 获取元素的全部属性（dict 类型）
  {'date': '20191001', 'time': '12:00'}
  ```

- 操作子元素：
  ```py
  >>> sub = etree.Element('sub')
  >>> root.append(sub)                # 添加一个子元素（可以添加多个）
  >>> root.append(sub)
  >>> root[:]                         # Element 对象支持 list 的大部分操作方法
  [<Element sub at 0x243576e9e40>]    # 重复添加同一个 Element 对象作为子元素时，只会生效一次
  ```

- 与字符串的转换：
  ```py
  >>> root = etree.XML('<root><id>1</id></root>')    # 解析 XML 格式的字符串（返回的是根元素）
  >>> root
  <Element root at 0x243573c3ac0>
  ```
  ```py
  >>> etree.tostring(root, encoding='utf-8')    # 导出 XML 格式（返回的是 bytes 类型）
  b'<root><id>1</id></root>'
  >>> etree.tostring(root, encoding='utf-8', xml_declaration=True)      # 开头加上声明语句
  b"<?xml version='1.0' encoding='utf-8'?>\n<root><id>1</id></root>"
  ```
  加上缩进：
  ```py
  >>> root.text                           # 处理前，元素值为空
  >>> etree.indent(root, space='  ')
  >>> root.text                           # 处理后，元素值加上了缩进
  '\n  '
  >>> print(etree.tostring(root, encoding='utf-8').decode())
  <root>
    <id>1</id>
  </root>
  ```
  处理 HTML 格式：
  ```py
  >>> root = etree.XML('<html><head/><body><p>Hello<br/>World</p></body></html>')
  >>> etree.tostring(root, method='xml')
  b'<html><head/><body><p>Hello<br/>World</p></body></html>'
  >>> etree.tostring(root, method='html')
  b'<html><head></head><body><p>Hello<br>World</p></body></html>'   # HTML 标准的标签有些许差异
  ```
