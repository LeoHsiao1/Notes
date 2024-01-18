# GPU

- GPU（Graphics Processing Unit，图形处理器），俗称为显卡，是计算机中的一个芯片，用于控制显示器的显示内容。
  - 早期的计算机，一般用 CPU 或专用图形电路板，来控制显示器。1980 年代开始，计算机改用一块独立的集成电路芯片来控制显示器，称为 GPU 。
  - 现代的个人电脑一般包含显示器，由显卡控制其显示的内容。
  - 机房的 Linux 服务器一般包含 CPU、内存、磁盘等硬件，但没有显示器、显卡。一般通过另一台包含显示器的电脑 SSH 登录它，然后进行操作。
- GPU 最初用于加速计算机图形渲染，在该过程并行执行大量算术运算。后来因为 GPU 擅长并行运算，扩展了其它用途：
  - 用于机器学习等算法，并行计算矩阵。
  - 用于比特币挖矿，并行计算哈希值。
- 目前，世界上主要有两个公司在研发计算机显卡：NVIDIA 公司、AMD 公司，两种显卡存在较大架构差异。
  - 本文主要参考 NVIDIA 品牌的显卡。

## 特点

- CPU 与 GPU 的共同点：
  - 都是基于芯片的微处理器。
  - 都可以包含多个核心（Core）处理器，从而能并行执行多个任务。

- CPU 与 GPU 的不同点：
  - 架构不同。一个 CPU 芯片通常包含几个或几十个核心（Core）处理器，每个 Core 的能力强，包含算术逻辑单元（ALU）、高速缓存等元件。而一个 GPU 芯片通常包含几百或几千个 ALU ，不擅长执行串行的、复杂的运算，而擅长执行大量并行的、相同的、简单的算术运算。
    - 因此，面向 GPU 编程时，通常是让程序的主要代码在 CPU 上运行，将一些需要并行运算的代码放到 GPU 上运行，使得运行速度更快。这种方案属于异构计算。
  - 重要性不同。CPU 是计算机中必不可少的硬件，缺少它则不能开机。而 GPU 是计算机中可选的硬件，缺少它则不能让显示器正常工作。
  - 用途不同。CPU 可用于执行大部分类型的软件程序，通用性强。而 GPU 主要用于执行大量并行的算术运算。

- 某些型号的 CPU 在芯片中内置了一个 GPU ，称为集成显卡（integrated GPU）。
  - 优点：减少了硬件体积，适用于笔记本电脑、平板电脑、手机。
  - 缺点：散热差，性能低，难以运行高画质游戏。

## CUDA

- 2006 年，NVIDIA 公司发布了 CUDA（Compute Unified Device Architecture，计算统一设备架构），是一个并行编程框架。
  - [官方文档](https://docs.nvidia.com/cuda/cuda-c-programming-guide/contents.html)
  - 因为 NVIDIA 公司占据了大部分显卡市场，所以 CUDA 成为了面向 GPU 编程的主要框架。
  - 用户可采用 C++ 语言开发程序，调用 CUDA 代码库的 API ，从而编写在 GPU 上运行的代码。

- 基于 CUDA 编程的流程：
  1. 给计算机插入 GPU 硬件。
  2. 给计算机安装 GPU 的驱动程序。
      - 计算机会将这些驱动程序载入内存，由 CPU 运行，从而能调用 GPU 的功能。
  3. 编写一个程序的源代码，调用 CUDA 的 API ，然后编译、运行。
      - 这会将程序载入内存，由 CPU 运行。其中部分代码涉及到 CUDA ，会被 GPU 拷贝到显存中运行。
      - GPU 会读取显存中的程序代码，依次拷贝到 GPU 的 L2、L1 缓存、SP 寄存器，最终由 SP 执行。

### 架构

- block
  - 用户可以定义一个线程块（thread block），包含最多 1024 个线程，让 GPU 并行执行。
    - 同一个 block 的所有线程，会被 GPU 调度到同一个 SM 运行。每个线程会被分配一个 SP ，同时执行相同的代码，但数据集可以不同。
    - 一个 SM 可以同时运行多个 block ，只要 SP 数量、存储空间足够。
  - 鉴于一个 block 包含的线程数有限，如果用户希望创建更多线程，则可以创建多个相同尺寸的 block 。
    - 这些 block 在逻辑上组成一个线程网格（thread grid）。
    - 这些 block 会分别运行，顺序不可控。

- SM
  - 一个 GPU 芯片可以包含多个 SM（Stream Multiprocessor，流式多处理器），编号从 0 开始递增，相当于 CPU 的多个核心。
    - 每个 SM 独立工作，可分别运行一些线程。
  - 每个 SM 包含多个 SP（Stream Processor，流式处理器），又称为 CUDA Core 。
    - 每个 SP 包含一个 ALU ，不能独立工作。
    - SM 可以让其中的多个 SP 并行执行相同的算术运算，但数据集可以不同。例如，给多个 SP 输入不同的浮点数数组，分别计算总和。
  - 每个 SM 拥有一块缓存，可以暂存多个 block 的数据。
    - 当一个 block 的所有 warp 都载入缓存时，SM 才能开始运行该 block 。
    - 当一个 block 的所有 warp 都运行完毕时，SM 才能从缓存中删除该 block 。然后腾出空间，载入新的 block 。

- warp
  - SM 运行一个 block 时，会将其中的所有线程以线程束（thread warp）为单位分组，便于调度执行。
    - 每个 warp 固定包含 32 个线程。因此，建议每个 block 包含的线程数是 32 的整数倍。
    - 例：假设一个 block 包含 50 个线程，则会创建 2 个 warp ，消耗 64 个线程的资源，造成浪费。
  - SM 运行一个 warp 时，可以发生上下文切换，转去运行另一个 warp 。
    - CPU 发生线程上下文切换时，会将线程使用的寄存器数据转移到高速缓存中。
    - GPU 发生线程上下文切换时，会将线程使用的寄存器数据保留在原位，因此开销更小。

### 索引

- 一个 block 是由多个 thread 组成的三维结构体，每个 thread 通常用三维坐标 (x,y,z) 来索引。
  - 例如 block(5, 1, 1) 表示 block 的长宽高尺寸为 5、1、1 ，相当于一维结构体。
  - 不同 block 中的 thread 不会同时执行，没必要比较坐标。
- 一个 grid 是由多个 block 组成的三维结构体，每个 block 通常用三维坐标 (x,y,z) 来索引。
    - 例如 grid(2, 3, 4) 表示 grid 的长宽高尺寸为 2、3、4 。

- CUDA 提供了以下内置变量，用于记录索引、尺寸：
  ```sh
  threadIdx   # thread 的三维索引
  blockIdx    # block  的三维索引
  blockDim    # block  的三维尺寸
  gridDim     # grid   的三维尺寸
  ```
  - threadIdx 记录了当前线程在当前 block 中的三维坐标。例如第一个线程的三维坐标为 0 ：
    ```sh
    threadIdx.x = 0
    threadIdx.y = 0
    threadIdx.z = 0
    ```
  - 通常将所有线程从 0 开始编号，但 CUDA 没有记录每个线程的编号，需要用户自行计算。
    ```sh
    # 假设 block 为一维，尺寸为 (X)
    thread_id = threadIdx.x

    # 假设 block 为二维，尺寸为 (X,Y)
    thread_id = threadIdx.x + threadIdx.y * Y

    # 假设 block 为三维，尺寸为 (X,Y,Z)
    thread_id = threadIdx.x + threadIdx.y * Y + threadIdx.z * Z
    ```

### 存储

- 如果一个计算机拥有 CPU、GPU ，则 CPU、GPU 都可通过总线对内存寻址。另外 GPU 还内置了几个专用存储器，不能被 CPU 寻址。

- GPU 会用到多种存储空间：
  - 全局内存（global memory）
    - ：GPU 中容量最大的一块内存，用作通用存储。俗称为显存。
    - GPU 运行的所有线程都能访问显存，常见 API ：
      ```cpp
      cudaMalloc(&ptr, size); // 申请分配内存
      cudaFreeA(ptr);         // 释放内存
      ```
    - 一般显卡会内置一个 DRAM 存储器作为显存，容量为几 GB 。
    - 集成显卡通常没有内置显存，而是在内存中分配一块内存空间，用作显存。
  - 本地内存（local memory）
    - 每个线程会在 GPU 中单独分配一份本地内存，仅供该线程读写。
    - 每个线程在 SP 中执行时，
  - 寄存器（register）
    - 寄存器用于暂存 SP 最近处理的数据，是 GPU 中读写速度最快的存储空间。
    - 每个 SM 内置了一块寄存器，平均分配给各个 SP 使用。
    - 每个 SP 专用一份寄存器空间，容量为几十 KB ，不能跨 SP 共享。
  - L1、L2 高速缓存
    - GPU 中内置一份 L2 缓存，被所有 SM 共享。
    - 每个 SM 内置一份 L1 缓存，被该 SM 的所有 SP 共享，常用于在同一个 block 的线程之间共享数据。

### 代码示例

- 例：计算两个向量 A、B 相加，向量长度都为 N 。用 CPU 串行计算的代码示例：
  ```cpp
  for (int i=0; i<N; i++) {   // 依次计算两个向量的第 0~N 位的元素之和，时间复杂度为 O(n)
      C[i] = A[i] + B[i];
  }
  ```
  用 GPU 并行计算的代码示例：
  ```cpp
  #define N 5

  // 用 __global__ 定义一个 CUDA 内核函数，名为 VecAdd
  __global__ void VecAdd(float* A, float* B, float* C)
  {
      int i = threadIdx.x;  // 通过内置变量 threadIdx 读取当前线程的索引
      C[i] = A[i] + B[i];   // 计算向量 A、B 的第 i 个元素之和，保存到向量 C
  }

  int main()
  {
      ...
      // 创建 N 个线程，分别执行一次内核函数，从而并行计算两个向量的第 0~N 位的元素之和，时间复杂度为 O(1)
      VecAdd<<<1, N>>>(A, B, C);
      ...
      // 可创建多个 CUDA 内核函数，按代码顺序执行，它们属于不同的 grid
      // kernel<<<numBlocks, threadsPerBlock>>>(A, B, C);
  }
  ```

- 例：用 GPU 并行计算两个矩阵相乘
  ```cpp
  __global__ void MatAdd(float A[N][N], float B[N][N], float C[N][N])
  {
      int i = threadIdx.x;
      int j = threadIdx.y;
      C[i][j] = A[i][j] + B[i][j];
  }

  int main()
  {
      ...
      dim3 threadsPerBlock(N, N);   // 定义 block 的尺寸为 (N, N) ，属于二维结构
      int numBlocks = 1;            // 配置 block 数量
      MatAdd<<<numBlocks, threadsPerBlock>>>(A, B, C);
      ...
  }
  ```
  上例只创建了一个 block ，下例改为多个 block ：
  ```cpp
  __global__ void MatAdd(float A[N][N], float B[N][N], float C[N][N])
  {
      // 创建了多个 block 时，需要考虑当前 block 在 grid 中的索引、当前 thread 在 block 中的索引
      int i = blockIdx.x * blockDim.x + threadIdx.x;
      int j = blockIdx.y * blockDim.y + threadIdx.y;
      if (i < N && j < N)
          C[i][j] = A[i][j] + B[i][j];
  }

  int main()
  {
      ...
      dim3 threadsPerBlock(16, 16);
      dim3 numBlocks(N / threadsPerBlock.x, N / threadsPerBlock.y);
      MatAdd<<<numBlocks, threadsPerBlock>>>(A, B, C);
      ...
  }
  ```

### 安装驱动

以下步骤是在 Linux 主机上安装 NVIDIA 显卡驱动：
1. 执行以下命令，查看本机已插入的显卡的硬件型号。
    ```sh
    lspci | grep NVIDIA
    ```

2. 安装 NVIDIA 公司发布的 [显卡驱动](https://docs.NVIDIA.com/datacenter/tesla/tesla-installation-notes/index.html) 。
    - 如果自动安装失败，则需要根据本机的操作系统版本、GPU 型号，找到某个兼容版本的显卡驱动，手动安装。
    - 安装之后，会在 Linux 中保持运行一个内核进程。可执行命令 `ps auxf | grep NVIDIA` 查看
    - 安装之后，会附带 nvidia-smi 命令，它提供了 NVIDIA 的系统管理接口（System Management Interface）。
      - 可用该命令查看显卡驱动的版本、最高兼容的 CUDA 版本、GPU 上正在运行的进程列表。
    - 长期以来，NVIDIA 公司发布的显卡驱动程序都是闭源的。
      - 2012 年，nouveau 发布 1.0 版本。它是一个针对 NVIDIA 显卡的开源驱动程序，集成到了 Linux 内核。但功能较少，性能较低。
        - 执行 `lsmod | grep nouveau` ，可检查 Linux 内核是否加载了 nouveau 。
        - 如果本机启用了 nouveau ，则需要禁用它并重启主机，然后才能启动 NVIDIA 官方驱动。因为同时只能运行一个驱动程序来控制 GPU。
      - 2022 年，NVIDIA 公司开源了 Linux GPU 内核驱动模块。

3. 安装 NVIDIA 公司发布的 [cuda-toolkit](https://developer.NVIDIA.com/cuda-downloads) ，它包括 cuFFT 等加速库、CUDA 开发及调试工具、编译器、运行时。
    - CUDA 通常依赖较新版本的 NVIDIA 显卡驱动，参考：<https://docs.NVIDIA.com/cuda/cuda-toolkit-release-notes/index.html>
    - CUDA 通常安装在 `/usr/local/cuda*` 目录下。
    - 可执行以下命令，查看 CUDA 的版本号：
      ```sh
      ls /usr/local/cuda*                     # CUDA 默认安装在该目录
      /usr/local/cuda-*/bin/nvcc --version    # nvcc 是 CUDA 编译器（NVIDIA CUDA Compiler）
      ```
      - 同一主机上可以安装多个版本的 CUDA 工具包，共用同一个 NVIDIA 显卡驱动。

4. 安装 NVIDIA 公司发布的 [cuDNN](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html) ，它是一个常用的算法库，没有包含在 cuda-toolkit 中。

5. 启动 Python 解释器：
    ```sh
    pip install torch
    python
    ```
    然后测试使用 CUDA ：
    ```py
    >>> import torch
    >>> torch.version.cuda
    '12.4'
    >>> torch.cuda.is_available()       # 查看 CUDA 是否可用
    True
    >>> torch.cuda.device_count()       # 查看 GPU 设备数，如果本机拥有多张显卡的话
    1
    >>> torch.cuda.current_device()     # 查看当前使用的 GPU 设备的编号
    0
    >>> torch.cuda.get_device_name()    # 查看当前使用的 GPU 设备的名称
    'GeForce GTX 950M'
    >>> torch.backends.cudnn.version()  # 查看 cuDNN 版本
    8500
    ```
    - 用 pip 安装 torch 的二进制 wheel 包时，它会内置一份 CUDA ，不使用本机的 CUDA 。下载 torch 的源代码然后编译、安装，才会使用本机的 CUDA 。
    - 可通过环境变量 `CUDA_VISIBLE_DEVICES=0,1` 指定可用的 GPU 设备编号。
    - PyTorch、TensorFlow 可以在 CPU 或 GPU 上运行。如果本机启用了 GPU ，则优先使用 GPU 。如果设置环境变量 CUDA_VISIBLE_DEVICES 为空，则不允许使用 GPU 。

6. 安装以上驱动之后，就可以让 Linux 进程运行在 GPU 上。但如果想让 Docker 容器运行在 GPU 上，则还需要安装 NVIDIA 公司发布的 [nvidia-container-toolkit](https://docs.NVIDIA.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) ，它包括一个针对 NVIDIA GPU 的容器运行时。

7. 如果想让 k8s 容器运行在 GPU 上，则还需要安装 NVIDIA 公司发布的 [k8s-device-plugin](https://github.com/NVIDIA/k8s-device-plugin) ，它会以 k8s Daemonset 方式部署在启用 GPU 的每个主机上。
    - 执行以下命令，检查 k8s 是否识别到主机上的 GPU 资源：
      ```sh
      kubectl get node -o yaml | grep gpu
      ```
    - 建议给 node 打上污点，专用于部署需要 GPU 资源的 Pod ，例如：
      ```yml
      taints:
      - effect: NoSchedule
        key: dedicated
        value: gpu-gtx-950m
      ```
    - 给 Pod 分配 GPU 资源：
      ```yml
      resources:
        limits:
          cpu: 500m
          memory: 1Gi
          nvidia.com/gpu: 1
          # amd.com/gpu: 1
        requests:
          cpu: 100m
          memory: 1Gi
          nvidia.com/gpu: 1
      ```
    - 缺点：
      - 每个容器只能分配 GPU 的整数个核心，不支持小数。因为 GPU 的每个核心只能被一个容器占用，不能被多个容器共享。
      - 分配 GPU 核数时，取决于 limits 配额。如果配置了 requests 配额，则必须等于 limits 配额。
    - k8s-device-plugin 默认只允许每个 GPU 芯片设备中运行一个进程，如果想运行多进程，可采用时间分片（Time-Slicing）、MPS（Multi-Process Service）等方案。
      - 大致原理：让一个 GPU 先后执行不同进程创建的 CUDA 内核函数。
      - 参考文档：<https://developer.nvidia.com/blog/improving-gpu-utilization-in-kubernetes/>
      - 优点：
        - 运行单进程不一定能用完 GPU 的计算资源，运行多进程可以提高 GPU 资源的利用率。
      - 缺点：
        - 每个进程使用一个独立的 CUDA context（上下文），包含程序代码等数据。GPU 运行多进程时，会因为上下文切换而增加耗时。
        - GPU 运行多进程时，在硬件层面没有隔离。例如没有限制每个进程占用的显存，可能某个进程耗尽显存，连累其它进程。

## 相关概念

- OpenGL（Open Graphics Library）是一个跨语言、跨平台的 API 标准，用于渲染 2D、3D 矢量图形，于 1992 年发布。

- OpenCL（Open Computing Language，开放计算语言）是一个并行编程框架。
  - 2008 年，由 Apple 公司提出。后来与 NVIDIA、AMD 等公司共同制定标准，于 2009 年发布 1.0 版本。
  - 安装 OpenCL 驱动程序之后，能控制 CPU、GPU、DSP、FPGA 等硬件设备执行并行任务。
    - OpenCL 定义了一组 API 标准，但没有具体实现的驱动程序。
    - 一些硬件公司会自行研发驱动程序来实现 OpenCL 。例如 AMD 公司研发了 Catalyst 闭源驱动。
  - OpenCL 定义了一种编程语言，是 C99 的方言，称为 OpenCL C 语言。后来还支持 C++ for OpenCL 。
    - 用户可用 OpenCL C 语言编写程序代码，调用 OpenCL API 来控制硬件设备。
    - OpenCL 运行一个程序时，会在运行时编译，因此程序可以移植到不同平台上运行。
  - 比较 CUDA 与 OpenCL ：
    - CUDA 专用于 NVIDIA 显卡，而 OpenCL 是通用的，可用于 NVIDIA 或 AMD 公司的显卡，也可用于非显卡的其它设备。
    - 用户面向 NVIDIA 显卡开发程序时，可以使用 CUDA 或 OpenCL 框架，但使用 CUDA 的性能更高，因为 NVIDIA 显卡在研发、生产时主要考虑 CUDA 。

- 用户可以将一些由 CPU 运行的算法移植到 GPU 上运行，利用 GPU 的并行运算来加速执行。但亲自编写这些算法比较麻烦，NVIDIA 公司提供了一些 [算法库](https://developer.nvidia.com/gpu-accelerated-libraries) ，已经基于 CUDA 实现了常见的算法函数，可供用户调用。例如：
  - CUDA Math library ：实现了一些标准数学函数。
  - cuBLAS ：用于基本的线性代数。
  - cuFFT ：用于快速傅里叶变换。
  - cuRAND ：用于生成随机数。
  - nvJPEG ：用于 JPEG 解码。
  - cuDNN ：用于深度神经网络，比如池化、卷积。PyTorch、TensorFlow 依赖了 cuDNN 。

- Torch
  - ：一个开源的算法库，用于机器学习。
  - 于 2002 年发布。2017 年停止开发，被 PyTorch 项目取代。
  - 采用 C 语言实现底层算法，而用户使用 lua 脚本调用这些算法。
- PyTorch
  - ：一个开源的算法库，用于机器学习。
  - 2016 年，由 Facebook 公司发布。最初基于 Torch 开发，后来取代了 Torch 。
  - 采用 C、C++ 语言实现底层算法，而用户使用 Python 脚本调用这些算法。
- TensorFlow
  - ：一个开源的算法库，用于机器学习。采用 C++、Python 语言开发。
  - 2015 年，由 Google 公司发布。
  - TensorFlow 与 PyTorch 的用途相似，属于竞品。
