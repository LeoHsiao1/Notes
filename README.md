# LeoHsiao的笔记

- 该笔记的主要目的是记录知识点。
- 笔记保存为MarkDown格式，分为多个书籍，每个书籍划分了章节目录。
- 基于docsify显示静态网站，访问URL：<http://leohsiao.com/>
- 欢迎指正


<!-- 该文件内不能再使用 # 标题，以免破坏目录排版 -->

<details>
<summary>部署方法</summary>

调试时，执行以下命令启动一个HTTP服务器：
```shell
python -m http.server 80 --bind 127.0.0.1
```

正式部署时，执行以下命令启动一个Nginx服务器：
```shell
docker run -d --name nginx --network host -v /home/github/Notes/:/root/Notes/ -v /home/github/Notes/nginx.conf:/etc/nginx/nginx.conf nginx
```
</details>

<details>
<summary>目录结构</summary>

- web端访问index.html作为入口，它的JS会动态加载其它静态文件、.md 文件。
- 笔记保存为 .md 文件，放在 docs 目录下。首先以书籍为单位划分多个大目录，每个书籍目录下以章节为单位划分多个子目录，每个章节目录下包含多个 .md 文件。
- 书籍目录的名字用《 》包住。
- 如果文件名包含空格，则替换成 - 。
- 如果文件名以 ^ 开头，则表示某个Python模块，在显示时替换成 ♢ 。

</details>