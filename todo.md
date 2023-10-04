
搭建开发环境：
docker run -it --rm --name yarn --entrypoint sh -w /app -v $PWD:/app -v $PWD/yarn:/usr/local/share/.cache/yarn/ -p 80:80 node:20-alpine

yarn add -D @vuepress/plugin-google-analytics@next
yarn
yarn vuepress dev docs
yarn vuepress build docs


TODO:

- googleAnalyticsPlugin 目前版本没有生效，执行 yarn vuepress dev docs --debug 没有显示该插件，开 F12 搜不到 google 关键词。参考 https://analytics.google.com/
- 集成 meilisearch 搜索框，但它暂不支持 vuepress 2 ，参考 https://github.com/meilisearch/vuepress-plugin-meilisearch/issues/175
  也许手动添加搜索框，参考
    https://www.meilisearch.com/docs/learn/cookbooks/search_bar_for_docs
    https://github.com/tauri-apps/meilisearch-docsearch
  或改用 https://vuejs.press/zh/reference/plugin/docsearch.html#%E6%A0%B7%E5%BC%8F
