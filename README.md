# LeoHsiao的笔记

- 该笔记的主要目的是记录知识点。
- 笔记保存为MarkDown格式，分为多个书籍，按目录排序。
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