# 管理

## 部署

- 调试时，只需启动开发环境的服务器：
  ```sh
  yarn
  yarn vuepress dev docs
  ```

- 正式部署的步骤：
  1. 先构建网站：
      ```sh
      yarn
      yarn vuepress build docs
      ```
      构建结果会保存到 `docs/.vuepress/dist/` 目录下，用 Nginx 代理即可。
  2. 启动一个 Nginx 服务器，代理网站的 dist 目录。并启用 SSL 证书。
  3. 部署 meilisearch 服务器、执行 docs-scraper ，从而启用网站的搜索栏。

## 配置

### 目录结构

- 笔记保存为 .md 文件，放在 docs 目录下。以书籍为单位划分多个目录，以章节为单位划分多个子目录。
- 需要在 `docs/${BOOK}/index.md`、`docs/.vuepress/config.js` 文件中配置目录结构。
- 执行以下命令，会根据 `docs/index.md`、`docs/${BOOK}/index.md` 文件中的目录，修改 `docs/.vuepress/config.js` 文件中的 nav、sidebar 配置。
  ```sh
  python3 etc/set_sidebar.py
  ```
- 书籍目录显示的名称用 《 》 包住。

### 字符间距

- 在 Linux 终端执行以下命令，在 `*.md` 文件的中文、英文字符之间插入空格：
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
