# Bootstrap

：一个 CSS/HTML 开发框架，由 Twitter 推出。适用于设计网页组件、布局。
- 一般用法：在 HTML 中导入 Bootstrap 的 css、js 文件，然后便可以调用 Bootstrap 的样式、组件。
- 要求使用 HTML5 标准。
- [官方文档](https://v4.bootcss.com/docs/getting-started/introduction/)

## 基础示例

如下是一个基于 Bootstrap 的 HTML 例子：

```html
<!DOCTYPE html>
<html lang="en">

<head>
	<title>Bootstrap Sample</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1">  <!-- 用于兼容 IE 浏览器 -->
    <meta name="viewport" content="width=device-width, initial-scale=1">  <!-- 控制网页在移动设备上的显示 -->
	<link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" rel="stylesheet">  <!-- 导入 Bootstrap 的 css 文件 -->
	<link href="css/style.css" rel="stylesheet">  <!-- 导入自己的 css 文件 -->
</head>

<body>
	<div class="col-md-12">  <!-- 使用 Bootstrap 的样式 -->
		<h1>Hello, world!</h1>
	</div>
	<script src="https://code.jquery.com/jquery.min.js"></script>  <!-- 先导入 Bootstrap 的依赖 js 文件 -->
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>  <!-- 导入 Bootstrap 的 js 文件 -->
	<script src="js/scripts.js"></script>  <!-- 导入自己的 js 文件 -->
</body>

</html>
```
- `"X-UA-Compatible"` 是 IE8 新增的 meta ，用于选择一个浏览器引擎来渲染网页。
  - `IE=7` ：使用 IE7 引擎。
  - `IE=edge` ：使用最新版本的 IE 引擎。
  - `chrome=1` ：激活 Google Chrome Frame 。

- `"viewport"` 是 Bootstrap3 新增的 meta ，用于控制网页在移动设备上的显示。其 content 属性的设置项包括：
  - `width=device-width` ：网页显示的宽度。
  - `initial-scale=1.0` ：初始的显示比例。
  - `maximum-scale=1.0` ：最大的显示比例。
  - `user-scalable=no` ：是否允许用户缩放网页。

## 网格系统

Bootstrap 通过自定的网格系统（Grid System）控制 HTML 元素的布局 —— 先将页面划分成多行、多列，再放置要显示的 HTML 元素。
- Bootstrap 将用户设备分为以下几类，分别处理：

  -|特小设备|小型设备|中型设备|大型设备|超大设备
  -|-|-|-|-|-
  显示宽度|<576px|≥576px|≥768px|≥992px|≥1200px
  最大列数|12|12|12|12
  控制列数的 CSS 类|col-n|col-sm-n|col-md-n|col-lg-n|col-xl-n

- 例：
  ```html
  <body>
    <div class="container-fluid">           <!-- 1. 先创建一个容器，因为只能在容器中划分网格 -->
      <div class="row">                     <!-- 2. 再创建一个行 -->
        <div class="col-4 col-sm-6">        <!-- 3. 然后创建一个指定宽度的列 -->
          ...                               <!-- 4. 最后放置 HTML 元素 -->
        </div>
        <div class="col-8 col-sm-6">        <!-- 创建一个列。由于与上一列加在一起的宽度不超过 12 ，会显示在同一行 -->
          <div class="col-4">               <!-- 创建一个嵌套的子列，宽度为上一列的 4/12 -->
            ...
          </div>
        </div>
      </div>
      <div class="row">                     <!-- 创建一个行。会显示在上一行之下 -->
        <div class="col-md-6 offset-md-4">  <!-- 创建一个列，向右偏移 4 -->
          ...
        </div>
      </div>
    </div>
  </body>
  ```

## layoutit

：一个 Bootstrap 的在线 UI 编辑器。
- 提供了一些现成的组件，可以直接拖拽，便于生成简单的网页布局。
- [官网](https://www.layoutit.com/build)

用法：
- 要先在 Container 中拖入 GRID 布局，然后才能拖入具体组件。
  - 布局 `12` 是指一个区块，宽度为 12 列。
  - 布局 `6 6` 是指两列区块，宽度分别为 6、6 列。
- 编辑之后，将 layoutit 生成的代码拷贝到 HTML 的 body 中即可。不过，用户需要自行导入相应版本的 Bootstrap 的 JS、CSS 文件。
