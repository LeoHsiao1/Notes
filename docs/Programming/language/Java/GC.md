# GC

- C 语言编程时，如果调用 malloc() 动态分配了一块内存空间，则需要在用完之后，调用 free() 主动释放内存，否则程序会内存溢出。而 Java 编程时，不需要用户决定如何分配、释放内存。
  - 假设用户编写了一个 Java 程序，用 JVM 运行。则 JVM 会自动执行以下操作：
    - Java 程序每次新建一个对象，JVM 会自动分配一块内存空间，给新对象使用。
    - JVM 会自动找出垃圾对象，删除它们，从而回收其占用的内存空间。该操作称为 GC（Garbage Collection，垃圾回收）。
- 参考文档：
  - [HotSpot GC 调优指南](https://docs.oracle.com/en/java/javase/11/gctuning/introduction-garbage-collection-tuning.html)
  - [plumbr 公司的 GC handbook](https://downloads.plumbr.io/Plumbr%20Handbook%20Java%20Garbage%20Collection.pdf)
  - [美团公司的 GC 案例](https://tech.meituan.com/2017/12/29/jvm-optimize.html)

## 内存

- JVM 运行一个 Java 程序时，至少会创建一个进程，包含多个线程。这些线程分为两类：
  - 用户线程：负责执行 Java 程序的代码，或者说用户代码。
  - GC 线程：负责 GC 。

- JVM 进程占用的内存分为几部分：
  - Heap ：堆内存。主要存储 Java 类的实例对象。除了堆内存之外的其它内存，统称为非堆内存（noheap）。
  - Direct Memory ：直接内存，存储与操作系统交互的数据，比如读写文件、Socket 的数据。
  - Metaspace ：存储 Java 类的元数据，包括常量、注解等。替代了 Java 8 以前的永久代（Permanent）。
  - JVM native ：运行 JVM 本身占用的内存。
  - Code Cache ：存储根据 Java 字节码生成的机器代码。
  - Thread Stack ：线程堆栈。

- JVM 进程运行时，会从操作系统申请一些内存空间，划分为 Heap、DirectMemory、Metaspace 等区域，统称为 committed_memory 。
  - JVM 申请的内存空间不一定全部使用。committed_memory 中，正在存储数据的那些内存称为 used_memory 。其它内存处于空闲状态，可供未来存储数据，称为 free_memory 。
    - 从 JVM 外部、操作系统来看，committed_memory 是整个 JVM 进程占用的内存，会计入主机的 used 内存。
    - 从 JVM 内部来看，committed_memory 是一个内存池，其中有的内存正在使用，有的内存空闲。
  - 当 JVM 需要存储新数据（比如新建的 Java 对象）时，就会选用一些 free_memory 。如果当前的 free_memory 不足以存入新数据，则可能自动申请更多 committed_memory ，从而凭空增加 free_memory 。也可能自动进行 GC ，从而将 committed_memory 中的某些 used_memory 转换成 free_memory 。
    - 通常所说的"内存不足"，是指空闲内存不足以存入新数据。即空闲内存的体积，小于新数据的体积。
    - 当 JVM 进程申请的 committed_memory 达到 MaxHeapSize、MaxDirectMemorySize 等限制时，就不能继续增加。此时只能依靠 GC 在 Heap 中获得空闲内存。
  - GC 一般不会减少 committed_memory ，也不会将 committed_memory 中的空闲内存释放给操作系统，而是留给 JVM 自己未来使用。
    - 优点：避免频繁释放内存、重新申请内存，减少这种开销。
    - 缺点：这部分空闲内存被 JVM 占着不用，不能被其它进程使用，挺浪费。
  - 如果 GC 之后依然内存不足，则 Java 进程会在终端打印 OutOfMemoryError 报错，表示内存不足。
    - java.lang.OutOfMemoryError 属于错误，不属于异常，但可以被 try catch 捕捉。
    - 发生 OutOfMemoryError 有什么后果？
      - Java 进程可能崩溃退出，也可能继续运行。
      - 即使 Java 进程继续运行，也可能因为占用内存过多，被 Linux OOM 机制杀死进程。

- 例：假设 Java 进程每隔 1 分钟新建一个对象，则有以下几种结果
  - 新对象一直不属于垃圾对象。（比如强引用）
    - 此时， GC 算法不能回收内存，因此 committed_memory 会快速增长，直到达到 -Xmx 堆内存容量上限，然后发生 OutOfMemoryError 或 OOM 故障。
    - 这种情况称为内存泄漏。
  - 有些新对象变为垃圾对象，可以被 GC 算法回收。
    - 此时，有些新对象不能被 GC 回收，因此 committed_memory 会慢速增长，属于内存泄漏。可能一段时间之后（比如几天），发生 OutOfMemoryError 或 OOM 故障。
    - 上述内存泄漏的问题，是由 Java 程序的源代码决定的，不能通过 GC 算法解决。
  - 几乎全部新对象变为垃圾对象，可以被 GC 算法回收。
    - 用户编写一个 Java 程序时，应该尽量达到这种效果，从而保证 Java 进程能长时间运行，比如运行几年。
    - 此时，依然可能存在一些性能问题：
      - GC 时，可能处于长时间的 STW 状态，导致用户线程暂停执行（比如几秒）。用户不一定能忍受这么久的停顿。
      - 如果频繁执行 GC 算法，则可能造成较大 CPU 负载，导致用户线程长时间停顿（比如几十秒）。
        - 此时的症状：主机 CPU 满载（因为在执行 GC 线程），但 Java 进程假死（因为用户线程停顿），比如 HTTP 端口无响应。
    - 遇到上述性能问题时，用户可以尝试优化 GC 算法，有可能解决，或缓解。

## 引用

- GC 时，首先需要找出垃圾对象，如何找出？通常采用以下几种算法：
  - 引用计数（Reference Counting）
    - 原理：
      - 每个对象内置一个引用计数器，表示有多少个地方引用了它。当引用数减为 0 时，就可以删除该对象。
      - 创建一个对象并传递给一个变量时，该对象的引用计数为 1 。
      - 删除一个对象时，将它引用的其它所有对象的引用技术减 1 。
    - 缺点：
      - 修改引用计数的开销较大。
      - 难以发现循环引用的对象。比如对象 A、B 相互引用，则可能一直不会被删除。
  - 跟踪（Tracing）
    - 又称为可达性分析。
    - 原理：
      1. 选出当前的局部变量、静态变量、线程等对象，作为根集（GC Roots）。
      2. 遍历根集中的各个对象，递归寻找它们引用的对象，记录成一条条引用链。
      3. 不在引用链上的对象，就可以删除。
    - 目前跟踪算法更常用。

- Java 对象的引用分为四种，从强到弱如下：
  - 强引用（Strong Reference）
    - ：指向一些必须保留的对象，比如 `Object obj = new Object()` 。
    - 即使内存不足，强引用也不会被 GC 算法回收。
  - 软引用（Soft Reference）
    - ：指向一些可能有用，但不是必须保留的对象。
    - 内存不足时，会被 GC 算法回收。
  - 弱引用（Weak Reference）
    - ：指向一些不需要保留的对象。
    - 每次 GC 时，都会被回收。
  - 虚引用（Phantom Reference）
    - ：最弱的引用，相当于没有引用。
    - 不能用于获取对象的实例，主要用于判断对象是否被垃圾回收。

### STW

- GC 算法一般是先 Mark 找出所有垃圾对象，然后批量删除。而不是每找出一个垃圾对象就删除一个，因为逐个删除的效率低、耗时久。
- 如果在 Mark 过程中，同时运行用户线程、GC 线程，则可能遇到以下问题：
  - 错删
    - ：某些已标记为垃圾的对象，在 Mark 结束之前可能被用户线程重新引用、变为非垃圾对象，然后被删除，导致用户线程执行出错。
  - 漏删
    - ：某些未标记为垃圾的对象，在 Mark 结束之前可能被用户线程改为垃圾对象，没有被本次 GC 删除。
    - 这些垃圾对象等到下一次 GC 才会被删除，称为浮动垃圾（floating garbage）。
- 为了避免上述问题，JVM 通常在 Mark 过程中处于 STW（Stop The World）状态，此时会暂停执行用户线程，只执行 GC 线程。
  - 优点：避免在 Mark 过程中，对象的引用被用户线程改变。
  - 缺点：会导致用户线程停顿一定时间，不会工作。
  - 不同 GC 算法的 STW 时长不同。与 young GC、old GC 相比，full GC 需要清理全部内存，因此 STW 时间通常最长。

## GC 算法

### Mark-Sweep

- ：标记-清除算法。
- 原理：分为两个步骤：
  1. Mark ：找出所有垃圾对象。
  2. Sweep ：删除所有垃圾对象。
- 优点：实现简单，GC 耗时最短。
- 缺点：删除一些垃圾对象之后，释放的空闲内存通常地址不连续，比较零散，容易产生内存碎片，导致内存使用率低。
  - 内存碎片是指，某块空闲内存的体积太小，不足以分配给一个对象使用，导致这块空闲内存一直不会被使用。

### Mark-Compact

- ：标记-整理算法，全名是 mark-sweep-compact 。
- 原理：在 Mark-Sweep 算法之后，增加一个称为 Compact 的步骤，用于移动所有非垃圾对象的内存地址，从堆内存的头部开始连续存储。
- 优点：不会产生内存碎片。
- 缺点：Compact 步骤增加了 GC 耗时。

### Mark-Copy

- ：标记-复制算法。
- 原理：将堆内存分为两个区域 1、2 ，循环使用。步骤如下：
  1. 最初只使用区域 1 ，不使用区域 2 。
  2. 等区域 1 内存不足而触发 GC 时，将区域 1 中所有非垃圾对象拷贝到区域 2 ，从区域 2 的头部开始连续存储。然后清空区域 1 的所有数据。
  3. 接下来只使用区域 2 ，不使用区域 1 。
  4. 等区域 2 内存不足而触发 GC 时，按上述流程循环使用区域 1 。
- 优点：
  - 与 Mark-Sweep 算法相比，不会产生内存碎片。
  - 与 Mark-Compact 算法相比，GC 耗时更少。
- 缺点：
  - 同时只使用一个区域，总内存使用率低于 50% 。

- 比较 GC 耗时：
  - Mark-Sweep 的耗时最短。总耗时主要包括：
    - 扫描耗时：与内存容量成正比。
    - 删除耗时：与垃圾对象的数量成正比。
  - Mark-Copy 的耗时较久，因为复制操作比删除操作慢。总耗时主要包括：
    - 扫描耗时
    - 复制耗时：与非垃圾对象的数量成正比。
  - Mark-Compact 的耗时更久，因为 Compact 操作比 Copy 操作慢。总耗时主要包括：
    - 扫描耗时
    - 删除耗时
    - Compact 耗时：与非垃圾对象的数量成正比。

### Generational Collection

- ：分代收集算法。
- 原理：将堆内存分为两个区域，采用不同的 GC 算法：
  - 年轻代（young generation）：又称为新生代（new generation），用于存储存在时间较短的 Java 对象。预计该区域每分钟都有大量对象变成垃圾，需要经常清理，因此适合采用 Mark-Copy 算法，尽量减少 GC 耗时。
  - 老年代（old generation）：又称为终身代（tenured generation），用于存储存在时间较长的 Java 对象。预计不需要经常清理，因此适合采用 Mark-Compact 算法。
- 优点：一般的 Java 程序中，大部分 Java 对象会在创建之后的短期内停止引用，只有少部分对象会长期保留。因此对这两类对象采用不同的 GC 算法，效率更高。
- 年轻代细分为两种区域：
  - 伊甸园空间（eden space）：用于存储新创建的对象。
  - 幸存者空间（survivor space）：用于存储在 young GC 之后幸存、但尚未存入 old 区域的对象。
    - 默认创建了两个 survivor space 实例，简称为 S0、S1 ，或称为 From、To 。根据 Mark-Copy 算法循环使用两个实例，比如最初只使用 S0 ，等 GC 时，将 S0 中所有非垃圾对象拷贝到 S1 。
- 根据作用域的不同，将 GC 分为几种模式：
  - young GC
    - ：又称为 Minor GC 。
    - young 区域的 Java 对象存储在 eden space 和一个 survivor space （假设为 S0）中。
      - 当 eden space 内存不足时，会触发一次 young GC ，将 eden space 和 S0 中所有非垃圾对象拷贝到另一个 survivor space （这里是 S1 ），然后清空 eden space 和 S0 ，供未来存入新对象。
      - 下一次触发 young GC 时，会将 eden space 和 S1 中所有非垃圾对象拷贝到 S0 。
      - 如果另一个 survivor space 的空闲内存不足以存入对象，则将对象直接拷贝到 old 区域。如果 old 区域也内存不足，则触发 full GC 。
    - 新创建的 Java 对象最初存储在 young 区域的 eden space 。
      - 如果对象活过了第一次 young GC ，则从 eden space 拷贝到一个 survivor space 。
      - 之后对象每活过一次 young GC ，则从一个 survivor spac 拷贝到到另一个 survivor space 。这样能多过滤几次垃圾对象，减少拷贝到 old 区域的对象数量。
      - 如果对象活过 young GC 的次数达到 TenuringThreshold 阈值，则从 survivor space 拷贝到 old 区域，该过程称为长期保留（Tenuring）、晋升（Promotion）。
      - JVM 会自动调整 TenuringThreshold 的大小。尽量增加 TenuringThreshold ，从而减少拷贝到 old 区域的对象数量，但不至于让 survivor space 溢出。
  - old GC
    - ：又称为 Major GC 。
    - 当 old 区域的内存不足时，会触发一次 old GC ，将 old 区域中存在时间较长的对象删除。
    - young GC 、old GC 相互独立，可以同时执行。
  - full GC
    - ：当 old 或 DirectMemory 或 Metaspace 区域的内存不足时，会触发一次 full GC ，对 young、old、DirectMemory、Metaspace 区域全部进行 GC 。
    - 目前 full GC 没有严格的标准，有的垃圾收集器的 old GC 相当于 full GC 。

- young 区域中大部分对象一般会在短期内停止引用，活不到 old 区域，因此两个区域的内存开销不同。
  - 例如 HotSpot 认为 old 区域的内存开销一般更大。因此默认配置了 `-XX:NewRatio=2` ，使得 old 区域容量是 young 的 2 倍。
  - 如果 Java 程序短期内创建大量新对象，则可能 young 区域内存不足而频繁 GC ，此时需要增加 young 区域的容量。
  - 如果 Java 程序存在大量非垃圾对象，则可能 old 区域内存不足而频繁 GC ，此时需要增加 old 区域的容量。
  - 如果 Java 程序存在大量非垃圾对象，还不断创建新的非垃圾对象，则 young、old 区域都会内存不足。

## 垃圾收集器

- 上文列举了几种 GC 算法。但 GC 算法属于理论，实现这些理论的程序称为垃圾收集器（Garbage Collector）。下文列举几个垃圾收集器，一般在 JVM 中内置可用。

### SerialGC

- ：串行垃圾收集器。
- 特点：
  - 分代收集：young GC 采用 Mark-Copy 算法，old GC 采用 Mark-Compact 算法，全程处于 STW 状态。
  - GC 时运行单个 GC 线程。
- 优点：实现简单，是 JVM 最古老的一个垃圾收集器。
- 缺点：堆内存超过 100MB 时，单个 GC 线程的处理速度慢，导致 STW 时间长。

### ParallelGC

- ：并行垃圾收集器。
- 特点：
  - 分代收集：young GC 采用 Mark-Copy 算法，old GC 采用 Mark-Compact 算法，全程处于 STW 状态。
  - GC 时运行多个 GC 线程。
- 优点：堆内存超过 100MB 时，GC 速度比 SerialGC 快几倍。
- 缺点：依然全程处于 STW 状态。
- 类似的几个垃圾收集器：
  - ParallelOldGC
    - 早期版本的 ParallelGC 只能在 young GC 时创建多个 GC 线程。Java 6 增加了 ParallelOldGC ，在 old GC 时也能创建多个 GC 线程。
    - HotSpot 对于 Java 8 ，默认启用 `-XX:+UseParallelGC` 。并且启用 `-XX:+UseParallelGC` 时，默认会启用 `-XX:+UseParallelOldGC` 。
  - ParNewGC
    - 专注于 young GC 。在 young GC 时创建多个 GC 线程，在 old GC 时创建单个 GC 线程。
    - HotSpot 对于 Java 8 ，启用 `-XX:+UseConcMarkSweepGC` 时，默认会启用 `-XX:+UseParNewGC` ，从而组合使用两个垃圾收集器，分别处理 young GC、old GC 。

### ConcMarkSweepGC

- ：Concurrent Mark Sweep Garbage Collector ，简称为 CMS 垃圾收集器，是第一个支持并发收集的垃圾收集器。
- 特点：
  - 分代收集：young GC 采用 Mark-Copy 算法，处于 STW 状态。old GC 采用 Mark-Sweep 算法并进行了魔改，使得大部分时间不处于 STW 状态。
  - young GC、old GC 时支持运行多个 GC 线程。但 full GC 时，只运行单个 GC 线程，处于 STW 状态。
- 将 old GC 分为多个阶段：
  1. 初始标记（Initial Mark）：最初将所有对象标记为白色，然后找出 GC Roots 直接关联的所有 Java 对象，标记为灰色。
  2. 并发标记（Concurrent Mark）：找出灰色对象引用的所有对象（即使为空），然后将前者标记为黑色，将后者标记为灰色。递归执行该操作，直到不存在灰色对象。最后剩下的白色对象就是不在引用链上的对象，视为垃圾对象。
    - 这种标记方案，称为三色标记法。
      - 优点：与 Mark-Sweep 算法相比，STW 时长小。
      - 缺点：可能漏标。
        - 在并发标记阶段，同时运行用户线程、GC 线程。因此可能有些对象刚刚标记，又被用户线程修改了引用。还可能有些对象从 young 区域晋升到 old 区域，加入 old GC 的范围。
        - 因此并发标记的结果不可靠，需要后续几个阶段重新标记。
    - 即使使用三色标记法，还存在跨带引用的问题：old 区域某些对象，可能引用了 young 区域某些对象，因此与 GC Roots 关联。
      - 为了处理跨代引用，young GC 时，需要扫描一遍 young、old 区域的所有可达对象，才能找出 young 区域的垃圾对象。这导致 young GC 的耗时像 full GC 一样久。
      - 为了缩短耗时，ConcMarkSweepGC 在 young 区域保存一个特殊的数据结构，称为记忆集（Remember Set，Rset），用于记录所有跨代引用的关系。
  3. 并发预清洗（Concurrent Preclean）：在并发标记期间可能有些对象发生了变化，需要重新标记。
  4. 并发终止预清洗（Concurrent Abortable Preclean）：该阶段像 Concurrent Preclean ，但可通过 JVM 参数限制该阶段的耗时，提前终止。
  5. 最终重新标记（Final Remark）：该阶段进入 STW 状态，检查已标记为垃圾的对象，确保它们依然没有被引用。
      - Final Remark 能避免误删，但不能避免漏删，因此可能产生浮动垃圾。
  6. 并发扫描（Concurrent Sweep）：删除垃圾对象。
  7. 并发重置（Concurrent Reset）：重置 ConcMarkSweepGC 垃圾收集器，准备开始下一次 old GC 。
      - 上述 5 个并发阶段不处于 STW 状态，虽然耗时长，但不会导致用户线程停顿。
      - 其它 2 个阶段虽然处于 STW 状态，但耗时短，可以忍受。

- 满足以下条件之一时，会触发一次 old GC ：
  - old 区域的内存使用率，超过 CMSInitiatingOccupancyFraction 阈值。
  - Metaspace 内存不足。
  - young 区域的对象可能全部晋升到 old 区域，此时如果 old 区域内存不足则会晋升失败，触发 full GC 。为了避免该问题，当 young 区域的 used_memory 大于 old 区域的 free_memory 时，就会触发一次 old GC 。

- 优点：
  - SerialGC、ParallelGC 不支持并发收集，全程处于 STW 状态。而 ConcMarkSweepGC 支持并发收集，使得 old GC 的大部分时间不处于 STW 状态。

- 缺点：
  - young GC 依然处于 STW 状态。
  - old GC 会产生浮动垃圾，导致 old 区域占用内存增加 10% 左右。
  - old GC 采用 Mark-Sweep 算法，容易产生内存碎片。
    - 不采用 Mark-Compact、Mark-Copy 算法，是因为改变对象的内存地址时，必须处于 STW 状态。
    - JVM 对 ConcMarkSweepGC 默认启用了 `-XX:+UseCMSCompactAtFullCollection` 功能，在 full GC 时自动压缩内存碎片。

### G1GC

- ：Garbage First Garbage Collector ，垃圾优先的垃圾收集器。

- 上述几个传统的垃圾收集器，将堆内存分为 young、old 两个区域，以 bytes 为单位管理内存。而 G1GC 以 region 为单位管理管理。
  - 在物理上，G1GC 将堆内存分为很多个 region 空间。
    - 每个 region 是一小块地址连续的内存空间，用于存储数据。
    - 每个 region 的容量相同，默认为几 MB 。
    - 如果一个对象的体积，超过 region 容量的 50% ，则称为 humongous object 。一个 region 可能容不下该对象，会用几个地址连续的 region 存储该对象。
  - 在逻辑上，G1GC 将堆内存分为 eden、survivor、old 三个区域，并记录每个区域分别由哪些 region 组成。
    - 改变某个区域包含的 region 集合，就可以增减该区域的容量。

- G1GC 提供了三种 GC 模式：
  - young GC
    - ：清理年轻代中的 eden 区域，然后将其中幸存的对象，拷贝到 survivor 区域。该拷贝过程，又称为撤离（evacuation）。
  - mixed GC
    - ：清理年轻代的所有 region ，还会清理老年代中垃圾对象含量较多的一些 region 。
    - 触发条件：
      - 当堆内存使用率达到 `-XX:InitiatingHeapOccupancyPercent=45` 百分比时，G1GC 就会触发一次 Concurrent Marking Cycle ，找出老年代中哪些 region 应该清理。
      - Concurrent Marking Cycle 触发之后，不会立即开始执行，而是等到下一次 young GC ，在 young GC 的 STW 期间，趁机进行 Concurrent Marking Cycle 的初始标记。
      - 每次 Concurrent Marking Cycle 完成之后，会执行一次或多次 mixed GC 。
  - full GC
    - G1GC 发生 full GC 时，不会并发收集，而是单线程收集，采用 mark-sweep-compact 算法，容易导致长时间的 STW 。
    - 因此，应该尽量避免发生 full GC 。

- 并发标记周期（Concurrent Marking Cycle）分为多个阶段：
  1. 初始标记（initial mark）
      - 该阶段的目标：标记 GC Roots 直接关联的所有 Java 对象。
      - 该阶段会发生短时间的 STW 。
  2. 根区域扫描（root region scan）
      - 该阶段的目标：标记 survivor 区域引用的所有老年代 Java 对象。
      - 该阶段不会 STW 。
  3. 并发标记（concurrent mark）
      - 该阶段的目标：扫描所有老年代 region ，如果某个 region 包含较多垃圾对象，则记录到 CSet 中，准备在 mixed GC 时清理这个 region 。
        - 该策略称为垃圾优先。即只清理垃圾对象含量较多的一些 region ，这样更容易回收内存。
        - 如果清理所有 region ，虽然能回收更多内存，但 GC 耗时更久。
        - 执行 mixed GC 时，会将 Cset region 中的非垃圾对象，拷贝到空闲 region 中集中存储，然后将 Cset region 清空，变为空闲 region 。
      - 该阶段不会 STW 。
      - 每次 Concurrent Marking Cycle 时， G1GC 会创建一个 CSet（Collection Set） 数据结构，用于记录哪些老年代 region 等待清理。
      - 为了更快地扫描 region ， G1GC 会在 Java 进程启动时，为每个 region 创建一个 Rset 数据结构，用于记录哪些 region 引用了当前 region 中的对象。
        - 这样 GC 时只需扫描 RSet ，不需要扫描 region 中的所有对象。
        - 即使这样，并发标记依然耗时较久，期间可能发生多次 young GC 。
  4. 重新标记（remark）
      - 该阶段的目标：并发标记时采用三色标记法，可能漏标，因此需要进入 STW 状态，重新标记。
      - 该阶段会发生短时间的 STW 。
      - G1GC 采用 SATB（Snapshot At The Beginning）算法来重新标记，比 ConcMarkSweepGC 的重新标记更快。
  5. 清理（cleanup）
      - 该阶段的目标：保留 CSet 数据结构，清理 Rset 数据结构，结束本次 Concurrent Marking Cycle 。
      - 该阶段会发生短时间的 STW 。

- 优点：
  - 只要不发生 full GC ，STW 时长就较短。
  - 可以通过 -XX:MaxGCPauseMillis 命令行参数，软性限制 STW 时长，这样容易预测 STW 时长，避免停顿太久。
  - 处理大量内存的性能更好。
    - 以 region 为单位管理内存空间，容易增减 eden、survivor、old 三个区域的容量。
    - ConcMarkSweepGC 容易产生内存碎片，而 G1GC 通过拷贝、集中内存中的数据，避免了内存碎片。
    - 与 G1GC 相比，传统的 SerialGC、ParallelGC 只适合处理 4G 以下的堆内存，因为堆内存越大，STW 时长越久。

- 缺点：
  - 需要创建大量 Rset 数据结构，占用堆内存的 5% 左右。
  - 一般不会将 committed_memory 中的空闲内存释放给操作系统。
    - 虽然发生 full GC 时允许释放空闲内存，但 G1GC 会尽量避免发生 full GC 。

- 版本变化：
  - HotSpot 从 Java 9 开始，默认采用 G1GC ，并且弃用 ConcMarkSweepGC 。
    - 如果用户启用 ConcMarkSweepGC ，则 JVM 会打印 warning 警告。
  - HotSpot 从 Java 10 开始，将 G1GC 的 full GC 改为并发收集。
  - HotSpot 从 Java 12 开始，允许 G1GC 将未使用的内存释放给操作系统。
    - 原理：如果等待 G1PeriodicGCInterval 毫秒没有发生 STW ，则会定期触发 Concurrent Marking Cycle ，从而找出 heap 中的空闲内存，可以释放给操作系统。
    - 用户可以配置 JVM 参数 `-XX:MinHeapFreeRatio` 和 `-XX:MaxHeapFreeRatio` ，决定释放多少空闲内存。

### 性能指标

- 在不同的使用场景下，可能选用不同的垃圾收集器。为了比较它们的优劣，通常考虑以下性能指标：
  - Footprint
    - ：堆内存使用量。
  - Latency
    - ：GC 时 STW 会导致用户线程停顿。
    - 例如原来 Java 程序执行一段代码的耗时为 1s ，遇到 STW 则增加到 1.1s 。
  - 吞吐量（Throughput）
    - ：用户线程占用的 CPU 时间的比例。
    - 例：假设 JVM 总共占用了 1s 时长的 CPU ，其中用户线程占用了 0.9s ，GC 线程占用了 0.1s ，则吞吐量为 90% 。
    - 吞吐量越高，用户线程占用的 CPU 时间越多，因此能执行更多业务代码。
    - ConcMarkSweepGC、G1GC 通过并发收集减少了 STW 时长，但增加了总的 GC 耗时。它们同时运行用户线程、GC 线程，因此降低了用户线程的吞吐量。
- 上述三个指标最多同时追求两个。例如追求低延迟、高吞吐量，则减少了 GC 线程的执行时长，因此 GC 效果差，会占用更多堆内存。
  - 用户可根据自己的需求，优化 JVM 配置参数，从而提升性能。例如：
    - 如果 Java 程序直接为用户提供服务，追求低延迟，则采用 G1GC 。
    - 如果 Java 程序不追求低延迟，而是追求高吞吐量、低成本，则采用 ParallelGC 。
  - JVM 优化的幅度有限，可能只提升 30% 的性能，而且需要用户学习如何优化 JVM 并调试验证。
  - 如果 Java 程序存在大量非垃圾对象，超出了堆内存容量，则 JVM 优化也无济于事。只能增加内存，或者优化 Java 代码，例如通过分页查询减少 Java 程序同时处理的数据量、将来不及处理的数据暂存到 Kafka 。
