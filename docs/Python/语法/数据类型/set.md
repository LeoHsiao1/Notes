# set

- set 类型的对象，用于无序地存放一组元素。
  - set 汉语译为"集合"。

- 对比 list 与 set 类型：
  - list 是有序的，而 set 是无序的。
  - list 可以包含重复的元素，而 set 会自动去重。
    ```py
    >>> a = {1, 2, 3}
    >>> a.add(1)    # 往 set 中添加一个元素，但 1 已经存在与 set 中，因此不会添加
    >>> a
    {1, 2, 3}
    ```
  - list、set 都属于可变类型。但 set 中每个元素必须是不可变类型的对象。因为 set 需要计算每个元素的哈希值，根据哈希值进行去重。
    ```py
    >>> a = set()
    >>> a.add(1)
    >>> a.add([1])    # 如果往 set 中添加一个可变类型的对象，则会抛出异常
    TypeError: unhashable type: 'list'
    ```

## 创建

### set()

```py
set(iterable=()) -> set
```
- 功能：创建一个 set 对象。
- 例：
  ```py
  >>> set()             # 输入参数为空时，会创建一个空的 set 对象，不包含任何元素
  []
  >>> set('hello')      # 输入一个可迭代对象时，会遍历其中的元素，组成一个 set 对象
  {'e', 'l', 'o', 'h'}  # 这些元素无序地存放，而且会自动去重
  ```

### 定界符

- 用户可以输入一组元素，用英文逗号分隔，用花括号 `{ }` 作为定界符。此时 Python 解释器会将它保存为 set 对象。
  - 例：
    ```py
    >>> {1, 2, 3}
    {1, 2, 3}
    >>> type(_)
    <class 'set'>
    ```
  - 如果用户想创建一个空集合，则只能用 set() 。因为一对空的花括号 `{}` ，会被 Python 解释器视作 dict 类型。
    ```py
    >>> set()
    set()
    >>> type(_)
    <class 'set'>
    >>> {}
    {}
    >>> type(_)
    <class 'dict'>
    ```

### 集合生成式

- 集合生成式，是另一种创建 set 的语法。
  - 与列表生成式类似，只是定界符为花括号 `{ }`。
  - 例：
    ```py
    >>> {i for i in range(3)}
    {0, 1, 2}
    ```

## 查

### set.copy()

```py
set.copy() -> set
```
- 功能：对 set 进行浅拷贝，返回一个新的 set 对象。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.copy()
  {1, 2, 3}
  ```

### set.issubset()

```py
set.issubset(iterable) -> bool
```
- 功能：判断当前 set 是否为 iterable 的子集。换句话说，iterable 是否包含当前 set 的所有元素。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.issubset(range(3))
  False
  >>> a.issubset(range(4))
  True
  ```

### set.issuperset()

```py
set.issuperset(iterable) -> bool
```
- 功能：判断当前 set 是否为 iterable 的超集。换句话说，当前 set 是否包含 iterable 的所有元素。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.issuperset(range(3))
  False
  ```

## 增

### set.add()

```py
set.add(object) -> None
```
- 功能：往 set 中添加一个对象。
- 例：
  ```py
  >>> a = set()
  >>> a.add(1)
  >>> a
  {1}
  ```

## 改

### set.update()

```py
set.update(iterable) -> None
```
- 功能：输入一个可迭代对象，遍历其中的元素，得到与当前 set 的并集，然后保存到当前 set 。
- 例：
  ```py
  >>> a = {1}
  >>> a.update('hi')
  >>> a         # 原集合被修改了
  {'i', 1, 'h'}
  ```

### set.union()

```py
set.union(iterable) -> set
```
- 功能：输入一个可迭代对象，遍历其中的元素，得到与当前 set 的并集，然后返回。
- 例：
  ```py
  >>> a = {1}
  >>> a.union('hi')
  {'i', 1, 'h'}
  >>> a     # 原集合没有被修改
  {1}
  ```

## 删

### set.clear()

```py
set.clear() -> None
```
- 功能：清空 set ，删除所有元素。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.clear()
  >>> a
  set()
  ```

### set.remove()

```py
set.remove(object) -> None
```
- 功能：删除 set 中指定一个元素。
  - 如果不存在该元素，则抛出异常。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.remove(1)
  >>> a
  {2, 3}
  >>> a.remove(1) # 此时，元素 1 已经不存在
  KeyError: 1
  ```

### set.discard()

```py
set.discard(object) -> None
```
- 功能：删除 set 中指定一个元素。
  - 如果不存在该元素，则无影响。
- 例：
  ```py
  >>> a = {1, 2, 3}
  >>> a.discard(1)
  >>> a
  {2, 3}
  >>> a.discard(1)
  ```

### set.pop()

```py
set.pop() -> object
```
- 功能：删除 set 中随机一个元素，然后返回它。
  - 如果 set 为空，则抛出异常。
- 例：
  ```py
  >>> a = set('hi')
  >>> a.pop()
  'i'
  >>> a.pop()
  'h'
  >>> a.pop()
  KeyError: 'pop from an empty set'
  ```

## 集合运算

- 两个 set 对象之间，可以进行交集（intersection）、并集（union）、差集（difference）运算。
  ```py
  >>> a = {'A', 'AB'}
  >>> b = {'B', 'AB'}
  >>> a & b           # 交集
  {'AB'}
  >>> a | b           # 并集
  {'B', 'AB', 'A'}
  >>> a - b           # 差集（找出属于集合 a 但不属于集合 b 的元素）
  {'A'}
  >>> a ^ b           # 找出两个集合不共同拥有的元素，相当于用并集减去交集
  {'B', 'A'}
  ```

- 如何合并两个集合？
  - 不能用加号 `+` 拼接。
    ```py
    >>> {1} + {2}
    TypeError: unsupported operand type(s) for +: 'set' and 'set'
    ```
  - 可以通过 `|` 计算并集。
  - 可以调用 `set.union()` 方法。
