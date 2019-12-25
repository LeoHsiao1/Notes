# Vue.js

：一个开发Web前端的框架。
- 发音与 view 相同。
- 是渐进式框架，自底向上设计，学习曲线平滑，能制作复杂的单页面应用。
- [官方文档](https://cn.vuejs.org/v2/guide/)


## 入门示例

开发简单的网页时，通常导入Vue的独立js文件即可。如下：
```html
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.js"></script>
<script>
  new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue.js!'
    }
  })
</script>

<div id="app">
  <p>{{ message }}</p>    # 此处等待传入变量message
</div>
```
- Vue的独立js文件主要有以下几种：
    ```
    https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.js             # 体积较大，具备报错信息，适用于开发环境
    https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js         # 体积较小，没有报错信息，适用于生产环境
    https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.runtime.min.js # 体积很小，只是运行时版本，不包含Vue代码的编译器
    ```
- 导入Vue的独立js文件之后，便可使用全局变量Vue
- 被Web浏览器渲染时，Vue会将message变量的值填入 HTML DOM 中，渲染出最终的HTML文件，显示给用户看。





- 构建大型项目时，通常用npm安装Vue：`npm install vue`
- Vue提供了一个 cli 工具，用于快速为复杂的单页面应用 (SPA) 搭建脚手架。


<!-- 先粗略地学，不记录详细的笔记 -->




## form-create

一个表单生成器，支持所有Vue组件。
