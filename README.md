# LeoHsiao的笔记

- 该笔记的主要目的是记录知识点。
- 笔记保存为MarkDown格式，分为多个书籍，按章节目录排序。
- 基于VuePress显示静态网站，访问URL：<http://leohsiao.com/>
- 欢迎指正


## 部署方法

调试时，只需启动开发环境的服务器：
```sh
vuepress dev docs
```

正式部署时，先构建出静态文件，再启动一个Nginx服务器：
```sh
vuepress build docs
docker run -d --name nginx --network host -v /home/github/Notes/docs/.vuepress/dist/:/root/Notes/ -v /home/github/Notes/nginx.conf:/etc/nginx/nginx.conf nginx
```

## 目录结构

- 笔记保存为 .md 文件，放在 docs 目录下。以书籍为单位划分成多个大目录，每个书籍目录下以章节为单位划分多个子目录，每个章节目录下包含多个 .md 文件。
- 书籍目录的名字用《 》包住。
- 文件名中的特殊字符（比如空格）替换成 - 。
- 如果文件名以 ^ 开头，则表示某个Python模块，在显示时以 ♢ 开头。
