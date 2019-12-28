# VuePress

：与docsify相似，也是SPA网站，但每个页面会事先构建出HTML文件，有利于SEO。
- 基于Vue，显示美观。
- [官方文档](https://vuepress.vuejs.org/guide/)

## 入门示例

1. 安装：
    ```sh
    yarn global add vuepress
    ```
2. 创建一个docs目录，存放要显示的MarkDown文档文件：
    ```sh
    mkdir docs
    echo hello > docs/README.md
    ```
3. 启动开发环境的服务器：
    ```sh
    vuepress dev docs
    ```
4. 构建出静态文件：
    ```sh
    vuepress build docs
    ```
    - 构建结果默认保存在 docs/.vuepress/dist 目录下，可用于运行静态网站。

## 目录结构

以下是VuePress网站的目录结构示例：
```
.
├─ docs                 # 文档目录
│  ├─ README.md
│  ├─ Chapter1
│  │  ├─ index.md
│  │  ├─ one.md
│  │  └─ two.md
│  └─ .vuepress         # 属于该docs目录的vuepress资源
│     ├─ config.js      # vuepress的配置文件
│     ├─ dist           # 保存vuepress build构建结果的目录
│     │  ├─ index.html
│     │  └─ 404.html
│     ├─ static         # 存放静态文件
│     │  └─ favicon.ico
│     ├─ styles
│     │  └─ palette.styl
│     └─ theme
│        └─ Layout.vue
└─ package.json
```

- VuePress会扫描docs目录及其子目录，将每个目录下的 README.md 或 index.md 文件构建成 index.html 。比如上例中，访问URL为`/`时，是根据`docs/README.md`作出显示；访问URL为`/dir1/`时，是根据`docs/test/index.md`作出显示。

## 配置

VuePress网站的配置文件默认为`.vuepress/config.js`，配置示例：
```js
module.exports = {
    title: 'Hello VuePress',            // 网站的标题，还会显示在导航栏的左上角
    description: 'Just playing around', // 网站的简单描述，会保存在HTML的<meta>中
    host: '0.0.0.0',                    // 该VuePress网站监听的IP地址
    port: 8080,                         // 该VuePress网站监听的端口号
    base: '/',                          // 该VuePress网站监听的URL的起始路径，会成为以 / 开始的其它URL的前缀
    dest: '.vuepress/dist',             // 保存 vuepress build 构建结果的目录
    lang: 'zh-CN',                      // 网站的语言，会保存在<html lang="...">中
    markdown: {
        lineNumbers: true,              // 让代码块显示行号
        toc: { includeLevel: [2, 3] },  // MarkDown文档中，让 [[toc]] 标签自动提取哪几级标题
        extractHeaders: ['h2', 'h3'],   // MarkDown文档中，让VuePress提取哪几级标题作为Header
    }
}
```
- VuePress 内置了基于 headers 的搜索 —— 它会自动为所有页面的标题、h2 和 h3 构建起一个简单的搜索索引。


## 主题

```js
module.exports = {
    theme: 'vuepress-theme-xx',      // 使用的主题
    themeConfig: {                   // 配置主题
        logo: '/assets/img/logo.png',
    }
}
```
    
- 编辑`.vuepress/styles/palette.styl`文件可修改网站配色，默认的颜色值如下：
    ```
    $accentColor = #3eaf7c
    $textColor = #2c3e50
    $borderColor = #eaecef
    $codeBgColor = #282c34
    $badgeTipColor = #42b983
    $badgeWarningColor = darken(#ffe564, 35%)
    $badgeErrorColor = #DA5961
    ```


## 插件

- VuePress已使用Prism实现了MarkDown中代码块的语法高亮，不需要再自己下载Prism的插件。
