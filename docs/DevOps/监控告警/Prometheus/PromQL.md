# PromQL

- Prometheus 提供了一种查询语言 PromQL ，用于查询监控指标 metrics ，还可进行加工计算。
- 用户在 Prometheus 的 Graph 页面执行一个 PromQL 查询表达式，默认会将查询到的数据显示成表格（Table），用户也可切换显示成曲线图（Graph）。
  - 显示曲线图需要加载很多数据点，开销大，可能导致 Web 页面卡顿。
  - 大部分标量都不支持显示成曲线图。

## metrics

- Prometheus 采集的监控指标称为 metrics ，它是纯文本格式，每条数据是如下格式的字符串：
  ```sh
  <metric_name>{<label_name>=<label_value>, ...}     metric_value
  ```
  例如：
  ```sh
  go_goroutines{instance="10.0.0.1:9090", job="prometheus"}    80
  go_goroutines{instance="10.0.0.2:9090", job="prometheus"}    90
  ```
  - metric_name 必须匹配正则表达式 `[a-zA-Z_:][a-zA-Z0-9_:]*` ，一般通过 Recording Rules 定义的指标名称才包含冒号 : 。
  - 存在多条用途相同的监控数据时，可使用同一个 metric_name 、不同的标签（label），然后通过 labels 来筛选。
  - label_value 可包含 Unicode 字符。
  - 一个监控对象 exporter 可能输出多种名称的 metrics 。而每个 metrics 可能存在 labels 集合值不同的多个实例 samples ，又称为指标样本。

- Prometheus 采集 metrics 时，会进行以下处理：
  - exporter 输出的 metrics 没有时间戳，而 Prometheus 采集 metrics 时会自动记录当前的时间戳。而采集通常有几秒的延迟，因此记录的时间戳不是很准确。
  - 将 metric_name 记录到内置标签 `__name__` ，比如 `go_goroutines{instance="10.0.0.1:9090", job="prometheus"}` 会记录成 `{__name__="go_goroutines", instance="10.0.0.1:9090", job="prometheus"}` ，因此 samples 完全是通过 labels 来标识的。
  - 对于一条 sample ，比如 `go_goroutines{instance="10.0.0.1:9090", job="prometheus"}` ，在不同时刻采集一次，就得到了它在不同时刻的取值，组成一个时间序列（time series），可用于监控 sample 取值随时间变化的趋势。
  - 对每条 sample 的 labels 集合值计算哈希，然后将该哈希值记作 seriesId ，用作该 time series 在 TSDB 数据库的主键。
    - 新增一条 sample 时，如果它的 seriesId 在 TSDB 已存在，则添加到已有的 time series 。
    - 同一 seriesId 之下的各个 sample ，拥有相同的 labels 集合值，只能通过时间戳区分。
    - Prometheus 定义了一种数据结构 memSeries ，用于存储某个 seriesId 在一段时间范围内的全部 sample 数据。
    - seriesId 的数量称为基数。采集、查询时涉及的基数越大，则处理的 memSeries 越多，占用的 CPU、内存越多。
  - 从 labels 向 seriesId 建立倒排索引，因此根据 labels 查询 metrics 的速度很快。例如记录含有 `job="prometheus"` 标签的 seriesId 有 11、22、33 等。

- 根据用途的不同对 metrics 分类：
  - Counter
    - ：计数器，数值单调递增。
  - Gauge
    - ：仪表，数值可以任意加减变化。
  - Histogram
    - ：直方图。将时间平均分成一段段区间，将每段时间内的多个采样点取平均值再返回（由 Server 计算），相当于从散点图变成直方图。
    - 例如 `prometheus_http_request_duration_seconds_count{}  10` 表示 HTTP 请求的样本总数有 10 个。
    - 例如 `prometheus_http_request_duration_seconds_sum{}  0.1` 表示 HTTP 请求的耗时总和为 0.1s 。
    - 例如 `prometheus_http_request_duration_seconds_bucket{le="60"}  10` 表示 HTTP 请求中，耗时低于 60s 的有 10 个。
  - Summary
    - ：汇总。将所有采样点按数值从小到大排列，然后返回其中几个关键位置的采样点的值（由 exporter 计算），相当于正态分布图。
    - 例如 `..._count`、`..._sum` 后缀。
    - 例如 `http_request_duration_microseconds{handler="prometheus",quantile="0.5"}  3246.518` 表示 HTTP 请求中，排在 50% 位置处的耗时（即中位数）。
    - 例如 `http_request_duration_microseconds{handler="prometheus",quantile="0.9"}  3525.421` 表示 HTTP 请求中，排在 90% 位置处的耗时。
    - 例如  `http_request_duration_microseconds{handler="prometheus",quantile="0.99"}  3657.138` 表示 HTTP 请求中，排在 99% 位置处的耗时。
  - exemplar
    - ：在 metrics 之后附加 traceID 等信息，便于链路追踪。
    - 该功能默认禁用。

- 根据是否随时间变化对 metrics 分类：
  - 标量（scalar）
    - ：包含一个或一些散列的值。
  - 矢量（vector）
    - ：包含一系列随时间变化的值。
    - 一个矢量由 n≥1 个时间序列组成，显示成曲线图时有 n 条曲线，在每个时刻处最多有 n 个数据点（又称为元素），不过也可能缺少数据点（为空值）。

## 查询表达式

- 编写 PromQL 查询表达式时，需要根据指标名、标签筛选出 metrics ，语法示例如下：
  ```sh
  go_goroutines                                   # 查询具有该名称的指标
  {job="prometheus"}                              # 查询具有指定标签值的指标
  {job!~'_.*', job!~'prometheus'}                 # 支持查询重复的指标名
  {__name__="go_goroutines", job='prometheus'}    # 通过内置标签 __name__ 可匹配指标名

  go_goroutines{job ="prometheus"}                # 查询该名称、该标签值的指标
  go_goroutines{job!="prometheus"}                # 要求具有 job 标签，且值不等于 prometheus
  go_goroutines{job =""}                          # 要求 job 标签的值为空字符串（这等价于不具有 job 标签）
  go_goroutines{job!=""}                          # 要求具有 job 标签且值不为空
  go_goroutines{job=~`prometheu\w`}               # 要求标签的值匹配正则表达式
  go_goroutines{job!~`prometheu\w`}               # 要求标签的值不匹配正则表达式

  go_goroutines{job="prometheus"}[1m]             # 查询 1 分钟以内的数据
  go_goroutines{job="prometheus"}[30m:1m]         # 查询 30 分钟以内、1 分钟以前的数据

  go_goroutines{job="prometheus"} offset 1m       # 相当于在 1 分钟之前查询
  sum(go_goroutines{job="prometheus"} offset 1m)  # 使用函数时，offset 符号要放在函数括号内
  ```
  - 用 # 声明单行注释。
  - 将字符串用反引号包住时，不会让反斜杠转义。
  - 查询表达式不能为空的 `{}` ，同理也不能使用 `{__name__=~".*"}` 选中所有指标。

- 可以使用以下时间单位：
  - s ：秒
  - m ：分钟
  - h ：小时
  - d ：天
  - w ：周
  - y ：年

## 运算符

- 运算符的优先级从高到低如下，同一优先级的采用左结合性：
  ```sh
  ^
  * /  %
  + -
  == != <= < >= >
  and unless
  or
  ```

- 可以进行如下算术运算：
  ```sh
  go_goroutines + 1   # 加
  1 - 2               # 减
  1 * 2               # 乘
  1 / 3               # 除法（小数点后会保留十多位）
  1 % 3               # 取模
  2 ^ 3               # 取幂
  ```
  - 只能对指标的值进行运算，不能对标签的值进行运算。
  - 关于 0 的除法运算：
    ```sh
    0 / 任意正数    # 结果为 0
    0 / 任意负数    # 结果为 -0
    0 / 0          # 结果为 NaN
    任意正数 / 0    # 结果为 +Inf
    任意负数 / 0    # 结果为 -Inf
    ```
    - 对于特殊值，可以用 expression > 0 等方式过滤掉。

- 可以进行如下比较运算：
  ```sh
  go_goroutines == 2
  go_goroutines != 2
  go_goroutines >  2  # 返回大于 2 的部分曲线
  go_goroutines <  2
  go_goroutines >= 2
  go_goroutines <= 2
  ```
  - 比较运算默认是过滤掉不符合条件的数据。
  - 如果在比较运算符之后加上关键字 bool ，比如 `1 == bool 2` ，就会返回比较运算的结果，用 1、0 分别表示 true、flase 。

- 矢量之间可以进行如下集合运算：
  ```sh
  go_goroutines{job='prometheus'} and     go_goroutines                     # 交集（返回两个矢量中标签列表相同的时间序列，取第一个矢量中的值）
  go_goroutines{job='prometheus'} or      go_goroutines{job='prometheus'}   # 并集（将两个矢量中的所有时间序列合并，如果存在标签列表重复的时间序列，则取第一个矢量中的值）
  go_goroutines{job='prometheus'} unless  go_goroutines{job!='prometheus'}  # 补集（返回在第一个矢量中存在、但在第二个矢量中不存在的时间序列）
  ```

- 矢量之间进行运算时，默认只会对两个矢量中标签列表相同的时间序列（即标签名、标签值完全相同）进行运算。如下：
  ```sh
  go_goroutines - go_goroutines
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines                            # 两个矢量中存在匹配的时间序列，可以进行运算
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines{instance="10.0.0.2:9100"}  # 两个矢量中不存在匹配的时间序列，因此运算结果为空
  go_goroutines{instance="10.0.0.1:9100"} - go_gc_duration_seconds_sum{instance="10.0.0.1:9100"}  # 指标名不同，但标签列表相同，依然可以运算
  ```
  可以按以下格式，将两个只有部分标签匹配的时间序列进行运算：
  ```sh
  go_goroutines{instance="10.0.0.1:9100"} - on(job) go_goroutines{instance="10.0.0.2:9100"}             # 只考虑 job 标签，则能找到匹配的时间序列
  go_goroutines{instance="10.0.0.1:9100"} - ignoring(instance) go_goroutines{instance="10.0.0.2:9100"}  # 忽略 instance 标签，则能找到匹配的时间序列
  go_goroutines{instance="10.0.0.1:9100"} and on() hour() == 8                                          # 只获取 8 点时的时间序列
  ```
  以上只是对时间序列进行一对一匹配，可以按下格式进行一对多的匹配：
  ```sh
  go_goroutines - on() group_left vector(1)       # 不考虑任何标签，用右边的一个时间序列匹配左边的多个时间序列，分别进行运算，相当于 go_goroutines - 1
  vector(1)     + on() group_right go_goroutines  # group_right 表示用左边的一个时间序列匹配右边的多个时间序列，group_left 则相反
  ```

## 函数

- 矢量与标量的转换：
  ```sh
  vector(1)                 # 输入标量，返回一个矢量
  scalar(vector(1))         # 输入一个单时间序列的矢量，以标量的形式返回当前时刻处的值
  ```

- 关于时间：
  ```sh
  time()                    # 返回当前的 Unix 时间戳（标量），单位为秒
  timestamp(vector(1))      # 返回矢量中每个数据点的时间戳（矢量）

  # 以下函数用于获取某个时间信息（注意为 UTC 时区）。可以输入一个时间矢量，不输入时默认采用当前时间，比如 hour( timestamp(vector(1)) )
  minute([vector])          # 分钟，取值为 0~59
  hour  ([vector])          # 小时，取值为 0~23
  month ([vector])          # 月份，取值为 1~31
  year  ([vector])          # 年份
  day_of_month([vector])    # 该月中的日期，取值为 1~31
  day_of_week ([vector])    # 周几，取值为 0~6 ，其中 0 表示周日
  ```
  例：
  ```sh
  hour() == 16 and minute() < 5   # 仅在 UTC+8 时区每天的前 5 分钟，表达式结果不为空，采取第一段的值，即 16
  ```

- 关于排序：
  ```sh
  sort(go_goroutines)       # 按指标值升序排列
  sort_desc(go_goroutines)  # 按指标值降序排列
  ```
  - 在 Prometheus 的 Table 视图中，显示的指标默认是无序的，只能通过 sort() 函数按指标值排序。不支持按 label 进行排序。
  - 在 Graph 视图中，显示的图例是按第一个标签的值进行排序的，且不受 sort() 函数影响。

- 修改矢量的标签：
  ```sh
  label_join(go_goroutines, "new_label", ",", "instance", "job")               # 给矢量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance、job 标签的值的组合，用 , 分隔
  label_replace(go_goroutines, "new_label", "$1-$2", "instance", "(.*):(.*)")  # 正则匹配。给矢量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance 标签的值的正则匹配的结果
  ```
  - 如果 new_label 与已有标签同名，则会覆盖它。

### 算术函数

- 矢量可以使用以下算术函数：
  ```sh
  abs(go_goroutines)                    # 返回每个时刻处，数据点的绝对值
  round(go_goroutines)                  # 返回每个时刻处，数据点四舍五入之后的整数值
  absent(go_goroutines)                 # 在每个时刻处，如果矢量为空（不存在任何数据点），则返回 1 ，否则返回空值
  absent_over_time(go_goroutines[1m])   # 在每个时刻处，如果过去 1m 内矢量一直为空，则返回 1 ，否则返回空值
  changes(go_goroutines[1m])            # 返回每个时刻处，最近 1m 内数值变化的次数
  resets(go_goroutines[1m])             # 返回每个时刻处，过去 1m 内数值减少的次数

  delta(go_goroutines[1m])              # 返回每个时刻处，过去 1m 内最新一个数据点与最旧一个数据点的差值（可能为负），适合计算变化量
  idelta(go_goroutines[1m])             # 返回每个时刻处，过去 1m 内最新两个数据点的差值（可能为负）
  deriv(go_goroutines[1m])              # 通过简单线性回归，计算每秒的导数（可能为负）

  # 以下算术函数只适用于 Counter 类型，即单调递增的矢量
  rate(go_goroutines[1m])               # 返回每个时刻处，过去 1m 内的每秒平均增量（时间间隔越长，曲线越平缓）
  irate(go_goroutines[1m])              # 返回每个时刻处，过去 1m 内最新两个数据点之间的每秒平均增量（不会为负）
  increase(go_goroutines[1m])           # 返回每个时刻处，过去 1m 内的数值增量（不会为负）
  ```
  - 使用函数时，时间间隔 `[t]` 应该至少是 scrape_interval 的两倍，否则在 t 时间范围内的数据点可能少于 2 个，导致计算结果为空。

- 例：假设 scrape_interval 为 30s ，指标 node_time_seconds 采集了几个数据点，取值依次为 0、30、60、90 ，进行以下函数计算：
  - `delta(node_time_seconds[1m])` 计算结果中，每个数据点的值都为 60 。因为 60s 时间内包含 3 个数据点，最新一个数据点与最旧一个数据点的差值为 60 。
  - `delta(node_time_seconds[30s])` 计算结果为空，因为 30s 时间内的数据点少于 2 个。
  - `delta(node_time_seconds[50s])` 计算结果显示的图像不连续。因为 50s 时间内，有时包含 2 个数据点，就有图像；有时包含 1 个数据点，就没有图像。
  - `delta(node_time_seconds[70s])` 计算结果中，每个点的值为 70 。
    - 这里 70s 时间内包含 3 个数据点，最新一个数据点与最旧一个数据点的差值为 60 、时间长度为 60s 。然后 delta() 会根据这 60s 时间内的差值，按比例推算 70s 时间内的差值。
    - 如果指标的值不是匀速变化的，则时间间隔 `[t]` 除以 scrape_interval 的余数越大，delta() 推算的误差越大。
    - 即使原指标取值为整数，但受到 delta() 推算的影响，计算结果也可能包含小数。而 rate()、increase() 是取平均值，计算结果总是包含小数。
  - `idelta(node_time_seconds[1m])` 计算结果中，每个数据点的值都为 30 。
  - `rate(node_time_seconds[1m])` 计算结果中，每个数据点的值都为 1 。
  - `irate(node_time_seconds[1m])` 计算结果中，每个数据点的值都为 1 。
  - `increase(node_time_seconds[1m])` 计算结果中，每个数据点的值都为 60 。

- increase() 实际上是 rate() 乘以时间间隔的语法糖。
  - 如果矢量为 Counter 类型，即单调递增，
    - 则 increase() 与 delta() 的计算结果几乎相同，但可能存在轻微的误差，因为要先计算 rate() 。
  - 如果矢量先增加，然后减少，
    - 则 delta() 的计算结果可能为负，可以只取 `delta(...) >= 0` 部分的值。
    - 而 rate() 会计算第一段单调递增部分的增长率 k ，然后认为该矢量在 t 时间内的增量等于 k × t ，最终 increase() 计算结果比 delta() 大。因此 rate() 只适合计算 Counter 类型的矢量。
    - Counter 类型的矢量不能保证总是单调递增，比如服务重启时会重新计算，称为计数器重置。因此 rate() 计算 Counter 类型的矢量时，也可能出错。
  - 综上，计算增量时，使用 delta() 比 increase() 更好。

- 关于 idelta()、irate() ：
  - 应该尽量使用大一些的时间间隔，因为时间间隔过大时不影响计算精度，但时间间隔过小时可能缺少数据点。
  - 它们的曲线比 delta()、rate() 更尖锐，更接近瞬时值。但是只考虑到最近的两个数据点，更容易产生误差。

### 聚合函数

- 如果矢量包含多个时间序列，用算术函数会分别对这些时间序列进行运算，而用聚合函数会将它们合并成一个或多个时间序列。
- 矢量可以使用以下聚合函数：
  ```sh
  # 基本统计
  count(go_goroutines)                  # 返回每个时刻处，该矢量的数据点的数量（即包含几个时间序列）
  count_values("value", go_goroutines)  # 返回每个时刻处，各种值的数据点的数量，并按 {value="x"} 的命名格式生成多个时间序列
  sum(go_goroutines)                    # 返回每个时刻处，所有数据点的总和（即将曲线图中所有曲线叠加为一条曲线）
  min(go_goroutines)                    # 返回每个时刻处，数据点的最小值
  max(go_goroutines)                    # 返回每个时刻处，数据点的最大值
  avg(go_goroutines)                    # 返回每个时刻处，数据点的平均值

  # 高级统计
  stddev(go_goroutines)                 # 返回每个时刻处，数据点之间的标准差
  stdvar(go_goroutines)                 # 返回每个时刻处，数据点之间的方差
  topk(3, go_goroutines)                # 返回每个时刻处，最大的 3 个数据点
  bottomk(3, go_goroutines)             # 返回每个时刻处，最小的 3 个数据点
  quantile(0.5, go_goroutines)          # 返回每个时刻处，大小排在 50% 位置处的数据点

  # 修改数据点的值
  last_over_time(go_goroutines[1m])     # 返回每个时刻处，过去 1m 内最新数据点的值
  group(go_goroutines)                  # 将每个数据点的取值置为 1
  sgn(go_goroutines)                    # 判断每个数据点取值的正负。如果为正数、负数、0 ，则分别置为 1、-1、0
  clamp(go_goroutines, 0, 10)           # 限制每个数据点取值的最小值、最大值，语法为 clamp(vector, min, max)
  clamp_min(go_goroutines, 0)           # 限制最小值
  clamp_max(go_goroutines, 10)          # 限制最大值
  ```
  - 聚合函数默认不支持输入有限时间范围内的矢量，需要使用带 `_over_time` 后缀的函数，如下：
    ```sh
    sum_over_time(go_goroutines[1m])    # 返回每个时刻处，过去 1m 内数据点的总和（分别计算每个时间序列）
    avg_over_time(go_goroutines[1m])    # 返回每个时刻处，过去 1m 内的平均值
    ```
  - 聚合函数可以与关键字 by、without 组合使用，如下：
    ```sh
    sum(go_goroutines) by(job)          # 将所有曲线按 job 标签的值分组，分别执行 sum() 函数
    sum(go_goroutines) without(job)     # 将所有曲线按除了 job 以外的标签分组，分别执行 sum() 函数
    sum(go_goroutines) by(Time)         # Time 是隐式 label ，这里相当于 sum(go_goroutines)
    ```
