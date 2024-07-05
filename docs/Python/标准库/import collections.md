# import collections

- 除了 list、str 等基础数据类型，Python 还在 collections 这个标准库中，提供了一些额外的数据类型，用作存放数据的容器。

## Iterable

- 如果一个对象实现了内置方法 `__iter__()` ，则可以视作可迭代对象（Iterable）。
  ```py
  >>> from collections.abc import Iterable
  >>> isinstance('Hello', Iterable)
  True
  ```

- 如果一个对象实现了内置方法 `__iter__()` 和 `__next__()` ，则可以视作迭代器（Iterator）。
  ```py
  >>> from collections.abc import Iterator
  >>> isinstance(iter('Hello'), Iterator)
  True
  ```

## Counter

- 假设一个 list 包含一些重复的元素，如何统计每个元素的出现次数？
  - 可以对于每个元素，调用一次 `list.count(xx)` ，统计该元素的出现次数。但这样比较麻烦，性能低。
  - 可以基于 list 创建一个 `collections.Counter` 对象，自动统计每个元素的出现次数。

- 定义：
  ```py
  Counter(iterable=None, /, **kwargs)
  ```
  - Counter 类是 dict 类的子类，因此兼容 dict 的大部分方法。
  - 调用 Counter(iterable) 时，会将 iterable 对象中的每个元素，保存为字典中一个 key 。然后将每个元素的出现次数，保存为 key 对应的 value 。

- 例：统计每个字母的出现次数
  ```py
  >>> from collections import Counter
  >>> c = Counter('hello')
  >>> c
  Counter({'l': 2, 'h': 1, 'e': 1, 'o': 1})
  >>> c['h']      # 查询某个元素的出现次数
  1
  >>> c['x']      # 如果查询的元素不存在，则返回 0 ，而不是抛出 KeyError 异常
  0
  >>> c['x'] = 1  # 可以修改元素的出现次数，像修改一个 dict 对象的 value
  >>> c.most_common(2)  # 返回出现次数最多的 n 个元素
  [('l', 2), ('h', 1)]
  >>> c.update('hi')    # 统计更多元素的出现次数，累加到当前 Counter 。这相当于 c += Counter('hi')
  >>> c
  Counter({'h': 2, 'l': 2, 'e': 1, 'o': 1, 'i': 1})
  ```

- 两个 Counter 对象之间，支持以下运算符：
  ```py
  >>> c1 = Counter('aab')
  >>> c1
  Counter({'a': 2, 'b': 1})
  >>> c2 = Counter('abb')
  >>> c2
  Counter({'b': 2, 'a': 1})
  >>> c1 & c2       # 交集
  Counter({'a': 1, 'b': 1})
  >>> c1 | c2       # 并集
  Counter({'a': 2, 'b': 2})
  >>> c1 - c2       # 差集
  Counter({'a': 1})
  >>> c1 + c2       # 累加
  Counter({'a': 3, 'b': 3})
  ```

## deque

- list 类型没有长度限制，可以存放任意个元素。而 deque 类型，相当于一个限制了长度的 list 。
  - deque 缩写自 double-end queue（双端队列）。
  - deque 只能从左端或右端插入元素，不能从中间插入。
  - deque 从某一端插入一个元素时，如果 deque 已达到最大长度，则会从另一端删除一个元素。

- 定义：
  ```py
  deque(iterable=[], maxlen=None)
  ```
  - maxlen 默认值为 None ，表示不限制长度。

- 例：创建
  ```py
  >>> from collections import deque
  >>> deque()
  deque([])
  >>> deque(maxlen=3)
  deque([], maxlen=3)
  >>> deque('hello', maxlen=3)
  deque(['l', 'l', 'o'], maxlen=3)
  ```

- 例：读取
  ```py
  >>> q = deque('hello', maxlen=3)
  >>> q[0]    # 支持索引
  'l'
  >>> q[:]    # 不支持切片
  TypeError: sequence index must be integer, not 'slice'
  ```

- 例：插入
  ```py
  >>> q = deque('hello', maxlen=3)
  >>> q.append(4)       # 从右端插入元素，时间复杂度为 O(1)
  >>> q
  deque(['l', 'o', 4], maxlen=3)
  >>> q.appendleft(5)   # 从左端插入元素，时间复杂度为 O(1)
  >>> q
  deque([5, 'l', 'o'], maxlen=3)
  >>> q.extend('hi')
  >>> q
  deque(['o', 'h', 'i'], maxlen=3)
  >>> q.extendleft('hi')
  >>> q
  deque(['i', 'h', 'o'], maxlen=3)
  ```

- 例：修改
  ```py
  >>> q = deque('hello', maxlen=3)
  >>> q
  deque(['l', 'l', 'o'], maxlen=3)
  >>> q.reverse()   # 翻转列表，反向排序所有元素
  >>> q
  deque(['o', 'l', 'l'], maxlen=3)
  >>> q.rotate(1)   # 让所有元素向右移动 1 位，最右端的元素会插入左端
  >>> q
  deque(['l', 'o', 'l'], maxlen=3)
  >>> q.rotate(-1)  # 让所有元素向左移动 1 位
  >>> q
  deque(['o', 'l', 'l'], maxlen=3)
  ```

- 例：删除
  ```py
  >>> q = deque('hello', maxlen=3)
  >>> q.pop()
  'o'
  >>> q
  deque(['i', 'h'], maxlen=3)
  >>> q.popleft()
  'i'
  >>> q
  deque(['h'], maxlen=3)
  >>> q.clear()
  >>> q
  deque([], maxlen=3)
  ```
