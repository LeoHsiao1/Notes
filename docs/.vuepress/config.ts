import { defineUserConfig } from "vuepress"
import theme from "./theme.js"
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics'
// import { default as anchorPlugin } from 'markdown-it-anchor'
import { anchorPlugin } from '@vuepress/markdown'
// import anchorPlugin from 'markdown-it-anchor';

export default defineUserConfig({
  title: "LeoHsiao's Notes",
  description: ' ',
  host: '0.0.0.0',
  port: 80,
  base: '/',
  dest: 'docs/.vuepress/dist',
  lang: 'zh-CN',

  // 在 HTML 中添加 head
  // head: [
  //   ['meta', { name: 'foo', content: 'bar' }],
  //   ['link', { rel: 'canonical', href: 'foobar' }],
  //   ['script', {}, `console.log('hello from frontmatter');`],
  // ],

  plugins: [
    googleAnalyticsPlugin({
      id: 'G-YLS8VYET64',
    }),
  ],

  // 读取哪些文件作为 markdown 文档
  pagePatterns: [
    "**/*.md",
    "!.vuepress",
    "!node_modules",
  ],

  markdown: {
    // 为 markdown 文档中的各级标题，生成 archor 锚点
    anchor: {
      level: [1, 2, 3, 4, 5, 6],
      permalink: anchorPlugin.permalink.ariaHidden({
        class: "header-anchor",
        symbol: "#",
        space: true,
        placement: "before",
      }),
    },
    // 在代码块中，不显示代码行号，从而简化显示内容
    code: {
      lineNumbers: false,
    },
    // 为 markdown 文档生成右侧目录树时，只提取 h1~h4 级别的标题
    headers: {
      level: [1, 2, 3, 4]
    },
  },

  theme,
})
