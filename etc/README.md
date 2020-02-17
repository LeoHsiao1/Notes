# README

## 部署方法

调试时，只需启动开发环境的服务器：
```sh
yarn vuepress dev docs
```

正式部署时，先构建出静态文件，再启动一个 Nginx 服务器：
```sh
cd /home/github/Notes
yarn vuepress build docs
docker run -d --name nginx --network host -v $PWD/docs/.vuepress/dist/:/root/Notes/ -v $PWD/etc/nginx.conf:/etc/nginx/nginx.conf nginx
```

## 调整字符间距

在Linux终端中执行以下命令，处理 *.md 文件，调整英文、数字与汉字之间的间距：
```
file_list=`find docs -name "*.md" | grep -v index.md`
file_list[${#file_list[*]}]=README.md
file_list[${#file_list[*]}]=etc/README.md
for file in $file_list
do
    python3 etc/replace.py --file $file --src '([\u4e00-\u9fa5])(\w)' --dst '$1 $2'
    python3 etc/replace.py --file $file --src '(\w)([\u4e00-\u9fa5])' --dst '$1 $2'
    python3 etc/replace.py --file $file --src '(\w)([，。：！？])' --dst '$1 $2'
done
```
