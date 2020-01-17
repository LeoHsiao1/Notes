# 部署

## 部署方法

调试时，只需启动开发环境的服务器：
```sh
yarn vuepress dev docs
```

正式部署时，先构建出静态文件，再启动一个 Nginx 服务器：
```sh
cd /home/github/Notes
yarn vuepress build docs
docker run -d --name nginx --network host -v $PWD/docs/.vuepress/dist/:/root/Notes/ -v $PWD/nginx.conf:/etc/nginx/nginx.conf nginx
```

## 加工

使用 VS Code 的正则替换功能，处理 *.md 文件，修改英文、数字与汉字之间的间距：
```
([\u4e00-\u9fa5])(\w)   # Search
$1 $2                   # Replace
.md                     # files to include
```
```
(\w)([\u4e00-\u9fa5])
$1 $2
.md
```
