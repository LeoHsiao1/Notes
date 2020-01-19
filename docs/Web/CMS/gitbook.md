# GitBook

：一个制作静态网站的工具，基于 Node.js ，主要用于制作文档网站。
- 使用时，会先将 MarkDown 文件转换成 HTML 文件，再在网页中显示。
- 按 MarkDown 文件的文件路径生成目录，层次性好。
- 用法很简单，但功能少、显示样式单调。

## 安装

```sh
# 需要已安装 Node.js
npm install gitbook-cli -g
```

## 用法

1. 创建一个目录，用于保存 GitBook 项目。
2. 在项目目录下创建一个 README.md ，保存对书籍的介绍。
3. 在项目目录下创建一个 SUMMARY.md ，保存书籍的目录，格式如下：

   ```markdown
   # SUMMARY

   - [第一章](chapter1/README.md)
     - [第 1 节](chapter1/section1.md)
     - [第 2 节](chapter1/section2.md)
   - [第二章](chapter2/README.md)
   ```

4. 执行`gitbook init`，初始化项目，这会创建 SUMMARY.md 中指定的所有文件。<br>
   往这些文件中添加内容即可。
5. 执行`gitbook serve`，启动 Web 服务器。访问<http://127.0.0.1:4000>即可查看。<br>
   启动服务器时，会自动执行`gitbook build`，生成 HTML 网页，保存到 _book 目录下。
