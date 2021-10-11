# ♢ typing

：Python 的标准库，定义了一些类型，常用于类型注释。
- [官方文档](https://docs.python.org/3/library/typing.html)

## 类型

- Python 变量本身是无类型的，但可以添加类型注释，供 IDE 等工具进行静态类型检查。
- 类型：可以是 str、list 等内置类，或用户定义的类，或泛型类。
- 类型别名（Type Alias）：指将一个类型赋值给一个变量。
  ```py
  >>> T = int
  >>> x : T = 1
  ```

## 常见类型

```py
Any         # 匹配所有类型

List
Tuple       # 元组。比如 Tuple[int, str] 表示取值为一个元组，包含两个指定类型的值。
Sequence    # 序列
Set
Dict
Iterable    # 可迭代对象
```

### Callable

：表示可调用的对象。
- 例：
  ```py
  >>> from typing import Callable
  >>> x : Callable                    # 表示变量 x 是一个可调用对象
  >>> x : Callable[[int, int], str]   # 表示变量 x 可调用，且形参列表为 [int, int] 类型，返回值为 str 类型
  ```

### Optional

：表示取值是可选的。可以不赋值，即相当于赋值 None 。
- 例：
  ```py
  from typing import Optional
  def foo(arg: Optional[int] = None):
      pass
  ```

### Union

：表示属于多种类型之一，称为联合类型。
- 定义 Union 类型时，
  - 如果只包含一个类型，则只返回该类型。
    ```py
    >>> Union[int]
    <class 'int'>
    ```
  - 如果包含了重复的类型，则会去除重复：
    ```py
    >>> Union[int, int]
    <class 'int'>
    ```
  - 如果嵌套了 Union 类型，则自动合并为一层 Union 。
    ```py
    >>> Union[Union[int, str], float]
    typing.Union[int, str, float]
    ```
- 比较两个 Union 类型时，不考虑参数的顺序。
  ```py
  >>> Union[int, str] == Union[str, int]
  True
  >>> Union[int, str, int] == Union[str, int]
  True
  ```

### Type

：type 的别名。
- 例：
  ```py
  >>> from typing import Type
  >>> x : Type
  ```

### TypeVar

：用于定义类型变量，表示一种类型。
- 例：
  ```py
  >>> from typing import TypeVar
  >>> A = TypeVar('A')              # 定义一个类型变量 A ，可以赋值任意类型
  >>> A
  ~A
  >>> B = TypeVar('B', int, str)    # 定义一个类型变量 B ，只能赋值指定的类型
  >>> x : B = 1
  ```
- TypeVar 变量可用作泛型的参数：
  ```py
  >>> from typing import Sequence, TypeVar
  >>> T = TypeVar('T')
  >>> x : Sequence        # Sequence 是一个已定义的泛型
  >>> x : Sequence[T]
  >>> x : Sequence[T, T]  # Sequence 只支持声明一个参数
  TypeError: Too many arguments for typing.Sequence; actual 2, expected 1
  ```

### Generic

：用作泛型类的抽象基类。
- 泛型类：表示一个任意类型的类，只声明了形参的类型、数量。
- Generic 类的定义：
  ```py
  class Generic:
      def __class_getitem__(cls, params):
          ...

      def __init_subclass__(cls, *args, **kwargs):
          ...
  ```
- 例：定义泛型类
  ```py
  >>> from typing import TypeVar, Generic
  >>> A = TypeVar('A')
  >>> B = TypeVar('B')
  >>> class Test(Generic):        # 继承 Generic 时，必须声明参数
  ...     pass
  ...
  TypeError: Cannot inherit from plain Generic
  >>> class Test(Generic[A]):
  ...     pass
  ...
  >>> class Test(Generic[A, A]):  # 如果声明多个参数，则必须互不相同
  ...     pass
  ...
  TypeError: Parameters to Generic[...] must all be unique
  >>> class Test(Generic[A, B]):
  ...     def __init__(self, x:A=None, y:B=None):
  ...         pass
  ...
  >>> Test()                # 创建泛型类的示例时，可以不声明参数，像普通类一样使用
  <__main__.Test object at 0x7f21e0369ff0>
  >>> Test[A]()             # 如果声明了参数，则会检查参数数量是否一致，否则抛出异常。但不会强制类型检查
    File "/usr/local/lib/python3.10/typing.py", line 1316, in __class_getitem__
      _check_generic(cls, params, len(cls.__parameters__))
  TypeError: Too few arguments for <class '__main__.Test'>; actual 1, expected 2
  >>> Test[int, int]()
  <__main__.Test object at 0x7f21e0368910>
  >>> Test[int, str](1, 2)  # 不会强制类型检查
  <__main__.Test object at 0x7f347beb5270>
  ```
