# 管理

## 部署方法

调试时，只需启动开发环境的服务器：
```sh
cd /home/github/Notes
yarn
yarn vuepress dev docs
```

正式部署时，先构建出静态文件，再启动一个 Nginx 服务器：
```sh
cd /home/github/Notes
yarn
yarn vuepress build docs
docker run -d --name nginx \
        --restart on-failure \
        -p 80:80 \
        -v $PWD/docs/.vuepress/dist/:/root/Notes/ \
        -v $PWD/etc/nginx.conf:/etc/nginx/nginx.conf \
        nginx
```

另外，还需要部署 meilisearch 服务器、执行 scrape 工具，才能使用搜索栏。

## 生成目录

根据 `docs/index.md` 及各书籍目录下的 index.md 文件中的目录，生成 `docs/.vuepress/config.js` 文件中的 nav、sidebar 目录。
```sh
python3 etc/set_catalog.py
```

## 调整字符间距

在 Linux 终端执行以下命令，处理 `*.md` 文件，在中文、英文字符之间插入空格：
```sh
file_list=`find . -name "*.md" | grep -v index.md`
file_list[${#file_list[*]}]=README.md
file_list[${#file_list[*]}]=etc/README.md
for file in $file_list
do
    python3 etc/replace.py --file $file --src '([\u4e00-\u9fa5])(\w|`|C\+\+|g\+\+)' --dst '$1 $2'
    python3 etc/replace.py --file $file --src '(\w|`|C\+\+|g\+\+)([\u4e00-\u9fa5])' --dst '$1 $2'
    python3 etc/replace.py --file $file --src '(\w|`|C\+\+|g\+\+)([，。：！？])'     --dst '$1 $2'
done
```
