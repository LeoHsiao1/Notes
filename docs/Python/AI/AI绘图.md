# AI绘图

## 工作方案

- 如何进行 AI 绘图？
  - 首先，用户需要找到一个用于 AI 绘图的算法模型。
  - 然后，用户通过某个工具使用模型。一般流程如下：
    1. 用户编写一段文字，说明希望得到什么样的内容，这称为提示词（prompt）。
    2. 用户将 prompt 输入模型。
    3. 模型工作一段时间之后，输出文字、图像等内容。

- 如何使用模型？
  - 可以编写 Python 代码，调用模型的 API 。
    - 优点：
      - 可以仔细地使用模型的所有功能。
    - 缺点：
      - 需要用户懂 Python 编程，还要花时间写 Python 代码。
  - 可以注册 Stability AI 等网站，在网页上进行 AI 绘图。
    - 优点：
      - 上手简单。
    - 缺点：
      - 收费略贵。
      - 内容管制多。
      - 只能使用少量几种模型。
  - 可以安装 ComfyUI 等工具，在自己电脑上进行 AI 绘图。
    - 优点：
      - 买了电脑之后，只需要付出电费。
      - 可以选用很多种模型，功能丰富。还能自己微调模型、使用插件。
      - 几乎没有内容管制，自由度高。
    - 缺点：
      - 需要自己安装软件、配置环境。
      - 一般用户没有高规格的电脑，导致 AIGC 速度慢。
        - 对策：购买云平台的 VPS ，按小时付费。这样价格不贵，又能短时间使用高规格的电脑。

- 使用什么样的电脑，才能提升 AI 绘图的性能？
  - 使用更高规格的 GPU ，可以大幅提高 AIGC 的速度。
    - 如果一个模型文件的体积，超过 GPU 显存的容量，则该模型不能加载到显存中，因此不能启动运行。
    - 运行模型的过程中，还可能占用更多显存。如果 GPU 的显存耗尽，则会报错 OOM 。
  - CPU、内存的规格，足够用即可，不用太高。毕竟 AIGC 的主要负载集中在 GPU 。
    - 如果 CPU、内存的使用率超过 80% ，则可能不够用，可以提升规格。
    - 如果 CPU、内存的使用率低于 80% ，则大概率够用，提升规格也只能闲置。
  - 使用 SSD 硬盘，加快读写文件的速度。
  - 升级 CUDA、pytorch 等软件的版本，可能获得小幅的性能优化。
  - 使用 Windows 或 Linux 操作系统，性能几乎相同。
    - 在 AIGC 技术流行之前，购买 Nvidia 显卡的大部分用户，是为了在 Windows 系统上玩游戏。因此 Nvidia 公司对 Windows 系统做了很多适配、优化。
    - 但不考虑玩游戏的话， Nvidia 显卡在 Windows 与 Linux 操作系统的性能几乎相同。

## ComfyUI

- 2023 年， Stability AI 公司的一位开发者，在 GitHub 上开源了 ComfyUI 项目。
  - [Github](https://github.com/comfyanonymous/ComfyUI)
  - [官方教程](https://docs.comfy.org/)
  - ComfyUI 采用 Python 语言开发，以 Web 服务器的形式运行。

### 部署

- 部署命令：
  ```sh
  # 下载 ComfyUI 源代码
  git clone https://github.com/comfyanonymous/ComfyUI
  cd ComfyUI

  # 安装特定版本的 torch （启用了 CUDA ，适配 python3.13 ）
  # 还需要升级 Nvidia 显卡驱动到最新版本，以免不兼容
  pip install torch torchvision torchaudio -i https://pypi.tuna.tsinghua.edu.cn/simple --extra-index-url https://download.pytorch.org/whl/cu130

  # 安装其它依赖
  pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

  # 启动，然后访问网站 http://127.0.0.1:8188/
  python main.py
  ```
  - 推荐再安装 [ComfyUI-Manager](https://github.com/Comfy-Org/ComfyUI-Manager) ，提供额外的功能，比如安装插件、安装自定义节点。

### 用法

- 在 ComfyUI 网页上，用户可以添加多个节点（node），依次执行，组成一个工作流程（workflow）。
  - ComfyUI 提供了一些 workflow 模板，方便用户快速实现一些需求，比如图像生成、视频生成。

- 节点是 ComfyUI 内置的一种功能模块。
  - 用户可以从左侧菜单栏，点击新建一个节点。也可以在画布上双击鼠标，打开节点的搜索框，然后新建节点。
    - 例如有的节点负责加载模型，有的节点负责输入 prompt 。
  - 一个节点在网页上显示为一个图框，用户可以用鼠标拖动、连线，进行可视化配置。
    - 节点左上角的圆点，表示最小化，只显示节点的标题栏。
    - 节点左侧的端点表示输入端，节点右侧的端点表示输出端。
    - 端点分为多种颜色，某种颜色的输出端，只能连线到同种颜色的输入端。
    - 节点的一个输入端，只能连线其它节点的一个输出端。换句话说，同时只能存在一个输入源。
    - 节点的一个输出端，可以连线其它节点的多个输入端。

- ComfyUI 网页上，支持多种快捷键。
  ```yml
  Ctrl + C  # 复制
  Ctrl + V  # 粘贴
  Ctrl + Z  # 撤销
  Ctrl + Y  # 重做
  Ctrl + S  # 保存 workflow
  Ctrl + O  # 打开 workflow

  Space         # 按住空格键，此时网页会进入只读模式，鼠标点击只能拖拽画布
  Ctrl          # 按住 Ctrl 之后，可以鼠标多次点击，同时选中多个节点。也可以鼠标拖选一个方框，同时选中多个节点
                # 另外，鼠标按住 Group 标题栏的情况下，再按住 Ctrl ，就可以移动 Group 方框

  Ctrl + Enter  # 开始执行 workflow
  Ctrl + G      # 可以选中多个节点，按快捷键来创建一个 group 。然后给该 group 命名，比如 "step 1"
  Ctrl + B      # 可以选中一个节点，按快捷键来 bypass 绕过它，使得 workflow 执行到该节点时会跳过
  Ctrl + M      # 可以选中一个节点，按快捷键来 mute 禁用它，使得 workflow 执行到该节点时会暂停
  ```

- workflow 的工作流程，一般如下：
  1. 用户输入 prompt 。
  2. 由 Text Encoder ，将 prompt 转换成特征向量。
  3. 由 VAE Image Encoder ，将一张随机的马赛克图片，映射到低维的潜在空间（Latent Space）。
      - 比如马赛克图片原本是 1024x1024 分辨率，有损压缩到 64×64 分辨率，丢失不重要的细节，这样能大幅减少运算量。
  4. 由采样器，根据 prompt 特征向量，将 Latent Space 中的马赛克图片，进行多次降噪（denoise）。
      - 例如 prompt 描述画面中存在一朵红花，于是模型就将马赛克图片中一团模糊的红色像素点，降噪为清晰的像素点，看起来像红花。
  5. 由 VAE Image Decoder ，将 Latent Space 中的低维图片，转换成正常图片，显示给用户看。
      - 通常只显示最后一次降噪之后的图片。
      - 用户也可以在中间某次降噪使用 VAE Image Decoder ，从而预览中间图片。

- 以 KSampler 为例，介绍采样器的配置参数：
  - model
    - ：采用哪种模型来负责降噪。
  - seed
    - ：随机数种子，它决定了生成什么样的随机数。例如生成初始的马赛克图片时，要使用随机数。
    - 如果多次进行 AIGC ，并且保持 prompt、seed 等配置参数不变，则每次生成的最终图片都会一模一样。
  - control_after_generate
    - ：每次 AIGC 之后，修改 seed 取值。有多种修改方式：
      ```yml
      randomize # 随机取值
      increment # 递增 1
      decrement # 递减 1
      fixed     # 固定
      ```
  - step
    - ：进行多少次降噪。
    - 每增加一次降噪，会生成更清晰的图片，但会增加运算耗时、增加图片中的随机噪点。
    - 有的模型只使用了 1024x1024 分辨率的图片数据集进行训练，学习如何降噪。因此不擅长对更高分辨率的图片进行降噪。
  - cfg
    <!-- Classifier Free Guidance -->
    - 取值越大，降噪之后的图片越符合 prompt 的描述，但也可能强调图片中的缺陷。
    - 取值范围为 `0.0 ~ 100.0` ，建议赋值为个位数。
  - sampler
    - ：降噪时，采用哪种采样器算法。这会影响运算耗时、生成图片的风格。
  - scheduler
    - ：降噪时，采用哪种调度器算法。这会影响每个 step 去除的噪声数量。
    - 有的算法，会让每个 step 去除相同数量的噪声。有的算法，会让每个 step 去除尽可能多的噪声。
  - denoise
    - ：整个降噪过程，去除多少比例的噪声。
    - 取值越小，生成的图片越接近初始的马赛克图片。
    - 取值范围为 `0.00 ~ 1.00` ，建议赋值为 1 。



