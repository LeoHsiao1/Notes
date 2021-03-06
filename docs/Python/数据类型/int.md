# int

## int 进制转换

- 创建指定进制的数字常量：
  ```py
  >>> 10          # int 型常量默认为十进制
  10
  >>> 0b1000      # 声明二进制的 int 型常量
  8               # 会自动转换成十进制再存储
  >>> 0b2         # 数字 2 超出二进制的范围
  SyntaxError: invalid digit '2' in binary literal
  >>> 0o10        # 声明八进制的 int 型常量
  8
  >>> 0xFF        # 声明十六进制的 int 型常量
  255
  ```

- 从其它进制转换成十进制：
  ```py
  >>> int('10')               # 从 str 类型，转换成 int 类型
  10
  >>> int('10', base=8)       # 从 base 进制（str 类型），转换成十进制（int 类型）。base 默认为 10 进制
  8
  >>> int('FF', base=16)
  255
  >>> int('0xFF', base=16)    # 可以使用 0x 等进制前缀，没有影响
  255
  ```

- 从十进制转换成其它进制：
  ```py
  >>> bin(255)                # 从十进制（int 类型）转换成二进制（str 类型）
  '0b11111111'
  ```
  ```py
  >>> oct(8)                  # 从十进制（int 类型）转换成八进制（str 类型）
  '0o10'
  ```
  ```py
  >>> hex(16)                 # 从十进制（int 类型）转换成十六进制（str 类型）
  '0x10'
  >>> '{:02x}'.format(16)     # 也可以用 str.format() 方法转换，这样没有 0x 前缀
  '10'
  ```

## int 与 str 转换

- 
  ```py
  def chr(code: int) -> str
      # 输入一个 Unicode 码（int 类型），返回其对应的字符（str 类型）
  ```
  例：
  ```py
  >>> chr(65)
  'A'
  >>> chr(128)
  '\x80'
  >>> chr(0x112233)           # 输入的取值范围为 [0, 0x110000)
  ValueError: chr() arg not in range(0x110000)
  ```

- 
  ```py
  def ord(c: Union[Text, bytes]) -> int
      # 输入一个字符（str 或 bytes 类型），返回其对应的 Unicode 码（int 类型）
  ```
  例：
  ```py
  >>> ord('A')
  65
  >>> ord('AA')
  TypeError: ord() expected a character, but string of length 2 found
  >>> ord('你')
  20320
  ```

## int 与 bytes 转换

- 从 bytes 对象转换成十六进制字符串，可以调用 bytes.hex() 方法：
  ```py
  >>> '你'.encode()
  b'\xe4\xbd\xa0'
  >>> '你'.encode().hex()
  'e4bda0'
  ```
  也可以手动转换：
  ```py
  >>> [i for i in '你'.encode()]
  [228, 189, 160]
  >>> [hex(i) for i in '你'.encode()]
  ['0xe4', '0xbd', '0xa0']
  >>> ''.join(['{:02x}'.format(i) for i in '你'.encode()])
  'e4bda0'
  ```

- 从十六进制字符串转换成 bytes 对象，可以调用 bytes.fromhex() 方法：
  ```py
  >>> bytes.fromhex('e4bda0')
  b'\xe4\xbd\xa0'
  >>> bytes.fromhex('0xe4bda0')   # 输入的字符串，必须完全由十六进制数字组成
  ValueError: non-hexadecimal number found in fromhex() arg at position 1
  ```
