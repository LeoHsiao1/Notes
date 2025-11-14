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
  - 初学者难以亲自配置一个 workflow ，建议使用 ComfyUI 网页上的 workflow 模板，从而快速开始 AI 绘图。
  - 打开 workflow 模板时，会自动提示用户，应该下载哪个模型文件，保存到哪个磁盘目录。

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
  - steps
    - ：进行多少次降噪。
    - 降噪次数越多，耗时越久。
    - 例如 SD 模型，通常需要 30 次降噪。
      - 第 1~5 次降噪，会让图片中模糊的马赛克，逐步变成清楚的图像。
      - 第 5~15 次降噪，图片的主要内容不变，会调整图案轮廓、颜色等细节。
      - 第 15~30 次降噪，会小幅调整图片细节，使图片更符合 prompt 。
      - 继续增加降噪次数，会小幅调整图片细节，但不会提升图片质量。
    - 有的模型只使用 1024x1024 分辨率的图片数据集进行训练，学习如何降噪。因此原生支持生成 1024x1024 分辨率的图片，不擅长生成更高分辨率的图片，除非使用插件。
  - cfg （Classifier Free Guidance，无分类的引导）
    - ：引导每次降噪时，对 prompt 的重视程度。
    - 取值范围为 `0.0 ~ 100.0` ，建议取值为 5~9 。
      - 取值越大，生成的图片越符合 prompt 。
      - 取值为 1~4 时，模型容易自由发挥，生成的图片不怎么符合 prompt 。
      - 取值为 5~9 时，生成的图片挺符合 prompt 。
      - 继续增加取值，生成的图片会严重锐化、图案扭曲。
  - sampler
    - ：降噪时，采用哪种采样器算法。这会影响运算耗时、生成图片的质量。
  - scheduler
    - ：降噪时，采用哪种调度器算法。这会影响每个 step 的降噪幅度。
    - 有的算法，会让每个 step 去除相同数量的噪声。这样平滑降噪，图像质量更高。
    - 有的算法，会让每个 step 去除尽可能多的噪声。这样可以减少 steps 总数，但是容易丢失图像细节。
  - denoise
    - ：整个降噪过程，去除多少比例的噪声。
    - 取值越小，生成的图片越接近初始的马赛克图片。
    - 取值范围为 `0.00 ~ 1.00` ，建议赋值为 1 。

## 模型

- 网络上存在很多种 AI 算法模型，由不同的公司或个人发布。
  - 有的模型是闭源的，只提供了 API ，供用户调用。
  - 有的模型是开源的，用户可以下载模型文件，在自己电脑上运行。

- 可以从以下渠道下载模型：
  - [HuggingFace](https://huggingface.co/)
    - ：一个 Web 平台，供人们分享机器学习的 Git 仓库、模型文件、数据集。
    - 模型文件分为几种扩展名：
      - .safetensors
        - ：这是 HuggingFace 推出的一种格式，在文件中保存了张量（tensors）格式的权重参数，不包含可执行代码，因此安全。
      - .pt 或 .pth
        - ：用 PyTorch 训练模型时，可以调用 `torch.save(t, 'checkpoint.pt')` ，将 torch 对象（包括权重参数）保存为一个磁盘文件。
        - 这种文件，本质上是将 Python 代码，通过 pickle 库进行序列化，然后写入磁盘文件。可能包含危险代码，因此存在安全风险。
      - .bin
        - ：这不是一种通用的模型文件格式。扩展名 .bin 表示该文件存储了二进制数据，但不确定具体包含什么数据、能被什么软件加载。
    - 可以在网页上点击下载模型，也可以用命令行下载：
      ```sh
      pip3 install huggingface_hub
      hf download openai/gpt-oss-20b --local-dir gpt-oss-20b
      ```
  - [ModelScope](https://modelscope.cn/)
    - ：一个 Web 平台，由中国的阿里巴巴公司推出，对标 HuggingFace 平台。
  - [CivitAI](https://civitai.com/)
    - ：一个 Web 平台，供人们分享 AIGC 的图片、视频，以及相关模型。

### 分类

- 根据擅长用途的不同，可将模型分为几类：
  - 图像生成
    - text-to-image
      - ：输入一段 prompt ，输出一张图片。
    - image-to-image
      - ：输入几张图片、一段 prompt ，输出一张图片。
    - image-edit
      - ：输入一张图片、一段 prompt ，输出一张图片。
    - inpainting
      - 根据遮罩，选中图片中一块区域，然后修改这块区域。
    - upscale
      - 用于将图片放大。
  - 视频生成
    - text-to-video
    - image-to-video
    - video-edit
  - 音频生成
  - 3D模型生成

- 根据训练方案的不同，可将模型分为几类：
  - base
    - 目前，一些大公司在进行技术竞赛，每隔几个月就发布一款能力强大的模型。
      - 大公司拥有大量资金、人力，可以准备大量显卡服务器、海量数据集，来训练模型。
    - 而小公司、个人开发者，缺乏资金、人力，难以独立做出一款强大的模型。
      - 因此，他们通常以业界一流模型为基础（统称为 base 模型），进行一些微调（fine-tuning），做出一个稍微不同的模型。

  - LoRA （Low-Rank Adaptation，低秩适应）
    - 它是一种微调技术，由 Microsoft 公司于 2021 年发布。
    - 原理：
      - 对 base 模型进行追加训练，修改少量权重参数。
      - 然后将这些参数，作为一个低秩矩阵，附加到 base 模型上。
    - 用法举例：
      1. 准备一个关于 CyberPunk 的数据集。
      2. 对 base 模型进行追加训练，生成一些新的权重参数，保存到一个文件，比如 lora-xx.safetensors 。
      2. 用户加载 base 模型文件，和 lora 文件。
      4. 用户编写 prompt ： "a cat in CyberPunk" 。此时模型有了 lora ，就懂得关于 CyberPunk 的内容。
    - 优点：
      - base 模型通常重视通用能力，各个领域的能力都不错。但它在编程、绘图等领域，可能能力不足。此时可通过 lora 微调，提升模型在某个领域的能力。
      - lora 权重参数的数量，通常小于 base 模型参数的 1% ，因此 lora 的训练成本远低于 base 模型。
    - 缺点：
      - lora 并不是将 base 模型缩小了，而是追加更新。因此 lora 文件不能独立使用，必须附加在 base 模型之上，才能工作。

  - Textual Inversion （文本反演）
    - 它是一种微调技术，由 Google 公司于 2022 年发布。
    - 原理：
      - 对 base 模型进行追加训练，生成一些新的 embedding 向量，使得模型懂得一些新概念。
    - 用法举例：
      1. 准备一些带有描述文字 CyberPunk 的图片。
      2. 训练 base 模型，让它分析上述图片，生成新的 embedding 向量并记录到一个文件。
      3. 用户加载 base 模型文件，和 embedding 文件。
      4. 用户编写 prompt ： "a cat in CyberPunk" 。此时模型会调用新的 embedding 向量，生成符合 CyberPunk 的图片。

  - DreamBooth
    - 它是一种微调技术，由 Google 公司于 2022 年发布。
    - 它用于模仿照相亭（photo booth）的效果：记住一个人物的外貌，将他 P 图嵌入各种风格的图片。
      - 换句话说， DreamBooth 是让模型记住特定一个人物的外貌，成为这个人物的专用模型。
      - 如果不使用 DreamBooth 方案，直接按 text-to-image 方式，为特定一个人物绘制图片。则需要详细描述身高、五官、皮肤等外貌特征，勉强才能让绘制的图片看起来像这个人物。

  - ControlNet
    - 它是 2023 年为 Stable Diffusion 模型设计的一种微调技术，用于控制 UNet 降噪的图片结构。
    - 用法举例：
      1. 社区开发者们，训练了一些 ControlNet 模型。
      2. 用户加载 Stable Diffusion 模型文件。再加载 ControlNet 文件，它会合并到 Stable Diffusion 模型的 UNet 模块。
      3. 用户给模型输入 prompt 的同时，再输入一个扩展信息，比如轮廓边缘图、人物姿态图、空间深度图，从而控制构图。

  - LCM（Latent Consistency Model，潜在一致性模型）
    - 它是一种基于 LoRA 的微调技术，用于大幅加快 Stable Diffusion 的生图速度。
    - 用法举例：
      1. 开发者用 Stable Diffusion 模型，经过 30 个 step 的降噪，生成图片。
      2. 基于 LoRA 训练 Stable Diffusion 模型，让它学习如何从任意一个 step ，直接一步降噪到最终图片。
          - 实际上，很难只经过一步降噪，就生成最终图片。
          - 但模型能学会一些捷径，只经过 2~4 个 step ，就生成原来经过 30 个 step 才能生成的图片。
      3. 上述训练，会生成一些新的权重参数，保存到一个文件，比如 lcm-xx.safetensors ，然后像 lora 文件一样被用户加载。
    - 缺点：
      - 大幅减少了降噪的 steps ，因此出图更加不稳定，更容易丢失细节。
    - 优点：
      - 即使出图质量降低一些，但也能满足许多用户的需求。

### embedding

- embedding （嵌入）是什么？
  - 数学中， embedding 操作，是指将 A 空间的一个拓扑结构，映射到 B 空间，并且保留其结构特征。
  - 深度学习中， embedding 操作，是指将现实世界的一个概念，映射到向量空间，表示为一个特征向量（feature vector），又称为 embedding vector 。
    - 例如，用户给模型输入的 prompt ，需要转换成 embedding vector 。
    - 为什么要进行 embedding 操作？因为计算机擅长分析数字、进行数学运算，不擅长直接分析人类的文字。
  - 假设将以下概念，转换为特征向量：
    ```yml
    cat   -> [0.1, -0.8, 0.7, …]
    dog   -> [0.1, -0.8, 0.2, …]
    apple -> [-0.3, 0.9, -0.2, …]
    ```
    - 计算机会按某种算法，分析现实事物的各种特征，转换为特征向量。比如提取形状特征为一个数字，提取颜色特征为另一个数字。
    - 计算机不是人类，不懂 cat、dog、apple 分别是什么事物。但是计算机能分析数字，发现 cat 与 dog 的特征向量相似，因此推测 cat 与 dog 是两个相似的事物。

- 例如 CLIP（Contrastive Language Image Pre-training）是一款擅长 embedding 的模型。
  - 它是 OpenAI 公司于 2021 年发布的一款模型。
  - 它的训练原理如下：
    - 让模型的 Image Encoder ，分析大量动物的图片，随机映射向量。
    - 让模型的 Text Encoder ，分析上述各个图片的描述文字，转换成特征向量。
    - 多次尝试上述操作，让模型自动学习，直到模型能让每个图片的特征向量，与其描述文字的特征向量，在数学上相似。
      - 例如，用户输入一段描述猫的文字时，模型能从一堆图片中找出特征向量最相似的一张图片。换句话说，模型能辨认图片中的猫。
    - 继续训练模型，分析海量事物的图片、描述文字。直到模型能辨认图片中的各种事物。
  - 它的用途：
    - 常用于分析一张图片，是否匹配某段描述文字，并衡量匹配程度有多高。
    - 不能根据文字生成图片，也不能根据图片生成文字，因为它只有 encoder （将媒体内容编码为特征向量），没有 decoder （将特征向量解码为媒体内容）。

### 常见模型

- Stable Diffusion
  - 2022 年，英国公司 Stability AI 发布一款名为 Stable Diffusion 的模型，可以生成很逼真的图像，推动了 AI 绘图技术的流行。
  - 它的主要模块：
    - Text Encoder
      - 负责将 prompt 转换成 embedding 向量。
    - UNet（U-shaped Convolutional Neural Network，U 形卷积神经网络）
      - 负责在 Latent Space 中对图片降噪。
    - VAE
      - 负责将图片映射到 Latent Space 。
  - Stable Diffusion 简称为 SD ，存在多个版本：
    - v1.5
      - 于 2022 年发布，被许多开发者用作 base 模型。
      - 使用 512×512 分辨率的图片数据集进行训练。
      - Text Encoder 采用 OpenAI 公司的 CLIP 模型，包含几亿参数。
      - prompt 通常写作一组标签词汇，用逗号分隔，零散地描述图片。例如：
        ```yml
        best quality, girl, white dress,
        (fantasy style:1.4) # 可用括号，强调一个标签的权重
        # 最多解读 77 个 token ，过多的 token 会被忽略
        ```
    - v2.0
      - 于 2022 年发布。
      - Text Encoder 改用 LAION 团队训练的 OpenCLIP 模型。这个模型包含几十亿参数，但 prompt 风格变化，让一些用户不适应。
    - XL 1.0
      - 于 2023 年发布。
      - 使用 1024x1024 分辨率的图片数据集进行训练。
      - Text Encoder 采用两个模型： OpenAI CLIP 和 OpenCLIP 。两个模型同时工作，从两个角度分析 prompt 。
      - prompt 通常写作一个自然语言的句子。例如：
        ```yml
        A girl in a white dress is reading a book.
        # OpenAI CLIP 最多解读 77 个 token
        # OpenCLIP 最多解读 256 个 token
        # 因此，第 78~256 个 token ，会被 OpenAI CLIP 忽略，会被 OpenCLIP 解读
        ```
    - v3
      - 于 2024 年发布。

- DreamShaper
  - 它是由社区用户 Lykon 基于 Stable Diffusion v1.5 微调的一个模型。
  - 它擅长 text-to-image 。
  - 它能生成 3D 动漫插画、3D 游戏插画。

- Flux
  - 它是由德国公司 Black Forest Labs 于 2025 年发布的一款模型。
  - 它擅长 image-to-image、image-edit 。
  - 它能生成逼真的写实照片。

## Prompt

- 如何写 prompt ？
  - 可以到网上参考别人的 prompt ，然后尝试修改。
  - 可以让 AI 帮忙写详细的 prompt 。
  - 不同模型的 prompt 存在风格、字数等差异，难以通用。

- 如何生成特定画风的图片？
  - 可以在 prompt 中，要求画风。
    - 比如想要某个画家的画风、想要某个年代的流行画风。
    - 但是有的模型，只用了动漫风格的图片数据集进行训练，因此不懂得生成真人风格的图片。用 prompt 也不能让模型生成它没学过的画风。
  - 可以采用特定风格的模型。
    - 比如有的模型，专门用动漫风格的图片数据集进行训练，因此擅长生成动漫风格的图片，不擅长生成真人风格的图片。
