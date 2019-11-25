# JavaScript

一种网页脚本语言，嵌入HTML中，用于执行一些动作。

## 嵌入JS的方法

- 通常在HTML的head部分或body部分嵌入JS代码。
- 可以在script标签之内编写JS代码。

    ```html
    <script>
    document.write("<p>Hello World!</p>");
    alert("test...");
    </script>
    ```

- 可以导入外部的.js文件，然后便可以调用其中的函数。

    ```html
    <script src="//static.mysite.com/main.js"></script>
    ```
