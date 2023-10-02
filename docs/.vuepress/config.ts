import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics';

export default defineUserConfig({
  title: "LeoHsiao's Notes",
  description: ' ',
  host: '0.0.0.0',
  port: 80,
  base: '/',
  dest: 'docs/.vuepress/dist',
  lang: 'zh-CN',

  // 在 HTML 中添加 head
  // head: [["link", { rel: "icon", href: "/images/logo.png" }]],

  plugins: [
    googleAnalyticsPlugin({
        id: 'G-YLS8VYET64',
    }),

    // vuepress-plugin-meilisearch 暂不支持 vuepress 2
    // ['vuepress-plugin-meilisearch',
    // {
    //     hostUrl: 'https://meilisearch.leohsiao.com',
    //     apiKey: 'X9UsPpbPe6ed532b8c3f8cfaf8cdcaa2fb0ff3e6637da4303eb6505c81f46ec7d859dc09',
    //     indexUid: 'docs',
    //     placeholder: '',
    //     maxSuggestions: 6,
    //     cropLength: 50,
    // }
    // ],
  ],

  // head: [
  //   ['meta', { name: 'foo', content: 'bar' }],
  //   ['link', { rel: 'canonical', href: 'foobar' }],
  //   ['script', {}, `console.log('hello from frontmatter');`],
  // ],

  pagePatterns: [
    "**/*.md",
    "!.vuepress",
    "!node_modules",
  ],

  markdown: {
    // 为 markdown 文档生成目录时，提取 h1~h4 级别的标题
    headers: {
      level: [1, 2, 3, 4]
    },
  },

  theme,
});
