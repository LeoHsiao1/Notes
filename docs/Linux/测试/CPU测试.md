# CPU测试

## 性能指标

### CPU使用率

：每隔一段时间计算一次 %CPU = ( 1 - CPU空闲时长 / 时间段 )×100% 。

分为以下几种：
- user、us ：用户态进程占用的CPU时间。它不包括nice的时间。
- system，sy ：内核态进程占用的CPU时间。
    - %system较大时可能是因为磁盘IO多、内核进程多。
- nice、ni ：低优先级的用户态进程占用的CPU时间。
- idle、id ：CPU的空闲时间。
- iowait、wa ：CPU等待磁盘读写数据的时间。
    - 正常情况下iowait会在很短时间内结束，如果iowait长时间较高，可能是磁盘IO量太大，或系统发生故障，这会导致某些进程一直处于D状态，占用CPU。
- hardware interrupt、hi ：硬件中断占用的CPU时间。
- software interrupt、si ：软件中断占用的CPU时间。
- steal、st ：当系统运行在虚拟机中时，被其它虚拟机偷走的CPU时间。
- guest ：CPU通过虚拟机运行其它系统的时间。

### 平均负载

：即load average，是指某段时间内系统的平均活跃进程数。
- 活跃进程包括正在CPU运行的进程（Running）、等待CPU运行的进程（Runnable）、不可中断的进程（比如iowait）。
- 理想情况下，系统的平均负载数应该刚好等于CPU个数，使得每个CPU运行一个活跃进程。
  - 例如：对于有2个CPU的系统，若平均负载为1，说明CPU利用率为50%，有空闲；若平均负载为2.6，说明CPU超载了，有部分进程竞争不到CPU。
- 根据消耗资源的偏向，可将进程分为：
  - CPU密集型进程：平均负载高，CPU使用率也高。
  - IO密集型进程：平均负载高，但CPU使用率不一定高。
  
## 相关命令

### uptime

```shell
$ uptime  # 显示当前时间、系统的运行时长、当前登录的用户数、平均负载（最近1分钟、5分钟、15分钟的平均值）
```
- 例：
    ```
    [root@Centos ~]# uptime
    up 21 days, 41 min,  1 users,  load average: 0.52, 0.58, 0.59
    ```
    - up 21 days, 41 min 是指系统的运行时长。

### perf

：用于查看各个事件占用的CPU时长。

```shell
$ perf top    # 显示占用CPU的各个事件（采样分析）
       -g     # 增加显示各个进程的子进程
```
- 例：

    ![](perf1.png)

    - 第一行中，Samples表示采样率，event表示事件类型，Event count表示占用CPU时钟周期的事件总数。
    - Overhead  ：该事件在样本中的比例。
    - Shared  ：该事件所在的动态共享对象，比如内核名、进程名。
    - Object  ：该动态共享对象的类型，比如[.]表示用户控件、[k]表示内核空间。
    - Symbol  ：该事件的名称，大多为某个进程的函数名称，或者是内存地址。
    - 在显示窗口中，可按方向键上下选择事件，按回车键进入子菜单。

```shell
$ perf record <命令>    # 记录执行某条命令时，其中各个事件的CPU使用率

$ perf report           # 显示perf record记录的信息
```
- 例：

    ![](perf2.png)

    ![](perf3.png)

```shell
$ perf stat <命令>      # 分析某条命令占用CPU的过程
```
- 例：

    ![](perf4.png)

    - task-clock (msec)  ：该命令使用CPU的毫秒数。（备注的CPUs utilized表示使用了CPU的几个核）
    - context-switches  ：进程上下文切换的次数。（不宜太大）
    - cache-misses    ：CPU在cache中找不到需要读取的数据的次数。
    - cpu-migrations  ：进程被迁移到其它CPU上运行的次数。
    - page-faults    ：CPU抛出page fault异常的次数。
    - cycles      ：CPU的时钟周期数。一条机器指令可能需要多个cycles。
    - instructions    : 机器指令数。Instructions/Cycles的比值越大越好。
    - seconds time elapsed：运行该命令消耗的秒数。
