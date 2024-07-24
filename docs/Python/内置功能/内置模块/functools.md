# import functools

：Python的标准库，提供了一些有用的函数、装饰器。

## partial()

```py
partial(func, *args, **keywords) -> new_func
```
- 功能：输入一个函数，给它固定传入一些参数，从而装饰成一个新函数。又称为偏函数。
- 例：
  ```py
  >>> import functools
  >>> def fun1(a, b, c=0, d=0):
  ...     print(a, b, c, d)
  ...
  >>> fun2 = functools.partial(fun1, 1, 2, 3)   # 创建新函数，固定传入参数 a、b、c 的值，只剩参数 d 未赋值
  >>> fun2
  functools.partial(<function fun1 at 0x7f58aa51aa60>, 1, 2, c=3)
  >>> fun2()
  1 2 3 0
  >>> fun2(4)   # 此时只传入一个值，会被赋值给参数 d
  1 2 3 4
  ```
  - 用 lambda 函数也可实现相似的效果：
    ```py
    >>> fun2 = lambda d=0: fun1(1,2,3,d)
    >>> fun2()
    1 2 3 0
    >>> fun2(4)
    1 2 3 4
    ```
