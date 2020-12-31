# JavaScript

：一种脚本语言，简称为 JS ，主要用于前端开发。
- JS 代码可以通过标签 `<script>` 嵌入 HTML 文件。
- HTML、CSS 都是文本标记语言，而 JS 是编程语言，可以编写一些程序逻辑，被 Web 浏览器执行。

## 语法特点

- 脚本文件的后缀名为 .js 。
- 每个语句的末尾以换行符或分号 `;` 作为分隔符。
- 用 `//` 声明单行注释，用 `/*` 和 `*/` 声明多行注释。
- 支持定义函数，不支持定义类，但可以通过封装函数实现面向对象编程。

## 基础示例

- 可以在标签 `<script>` 之间编写 JS 代码：
  ```html
  <script type="text/javascript">
      window.alert("Hello");
  </script>
  ```

- 可以导入外部的 .js 文件：
  ```html
  <script type="text/javascript" src="//static.mysite.com/main.js"></script>
  ```
  - 大部分浏览器都默认将 `<script>` 看作 "text/javascript" 类型，因此可以不声明该属性。

- 常用的几种输出函数：
  ```js
  document.write("<p>Hello</p>")  // 输出到 HTML 中
  console.log("Hello")            // 输出到浏览器的控制台
  window.alert("Hello")           // 让浏览器弹出一个警告框，显示输出
  ```

- JS 可以修改 HTML 元素：
  ```html
  <p id="test"> default </p>

  <script>
      document.getElementById("test").innerHTML = "Hello";  // 选取 id 为 test 的元素，给元素内容赋值
      document.getElementById("test").style.color = "red";  // 修改元素的属性
  </script>
  ```

## 变量

- 用关键字 var 定义变量。
- 数据类型：
  ```js
  var x  = 3.14                    // 数值类型
  var x  = true;                   // 布尔类型
  var x  = "Hello"                 // 字符串类型
  var x  = [0, 1, "Hello"]         // 数组类型
  var x  = {name: "Dog", age: 12}  // 对象（object）类型，用于存储键值对
  ```
  - 变量本身没有数据类型，同一个变量可以接受不同数据类型的赋值。
  - 字符串可以用单引号或双引号作为定界符。

## 函数

- 定义函数：
  ```js
  function sum(x, y) {
      return x * y; 
  }

  var x = sum(1, 2);
  ```

## gulp

：一个自动化构建工具，基于 node.js ，常用于构建 JavaScript 项目。
- 安装：
  ```sh
  npm install gulp
  ```
- 命令：
  ```sh
  gulp [task]...    # 执行任务，默认执行名为 default 的任务
  ```
