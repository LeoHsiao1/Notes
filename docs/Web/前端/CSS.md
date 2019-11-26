# CSS

层叠样式表（Cascading Style Sheets），嵌入HTML中，用于控制HTML的显示样式。

## 嵌入CSS的方法

- 在元素的开始标签里设置其style属性。

    ```html
    <body style="background-color:yellow;">
    <h1 style="font-family:verdana;">标题一</h1>
    ```

- 在style标签之内编写css。

    ```html
    <style>
    .sidebar-tree .double-li {
        width:300px;
    }
    </style>
    ```

- 用 `<link>` 标签导入外部的css文件。（这样可以多个HTML共用一个css文件）

    ```html
    <link rel="stylesheet" type="text/css" href="mystyle.css">
    ```



font-family是指字体类型