# GitBook

GitBook：一个基于Node.js的工具，可以将MarkDown文本转换成电子书，并用Git进行管理。

- 可以生成多种格式的电子书，比如：静态网站、单页HTML、pdf、ebook

## 安装

```shell
安装node.js
npm install gitbook -g
```

## 用法

1. 创建一个目录，用于保存GitBook项目。
2. 在项目目录下创建一个README.md，保存对书籍的介绍。
3. 在项目目录下创建一个SUMMARY.md，保存书籍的目录，格式如下：

    ```markdown
    # SUMMARY

    * [Chapter1](chapter1/README.md)
    * [Section1.1](chapter1/section1.1.md)
    * [Section1.2](chapter1/section1.2.md)
    * [Chapter2](chapter2/README.md)
    ```

4. 执行`gitbook init`，初始化项目，这会创建SUMMARY.md中指定的所有文件。
   往这些文件中添加内容即可。
5. 执行`gitbook serve`，启动显示电子书的Web服务器。访问<http://127.0.0.1:4000>即可查看。
   启动服务器时，会自动执行`gitbook build`，生成电子书。




可以将静态网站托管到以下平台：

- GitHub Pages：拒绝被百度搜索引擎爬取。
- gitbook.com


<http://www.chengweiyang.cn/gitbook/customize/README.html>