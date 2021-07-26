# CPU

：中央处理单元（Central Processing Unit），又称为中央处理器（Central Processor）、处理器（Processor）。
- 是计算机的核心组件，负责读取程序、解析成指令并执行。

## 计算机结构

- 1945 年，冯·诺依曼（Von Neumann）在论文中提出了一种可以存储指令并执行的计算机结构，被称为冯·诺依曼结构，是目前最流行的计算机结构。
- 冯诺依曼结构在逻辑上分为五个部分：
  - 运算器（Arithmetic Unit）
    - ：负责执行指令、进行运算。
    - 核心部件是算术逻辑单元（Arithmetic Logic Unit，ALU），能进行算术运算、逻辑运算、位运算等操作。
    - 运算结果会保存到存储器中，或者暂存在累加器中。
  - 控制器（Control Unit）
    - ：负责从存储器读取指令，进行译码分析（即编码的逆过程），然后调用相关部件执行该指令。
    - 例如读取到一个跟运算相关的指令，就取出操作数，发送到运算器进行运算。
  - 存储器（Memory Unit）
    - ：负责用于存储数据和指令。
    - 分为内存储器、外存储器两种。
  - 输入设备
    - ：负责接收用户或其它设备输入的信息，转换成计算机能识别的数据，然后保存到存储器中。
    - 例如鼠标、键盘。
  - 输出设备
    - ：负责将计算机的数据转换成适当形式的信息，输出给用户或其它设备。
    - 例如显示屏、打印机。
    - 输入、输出设备统称为 IO 设备。

- 现代计算机的各个硬件通常集成在一大块集成电路板上，称为主板。其核心元件为 CPU 。
  - CPU 是一小块芯片，包含了运算器、控制器、寄存器、缓存等元件。


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

## 指令

- 指令：是使 CPU 进行某一操作的命令，由操作码和操作数组成。
  - 操作码：表示操作符即该操作的类型，比如数据传送、算术运算、逻辑运算、位运算等。
  - 操作数：表示该操作的对象，或者对象的地址。
    - 有的指令没有操作数，有的指令有 1 个操作数，有的指令有 2 个操作数。
  - 8086 CPU 的指令示例：
    ```nasm
    MOV   AL, 18H     ; 将源操作数 18H 存入目的操作数中，这里的目的操作数是一个数据寄存器 AL
    ADD   AL, 1H      ; 加法：计算目的操作数 AL 加上源操作数，结果存入目的操作数所指的寄存器中
    SUB   AL, 1H      ; 减法：计算目的操作数 AL 减去源操作数，结果存入目的操作数所指的寄存器中
    INC   AL          ; 增量：使操作数的值加 1
    MUL   2H          ; 无符号数的乘法：计算 AX 中的值乘以该操作数，结果存入 AX
    DIV   2H          ; 无符号数的除法：计算 AX 中的值除以该操作数，结果存入 AX
    ```

- 字长（Word Size）：又称为位元，指 CPU 的算术逻辑单元每次最多能处理多少位二进制数据。
  - 现代 CPU 的字长通常是 32 位、64 位。
  - CPU 指令的长度、数据总线的宽度通常是字长的倍数。

- 多核 CPU ：指包含多个处理器核心的 CPU ，可以同时执行多个指令。
  - 通常核心数为偶数，共享二级缓存。

- 时钟周期（Clock Cycle）：CPU 的振荡器发出时钟脉冲的间隔时长。
  - 其倒数称为时钟频率。
  - 例如：一个 4 GHz 的 CPU ，每秒产生 `4*10^9` 个时钟脉冲，时钟周期为 `0.25*10*-9` 秒。

- 指令周期：CPU 执行一条指令所需的时长。
  - 不同指令的指令周期不同，因此通常是计算平均值。
  - 早期的 CPU ，每个时钟周期只能执行一条指令。现代的 CPU ，每个时钟周期可能执行多条指令。
  - 将 CPU 的时钟频率，乘以每个时钟周期平均执行的指令数（Instructions Per Cycle ，IPC），就得到每秒平均执行的指令数（Instructions Per Second ，IPS）。

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

## CPU 型号

### x86

- ：指美国 Intel 公司发布的一系列 CPU 型号。
  - 指令集属于 CISC 。
- 1987 年，Intel 公司发布了 8086 型号的 CPU ，被 IBM PC 采用而流行起来。此后的 80186、80286、80386 等型号的 CPU 都沿用这种架构，它们都以 86 结尾，因此称为 x86 架构。
  - 8086 CPU 的字长为 16 ，地址总线的宽度为 20 bits ，数据总线的宽度为 16 bits 。
  - 80386 CPU 的字长为 32 。
- 2003 年，AMD 公司将 x86 架构的字长扩展为 64 ，命名为 AMD64 ，又称为 x86_64、x64 。

### ARM

- ：进阶精简指令集机器（Advanced RISC Machine），指英国 Arm 公司发布的一系列 CPU 型号。
  - 字长为 32 ，指令集属于 RISC 。
  - 成本低、功耗低、散热低，因此用于手机、平板等小型电子设备比 x86 更有竞争力。
- ARM 公司只负责设计 CPU 架构、出售许可证，而 Intel 公司掌握了设计、生产、销售 CPU 的整个流程。
- 2011 年，Arm 公司发布了 ARMv8-A 架构，字长为 64 ，并且重新实现了 ARM 32 位的指令集。
  - ARMv8-A 架构划分了 AArch32、AArch64 两种执行状态，分别用于执行 32 位、64 位的指令。

## CPU 状态

### CPU 使用率

：指一定时间范围内的 CPU 平均使用率，表达式为 `%CPU = ( 1 - CPU 空闲时长 / 统计时长 ) × 100%` 。

CPU 被占用的时间分为多种用途：
- user（us）：用户态进程占用的 CPU 时间。它不包括 nice 的时间。
- system（sy）：内核态进程占用的 CPU 时间。
  - %system 较大时可能是因为磁盘 IO 多、内核进程多。
- nice（ni）：低优先级的用户态进程占用的 CPU 时间。
- idle（id） ：CPU 的空闲时间。
- iowait（wa） ：CPU 等待磁盘读写数据的时间。
  - 正常情况下 iowait 会在很短时间内结束，如果 iowait 长时间较高，可能是磁盘 IO 量太大，或系统发生故障，这会导致某些进程一直处于 D 状态，占用 CPU 。
- hardware interrupt（hi）：硬件中断占用的 CPU 时间。
- software interrupt（si）：软件中断占用的 CPU 时间。
- steal（st）：当系统运行在虚拟机中时，被其它虚拟机偷走的 CPU 时间。
- guest ：当前操作系统运行在虚拟机上时，guest 指 CPU 运行其它操作系统的时间。

### 平均负载

：load average ，指一定时间范围内平均的活跃进程数。
- 活跃进程包括：
  - 正在 CPU 运行的进程（Running）
  - 等待 CPU 运行的进程（Runnable）
  - 不可中断的进程（比如 iowait）。
- 理想情况下，系统的平均负载数应该刚好等于 CPU 个数，使得每个 CPU 运行一个活跃进程。
  - 例如：对于有 2 个 CPU 的系统，若平均负载为 1 ，说明 CPU 利用率为 50%，有空闲；若平均负载为 2.6 ，说明 CPU 超载了，有部分进程竞争不到 CPU 。
- 根据消耗资源的偏向，可将进程分为：
  - CPU 密集型进程：平均负载高，CPU 使用率也高。
  - IO 密集型进程：平均负载高，但 CPU 使用率不一定高。

## 相关命令

### uptime

```sh
$ uptime      # 显示系统运行时长、CPU 平均负载
```
- 例：
  ```sh
  [root@Centos ~]# uptime
  up 21 days, 41 min,  1 users,  load average: 0.52, 0.58, 0.59
  ```
  - up 21 days, 41 min ：表示系统的运行时长。
  - 1 users ：表示已登录的用户数。
  - load average: 0.52, 0.58, 0.59 ：表示最近 1 分钟、5 分钟、15 分钟的平均负载。

### perf

：用于查看各个事件占用的 CPU 时长。

```sh
$ perf top    # 显示占用 CPU 的各个事件（采样分析）
       -g     # 增加显示各个进程的子进程
```
- 例：
  ```sh
  [root@Centos ~]# perf top
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
$ perf record <命令>    # 记录执行某条命令时，其中各个事件的 CPU 使用率

$ perf report           # 显示 perf record 记录的信息
```
- 例：
  ```sh
  [root@Centos ~]# perf record ls
  actions-runner  node_modules  Notes  package.json  perf.data  yarn.lock
  [ perf record: Woken up 1 times to write data ]
  [ perf record: Captured and wrote 0.014 MB perf.data (6 samples) ]
  ```
  ```sh
  [root@Centos ~]# perf report
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
$ perf stat <命令>      # 分析某条命令占用 CPU 的过程
```
- 例：
  ```sh
  [root@Centos ~]# perf stat uname
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
  cycles                # CPU 的时钟周期数。一条机器指令可能需要多个 cycles
  instructions          # 机器指令数。Instructions/Cycles 的比值越大越好
  seconds time elapsed  # 运行该命令消耗的秒数
  ```

