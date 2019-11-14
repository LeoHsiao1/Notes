# Jekyll

Jekyll：一个制作静态网站的工具，基于Ruby，主要用于制作博客。

- 它可以读取XML、HTML、MarkDown等格式的文件，按照模板生成静态网站。
- 有很多主题模板，显示样式丰富。
- 可以灵活地定制网页模板，但也比较麻烦，要学习模板语言Liquid。
- 博客文章默认按时间顺序排列，没有目录，关联性低。
- 官方教程：<https://www.jekyll.com.cn/docs/>
- 浏览主题：<http://jekyllthemes.org/>

## 安装

```shell
yum install ruby
gem install jekyll bundler
```

## 用法

```shell
jekyll new myblog # 创建一个网站
cd myblog         # 进入网站根目录
jekyll build      # 构建网站
jekyll serve      # 启动服务器
```

启动服务器之后，访问<http://localhost:4000>即可查看。

这只是初始页面，接下来要参考官方教程进行定制。

## 目录结构

网站根目录下的主要文件。

- _config.yml：存储配置信息。
- _data：网站的主要数据。
- _post：存储博客文章。文件名格式为日期+标题，例如：2018-08-20-hello.md
- _site：存储生成的网站文件。应该添加到.gitignore文件中。
- index.html：网站的首页。
