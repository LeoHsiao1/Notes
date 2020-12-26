# ♢ pillow
## pillow：Python的第三方库，用于图像处理。
- 安装：pip install pillow
- pillow继承自Python2的图像处理库PIL（python Imaging Library）。
- 打开图片：
from PIL import Image

img = Image.open(r"C:\Users\Leo\Desktop\IMG_1.jpg")


img.show()             # 调用系统默认的看图软件查看该图片（此时该图片被缓存为bmp格式）
img.save(r"C:\Users\Leo\Desktop\1.jpg", format="JPEG", quality=95)  # 保存图片

# img.close()
# 调用Image.open时，pillow会读取图片文件的内容并自动关闭文件。但某些格式的图片不会自动关闭，需要用户主动关闭


  - 如果不注明保存格式，则默认保存为初始格式。
  - 如果不指定quality，则默认值为75，会对图片进行压缩、降低质量。95已经是最佳质量，100会增加很多图片的体积却没有明显改善质量。

- 查看图片的信息：
>>> img.size      # 返回图片的尺寸，是一个元组(width,height)
(1328, 1741)
>>> img.format    # 返回图片的格式
'JPEG'
>>> img.bits        # 返回图片的位深度
8
>>> img.mode      # 返回图片的颜色模式
'RGB'
- 修改图片的尺寸：
img.thumbnail((200, 300))            # 降低图片的分辨率（不能升高），而且是修改原图

_img = img.resize((4000,4000))    # 重新设置图片的分辨率，返回一个新图片
- 转换图片的颜色模式：
_img = img.convert("RGB")        # 这会返回一个新图片
  - 可选的颜色模式：1（二进制黑白图）、L（灰度图）、P（索引颜色）、RGB、RGBA、CMYK。
  - PNG格式保存直接保存为JPEG格式会报错，需要先把PNG图片从RGBA模式转换成RGB模式。
- 分离颜色通道：
r,g,b = img.split()
r.show()
- 复制、粘贴：
_img = img.copy()                        # 返回图片的一个副本
_img = img.crop((10,20,300,400))        # 返回图片中从点(10,20)到点(300,400)之间的矩形区域的拷贝
img.paste(_img, (0,0))                # 将图片_img粘贴到当前图片中，左上角对齐到点(0,0)
- 加入图片的全部像素点，返回一个二维序列：
>>> data = img.load()
>>> data[0,0]                        # 可以直接访问每个像素点
(0, 0, 0)
>>> data[0,0]=(255,0,0)
- 合并两张图片，返回一个新图片：
_img = Image.blend(img1, img2, 0.2)
# 这里，img1为（1-0.2）的透明度，img2为0.2的透明度
# 如果两张图片的尺寸或颜色模式不一致，就会报错
_img = Image.blend(img1, img2, mask)
        # 这里，两张图片使用mask决定透明度，mask是一张同样尺寸的图片，可以为1、L、RGBA模式
- 顺时针旋转图片指定角度，返回一个新图片：
img.rotate(30).show()
img.rotate(30, expand=True).show()            # 扩展图片的尺寸，以容纳旋转后的图片
## 原创绘画。
- 创建画布
img = Image.new("RGB", (300,300), (255,255,255))    # 新建一个图像，指定颜色模式、尺寸、填充色
- 添加文字
from PIL import ImageFont

font = ImageFont.truetype(r"C:\Users\Leo\Desktop\Asterix-Regular.ttf", 24)  # 选择一种字体
_str = "hello"
draw.text(xy, _str, fill, font)        # 从指定坐标处开始，添加一段文字
  - 生成验证码的方法：创建一个图片，随机给每个像素点设置颜色，然后添加四个随机字母，最后用模糊滤镜处理该图片。
## filter类提供了一些图像滤镜。
from PIL import ImageFilter
_img = img.filter(ImageFilter.CONTOUR)    # 返回一个经过CONTOUR滤镜处理后的图像
- 可选的滤镜包括：BLUR（均值模糊）、CONTOUR（提取轮廓）、EDGE_ENHANCE（边界增强）、EMBOSS（浮雕）、FIND_EDGES（提取边界）、SMOOTH（平滑）、SHARPEN（锐化）。

