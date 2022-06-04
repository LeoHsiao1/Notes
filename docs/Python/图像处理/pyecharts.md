# pyecharts

：Python 的第三方库，提供了生成 ECharts.js 图表的方法。
- [官方文档](https://pyecharts.org/#/zh-cn/intro)
- [图像示例](https://gallery.pyecharts.org/#/README)
- 安装：`pip install pyecharts`
- 本身不支持 GUI 显示，通常先用它生成 HTML 文件，再放到 Web 浏览器中显示。

## 用法示例

- 绘制柱形图：
  ```py
  from pyecharts.charts import Bar    # 导入一个图表类

  bar = Bar()                         # 创建一个柱形图
  bar.add_xaxis(['A', 'B', 'C'])      # 添加横坐标的序列
  bar.add_yaxis('高度', [2, 20, 6])   # 添加纵坐标的序列，称为 serie
  bar.add_yaxis('价格', [5, 6, 7])    # 再添加一个 serie

  bar.render()                        # 渲染图像
  ```

- 配置显示样式：
  ```py
  from pyecharts import options as opts

  bar = Bar(init_opts=opts.InitOpts(                                # 初始化图像
                                    # width    = '900px',           # 画布宽度
                                    # height   = '500px',           # 画布高度
                                    # chart_id = None,              # 图像的 ID ，在显示多个图像时用于区分
                                    # renderer = RenderType.CANVAS, # 渲染风格，可以为 canvas 或 svg
                                    page_title = 'Test',            # HTML 网页的标题
                                    # theme    = 'white',           # 显示时采用的主题样式
                                    bg_color   = '#f2fffa',         # 画布的背景颜色
                                    # js_host='https://assets.pyecharts.org/assets/', # 引用 echart.js 的起始 URL
                                    # animation_opts = AnimationOpts(),               # 动画效果的配置
                                    ),
            )

  bar.set_global_opts(title_opts=opts.TitleOpts(title='Sample'))

  bar.set_series_opts(linestyle_opts=opts.LineStyleOpts(
                                                        # is_show=True,   # 是否显示
                                                        # width=1,        # 线宽
                                                        # opacity=0.8,    # 不透明度。取值为 0~1 ，0 表示完全透明
                                                        curve=0.05,       # 线的弯曲程度。0 表示不弯曲
                                                        # type_='solid',  # 线型
                                                        color='rgba(0, 0, 0, 0.3)',   # 线的颜色
                                                        ),
                      )
  ```
  - 进行配置时，可以传入一个 xx_opts 对象，也可以传入一个字典。

## 相关 API

- Base 类是所有图像类的基类：
  ```py
  class Base(ChartMixin):
      def __init__(self, init_opts: Union[InitOpts, dict] = InitOpts())

      def render(self, path='render.html', template_name='simple_chart.html', env=None, **kwargs) -> str
          # 渲染图像。生成一个 HTML 文件，保存到主机上的 path 路径，并返回其绝对路径。采用 Jinja 类型的模板文件

      def render_embed(self, template_name='simple_chart.html', env=None, **kwargs) -> str
          # 渲染图像。生成一个 HTML 文件，返回其内容
  ```

- Chart 类是所有图表类的基类：
  ```py
  class Chart(Base):
      def __init__(self, init_opts = opts.InitOpts())

      def set_colors(self, colors: Sequence[str])   # 设置 label 的颜色。可以指定一个颜色，或依次多个颜色

      def set_global_opts(                  # 全局的配置
          self,
          title_opts   = opts.TitleOpts(),  # 标题的配置
          legend_opts  = opts.LegendOpts(), # 图例的配置
          toolbox_opts = None,              # 工具栏的配置
          ...
      )

      def set_series_opts(        # series 的配置
          self,
          label_opts     = None,  # 标签的配置
          linestyle_opts = None,  # 线的配置
          markpoint_opts = None,  # 标记点的配置
          markline_opts  = None,  # 标记线的配置
          ...
      )
  ```
