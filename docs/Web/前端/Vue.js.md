# Vue.js

：一个前端开发框架。
- [官方文档](https://vuejs.org/v2/guide/index.html)
- 发音与 view 相同。
- 版本：
  - Vue 1 ：于 2015 年发布。
  - Vue 2 ：于 2016 年发布。
  - Vue 3 ：于 2020 年发布。

## 用法

- 开发简单的网页时，通常导入 Vue 的独立 js 文件即可。
- 构建大型项目时，通常用 npm 安装 Vue ：`npm install vue`
- Vue 提供了一个 cli 工具，用于快速为复杂的单页面应用 (SPA) 搭建脚手架。

## 用法示例

在 HTML 文件中加入以下代码：
```html
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.js"></script>
<script>
  var vm = new Vue({  // 创建 Vue 的实例
    el: '#app',       // 挂载到指定 id 的元素上
    data: {
      msg: 'Hello World!'
    }
  })
</script>

<div id="app">
  <p>{{ msg }}</p>    // 此处等待传入变量 msg
</div>
```
- 可以从 CDN 导入 Vue 的独立 js 文件，也可以下载之后从本地导入。
- 导入 Vue 的独立 js 文件时需要注意其版本号，并且同一版本下也包含多种用途的 js 文件：
  - vue.js ：体积较大，具有清晰的源代码、注释、报错信息，适用于开发环境。
  - vue.min.js ：体积较小，没有报错信息，适用于生产环境。
  - vue.runtime.min.js ：体积很小，只是运行时版本，不包含 Vue 代码的编译器。
- 导入 Vue 的独立 js 文件之后，便可使用全局变量 Vue 。
- 被 Web 浏览器渲染时，Vue 会将 msg 变量的值填入 HTML DOM 中，渲染出最终的 HTML 文件，显示给用户看。


> TODO:待补充


## 相关工具

- [form-create](http://www.form-create.com/v2/guide/) ：用于生成 Vue 表单。
- [element-ui](https://element.eleme.cn/) ：一个 UI 组件库，基于 Vue 2 ，提供了图标、按钮、表单、标签页等丰富的 UI 组件，由饿了么公司开源。
- [element-plus](element-plus) ：基于 Vue 3 ，基于 TypeScript 开发。

