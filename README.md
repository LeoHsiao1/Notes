# 我的笔记

## 特征

- 该笔记的主要目的是记录知识点，没有平滑的原理讲解。
- 笔记保存为MarkDown格式，以便于Git管理
- 笔记显示成文档形式，以便于结构化、系统化
<!-- - 基于Jekyll构建静态网站，访问URL：<https://leohsiao1.github.io/> -->
- 欢迎指正

## 网站还在施工中

## 构建

```shell
docker run -d --name nginx -p 80:80 -v /root/Notes/www:/root/Notes/www -v /root/Notes/nginx.conf:/etc/nginx/nginx.conf nginx

python -m http.server --bind 127.0.0.1 80

```