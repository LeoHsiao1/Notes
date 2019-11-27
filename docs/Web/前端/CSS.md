# CSS

层叠样式表（Cascading Style Sheets），嵌入HTML中，用于控制HTML的显示样式。

## 使用CSS的方式

- 内联样式（inline style）：用元素的 style 属性设置样式，只作用于该元素。

    ```html
    <body style="background-color:red">
        <p style="font-family:arial;font-size:20px;text-align:center;">段落一</p>
    </body>
    ```

- 内部样式：在标签`<script>`之内编写css代码，作用于整个HTML。

    ```html
    <style type="text/css">
        body {
            background-color: red
        }

        p {
            margin-left: 20px
        }
    </style>
    ```

- 外部样式：用标签`<link>`导入外部的css文件，作用于整个HTML。

    ```html
    <link rel="stylesheet" type="text/css" href="mystyle.css">
    ```




font-family是指字体类型