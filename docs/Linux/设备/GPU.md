# GPU

- GPU（Graphics Processing Unit，图形处理器），俗称为显卡，是计算机中控制显示器如何显示 2D、3D、VR 等图形的硬件。
  - 个人电脑一般包含显示器，由显卡控制其显示的内容。
  - 机房 Linux 服务器一般包含 CPU、内存、磁盘等硬件，但没有显示器、显卡。一般通过另一台包含显示器的电脑 SSH 登录它，然后进行操作。
- 本文主要参考 NVIDIA 品牌的显卡。

## 特点

- CPU 与 GPU 的共同点：
  - 都是基于芯片的微处理器。
  - 都可以包含多个核心（Core）处理器，从而能并发执行多个任务。

- CPU 与 GPU 的不同点：
  - 架构不同。一个 CPU 芯片通常包含几个或几十个核心（Core）处理器，每个 Core 的能力强，包含算术逻辑单元（ALU）、高速缓存等元件。而一个 GPU 芯片通常包含几百或几千个 ALU ，不擅长执行串行的、复杂的运算，而擅长执行大量并发的、相同的、简单的算术运算。
  - 重要性不同。CPU 是计算机中必不可少的硬件，缺少它则不能开机。而 GPU 是计算机中可选的硬件，缺少它则不能让显示器正常工作。
  - 用途不同。CPU 可用于执行大部分类型的软件程序，通用性强。而 GPU 最初用于加速执行图形渲染时的大量算术运算，后来扩展了其它功能。

## CUDA

- 2006 年，NVIDIA 公司发布了 CUDA（Compute Unified Device Architecture，计算统一设备架构），提供了一个并行计算平台及配套的编程模型，简化了针对 GPU 编程的过程，被广泛使用至今。
  - [官方文档](https://docs.nvidia.com/cuda/cuda-c-programming-guide/contents.html)
  - 用户可采用 C、C++、Python 等语言开发程序，调用 CUDA 代码库的 API ，从而编写在 GPU 上运行的代码。
  - 不过面向 CUDA 的程序开发偏向底层，挺麻烦。一些开源的代码库已经面向 CUDA 实现了常见的数学函数，可直接调用。

### 架构

- block
  - 用户可以定义一个线程块（thread block），包含最多 1024 个线程，让 GPU 并发执行。
    - 同一个 block 的所有线程，会被 GPU 调度到同一个 SM 运行。每个线程会被分配一个 SP ，同时执行相同的代码，但数据集可以不同。
    - 一个 SM 可以同时运行多个 block ，只要 SP 数量、内存空间足够。
  - 鉴于一个 block 包含的线程数有限，如果用户希望创建更多线程，则可以创建多个相同尺寸的 block 。
    - 这些 block 在逻辑上组成一个线程网格（thread grid）。
    - 这些 block 会分别运行，顺序不可控。

- SM
  - 一个 GPU 芯片可以包含多个 SM（Stream Multiprocessor，流式多处理器），编号从 0 开始递增，相当于 CPU 的多个核心。
    - 每个 SM 独立工作，可分别运行一些线程。
  - 每个 SM 包含多个 SP（Stream Processor，流式处理器），又称为 CUDA Core 。
    - 每个 SP 包含一个 ALU 、一个寄存器，不能独立工作。
    - SM 可以让其中的多个 SP 并发执行相同的算术运算，但数据集可以不同。例如，给多个 SP 输入不同的浮点数数组，分别计算总和。
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

