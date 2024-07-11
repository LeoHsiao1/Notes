# dict

- dict 类型的对象，用于存放一些 `key:value` 形式的元素。
  - dict 汉语译为"字典"。
  - dict 中，每个元素由一个 key 和一个 value 组成。
    - 每个 key ，像 set 对象中的一个元素一样存储，必须为不可变类型，并且会自动去重。
    - 每个 value 可以是任意类型的对象，取值可以重复。

- 对比 set 与 dict 类型：
  - 将 set 中每个元素称为 key ，给每个 key 映射一个 value 。这样 set 就变成了 dict 。
  - set 中所有元素是无序地存放（实际上是按哈希值排序，而哈希值是随机的）。dict 也是无序地存放，但从 Python 3.6 开始，dict 会记住所有元素的写入顺序，读取时也采用该顺序。
    ```py
    >>> {'k1', 'k2'}        # 这个 set 对象中，'k1' 是先写入的，但读取时没有顺序
    {'k2', 'k1'}
    >>> {'k1': 1, 'k2': 2}  # 这个 dict 对象中，'k1' 是先写入的，因此读取时先出现
    {'k1': 1, 'k2': 2}
    ```

## 创建

### dict()

```py
dict(iterable=..., **kwargs) -> dict
```
- 功能：创建一个 dict 对象。
- 例：
  ```py
  >>> dict()        # 输入参数为空时，会创建一个空的 dict 对象，不包含任何元素
  []
  >>> dict([('k1', 1), ('k2', 2)])  # 如果输入一个 iterable 对象，则迭代的每个元素 item ，必须是二元组 (k,v) 的形式
  {'k1': 1, 'k2': 2}
  >>> dict(k1=1, k2=2)              # 也可以输入 **kwargs 参数来创建字典
  {'k1': 1, 'k2': 2}
  ```

### 定界符

- 用户可以输入一组 `key:value` 形式的元素，用英文逗号分隔，用花括号 `{ }` 作为定界符。此时 Python 解释器会将它保存为 dict 对象。
  - 例：
    ```py
    >>> {}          # 这是一个空的 dict 对象
    {}
    >>> type(_)
    <class 'dict'>
    >>> {'k1': 1}   # 该 dict 对象只包含一个元素
    {'k1': 1}
    >>> {'k1': 1, 'k2': 2}
    {'k1': 1, 'k2': 2}
    ```
  - 如果多个元素的 key 相同，则会自动去重，只保留最晚写入的那个元素。
    ```py
    >>> {'k1': 1, 'k2': 2, 'k1': 0}
    {'k1': 0, 'k2': 2}
    ```

### 字典推导式

- 字典推导式，是另一种创建 dict 的语法。
  - 与列表推导式类似，只是定界符为花括号 `{ }` ，并且在左侧生成 `key:value` 形式的值。
  - 例：
    ```py
    >>> {i:bin(i) for i in range(3)}
    {0: '0b0', 1: '0b1', 2: '0b10'}
    >>> {str(k):str(v) for k,v in _.items()}
    {'0': '0b0', '1': '0b1', '2': '0b10'}
    ```

## 索引

- 可用 `dict[key]` 的语法，访问字典中指定一个元素。
  - 读取：
    ```py
    >>> dic = {'k1': 1, 'k2': 2}
    >>> dic['k1']       # 找到 key='k1' 的这个元素，返回其 value
    1
    >>> dic['k3']       # 这里不存在 key='k3' 的元素，因此会抛出异常
    KeyError: 'k3'
    ```
  - 修改：
    ```py
    >>> dic['k1'] = 0   # 对该元素进行赋值，修改其 value
    >>> dic
    {'k1': 0, 'k2': 2}
    ```
  - 删除：
    ```py
    >>> del dic['k1']   # 可用关键字 del 删除该元素
    >>> dic
    {'k2': 2}
    ```

- 访问 dict 中某个 key 时，如果该 key 不存在，则会抛出异常，打断 Python 程序的执行。可以采取以下几种对策：
  - 事先检查 dict 中是否存在指定 key ：
    ```py
    key = 'k1'
    if key in dic:
        print(dic[key])
    else:
        print('{} does not exist.'.format(key))
    ```
  - 调用 `dict.get(key, default=xx)` 来获取 value 。如果指定的 key 不存在，则返回默认值作为 value 。

## 查

### dict.copy()

```py
dict.copy() -> dict
```
- 功能：对 dict 进行浅拷贝，返回一个新的 dict 对象。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.copy()
  {'k1': 1, 'k2': 2}
  ```

### dict.keys()

```py
dict.keys() -> set
```
- 功能：获取 dict 中所有元素的 key ，返回一个像 set 类型的可迭代对象。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.keys()
  dict_keys(['k1', 'k2'])
  >>> set(_)
  {'k2', 'k1'}
  ```

### dict.values()

```py
dict.values() -> set
```
- 功能：获取 dict 中所有元素的 value ，返回一个像 set 类型的可迭代对象。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.values()
  dict_values([1, 2])
  >>> set(_)
  {1, 2}
  ```

### dict.items()

```py
dict.items() -> set
```
- 功能：获取 dict 中所有元素的 key 和 value ，返回一个像 set 类型的可迭代对象。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.items()
  dict_items([('k1', 1), ('k2', 2)])
  >>> set(_)
  {('k2', 2), ('k1', 1)}
  ```
- 例：遍历一个 dict 对象的所有元素
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> for k,v in d.items():
  ...     print(k, v)
  ...
  k1 1
  k2 2
  ```

### dict.get()

```py
dict.get(key, default=None) -> object
```
- 功能：找到 dict 中指定 key 的那个元素，返回其 value 。
  - 如果不存在该元素，则返回 default 参数的值。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.get('k1')
  1
  >>> dic.get('k3', 'unknown')
  'unknown'
  ```

## 改

### dict.update()

```py
dict.update(iterable=..., **kwargs) -> None
```
- 功能：输入一些 `key:value` 形式的元素，添加到 dict 中。
  - 如果输入的某个元素的 key ，已经在 dict 中存在，则会覆盖同名元素的 value 。
- 例：
  ```py
  >>> dic = {}
  >>> dic.update({'k1': 1})
  >>> dic
  {'k1': 1}
  >>> dic.update(k1=0)
  >>> dic
  {'k1': 0}
  ```

## 删

### dict.clear()

```py
dict.clear() -> None
```
- 功能：清空 dict ，删除所有元素。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.clear()
  >>> dic
  {}
  ```

### dict.pop()

```py
dict.pop(key, default=...) -> object
```
- 功能：删除 dict 中指定 key 的那个元素，返回该元素的 value 。
  - 如果不存在该元素，且没有输入 default 参数，则抛出异常。
  - 如果不存在该元素，且输入了 default 参数，则返回 default 参数的值。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.pop('k1')
  1
  >>> dic
  {'k2': 2}
  >>> dic.pop('k1')
  KeyError: 'k1'
  >>> dic.pop('k1', None)
  ```

### dict.popitem()

```py
dict.popitem() -> object
```
- 功能：删除 dict 中排序最后的那个元素，返回该元素的 key 和 value 。
  - 如果 dict 为空，则抛出异常。
- 例：
  ```py
  >>> dic = {'k1': 1, 'k2': 2}
  >>> dic.popitem()
  ('k2', 2)
  >>> dic.popitem()
  ('k1', 1)
  >>> dic.popitem()
  KeyError: 'popitem(): dictionary is empty'
  ```
