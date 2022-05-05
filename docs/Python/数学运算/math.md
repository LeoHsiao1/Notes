# ♢ math

：Python 的标准库，提供了幂运算、三角函数等数学函数。
- [官方文档](https://docs.python.org/3/library/math.html)
- 这些函数支持输入 int、float 类型的数值，返回值大多为 float 类型。
- Python 的标准库 cmath 也提供了类似的数学函数，支持输入 int、float、complex 类型的数值，返回值大多为 complex 类型。

## 常量

```py
>>> import math
>>> math.e
2.718281828459045
>>> math.pi
3.141592653589793
```
```py
>>> math.isinf(x)       # 判断 x 是否为 float('±inf')
False
>>> math.isnan(x)       # 判断 x 是否为 float('nan')
False
>>> math.isfinite(x)    # 判断 x 是否为有限的数值，即不是 float('±inf')、float('nan')
True
```

## 幂运算

```py
>>> x = 3.14
>>> math.pow(2, 0.5)    # 计算 2**0.5
1.4142135623730951
>>> math.sqrt(2)        # 计算平方根
1.4142135623730951
>>> math.exp(x)         # 计算 e^x
23.103866858722185
```

## 对数

```py
>>> math.log(x)         # 计算对数，函数定义为 log(x, base=math.e)
1.144222799920162
>>> math.log(x, x)
1.0
```

## 角度与弧度

```py
>>> math.radians(180)   # 将角度转换成弧度
3.141592653589793
>>> math.degrees(3.14)  # 将弧度转换成角度
179.9087476710785
```

## 三角函数

```py
>>> math.sin(x)         # 正弦
0.0015926529164868282
>>> math.cos(x)         # 余弦
-0.9999987317275395
>>> math.tan(x)         # 正切
-0.001592654936407223
```

```py
>>> math.asin(x)        # 反正弦
ValueError: math domain error
>>> math.acos(x)
ValueError: math domain error
>>> math.atan(x)
1.2624806645994682
```

## 双曲函数

```py
>>> math.sinh(x)
11.53029203041011
>>> math.cosh(x)
11.573574828312076
>>> math.tanh(x)
0.9962602049458319
```
```py
>>> math.asinh(x)
1.8618125572133835
>>> math.acosh(x)
1.810991348900196
>>> math.atanh(x)
ValueError: math domain error
```

## 其它

```py
>>> math.ceil(x)    # 向上取整（ceiling），即大于等于 x 的最近整数
4
>>> math.floor(x)   # 向下取整（floor），即小于等于 x 的最近整数
3
```
