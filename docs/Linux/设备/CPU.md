# CPU

：中央处理单元（Central Processing Unit），又称为中央处理器（Central Processor）、处理器（Processor）。
- 是计算机的核心组件，负责读取程序、解析成指令并执行。

### 总线

- 主板上，CPU 与其它组件之间通过总线进行数据传输。总线根据用途分为三种：
  - 地址总线（Address Bus）
    - ：用于传输地址信息。
    - 只能单向传输，只支持 CPU 发送信号到存储器或 I/O 接口电路。
    - 地址总线的宽度决定了 CPU 直接寻址的最大范围。例如 8 位机的地址总线由 16 根线组成，可以并行传输 16 bits 的信号，因此 CPU 最大可以对 2^16 个存储单元进行直接寻址。
      - 如果存储单元的数量超过该范围，CPU 就无法访问超过的部分。
      - 内存每个存储单元的大小为 1 Byte ，因此 8 位机最多使用 2^16/1024=64 KB 的内存空间。同理，32 位机最多使用 2^32=4 GB 的内存空间。
  - 控制总线（Control Bus）
    - ：用于传输 CPU 对其它部件的控制信号，以及其它部件的应答、请求等信号，支持双向传输。
  - 数据总线（Data Bus）
    - ：用于传输数据，支持双向传输。
    - 数据总线的宽度通常是字长的倍数。

## 结构

### 寄存器

- 寄存器（Register）：是 CPU 内置的一些容量很小、读写速度超快的存储器，用于暂存 CPU 当前处理的数据、指令。
  - 断电时会丢失数据。

- 寄存器根据用途分为多种类型：
  - 数据寄存器
    - ：用于暂存一些通用的数据。
    - 例如 8086 CPU 有多个 16 位的数据寄存器 AX、BX、CX、DX 。每个寄存器也可分为两个 8 位的寄存器使用，比如将 AX 分为成 AH、AL 。
  - 段寄存器
    - ：用于暂存程序的代码段、数据段、栈等内容。
  - 指令指针寄存器（Instruction Pointer）
    - ：用于暂存 CPU 下一条待执行指令在代码寄存器中的偏移地址。
  - 标志位寄存器（Flag）
    - ：用一组二进制位记录当前指令的执行状态。
    - 例：
      - CF（Carry Flag ，进位标志）：若加减运算时，最高位向前发生了进位或借位，则设置 CF=1 ，否则为 0 。只有两个操作数为无符号数时 CF 标志才有意义。
      - SF（Sign Flag ，符号标志）：若运算结果的最高位为 1 ，则设置 SF=1 ，表示负数。只有两个操作数为带符号数时 SF 标志才有意义。
      - OF（Overflow Flag ，溢出标志）：若运算结果发生了溢出，则设置 OF=1 ，表示运算结果错误。只有两个操作数为带符号数时 OF 标志才有意义。
      - IF（Interrupt Flag ，中断标志）：若设置了 IF=1 ，则允许 CPU 响应来自 CPU 外部的可屏蔽中断的中断请求。

- CPU 执行程序的一般过程：
  1. 从磁盘读取程序，载入内存。
  2. 从内存或缓存读取程序，载入寄存器。
  3. 从寄存器读取程序，解析成指令，然后执行。
      - 执行过程中，如果需要用到某些数据，则从内存载入。
      - 执行过程中，可能发生上下文切换，转去执行其它程序。

#### 上下文切换

- CPU 的每个核同时只能执行一个程序（或者说一个线程），但 CPU 经常会在执行一个程序的过程中，转去执行其它程序。该过程称为上下文切换（Context Switch）。
  - 此时需要暂存当前程序的执行信息（主要是寄存器中的内容），称为上下文，以供之后 CPU 跳转回来继续执行。
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
    - 优先级最高，会打断一般程序的执行。
    - 切换时只需要暂存程序的内核态资源，不影响用户态资源。

### Cache

：CPU 芯片中的一个高速存储器，用于缓存 CPU 从内存经常读取的部分数据。

- CPU 执行某个指令时，如果需要读取某数据，会先尝试到 Cache 中查找该数据。此时分为两种情况：
  - Cache Hit ：在 Cache 中找到了，则可以立即读取该数据。
    - 内核会根据 LRU 算法来自动清理缓存的数据，提高 CPU 读取数据时的 Hit 命中率。
  - Cache Miss ：在 Cache 中没找到，则到内存中查找该数据。

- 目前的 CPU Cache 一般采用 SRAM 介质，容量为几 MB 。
  - 通常存在多级缓存。例如 L1、L2、L3 三级缓存：
    - CPU 先到 L1 Cache 中读取数据，如果 Miss 了再到 L2 Cache 中读取数据，以此类推。
    - L1、L2、L3 Cache 的读写速度大概为 500 GB/s 、300 GB/s 、200 GB/s 。
  - 多核 CPU 一般各有一个独立的 L1 缓存，然后共享同一个 L2、L3 缓存。
  - 例：查看本机的 CPU Cache 容量
    ```sh
    [root@CentOS ~]# lscpu | grep cache
    L1d cache:             32K
    L1i cache:             32K
    L2 cache:              1024K
    L3 cache:              36608K
    ```

### Write Buffer

：CPU 芯片中的一个高速存储器，用于缓冲 CPU 写入内存的所有数据。
- 优点：让 CPU 与内存异步工作，减少等待内存 IO 的耗时。

## 指令

- 指令：是使 CPU 进行某一操作的命令代码，由操作码和操作数组成。
  - 操作码：表示操作符即该操作的类型，比如数据传送、算术运算、逻辑运算、位运算等。
  - 操作数：表示该操作的对象，或者对象的地址。
    - 有的指令没有操作数，有的指令有 1 个操作数，有的指令有 2 个操作数。
  - 8086 CPU 的指令示例：
    ```nasm
    MOV   AL, 18H     ; 将源操作数 18H 存入目的操作数中，这里的目的操作数是一个数据寄存器 AL
    ADD   AL, 01H     ; 加法：计算目的操作数 AL 加上源操作数，结果存入目的操作数所指的寄存器中
    SUB   AL, 01H     ; 减法：计算目的操作数 AL 减去源操作数，结果存入目的操作数所指的寄存器中
    INC   AL          ; 增量：使操作数的值加 1
    MUL   2H          ; 无符号数的乘法：计算 AX 中的值乘以该操作数，结果存入 AX
    DIV   2H          ; 无符号数的除法：计算 AX 中的值除以该操作数，结果存入 AX
    ```

### 指令集

- 指令集是指某个 CPU 可以识别和执行的所有指令，又称为指令系统。
- 常见的 CPU 指令集架构（Instruction Set Architecture ，ISA）：
  - CISC（Complex Instruction Set Computer ，复杂指令集）

  - RISC（Reduced Instruction Set Computer ，精简指令集）
    - 精简了指令数，每个时钟周期执行一条指令。
    - 指令的长度统一。
    - 精简了寻址方式。

  - EPIC（Explicitly Parallel Instruction Computing ，显式并行指令集）

  - VLIW（Very Long Instruction Word ，超长指令集）

### 型号

#### x86

- ：指美国 Intel 公司发布的一系列 CPU 型号。
  - 指令集属于 CISC 。
  - x86 CPU 的对外授权较少，主要由 Intel 公司与 AMD 公司交叉授权，两家公司掌控了设计、生产、销售 CPU 的全部流程。
    - 有些技术专利已过期，任何公司都可以使用。
- 1987 年，Intel 公司发布了 8086 型号的 CPU ，被 IBM PC 采用而流行起来。此后的 80186、80286、80386 等型号的 CPU 都沿用这种架构，它们都以 86 结尾，因此称为 x86 架构。
  - 8086 CPU 的字长为 16 ，地址总线的宽度为 20 bits ，数据总线的宽度为 16 bits 。
  - 80386 CPU 的字长为 32 。
- 2003 年，AMD 公司将 x86 架构的字长扩展为 64 ，命名为 AMD64 ，又称为 x86_64、x64 。

#### ARM

- ：进阶精简指令集机器（Advanced RISC Machine），指英国 ARM 公司发布的一系列 CPU 型号。
  - 字长为 32 ，指令集属于 RISC 。
  - 成本低、功耗低、散热低，因此用于手机、平板等小型电子设备比 x86 更有竞争力。
  - ARM 公司只负责设计 ARM CPU 架构、指令集，不实际生产 CPU ，而是并出售许可证给其它公司，允许其研发、生产 ARM 芯片。
- 2011 年，ARM 公司发布了 ARMv8-A 架构，字长为 64 ，并且重新实现了 ARM 32 位的指令集。
  - ARMv8-A 架构划分了 AArch32、AArch64 两种执行状态，分别用于执行 32 位、64 位的指令。
- 2020 年，Apple 公司发布了一款基于 ARMv8-A 架构的 CPU ，称为 Apple Silicon M1 ，用于此后的 MacBook、iPad 等设备。

## 状态指标

### CPU 使用率

：指一定时间范围内的 CPU 平均使用率，表达式为 `%CPU = ( 1 - CPU 空闲时长 / 统计时长 ) × 100%` 。
- CPU 平时会执行多种任务，它们占用的时间会被内核分别记录：
  ```sh
  user(us)                # 用户态进程占用的时间，它不包括 nice 时间，包括 guest 时间
    guest                 # 当操作系统运行在虚拟机中时，CPU 运行 guest 操作系统的时间
  system(sy)              # 内核态进程占用的时间
  nice(ni)                # 设置了 nice 优先级的用户态进程占用的时间
  idle(id)                # CPU 的空闲时间，此时没有执行任务
  iowait(wa)              # CPU 等待磁盘读写数据的时间
  hardware interrupt(hi)  # 硬件中断占用的时间
  software interrupt(si)  # 软件中断占用的时间
  steal(st)               # 当操作系统运行在虚拟机中时，CPU 运行其它虚拟机的时间，即被偷走的时间
  ```
  - 虚拟机本身需要运行一个 guest 操作系统，用于运行、管理其它虚拟操作系统。
  - 正常情况下 iowait 会在很短时间内结束，如果 iowait 长时间较高，可能是磁盘 IO 量太大，或系统发生故障，这会导致某些进程一直处于 D 状态，占用 CPU 。

### 平均负载

：load average ，指一定时间范围内平均的活跃进程数。
- 活跃进程包括：
  - 正在被 CPU 运行的进程（Running）
  - 等待被 CPU 运行的进程（Runnable）
  - 不可中断的进程（比如 iowait）
- 理想情况下，系统的平均负载数应该刚好等于 CPU 个数，使得每个 CPU 运行一个活跃进程，且没有 CPU 空闲。
  - 例：对于有 2 个 CPU 的系统，若平均负载为 1 ，说明 CPU 使用率为 50% 。
    - 若平均负载为 2.6 ，说明 CPU 超载了，有部分进程竞争不到 CPU 。
  - 有的进程没被 CPU 运行，比如在 sleep ，也会计入平均负载的数量。因此平均负载为 4 时，可能并没有使用 4 核 CPU 。
- 根据消耗资源的偏向，可将进程分为：
  - CPU 密集型进程：进程经常用 CPU 执行运算任务，因此平均负载高时，CPU 使用率也高。
  - IO 密集型进程：进程经常等待磁盘 IO 或网络 IO ，因此平均负载高时，CPU 使用率不一定高。

## 相关概念

- 字长（Word Size）：又称为位元，指 CPU 的算术逻辑单元每次最多能处理多少位二进制数据。
  - 现代 CPU 的字长通常是 32 位、64 位。

- 多核 CPU ：指包含多个处理器核心的 CPU ，可以同时执行多个指令。
  - 通常核心数为偶数。

- 时钟周期（Clock Cycle）：CPU 的振荡器发出时钟脉冲的间隔时长。
  - 其倒数称为时钟频率。
  - 例如：一个 4 GHz 的 CPU ，每秒产生 `4*10^9` 个时钟脉冲，时钟周期为 `0.25*10*-9` 秒。

- 指令周期：CPU 执行一条指令所需的时长。
  - 不同指令的指令周期不同，因此通常是计算平均值。
  - 早期的 CPU ，每个时钟周期只能执行一条指令。现代的 CPU ，每个时钟周期可能执行多条指令。
  - 将 CPU 的时钟频率，乘以每个时钟周期平均执行的指令数（Instructions Per Cycle ，IPC），就得到每秒平均执行的指令数（Instructions Per Second ，IPS）。

- 引发 CPU 中断的原因称为中断源，主要分为两大类：
  - 内部中断：是 CPU 内部的中断，例如除法出错中断、溢出中断、软件中断指令 INT n 。
  - 外部中断：又称为硬件中断，是计算机的其它组件通过 CPU 的芯片引脚传入的中断信号。

### 计算机结构

- 1945 年，冯·诺依曼（Von Neumann）在论文中提出了一种可以存储指令并执行的计算机结构，被称为冯·诺依曼结构，是目前最流行的计算机结构。
- 冯诺依曼结构在逻辑上分为五个部分：
  - 运算器（Arithmetic Unit）
    - ：负责执行指令、进行运算。
    - 核心部件是算术逻辑单元（Arithmetic Logic Unit ，ALU），能进行算术运算、逻辑运算、位运算等操作。
    - 运算结果会保存到存储器中，或者暂存在累加器中。
  - 控制器（Control Unit）
    - ：负责从存储器读取指令，进行译码分析（即编码的逆过程），然后调用相关部件执行该指令。
    - 例如读取到一个跟运算相关的指令，就取出操作数，发送到运算器进行运算。
  - 存储器（Memory Unit）
    - ：负责用于存储数据和指令。
    - 主要分为内部存储器、外部存储器两种，简称为内存、外存。
  - 输入设备
    - ：负责接收用户或其它设备输入的信息，转换成计算机能识别的数据，然后保存到存储器中。
    - 例如鼠标、键盘。
  - 输出设备
    - ：负责将计算机的数据转换成适当形式的信息，输出给用户或其它设备。
    - 例如显示屏、打印机。
    - 输入、输出设备统称为 IO 设备。

- 现代计算机的各个硬件通常集成在一大块集成电路板上，称为主板。其核心元件为 CPU 。
  - CPU 是一小块芯片，包含了运算器、控制器、寄存器、缓存等元件。

### 存储设备

- 计算机中存在多种存储设备，读写速度从高到低分别为：CPU 寄存器 > CPU Cache / Buffer >> 内存 >> 磁盘
  - 时钟频率、访问延迟也是这样的顺序。
  - 成本则相反顺序。一般磁盘的 IO 速度最慢，但成本最低，因此相同价格时的容量最大。
  - 除了读写速度的差异，CPU 寄存器、Cache / Buffer、内存在断电之后不会保存数据，而外存在断电之后能持久保存数据。

- CPU 处理数据的速度，比外存读写数据的速度，快很多倍。让 CPU 同步读写外存时，会浪费时间等待 IO 。因此 CPU 采用异步读写，通过内存、Cache 中转数据。
  - 读取文件的流程示例：
    1. CPU 要求读取一个文件，发送指令给磁盘驱动器。然后 CPU 可以执行其它任务，不必浪费时间等待。
    2. 磁盘驱动器寻址到文件数据，拷贝到磁盘驱动器的内部缓冲区。然后发送中断通知 CPU ，于是 CPU 发生上下文切换，回来执行当前任务。
    3. CPU 从磁盘拷贝数据到内存。
        - 先拷贝到内存中的 Page Cache 空间，此时只能被内核态进程访问。
        - 从 Page Cache 拷贝到进程内存空间，此时才能被用户态进程访问。
        - 为了减少 CPU 亲自拷贝数据的耗时，通常在计算机中加入 DMA（Direct Memory Access，直接内存访问）控制器，代替 CPU 接收第 2 步的中断信号，将数据拷贝到 Page Cache ，然后发送中断通知 CPU 。
    3. CPU 从内存拷贝数据到 CPU Cache ，再拷贝到 CPU 寄存器，供 CPU 直接访问。
  - 写入文件的流程相反，先由 CPU 从进程内存空间拷贝数据到 Page Cache ，再由 DMA 拷贝到磁盘。

### CPU 多核架构

- 现代的一个计算机中通常包含多核 CPU ，常见架构：
  - 对称多处理器（Symmetric Multi-Processor ，SMP）
    - ：各个 CPU 之间平等，共享内存、IO 设备等资源。
    - 同时只能有一个 CPU 通过内存总线访问内存，因此 CPU 为 2~4 核时的利用率最高。增加 CPU 数量时，则 CPU 越来越可能因为等待访问内存而阻塞，导致利用率越来越低。
  - 非一致内存访问（Non-Uniform Memory Access ，NUMA）
    - ：在计算机中划分多个节点（node），每个节点包含多核 CPU 、独立内存。
    - 各节点的 CPU 可以并发访问本节点的内存，也可以通过互联模块访问其它节点的内存，但比本地内存的访问速度慢。
    - SMP 属于一致内存访问。与 SMP 相比，NUMA 大幅提高了 CPU 利用率，但跨节点访问内存时慢。
  - 大规模并行处理（Massive Parallel Processing ，MPP）
    - ：将多个 SMP 服务器通过网络连通，组成一个计算机系统。
    - 与 NUMA 相比，MPP 不存在跨节点的内存访问。增加 CPU 时，系统性能会线性提升。

- 例：查看本机的 NUMA 节点
  ```sh
  [root@CentOS ~]# lscpu | grep NUMA
  NUMA node(s):          2
  NUMA node0 CPU(s):     0-15
  NUMA node1 CPU(s):     16-31
  ```
  - 上例中有 2 个 NUMA 节点，分别包含 16 核 CPU 。
  - 如果只有 1 个 NUMA 节点，则属于 SMP 架构。

## 相关命令

### uptime

```sh
$ uptime      # 显示系统运行时长、CPU 平均负载
```
- 例：
  ```sh
  [root@CentOS ~]# uptime
  up 21 days, 41 min,  1 users,  load average: 0.52, 0.58, 0.59
  ```
  - up 21 days, 41 min ：表示系统的运行时长。
  - 1 users ：表示已登录的用户数。
  - load average: 0.52, 0.58, 0.59 ：表示最近 1 分钟、5 分钟、15 分钟的平均负载。

### perf

：用于测试执行一条命令，查看各个事件占用的 CPU 时长。

```sh
$ perf top    # 显示占用 CPU 的各个事件（采样分析）
       -g     # 增加显示各个进程的子进程
```
- 例：
  ```sh
  [root@CentOS ~]# perf top
  Samples: 4K of event 'cpu-clock', 4000 Hz, Event count (approx.): 828026549 lost: 0/0 drop: 0/0
  Overhead  Shared Object         Symbol
    22.91%  perf                  [.] __symbols__insert
      9.82%  perf                  [.] rb_next
      7.34%  [kernel]              [k] clear_page_c_e
      2.33%  libc-2.17.so          [.] __strchr_sse42
      1.86%  perf                  [.] rb_insert_color
  ```
  - 第一行中，Samples 表示采样率，event 表示事件类型，Event count 表示占用 CPU 时钟周期的事件总数。
  - Overhead  ：该事件在样本中的比例。
  - Shared  ：该事件所在的动态共享对象，比如内核名、进程名。
  - Object  ：该动态共享对象的类型，比如[.]表示用户控件、[k]表示内核空间。
  - Symbol  ：该事件的名称，大多为某个进程的函数名称，或者是内存地址。
  - 在显示窗口中，可按方向键上下选择事件，按回车键进入子菜单。

```sh
$ perf record <command> # 记录执行某条命令时，其中各个事件的 CPU 使用率

$ perf report           # 显示 perf record 记录的信息
```
- 例：
  ```sh
  [root@CentOS ~]# perf record ls
  actions-runner  node_modules  Notes  package.json  perf.data  yarn.lock
  [ perf record: Woken up 1 times to write data ]
  [ perf record: Captured and wrote 0.014 MB perf.data (6 samples) ]
  ```
  ```sh
  [root@CentOS ~]# perf report
  Samples: 6  of event 'cpu-clock', Event count (approx.): 1500000
  Overhead  Command  Shared Object      Symbol
    16.67%  ls       [kernel.kallsyms]  [k] copy_user_enhanced_fast_string
    16.67%  ls       [kernel.kallsyms]  [k] get_seconds
    16.67%  ls       [kernel.kallsyms]  [k] prepend_name
    16.67%  ls       [kernel.kallsyms]  [k] vma_interval_tree_insert
    16.67%  ls       ld-2.17.so         [.] _dl_lookup_symbol_x
    16.67%  ls       libc-2.17.so       [.] __sysconf
  ```

```sh
$ perf stat <command>   # 分析某条命令占用 CPU 的过程
```
- 例：
  ```sh
  [root@CentOS ~]# perf stat uname
  Linux

    Performance counter stats for 'uname':

                0.89 msec  task-clock                #    0.393 CPUs utilized
                    1      context-switches          #    0.001 M/sec
                    0      cpu-migrations            #    0.000 K/sec
                  165      page-faults               #    0.186 M/sec
      <not supported>      cycles
      <not supported>      instructions
      <not supported>      branches
      <not supported>      branch-misses

          0.002252426 seconds time elapsed

          0.000000000 seconds user
          0.001507000 seconds sys
  ```
  各字段的含义：
  ```sh
  task-clock (msec)     # 该命令使用 CPU 的毫秒数。备注的 CPUs utilized 表示使用了 CPU 的几个核
  context-switches      # 上下文切换的次数
  cache-misses          # CPU 在 cache 中找不到需要读取的数据的次数
  cpu-migrations        # 进程被迁移到其它 CPU 上运行的次数
  page-faults           # CPU 抛出 page fault 异常的次数
  cycles                # CPU 的时钟周期数。一条指令的执行可能需要多个 cycles
  instructions          # 指令数。Instructions/Cycles 的比值越大越好
  seconds time elapsed  # 运行该命令消耗的秒数
  ```
