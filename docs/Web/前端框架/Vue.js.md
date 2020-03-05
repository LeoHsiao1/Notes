# Vue.js

：一个前端开发框架。
- 发音与 view 相同。
- [官方文档](https://vuejs.org/v2/guide/index.html)

用法：
- 开发简单的网页时，通常导入 Vue 的独立 js 文件即可。
- 构建大型项目时，通常用 npm 安装 Vue ：`npm install vue`
- Vue 提供了一个 cli 工具，用于快速为复杂的单页面应用 (SPA) 搭建脚手架。

## 入门示例

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


，，，待续

## form-create

一个表单生成器，支持所有 Vue 组件。
