# docsify

一个制作静态网站的工具，基于Node.js，主要用于制作文档网站。
- 与gitbook相似，但功能多一些，显示更美观。
- 使用时，不需要将MarkDown文件转换成HTML文件，在网页中显示时才会渲染成HTML格式。
- 具有目录，层次性好。
- [官方文档](https://docsify.js.org/#/zh-cn/)

## 安装

### 安装docsify并运行

```shell
yum install nodejs
npm install docsify-cli -g
docsify init ./www
docsify serve ./www     # 启动服务器，默认监听http://localhost:3000
```

### 免安装运行

可以不安装docsify，直接创建一个`index.html`文件，内容如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document</title>
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

然后启动一个Web服务器，以index.html所在目录作为网站根目录。如下：

    python -m http.server 80

## 配置

### 侧边栏

在index.html中加入配置：

```html
window.$docsify = {
  loadSidebar: 'sidebar.md',  # 显示侧边栏目录
}
```

侧边栏中的目录结构由URL所在目录下的`sidebar.md`决定，如下：

```markdown
# 目录

- [第一章](dir1/)   # 如果不指定.md文件，则默认读取该目录下的README.md
  - [第一节](dir1/1.md)
  - [第二节](dir1/2.md)
- 第二章            # 可以不给链接，只显示名字
  - [第一节](dir2/1.md)
```

可以给多个目录分别创建sidebar.md，从而分别显示侧边栏目录。
- 如果URL所在目录下没有sidebar.md，则使用上一层目录的。
- navbar.md的使用规则同理。

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
    loadNavbar: 'navbar.md'    # 启用导航栏的下拉列表
  }
</script>
```

导航栏的下拉列表由URL所在目录下的`navbar.md`决定，如下：

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
  coverpage: 'coverpage.md'   # 显示封面
}
```

封面默认只有一个，显示在网站首页。可以按以下格式给多个目录分别定义封面：

```html
window.$docsify = {
  coverpage: ['/', '/dir1/', '/dir2/']
}
```

封面的显示内容由URL所在目录下的`coverpage.md`决定，如下：

```markdown
![](static/logo.svg)    # 插入一张图片

# docsify

- Simple and lightweight (~12kb gzipped)
- Multiple themes
- Not build static html files

[GitHub](https://github.com/docsifyjs/docsify/)   # 显示一个链接
[第一章](dir1/)

![](_media/bg.png)  # 背景图片
![color](#f0f0f0)   # 背景色
```

### 网页图标

在index.html的head部分导入网页图标：

```html
<link rel="icon" href="static/img/logo.ico" type="image/x-icon"/>
```

### 其它配置

```html
window.$docsify = {
  name: '',        # 侧边栏顶部显示的文档标题
  nameLink: '/',   # 文档标题指向的链接
  repo: '',        # 在页面右上角显示一个到GitHub的链接
  maxLevel: 3,     # 解析MarkDown文件时的最大目录层数
  subMaxLevel: 4,  # 侧边栏目录的最大层数
  auto2top: true,  # 切换显示的文档时，自动跳转到页面顶部
}
```

## 扩展功能

### 控制图片的尺寸

```markdown
![logo](https://docsify.js.org/_media/icon.svg ':size=50x100')
![logo](https://docsify.js.org/_media/icon.svg ':size=100')
```

### 嵌入文件

从docsify 4.6开始，在链接末尾加上`':include'`即可嵌入该文件。

支持的文件类型：

type|文件后缀名
-|-
iframe  |.html .htm
markdown|.markdown .md
audio   |.mp3
video   |.mp4 .ogg
code    |other file extension

例：

```markdown
[](example.md ':include :type=markdown')
[](https://www.baidu.com/index.html ':include :type=iframe width=100% height=400px')
```

### 拷贝代码块

在index.html中添加如下脚本，即可在每个代码块右上角显示拷贝按钮。

```markdown
<script src="//unpkg.com/docsify-copy-code"></script>
```

### 分页按钮

在index.html中添加如下脚本，即可在每个页面的底部显示跳转到前一文件、后一文件的按钮。

```markdown
<script src="//unpkg.com/docsify-pagination/dist/docsify-pagination.min.js"></script>
```

### 使用主题

<https://jhildenbiddle.github.io/docsify-themeable/#/>
