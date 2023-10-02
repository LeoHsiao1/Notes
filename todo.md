
搭建开发环境：
docker run -it --rm --name yarn --entrypoint sh -w /app -v $PWD:/app -v $PWD/yarn:/usr/local/share/.cache/yarn/ -p 80:80 node:20-alpine

yarn add -D @vuepress/plugin-google-analytics@next
yarn
yarn vuepress dev docs
yarn vuepress build docs


TODO:
- 网页右侧的目录
  - 显示的“此页内容”改为“此页目录”
  - 让 level1 标题居中显示。且加上 # 锚点 anchor ，从而能够点击跳转
- 网页顶部
  - 取消显示从 Home 开始的路径
  - 取消显示阅读时长
- 主页调整样式、背景图片、颜色，参考 https://theme-hope.vuejs.press/zh/cookbook/customize/#%E8%AF%A6%E6%83%85
- 将侧边栏左移，增加中间文档的宽度
- 检查 https://analytics.google.com/
- 集成 meilisearch 搜索框，但它暂不支持 vuepress 2 ，参考 https://github.com/meilisearch/vuepress-plugin-meilisearch/issues/175
- 检查页面底部的 lastUpdated 信息
- 配置 MdEnhance ，去掉多余的功能，参考 https://theme-hope.vuejs.press/zh/config/plugins/md-enhance.html#katex

