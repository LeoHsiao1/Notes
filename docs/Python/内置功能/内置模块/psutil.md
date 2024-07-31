# import psutil

：Python 的第三方库，用于查看本机的运行状态。用途像 Linux 的 ps、free 等命令。
- 安装：`pip install psutil`
- [官方文档](https://psutil.readthedocs.io/en/latest/)

## 用法

- 关于进程：
  ```py
  >>> import psutil
  >>> psutil.pids()         # 返回本机所有进程的 PID
  [1, 2, 4, 6, 7, 8, 9, 10, ...]
  >>> psutil.pid_exists(1)  # 检查指定 PID 的进程是否存在
  True
  >>> psutil.Process(1)     # 通过 PID 选中一个进程，返回一个 Process 对象。之后可以调用该对象的各个方法
  psutil.Process(pid=1, name='systemd', status='sleeping', started='2022-01-15 16:00:30')
  ```
  ```py
  >>> p = psutil.Process(os.getpid()) # 通过 os.getpid() 获取当前进程的 PID ，然后选中当前进程
  >>> p
  psutil.Process(pid=26002, name='python3', status='running', started='16:55:28')
  >>> p.pid
  26002
  >>> p.name()        # 返回进程的名称
  'python3'
  >>> p.status()      # 返回进程的状态
  'running'
  >>> p.create_time() # 返回进程的创建时间，取值为 Unix 时间戳
  1661504128.0
  >>> p.terminate()   # 终止进程
  ```
  ```py
  >>> p.exe()         # 返回进程的可执行文件的路径
  '/usr/bin/python3.6'
  >>> p.cmdline()     # 返回进程的启动命令
  ['python3']
  >>> p.cwd()         # 返回进程的工作目录
  '/root'
  >>> p.username()    # 返回启动该进程的用户名
  'root'
  ```
  ```py
  >>> p.parent()        # 返回该进程的父进程
  psutil.Process(pid=3889, name='bash', status='sleeping', started='16:28:31')
  >>> p.children()      # 返回该进程的所有子进程
  []
  >>> p.num_threads()   # 返回该进程的线程数
  1
  >>> p.threads()       # 返回该进程的所有线程
  [pthread(id=32123, user_time=0.06, system_time=0.0)]
  ```

- 查看进程的状态：
  ```py
  >>> p.cpu_percent(1)    # 阻塞 1 秒，然后统计这段时间内，该进程的 CPU 使用率
  15.6
  >>> p.memory_info()     # 返回该进程的内存使用信息
  pmem(rss=10549008, vms=174663920, shared=3809280, text=4096, lib=0, data=6295552, dirty=0)
  >>> p.open_files()      # 返回该进程打开的所有文件
  [popenfile(path='/tmp/f1', fd=3, position=0, mode='w', flags=32769), ...]
  >>> p.net_connections() # 返回该进程的所有 Socket 网络连接
  [pconn(fd=115, family=<AddressFamily.AF_INET: 2>, type=<SocketType.SOCK_STREAM: 1>, laddr=addr(ip='10.0.0.1', port=48776), raddr=addr(ip='10.0.0.2', port=80), status='ESTABLISHED'), ...]
  ```

- 查看 CPU 的状态：
  ```py
  >>> psutil.cpu_count()              # 返回本机的 CPU 总核数（默认为逻辑核数）
  8
  >>> psutil.cpu_count(logical=False) # 返回 CPU 物理核数
  4
  >>> psutil.cpu_percent()            # 返回所有 CPU 的平均使用率。统计的时间范围是，从上一次调用该函数开始，到目前为止
  7.2
  >>> psutil.cpu_percent(interval=1, percpu=True) # 阻塞 1 秒，然后统计这段时间的各个CPU使用率
  [20.6, 7.7, 10.8, 20.0, 12.3, 4.6, 10.8, 4.6]
  >>> psutil.cpu_times_percent()      # 查看 CPU 各个维度的使用率（像 Linux 的 top 命令）
  scputimes(user=3.2, system=4.0, idle=92.5, interrupt=0.2, dpc=0.2)
  ```

- 查看内存的状态：
  ```py
  >>> psutil.virtual_memory()   # 返回本机的内存使用量，单位为 bytes（像 Linux 的 free 命令）
  svmem(total=8424906752, available=2264326144, percent=73.1, used=6160580608, free=2264326144)
  >>> psutil.swap_memory()      # 返回本机 swap 分区的使用量
  sswap(total=15404228608, used=9708523520, free=5695705088, percent=63.0, sin=0, sout=0)
  ```

- 查看磁盘的状态：
  ```py
  >>> psutil.disk_partitions()    # 返回本机的所有磁盘分区
  [sdiskpart(device='/dev/vda1', mountpoint='/', fstype='ext4', opts='rw,relatime,data=ordered'), ...]
  >>> psutil.disk_usage('/dev/vda1')  # 查看某个磁盘分区的使用量
  sdiskusage(total=295923871744, used=237350260736, free=58573611008, percent=80.2)
  ```

- 查看网络的状态：
  ```py
  >>> psutil.net_if_addrs()       # 返回本机的所有网卡地址（interface address）
  {'lo': [snicaddr(family=<AddressFamily.AF_INET: 2>, address='127.0.0.1', netmask='255.0.0.0', broadcast=None, ptp=None), ...}
  >>> psutil.net_connections()    # 返回本机所有的 Socket 网络连接
  [sconn(fd=3, family=<AddressFamily.AF_INET: 2>, type=<SocketKind.SOCK_STREAM: 1>, laddr=addr(ip='0.0.0.0', port=22), raddr=(), status='LISTEN', pid=1320), ...]
  >>> psutil.net_connections(kind='tcp')  # 只返回 tcp 类型的 Socket
  [sconn(fd=3, family=<AddressFamily.AF_INET: 2>, type=<SocketKind.SOCK_STREAM: 1>, laddr=addr(ip='0.0.0.0', port=22), raddr=(), status='LISTEN', pid=1320), ...]
  ```
