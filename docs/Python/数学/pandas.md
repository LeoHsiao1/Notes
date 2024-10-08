# import pandas

：Python 的第三方库，用于对二维表格中的数据，进行增删改查。
- [官方文档](https://pandas.pydata.org/docs/user_guide/index.html)
- 安装：`pip install pandas`
- 处理二维表格时，人们通常会使用 Microsoft Excel 软件，它提供了统计分析、绘图等功能。那为什么要使用 pandas ？
  - 处理多个表格文件时，用 Excel 手动处理挺麻烦，不如基于 pandas 编写 Python 脚本，自动化处理。
  - Excel 是一个闭源的 GUI 软件，只提供了一些固定的功能给用户。而 pandas 可以自由搭配一些 Python 代码逻辑，比如用 numpy 进行矩阵运算、用 matplotlib 绘图。

## Series

- pandas 定义了一种数据结构 Series ，表示一维数组，其中每个元素可以是任意数据类型。
- 例：创建 Series 对象
  ```py
  >>> pd.Series([1, 2, 3])
  0    1          # 调用 Series 的 __repr__() 或 __str__() 方法，会每行打印一个元素的 index、value
  1    2
  2    3
  dtype: int64    # 在最后一行，会尽量找出这些元素的共同点，发现它们都属于某个数据类型
  >>> pd.Series([1, 2, 3.0])
  0    1.0
  1    2.0
  2    3.0
  dtype: float64  # 这些元素都属于 float64 数据类型
  >>> pd.Series([1, 2, '3'])
  0    1
  1    2
  2    3
  dtype: object   # 这些元素都属于 object 数据类型
  ```
- 常用方法：
  ```py
  >>> s = pd.Series([1, 2, 3])
  >>> s.dtypes    # 查看数据类型
  dtype('int64')
  >>> s[0]        # 可通过索引，访问指定一个元素
  1
  >>> s[0] = 0    # 可以赋值，修改原 Series 中的元素
  ```

## DataFrame

- pandas 定义了另一种数据结构 DataFrame ，表示二维数组、二维表格。

- 例：创建 DataFrame 对象
  ```py
  >>> df = pd.DataFrame(
  ...     {
  ...         'A': [1, 2, 3],       # 输入一个 dict ，每对 key-value 会被存储为 DataFrame 中的一个一维数组
  ...         'B': [1.0, 2.0, 3.0], # 这些一维数组的长度必须相同，即包含同样多个元素，否则抛出异常
  ...         'C': ['h', 'i', ''],
  ...     }
  ... )
  >>> df
    A    B  C
  0  1  1.0  h
  1  2  2.0  i
  2  3  3.0
  ```
- 常用方法：
  ```py
  >>> df.dtypes   # 查看数据类型
  A      int64
  B    float64
  C     object
  dtype: object
  >>> df.index    # 获取所有行的 index
  RangeIndex(start=0, stop=3, step=1)
  >>> df.columns  # 获取所有列的 index
  Index(['A', 'B', 'C'], dtype='object')
  ```

### 查询

- 通过列名索引，可以访问 DataFrame 中指定一列，返回一个 Series 对象：
  ```py
  >>> df['A']
  0    1
  1    2
  2    3
  Name: A, dtype: int64
  ```

- 通过 `df.loc` 可以实现灵活的索引、切片：
  ```py
  df.loc[0]             # 访问第 0 行的元素，返回一个 Series 对象
  df.loc[0] = [4, 5, 6] # 允许赋值，修改原 DataFrame 中的元素

  df.loc[0:2]           # 访问从第 0 行到第 2 行的元素，返回一个 DataFrame 对象
  df.loc[0, 'A']        # 访问第 0 行、第 A 列的那个元素
  df.loc[:, ['A', 'B']] # 访问所有行，但列名限于 A、B

  df.at[0, 'A']         # df.at 的用法与 df.loc 相似，但只能访问单个元素
  ```

- 其它方法：
  ```py
  df.copy()       # 复制数据，返回一个新的 DataFrame 对象

  df.head(n=5)    # 查看开头的最多 n 行
  df.tail(n=5)    # 查看末尾的最多 n 行
  ```

### 修改

```py
df[df > 1]    # 检查每个元素，如果取值不大于 1 ，则显示为 NaN ，表示不是预期的数值
df[df.isin([1, 2, '3'])]  # 检查每个元素，如果不属于指定值之一，则显示为 NaN

df.T          # 转置矩阵，返回一个新的 DataFrame 对象

df.sort_index(axis=1, ascending=True) # 改变所有列的顺序，按照列名，进行升序排列
df.sort_values(by='C')  # 改变所有行的顺序，按照第 C 列的取值，进行升序排列
```

### 运算

```py
>>> df.describe() # 对于 dtype 为 int 或 float 类型的列，进行统计分析
        A    B
count  3.0  3.0
mean   2.0  2.0
std    1.0  1.0
min    1.0  1.0
25%    1.5  1.5
50%    2.0  2.0
75%    2.5  2.5
max    3.0  3.0
```

```py
df.mean()       # 计算每列的平均值
df.mean(axis=1) # 计算每行的平均值

df.agg(lambda x: x-1) # 对每个元素进行一次运算，返回一个新的 DataFrame 对象
```

### 导出

- numpy 格式：
  ```py
  # 转换成 numpy 的二维数组
  df.to_numpy()
  ```

- CSV 格式：
  ```py
  # 保存到磁盘中的一个 csv 文件
  df.to_csv('test.csv')
  ```
  ```py
  # 从 csv 文件中读取数据，创建一个 DataFrame 对象
  df = pd.read_csv('test.csv')
  ```

- Excel 格式：
  ```py
  # 保存到磁盘中的一个 xlsx 文件，并指定 sheet 名称
  df.to_excel('test.xlsx', sheet_name='Sheet1')
  ```
  ```py
  # 从 xlsx 文件中读取数据，创建一个 DataFrame 对象。如果某个单元格的内容为空，则赋值为 NaN
  df = pd.read_excel('test.xlsx', sheet_name='Sheet1', na_values=['NaN'])
  ```

- HTML 格式：
  ```py
  # 导出一个 HTML 格式的表格
  with open('test.html', 'w') as f:
      f.write(df.to_html())
  ```
