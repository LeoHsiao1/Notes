# import numpy

：Python 的第三方库，用于进行多维数组、矩阵的运算。
- [官方文档](https://numpy.org/doc/stable/)
- 安装：`pip install numpy`

## 原理

- numpy 的底层函数是基于 C 语言实现，运行效率很高。例如：
  - 在 Python 中让两个一维列表相乘的代码通常为：
    ```py
    c = []
    for i in range(len(a)):
        c.append(a[i]*b[i])
    ```
  - 在 numpy 底层让两个一维数组相乘的代码通常为：
    ```c
    for (i = 0; i < length; i++): {
        c[i] = a[i]*b[i];
    }
    ```
  - 在 Python 中调用 numpy 的代码很简洁：
    ```py
    c = a * b
    ```

- numpy 使用 `ndarray` 类存储数组，简称为 array 。
  - 数组的维（dimensions）称为轴（axes）。
  - 数组中所有元素的数据类型必须相同，通常为数值。
  - 数组在创建之后的大小是固定的，更改数组的大小会删除原数组并创建一个新数组。

## 创建数组

- 创建一维数组：
  ```py
  >>> import numpy as np
  >>> a = np.array([1, 2, 3])   # 传入一个 Python 列表，创建数组
  >>> a
  array([1, 2, 3])
  ```
  - 相关 API ：
    ```py
    def array(object, dtype=None, *, copy=True, order='K', subok=False, ndmin=0)
    ```

- 创建二维数组：
  ```py
  >>> b = np.array([(1 , 2, 3), (4.0, 5., -6)]) 
  >>> b
  array([[ 1.,  2.,  3.],
        [ 4.,  5., -6.]])
  >>> b.dtype
  dtype('float64')
  ```
  - 该数组有 2 个轴，第一个轴的长度为 2 ，第一个轴的长度为 3 。
  - 如果输入的某个数组元素为浮点型，则所有元素都会保存为浮点型。

- 数组的常用属性：
  ```py
  >>> a.ndim      # 轴数
  1
  >>> a.shape     # 形状，是一个元组，包含每个轴的长度
  (3,)
  >>> a.size      # 元素的总数
  3
  >>> a.dtype     # 元素的类型
  dtype('int32')
  >>> a.dtype.name 
  'int32'
  >>> a.itemsize  # 每个元素占用的存储空间，单位为 bytes
  4
  ```

- 数组的常用方法：
  ```py
  >>> a.sum()
  6
  >>> a.min() 
  1
  >>> a.max()
  3
  ```

## 数组运算

- 算术运算：
  ```py
  >>> a - b
  array([[ 0.,  0.,  0.],
        [-3., -3.,  9.]])
  >>> a + b 
  array([[ 2.,  4.,  6.],
        [ 5.,  7., -3.]])
  >>> a * b 
  array([[  1.,   4.,   9.],
        [  4.,  10., -18.]])
  >>> a / b 
  array([[ 1.  ,  1.  ,  1.  ],
        [ 0.25,  0.4 , -0.5 ]])
  >>> a % b
  array([[ 0.,  0.,  0.],
        [ 1.,  2., -3.]])
  >>> a ** 2  
  array([1, 4, 9], dtype=int32)
  ```

- 逻辑运算：
  ```py
  >>> a == 1
  array([ True, False, False])
  >>> a < 2
  array([ True, False, False])
  ```
