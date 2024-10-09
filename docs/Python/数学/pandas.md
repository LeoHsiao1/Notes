# import pandas

：Python 的第三方库，用于对二维表格中的数据，进行增删改查、统计分析。
- [官方文档](https://pandas.pydata.org/docs/user_guide/index.html)
- 安装：`pip install pandas`
- 处理二维表格时，人们通常会使用 Microsoft Excel 软件。为什么要使用 pandas ？
  - 处理多个表格文件时，用 Excel 手动处理挺麻烦，不如使用 pandas 编写 Python 脚本，自动化处理。
  - Excel 是一个闭源的软件，只提供了一些固定的功能给用户。而使用 pandas 可以自由编写 Python 代码逻辑，还可以与 numpy 等 Python 库组合使用。
- Python 的 csv、openpyxl 库也能处理表格数据，为什么要使用 pandas ？
  - csv、openpyxl 库侧重于序列化、反序列化，不在乎表格数据是 number 还是 str 类型。
  - 而 pandas 库侧重于增删改查、统计分析，希望表格数据是 number 类型。

## Series

- pandas 定义了一种数据结构 Series ，表示一维数组，其中每个元素可以是任意数据类型。

### 增

- 例：
  ```py
  >>> import pandas as pd
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

- 默认给每个元素分配一个从 0 开始递增的 index ，用户也可以自定义 index 取值：
  ```py
  >>> s = pd.Series([1, 2, 3], index=['A', 'B', 'C'], name='test')
  >>> s
  A    1
  B    2
  C    3
  Name: test, dtype: int64
  >>> s.index
  Index(['A', 'B', 'C'], dtype='object')
  >>> s['A']
  1
  >>> s['A':'B']
  A    1
  B    2
  ```

### 查

- 例：
  ```py
  >>> s = pd.Series([1, 2, 3], name='test')
  >>> s.name      # 查看名称
  'test'
  >>> s.dtypes    # 查看数据类型
  dtype('int64')
  >>> s.empty     # 检查是否为空，不包含任何元素。不能通过 bool(s) 来判断是否为空
  False
  >>> s.index
  RangeIndex(start=0, stop=3, step=1)
  >>> s.values
  array([1, 2, 3], dtype=int64)
  ```

- 支持索引：
  ```py
  >>> s[0]        # 可通过索引，访问指定一个元素
  1
  >>> s[0] = 0    # 可以赋值，修改原 Series 中的元素
  ```

- 支持切片：
  ```py
  >>> s[0:2]
  A    1
  B    2
  Name: test, dtype: int64
  ```

- 支持复制：
  ```py
  >>> s.copy()    # 复制数据，返回一个新的 DataFrame 对象
  0    1
  1    2
  2    3
  Name: test, dtype: int64
  ```

## DataFrame

- pandas 定义了另一种数据结构 DataFrame ，表示二维数组、二维表格。继承了 Series 的大部分功能。

### 增

- 创建 DataFrame 时，可以传入一个 list 作为二维数组：
  ```py
  >>> df = pd.DataFrame(
  ...     [
  ...         [1, 2, 3],
  ...         [4, 5, 6],
  ...         [7, 8, 9],
  ...     ]
  ... )
  >>> df
    0  1  2
  0  1  2  3
  1  4  5  6
  2  7  8  9
  ```
  - 第一行，表示所有 column 的名称，默认从 0 开始递增。
  - 第一列，表示所有 row 的名称，默认从 0 开始递增。

- 可以在创建 DataFrame 时，指定所有行、列的名称：
  ```py
  >>> df = pd.DataFrame(
  ...     [
  ...         [1, 2, 3],
  ...         [4, 5, 6],
  ...         [7, 8, 9],
  ...     ],
  ...     index=['a', 'b', 'c'],
  ...     columns=['A', 'B', 'C']
  ... )
  >>> df
    A  B  C
  a  1  2  3
  b  4  5  6
  c  7  8  9
  ```

- 可以在创建 DataFrame 时，传入一个 dict ，将每对 key、value 作为一个一维数组的 column、value ：
  ```py
  >>> df = pd.DataFrame(
  ...     {
  ...         'A': [1, 2, 3],
  ...         'B': [4, 5, 6],
  ...         'C': [7, 8, 9],
  ...     }
  ... )
  >>> df
    A  B  C
  0  1  4  7
  1  2  5  8
  2  3  6  9
  ```

### 查

- 查看基本信息：
  ```py
  >>> df.dtypes
  A    int64
  B    int64
  C    int64
  dtype: object
  >>> df.index
  RangeIndex(start=0, stop=3, step=1)
  >>> df.columns
  Index(['A', 'B', 'C'], dtype='object')
  ```

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
  df.loc[0] = [0, 0, 0] # 允许赋值，修改原 DataFrame 中的元素

  df.loc[0:2]           # 访问从第 0 行到第 2 行的元素，返回一个 DataFrame 对象
  df.loc[0, 'A']        # 访问第 0 行、第 A 列的那个元素
  df.loc[:, ['A', 'B']] # 访问所有行，但列名限于 A、B

  df.at[0, 'A']         # df.at 的用法与 df.loc 相似，但只能访问单个元素
  ```

- 筛选：
  ```py
  >>> df > 5          # 检查每个元素，如果取值大于 5 ，则显示为 True ，否则显示为 False
        A      B     C
  0  False  False  True
  1  False  False  True
  2  False   True  True
  >>> (df > 5).all()  # 统计每列元素的比较结果
  A    False
  B    False
  C     True
  dtype: bool
  >>> (df > 5).all().any()
  True
  ```
  ```py
  >>> df[df > 5]  # 只显示取值大于 5 的各个元素，其它元素显示为 NaN ，表示不是预期的数值
      A    B  C
  0 NaN  NaN  7
  1 NaN  NaN  8
  2 NaN  6.0  9
  >>> df[df.isin([1, 2, '3'])]  # 只显示等于指定值之一的元素，其它元素显示为 NaN
      A   B   C
  0  1.0 NaN NaN
  1  2.0 NaN NaN
  2  NaN NaN NaN
  ```

- 其它方法：
  ```py
  df.head(n=5)    # 查看开头的最多 n 行
  df.tail(n=5)    # 查看末尾的最多 n 行

  df.sort_index(axis=1, ascending=True) # 改变所有列的顺序，按照列名，进行升序排列
  df.sort_values(by='C')  # 改变所有行的顺序，按照第 C 列的取值，进行升序排列
  ```

### 删

- 例：
  ```py
  df.drop('A', axis=1)  # 删除第 A 列，返回一个新的 DataFrame 对象
  df.drop(0)            # 删除第 0 行，返回一个新的 DataFrame 对象

  df.dropna()             # 检查所有行，如果某行的任一元素为空（该元素不存在，或者取值为 None），则删除这一整行
  df.dropna(axis=1)       # 检查所有列
  df.dropna(how='all')    # 如果某行的所有元素都为空，才删除这一整行
  df.dropna(subset=['A']) # 检查所有行，但只考虑第 A 列的元素
  df.dropna(inplace=True) # df.dropna() 默认会返回一个新的 DataFrame 对象。如果启用 inplace ，则会修改原 DataFrame 对象

  df.fillna('NaN', inplace=True)  # 将所有空元素，赋值为 'NaN'

  df.duplicated()         # 检查所有行，看每行是否与之前某行的内容重复
  df.drop_duplicates()    # 删除重复的行
  ```

### 运算

- 矩阵运算：
  ```py
  df.T        # 转置矩阵，返回一个新的 DataFrame 对象

  df1 + 2     # 将矩阵中每个元素，取值 +2
  df1 - 2
  df1 * 2
  df1 / 2

  df1 + df2
  df1 - df2
  df1 * df2
  df1 / df2

  df1 >  df2
  df1 == df2

  df.agg(lambda x: x-1) # 对每个元素调用一次 lambda 函数，返回一个新的 DataFrame 对象
  ```

- 统计分析：
  ```py
  >>> df.describe() # 对于 dtype 为 int 或 float 类型的列，进行统计分析
          A    B    C
  count  3.0  3.0  3.0
  mean   2.0  5.0  8.0
  std    1.0  1.0  1.0
  min    1.0  4.0  7.0
  25%    1.5  4.5  7.5
  50%    2.0  5.0  8.0
  75%    2.5  5.5  8.5
  max    3.0  6.0  9.0
  ```
  ```py
  df.mean()       # 计算每列的平均值。axis 默认为 0 ，表示列
  df.mean(axis=1) # 计算每行的平均值
  df.mean(skipna=True) # skipna 默认为 True ，表示不考虑取值为 NaN 的元素

  df.count()
  df.sum()
  df.median() # 中位数
  df.min()
  df.max()
  df.std()    # 样本标准差
  ```

### 合并

- 例：
  ```py
  >>> df1 = pd.DataFrame(
  ...     {
  ...         'A': [1, 2, 3],
  ...         'B': [4, 5, 6],
  ...         'C': [7, 8, 9],
  ...     }
  ... )
  >>> df2 = pd.DataFrame(
  ...     {
  ...         'A': [1, 2, 3],
  ...         'D': [4, 5, 6],
  ...     }
  ... )
  >>> pd.concat([df1, df2]) # 将多个 DataFrame ，纵向依次拼接，返回一个新的 DataFrame 对象
    A    B    C    D
  0  1  1.0    4  NaN   # 如果这些 DataFrame 的 columns 不完全相同，则不同的列会缺少值，自动用 NaN 填充
  1  2  2.0    5  NaN
  2  3  3.0    6  NaN
  0  1  NaN  NaN  4.0
  1  2  NaN  NaN  5.0
  2  3  NaN  NaN  6.0
  >>> pd.concat([df1, df2], axis=1) # 将多个 DataFrame ，横向依次拼接，返回一个新的 DataFrame 对象
    A    B  C  A  D
  0  1  1.0  4  1  4
  1  2  2.0  5  2  5
  2  3  3.0  6  3  6
  >>> pd.concat([df1, df2], join='inner') # 类似于 MySQL 的 JOIN 语法，内联结
    A
  0  1
  1  2
  2  3
  0  1
  1  2
  2  3
  >>> pd.concat([df1, df2], join='outer') # 外联结
    A    B    C    D
  0  1  1.0    4  NaN
  1  2  2.0    5  NaN
  2  3  3.0    6  NaN
  0  1  NaN  NaN  4.0
  1  2  NaN  NaN  5.0
  2  3  NaN  NaN  6.0
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
  # 导出为 HTML 格式的表格
  with open('test.html', 'w') as f:
      f.write(df.to_html())
  ```

### 绘图

- pandas 默认采用 matplotlib 作为绘图工具。需要安装 matplotlib 库，然后执行以下代码：
  ```py
  import matplotlib.pyplot as plt

  df.plot()         # 绘制折线图
  plt.show()        # 显示 GUI 窗口，其中包含绘制的图像
  plt.close('all')  # 关闭 GUI 窗口
  ```
