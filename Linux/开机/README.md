# 开机

Linux系统的启动（boot）过程：

1. 计算机接通电源，启动ROM中的BIOS(Basic Input Output System)系统。
2. BIOS系统会通电检查CPU、内存等计算机硬件，确定它们正常之后，就到硬盘的第一个扇区中找到Bootloader程序，读取并运行它（将CPU的控制权转交给它）。
   <br />Linux系统常见的Bootloader程序是grub，它允许用户在开机时从多个操作系统中选择一个启动。
3. Bootloader程序会根据硬盘分区表找到硬盘中存储的Linux 内核文件，读取并运行它（将CPU的控制权转交给它）。
4. 内核创建的第一个进程是idle，PID为0。
   <br />idle进程是内核态进程，是唯一一个不通过fork或kernel_thread创建的进程。
   <br />idle进程会通过kernel_thread创建init进程。
5. 内核创建的第二个进程是init，PID为1。
   <br />如果/sbin/init不存在，内核就会尝试运行/bin/sh，再失败的话则系统启动失败。
6. 内核创建的第三个进程是kthreadd，PID为2。
   <br />kthreadd负责管理所有内核态进程。

## init

init是所有用户态进程的父进程。

- init会读取/etc/inittab文件，启动当前init级别下的各个进程（比如执行getty创建终端）。
- init会根据/etc/fstab文件中的磁盘分区信息，挂载各个文件系统。
- init会启动/etc/init.d目录下的各个系统服务（大多是脚本）。

init有七种运行级别（run level）：

- 0：关机。
- 1：单用户模式（simple mode），又称为紧急模式（emergency mode），可以在忘了root密码时修改密码。
- 2：多用户模式。
- 3：终端模式。
- 4：保留。
- 5：图形界面模式。
- 6：重启。

命令：

    init n      # 切换运行级别

## 关机命令

执行关机命令时需要root权限。

    sync        # 关机前先执行sync命令，将内存中的数据保存到磁盘
    
    shutdown    # 在一段时间后关机（执行init 0来关机）
          -h 10 "This system will shutdown after 10 mins" # 10分钟后关机，并将该消息广播给所有用户
          -c    # 取消即将进行的关机

    poweroff    # 关机

    halt        # 关机

    reboot      # 重启
