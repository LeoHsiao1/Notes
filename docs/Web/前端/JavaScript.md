# JavaScript

：一种脚本语言，嵌入 HTML 中之后可以执行一些动作。
- HTML、CSS 都是标记语言，而 JS 是编程语言，可以编写一些程序逻辑，被 Web 浏览器执行。

## 使用方式

- 在标签 `<script>` 之内编写 JS 代码。
    ```html
    <script type="text/javascript">
        document.write("<p>Hello World!</p>");
        alert("test...");
    </script>
    ```

- 导入外部的 .js 文件。
    ```html
    <script type="text/javascript" src="//static.mysite.com/main.js"></script>
    ```
    - 现代的大部分浏览器都默认将 `<script>` 看作 "text/javascript" 类型，因此可以不声明该属性。

## gulp

：一个自动化构建工具，基于 node.js ，常用于构建 JavaScript 项目。
- 安装：
    ```sh
    npm install gulp
    ```
- 命令：
    ```sh
    gulp [task]...    # 执行任务（默认执行 default 任务）
    ```
