# docsify

：一个制作静态网站的工具，与 gitbook 相似，但功能多一些。
- [官方文档](https://docsify.js.org/#/)
- 基于 Vue ，显示美观。
- 无需安装，可以直接使用。
  - 使用时，不需要将 MarkDown 文件转换成 HTML 文件，在网页中显示时才会即时渲染成 HTML 。这减少了构建时间，不需要安装依赖库，但不利于 SEO 。
- 具有目录，层次性好。
  - 目录可以折叠显示，不过只能以 MarkDown 文件为单位进行折叠。

## 基础示例

1. 在网站根目录下创建一个 index.html 文件，内容如下：

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

2. 再创建一个 README.md 文件，为该页面提供显示内容：
    ```sh
    echo Hello > README.md
    ```
3. 启动一个 Web 服务器：
    ```sh
    python3 -m http.server 80
    ```

## 目录结构

以下是 docsify 网站的目录结构示例：
```
.
├─ docs           # 可以给该目录单独编写 sidebar.md、navbar.md ，否则使用上一级目录的
│  ├─ Chapter1    # 可以给该目录单独编写 sidebar.md、navbar.md ，否则使用上一级目录的
│  │  ├─ 1.md
│  │  └─ 2.md
│  └─ Chapter2
│     └─ 1.md
├─ index.html     # 网站的入口点
├─ navbar.md
└─ sidebar.md
```
- index.html 所在目录是网站的根目录，**任何文件中使用的相对路径的 URL ，都必须从这里开始。**因为 docsify 网站是纯 SPA 网站，当前目录始终停留在网站根目录，不能移动。

## 配置

### 侧边栏

在 index.html 中加入配置：
```js
window.$docsify = {
  loadSidebar: 'sidebar.md',  // 显示侧边栏目录
}
```

侧边栏中的目录结构由 URL 所在目录下的 `sidebar.md` 决定，如下：
```markdown
# 目录

- [第一章](Chapter1/)         # 如果不指定.md 文件，则默认读取该目录下的 README.md
  - [第一节](Chapter1/1.md)
  - [第二节](Chapter1/2.md)
- 第二章                      # 可以不给链接，只显示名字
  - [第一节](Chapter2/1.md)
```
- 可以给各个目录分别创建 sidebar.md ，从而分别显示侧边栏目录。
  - 如果 URL 所在目录下没有 sidebar.md ，则使用上一层目录的。
  - navbar.md 的使用规则同理。

### 导航栏

在 index.html 中加入配置：
```html
<nav>
  <<a href="#/">Navbar</a>   # 在页面顶部显示导航栏
</nav>
<div id="app"></div>
<script>
  window.$docsify = {
    loadNavbar: 'navbar.md'    # 启用导航栏的下拉列表
  }
</script>
```

导航栏的下拉列表由 URL 所在目录下的 `navbar.md` 决定，如下：
```markdown
- [第一章](Chapter1/)
  - [第一节](Chapter1/1.md)
  - [第二节](Chapter1/2.md)
- 第二章
  - [第一节](Chapter2/1.md)
```

### 封面

docsify 默认没有显示封面，需要在 index.html 中加入如下配置：
```js
window.$docsify = {
  coverpage: 'coverpage.md'   // 显示首页的封面
  // coverpage: ['/', '/Chapter1/', '/Chapter2/']   // 给多个目录分别显示封面
}
```

`coverpage.md` 的内容必须遵守以下格式：
```markdown
# docsify

- Simple and lightweight (~12kb gzipped)
- Multiple themes
- Not build static html files

[GitHub](https://github.com/docsifyjs/docsify/)   # 显示一个链接
[第一章](Chapter1/)
```

### 网页图标

在 index.html 的 head 部分导入网页图标：
```html
<link rel="icon" href="static/img/logo.ico" type="image/x-icon"/>
```

### 其它配置

```js
window.$docsify = {
  name: '',        // 侧边栏顶部显示的文档标题
  nameLink: '/',   // 文档标题指向的链接
  repo: '',        // 在页面右上角显示一个到 GitHub 的链接
  maxLevel: 3,     // 解析 MarkDown 文件时的最大目录层数
  subMaxLevel: 4,  // 侧边栏目录的最大层数
  auto2top: true,  // 切换显示的文档时，自动跳转到页面顶部
}
```

## 扩展功能

### 搜索框

添加如下配置，即可在侧边栏上方显示一个搜索框，可对所有页面进行全文搜索：
```html
<script>
window.$docsify = {
  search: {
      paths: 'auto',
      placeholder: 'Search',
      noData: 'No Results!',
  }
}
</script>
<script src="//unpkg.com/docsify/lib/plugins/search.js"></script>
```

### 控制图片的尺寸

```markdown
![logo](https://docsify.js.org/_media/icon.svg ':size=50x100')
![logo](https://docsify.js.org/_media/icon.svg ':size=100')
```

### 嵌入文件

从 docsify 4.6 开始，在 Markdown 中引用链接时，加上 `':include'` 即可嵌入目标文件。

支持的文件类型|文件扩展名
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

在 index.html 中添加如下脚本，即可在每个代码块右上角显示拷贝按钮。

```markdown
<script src="//unpkg.com/docsify-copy-code"></script>
```

### 代码高亮

导入[Prism](https://prismjs.com/)的 js 文件之后，可实现 MarkDown 文档代码块语法高亮：

```html
<script src="//unpkg.com/prismjs/components/prism-bash.js"></script>
<script src="//unpkg.com/prismjs/components/prism-c.js"></script>
```

### 分页按钮

在 index.html 中添加如下脚本，即可在每个页面的底部显示跳转到前一文件、后一文件的按钮。

```markdown
<script src="//unpkg.com/docsify-pagination/dist/docsify-pagination.min.js"></script>
```

### 使用主题

<https://jhildenbiddle.github.io/docsify-themeable/#/>
