# PromQL

- Prometheus 提供了一种查询语言 PromQL ，用于查询 TSDB 中的 points ，还可进行加工计算。
- 用户可在 Prometheus 的 Web 页面执行 PromQL 查询表达式，可显示成两种图表：
  - Table
    - ：查询某个时刻的 points ，然后显示成列表。
    - 此时前端会向 Prometheus 发送 `/api/v1/query` 请求，返回 instant vector 格式的 points 。
  - Graph
    - ：查询某段时间范围内的所有 points ，然后以时间为 x 轴显示成曲线图。
    - 此时前端会向 Prometheus 发送 `/api/v1/query_range` 请求，返回 range vector 格式的 points 。
    - 显示曲线图需要加载很多 points ，开销大，可能导致网页卡顿。

## 查询表达式

- 编写 PromQL 查询表达式时，至少要包含一个 metric_name 或 label-value ，用于筛选 points 。语法示例如下：
  ```sh
  go_goroutines                                   # 查询具有该名称的指标
  {job="prometheus"}                              # 查询具有指定标签值的指标
  {job!~'_.*', job!~'prometheus'}                 # 支持查询重复的指标名
  {__name__="go_goroutines", job='prometheus'}    # 通过内置标签 __name__ 可匹配指标名

  go_goroutines{job="prometheus"}                 # 查询具有该名称、该标签值的指标
  go_goroutines{job!="prometheus"}                # 要求具有 job 标签，且值不等于 prometheus
  go_goroutines{job=""}                           # 要求 job 标签的值为空字符串（这等价于不具有 job 标签）
  go_goroutines{job!=""}                          # 要求具有 job 标签且值不为空
  go_goroutines{job=~`prometheu\w`}               # 正则匹配
  go_goroutines{job!~`prometheu\w`}               # 反正则匹配

  go_goroutines{job="prometheus"} offset 1m       # 默认是查询当前时刻的 points ，使用 offset 则是查询一段时间之前的 points ，相当于在一段时间之前执行该查询表达式
  sum(go_goroutines{job="prometheus"} offset 1m)  # 使用函数时，offset 符号要放在函数括号内
  ```
  - 用 # 声明单行注释。
  - 将字符串用反引号包住时，不会让反斜杠转义。
  - 查询表达式不能为空的 `{}` ，同理也不能使用 `{__name__=~".*"}` 选中所有指标。

- 以上查询表达式得到的是 instant vector ，以下查询表达式得到的是 range vector ：
  ```sh
  go_goroutines{job="prometheus"}[1m]             # 查询以当前时刻为基准，过去 1m 时间范围内的所有 points
  go_goroutines{job="prometheus"}[10m:1m]         # 在过去 10m 时间范围内，每隔 1m 时长取一个 point 返回
  ```

- PromQL 中时间的取值必须是正整数，支持以下时间单位：
  ```sh
  s     # 秒
  m     # 分钟
  h     # 小时
  d     # 天
  w     # 周
  y     # 年
  ```

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

- 向量之间可以进行如下集合运算：
  ```sh
  go_goroutines{job='prometheus'} and     go_goroutines                     # 交集（返回两个向量中标签列表相同的时间序列，取第一个向量中的值）
  go_goroutines{job='prometheus'} or      go_goroutines{job='prometheus'}   # 并集（将两个向量中的所有时间序列合并，如果存在标签列表重复的时间序列，则取第一个向量中的值）
  go_goroutines{job='prometheus'} unless  go_goroutines{job!='prometheus'}  # 补集（返回在第一个向量中存在、但在第二个向量中不存在的时间序列）
  ```

- 向量之间进行运算时，默认只会对两个向量中标签列表相同的时间序列（即标签名、标签值完全相同）进行运算。如下：
  ```sh
  go_goroutines - go_goroutines
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines                            # 两个向量中存在匹配的时间序列，可以进行运算
  go_goroutines{instance="10.0.0.1:9100"} - go_goroutines{instance="10.0.0.2:9100"}  # 两个向量中不存在匹配的时间序列，因此运算结果为空
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

- 向量与标量的转换：
  ```sh
  vector(1)                 # 输入标量，返回一个向量
  scalar(vector(1))         # 输入一个 time series ，返回每个采样时刻处的标量值
  ```

- 关于时间：
  ```sh
  time()                    # 返回当前的 Unix 时间戳（标量），单位为秒
  timestamp(vector(1))      # 返回向量中每个数据点的时间戳（向量）

  # 以下函数用于获取某个时间信息（注意为 UTC 时区）。可以输入一个时间向量，不输入时默认采用当前时间，比如 hour( timestamp(vector(1)) )
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
  sort(go_goroutines)       # 按 metrics 取值，升序排列
  sort_desc(go_goroutines)  # 按 metrics 取值，降序排列
  sort_by_label(<instant-vector>, <label>)      # 按 label 的取值，升序排列。这是 Prometheus v2.50.0 新增的功能
  sort_by_label_desc(<instant-vector>, <label>) # 按 label 的取值，降序排列
  ```
  - 在 Prometheus 的 Table 页面，显示的指标默认是无序的，只能通过 sort() 函数按指标值排序。不支持按 label 进行排序。
  - 在 Graph 页面，显示的图例是按第一个标签的值进行排序的，且不受 sort() 函数影响。

- 修改向量的标签：
  ```sh
  # 给向量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance、job 标签的值的组合，用 , 分隔
  label_join(go_goroutines, "new_label", ",", "instance", "job")

  # 正则匹配。给向量 go_goroutines 添加一个标签，其名为 new_label ，其值为 instance 标签的值的正则匹配的结果
  label_replace(go_goroutines, "new_label", "$1-$2", "instance", "(.*):(.*)")
  ```
  - 如果 new_label 与已有标签同名，则会覆盖它。

### 算术函数

- 向量可以使用以下算术函数：
  ```sh
  abs(go_goroutines)                    # 返回每个采样时刻处，数据点的绝对值
  round(go_goroutines)                  # 返回每个采样时刻处，数据点四舍五入之后的整数值
  absent(go_goroutines)                 # 在每个采样时刻处，如果向量为空（不存在任何数据点），则返回 1 ，否则返回空值
  absent_over_time(go_goroutines[1m])   # 在每个采样时刻处，如果过去 1m 内向量一直为空，则返回 1 ，否则返回空值
  changes(go_goroutines[1m])            # 返回每个采样时刻处，过去 1m 内数值变化的次数
  resets(go_goroutines[1m])             # 返回每个采样时刻处，过去 1m 内数值减少的次数

  delta(go_goroutines[1m])              # 返回每个采样时刻处，过去 1m 内最新的值减去最旧的值之差
  idelta(go_goroutines[1m])             # 返回每个采样时刻处，过去 1m 内最新两个数据点的差值
  deriv(go_goroutines[1m])              # 通过简单线性回归，计算每秒的导数

  # 以下函数专用于处理 Counter 类型的向量，即单调递增的向量。计算结果不会为负
  increase(http_requests_count[1m])     # 返回每个采样时刻处，过去 1m 内的增量
  rate(http_requests_count[1m])         # 返回每个采样时刻处，过去 1m 内的增长率，即平均每秒增量
  irate(http_requests_count[1m])        # 返回每个采样时刻处，过去 1m 内最新两个数据点之间的增长率
  ```

- 关于 delta()、increase() ：
  - delta() 函数用于计算向量的差值、变化量。
    - 例如 `delta(http_requests_count[1m])` 的计算结果接近于 `http_requests_count - http_requests_count offset 1m` ，但不完全相同，因为受到 extrapolation 的影响。
  - increase() 函数用于计算向量的增量，因此希望向量是单调递增的。如果向量的值在 range 时长内一会增大一会减小，则累计每一段增量，视作总增量。
    - 假设向量的值从 30 变为 50 ，则差值、增量都为 20 。
    - 假设向量的值从 50 变为 40 ，则差值为 -10 ，增量为 40 。这里 increase() 认为 Counter 计数器先从 50 重置到 0 ，然后从 0 增长到 40 ，只是因为离散采样没有采样到 0 值，因此增量为 40-0=40 。
  - rate() 的计算结果，相当于 increase() 除以时间范围 range 。
  - 如果向量为 Counter 类型，即单调递增，则 delta() 与 increase() 的计算结果通常相同。
    - 但 Counter 类型的向量不能保证总是单调递增，比如 exporter 重启时会重新计数，称为计数器重置（Counter Reset），此时 delta() 与 increase() 的计算结果不同。
    - 如果向量的值减小，则 delta() 的计算结果可能为负，可以只取 `delta(...) >= 0` 部分的值。而 increase() 的计算结果不会为负，反而会计算出比 delta() 更大的增量，因为每次 Counter Reset 之后会从 0 开始重新计算增量。
  - 综上，选用函数的一般逻辑如下：
    - 如果向量为 Counter 类型，则用 increase() 计算增量，用 rate() 计算增长率。
    - 如果向量为 Gauge 类型，则用 delta() 计算差值，用 deriv() 计算导数。

- 关于 idelta()、irate() ：
  - 时间范围 range 越大，rate() 函数的曲线越平缓。而 idelta()、irate() 的曲线总是很尖锐，不受 range 影响，接近瞬时值。
  - range 取值应该尽量大些，因为 range 过大时不影响 idelta()、irate() 的计算精度，但是 range 小于 scrape_interval 的两倍时会缺少数据点。
  - Prometheus 可能因为超时而漏采了一些点，此时如果用 idelta()、irate() 计算向量每隔 scrape_interval 时长的变化量，则误差较大。

- 例：假设 scrape_interval 为 30s ，指标 http_requests_count 在 2m 时间内采样了 4 个数据点，取值依次为 3、6、9、12 ，进行以下函数计算：
  - `delta(http_requests_count[1m])` 计算结果中，每个数据点的值都为 6 。
  - `idelta(http_requests_count[1m])` 计算结果中，每个数据点的值都为 3 。
  - `increase(http_requests_count[1m])` 计算结果中，每个数据点的值都为 6 。
  - `rate(http_requests_count[1m])` 计算结果中，每个数据点的值都为 0.1 。
  - `irate(http_requests_count[1m])` 计算结果中，每个数据点的值都为 0.1 。

- 例：假设 scrape_interval 为 30s ，指标 http_requests_count 在 2m 时间内采样了 4 个数据点，取值依次为 3、1、2、5 ，进行以下函数计算：
  - `delta(http_requests_count[30s])` 计算结果为空，因为 30s 时间内包含的数据点少于 2 个，不能计算差值。
  - `delta(http_requests_count[50s])` 计算结果显示的图像不连续。因为 50s 时间内，有时包含 2 个数据点，就有图像；有时包含 1 个数据点，就没有图像。
  - `delta(http_requests_count[1m])` 计算结果中，第 4 个数据点的值为 (5-2)/30*60=6 ，该值受 extrapolation 影响。
  - `delta(http_requests_count[90s])` 计算结果中，第 4 个数据点的值为 (5-1)/60*90=6 ，该值受 extrapolation 影响。

### 聚合函数

- 如果向量包含多个时间序列，用算术函数会分别对这些时间序列进行运算，而用聚合函数会将它们合并成一个或多个时间序列。
- 向量可以使用以下聚合函数：
  ```sh
  # 基本统计
  count(go_goroutines)                  # 返回每个采样时刻处，该向量的数据点的数量（即包含几个时间序列）
  count_values("value", go_goroutines)  # 返回每个采样时刻处，各种值的数据点的数量，并按 {value="x"} 的命名格式生成多个时间序列
  sum(go_goroutines)                    # 返回每个采样时刻处，所有数据点的总和（即将曲线图中所有曲线叠加为一条曲线）
  min(go_goroutines)                    # 返回每个采样时刻处，数据点的最小值
  max(go_goroutines)                    # 返回每个采样时刻处，数据点的最大值
  avg(go_goroutines)                    # 返回每个采样时刻处，数据点的平均值

  # 高级统计
  stddev(go_goroutines)                 # 返回每个采样时刻处，数据点之间的标准差
  stdvar(go_goroutines)                 # 返回每个采样时刻处，数据点之间的方差
  topk(3, go_goroutines)                # 返回每个采样时刻处，最大的 3 个数据点
  bottomk(3, go_goroutines)             # 返回每个采样时刻处，最小的 3 个数据点
  quantile(0.5, go_goroutines)          # 返回每个采样时刻处，大小排在 50% 位置处的数据点

  # 修改数据点的值
  last_over_time(go_goroutines[1m])     # 返回每个采样时刻处，过去 1m 内最新数据点的值
  group(go_goroutines)                  # 将每个数据点的取值置为 1
  sgn(go_goroutines)                    # 判断每个数据点取值的正负。如果为正数、负数、0 ，则分别置为 1、-1、0
  clamp(go_goroutines, 0, 10)           # 限制每个数据点取值的最小值、最大值，语法为 clamp(vector, min, max)
  clamp_min(go_goroutines, 0)           # 限制最小值
  clamp_max(go_goroutines, 10)          # 限制最大值
  ```
  - 聚合函数默认不支持输入有限时间范围内的向量，需要使用带 `_over_time` 后缀的函数，如下：
    ```sh
    sum_over_time(go_goroutines[1m])    # 返回每个采样时刻处，过去 1m 内数据点的总和（分别计算每个时间序列）
    avg_over_time(go_goroutines[1m])    # 返回每个采样时刻处，过去 1m 内的平均值
    ```
  - 聚合函数可以与关键字 by、without 组合使用，如下：
    ```sh
    sum(go_goroutines) by(job)          # 将所有曲线按 job 标签的值分组，分别执行 sum() 函数
    sum(go_goroutines) without(job)     # 将所有曲线按除了 job 以外的标签分组，分别执行 sum() 函数
    sum(go_goroutines) by(Time)         # Time 是隐式 label ，这里相当于 sum(go_goroutines)
    ```

## evaluator

- 下面分析 Prometheus [源代码](https://github.com/prometheus/prometheus/blob/main/promql/engine.go) 中，执行 PromQL 查询表达式的主要逻辑：
    ```go
    // 每次执行一个查询表达式时，就创建一个 evaluator 对象，用于记录该查询的元数据
    type evaluator struct {
        ctx context.Context

        // 记录 HTTP 查询请求中的 start、end、step 参数
        // 如果 startTimestamp 等于 endTimestamp ，则查询的是 instant vector ，否则是 range vector
        startTimestamp int64
        endTimestamp   int64
        interval       int64

        maxSamples               int            // Prometheus 默认配置了 --query.max-samples=50000000 ，限制每次查询最多读取的 points 数量，避免内存开销过大
        currentSamples           int            // 记录当前查询读取的 points 数量
        logger                   log.Logger
        lookbackDelta            time.Duration  // Prometheus 默认配置了 --query.lookback-delta=5m
        samplesStats             *stats.QuerySamples
        noStepSubqueryIntervalFn func(rangeMillis int64) int64
    }

    // evaluator.eval() 函数用于执行一个查询表达式，返回其查询结果
    func (ev *evaluator) eval(expr parser.Expr) (parser.Value, storage.Warnings) {
        // 如果查询超时，或者被取消，则终止函数
        if err := contextDone(ev.ctx, "expression evaluation"); err != nil {
            ev.error(err)
        }

        // 计算在 [start, end] 时间范围内的 step 数量
        numSteps := int((ev.endTimestamp-ev.startTimestamp)/ev.interval) + 1

        // 根据查询表达式的类型，分别处理
        switch e := expr.(type) {

        // 处理各种函数
        case *parser.Call:
            call := FunctionCalls[e.Func.Name]
            if e.Func.Name == "timestamp" {
                ...
            }
            ...

        // 处理二进制类型的查询，比如运算符 and、or
        case *parser.BinaryExpr:
            ...

        // 读取 instant vector 类型的 points
        case *parser.VectorSelector:
            ...
            // 创建一个 Matrix 对象，它是一个长度为 len(e.Series) 的数组，用于暂存接下来读取到的 Series
            mat := make(Matrix, 0, len(e.Series))
            // 创建一个 it 迭代器，用于从 TSDB 读取 points 。迭代时会按 timestamp 递增的顺序获取 point
            it := storage.NewMemoizedEmptyIterator(durationMilliseconds(ev.lookbackDelta))
            var chkIter chunkenc.Iterator
            // 一个 vector 可能包含多个 time series ，因此遍历这些 time series ，分别处理
            for i, s := range e.Series {
                // 移动迭代器的指针，指向当前 time series 的 chunks ，然后便可从中读取 points
                chkIter = s.Iterator(chkIter)
                it.Reset(chkIter)
                // 创建一个 Series 对象，用于暂存接下来读取到的 points
                ss := Series{
                    Metric: e.Series[i].Labels(),
                }
                // 从 start 时刻开始，每隔 interval 即 step 时长读取一次当前 time series 的 point ，直到 end 时刻
                for ts, step := ev.startTimestamp, -1; ts <= ev.endTimestamp; ts += ev.interval {
                    step++
                    // 读取单个 time series 在 ts 时刻的 point
                    _, f, h, ok := ev.vectorSelectorSingle(it, e, ts)
                    // 如果成功读取到 ts 时刻的 point ，则暂存起来。如果没读取到，则继续下一轮循环，因此可能漏点
                    if ok {
                        // 如果当前读取的 points 数量超过 maxSamples 限制，则报错
                        if ev.currentSamples < ev.maxSamples {
                            // 如果 floats 数组为空，则需要初始化，创建一个长度为 numSteps 的数组
                            if ss.Floats == nil {
                                ss.Floats = getFPointSlice(numSteps)
                            }
                            // 将读取到的 point 追加到 floats 数组中
                            ss.Floats = append(ss.Floats, FPoint{F: f, T: ts})
                            ev.currentSamples++
                        } else {
                            ev.error(ErrTooManySamples(env))
                        }
                    }
                }
                // 如果该 Series 读取到至少一个 points ，则追加到 mat 数组中
                if len(ss.Floats) > 0 {
                    mat = append(mat, ss)
                }
            }
            ev.samplesStats.UpdatePeak(ev.currentSamples)
            // 返回 mat 数组，作为查询结果
            return mat, ws

        // 读取 range vector 类型的 points
        case *parser.MatrixSelector:
            if ev.startTimestamp != ev.endTimestamp {
                panic(errors.New("cannot do range evaluation of matrix selector"))
            }
            return ev.matrixSelector(e)

        // 处理子查询
        case *parser.SubqueryExpr:
            ...

        ...
    }
    ```

## 误差

- Prometheus 是离散采样，比如每隔 30s 采集一次监控指标，这与实时状态之间存在误差。而且 Prometheus 在执行查询表达式时，还可能增加误差。
- 如果用户想实现零误差的监控系统，比如电商计费，则建议记录所有事件的日志，然后搭建基于日志的监控系统，比如 ELK 。

### lookback

- 用户查询 Prometheus 时，通常是发送以下 HTTP 请求：
  ```sh
  GET   /api/v1/query?query=??&time=??
  ```
  - 理论上：用户查询 time 时刻处的监控指标，于是 Prometheus 将查询表达式转换成 label-value set ，从 TSDB 读取 points 。
  - 实际上：用户查询的 time 时刻处，不一定刚好采集了 point 。为了方便用户查询，Prometheus 采用 lookback 机制：取过去 `--query.lookback-delta=5m` 分钟，即时间范围 `[time-5m, time]` 内的最后一个 point ，当作 time 时刻的 point 。如果该时间范围内连一个 point 都不存在，则查询结果为空，此时称该 time series 已过时（stale），在最近没有采集 point 。
  - 以下是一个查询示例：
    ```sh
    GET   /api/v1/query?query=go_goroutines{instance='10.0.0.1:9090'}&time=1589241600
    {
        "status": "success",
        "data": {
            "resultType": "vector",
            "result": [
                {
                    "metric": {
                        "__name__": "go_goroutines",
                        "instance": "10.0.0.1:9090",
                        "job": "prometheus",
                    },
                    "value": [
                        # TSDB 中存储的 point.timestamp 不一定等于 query time ，但 Prometheus 返回查询结果时，会自动修改 point.timestamp ，对齐 query time
                        1589241600,
                        "7"
                    ]
                }
            ]
        }
    }
    ```
  - 如果用户查询的是 range vector ，则会发送 `/api/v1/query_range` 请求，不采用 lookback 机制。

- 评价 lookback 机制：
  - 优点：
    - 用户不必准确指定 time ，就能查询到 point 。
  - 缺点：
    - 增加了时间误差，用户查询到的 point 可能是几分钟之前的值。降低 scrape_interval 和 eval_interval 可减小该误差。
    - 当 Prometheus 停止采集一个 time series 之后（比如 target 下线），用户以最新时刻去查询，依然能查询到 point ，造成该 time series 依然被采集的假象。
      - 例如在 k8s 中删除一批 pod 又重建，然后查询 `count(kube_pod_info)` 统计 pod 总数，会将 5m 内已删除的 pod 也统计进来，导致总数虚高。
      - 为了解决该问题，Prometheus 2.0 引入了 StaleNaN 标记。

- 关于 StaleNaN 标记。
  - Prometheus 定义了以下常量：
    ```go
    NormalNaN uint64 = 0x7ff8000000000001   // 表示算术运算中的 NaN
    StaleNaN uint64 = 0x7ff0000000000002    // 表示 time series 已过时
    ```
  - 如果 Prometheus 上一次 scrape 采集到了某个 time series 的 point ，下一次 scrape 却没采集到该 time series ，则给该 time series 追加一个取值为 StaleNaN 的 point ，表示该 time series 已过时。
  - 当用户查询 instant vector 时，如果过去 5 分钟内的最后一个 point 的值为 StaleNaN ，则不采用 lookback 机制，返回的查询结果为空。
  - 当用户查询 range vector 时，会忽略取值为 StaleNaN 的 point ，不包含在查询结果中。

- [相关源代码](https://github.com/prometheus/prometheus/blob/main/promql/engine.go) ：
    ```go
    // 该函数用于读取单个 time series 在 ts 时刻的 point
    func (ev *evaluator) vectorSelectorSingle(it *storage.MemoizedSeriesIterator, node *parser.VectorSelector, ts int64) (
        int64, float64, *histogram.FloatHistogram, bool,
    ) {
        // 表面上查询时刻是 ts ，但查询表达式中可能有 offset ，因此需要计算实际的查询时刻 refTime
        refTime := ts - durationMilliseconds(node.Offset)
        var t int64
        var v float64
        var h *histogram.FloatHistogram

        // Seek() 函数会移动迭代器的指针，指向 timestamp 大于等于 refTime 的第一个 point ，并返回当前 point 的 ValueType 。如果未找到 point ，则返回 ValNone
        valueType := it.Seek(refTime)
        switch valueType {
        case chunkenc.ValNone:          // 如果未找到 point ，则检查：可能是因为该时刻不存在 point ，也可能时因为读取 TSDB 失败而报错
            if it.Err() != nil {
                ev.error(it.Err())
            }
        case chunkenc.ValFloat:         // 如果找到 float 类型的 point ，则获取其 timestamp、value
            t, v = it.At()
        case chunkenc.ValFloatHistogram:
            t, h = it.AtFloatHistogram()
        default:
            panic(fmt.Errorf("unknown value type %v", valueType))
        }
        // 如果 it.Seek(refTime) 未找到 point ，则通过 it.PeekPrev() 读取最后一个 point
        // 如果 it.Seek(refTime) 找到了 point ，但其 timestamp 大于 refTime ，则通过 it.PeekPrev() 读取前一个 point （时间戳更小）
        if valueType == chunkenc.ValNone || t > refTime {
            var ok bool
            t, v, h, ok = it.PeekPrev()
            // 如果 it.PeekPrev() 未找到 point ，则查询结果为空
            // 如果 it.PeekPrev() 找到了 point ，但其 timestamp 与 refTime 的差值超过 lookbackDelta ，则不采用 lookback 机制，查询结果为空
            if !ok || t < refTime-durationMilliseconds(ev.lookbackDelta) {
                return 0, 0, nil, false
            }
        }
        // 如果 it.Seek(refTime) 找到了 point ，但取值为 StaleNaN ，则查询结果为空
        if value.IsStaleNaN(v) || (h != nil && value.IsStaleNaN(h.Sum)) {
            return 0, 0, nil, false
        }
        return t, v, h, true
    }
    ```

### extrapolation

- delta()、increase()、rate() 是数学里常见的函数，但 Prometheus 是离散采样，实现它们存在一定难度、误差。

- 问题：用户查询 range vector 时，时间范围 range 过小
  - 假设 scrape_interval 为 30s ，查询 `delta(http_requests_count[20s])` 。考虑到查询时刻 t0 的不同，在 `[t0-20s, t0]` 时间范围内，有时不存在 point ，有时只存在一个 point ，因此 delta() 计算结果总是为空。
  - 假设 scrape_interval 为 30s ，查询 `delta(http_requests_count[40s])` 。考虑到查询时刻 t0 的不同，在 `[t0-40s, t0]` 时间范围内，有时存在一个 point ，因此 delta() 计算结果为空；有时存在两个 point ，因此 delta() 计算结果非空。最终绘制的时间曲线不连续，某些时刻不存在图像，某些时刻存在图像。
  - 为了解决这种问题，建议用户用 delta()、rate() 等函数计算 range vector 时，将时间范围 `[range]` 至少配置为 scrape_interval 的两倍，否则在过去 range 时长内的 point 可能少于 2 个，导致函数计算结果为空。
  - 另外，range vector 的时间范围 `[range]` 可改为 `[range:step]` 的格式，例如 `delta(http_requests_count[40s:1s])` 。
    - 这会先从 TSDB 读取原始采样的 points ，然后根据它们的值，在内存中以 1s 的时间间隔创建一组虚拟 points ，最后用这些虚拟 points 进行 `delta(http_requests_count[40s])` 运算。
    - 优点：可将相邻 point 的时间间隔从 scrape_interval 改为自定义间隔，避免在过去 range 时长内的 point 少于 2 个。
    - 缺点：可能增加 extrapolation 的误差。

- 问题：用户查询 range vector 时，时间范围 range 过大
  - 假设 scrape_interval 为 30s ，查询 `delta(http_requests_count[70s])` ，此时不能找到相距 70s 的两个 points ，如何计算 70s 时长内的差值？
  - 为了解决这种问题，Prometheus 采用外推（extrapolation）机制：先计算向量在 30s 时长内的差值，然后按时间比例放大，得到 70s 时长内的差值。
  - 实际上，用户查询 range vector 时，不管时间范围 range 是否为 scrape_interval 的整数倍，Prometheus 总是会采用 extrapolation 机制。

- 例：假设 scrape_interval 为 30s ，指标 http_requests_count 采样的一组 points 取值为 20、30、50、40 。
  - 如果查询 `delta(http_requests_count[1m])` ，则最后一个 scrape_interval 的差值为 40-50=-10 。然后 extrapolate ，得到过去 1m 时间内的差值为 -10/30*60=-20 。
  - 如果查询 `increase(http_requests_count[1m])` ，则最后一个 scrape_interval 的差值为 40-50 ，叠加 Counter Reset 之前的值 50 ，得到增量为 40-50+50=40 。然后 extrapolate ，得到过去 1m 时间内的增量为 40/30*60=80 。
  - 如果查询 `rate(http_requests_count[2m])` ，则过去 90s 时间内的增长率为 (40-20+50)/90≈0.78 。然后 extrapolate ，将它视作过去 2m 时间内的增长率。

- 评价 extrapolation 机制：
  - 优点：
    - 用户使用 delta()、increase()、rate() 函数时，可自由调整 range 的大小，方便统计分析。
    - 即使 Prometheus 漏采了少量数据点，也能使用 delta()、increase()、rate() 函数绘制图像。即使未来几分钟的监控指标尚未采集，也能绘制图像，实现预测。
  - 缺点：
    - 如果原指标的值不是匀速变化的，则 range/scrape_interval 比例越小，函数计算结果的误差越大。[相关 Issue](https://github.com/prometheus/prometheus/issues/3746)
    - 即使原指标的值为整数，但受到 extrapolation 的影响，函数计算结果也可能包含小数。
  - 如果用户担心 extrapolation 的误差，可采取以下措施：
    - 增加 range 或减小 scrape_interval ，从而增加 range/scrape_interval 比例，能减小 extrapolation 误差。
    - 改用 idelta()、irate() 函数，能避免 extrapolation 误差，但只能计算每隔 scrape_interval 时长的变化量，不能通过修改 `[range]` 来监控 1m、5m 等时间间隔。
  - [相关博客](https://www.doit.com/making-peace-with-prometheus-rate/)

- [相关源代码](https://github.com/prometheus/prometheus/blob/main/promql/functions.go) ：
  ```go
  func extrapolatedRate(vals []parser.Value, args parser.Expressions, enh *EvalNodeHelper, isCounter, isRate bool) Vector {
      ms := args[0].(*parser.MatrixSelector)    // 当前 matrix 的查询条件
      vs := ms.VectorSelector.(*parser.VectorSelector)
      var (
          points    = vals[0].(Matrix)[0]      // 读取 range 时长内采样的全部数据点，保存为一个数组
          rangeStart = enh.Ts - durationMilliseconds(ms.Range+vs.Offset)  // range 的开始时刻，等于查询时刻减去 Range、Offset
          rangeEnd   = enh.Ts - durationMilliseconds(vs.Offset)           // range 的结束时刻
          resultFloat float64                   // 记录该函数的计算结果，可能是差值、增长率、增量三种类型
          firstT, lastT      int64
          numSamplesMinusOne int
      )

      // 如果采样的数据点少于 2 个，则不能计算差值，结束执行该函数
      if len(samples.Floats) < 2 {
          return enh.Out
      }

      // 计算指标差值
      numSamplesMinusOne = len(samples) - 1
      first_sample = samples[0]                            // 采样的第一个数据点
      last_sample = samples[numSamplesMinusOne]            // 采样的最后一个数据点
      resultFloat = last_sample.Value - first_sample.Value

      // 以上的 resultFloat 只是计算首尾两个数据点的差值，满足了 delta() 函数的需求。但 increase()、rate() 函数用于处理 Counter 类型的指标，需要考虑 Counter Reset 的情况
      // 如果指标为 Counter 类型，则遍历所有数据点的 value 。如果当前 value 小于 prevValue ，则认为发生了一次 Counter Reset ，为了补偿 resultFloat ，给它叠加 prevValue
      if isCounter {
          prevValue := samples[0].Value
          for _, currPoint  := range samples[1:] {
              if currPoint .Value < prevValue {
                  resultFloat += prevValue
              }
              prevValue = currPoint.F
          }
      }

      // 计算 extrapolation 阈值
      sampledInterval := last_sample.Time - first_sample.Time               // 采样的时长
      averageDurationBetweenSamples := sampledInterval / numSamplesMinusOne // 数据点之间的平均采样间隔，通常等于 scrape_interval 。如果漏采了一些点，则会大于 scrape_interval
      extrapolationThreshold := averageDurationBetweenSamples * 1.1         // 触发 extrapolation 的阈值
      extrapolateToInterval := sampledInterval

      // 如果数据点距离 rangeStart、rangeEnd 较近，则将 sampledInterval 时长内的指标差值，按时间比例放大，视作 extrapolateToInterval 时长内的指标差值
      // 如果距离超过 extrapolationThreshold 阈值（大概为 1.1 倍 scrape_interval ），则只放大少量时间（大概为 0.5 倍 scrape_interval ）。否则只采集了 1m 时间的指标，却可以计算 1h 时间的增量，误差很大，不可信
      durationToStart := first_sample.Time - rangeStart   // 第一个数据点距离 rangeStart 的时长
      durationToEnd   := last_sample.Time - rangeEnd      // 最后一个数据点距离 rangeEnd 的时长
      if durationToStart < extrapolationThreshold {
          extrapolateToInterval += durationToStart
      } else {
          extrapolateToInterval += averageDurationBetweenSamples / 2
      }
      if durationToEnd < extrapolationThreshold {
          extrapolateToInterval += durationToEnd
      } else {
          extrapolateToInterval += averageDurationBetweenSamples / 2
      }

      // 按时间比例放大 resultFloat
      factor := extrapolateToInterval / sampledInterval
      resultFloat *= factor

      // 如果正在执行 rate() 函数，则将差值除以时长，得到增长率
      if isRate {
          resultFloat /= sampledInterval
      }

      ...
  }

  // delta() 函数调用 extrapolatedRate() 时会声明 isCounter=false, isRate=false
  func funcDelta(vals []parser.Value, args parser.Expressions, enh *EvalNodeHelper) Vector {
      return extrapolatedRate(vals, args, enh, false, false)
  }

  func funcRate(vals []parser.Value, args parser.Expressions, enh *EvalNodeHelper) Vector {
      return extrapolatedRate(vals, args, enh, true, true)
  }

  func funcIncrease(vals []parser.Value, args parser.Expressions, enh *EvalNodeHelper) Vector {
      return extrapolatedRate(vals, args, enh, true, false)
  }
  ```
  - delta()、increase()、rate() 函数在底层都是调用 extrapolatedRate() 函数，从而计算差值、增量、增长率。
  - delta() 函数只需要计算首尾两个数据点的差值，而 increase()、rate() 函数需要遍历所有数据点的值，开销更大。
