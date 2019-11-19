# docsify

一个制作静态网站的工具，基于Node.js，主要用于制作文档网站。

- 与gitbook相似，但功能多一些，显示更美观。
- 使用时，不需要将MarkDown文件转换成HTML文件，在网页中显示时才会渲染成HTML格式。
- 具有目录，层次性好。
- [官方文档](https://docsify.js.org/#/zh-cn/)

## 安装docsify并运行

```shell
yum install nodejs
npm install docsify-cli -g
docsify init ./www
docsify serve ./www     # 启动服务器，默认监听http://localhost:3000
```

## 免安装运行

可以不安装docsify，直接创建一个index.html文件，内容如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>   # 网页标题
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <meta name="description" content="Description">
  <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <link rel="stylesheet" href="//unpkg.com/docsify/lib/themes/vue.css">
</head>
<body>
  <div id="app"></div>
  <script>
    window.$docsify = {
      name: '',
      repo: ''
    }
  </script>
  <script src="//unpkg.com/docsify/lib/docsify.min.js"></script>
</body>
</html>
```

再创建一个README.md，为该页面提供显示内容。

然后启动一个Web服务器，以index.html所在目录作为网站根目录。

## 配置

### 目录

在index.html中加入配置：

```html
window.$docsify = {
  loadSidebar: true,  # 显示侧边栏
  subMaxLevel: 3    # 目录的最大深度为3
}
```

侧边栏中的目录结构由URL所在目录下的_sidebar.md决定，如下：

```markdown
- [第一章](dir1/)   # 如果不指定.md文件，则默认读取该目录下的README.md
  - [第一节](dir1/1.md)
  - [第二节](dir1/2.md)
- 第二章            # 可以不给链接，只显示名字
  - [第一节](dir2/1.md)
```

### 导航栏

在index.html中加入配置：

```html
<nav>
  <a href="#/dir1/">第一章</a>   # 在页面顶部显示导航栏链接
  <a href="#/dir2/">第二章</a>
</nav>
<div id="app"></div>
<script>
  window.$docsify = {
    loadNavbar: true    # 启用导航栏的下拉列表
  }
</script>
```

导航栏的下拉列表由URL所在目录下的_navbar.md决定，如下：

```markdown
- [第一章](dir1/)
  - [第一节](dir1/1.md)
  - [第二节](dir1/2.md)
- 第二章
  - [第一节](dir2/1.md)
```

### 封面

在index.html中加入配置：

```html
window.$docsify = {
  coverpage: true   # 显示封面
}
```

封面默认只有一个，显示在网站首页。按以下格式可以给多个目录定义封面：

```html
window.$docsify = {
  coverpage: ['/', '/dir1/', '/dir2/']
}
```

封面的显示内容由URL所在目录下的_coverpage.md决定，如下：

```markdown
![logo](_media/logo.svg)    # 显示网页的logo

# docsify

> A magical documentation site generator.

- Simple and lightweight (~12kb gzipped)
- Multiple themes
- Not build static html files

[GitHub](https://github.com/docsifyjs/docsify/)   # 显示一个链接
[第一章](dir1/)

![](_media/bg.jpg)  # 显示背景图片
```

### 其它配置项

