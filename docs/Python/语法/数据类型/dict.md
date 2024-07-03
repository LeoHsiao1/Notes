# dict

- dict 类型的对象，用于存放一些 `key:value` 形式的值。
  - dict 汉语译为"字典"。

dict 不能包含重复的 key ，会自动去重。而 value 可以重复。


## 创建

- 字典生成式，是另一种创建 dict 的语法。
  - 与列表生成式类似，只是定界符为花括号 `{ }` ，并且在左侧生成 `key:value` 形式的值。
  - 例：
    ```py
    >>> {i:bin(i) for i in range(3)}
    {0: '0b0', 1: '0b1', 2: '0b10'}
    >>> {str(k):str(v) for k,v in _.items()}
    {'0': '0b0', '1': '0b1', '2': '0b10'}
    ```
