# VuePress

：一个制作静态网站的工具。
- [官方文档](https://vuepress.vuejs.org/guide/)
- 基于 Vue ，显示美观。
- 与 docsify 相似，也是 SPA 网站，但每个页面会事先构建出 HTML 文件，有利于 SEO 。

## 用法示例

1. 安装：
    ```sh
    yarn add vuepress
    ```
2. 创建一个 docs 目录，存放要显示的 MarkDown 文档文件：
    ```sh
    mkdir docs
    echo hello > docs/README.md
    ```
3. 启动开发环境的服务器：
    ```sh
    vuepress dev docs
                      --debug   # 显示调试信息
    ```
    - 当项目文件被修改之后，该服务器会自动刷新网页内容，不需要手动按 F5 。
4. 构建出静态文件：
    ```sh
    vuepress build docs
    ```
    - 构建结果默认保存在 `docs/.vuepress/dist` 目录下，可用于运行静态网站。
    - 使用 vuepress dev 时，遇到错误可能会忽略。但使用 vuepress build 时，遇到错误就会中断构建。

## 目录结构

以下是 VuePress 网站的目录结构示例：
```
.
├─ docs                 # 文档目录
│  ├─ README.md
│  ├─ Chapter1
│  │  ├─ index.md
│  │  ├─ one.md
│  │  └─ two.md
│  └─ .vuepress         # docs 目录的 VuePress 资源文件
│     ├─ config.js      # VuePress 的配置文件
│     ├─ dist           # 保存 vuepress build 的构建结果（该目录应该记入.gitignore）
│     |  ├─ assets      # 保存 VuePress 内部使用的 css、js、img 文件
│     |  ├─ favicon.ico # 从 public 目录拷贝而来
│     |  ├─ index.html  # 从 index.md 构建生成
│     |  └─ 404.html    # 被 VuePress 自动拷贝而来
│     └─ public         # 存放一些没有被 MarkDown 引用但是被网站使用的静态文件，在构建时会被拷贝到 dist 目录下
│        └─ favicon.ico # 网站的 logo
└─ package.json
```
- 上例中，docs 目录就是 VuePress 网站的根目录。
- VuePress 会扫描 docs 目录及其子目录，将每个目录下的 README.md 或 index.md 文件构建成 index.html 。比如上例中，访问 URL 为 `/` 时，是根据 `docs/README.md` 作出显示；访问 URL 为 `/dir1/` 时，是根据 `docs/test/index.md` 作出显示。
- MarkDown 文档中引用图片等资源时，建议使用相对路径，并且显示地以 ./ 开头，而且只包含英文字符，否则可能不能显示。

## 基本配置

VuePress 网站的配置文件默认为 `docs/..vuepress/config.js` ，配置示例如下：
```js
module.exports = {
    title: 'Hello VuePress',            // 网站的标题，还会显示在导航栏的左上角
    description: 'some descriptions',   // 网站的简单描述，会保存在 HTML 的<meta>中
    host: '0.0.0.0',                    // 该 VuePress 网站监听的 IP 地址
    port: 8080,                         // 该 VuePress 网站监听的端口号
    base: '/',                          // 该 VuePress 网站监听的 URL 的起始路径，会成为以 / 开始的其它 URL 的前缀
    dest: 'docs/.vuepress/dist',        // 保存 vuepress build 构建结果的目录
    lang: 'zh-CN',                      // 网站的语言，会保存在<html lang="...">中
    head: [                             // 定义一些标签，会保存在 HTML 的<head>中
        ['link', { rel: 'icon', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#3eaf7c' }]
    ],
    markdown: {
        lineNumbers: true,              // 让代码块显示行号
        extractHeaders: ['h2', 'h3'],   // 从 MarkDown 文档中提取哪几级标题，保存到 this.$page.headers
        toc: { includeLevel: [2, 3] },  // MarkDown 文档中，用 [[toc]] 标签建立目录时，收集哪几级标题
    }
}
```

## 默认主题的配置

```js
module.exports = {
    // theme: '@vuepress/theme-default',            // 使用的主题
    themeConfig: {                                  // 主题的配置
        repo: 'https://github.com/LeoHsiao1/Notes', // 启用到 GitHub 仓库的链接，显示在页面右上角
        repoLabel: 'GitHub',                        // repo 链接显示的名字
        docsDir: 'docs',                            // 使用 GitHub 仓库中哪个目录下的文档
        docsBranch: 'master',                       // 指向 GitHub 仓库的哪个分支
        editLinks: true,                            // 启用快速编辑的链接，显示在文章末尾的左下角
        editLinkText: 'Edit on GitHub',             // editlink 显示的名字
        lastUpdated: 'Last Updated',                // 根据 git commit 记录显示每个页面的最后编辑时间
        logo: '/logo.png',                          // 网站 logo ，会显示在导航栏的左侧
        smoothScroll: true,                         // 在页面内进行跳转时，页面会平滑滚动
    }
}
```
- VuePress 使用 Prism.js 实现了 MarkDown 中代码块的语法高亮。
- VuePress 内置了一个搜索框，不过只对所有页面的 h1、h2、h3 级标题建立了搜索索引。

### 首页

只要 docs 目录下存在 README.md 或 index.md 文件，就可以让 VuePress 显示出网站的首页。

特别地，可以在 `docs/READMD.md` 文件中插入以下 YAML 格式的内容，让 VuePress 网站显示一种特殊布局的首页（Homepage）。
```markdown
---
home: true              # 开启显示 Homepage
heroImage: /hero.png    # 显示一张小图
heroText: 大标题        # 大标题（赋值为 null 则不显示）
tagline: 副标题
actionText: 开始阅读     # 按钮的名字（只能定义一个按钮）
actionLink: /zh/guide/   # 按钮的链接
features:
- title: 特征 1
  details: 简短的描述...
- title: 特征 2
  details: 简短的描述...
footer: MIT Licensed | Copyright © 2018-present Evan You    # 页脚
---

（接着可以写入其它内容...）
```
- 这个 Homepage 的显示效果一般，不用也罢。

### 显示样式

- 编辑 `docs/.vuepress/styles/palette.styl` 文件可修改网站配色，如下：
    ```
    $accentColor = #3eaf7c  // 链接的颜色
    $textColor = #2c3e50    // 文本的颜色
    $borderColor = #eaecef  // 边框线的颜色
    $codeBgColor = #282c34  // 代码块的背景色

    $navbarHeight = 3.6rem  // 导航栏的高度
    $sidebarWidth = 16rem   // 侧边栏的宽度
    $contentWidth = 60rem   // 文章内容的宽度
    ```

- 编辑 `docs/.vuepress/styles/index.styl` 文件可定义一些样式，覆盖掉默认样式，如下：
    ```css
    body {
        font-family: Consolas, "Microsoft YaHei", serif;
    }
    ```

### 导航栏

添加以下格式的配置，即可在网站右上角显示导航栏链接：
```js
module.exports = {
    themeConfig: {
        nav: [                                // 定义导航栏
            {
                text: 'Home',                 // 定义一个链接
                link: '/'
            },
            {
                text: 'External',
                link: 'https://google.com'    // 可以定义跨域链接
            },
            {
                text: 'Languages',
                items: [                      // 定义一组链接，作为下拉框显示
                    {
                        text: 'Chinese',
                        link: '/language/cn/' // 此处的 items 链接只能是英文
                    },
                    {
                        text: 'English',
                        link: '/language/en/'
                    }
                ]
            }
        ]
    }
}
```

### 侧边栏

侧边栏有多种定义方式：
- 方式一：手动定义侧边栏中的链接
    ```js
    module.exports = {
        themeConfig: {
            sidebar: [
                '/Chapter1/1',              // 定义一个链接，会自动提取目标文档的标题作为链接名
                ['/Chapter1/2', '第二节']    // 定义一个链接，并设置其显示的名字
            ],
        }
    }
    ```
    - 这些链接必须是 docs 目录下的绝对路径，以 / 开头。
    - 当用户访问的 URL 为'/Chapter1/1'时，VuePress 会先查找是否存在'/Chapter1/1.html'文件，不存在的话再查找是否存在'/Chapter1/1/index.html'文件，依然不存在的话就报错 404 。

- 方式二：让侧边栏只包含从当前页面提取的标题链接
    ```js
    module.exports = {
        themeConfig: {
            sidebar: 'auto'
        }
    }
    ```

- 方式三：将链接分成多组显示
    ```js
    sidebar: [
        {
            title: '第一章',    // 这一组链接的名字
            path: '/Chapter1',  // 设置 title 指向的链接（只能包含英文，可以不设置）
            collapsable: true,  // 是否折叠显示
            sidebarDepth: 2,    // 自动从当前文档中提取标题链接，最深提取到 h3 级标题
            children: [         // title 下的子链接
                ['/Chapter1/1', '第一节'],
                ['/Chapter1/2', '第二节'],
                {
                    title: '第三节',    // 分组链接支持最多三层嵌套
                    children: [
                        '/Chapter1/3.1',
                        '/Chapter1/3.2',
                    ]
                }
            ]
        },
        {
            title: '第二章',
            children: [ ]
        }
    ],
    nextLinks: true,    // 根据侧边栏目录，显示到下一个页面的链接
    prevLinks: true,    // 根据侧边栏目录，显示到上一个页面的链接
    ```
    - 当用户访问某个文档页面时，如果该页面收录在侧边栏中，则会自动显示出该页面的目录。

- 方式四：在不同的页面显示不同的侧边栏
    ```js
    sidebar: {
        '/Chapter1/': [     // 如果当前 URL 在路径下，则显示这部分侧边栏
            {
                title: '第一章',
                path: '/Chapter1/',
                collapsable: true,
                sidebarDepth: 2,
                children: [
                    ['1', '第一节'],
                    ['2', '第二节'],
                ]
            },
            {
                title: '附录',
                path: '/Chapter1/appendix',
            }
        ],
        '/Chapter2/': [{
            title: '第二章',
            path: '/Computer-Network/'
        }]
    }
    ```

## 插件

- [官方插件列表](https://vuepress.vuejs.org/zh/plugin/)
- [社区插件列表](https://github.com/vuepress/awesome-vuepress)
- [vuepress-plugin-vssue](https://vssue.js.org/guide/vuepress.html) ：用于在网页底部显示评论栏。
- [vuepress-plugin-right-anchor](https://github.com/xuekai-china/vuepress-plugin-right-anchor/blob/master/zh-README.md) ：用于在网页右侧显示当前文档的目录。

### google-analytics

该插件用于让 Vuepress 对接到 Google 提供的的 Google analytics 平台，从而分析网站访问流量。使用步骤如下：
1. 访问 <https://analytics.google.com/> ，登录 Google 账号，创建一个 Google Analytics 的跟踪 ID 。
2. 添加[ Google analytics 插件](https://vuepress.vuejs.org/plugin/official/plugin-google-analytics.html)

### vuepress-plugin-sitemap

该插件用于为 Vuepress 网站自动生成 sitemap.xml 文件，便于搜索引擎抓取本站内容。使用步骤如下：
1. 安装：`yarn add vuepress-plugin-sitemap`
2. 在 config.js 中添加如下配置：
    ```js
    module.exports = {
        plugins: [
            ['sitemap', {
                hostname: 'http://leohsiao.com'
            }],
        ],
    }
    ```
3. 重新编译 Vuepress 网站。

### vuepress-plugin-meilisearch

该插件用于让 Vuepress 的搜索栏支持全文搜索。
- 当用户在搜索栏中输入字符串时，该插件会实时地向 meilisearch 服务器发出 AJAX 形式的查询请求，然后将查询结果显示在搜索栏下方。

meilisearch 是一个开源的搜索引擎，采用 Rust 语言开发，借鉴了 Algolia 引擎，适合用于实现个人网站的搜索栏。
- [官网](https://docs.meilisearch.com/)
- 使用 meilisearch 的主要流程如下：
  1. 运行 meilisearch 服务器。
  2. 执行 meilisearch 的 scrape 工具，抓取目标网站的内容信息，并送到 meilisearch 服务器中存储。
      每当目标网站的内容更新时，就应该抓取一次。
  3. 向 meilisearch 服务器发出 HTTP 查询请求，搜索某一字符串在目标网站上的位置。

#### 使用步骤

1. 启动 meilisearch 服务器：
    ```sh
    docker run -d --name meilisearch \
            -p 7700:7700 \
            -e MEILI_MASTER_KEY=****** \
            -e MEILI_HTTP_ADDR=0.0.0.0:7700 \
            -v /opt/meilisearch:/data.ms \
            getmeili/meilisearch
    ```
    - 启动 meilisearch 服务器时，默认没有设置密钥，允许用户访问任意 URL 。设置密钥就可以拒绝非法用户的访问。
    - 可以设置环境变量 `MEILI_MASTER_KEY=******` 作为主密钥，此时会自动生成私钥和公钥，发送以下 HTTP 请求即可查询到：
        ```sh
        [root@Centos ~]# curl 'http://localhost:7700/keys' -H "X-Meili-API-Key: $MEILI_MASTER_KEY"
        {"private":"3fced9cfe0467f23a94ac4bb8368a58f815fa167da226418a417dc58cdec8259","public":"3e7193b91276c4ec577014a99188682280a2bc674f45557d11bad94c7e0e6843"}
        ```
    - 如果用户在发出的 HTTP 查询请求的 headers 中加上私钥（主密钥一般不用于查询），才有权访问除了 `/keys` 以外的 URL 。如果使用公钥，则只有权查询 `/indexes` 下的部分内容。
    - 部署新的 meilisearch 时，索引不能向上兼容，需要清空 `/data.ms` 目录，重新生成索引。

2. 执行 meilisearch 的 scrape 工具：
    ```sh
    docker run -it --rm \
        --network=host \
        -e MEILISEARCH_HOST_URL='http://leohsiao.com:7700' \
        -e MEILISEARCH_API_KEY='$private_key' \
        -v $PWD/etc/docs-scraper.json:/docs-scraper/config.json \
        getmeili/docs-scraper pipenv run ./docs_scraper config.json
    ```
    这里需要创建 scrape 的配置文件 docs-scraper.json ，如下：
    ```json
    {
        "index_uid": "docs",                                    // 索引 ID ，用于区分不同的抓取结果
        "sitemap_urls": ["http://leohsiao.com/sitemap.xml"],
        "start_urls": ["http://leohsiao.com"],                  // 待抓取的目标网站
        "selectors": {
            "lvl0": {
                "selector": ".sidebar-heading.open",
                "global": true,
                "default_value": "Documentation"
            },
            "lvl1": ".theme-default-content h1",
            "lvl2": ".theme-default-content h2",
            "lvl3": ".theme-default-content h3",
            "lvl4": ".theme-default-content h4",
            "lvl5": ".theme-default-content h5",
            "text": ".theme-default-content p, .theme-default-content li"
        },
        "strip_chars": " .,;:#",
        "scrap_start_urls": true
    }
    ```

3. 安装：`yarn add vuepress-plugin-meilisearch`

4. 在 config.js 中添加如下配置：
    ```js
    module.exports = {
        plugins: [
            ['vuepress-plugin-meilisearch',
                {
                    hostUrl: 'http://leohsiao.com:7700',        // 该 URL 应该能在用户的浏览器上被访问，不能为 localhost
                    apiKey: '57557c7907388a064d88e127e15a',     // 这里应该使用 public key
                    indexUid: 'docs',
                    placeholder: 'Search as you type...',       // 在搜索栏中显示的占位符
                    maxSuggestions: 5,                          // 最多显示几个搜索结果
                    cropLength: 30,                             // 每个搜索结果最多显示多少个字符
                },
            ],
        ],
    }
    ```

5. 重新编译 Vuepress 网站。

