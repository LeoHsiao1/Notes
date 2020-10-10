# CPU测试

## 性能指标

### CPU 使用率

：每隔一段时间计算一次 %CPU = ( 1 - CPU 空闲时长 / 时间段 )×100% 。

分为以下几种：
- user、us ：用户态进程占用的 CPU 时间。它不包括 nice 的时间。
- system ，sy ：内核态进程占用的 CPU 时间。
    - %system 较大时可能是因为磁盘 IO 多、内核进程多。
- nice、ni ：低优先级的用户态进程占用的 CPU 时间。
- idle、id ：CPU 的空闲时间。
- iowait、wa ：CPU 等待磁盘读写数据的时间。
    - 正常情况下 iowait 会在很短时间内结束，如果 iowait 长时间较高，可能是磁盘 IO 量太大，或系统发生故障，这会导致某些进程一直处于 D 状态，占用 CPU 。
- hardware interrupt、hi ：硬件中断占用的 CPU 时间。
- software interrupt、si ：软件中断占用的 CPU 时间。
- steal、st ：当系统运行在虚拟机中时，被其它虚拟机偷走的 CPU 时间。
- guest ：CPU 通过虚拟机运行其它系统的时间。

### 平均负载

：即 load average ，是指某段时间内平均的活跃进程数。
- 活跃进程包括正在 CPU 运行的进程（Running）、等待 CPU 运行的进程（Runnable）、不可中断的进程（比如 iowait）。
- 理想情况下，系统的平均负载数应该刚好等于 CPU 个数，使得每个 CPU 运行一个活跃进程。
  - 例如：对于有 2 个 CPU 的系统，若平均负载为 1 ，说明 CPU 利用率为 50%，有空闲；若平均负载为 2.6 ，说明 CPU 超载了，有部分进程竞争不到 CPU 。
- 根据消耗资源的偏向，可将进程分为：
  - CPU 密集型进程：平均负载高，CPU 使用率也高。
  - IO 密集型进程：平均负载高，但 CPU 使用率不一定高。

## uptime

```sh
$ uptime      # 显示系统运行时长、CPU 平均负载
```
- 例：
    ```
    [root@Centos ~]# uptime
    up 21 days, 41 min,  1 users,  load average: 0.52, 0.58, 0.59
    ```
    - up 21 days, 41 min ：系统的运行时长。
    - 1 users ：已登录的用户数。
    - load average: 0.52, 0.58, 0.59 ：最近 1 分钟、5 分钟、15 分钟的平均负载。

## perf

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

                  0.89 msec task-clock                #    0.393 CPUs utilized          
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
    - task-clock (msec)  ：该命令使用 CPU 的毫秒数。（备注的 CPUs utilized 表示使用了 CPU 的几个核）
    - context-switches  ：进程上下文切换的次数。（不宜太大）
    - cache-misses    ：CPU 在 cache 中找不到需要读取的数据的次数。
    - cpu-migrations  ：进程被迁移到其它 CPU 上运行的次数。
    - page-faults    ：CPU 抛出 page fault 异常的次数。
    - cycles      ：CPU 的时钟周期数。一条机器指令可能需要多个 cycles 。
    - instructions    : 机器指令数。Instructions/Cycles 的比值越大越好。
    - seconds time elapsed ：运行该命令消耗的秒数。
