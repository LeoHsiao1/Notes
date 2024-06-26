# Jekyll

：一个 SSG 工具，用于制作静态网站。采用 Ruby 语言开发。
- [官方文档](https://jekyllrb.com/docs/)
- 每篇文章按时间顺序排列，不会显示文章目录。因此，适合发表散乱的博客。
- 它可以读取 XML、HTML、MarkDown 等格式的文件，按照模板生成静态网站。
- 有很多网页模板，显示样式丰富。
  - 可以定制网页模板，但需要学习模板语言 Liquid 。
  - [社区分享的网页主题](http://jekyllthemes.org/)

## 安装

```sh
yum install ruby
gem install jekyll bundler
```

## 用法

```sh
jekyll new myblog # 创建一个网站
cd myblog         # 进入网站根目录
jekyll build      # 构建网站
jekyll serve      # 启动服务器
```

启动服务器之后，访问<http://localhost:4000>即可查看。

这只是初始页面，接下来要参考官方教程进行定制。

## 目录结构

网站根目录下的主要文件。
- _config.yml ：存储配置信息。
- _data ：网站的主要数据。
- _post ：存储博客文章。文件名格式为日期+标题，例如：2018-08-20-hello.md
- _site ：存储生成的网站文件。应该添加到.gitignore 文件中。
- index.html ：网站的首页。
