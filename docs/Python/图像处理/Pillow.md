# ♢ Pillow

：Python 的第三方库，提供了丰富的图像处理功能。
- [官方文档](https://pillow.readthedocs.io/)
- 安装：`pip install pillow`
- Python 2 有一个流行的图像处理库 PIL（Python Imaging Library），但它不支持 Python 3 且更新缓慢。因此，2010 年社区从 PIL 分叉出 Pillow ，转向 Python 3 开发。

## 查看图片

- 从磁盘打开图片：
  ```py
  >>> from PIL import Image
  >>> img = Image.open('./1.jpg')
  >>> img
  <PIL.JpegImagePlugin.JpegImageFile image mode=RGB size=1600x900 at 0x25454ED11C0>
  ```
  - 调用 `Image.open()` 时，Pillow 会打开磁盘中的一个图片文件，读取图片数据到内存中。
    - 但此时只会读图片头部的数据（比如图片格式、大小），直到必要时才会读取、解码图片的主体数据。因此打开图片的速度很快，与图片体积无关。

- 关闭图片：
  ```py
  >>> img.close()
  ```
  - 这会释放图片主体数据占据的内存，释放图片的文件描述符。
  - 可以通过 with 关键字打开图片，从而自动关闭：
    ```sh
    with Image.open('./1.jpg') as img:
        img.show()
    ```

- 显示图片：
  ```py
  >>> img.show()
  ```
  - 这会将图片缓存到磁盘中的一个临时文件中，然后调用系统默认的看图软件查看该图片。
  - 显示期间会一直阻塞线程。

- 保存图片：
  ```py
  >>> img.save('2.jpg', format="JPEG", quality=95)
  ```
  - `format=None` ：保存的图片格式。如果不指定，则会根据文件扩展名自动选择图片格式。
  - `quality=75` ：保存的图片质量。建议的取值范围为 1 ~ 95 。
    - 原理是通过改变图片的压缩率来调整保存的图片质量。
    - 不建议保存质量超过 100 ，因为这不能明显提高图片质量，却会让图片体积增加很多，甚至不压缩。
  - Pillow 在保存图片时会丢失图片的元数据。

- 查看图片的属性：
  ```py
  >>> img.size      # 图片的尺寸，是一个元组 (width, height)
  (1600, 900)
  >>> img.bits      # 图片的位深度
  8
  >>> img.mode      # 图片的颜色模式
  'RGB'
  >>> img.format    # 图片的格式
  'JPEG'
  ```

## 编辑图片

- 调整尺寸：
  ```py
  >>> img.thumbnail((200, 300))           # 降低图片的分辨率（不能升高），这会修改原图片
  ```
  ```py
  >>> new_img = img.resize((4000,4000))   # 重新设置图片的分辨率（可以降低或升高），这会返回一个新图片
  ```

- 访问像素点：
  ```py
  >>> data = img.load()                   # 载入图片的全部像素点，这会返回一个二维序列
  >>> data[0, 0]                          # 通过二维索引访问指定的像素点
  (0, 0, 0)
  >>> data[0,0] = (255, 0, 0)
  ```

- 转换颜色模式：
  ```py
  >>> new_img = img.convert("RGB")        # 这会返回一个新图片
  ```
  - 常见的颜色模式：
    ```py
    1       # 二进制黑白图
    L       # 灰度图
    P       # 索引颜色
    RGB
    RGBA
    CMYK
    ```
  - 将 PNG 格式的图片直接保存为 JPEG 格式会报错，需要先将 PNG 图片从 RGBA 模式转换成 RGB 模式。

- 分离颜色通道：
  ```py
  >>> r,g,b = img.split()
  >>> r
  <PIL.Image.Image image mode=L size=200x113 at 0x1E31A05D6D0>
  >>> r.show()
  ```

- 拷贝图片：
  ```py
  >>> img2 = img.copy()                     # 返回图片的一个拷贝
  ```
  ```py
  >>> img2 = img.crop((10, 20, 300, 400))   # 返回图片中从点 (10,20) 到点 (300,400) 之间的矩形区域的拷贝
  >>> img.paste(img2, (0,0))                # 将图片 img2 粘贴到当前图片中，左上角对齐到点 (0,0)
  ```

- 合并图片：
  ```py
  >>> new_img = Image.blend(img1, img2, 0.2)
  ```
  - 这会将两个图片的显示内容叠加，返回一个新图片。
  - 合并时，img1 的透明度为 0.2 ，img2 的透明度为 (1-0.2) 。
  - 两张图片的尺寸、颜色模式必须相同，否则就会报错。

- 旋转图片：
  ```py
  >>> new_img = img.rotate(30)    # 将图片顺时针旋转指定角度，这会返回一个新图片
  >>> new_img.show()
  ```
  - 旋转图片时，由图片分辨率决定的显示区域不会改变，只是旋转显示内容。因此当显示内容旋转到显示区域之外时，就会丢失。
  - 可以加上 expand 参数，自动增加图片的分辨率，以容纳图片的显示内容。
    ```py
    >>> img.rotate(30, expand=True).show()
    ```

## 绘制图像

- 创建一个空白图像，可以用作画布：
  ```py
  >>> img = Image.new(mode='RGB', size=(300, 300), color='#000000')
  ```

- 绘制一个点：
  ```py
  >>> from PIL import ImageFont, ImageDraw
  >>> draw = ImageDraw.Draw(img)              # 创建 Draw 画板对象，以该 img 作为画布
  >>> draw.point(xy=(0, 0), fill='#FF0000')   # 绘制一个点
  >>> img.show()
  ```
  - `xy` ：绘制的坐标。
  - `fill` ：填充颜色，默认为白色。

- 绘制一条线：
  ```py
  >>> draw.line(xy=(0, 0, 100, 100), fill='#FF0000', width=5)   # 绘制一条直线，从点 (0, 0) 到点 (100, 100)
  ```

- 绘制文字：
  ```py
  >>> font = ImageFont.truetype('fonts/Consolas.ttf', 24)               # 选择一种 truetype 类型的字体
  >>> draw.text(xy=(10, 20), fill='#FF0000', text='Hello', font=font)   # xy 为绘制时的起点坐标
  ```

- 生成验证码图片的简单步骤：
  1. 创建一个图像，随机给每个像素点设置颜色。
  2. 添加四个随机字母。
  3. 用模糊滤镜处理该图片。


## 图像滤镜

- 使用滤镜：
  ```py
  >>> from PIL import ImageFilter
  >>> new_img = img.filter(ImageFilter.CONTOUR)    # 用指定的滤镜处理图像，然后返回一个新图像
  ```

- 常用的滤镜：
  ```py
  BLUR            # 均值模糊
  CONTOUR         # 提取轮廓
  EDGE_ENHANCE    # 边界增强
  EMBOSS          # 浮雕
  FIND_EDGES      # 提取边界
  SMOOTH          # 平滑
  SHARPEN         # 锐化
  ```

