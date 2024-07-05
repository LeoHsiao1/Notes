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

## deque

- list 类型没有长度限制，可以存放任意个元素。而 deque 类型，相当于一个限制了长度的 list 。
  - deque 缩写自 double-end queue（双端队列）。
  - deque 只能从左端或右端插入元素，不能从中间插入。
  - deque 从某一端插入一个元素时，如果 deque 已达到最大长度，则会从另一端删除一个元素。

- 定义：
  ```py
  collections.deque(iterable=[], maxlen=None)
  ```
  - maxlen 默认值为 None ，表示不限制长度。

- 例：创建
  ```py
  from collections import deque
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
  >>> q.append(4)       # 从右端插入元素
  >>> q
  deque(['l', 'o', 4], maxlen=3)
  >>> q.appendleft(5)   # 从左端插入元素
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
