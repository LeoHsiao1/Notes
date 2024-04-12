# CPU调度

- 操作系统中，通常有大量程序同时申请使用 CPU ，如何决定让哪个程序使用 CPU 、使用多长时间？为了解决该问题，通常引入 CPU 调度算法（scheduling algorithm）。
  - 本文分析 CPU 只有 1 个核心时，如何调度。如果 CPU 有多个核心，则需要分别进行调度，问题更复杂些。
  - 类似地，GPU、网卡等资源也可能被多个程序竞争使用，可采用类似的调度算法。

## 任务

- POSIX 规定以线程（thread）为单位进行 CPU 调度，不过 Linux 内核中的可调度实体是进程，又称为任务（task）。
  - 因此分析 Linux 的 CPU 调度时，可能提到进程、线程、任务三个概念，本质上都是 Linux 进程，用 task_struct 表示。

- 线程是 CPU 调度的基本单位。
  - 从程序的角度来看，启动程序时需要创建至少一个进程，每个进程包含至少一个线程，从而控制该程序的运行状态。
  - 从操作系统的角度来看，决定哪些内存资源给哪个程序使用时，是以进程为单位调度。决定哪些 CPU 资源给哪个程序使用时，是以线程为单位调度。
  - 从 CPU 的角度来看，主要关心操作系统让它执行什么任务。可能一会执行线程 A 的指令流，一会执行线程 B 的指令流。

- 每个任务使用 CPU 时，有几种状态：
  - ready ：调用系统接口，请求使用 CPU 。然后阻塞等待，直到轮到它开始使用 CPU 。
    - 通常有多个任务同时请求使用 CPU ，操作系统会将这些 ready 状态的任务放在一个队列中，称为 ready 队列。每次取出一个任务，交给 CPU 执行。
    - 如果一个任务退出 ready 状态，比如进程终止、sleep、iowait，则将该任务从 ready 队列删除。
  - running ：正在使用 CPU 。
  - blocked ：任务暂停运行，直到某一条件满足时才继续使用 CPU 。例如等待磁盘 IO 完成。
  - finished ：该任务执行完毕，被删除。

- 相关的几个时间指标：
  - Arrival Time ：任务刚刚进入 ready 队列的时刻。
  - Completion Time ：任务刚刚执行完毕的时刻。
  - Turn Around Time（周转时间）：从 Arrival Time 到 Completion Time 的时长，表示该任务等了多久才执行完。
    - Turn Around Time 分为两部分：
      - Waiting Time ：任务在 ready 队列中等待的时长。
      - Burst Time ：任务被 CPU 执行的时长。
    - 通常一个任务执行完之后，才能知道其 Turn Around Time 时长。不过周期性任务的时长可以预知。

## 调度算法

### 分类

- 根据能否同时开始多个任务，对调度算法分类：
  - 串行工作（Serial）
    - ：同时只能开始、执行一个任务，执行完之后才能执行下一个任务。
  - 并行工作（Parallel）
    - ：同时开始、执行多个任务。
    - 例如多个线程，可以同时运行在 CPU 的不同核心上，每个核心在串行工作。
  - 并发工作（Concurrent）
    - ：同时只能执行一个任务，但可以同时开始多个任务，交替执行，从而看起来像同时执行。
    - 例如多个线程，可以交替运行在 CPU 的同一核心上。
    - 如何确定多个任务的执行顺序？通常是给每个任务设置一个优先级数值，数值越大则优先执行。

- 根据能否抢占 CPU ，对调度算法分类：
  - 抢占式调度（Preemptive Scheduling）
    - ：允许一个任务正在使用 CPU 时，被其它任务打断（通常是因为其它任务的优先级更高），抢走 CPU 的使用权。
    - 此时，发生了 CPU 上下文切换。抢占者的 context ，从 ready 队列移动到 CPU 寄存器。被抢占者的 context ，从 CPU 寄存器移动到 ready 队列。
    - 这实现了并发工作。
    - 如果一个任务主动放弃使用 CPU ，比如阻塞，则不属于抢占式调度。
    - 静态调度、动态调度都可能允许抢占式调度。
  - 非抢占式调度（Non-Preemptive Scheduling）

- 根据能否改变调度结果，对调度算法分类：
  - 静态调度
    - ：事先安排所有任务的执行顺序、执行时间，不能变化。
  - 动态调度
    - ：可以改变调度结果。
    - 优点：能适应环境的变化。例如出现重要任务时，优先执行。
    - 缺点：运行时需要动态决策，开销更高。

- 根据能否改变任务的优先级，对调度算法分类：
  - 静态优先级
    - ：每个任务在开始之前，优先级就已设定，不能变化。
  - 动态优先级
    - ：每个任务在运行时，优先级可以变化。

- 根据 CPU 调度算法的类型，将操作系统分为几类：
  - 批处理系统（Batch Processing System）
    - 特点：串行工作，先提交一批任务，然后等待 CPU 执行完毕。
    - 优点：原理简单。
    - 缺点：不能优先执行重要任务。
    - 常用的调度算法：FCFS、SJF
  - 实时系统（Real Time Operating System，RTOS）
    - 特点：
      - 抢占式调度
      - 实时性
        - ：并发工作，尽量让每个任务都在一定时间内（通常为毫秒级）执行完毕。
        - 细分为两种实时性：
          - 硬实时：如果超过时间，则任务失败。
          - 软实时：允许不实时，只是服务降级。
        - 优点：及时性、可靠性更好，适合交通、军事等严格要求的场景。
      - 精简
        - ：RTOS 常用于嵌入式设备，可以精简到几 MB 。
        - 有的嵌入式设备采用 Linux 系统，因为功能比 RTOS 更多。
    - 常用的调度算法：EDF、RMS
    - RTOS 系统举例：
      - FreeRTOS
      - RT-Thread
      - VxWorks
      - RTLinux
  - 分时系统（Time Sharing System）
    - 特点：并发工作，将 CPU 可用时长分割成大量时间片段（比如以 10ms 为单位），然后决定每个时间片段分配给哪个任务使用。
    - 优点：每个任务或多或少都能使用 CPU ，比较公平。
    - 缺点：CPU 经常切换执行不同的任务，增加了开销。

### 关于排序

- FCFS（First Come First Serve，先来先服务）
  - 原理：
    1. 事先知道每个任务的 Arrival Time ，从小到大排序。
    2. 每执行完一个任务，就从 ready 队列取出 Arrival Time 最早的一个任务，执行它。
        - 换句话说，以 FIFO（First In First Out，先入先出）的方式取出 ready 队列中的任务。
  - 特点：
    - 非抢占式调度
    - 静态调度
  - 优点：
    - 最简单的算法，容易实现。
  - 缺点：
    - 几乎不控制 CPU 调度过程，功能、性能不如其它算法。
    - 串行工作。排序越靠后的任务，Waiting Time 越久。

- SJF（Shortest Job First，最短任务优先）
  - 原理：
    1. 事先知道每个任务的 Burst Time 。
    2. 每执行完一个任务，就从 ready 队列取出 Burst Time 最小的一个任务，执行它。
        - 如果 Burst Time 最小的任务有多个，如何决策？可以采用 FCFS、RR 等算法。
  - 特点：
    - 非抢占式调度
    - 静态调度
  - 优点：
    - 虽然是串行工作，但 SJF 是使所有任务的平均 Waiting Time 最小的算法，因此平均 Turn Around Time 也最小。
  - 缺点：
    - 难以实现。因为难以事先知道每个任务的 Burst Time 。
    - 公平性差。排序靠后的那部分任务，会饥饿，甚至饿死。

- SRTF（Shortest Remaining Time First，最短剩余时间优先）
  - 原理：
    1. 每隔一段时间，统计每个任务的 Remaining Time 。
        - Remaining Time 表示一个任务还需要被 CPU 执行多久，其值等于 Burst Time 减去已被 CPU 执行的时长。
    2. 每隔一段时间，从所有任务中，找出 Remaining Time 最小的那个任务，执行它。
  - 特点：
    - 抢占式调度
    - 动态调度
  - SRTF 是 SJF 算法的改进版，允许抢占式调度。
    - 假设 CPU 执行任务 A 时，新增一个 Waiting Time 更小的任务 B 。如果仅仅比较 Waiting Time ，就让 CPU 切换执行任务 B ，则没考虑到一种情况：任务 A 可能 Remaining Time 更短，就快执行完了。因此 SJF 不适合抢占式调度。
    - SRTF 是比较所有任务的 Remaining Time ，判断谁能更快执行完毕，因此更合理。

- LJF（Longest Job First，最长任务优先）
  - 原理：与 SJF 相反，是执行 Burst Time 最长的一个任务。
  - 缺点：
    - 容易增加所有任务的平均 Waiting Time 、Turn Around Time 。
    - 公平性差。排序靠后的那部分任务，会饥饿，甚至饿死。
    - 吞吐量极低。

- LRTF（Longest Remaining Time First，最长剩余时间优先）
  - 原理：与 SRTF 相反，是执行 Remaining Time 最长的一个任务。
  - LRTF 是 LJF 算法的改进版，允许抢占式调度。

- HRRN（Highest Response Ratio Next，最高响应率优先）
  - 原理：
    1. 每隔一段时间，统计每个任务的 Response Ratio 。
        - Response Ratio 表示一个任务等待的程度，计算公式为 `(Waiting Time / Burst Time) + 1` 。
    2. 每隔一段时间，从所有任务中，找出 Response Ratio 最大的那个任务，执行它。并且不允许抢占式调度。
  - 特点：
    - 非抢占式调度
    - 动态调度
  - 优点：HRRN 是 SJF 算法的改进版，提高了公平性。
    - 大部分情况下，一个任务的 Burst Time 越小，则 Response Ratio 越大。此时 SJF 与 HRRN 的效果相同。
    - 少部分情况下，一个 Burst Time 较小但不是最小的任务，可能长时间等待执行。此时 SJF 会导致该任务越来越饥饿，而 HRRN 能发现并执行这个饥饿的任务。
  - 缺点：
    - 难以实现。因为难以事先知道每个任务的 Burst Time 。

- EDF（Earliest Deadline First，最早截止时间优先）
  - 原理：
    1. 每隔一段时间，统计每个任务的 Deadline 。比如任务 A ，希望在时刻 t 之前被执行完毕，超时则可能导致任务失败、任务降级。
    2. 每隔一段时间，从所有任务中，找出 Deadline 最早的那个任务，执行它。
  - 特点：
    - 抢占式调度
    - 动态调度
  - 优点：
    - 容易提高 CPU 使用率。如果 CPU 使用率低于 100% ，则说明所有任务都被及时完成，实现了 schedulable 。
    - 公平性好。不管一个任务是否重要，当它即将超时时，都会被优先执行。
    - 实时性好。尽量让每个任务都在一定时间内（通常为毫秒级）执行完毕。
  - 缺点：
    - 如果 CPU 使用率超过 100% ，负载过大，则依然会尽量执行每个即将超时的任务，结果这些任务可能全部超时。不如放弃执行一些次要任务，减轻 CPU 负载。

- PS（Priority Scheduling，优先级调度）
  - 原理：
    1. 事先给每个任务设定一个 Priority 数值，表示优先级。
    2. 每隔一段时间，从所有任务中，找出 Priority 最大的那个任务，执行它。
        - 如果 Priority 最大的任务有多个，如何决策？可以采用 FCFS、RR 等算法。
        - 如果 CPU 执行一个任务时，新增一个 Priority 更大的任务，则切换执行新任务。
  - 特点：
    - 抢占式调度
    - 动态调度
  - 优点：
    - 算法简单，容易实现。
    - 可控性好。可以人工调整每个任务的 Priority ，从而区分重要任务、次要任务。
  - 缺点：
    - 人工调整 Priority 比较麻烦。
    - 公平性差。Priority 较低的那部分任务，会饥饿，甚至饿死。

### 关于循环

- RMS（Rate Monotonic Scheduling，速率单调调度）
  - 原理：
    1. 事先知道每个任务的执行周期。
    2. 周期越短的任务（或者说执行频率越高），会被优先执行。
  - 特点：
    - 抢占式调度
    - 静态调度
  - 例：
    - 假设任务 A 平均每隔 10ms 使用 1 单位时长的 CPU ，任务 A 平均每隔 20ms 使用 1 单位时长的 CPU 。则任务 A 的优先级更高。
    - 当任务 A 执行完毕之后，剩余的 CPU 时长才可以分配给任务 B 。如果没有任务需要执行，则 CPU 处于空闲状态。
    - 当任务 A 需要使用 CPU 时，如果 CPU 正在被任务 B 使用，则任务 A 可以抢占式调度。
  - 优点：
    - 处理周期性任务时，RMS 是最高效的算法。
    - 容易预测调度结果，比如预测这组任务是否 schedulable 。
  - 缺点：
    - 难以处理非周期性任务。

- RR（Round Robin，循环赛）
  - 原理：
    1. 将 CPU 可用时长分割成大量时间片段（time slice）。每个时间片段是 CPU 时钟周期的数倍，比如 10ms 。
    2. 将所有任务按 FCFS 算法排序。每个任务使用 CPU 一个时间片段，然后轮到下一个任务。
    3. 执行一轮所有任务，就完成了一次循环周期。
  - 特点：
    - 抢占式调度。每个任务最多使用 CPU 一个时间片段，就会切换执行下一个任务。
  - 优点：
    - 公平性很好。
  - 缺点：
    - 如果循环周期太长，则效果接近 FCFS 算法。
    - 如果循环周期太短，则会频繁发生 CPU 上下文切换，导致平均 Turn Around Time 大，吞吐量低。

- CFS（Completely Fair Scheduler，完全公平调度）
  - 这是 Linux 引入的一种调度算法，核心理念是给每个任务分配公平的 CPU 时长。
  - 像 RR 算法，CFS 算法存在循环周期，但周期长度是可变的。
    - 变量 sched_latency 表示循环周期，单位为纳秒。在每个周期内，会将每个任务都执行一次。
    - 变量 sched_min_granularity 表示在每个周期内，给每个任务至少分配多少 CPU 时长（比如 1ms）。
      - 如果一个任务正在占用 CPU ，且时长不足 sched_min_granularity ，则禁止被抢占式调度，以免频繁发生上下文切换。
    - 变量 sched_nr_latency 表示在每个周期内，理论上最多运行多少个任务，才能满足 sched_min_granularity 条件。
    - 如果任务数量增加，则自动延长周期。源代码如下：
      ```c
      static u64 __sched_period(unsigned long nr_running)
      {
        // 如果当前的任务总数 nr_running ，超过了 sched_nr_latency ，则延长 sched_latency
        // unlikely() 是一个宏定义，表示该条件表达式小概率为 true ，有助于编译器进行 if 分支预测
        if (unlikely(nr_running > sched_nr_latency))
          return nr_running * sysctl_sched_min_granularity;
        else
          return sysctl_sched_latency;
      }
      ```

  - 每个周期内，RR 算法是给每个任务分配相等的 CPU 时间片段，而 CFS 算法是按权重比例分配 CPU 时长，从而区分重要任务。
    - 给每个任务添加一个 weight 属性（从 nice 谦让值换算而来），表示该任务的权重。
    - 每个 sched_latency 周期内，每个任务分配的 CPU 时长等于 `timeslice = (weight / total_weight) * sched_latency` 。
    - 权重更大的任务，会被分配更多 CPU 时长。但每个周期内，每个任务或多或少都能使用 CPU ，比较公平。

  - 每个周期内，RR 算法是按 FCFS 顺序执行所有任务，而 CFS 算法是根据 vruntime 动态排序。
    - 给每个任务添加一个 vruntime 属性，表示该任务的虚拟运行时长，单位为纳秒。
    - 一个任务每使用 CPU 一段时间，其 vruntime 就增长一些。
    - 每次 CPU 调度时，选取 ready 队列中 vruntime 最小的那个任务来执行。
    - 因此，虽然每个周期内，每个任务都会被执行一次，但 vruntime 更小的任务，会更早被执行。

  - 为了提高 vruntime 排序的效率，CFS 算法使用红黑树（rbtree）的数据结构。将所有任务按 vruntime 大小进行排序，使得 vruntime 最小的任务位于 rbtree 最左端。
    - 读取、插入 rbtree 的时间复杂度为 O(log n) 。
    - 将 rbtree 中 vruntime 的最小值，记录在 min_vruntime 变量中。

  - 一个任务的 vruntime ，不一定等于其 Burst Time ，因为 vruntime 的值可能被算法调整，这是为了解决以下问题：
    - 假设一个重要任务，设置了很大的 weight 值，从而分配很多 CPU 时长。但它的 vruntime 增长量也很大，导致这个重要任务排序靠后，可能被耽误，怎么办？
      - 每当一个任务退出 CPU 时，按比例缩放其实际执行时长 delta_exec ，算法为 `curr->vruntime += delta_exec * NICE_0_LOAD / curr->load.weight` 。
      - 因此，如果一个任务的 weight 很大，则可能每个周期占用很多 CPU 时长，还把 vruntime 伪装得很小，从而排序靠前。

    - 假设新建一个任务时，将其 vruntime 赋值为 0 。而其它任务由于长时间运行，vruntime 取值大。此时新任务能长时间占用 CPU ，直到 vruntime 增长追上其它任务。这对其它任务不公平，怎么办？
      - 将新任务的 vruntime 赋值为 min_vruntime 。使得它会立即占用 CPU ，但不能占用太长时间。

    - 假设一个任务因为 iowait、sleep 等原因退出 ready 队列，一段时间之后重新进入 ready 队列。此时该任务的 vruntime 由于一段时间没有增长，比其它任务小很多，不公平。怎么办？
      - 当任务退出 ready 队列时，对其执行 `vruntime -= min_vruntime` 。
      - 当任务重进 ready 队列时，对其执行 `vruntime += min_vruntime` 。从而恢复该任务在 rbtree 中的排序。

  - 优点：
    - 比 RR 算法更灵活，可以改变循环周期的长度，可以通过 weight 区分重要任务。
    - 比 RR 算法的 Waiting Time 更小。因为 vruntime 更小的任务，会被更早执行，减少了饥饿。例如 IO 密集型任务的 vruntime 较小。

### 关于多队列

- MQS（Multiple Queue Scheduling，多队列调度）
  - 原理：
    1. 划分多个 ready 队列，分别用于存放不同类型的任务。
    2. 每个队列可能包含多个任务，按任一算法，决定当前执行哪个任务。
    3. 多个队列可能同时申请使用 CPU ，按任一算法，决定当前执行哪个队列。此时每个队列相当于一个大型任务。
  - 例：
    - 队列 1 用于存放重要任务，采用 EDF 算法。
    - 队列 2 用于存放次要任务，采用 FCFS 算法。
    - 多个队列之间，采用 RR 等算法。
  - 优点：
    - 可以组合使用多种算法，兼具它们的优点。
    - 可控性好。可以让不同任务，采用不同算法。

- MLFQ（Multilevel Feedback Queue Scheduling，多级反馈队列调度）
  - 1960 年代，麻省理工学院的教授 Corbató 发明了 MLFQ 算法，他是研发分时操作系统的先驱。
  - 原理：
    1. 每个队列内部，可以采用任一算法。
        - 例如优先级高的队列采用 FCFS 算法，优先级低的队列采用 RR 算法。
    2. 多个队列之间，采用 PS 算法。
        - 因此，当优先级高的队列为空时，优先级低的队列才能执行。
    3. 引入了反馈机制：监控每个任务在当前队列的调度效果，如果效果不好，则可以移动到新队列。例如：
        - 新增一个任务时，通常加入优先级最高的那个队列。
        - 如果一个任务已发生了较长的 Burst Time ，却依然没执行完毕，则移动到优先级更低的队列。这样，一个任务可能先后加入队列 1 、队列 2、队列 3 ，优先级依次降低。
        - 如果一个任务已发生了较长的 Waiting Time ，越来越饥饿，则进行老化，移动到优先级更高的队列。
        - 如果一个任务属于 IO 密集型（需要及时读写数据），或交互式任务，则移动到优先级更高的队列。
  - MLFQ 算法是 MQS 算法的改进版。
    - MQS 算法中，每个任务被分配到某个队列之后，就不能移动到其它队列。
    - 而 MLFQ 算法通过反馈机制，改变每个任务所属的队列。
  - 特点：
    - 抢占式调度
    - 动态调度
    - 动态优先级。改变任务所属的队列时，既改变了调度算法，又改变了优先级。
  - 优点：
    - 很灵活，可实现复杂的调度逻辑。
  - 缺点：
    - 算法复杂，调度开销大。
    - 大幅增加了 CPU 上下文切换。

### 评价

- 上文介绍了几种 CPU 调度算法。但没有全能的算法，需要根据计算机的实际工作情况，选择一个合适的算法。需要从多个方面评价一个算法的效果：
  - 理想情况下，应该让所有任务在各自的 Deadline 之前，被 CPU 执行完毕。此时，称这组任务是可调度的（schedulable）。
    - 如果 CPU 不能及时执行所有任务，则应该优先执行重要任务。但公平性不能太差，应该保障次要任务也被执行。
  - CPU 使用率
    - ：单位时间内，CPU 被使用时长的占比。
    - 理想情况下，应该不断安排任务让 CPU 执行，让 CPU 使用率接近 100% ，不空闲，不浪费。
  - 吞吐量
    - ：单位时间内，CPU 完成任务的数量。
    - 有的场景希望吞吐量越高越好，比如磁盘 IO 。有的场景不在乎吞吐量。
  - Waiting Time
  - Turn Around Time

- 优先级反转（priority inversion）
  - ：一种调度时的常见问题，是指优先级更低的任务，反而先被执行。
  - 例如等待释放资源时，可能发生优先级反转：
    1. 假设有 3 个任务，优先级为 A > B > C 。
    2. A 执行时，需要使用某个资源，但该资源被 C 占用、尚未释放，于是 CPU 转去执行 C 。
    3. C 在执行时，可能被优先级更高的 B 抢占 CPU 。
    4. 最终，B 优先级比 A 低，却抢占了 CPU 。
  - 对策：
    - 当 A 等待 C 释放资源时，让 C 临时继承 A 的优先级。
    - 给每个资源也分配优先级，当 C 占用一个资源时，会临时提升优先级，与该资源对齐。

- 饥饿（Starvation）
  - ：一种调度时的常见问题，是指优先级最低的部分任务，长时间等待被执行，Waiting Time 很大。
  - 甚至可能不断出现优先级更高的新任务，导致这些饥饿的任务永远不被执行，该现象称为饿死。相当于从活锁，变成了死锁。
  - 对策：
    - 采用 RR 等算法，保障每个任务都会被 CPU 执行。
    - 每隔一段时间，检查所有任务的 Waiting Time 。如果某个任务的 Waiting Time 较长，则按比例提高其优先级。该机制称为老化（Aging）。
  - 通常认为，饥饿的任务越少，则公平性越好。

## Linux调度器

- 上文介绍了 CPU 调度算法的大概原理，下文介绍 Linux 具体如何实现 CPU 调度。
- 参考文档：
  - <https://man7.org/linux/man-pages/man7/sched.7.html>
  - <https://docs.kernel.org/scheduler/sched-design-CFS.html>

### 特点

- Linux 内核的 CPU 调度器，又称为进程调度器（process scheduler），负责决定 CPU 当前执行哪个线程。
- Linux 调度器给每个线程设定了两个属性：
  - 调度策略（scheduling policy）：支持让每个线程采用不同的调度算法。
  - 静态调度优先级（static scheduling priority）：用变量 sched_priority 表示，取值范围为 0~99 。

- Linux 调度器的特点：
  - 模块化设计
    - 定义了多种调度类（scheduling classes），每个类实现几种调度策略（policy）。
    - 例如 rt_sched_class 类实现了 SCHED_FIFO、SCHED_RR 策略。
    - 每个线程同时只能采用一种调度策略，但可以切换策略。
  - 多队列调度
    - 将所有线程按 sched_priority 取值的不同，划分为多组。同组线程的 sched_priority 相同，组成一个队列。
  - 优先级调度
    - 总是执行当前优先级最高的那个队列（中的线程）。等它执行完毕，队列为空，才能执行优先级较低的队列。
    - 例：假设线程 A、B、C 的 sched_priority 分别为 6、5、5 。
      - 线程 A 优先级更高，会一直占用 CPU 的一个核心。
      - 线程 B、C 属于同一个 sched_priority 队列，会按 policy 竞争使用 CPU 的其它核心。
  - 抢占式调度
    - 一个线程正在使用 CPU 时，如果出现 sched_priority 更高的其它线程，则总是允许抢占式调度。

- 每个 sched_priority 队列中，各个线程如何排序？
  - 每个队列中，所有线程最初根据 FIFO 排序，然后根据 policy 调整顺序。
  - 假设某个队列中，一个线程正在占用 CPU ：
    - 如果该线程采用 SCHED_FIFO 策略，则等该线程执行完毕，才会执行队列中的下一个线程。
    - 如果该线程采用 SCHED_RR 策略，则最多执行一个时间片段，然后移到队列的尾部。
    - 如果该线程主动释放 CPU ，比如进入 sleeping 状态、进入 iowait 状态，则会等线程结束该状态，变回 ready 状态，然后重新加入 ready 队列的尾部。
    - 如果被优先级更高的队列抢占 CPU ，则该线程会移到队列的头部，等待继续执行。
  - 改变一个线程的 sched_priority ，则会改变其所属的队列。
    - 如果提高一个线程的 sched_priority ，则会移到新队列的尾部。
    - 如果降低一个线程的 sched_priority ，则会移到新队列的头部。

- Linux 每隔多久触发一次 CPU 调度算法？
  - 没有固定的间隔时间。可以监控 CPU 上下文切换的次数，估算两次切换之间的间隔时间。
  - 通常倾向于让正在占用 CPU 的线程一直运行，直到遇到以下情况：
    - 线程执行完毕。
    - 线程尚未执行完毕，但主动释放 CPU 。
    - 线程尚未执行完毕，但出现了优先级更高的线程，发生抢占式调度。
    - 线程尚未执行完毕，但耗尽了 CPU 时间片段。常见于 RR 算法。
    - 遇到系统调用，切换执行用户态代码、内核态代码。
    - 遇到中断。

### 版本

- Linux v0.01 的调度器很简单，只有几十行代码。
  - 原理：采用分时算法，并发执行多个进程
    - 为每个进程分配一段 CPU 可用时长，记作 counter 变量。
    - 进程的存在时间越久、优先级越高，分配的 counter 越多。因此既能减少饥饿，又能优先执行重要任务。
    - 每次调度，找出当前 counter 最大的那个进程，执行它，直到耗尽其 CPU 可用时长。然后开始下一次调度。
  - 源代码如下：
    ```c
    #define NR_TASKS 64
    #define FIRST_TASK task[0]
    #define LAST_TASK  task[NR_TASKS-1]

    struct task_struct *task[NR_TASKS];   // 一个数组，用于存放主机的所有进程（不管进程是否需要运行）

    void schedule(void)
    {
      ...

      // 通过循环，遍历所有进程，找出状态为 TASK_RUNNING 且 counter 最大的那个进程，记在 next 变量中
      while (1) {
        c = -1;               // 变量 c 用于记录已发现的 counter 最大值
        next = 0;
        i = NR_TASKS;         // 变量 i 用作访问 task 数组的索引。最初给 i 赋值为 NR_TASKS ，然后递减 i
        p = &task[NR_TASKS];  // 访问 task 数组中的第 i 个进程
        while (--i) {
          if (!*--p)
            continue;
          if ((*p)->state == TASK_RUNNING && (*p)->counter > c)
            c = (*p)->counter, next = i;
        }

        // 如果已找到有效的 counter 最大值，则停止循环
        if (c) break;

        // 将每个进程的 counter 除以 2 ，并加上 priority
        // counter >> 1 的作用是除以 2 ，避免 counter 增长太快
        // 如果一个进程长时间睡眠，其 counter 会不断增加。未来该进程变为 TASK_RUNNING 状态时，会更容易占用 CPU
        for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
          if (*p)
            (*p)->counter = ((*p)->counter >> 1) + (*p)->priority;
      }

      // 切换上下文，从而执行 next 进程
      switch_to(next);
    }
    ```

- Linux v2.2 划分了 SCHED_OTHER、SCHED_FIFO、SCHED_RR 三种调度策略。

- Linux v2.4 的调度器改用 O(n) 算法。
  - 在分时算法的基础上，引入 epoch 机制。
    - 在每个 epoch 时间内，尽量执行一轮所有进程，并耗尽每个进程的 CPU 可用时长。
    - 如果一个进程在当前 epoch 中剩余了 CPU 可用时长，则会保留一半时长到下一个 epoch 。
  - 总共有 n 个任务时，需要遍历一遍，才能找到优先级最大的那个进程。因此时间复杂度为 O(n) 。

- Linux v2.6 的调度器改用 O(1) 算法。
  - 划分了 active 和 expired 两个队列。
    - active 队列中的进程，耗尽 CPU 可用时长之后，会被移到 expired 队列。
    - active 队列中的进程，优先级不会变化。优先级最大的那个进程，总是排在第一位。因此查找的时间复杂度为 O(1) 。

- Linux v2.6.16 添加了 SCHED_BATCH 调度策略。
  - 原理：
    - 每个任务最多使用 CPU 一个时间片段，然后轮到下一个任务。
    - 每个时间片段默认为 1.5s 。
    - 一个任务的优先级越高，其时间片段越长。
  - 优点：减少了抢占式调度，适合批处理任务。

- Linux v2.6.23 的调度器改用 CFS 算法，对应 fair_sched_class 调度类，实现了 SCHED_NORMAL、SCHED_BATCH、SCHED_IDLE 调度策略。

- Linux v3.14 添加了 SCHED_DEADLINE 调度策略，对应 dl_sched_class 调度类。
  - 原理：类似于 EDF 算法。

- Linux v6.6 的调度器改用 EVDF 算法，取代了 CFS 算法。
  - EVDF（Earliest Eligible Virtual Deadline First，最早合格虚拟截止时间优先）的原理：
    - 给每个任务添加一个 virtual deadline 属性。
    - 每次 CPU 调度时，选取 virtual deadline 最早的那个任务来执行。
  - 优点：
    - 实时性好。

### policy

- Linux 的调度策略分为两大类：
  - 实时策略（realtime policy）
    - ：用于处理追求实时性（Real Time，RT）的进程。这些进程的 sched_priority 取值范围为 1~99 。
    - 包含多个调度策略：
      ```c
      #define SCHED_FIFO   1  // 采用 FCFS 算法。前一个任务执行完毕，才能执行下一个任务
      #define SCHED_RR     2  // 采用 RR 算法。每个任务最多使用 CPU 一个时间片段（默认为 100ms），然后轮到下一个任务
      ```
  - 普通策略（normal policy）
    - ：用于处理普通进程。这些进程的 sched_priority 必须取值为 0 。
    - 包含多个调度策略：
      ```c
      #define SCHED_NORMAL 0  // 是每个进程默认采用的调度策略。原名为 SCHED_OTHER
      #define SCHED_BATCH  3  // 基于 SCHED_NORMAL ，但每个任务最多使用 CPU 一个时间片段，然后轮到下一个任务
      #define SCHED_IDLE   5  // 基于 SCHED_NORMAL ，但优先级最低。因此当其它进程都不使用 CPU 时，才会执行 SCHED_IDLE 进程
      ```
    - 所有 RT 进程的 sched_priority 都大于普通进程。因此等所有 RT 进程不使用 CPU 时，才允许普通进程使用 CPU 。
    - 常见的几种普通进程：
      - 交互式进程：例如 bash ，需要及时与用户交互，追求较弱的实时性，因此应该分配较高的优先级。
      - 批处理进程：通常不追求实时性，因此可以分配较低的优先级。

- 相关 API ：
  ```c
  #include <sched.h>

  int sched_getscheduler(pid_t pid);
      // 查询某个 pid 的进程
      // 如果指定 pid=0 ，则会指向调用该函数的当前进程

  int sched_setscheduler(pid_t pid, int policy, const struct sched_param *param);
      // 给某个 pid 的进程，配置调度策略、参数
      // 如果 policy 取值为 SCHED_FIFO、SCHED_RR 实时策略，则 param->sched_priority 取值范围为 1~99
      // 如果 policy 取值为 SCHED_NORMAL 等普通策略，则 param->sched_priority 必须取值为 0

  int sched_yield(void);
      // 主动放弃使用 CPU 。使得调用该函数的当前进程，被移到当前 sched_priority 队列的尾部
      // 如果当前 sched_priority 队列只有这一个进程，则调用该函数之后，该进程会继续使用 CPU 。此时 CPU 使用率没有提高，反而增加了上下文切换
      // 该函数适用于 SCHED_FIFO、SCHED_RR 实时策略
      // 该函数不建议用于 SCHED_NORMAL 等普通调度策略，因为每个进程经常可能被抢占式调度，没必要主动放弃使用 CPU
  ```

- 一个进程，可能长时间占用 CPU 而不释放，导致其它优先级更低的进程长时间等待。此时认为该进程失控了，锁死了 CPU 。如何解决该问题？Linux 采用了多种措施：
  - 通过 ulimit 进行限制：
    ```sh
    RLIMIT_CPU    # 限制每个进程连续占用的 CPU 时长，不能超过该值，单位为秒。否则先发送 SIGXCPU 信号来请求终止该进程，等一会再发送 SIGKILL 信号来强制终止。
    RLIMIT_RTTIME # 限制每个 RT 进程连续占用的 CPU 时长，单位为微秒
    ```
  - 每个 sched_rt_period_us 周期内，最多分配 sched_rt_runtime_us 时长给 RT 进程。如下，至少分配 5% 的 CPU 时长给普通进程。
    ```sh
    [root@CentOS ~]# cat /proc/sys/kernel/sched_rt_period_us
    1000000
    [root@CentOS ~]# cat /proc/sys/kernel/sched_rt_runtime_us
    950000
    ```

- 默认情况下，调用 fork() 创建子进程时，会继承父进程的调度策略、参数。
  - 如果调用 sched_getscheduler() 修改父进程，并添加 SCHED_RESET_ON_FORK 标志。则父进程调用 fork() 创建子进程时，会将 policy 重置为 SCHED_NORMAL 、将 nice 重置为 0 。
    - 例如：`sched_setscheduler(pid, SCHED_FIFO|SCHED_RESET_ON_FORK, &param);`
  - SCHED_RESET_ON_FORK 不会重置所有调度参数。
    - 例如：如果一个 RT 进程受 RLIMIT_RTTIME 限制，则它创建的子进程也应该受到 RLIMIT_RTTIME 限制。该限制不能被该进程自己放开，只能被 root 用户放开。

### priority

- 上文介绍了 sched_priority 全局优先级，影响所有调度策略。不过，Linux 还定义了其它几种优先级。
  - 大部分进程都属于普通进程，它们的 sched_priority 都为 0 ，位于同一个 sched_priority 队列中。那么如何区分它们的优先级？答案是分配不同的 nice 值。
  - 少部分进程属于 RT 进程，它们的 sched_priority 取值范围为 1~99 。
    - 执行 `sched_setscheduler()` 函数时，会将 `param->sched_priority` 赋值给 `p->rt_priority` 。

- task_struct 中定义了 4 种优先级：
  - rt_priority
    - ：表示 RT 进程的优先级。
    - 取值越大，表示优先级越高。
    - 取值范围为 1~99 。
  - static_prio
    - ：表示静态优先级，取值由 nice 值决定。
    - 之所以叫静态优先级，是因为取值一般不会变化，除非修改进程的 nice 值。
  - normal_prio
    - ：static_prio 与 rt_priority ，在生效之前都会换算为 normal_prio ，从而统一语义。
    - 取值越小，表示优先级越高。
  - prio
    - ：表示最终生效的优先级，又称为 effective_prio 。
    - 取值通常等于 normal_prio 。
    - 取值越小，表示优先级越高。
    - 取值范围为 0~139 。
      - 取值 0~98 专用于 RT 进程，对应 rt_priority 的取值 99~0 。
      - 取值 99 未被使用。
      - 取值 100~139 专用于普通进程，对应 nice 的取值 -20~19 。

- 如何计算每个进程的 prio 优先级？
  - 对于 RT 进程，计算逻辑为：
    ```c
    normal_prio = MAX_RT_PRIO - 1 - rt_priority   = 99 - rt_priority
    prio        = normal_prio
    ```
    相关源代码：
    ```c
    #define MAX_USER_RT_PRIO  100
    #define MAX_RT_PRIO        MAX_USER_RT_PRIO
    #define MAX_PRIO          (MAX_RT_PRIO + 40)
    ```
  - 对于普通进程，计算逻辑为：
    ```c
    static_prio = MAX_RT_PRIO + 20 + nice         = 120 + nice
    normal_prio = static_prio
    prio        = normal_prio
    ```
  - Linux 中大部分进程都属于普通进程，nice 等于 0 ，因此 prio 等于 120 。
  - 在某些情况下，Linux 会跳过上述逻辑，直接修改 normal_prio、prio ，从而临时调整优先级。

- 可用 chrt 命令查看、修改进程的调度策略、优先级。
  ```sh
  [root@CentOS ~]# chrt -p 1                # 查看某个 pid 进程的调度策略、优先级
  pid 1's current scheduling policy: SCHED_OTHER
  pid 1's current scheduling priority: 0
  [root@CentOS ~]# chrt --other -p 0 1      # 设置调度策略为 SCHED_OTHER ，优先级为 0
  ```

### nice

- 每个进程拥有一个 nice 属性，表示其谦让值。
  - 如果一个进程增加其 nice 值，则会降低其 weight 权重，使得每个周期分配的 CPU 时长更少，对其它进程更友好。
  - nice 取值范围为 -20~19 ，默认为 0 。

- 每个进程的 nice ，决定了其 weight 权重，但是呈反比关系。
  - nice 取值越大，对应的 weight 越小。
    - 例如 nice=0 对应的 weight 为 1024 。
    - 例如 nice=1 对应的 weight 为 820 。
  - weight 权重越大，该进程分配的 CPU 时长越多，vruntime 增长量越小。

- 相关 API ：
  ```c
  #include <sys/resource.h>

  int getpriority(int which, id_t who);
      // 查询某个对象的 nice 值
      // which 表示该对象的类型，可取值为 PRIO_PROCESS、PRIO_PGRP、PRIO_USER ，表示进程、进程组、用户
      // who 表示该对象的 id

  int setpriority(int which, id_t who, int prio);
      // 设置某个对象的 nice 值
  ```
  - POSIX 规定 nice 值是进程级别的属性。而 Linux 的 NPTL 线程库中，nice 是线程级别的属性，因此可以给同一进程的各个线程，设置不同的 nice 值。

- 相关命令：
  ```sh
  ps -eo pid,ni,cmd   # 查看所有进程的 nice 值
  renice <int> <pid>  # 修改一个进程的 nice 值
  ```

### sched_entity

- CFS 调度器会为每个任务创建一个 sched_entity 结构体，用于记录该任务的调度信息。

- [相关源代码](https://github.com/torvalds/linux/blob/v2.6.34/include/linux/sched.h) ：
  ```c
  #include <sched.h>

  struct task_struct {            // 记录每个任务的元数据，这些任务可以被调度到 CPU 上执行
      int prio, static_prio, normal_prio;     // 优先级
      unsigned int rt_priority;               // 优先级
      const struct sched_class *sched_class;  // 调度类，比如 rt_sched_class、fair_sched_class
      struct sched_entity se;     // 该任务的调度信息

      unsigned int policy;        // 调度策略，比如 SCHED_FIFO、SCHED_RR
      cpumask_t cpus_allowed;     // 允许该进程使用 CPU 的哪些核心
      ...
  };

  struct task_group {             // 允许将多个任务归为一组，以 group 为单位进行调度。该 group 的 vruntime ，等于其中所有任务的 vruntime 之和
      struct sched_entity **se;
      unsigned long shares;       // 根据该权重，为该 group 分配 CPU 时长。对应 Cgroup 的 cpu.shares 参数
      ...
  };

  struct sched_entity {           // CFS 调度器会为每个任务创建一个 sched_entity 结构体，用于记录该任务的调度信息
      struct load_weight load;    // 根据该权重，为该任务分配 CPU 时长。该权重是从 nice 值转换而来
      struct rb_node     run_node;// 该任务在 rbtree 红黑树中，所处的节点
      unsigned int       on_rq;   // 一个标志，表示该任务是否位于 ready 队列中

      u64   exec_start;
      u64   sum_exec_runtime;
      u64   vruntime;

      struct cfs_rq *cfs_rq;      // 该任务所属的 CFS 队列
      ...
  };

  struct sched_rt_entity;         // 用于记录实时进程的调度信息

  struct rq {                     // Linux 会为每个 CPU 核心创建一个 ready 队列，又称为 runqueue 。分为 cfs_rq、rt_rq 两个队列
      unsigned long nr_running;   // 队列中的任务数量
      struct load_weight load;    // 队列中所有任务的 load_weight 之和
      struct cfs_rq cfs;
      struct rt_rq rt;
      struct task_struct *curr, *idle;  // curr 指向当前执行的进程。idle 指向空闲进程。当 ready 队列为空时，会让 CPU 执行 idle 进程，从而睡眠
      ...
  };
  struct cfs_rq {                   // CFS 队列
      u64 min_vruntime;             // 所有任务的 vruntime 的最小值
      struct rb_node *rb_leftmost;  // 用一个指针，记录 rbtreee 的最左端节点。这样不必花 O(log n) 时间查找 rebtree ，时间复杂度缩短为 O(1)
      ...
  };
  struct rt_rq;                     // 实时进程的队列
  ```

- 每当一个进程退出 CPU 时，Linux 会调用 update_curr() 函数更新该进程的 sched_entity 。源代码如下：
  ```c
  static void update_curr(struct cfs_rq *cfs_rq)
  {
      // 获取 CFS 队列中，当前执行的进程
      struct sched_entity *curr = cfs_rq->curr;

      // 用当前时刻，减去进程刚开始执行的时刻，得到当前进程的 Burst Time
      delta_exec = now - curr->exec_start;

      // 将 delta_exec 累加到 sum_exec_runtime
      curr->sum_exec_runtime += delta_exec;

      // 将 delta_exec 按比例缩放之后，累加到 vruntime
      // 这行代码相当于 curr->vruntime += delta_exec * NICE_0_LOAD / curr->load.weight
      curr->vruntime += calc_delta_fair(delta_exec, curr);

      // 用当前时刻，作为 CFS 队列下一个执行的进程的 exec_start
      curr->exec_start = now;

      // 计算当前的 min_vruntime
      // 这会检查红黑树最左端节点 cfs_rq->rb_leftmost 的 vruntime ，如果小于 cfs_rq->min_vruntime ，则赋值给 cfs_rq->min_vruntime
      update_min_vruntime(cfs_rq);
      ...
  }
  ```
  - 如果一个进程一直占用 CPU ，则可能长时间不会调用 update_curr() ，导致该进程的 sched_entity 没有更新。

- 可通过 /proc 查看进程的调度信息，如下：
  ```sh
  [root@CentOS ~]# cat /proc/1/sched
  systemd (1, #threads: 1)                                              # 进程名称、pid、线程数
  -------------------------------------------------------------------
  se.exec_start                                :    2137352461.573646   # 进程最近一次 Burst Time 的开始时刻。该时刻不是 Unix 时间戳，而是主机的 uptime ，单位为毫秒
  se.vruntime                                  :     351095853.820943   # 虚拟运行时长，单位为纳秒
  se.sum_exec_runtime                          :        402964.351553   # 累计每次使用 CPU 的 Burst Time ，单位为毫秒
  se.nr_migrations                             :               162345   # 每次线程被调度到不同 CPU 核心上，就将该值加 1
  nr_switches                                  :              1434237   # 上下文切换的累计次数，等于 nr_voluntary_switches + nr_involuntary_switches
  nr_voluntary_switches                        :              1426878   # 自愿的切换次数
  nr_involuntary_switches                      :                 7359   # 非资源的切换次数
  se.load.weight                               :                 1024   # nice 值对应的权重
  policy                                       :                    0   # 调度策略，0 表示 SCHED_NORMAL
  prio                                         :                  120   # 优先级
  ...
  ```

## 上下文切换

- CPU 中的每个 Core 同时只能执行一个指令。但可以在执行一个指令流的过程中，转去执行其它指令流。该过程称为上下文切换（Context Switch）。
  - 从软件的角度来看：CPU 中的每个 Core 同时只能执行一个程序（表现为一个线程），但 CPU 可以在执行一个程序的过程中，转去执行其它程序。
  - 上下文切换时，需要暂存当前程序的执行信息（主要是寄存器中的内容），称为上下文，以供之后 CPU 跳转回来继续执行。
  - 上下文切换总是会发生，可以提高 CPU 执行多个程序的效率。例如当前程序在等待磁盘 IO 时，就可以转去执行其它程序，避免 CPU 处于空闲。
  - 上下文切换过于频繁时，切换产生的开销也会过大，可能降低 CPU 的总体执行效率。

- CPU 上下文切换分为几种场景：
  - 进程上下文切换
    - CPU 从一个进程转去执行另一个进程时，需要切换寄存器、内核堆栈等内核态资源，以及虚拟内存、全局变量、栈区等用户态资源。
  - 线程上下文切换
    - CPU 从一个线程转去执行另一个线程时，需要切换寄存器、栈区等资源，开销比进程上下文切换小得多。
    - 这里是指在同一进程下切换线程。如果切换到不同进程，则属于进程上下文切换。
  - 系统调用上下文切换
    - 用户态的进程通过调用系统 API 可以切换到内核态执行，此时会发生一次上下文切换。调用结束之后，要继续执行用户态进程，又会发生一次上下文切换。
  - 中断上下文切换
    - 优先级最高，会打断一般进程的执行。
    - 切换时只需要暂存进程的内核态资源，不影响用户态资源。

## 中断

- 中断（interrupt）：指 CPU 在执行一般进程时，突然出现某个重要任务，然后转去执行该重要任务。

- 引发 CPU 中断的原因称为中断源，主要分为两大类：
  - 内部中断：是 CPU 内部的中断，例如除法出错中断、溢出中断、软件中断指令 INT n 。
  - 外部中断：又称为硬件中断，是计算机的其它元件通过 CPU 的芯片引脚传入的中断信号。

- CPU 处理中断的策略：
  - 如果是硬中断，则立即处理其中不能延误的任务，然后将剩下的任务转换成软中断。
  - 软中断通常是不紧急的任务，可以延后处理。比如创建内核线程来处理，该内核线程可能被 CPU 的其它 core 执行。

- 例如，网卡接收数据时会这样触发中断：
  1. 网卡收到一个或多个数据帧，发出一个硬中断，使得网卡驱动程序将数据帧拷贝到内核缓冲区中。
  2. 网卡驱动程序发出一个软中断，使得某个内核线程来解析数据帧，转换成 IP、TCP 等协议包，供监听 Socket 的程序读取。
