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
    - 当项目文件被修改之后，该服务器会自动刷新网页内容，不需要手动按F5。
4. 构建出静态文件：
    ```sh
    vuepress build docs
    ```
    - 构建结果默认保存在 `docs/.vuepress/dist` 目录下，可用于运行静态网站。
    - 使用 vuepress dev 时，遇到错误可能会忽略。但使用 vuepress build 时，遇到错误就会中断构建。

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
│  └─ .vuepress         # docs目录的VuePress资源文件
│     ├─ config.js      # VuePress的配置文件
│     ├─ dist           # 保存vuepress build的构建结果（该目录应该记入.gitignore）
│     |  ├─ assets      # 保存VuePress内部使用的css、js、img文件
│     |  ├─ favicon.ico # 从public目录拷贝而来
│     |  ├─ index.html  # 从index.md构建生成
│     |  └─ 404.html    # 被VuePress自动拷贝而来
│     └─ public         # 存放一些没有被MarkDown引用但是被网站使用的静态文件，在构建时会被拷贝到dist目录下
│        └─ favicon.ico # 网站的logo
└─ package.json
```
- 上例中，docs目录就是VuePress网站的根目录。
- VuePress会扫描docs目录及其子目录，将每个目录下的 README.md 或 index.md 文件构建成 index.html 。比如上例中，访问URL为`/`时，是根据`docs/README.md`作出显示；访问URL为`/dir1/`时，是根据`docs/test/index.md`作出显示。
- MarkDown文档中引用图片等资源时，建议使用相对路径，并且显示地以 ./ 开头，而且只包含英文字符，否则可能不能显示。

## 基本配置

VuePress网站的配置文件默认为`docs/..vuepress/config.js`，配置示例如下：
```js
module.exports = {
    title: 'Hello VuePress',            // 网站的标题，还会显示在导航栏的左上角
    description: 'some descriptions',   // 网站的简单描述，会保存在HTML的<meta>中
    host: '0.0.0.0',                    // 该VuePress网站监听的IP地址
    port: 8080,                         // 该VuePress网站监听的端口号
    base: '/',                          // 该VuePress网站监听的URL的起始路径，会成为以 / 开始的其它URL的前缀
    dest: 'docs/.vuepress/dist',        // 保存 vuepress build 构建结果的目录
    lang: 'zh-CN',                      // 网站的语言，会保存在<html lang="...">中
    head: [                             // 定义一些标签，会保存在HTML的<head>中
        ['link', { rel: 'icon', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#3eaf7c' }]
    ],
    markdown: {
        lineNumbers: true,              // 让代码块显示行号
        toc: { includeLevel: [2, 3] },  // MarkDown文档中，用 [[toc]] 标签建立目录时，收集哪几级标题
        extractHeaders: ['h2', 'h3'],   // MarkDown文档中，对于哪几级标题建立搜索索引
    }
}
```

## 默认主题的配置

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
						link: '/language/cn/' // 此处的items链接只能是英文
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
                ['/Chapter1/2', '第二节']	// 定义一个链接，并设置其显示的名字
            ],
        }
    }
    ```
    - 这些链接必须是 docs 目录下的绝对路径，以 / 开头。
    - 当用户访问的URL为'/Chapter1/1'时，VuePress会先查找是否存在'/Chapter1/1.html'文件，不存在的话再查找是否存在'/Chapter1/1/index.html'文件，依然不存在的话就报错404。

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
            path: '/Chapter1',  // 设置title指向的链接（只能包含英文，可以不设置）
            collapsable: true,  // 是否折叠显示
            sidebarDepth: 2,    // 自动从当前文档中提取标题链接，最深提取到 h3 级标题
            children: [         // title下的子链接
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
        '/Chapter1/': [     // 如果当前URL在路径下，则显示这部分侧边栏
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

### 首页

只要docs目录下存在 README.md 或 index.md 文件，就可以让VuePress显示出网站的首页。

特别地，可以在`docs/READMD.md`文件中插入以下YAML格式的内容，让VuePress网站显示一种特殊布局的首页（Homepage）。
```markdown
---
home: true              # 开启显示Homepage
heroImage: /hero.png    # 显示一张小图
heroText: 大标题        # 大标题（赋值为null则不显示）
tagline: 副标题
actionText: 开始阅读     # 按钮的名字（只能定义一个按钮）
actionLink: /zh/guide/   # 按钮的链接
features:
- title: 特征1
  details: 简短的描述...
- title: 特征2
  details: 简短的描述...
footer: MIT Licensed | Copyright © 2018-present Evan You    # 页脚
---

（接着可以写入其它内容...）
```
- 这个Homepage的显示效果一般，不用也罢。

### 显示样式

- 编辑`docs/.vuepress/styles/palette.styl`文件可修改网站配色，如下：
    ```
    $accentColor = #3eaf7c  // 链接的颜色
    $textColor = #2c3e50    // 文本的颜色
    $borderColor = #eaecef  // 边框线的颜色
    $codeBgColor = #282c34  // 代码块的背景色

    $navbarHeight = 3.6rem  // 导航栏的高度
    $sidebarWidth = 16rem   // 侧边栏的宽度
    $contentWidth = 60rem   // 文章内容的宽度
    ```

- 编辑`docs/.vuepress/styles/index.styl`文件可定义一些样式，覆盖掉默认样式，如下：
    ```css
    body {
        font-family: Consolas, "Microsoft YaHei", serif;
    }
    ```

### 其它配置

```js
module.exports = {
    // theme: '@vuepress/theme-default',            // 使用的主题
    themeConfig: {                                  // 主题的配置
		repo: 'https://github.com/LeoHsiao1/Notes', // 启用到GitHub仓库的链接，显示在页面右上角
		repoLabel: 'GitHub',                        // repo链接显示的名字
		docsDir: 'docs',                            // 使用GitHub仓库中哪个目录下的文档
		docsBranch: 'master',                       // 指向GitHub仓库的哪个分支
		editLinks: true,                            // 启用快速编辑的链接，显示在文章末尾的左下角
		editLinkText: 'Edit on GitHub',             // editlink显示的名字
        lastUpdated: 'Last Updated',	            // 根据git commit记录显示每个页面的最后编辑时间
        logo: '/logo.png',                          // 网站logo，会显示在导航栏的左侧
		smoothScroll: true,                         // 在页面内进行跳转时，页面会平滑滚动
    }
}
```
- VuePress使用Prism实现了MarkDown中代码块的语法高亮。

## 插件

### 搜索

VuePress内置了一个搜索框，不过只对所有页面的h1、h2、h3级标题建立了搜索索引，不能进行全文搜索。
- 使用 [Algolia插件](https://vuepress.vuejs.org/zh/theme/default-theme-config.html#algolia-%E6%90%9C%E7%B4%A2) 之后可以进行全文搜索。

### Google analytics

：Google提供的一个分析网站访问流量的免费服务。

用法：
1. 访问<https://analytics.google.com/>，登录Google账号，创建一个Google Analytics的跟踪ID。
2. 使用[ Google analytics 插件](https://v1.vuepress.vuejs.org/plugin/official/plugin-google-analytics.html)
