# Jekyll

Jekyll：一个生成静态博客网站的工具，基于Ruby。

- 它可以读取XML、HTML、MarkDown等格式的文件，按照指定的模板生成静态网站。
- 有很多种主题模板，可以灵活地组合多个HTML页面。
- 博客默认按时间顺序排列，没有目录，关联性差。
- 官方教程：<https://www.jekyll.com.cn/docs/>
- 浏览主题：<http://jekyllthemes.org/>

## 安装

```shell
yum install ruby
gem install jekyll bundler

```

## 用法

```shell
jekyll new myblog       # 创建一个网站
cd myblog               # 进入网站根目录
jekyll build        # 构建网站
jekyll serve    # 启动服务器
```

启动服务器之后，访问<http://localhost:4000>即可查看。

网站根目录下的主要文件。

- _config.yml：存储配置信息。
- _data：网站的主要数据。
- _post：存储博客文章。文件名格式为日期+标题，例如：2018-08-20-hello.md
- _site：存储生成的网站文件。应该添加到.gitignore文件中。
- index.html：网站的首页。
