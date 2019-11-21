# LeoHsiao的笔记

- 该笔记的主要目的是记录知识点，没有平滑的原理讲解。
- 笔记保存为MarkDown格式，按文档目录排序
- 基于docsify显示静态网站，访问URL：<http://leohsiao.com/>
- 欢迎指正

## 构建

```bash
docker run -d --name nginx -p 80:80 -v /root/Notes/www:/root/Notes/www -v /root/Notes/nginx.conf:/etc/nginx/nginx.conf nginx

python -m http.server 80 --bind 127.0.0.1

```


`TODO：`
- 设置前四级标题的字体、目录字体
- 修复目录激活点的错位
- 把页面图标做成透明的
- 设置背景图片
- 搜索引擎
- 缩小字号，直到与VS Code差不多
- 将一些代码块改为bash类型
