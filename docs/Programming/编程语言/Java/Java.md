# Java

：一种编译型语言。
- 通过 JVM 容易实现跨平台运行，因此常用于开发 Web 应用、Android 应用。

## 相关历史

- 1991 年，Sun 公司的 James Gosling 等人开始研发一种适用于单片机系统的编程语言。
  - 他们将 C++ 语言进行简化，抛弃了多继承、指针等复杂功能，并提高程序的兼容性。
  - 他们将这种语言取名为 Oak ，介绍给硬件厂商，但并没有受到欢迎。
- 1995 年，Sun 公司发现 Oak 语言在互联网上的应用优势：它容易移植到不同平台上运行。于是将它改名为 Java 重新发布，终于成功推广。
- 2010 年，Sun 公司被 Oracle（甲骨文）公司收购。
- 从 2019 年 1 月开始，使用 Java 8 及以上版本的 Oracle JDK 需要付费。因此推荐使用 OpenJDK 。

## 语法特点

- Java 源文件的扩展名为 .java 。需要先编译成扩展名为 .class 的类文件，再交给 JVM 解释执行。
- 每个语句的末尾以分号 ; 作为分隔符。
- 用 `//` 声明单行注释，用 `/*`、`*/` 声明多行注释。
- 支持面向对象编程，但不支持定义函数。
- Java 的语法与 C++ 相似，但是做出了许多优化，比如：
  - 丢弃了 C++ 中一些难用的功能，比如操作符重载、多继承。
  - 用引用取代了指针，并自动回收垃圾内存。

## 相关概念

- JMX（Java Management Extensions）
  - ：一组用于监控、管理 Java 应用的 API ，属于 Java 标准库。
    - 将被管理的对象称为 MBean（Managed Bean）。
    - 基于 RMI（Remote Method Invocation ，远程方法调用）协议进行通信。
  - 在 Java 应用中调用 JMX 库，实现其接口，便可以从外部通过 HTTP 通信等方式监控、管理该 Java 应用。
- JAAS（Java Authentication and Authorization Service ，Java 认证和授权服务）
  - ：一个进行身份认证的 Java 框架，内置在 JRE 中。
- JDBC（Java Database Connectivity）
  - ：Java 程序访问数据库的 API 规范，主要用于关系型数据库。
  - JDBC 通过特定格式的 URL 连接到数据库，配置示例：
    ```yml
    datasource:
      driverClassName: com.mysql.jdbc.Driver
      url: jdbc:mysql://10.0.0.1:3306/test?characterEncoding=utf8&connectionCollation=utf8mb4_general_ci&autoReconnect=true&useSSL=false
      username: root
      password: ******
    ```
- Mybatis
  - ：一个 Java 的持久化框架。
  - 用户不需要直接编写 JDBC 代码，而是先在 XML 文件中编写 SQL 语句，然后通过 Java 方法调用。但可读性差。
  - Java 持久化框架还有 Hibernate、JPA 等。
  - 开发 Java Web 项目的常用框架：
    - SSH（Spring + Struts + Hibernate）
    - SSM（Spring + SpringMVC + MyBatis）
- Java 的日志框架
  - java.util.logging ：Java 的标准库，是 JDK 内置的日志框架。
  - Log4j ：一个 Apache 开源项目，已停止开发。使用一个配置文件 log4j.properties ，支持自动轮换日志文件。
  - LogBack ：重新实现了 Log4j ，大幅优化。
  - Log4j2 ：对 Log4j 进行了重构优化。
- Scala
  - ：一种基于 Java 的编译型语言，于 2004 年发布。
  - 将源代码编译成 Java 字节码，然后由 JVM 运行。
  - 支持面向对象编程、函数式编程，属于静态类型语言。

### GC

：垃圾回收（Garbage Collection），是 JVM 的一项功能，用于在运行 Java 程序时自动找出垃圾对象，删除它们从而回收内存。
- 当用户编写了一个 Java 程序，用 JVM 运行时。JVM 会创建一些用户线程，负责执行用户代码。还会在某些条件下，自动创建 GC 线程，负责垃圾回收。

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
  - 当 JVM 需要存储新数据（比如新建的 Java 对象）时，就会选用一些 free_memory 。如果当前的 free_memory 不足以存储新数据，则可能自动申请更多 committed_memory ，从而凭空增加 free_memory 。也可能自动进行 GC ，从而将 committed_memory 中的某些 used_memory 转换成 free_memory 。
    - 当 JVM 进程申请的 committed_memory 达到 MaxHeapSize、MaxDirectMemorySize 等限制时，就不能继续增加。此时只能依靠 GC 在 Heap 中获得空闲内存。
  - GC 一般不会减少 committed_memory ，也不会将 committed_memory 中的空闲内存释放给操作系统，而是留给 JVM 自己以后使用。因为释放内存、重新申请内存的开销较大。
    - 频繁 GC 会造成较大 CPU 负载，可能导致 Java 进程假死、端口无响应。
    - 如果 GC 之后空闲内存依然不足，则会抛出 OutOfMemoryError 错误。
      - java.lang.OutOfMemoryError 属于错误，不属于异常，但可以被 try catch 捕捉。
      - Java 进程抛出 OutOfMemoryError 错误时，可能崩溃退出，也可能继续运行。

- 对象的引用分为四种，从强到弱如下：
  - 强引用（Strong Reference）
    - ：指向一些必须保留的对象，比如 `Object obj = new Object()` 。
    - 即使内存不足，强引用也不会被 GC 算法回收。
    - 强引用是造成内存泄漏的主要原因。
  - 软引用（Soft Reference）
    - ：指向一些可能有用，但不是必须保留的对象。
    - 当内存不足时，会被 GC 算法回收。
  - 弱引用（Weak Reference）
    - ：指向一些不需要保留的对象。
    - 每次 GC 时，都会被回收。
  - 虚引用（Phantom Reference）
    - ：最弱的引用，相当于没有引用。
    - 不能用于获取对象的实例，主要用于判断对象是否被垃圾回收。

- GC 时，首先需要找出垃圾对象，常见的几种算法：
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

- 找出垃圾对象之后，需要删除它们从而回收内存，常见的几种算法：
  - 标记-清除（Mark-Sweep）
    - ：先标记垃圾对象，然后删除它们。
    - 优点：实现简单，GC 耗时最少。
    - 缺点：删除一些垃圾对象之后，释放的空闲内存通常地址不连续，比较零散，容易产生内存碎片，导致内存使用率低。
  - 标记-整理（Mark-Compact）
    - ：在 Mark-Sweep 算法之后，增加一个称为 Compact 的步骤，移动所有非垃圾对象的内存地址，从堆内存的头部开始连续存储。
    - 优点：不会产生内存碎片。
    - 缺点：Compact 步骤增加了 GC 耗时。
  - 标记-复制（Mark-Copy）
    - ：将堆内存分为两个区域 A、B ，循环使用：
      1. 最初只使用区域 A ，不使用区域 B 。
      2. 等区域 A 内存不足而触发 GC 时，将区域 A 中所有非垃圾对象拷贝到区域 B ，从区域 B 的头部开始连续存储。然后清空区域 A 的所有数据。
      3. 接下来只使用区域 B ，不使用区域 A 。
      4. 等区域 B 内存不足而触发 GC 时，按上述流程循环使用区域 A 。
    - 优点：与 Mark-Sweep 算法相比，不会产生内存碎片。与 Mark-Compact 算法相比，GC 耗时更少。
    - 缺点：内存使用率低于 50% 。
  - 分代收集（Generational Collection）
    - ：将堆内存分为两个区域，采用不同的 GC 算法：
      - 年轻代（young generation）：又称为新生代（new generation），用于存储存在时间较短的 Java 对象。预计该区域每分钟都有大量对象变成垃圾，需要经常清理，因此适合采用 Mark-Copy 算法，尽量减少 GC 耗时。
      - 老生代（old generation）：用于存储存在时间较长的 Java 对象。预计不需要经常清理，因此适合采用 Mark-Compact 算法。
    - 优点：一般的 Java 程序中，大部分 Java 对象会在创建之后的短期内停止引用，只有少部分对象会长期保留。因此对这两类对象用不同的 GC 算法处理，效率更高。
    - 年轻代细分为两种区域：
      - 伊甸园空间（eden space）：用于存储新创建的对象。
      - 幸存者空间（survivor space）：用于存储在 young GC 之后幸存、但尚未存入 old 区域的对象。
        - 默认创建了两个 survivor space 实例，简称为 S0、S1 ，或称为 From、To 。根据 Mark-Copy 算法循环使用两个实例，比如最初只使用 S0 ，等 GC 时，将 S0 中所有非垃圾对象拷贝到 S1 。
    - 根据作用域的不同， GC 分为以下几种模式：
      - young GC
        - ：又称为 Minor GC 。
        - young 区域的 Java 对象存储在 eden space 和一个 survivor space （假设为 S0）中。当 eden space 的空闲内存不足以存入新对象时，会触发一次 young GC ，将 eden space 和 S0 中所有非垃圾对象拷贝到 S1 ，然后清空 eden space 和 S0 ，供未来存入新对象。
          - 如果 S1 的空闲内存不足以存入对象，则将对象直接拷贝到 old 区域。
          - 下一次触发 young GC 时，会将 eden space 和 S1 中所有非垃圾对象拷贝到 S0 。
        - 新创建的 Java 对象最初存储在 young 区域的 eden space 。
          - 如果对象活过了第一次 young GC ，则从 eden space 拷贝到一个 survivor space 。
          - 之后对象每活过一次 young GC ，则从一个 survivor spac 拷贝到到另一个 survivor space 。这样能多过滤几次垃圾对象，减少拷贝到 old 区域的对象数量。
          - 如果对象活过 young GC 的次数达到 TenuringThreshold 阈值，则从 survivor space 拷贝到 old 区域，该过程称为长期保留（Tenuring）、晋升（Promotion）。
          - JVM 会自动调整 TenuringThreshold 的大小。尽量增加 TenuringThreshold ，从而减少拷贝到 old 区域的对象数量，但不至于让 survivor space 溢出。
      - old GC
        - ：又称为 Major GC 。
        - 当 old 区域的内存不足时，会触发一次 old GC ，将 old 区域中存在时间较长的对象删除。
        - young GC 与 old GC 相互独立，可以同时执行。
      - full GC
        - ：当 old 或 DirectMemory 或 Metaspace 区域的内存不足时，会触发一次 full GC ，对 young、old、DirectMemory、Metaspace 区域全部进行 GC 。
        - 目前 full GC 没有严格的标准，有的垃圾收集器的 old GC 相当于 full GC 。
    - young 区域中大部分对象一般会在短期内停止引用，活不到 old 区域，因此两个区域的内存开销不同。
      - HotSpot 假设 old 区域的内存开销更大，默认配置了 -XX:NewRatio=2 ，使得 old 区域容量是 young 的 2 倍。
      - 如果 Java 程序短期内创建过多新对象，则可能 young 区域内存不足而频繁 GC ，此时需要增加 young 区域的容量。
      - 如果 Java 程序长期保留了大量对象，则可能 old 区域内存不足而频繁 GC ，此时需要增加 old 区域的容量。

- STW（Stop The World）
  - ：GC 过程中的一种状态，会暂停执行用户线程，只执行 GC 线程。
  - 如果不暂停执行用户线程，则在 GC 的过程中，可能出现以下问题：
    - 错删：某些已标记为垃圾的对象，可能被重新引用、变为非垃圾对象，之后被 GC 删除，导致用户线程执行出错。
    - 漏删：某些未标记为垃圾的对象，可能变为垃圾对象，没有被本次 GC 删除。
  - 缺点：STW 会导致用户线程停顿，甚至 Java 进程假死。
  - 不同 GC 算法的 STW 时长不同。与 young GC、old GC 相比，full GC 需要清理全部内存，因此 STW 时间通常最长。

- 综上，存在多种 GC 算法。而实现 GC 算法的程序称为垃圾收集器（Garbage Collector，GC），例如：
  - SerialGC
    - ：串行垃圾收集器。
    - 特点：
      - 分代收集：young GC 采用 Mark-Copy 算法，old GC 采用 Mark-Compact 算法，全程处于 STW 状态。
      - GC 时运行单个 GC 线程。
    - 优点：实现简单，是 JVM 最古老的一个垃圾收集器。
    - 缺点：堆内存超过 100MB 时，单个 GC 线程的处理速度慢，导致 STW 时间长。
  - ParallelGC
    - ：并行垃圾收集器。
    - 特点：
      - 分代收集：young GC 采用 Mark-Copy 算法，old GC 采用 Mark-Compact 算法，全程处于 STW 状态。
      - GC 时运行多个 GC 线程。
    - 优点：堆内存超过 100MB 时，GC 速度比 SerialGC 快几倍。
    - 缺点：依然全程处于 STW 状态。
  - ConcMarkSweepGC（Concurrent Mark Sweep）
    - ：第一个支持并发收集的垃圾收集器。
    - 特点：
      - 分代收集：young GC 采用 Mark-Copy 算法，处于 STW 状态。old GC 采用 Mark-Sweep 算法并进行了魔改，使得大部分时间不处于 STW 状态。
    - old GC 分为多个阶段：
      1. 初始标记（Initial Mark）：最初将所有对象标记为白色，然后找出 GC Roots 直接关联的所有 Java 对象，标记为灰色。
      2. 并发标记（Concurrent Mark）：找出灰色对象引用的所有对象（即使为空），然后将前者标记为黑色，将后者标记为灰色。递归执行该操作，直到不存在灰色对象。
          - 该过程称为三色标记法，最后剩下的白色对象就是不在引用链上的对象，视为垃圾对象。
          - GC Roots 中有的对象处于 young 区域，有的对象处于 old 区域。因此虽然这是 old GC ，不是 full GC ，但会扫描一遍 young、old 区域的所有可达对象，才能找出 old 区域的垃圾对象。
          - 该并发阶段同时运行用户线程、GC 线程，可能有些对象刚刚标记，又被用户线程修改了引用，还可能有些对象从 young 区域晋升到 old 区域，加入 old GC 的范围。因此并发标记的结果不可靠，需要接下来几个阶段重新标记。
      3. 并发预清洗（Concurrent Preclean）：在并发标记期间可能有些对象发生了变化，需要重新标记。
      4. 并发终止预清洗（Concurrent Abortable Preclean）：该阶段像 Concurrent Preclean ，但可通过 JVM 参数限制该阶段的耗时，提前终止。
      5. 最终重新标记（Final Remark）：该阶段进入 STW 状态，检查已标记为垃圾的对象，确保它们依然没有被引用。
          - Final Remark 能避免误删，但不能避免漏删：某些未标记为垃圾的对象，在 Final Remark 之前变为垃圾对象，因此没被本次 GC 删除，等下一次 GC 才会被删除，称为浮动垃圾（floating garbage）。
      6. 并发扫描（Concurrent Sweep）：删除垃圾对象。
      7. 并发重置（Concurrent Reset）：重置 ConcMarkSweepGC 垃圾收集器，准备开始下一次 old GC 。
          - 上述 5 个并发阶段不处于 STW 状态，虽然耗时长，但不会导致用户线程停顿。
          - 其它 2 个阶段虽然处于 STW 状态，但耗时短，可以忍受。
    - 优点：
      - old GC 的大部分时间不处于 STW 状态，允许同时运行用户线程、GC 线程。
    - 缺点：
      - young GC 依然处于 STW 状态。
      - old GC 同时运行用户线程、GC 线程，因此用户线程、GC 线程的执行速度都变慢了。用户线程的吞吐量降低 10% 左右，GC 线程的耗时比 ParallelGC 久。
        - ConcMarkSweepGC 默认创建的 GC 线程数等于 CPU 核数除以 4 ，至少为 1 。因此 CPU 核数越少，吞吐量降幅越大。
      - old GC 会产生浮动垃圾，导致 old 区域占用内存增加 10% 左右。
      - old GC 采用 Mark-Sweep 算法，容易产生内存碎片。
        - 不采用 Mark-Compact、Mark-Copy 算法，是因为移动对象的内存地址时，必须处于 STW 状态。
        - JVM 对 ConcMarkSweepGC 默认启用了 -XX:+UseCMSCompactAtFullCollection 功能，当不能存储大对象时，自动清理内存碎片。
    - HotSpot 从 Java 9 开始弃用 ConcMarkSweepGC ，采用它时会显示 warning ，建议改用 G1GC 。


  - G1GC（Garbage-First）
  <!-- 采用自创的 G1GC 算法 -->
    - ：类似 ConcMarkSweepGC 算法，但能减少内存碎片、限制 STW 时长。
    - 传统 GC 算法的 young、old 区域分别是一块地址连续的内存空间。而 G1GC 在堆内存中划分大量 region ，分别分配给 eden、survivor、old 区域。
      - 每个 region 是一小块地址连续的内存空间，体积相同。
      - 体积巨大的对象（humongous object）可能占用多个地址连续的 region 。
      - 分代 GC 时只需改变 region 所属的内存区域，属于移动式算法，不需要复制 region 。
    - G1GC 有几种模式：
      - young GC ：清理年轻代。比如将 eden 区域中幸存的 region 分配给 survivor、old 区域。
      - mixed GC ：清理年轻代，还会清理老生代中垃圾较多（即活动对象较少）的 region ，称为垃圾优先。
      - full GC ：当老年代内存不足时，清理全部堆内存。
    - HotSpot 对于 Java 8 默认采用 ParallelGC ，Java 9 开始默认采用 G1GC 。



- 在不同的使用场景下，可能选用不同的垃圾收集器。为了比较它们的优劣，通常计算以下性能指标：
  - Footprint
    - ：堆内存使用量。
  - Latency
    - ：GC 时 STW 会导致用户线程停顿。
    - 例如原来 Java 程序执行一段代码的耗时为 1s ，遇到 STW 则增加到 1.1s 。
  - 吞吐量（Throughput）
    - ：用户线程占用的 CPU 时间的比例。
    - 例：假设 JVM 总共占用了 1s 时长的 CPU ，其中用户线程占用了 0.9s ，GC 线程占用了 0.1s ，则吞吐量为 90% 。
    - 吞吐量越高，用户线程占用的 CPU 时间越多，因此能执行更多业务代码。
  - 上述三个指标最多同时追求两个。例如追求低延迟、高吞吐量，则减少了 GC 线程的执行时长，因此 GC 效果差，会占用更多堆内存。
    - 用户可根据自己的需求，调整 java 启动命令中的 GC 参数。例如追求低延迟，则采用 G1GC ，限制 MaxGCPauseMillis 。

- 参考文档：
  - [HotSpot GC 调优指南](https://docs.oracle.com/en/java/javase/11/gctuning/introduction-garbage-collection-tuning.html)
  - [plumbr GC handbook](https://plumbr.io/handbook/garbage-collection-algorithms-implementations)
om/understanding-and-optimizing-garbage-collection/)

<!-- 只有 Serial GC 和 G1 将未使用的 committed_memory 释放给操作系统？ -->


### 关于 Web

- JSP（Java Server Pages）
  - ：一种动态网页开发技术，可以在 HTML 文件中通过特定的标签嵌入 Java 代码。
  - 例：
    ```html
    <p>
    今天的日期是: <%= (new java.util.Date()).toLocaleString()%>
    </p>
    ```

- Servlet
  - ：一个提供 Web 应用服务的 Java 程序，本质上是实现了 javax.servlet.Servlet 接口的 Java 类。
  - 可以运行在支持 Servlet 规范的 Web 服务器中，比如 Tomcat、Jetty 。

- Netty
  - ：一个 Java 的 Socket 通信框架，支持 TCP、UDP 等协议，或自定义协议。
  - 采用非阻塞 IO （NIO），并发能力强。

### spring

- Spring Framework
  - ：一个流行的 Java 应用开发框架，于 2002 年发布。
  - 内嵌了一个 Tomcat ，因此可以开发 Web 应用，作为 Web 服务器运行。
  - Spring 中的应用程序由一个或多个 bean 对象组成，由 IoC 容器管理。
  - 编程时不需要主动 new 对象，而是在代码中声明需要的对象，并在 XML 文件中配置。程序运行时，IoC 容器会去自动根据配置创建对象。
    - 对象的控制权从程序员手中，转交给了程序自身，因此称为控制反转（Inversion of Control ，IoC）。
    - 例：
      ```java
      @Component              // 使用 Component 注解，将该类定义为 Bean 。创建对象时，会根据类名来默认命名（开头小写），比如 phone
      public class Phone {
          ...
      }

      @Component
      public class Person {
          @Autowired          // 使用 Autowired 注解，创建对应类型的 Bean 对象并注入该属性
          Phone phone;

          ...
      }
      ```

- [Spring Boot](https://spring.io/projects/spring-boot)
  - ：一个基于 Spring Framework 4.0 的轻量级框架，于 2014 年发布。
  - 增加了一些默认配置，简化了开发流程，可以快速开发单个应用。

- Spring Cloud
  - ：一个基于 Spring Boot 的微服务框架，于 2015 年发布。
  - 包含多个组件：
    - Config ：配置管理中心，基于 git 存储配置信息。例：
      ```java
      @Value("${test.name}")    // 添加注解，将指定的配置参数赋值给该变量
      String name = "Hello";
      ```
    - Bus ：消息总线，用于动态更新配置。
      - 每次修改配置时，会自动发送 HTTP 请求通知使用该配置的所有服务，让它们重新从 Config 读取配置。
    - Eureka ：用于服务发现。
    - Ribbon ：一个 HTTP 客户端，发出请求时会对服务器进行负载均衡。
    - Feign ：一个声明式的 Restful 客户端，简化了访问微服务的过程，并基于 Ribbon 进行负载均衡。例：
      ```java
      @FeignClient("service1")        // 添加注解，声明要调用的目标服务名
      static interface TestService {
          @GetMapping("/name")        // 添加注解，使得调用该方法时，会发送 GET 请求到目标服务的指定 URL
          public String name();
      }
      ```
    - Hystrix ：断路器，自动进行服务熔断。
    - Zuul ：API 网关，用于将服务暴露到集群外，并进行负载均衡、鉴权。
