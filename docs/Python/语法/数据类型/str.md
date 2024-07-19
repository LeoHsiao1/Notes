
# str

- C++ 中，存储字符串时，主要有两种方式：
  ```cpp
  char* b = "hello";        // 使用 char* 指针
  std::string c = "hello";  // 使用 std::string 对象
  ```
- Python 中，没有 char 数据类型，只有 str 数据类型，用于存储一个字符串。

## 创建

### str()

```py
str(object='') -> str
```
- 功能：创建一个 str 对象。
- 例：
  ```py
  >>> str()   # 不输入参数时，是创建一个长度为 0 的 str 对象
  ''
  >>> str(5)  # 将其它类型的对象转换成 str 类型
  '5'
  ```

### 定界符

- 在 Python 代码中，
  - 如果用户直接输入 hello 这个字符串，则 Python 解释器会将它视作标识符（比如一个变量名）。如果没找到同名的标识符，则会报错。
    ```py
    >>> hello
    NameError: name 'hello' is not defined
    ```
  - 如果用户在字符串的左右两侧，加上引号，作为定界符。则 Python 解释器会将它视作一个字符串，然后保存为 str 对象。
    ```py
    >>> 'hello'
    'hello'
    >>> type(_)
    <class 'str'>
    ```

- 定界符的作用是，声明一个字符串的开始位置、结束位置。
- Python 中可以使用三种定界符：
  - 单引号 `'`
    - 此时字符串不能包含单引号、换行符。如果包含了它们，则需要添加反斜杠，变成转义字符。
    - 例：
      ```py
      >>> 'hello ' world'
      SyntaxError: invalid syntax
      >>> 'hello \' world\n'
      "hello ' world\n"
      ```
  - 双引号 `"`
    - 此时字符串不能包含双引号、换行符。如果包含了它们，则需要添加反斜杠，变成转义字符。
  - 三引号 `'''` 或 `"""`
    - 此时字符串可以包含单引号、双引号、换行符。

### 前缀

- 用户可以给字符串添加几种前缀：
  - `u` 前缀，是声明为 Unicode 字符。每个字符串，默认都采用这种方式。
    ```py
    >>> u'你好'
    '你好'
    >>> u'\u4f60\u597d'
    '你好'
    ```
  - `r` 前缀，是声明为原始字符。此时，该字符串中的每个反斜杠 `\` ，会被改成 '\\' ，因此反斜杠右侧的字符不会被转义。
    ```py
    >>> r'hello \' world\n'
    "hello \\' world\\n"
    >>> r'C:\Windows\System32'  # Windows 电脑中的文件路径，使用 \ 作为分隔符，会被 Python 误认为转义字符，因此需要改成 \\
    'C:\\Windows\\System32'
    >>> '\v\f\b'                # 如果用户输入 ASCII 码中的非显示字符，则会被 Python 转换成 \x?? 格式的十六进制数
    '\x0b\x0c\x08'
    ```
  - `b` 前缀，是声明为 bytes 对象。此时，该字符串不会被保存为 str 对象，而是保存为 bytes 对象。
    ```py
    >>> b'Hello'
    b'Hello'
    >>> type(_)
    <class 'bytes'>
    ```

## 编码

### ASCII

- C 语言中，每个 char 字符，以 ASCII 码的形式存储，因此可以直接转换成 int 类型。
  ```c
  char c = 'A';   // 这里实际上存储的是 'A' 的 ASCII 码值 65
  ```
- 而 Python 中，不能将一个字符或字节，直接转换成 int 类型：
  ```py
  >>> int('A')
  ValueError: invalid literal for int() with base 10: 'A'
  >>> int(b'A')
  ValueError: invalid literal for int() with base 10: b'A'
  ```
- 除非这个字符或字节，是阿拉伯数字：
  ```py
  >>> int('1')
  1
  >>> int(b'1')
  1
  ```

### Unicode

- 在 Python 解释器的底层，每个 str 对象会按照 Unicode 编码，转换成一段二进制格式的数据，然后存储。
  - Python 解释器不会显示每个 str 对象对应的 Unicode 编码值是什么，因为用户通常关注的是 utf-8 编码值。
  - 如果用户希望查看 str 对象的 Unicode 值，可以用 unicode_escape 格式进行编码：
    ```py
    >>> 'www.你好.com'.encode('unicode_escape')
    b'www.\\u4f60\\u597d.com'
    >>> 'www.你好.com'.encode('unicode_escape').decode('unicode_escape')
    'www.你好.com'
    ```

- 可用 `chr()` 函数，将一个 Unicode 编码（int 类型），转换成一个字符（str 类型）。例：
  ```py
  >>> chr(65)
  'A'
  >>> chr(128)
  '\x80'
  ```

- 可用 `ord()` 函数，将一个字符（str 或 bytes 类型），转换成一个 Unicode 编码（int 类型）。例：
  ```py
  >>> ord('A')
  65
  >>> ord('你')
  20320
  ```

### str 转换 bytes

- 一个 str 对象，可以按照任意编码格式，转换成一段二进制数据（bytes 对象）。例：
  ```py
  >>> 'hello'.encode('utf-8')
  b'hello'
  >>> '你好'.encode('gbk')
  b'\xc4\xe3\xba\xc3'
  ```

- 一个 bytes 对象，不一定能转换成 str 对象。
  - 有的 bytes 对象，是从 str 对象编码生成的二进制数据。使用正确的解码格式，就能转换成 str 对象。
    ```py
    >>> b'\xc4\xe3\xba\xc3'.decode('utf-8')
    UnicodeDecodeError: 'utf-8' codec can't decode byte 0xc4 in position 0: invalid continuation byte
    >>> b'\xc4\xe3\xba\xc3'.decode('gbk')
    '你好'
    ```
  - 有的 bytes 对象，是其它类型的二进制数据，例如一个图片文件，不能转换成 str 对象。
    ```py
    >>> b'\xFF'.decode('utf-8')
    UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
    ```

- 将十六进制字符串（str 对象），转换成 bytes 对象：
  ```py
  >>> bytes.fromhex('e4bda0')
  b'\xe4\xbd\xa0'
  >>> bytes.fromhex('0xe4bda0')   # 输入的十六进制字符串，不能包含 0x 前缀
  ValueError: non-hexadecimal number found in fromhex() arg at position 1
  ```

- 将 bytes 对象，转换成十六进制字符串（str 对象）：
  ```py
  >>> '你'.encode()       # 创建一个 bytes 对象
  b'\xe4\xbd\xa0'
  >>> bytes.hex(_)        # 调用 bytes 对象的 hex() 方法
  'e4bda0'
  >>> '你'.encode().hex() # 可以简写为一行语句
  'e4bda0'
  ```
  也可以手动转换每一个字符：
  ```py
  >>> [i for i in '你'.encode()]
  [228, 189, 160]
  >>> [hex(i) for i in '你'.encode()]
  ['0xe4', '0xbd', '0xa0']
  >>> ''.join(['{:02x}'.format(i) for i in '你'.encode()])
  'e4bda0'
  ```

## 查

- 一个 str 对象，本质上是由多个字符组成的一个序列，像 tuple 对象一样支持索引、切片：
  ```py
  >>> a = 'hello'
  >>> a[0]
  'h'
  >>> a[0:1]
  'h'
  ```

- str 对象提供了以下内置方法，用于分析字符串的内容。如果想实现更复杂的分析，则需要使用正则表达式。

### str.count()

```py
str.count(sub, start=0 , end=-1) -> int
```
- 功能：在 str 的 `[start,end)` 范围内，查找 sub 子字符串，返回它出现的次数。
- 例：
  ```py
  >>> 'Hello'.count('He')
  1
  >>> 'Hello'.count('o', 0, 4)
  0
  >>> 'Hello'.count('o', 0, 5)
  1
  ```

### str.find()

```py
str.find(sub, start=0 , end=-1) -> int
```
- 功能：在 str 的 `[start,end)` 范围内，查找 sub 子字符串，返回它第一次出现的位置索引。
  - 如果没找到，则返回 -1 。
- 例：
  ```py
  >>> 'Hello'.find('He')
  0
  >>> 'Hello'.find('o')
  4
  ```

### str.rfind()

- 功能：与 str.rfind() 类似。str.find() 是从左往右查找，而 str.rfind() 是从右往左查找。
  - 如果在 str 中，sub 子字符串出现不止一次，则这两个方法的返回值不同。
- 例：
  ```py
  >>> 'Hello'.find('l')
  2
  >>> 'Hello'.rfind('l')
  3
  ```

## 判断

### str.startswith()

```py
str.startswith(prefix) -> bool
```
- 功能：如果 str 以 prefix 开头，则返回 True 。否则返回 False 。
  - prefix 是一个字符串，或者是一个包含多个字符串的元组。
- 例：
  ```py
  >>> 'Hello'.startswith('He')
  True
  >>> 'Hello'.startswith(('H','h'))
  True
  ```

### str.endswith()

```py
str.endswith(suffix) -> bool
```
- 功能：如果 str 以 suffix 结尾，则返回 True 。否则返回 False 。
  - suffix 是一个字符串，或者是一个包含多个字符串的元组。
- 例：
  ```py
  >>> 'Hello'.endswith('lo')
  True
  >>> 'Hello'.endswith(('O','o'))
  True
  ```

### str.isalnum()

- 功能：如果 str 不为空，且所有字符都是英文字母或阿拉伯数字，则返回 True 。否则返回 False 。
- 例：
  ```py
  >>> ''.isalnum()
  False
  >>> '1m'.isalnum()
  True
  >>> '-1m'.isalnum()
  False
  ```

### str.isalpha()

- 功能：如果 str 不为空，且所有字符都是字母，则返回 True 。否则返回 False 。
- 例：
  ```py
  >>> '1m'.isalpha()
  False
  >>> 'Hello'.isalpha()
  True
  ```

### str.isdecimal()

- 功能：如果 str 不为空，且所有字符都是数字，则返回 True 。否则返回 False 。
- 例：
  ```py
  >>> '12'.isdecimal()
  True
  >>> '1.2'.isdecimal() # 包含小数点，不算纯数字
  False
  ```

### str.islower()

- 功能：如果 str 包含字母，且所有字母都是小写，则返回 True 。否则返回 False 。
- 例：
  ```py
  >>> '123'.islower()
  False
  >>> '123 hello'.islower()
  True
  ```

### str.isupper()

- 功能：如果 str 包含字母，且所有字母都是大写，则返回 True 。否则返回 False 。
- 例：
  ```py
  >>> '123 HELLO'.isupper()
  True
  >>> '123 Hello'.isupper()
  False
  ```

## 改

- str 属于不可变类型，不允许直接修改。下面几种方法是这样进行修改的：将 str 对象拷贝一份，进行修改，然后保存为一个新 str 对象。

### str.lower()

- 功能：返回 str 的一个副本，将其中的所有字母小写。
- 例：
  ```py
  >>> 'Hello'.lower()
  'hello'
  ```

### str.upper()

- 功能：返回 str 的一个副本，将其中的所有字母大写。
- 例：
  ```py
  >>> 'Hello'.upper()
  'HELLO'
  ```

### str.title()

- 功能：返回 str 的一个副本，将它转换成标题格式，即每个字段的首字母大写。
- 例：
  ```py
  >>> 'hello world'.title()
  'Hello World'
  ```

### str.replace()

```py
str.replace(old: str, new: str, count=-1) -> str
```
- 功能：返回 str 的一个副本，将其中的 old 字符串替换成 new 字符串，最多替换 count 次。
  - count 默认值为负数，会替换无限次。
  - 如果没找到 old 字符串，则相当于替换 0 次，返回的 str 与原 str 相同。
- 例：
  ```py
  >>> 'hello'.replace('l', 'L')
  'heLLo'
  >>> 'hello'.replace('lo', 'LO', 1)
  'helLO'
  ```

### str.split()

```py
str.split(sep=None, maxsplit=-1) -> list
```
- 功能：以 sep 作为分隔符，将 str 最多分割 maxsplit 次。分割得到多个 str ，将它们组成一个 list 对象，然后返回。
  - sep 默认值为 None ，会以所有空白字符 `\t\n\r\x0b\x0c` 作为分隔符。
  - maxsplit 默认值为负数，会分割无限次。
- 例：
  ```py
  >>> 'www.baidu.com  test'.split()
  ['www.baidu.com', 'test']
  >>> 'www.baidu.com  test'.split('.')
  ['www', 'baidu', 'com  test']
  >>> 'www.baidu.com..test'.split('.')    # 如果出现两个连续的 seq 分隔符，则会分割出一个空字符串
  ['www', 'baidu', 'com', '', 'test']
  ```

### str.join()

```py
str.join(iterable) -> str
```
- 功能：以 str 作为分隔符，将一个可迭代对象中的各个元素，拼接成一个 str ，然后返回。
  - iterable 对象中的所有元素，都必须是 str 类型，否则会抛出异常。
- 例：
  ```py
  >>> ','.join(['1', '2', '3'])
  '1,2,3'
  ```
- 如果 iterable 中的元素不全是 str 类型，则需要先转换成 str 类型，然后才能 join ：
  ```py
  >>> a = [1, 2, 3]
  >>> ','.join(a)
  TypeError: sequence item 0: expected str instance, int found
  >>> a = [str(i) for i in [1, 2, 3]]
  >>> ','.join(a)
  '1,2,3'
  ```

### 拼接

- 为了方便用户处理较长的字符串，Python 提供了一种便捷的语法：通过加号 `+` ，将两个字符串，拼接成一个字符串。
  - 例：
    ```py
    >>> 'hello' + 'world'
    'helloworld'
    ```
  - 甚至可以省略加号，两个相邻的字符串，会被 Python 解释器自动拼接：
    ```py
    >>> 'hello' 'world'
    'helloworld'
    ```
  - 但是变量与字符串相邻时，不会被 Python 解释器自动拼接：
    ```py
    >>> a = 'hello'
    >>> a 'world'
    SyntaxError: invalid syntax
    >>> a + 'world'     # 此时不能省略加号 +
    'helloworld'
    ```

## 删

### str.strip()

```py
str.strip(chars=None) -> str
```
- 功能：返回 str 的一个副本，将它左右两侧包含于 chars 的字符删掉。
  - chars 默认为 None ，会匹配所有空白字符 `\t\n\r\x0b\x0c` 。
- 例：
  ```py
  >>> '  Hi\n\r'.strip()
  'Hi'
  >>> '_Hi_'.strip('_')
  'Hi'
  >>> 'Hello'.strip('lo')
  'He'
  ```

### str.lstrip()

- 功能：与 str.strip() 类似，但只删除左侧的字符。
- 例：
  ```py
  >>> '  Hi\n\r'.lstrip()
  'Hi\n\r'
  ```

### str.rstrip()

- 功能：与 str.strip() 类似，但只删除右侧的字符。
- 例：
  ```py
  >>> '  Hi\n\r'.rstrip()
  '  Hi'
  ```

## 格式化字符串

- 用户经常需要生成特定格式的字符串，调整排版。这种操作，称为格式化字符串。

### str.format()

```py
str.format(*args, **kwargs) -> str
```
- 功能：以 str 为基础，按照某种格式，生成一个字符串。
- 例：
  ```py
  >>> '{} {}!'.format('Hello', 'World')   # str 中的 {} 会被 format() 中的参数依次替换
  'Hello World!'
  >>> '{} {}!'.format(123, [1, 2])        # format() 中的参数如果不是 str 类型，则会被自动转换成 str 类型，然后替换
  '123 [1, 2]!'
  >>> '{{ {} {} }}'.format('Hello', 'World')      # 如果想在 str 中显示花括号，则要转义成 {{ }}
  '{ Hello World }'
  >>> '{0} {1}!'.format('Hello', 'World')         # 可以用 {int} 的格式，指定 format() 中第几个元组参数
  'Hello World!'
  >>> '{0} {arg2}!'.format('Hello', arg2='World') # 可以用 {key} 的格式，指定 format() 中哪个名称的字典参数
  'Hello World!'
  ```
- 关于字符串长度：
  ```py
  >>> '{:4}'.format(12)     # 至少输出 4 位长度的字符串，如果不足，则默认用空格填补
  '  12'
  >>> '{:04}'.format(12)    # 至少输出 4 位长度的字符串，如果不足，则用 0 填补
  '0012'
  ```
- 关于对齐：
  ```py
  >>> '{:4}'.format('12')   # format() 中参数为 int 类型时，默认右对齐。为 str 类型时，默认左对齐
  '12  '
  >>> '{:<4}'.format(12)    # 左对齐
  '12  '
  >>> '{:>4}'.format('12')  # 右对齐
  '  12'
  >>> '{:^4}'.format('12')  # 居中对齐
  ' 12 '
  ```
- 关于正负号：
  ```py
  >>> '{:+4}'.format(12)    # 输出数字时，加上正负号。此时 format() 中的输入参数必须为 int 或 float 类型
  ' +12'
  >>> '{:-4}'.format(12)    # 保留负号，省略正号
  '  12'
  ```
- 关于浮点数：
  ```py
  >>> '{:f}'.format(12)       # 输出为 float 类型（小数点后默认保留 6 位）
  '12.000000'
  >>> '{:e}'.format(12)       # 输出为科学计数法（小数点后默认保留 6 位）
  '1.200000e+01'
  >>> '{:.2f}'.format(12.345) # 小数点后最多保留 2 位（会进行四舍五入）
  '12.35'
  >>> '{:.4}'.format(12.345)  # 总共最多输出 4 位有效数字（会进行四舍五入）
  '12.35'
  ```
- 关于进制：
  ```py
  >>> '{:b}'.format(12)     # 输出数字时，转换成二进制。此时 format() 中的输入参数必须为 int 类型
  '1100'
  >>> '{:#b}'.format(12)    # 加上 # 时，会根据当前进制，自动加上 0b、0o、0x 前缀
  '0b1100'
  >>> '{:o}'.format(12)     # 输出为八进制
  '14'
  >>> '{:x}'.format(12)     # 输出为小写的十六进制
  'c'
  >>> '{:X}'.format(12)     # 输出为大写的十六进制
  'C'
  ```

- 除了使用 `str.format()` 方法，也可以使用内置函数 `format(value, format_spec='')` ，不过只能格式化一个值。
  ```py
  >>> format(12, 'b')
  '1100'
  >>> format(12, '#b')
  '0b1100'
  ```

### str.center()

```py
str.center(width: int, fillchar=' ') -> str
```
- 功能：返回 str 的一个副本，使得它居中对齐。使得字符串的长度至少为 width ，如果长度不足，则在左右两侧填入 fillchar 字符。
  - fillchar 必须是一个字符。换句话说，是一个长度为 1 的 str 对象。
- 例：
  ```py
  >>> 'Hi'.center(4, '_')
  '_Hi_'
  ```

### str.ljust()

- 功能：与 str.center() 类似，但是左对齐。
- 例：
  ```py
  >>> 'Hi'.ljust(4, '_')
  'Hi__'
  ```

### str.rjust()

- 功能：与 str.center() 类似，但是由对齐。
- 例：
  ```py
  >>> 'Hi'.rjust(4, '_')
  '__Hi'
  ```
