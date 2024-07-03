# list

- list 类型的对象，用于有序地存放一组元素。每个元素，可以是任意类型的对象。
  - list 汉语译为"列表"。

- Python 的 list ，用途像 C 语言的数组，但更灵活、功能更强：
  - C 语言中，创建一个数组时，就固定了它的长度、数据类型。如下：
    ```c
    int array[10];  // 这个数组，最多存放 10 个 int 类型的元素
    ```
  - Python 中，创建一个 list 对象时，不必声明其长度、数据类型。可以存放任意个、任意类型的对象。如下：
    ```py
    >>> a = [1, 2, 3]
    >>> a.append('hello') # 往 list 中附加元素，此时 Python 解释器会自动增加 list 占用的内存空间，不需要用户考虑
    >>> a
    [1, 2, 3, 'hello']
    ```

## 创建

### list()

```py
list(iterable=()) -> str
```
- 功能：创建一个 list 对象。
- 例：
  ```py
  >>> list()          # 输入参数为空时，会创建一个空的 list 对象，不包含任何元素
  []
  >>> list('hello')   # 输入一个可迭代对象时，会遍历其中的元素，组成一个 list 对象
  ['h', 'e', 'l', 'l', 'o']
  >>> list(1)         # 输入一个不可迭代对象时，会抛出异常
  TypeError: 'int' object is not iterable
  ```

### 定界符

- 在 Python 代码中，
  - 如果用户输入一个整型数字，则 Python 解释器会将它保存为 int 对象。
    ```py
    >>> 1
    1
    >>> type(_)
    <class 'str'>
    ```
  - 如果用户在数字的左右两侧，加上中括号 `[ ]` ，作为定界符。则 Python 解释器会将它保存为 list 对象。
    ```py
    >>> [1]
    [1]
    >>> type(_)
    <class 'list'>
    ```
  - 一个 list 对象中可以包含任意个元素，每个元素之间用英文逗号分隔：
    ```py
    >>> []      # 这是一个空的 list 对象
    []
    >>> [1]     # 该 list 对象只包含一个元素
    [1]
    >>> [1,]    # 如果 list 不为空，且末尾存在一个多余的逗号，则该逗号会被自动忽略
    [1]
    >>> [1,,]   # 如果多余的逗号不止一个，则语法报错
    SyntaxError: invalid syntax
    >>> [,]     # 如果 list 为空，却包含逗号，则语法报错
    SyntaxError: invalid syntax
    ```

### 列表生成式

- 列表生成式，是另一种创建 list 的语法。
  - 格式：`[<list_item> for <item> in iterable]`
  - 原理：通过 for 语句，遍历一个可迭代对象中的元素（这里记作 item ），每获取一个 item 就生成一个 list_item 值，最后将这些 list_item 值组成一个 list 。
  - 效果相当于：
    ```py
    result = []
    for item in iterable:
        list_item = do_something(item)
        result.append(list_item)
    ```
  - 例：
    ```py
    >>> [i for i in range(3)]   # 这里 list_item 取值为 i
    [0, 1, 2]
    >>> [2*i for i in range(3)] # 这里 list_item 取值为 2*i
    [0, 2, 4]
    >>> [i for i in range(3) if i>0]  # 可以添加 if 条件，当 item 满足条件时，才生成一个 list_item
    [1, 2]
    ```

- 可以使用多个 for 语句，遍历多个 iterable 对象：
  ```py
  >>> [x+str(y) for x in 'ABC' for y in range(3)]
  ['A0', 'A1', 'A2', 'B0', 'B1', 'B2', 'C0', 'C1', 'C2']
  ```
  这并不是并行遍历，而是像多维数组一样逐层遍历，相当于：
  ```py
  a = []
  for x in 'ABC':
      for y in range(3):
          list_item = x+str(y)
          a.append(list_item)
  ```

- 如果想并行遍历多个 iterable 对象，同时取出每个对象中的第 n 项元素，则可采用以下方式：
  ```py
  >>> iterables = 'ABC', range(3)
  >>> [i for i in zip(*iterables)]
  [('A', 0), ('B', 1), ('C', 2)]
  ```

- 如果只遍历一个 iterable 对象，但每次希望获取多个元素，则可采用以下方式：
  ```py
  >>> iterable = iter(range(6))   # 创建一个迭代器
  >>> iterables = [iterable] * 2  # 将迭代器拷贝多份，这样并行遍历时，会累加迭代进度
  >>> [i for i in zip(*iterables)]
  [(0, 1), (2, 3), (4, 5)]
  ```
  ```py
  >>> iterable = iter(range(6))
  >>> iterables = [iterable] * 4
  >>> [i for i in zip(*iterables)]  # 这里每次获取 4 个元素。如果 iterables 中任一对象为空，则会停止迭代，可能遗漏一些元素，没有获取
  [(0, 1, 2, 3)]
  ```

## 查

### list.count()

```py
list.count(object) -> int
```
- 功能：在 list 中查找 object 元素，返回它出现的次数。
  - 如果不存在该元素，则返回 0 。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.count(3)
  1
  >>> a.count(4)
  0
  ```

### list.index()

```py
list.index(object, start: int=..., stop: int=...) -> int
```
- 功能：在 list 的 `[start, stop)` 范围内，查找 object 元素，返回它第一次出现的位置索引。
  - 如果不存在该元素，则抛出异常。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.index(3)
  2
  >>> a.index(3, 0, 2)
  ValueError: 3 is not in list
  ```

## 增

### list.append()

```py
list.append(object) -> None
```
- 功能：附加一个对象，成为 list 的最后一个元素。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.append('hello')
  >>> a
  [1, 2, 3, 'hello']
  ```

### list.extend()

```py
list.extend(iterable) -> None
```
- 功能：输入一个可迭代对象，遍历其中的元素，附加到 list 中。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.extend('hello')
  >>> a
  [1, 2, 3, 'h', 'e', 'l', 'l', 'o']
  >>> a.extend(1)
  TypeError: 'int' object is not iterable
  ```
- list.extend() 的效果相当于：
  ```py
  for i in iterable:
      list.append(i)
  ```
- 可以用加号 `+` 合并两个 list 对象，效果相当于 list.extend() ：
  ```py
  >>> a = [1, 2, 3]
  >>> a += 'Hello'
  >>> a
  [1, 2, 3, 'H', 'e', 'l', 'l', 'o']
  ```

### list.insert()

```py
list.insert(index: int, object) -> None
```
- 功能：往 list 中插入一个对象，成为 list 中序号为 index 的那个元素。
  - 或者说，放在原来的第 index 个元素之后。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.insert(2, 'hello')
  >>> a
  [1, 2, 'Hello', 3]
  >>> a.insert(10, 'world')   # 输入的 index 可以超过 list 长度，此时相当于调用 list.append()
  >>> a
  [1, 2, 'hello', 3, 'world']
  ```
- 与 `list.append()` 相比，`list.insert()` 的运行效果较低，因为每插入一个元素，都要移动后面所有元素的位置，改变它们的索引。

## 改

### list.sort()

```py
list.sort(key=None, reverse=False) -> None
```
- 功能：将 list 中所有元素，进行排序。
  - 默认是按照从小到大的顺序排列。如果输入参数 reverse=True ，则反向排序。
  - key 是根据一个函数来进行排序，用法参考 sorted() 函数。
- 例：
  ```py
  >>> a = [1, 3, 2]
  >>> a.sort()
  >>> a
  [1, 2, 3]
  >>> a.sort(reverse=True)
  >>> a
  [3, 2, 1]
  ```

### list.reverse()

```py
list.reverse() -> None
```
- 功能：将 list 中所有元素，顺序颠倒。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.reverse()
  >>> a
  [3, 2, 1]
  ```

## 删

### list.clear()

```py
list.clear() -> None
```
- 功能：清空 list ，删除所有元素。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.clear()
  >>> a
  []
  ```

### list.remove()

```py
list.remove(object) -> None
```
- 功能：在 list 中查找 object 元素，删除它。
  - 如果 list 中重复存在多个该元素，则只删除第一个存在。
  - 如果不存在该元素，则抛出异常。
- 例：
  ```py
  >>> a = [1, 1, 2, 2]
  >>> a.remove(1)
  >>> a
  [1, 2, 2]
  >>> a.remove(3)
  ValueError: list.remove(x): x not in list
  ```

### list.pop()

```py
list.pop(index=-1) -> object
```
- 功能：删除 list 中序号为 index 的那个元素，然后返回它。
  - index 默认值为 -1 ，会取出最后一个元素。
- 例：
  ```py
  >>> a = [1, 2, 3]
  >>> a.pop(3)    # 如果输入的 index 超出 list 长度，则抛出异常
  IndexError: pop index out of range
  >>> a.pop(2)
  3
  >>> a.pop()
  2
  >>> a.pop()
  1
  >>> a.pop()     # 如果 list 为空，则不能取出任何元素
  IndexError: pop from empty list
  ```

- 如果输入参数 index 为 -1 ，则 `list.pop()` 的运行效率很高，可以与 `list.append()` 组合使用，将 list 当作一个先入后出的栈。
  - 如果 index 不为 -1 ，则 `list.pop()` 的运行效果较低，因为每取出一个元素，都要移动后面所有元素的位置，改变它们的索引。
