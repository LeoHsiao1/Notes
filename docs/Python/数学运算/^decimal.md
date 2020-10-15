# ♢ decimal

：Python 的标准库，用于存储高精度的浮点数。

## 用法

- Python 的 float 对象在底层是以二进制形式存储浮点数，可能存在微小的误差。
  ```py
  >>> 0.1 + 0.2
  0.30000000000000004
  ```
  多次进行这样的运算，会累计误差，越来越大。

- 使用 `decimal.Decimal` 对象可以存储高精度的浮点数。
  ```py
  >>> from decimal import Decimal
  >>> Decimal(-10) 
  Decimal('-10')
  >>> Decimal('3.14')       # 输入可以是 int 或 str 类型的数值
  Decimal('3.14')
  >>> Decimal(3.14)         # 将 float 对象直接转换成 Decimal 会有误差，这里应该改为 Decimal(str(3.14))
  Decimal('3.140000000000000124344978758017532527446746826171875')
  >>> str(Decimal('3.14'))  # Decimal 对象可以直接转换成字符串
  '3.14'
  ```

- Decimal、int 对象之间可以直接进行运算，结果会返回一个 Decimal 对象。
  ```py
  >>> Decimal('0.1') + Decimal('0.2')
  Decimal('0.3')
  >>> Decimal('0.1') + 0.2        # Decimal、float 对象之间不能进行运算
  TypeError: unsupported operand type(s) for +: 'decimal.Decimal' and 'float'
  >>> Decimal('0.1') + 2
  Decimal('2.1')
  >>> 0 / Decimal('0.1')          # 被除数为 0 时，结果为 0
  Decimal('0E+1')
  >>> Decimal('0.1') / 0          # 除数为 0 时，抛出异常
  decimal.DivisionByZero: [<class 'decimal.DivisionByZero'>]
  >>> Decimal('3.14') < 3.14 
  True
  ```

- Decimal 对象的有效位数默认为 28 。
  ```py
  >>> from decimal import Decimal, getcontext
  >>> getcontext().prec
  28
  >>> getcontext().prec = 4       # 设置有效位数
  >>> Decimal('0.1') / 3
  Decimal('0.03333')
  >>> Decimal('0.1234567') / 1    # 超出有效位数时，会自动四舍五入
  Decimal('0.1235')
  ```
