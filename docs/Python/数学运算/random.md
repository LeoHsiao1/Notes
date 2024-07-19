# import random

：Python 的标准库，用于生成随机数。
- [官方文档](https://docs.python.org/3/library/random.html)
- 基于 Mersenne Twister 算法生成为伪随机数。
  - 生成速度快，但是生成的随机数可能被预测，安全性低，因此不适合用作密码。
  - 用户想生成密码时，建议使用 `os.urandom()` ，更安全。

## 用法

- 例：
  ```py
  >>> import random
  >>> random.randint(1, 10)         # 生成一个在闭区间 [1, 10] 内的数（上下限只能是整数）
  3
  >>> random.randrange(1, 10, 2)    # 生成一个在闭区间 [1, 10] 内、步进值为 2 的数（上下限只能是整数）
  5
  >>> random.uniform(1, 5.4)        # 生成一个在闭区间 [1, 10] 内的数（上下限可以是整数、浮点数）
  5.254084551261407
  ```
  ```py
  >>> random.choice('Hello')        # 从序列中随机选取一项元素
  'e'
  >>> random.choices('Hello', k=3)            # 选取 k 个元素（可能重复）
  ['H', 'e', 'e']
  >>> random.choices('Hello', [1,2,3,4,50])   # 指定权重
  ['o']
  ```
  ```py
  >>> L1 = [1, 2, 3, 4]
  >>> random.shuffle(L1)            # 改变序列中的元素顺序
  >>> L1
  [3, 4, 2, 1]
  ```
