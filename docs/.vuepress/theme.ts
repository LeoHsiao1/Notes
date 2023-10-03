import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://leohsiao.com",
  docsDir: "docs",

  // 引用 icon 图标库
  iconAssets: "fontawesome-with-brands",
  // 是否允许切换到夜晚模式的网页显示
  darkmode: "disable",
  // 是否显示一个回到网页顶部的按钮，位于网页右下角
  backToTop: false,
  // 是否显示一个打印按钮，位于网页右侧目录栏
  print: false,

  navbar,

  sidebar,

  // 控制在导航栏 navbar 显示的内容
  // logo: "/favicon.ico",
  // navTitle: $siteLocale.title,
  repo: "https://github.com/LeoHsiao1/Notes",
  repoLabel: "GitHub",
  repoDisplay: true,

  // ↓↓↓ 控制每个 markdown 文档顶部的显示内容
  // 是否显示从 Home 页面到当前页面的路径导航
  breadcrumb: false,
  // 是否显示页面信息，比如作者、分类标签、写作日期、预计阅读时间
  pageInfo: false,
  hideSiteNameOnMobile: true,
  navbarAutoHide: "mobile",
  navbarLayout: {
    start: ["Brand"],
    center: [],
    end: ["Search", "Links", "Repo"],
  },
  titleIcon: false,

  // ↓↓↓ 控制每个 markdown 文档底部的显示内容
  displayFooter: false,
  // footer: "Default footer",
  copyright: false,
  prevLink: false,
  nextLink: false,
  contributors: false,
  lastUpdated: false,
  editLink: true,
  docsBranch: 'master',
  // 几个信息显示的名称
  metaLocales: {
    editLink: "Edit on GitHub",
    lastUpdated: "lastUpdated",
    toc: "此页目录",
  },

  // 是否为 markdown 文档显示目录，位于网页右侧
  toc: true,
  // 显示 h1~h4 级别的标题
  headerDepth: 4,

  plugins: {
    // 是否为每个文件夹自动生成目录，该功能适合与 breadcrumb 组合使用。不启用它，因为要手动控制章节顺序
    autoCatalog: false,

    // 启用 vuepress-plugin-copy-code2 插件，用于在 markdown 每个代码块的右上角，显示一个复制按钮
    copyCode: {},

    // 启用 @vuepress/plugin-git 插件，用于根据 git comment 信息，显示 contributors、lastUpdated 等信息
    git: true,

    // 启用 vuepress-plugin-photo-swipe 插件，允许点击 markdown 文档中的图片，进入浏览模式
    photoSwipe: true,

    // 启用 vuepress-plugin-seo2 插件，用于自动添加有利于 SEO 的 head 标签
    seo: true,

    // 启用 vuepress-plugin-sitemap2 插件，用于自动生成网站地图
    sitemap: true,

    // vuepress-plugin-md-enhance 插件提供了多个功能，默认每个功能都为 false ，这里只启用部分功能
    mdEnhance: {
      // align: true,
      attrs: true,
      // chart: true,
      // codetabs: true,
      // container: true,
      // demo: true,
      // echarts: true,
      // figure: true,
      // flowchart: true,
      // gfm: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      // katex: true,
      mark: true,
      // mermaid: true,
      // playground: {
      //   presets: ["ts", "vue"],
      // },
      // presentation: ["highlight", "math", "search", "notes", "zoom"],
      // stylize: [
      //   {
      //     matcher: "Recommended",
      //     replacer: ({ tag }) => {
      //       if (tag === "em")
      //         return {
      //           tag: "Badge",
      //           attrs: { type: "tip" },
      //           content: "Recommended",
      //         };
      //     },
      //   },
      // ],
      sub: true,
      sup: true,
      // tabs: true,
      vPre: true,
      // vuePlayground: true,
    },

  },
});
