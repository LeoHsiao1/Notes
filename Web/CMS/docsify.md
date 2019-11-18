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

然后启动一个Web服务器，以index.html所在目录作为网站根目录。

## 用法
