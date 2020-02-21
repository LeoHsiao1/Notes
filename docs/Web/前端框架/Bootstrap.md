# Bootstrap

：一个 CSS/HTML 开发框架，适用于设计网页元素、布局。
- 要求使用HTML5标准。

## 示例

如下是一个基于Bootstrap的HTML例子：

```html
<!DOCTYPE html>
<html lang="en">

<head>
	<title>Bootstrap Sample</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1">  <!-- 用于兼容IE浏览器 -->
    <meta name="viewport" content="width=device-width, initial-scale=1">  <!-- 控制网页在移动设备上的显示 -->
	<link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" rel="stylesheet">  <!-- 引入bootstrap的 css 文件 -->
	<link href="css/style.css" rel="stylesheet">  <!-- 引入自己的 css 文件 -->
</head>

<body>
	<div class="col-md-12">  <!-- 使用Bootstrap的样式 -->
		<h1>Hello, world!</h1>
	</div>
	<script src="https://code.jquery.com/jquery.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"></script>  <!-- 引入bootstrap的 js 文件 -->
	<script src="js/scripts.js"></script>  <!-- 引入自己的 js 文件 -->
</body>

</html>
```
- `"X-UA-Compatible"` 是 IE8 新增的 meta ，用于选择一个浏览器引擎来渲染网页。
  - `IE=7`：使用 IE7 引擎。
  - `IE=edge`：使用最新版本的IE引擎。
  - `chrome=1`：激活Google Chrome Frame。

- `"viewport"` 是 Bootstrap3 新增的 meta ，用于控制网页在移动设备上的显示。其 content 属性的设置项包括：
  - `width=device-width`：网页显示的宽度。
  - `initial-scale=1.0`：初始的显示比例。
  - `maximum-scale=1.0`：最大的显示比例。
  - `user-scalable=no`：是否允许用户缩放网页。


## 相关编辑器

### layoutit

：一个Bootstrap的在线UI编辑器。
- 提供了一些现成的组件，可以直接拖拽，方便调整网页布局，适用于快速开发简单的网页。
- [官网](https://www.layoutit.com/build)
- [中文版](https://www.runoob.com/try/bootstrap/layoutit/)
