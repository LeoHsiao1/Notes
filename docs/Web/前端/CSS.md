# CSS

：层叠样式表（Cascading Style Sheets），嵌入HTML中，用于控制HTML元素的显示样式。
- 主要有三个版本：CSS1、CSS2、CSS3。各自向下兼容，但新的样式不一定被浏览器支持。
- 有的浏览器不支持某些样式，有的浏览器有自己的默认样式，导致不同浏览器的显示效果有差异。

## 使用CSS的方式

- 内联样式（inline style）：用元素的 style 属性设置样式，只作用于该元素。

    ```html
    <body style="background-color:red">
        <p style="font-family:arial;font-size:20px;text-align:center;">段落一</p>
    </body>
    ```

- 内部样式表：在标签`<script>`之内编写css代码，作用于整个HTML。
  - 通常定义在HTML的head部分。
  - 子元素会继承父元素的样式表。

    ```html
    <style type="text/css">
        body {background-color: red}
        p {
            font-family: "Arial";
            font-size: 16em;
        }
    </style>
    ```

- 外部样式表：用标签`<link>`导入外部的 .css 文件，作用于整个HTML。
  - 外部样式表通常保存在 .css 文件中。
  - 使用外部样式表可以被多个HTML文件复用。
    ```html
    <link rel="stylesheet" type="text/css" href="mystyle.css">
    ```

## 使用CSS的顺序

Web浏览器按以下顺序使用CSS，如果上一级的CSS不存在才使用下一级的CSS。
- 元素的内联样式
- 内部样式表
- 外部样式表
- 浏览器的默认样式表

## 语法

    selector { [property: value;]... } 

- 一个样式表中包含一个或多个样式。
- 每个样式由一个选择器和一个或多个属性组成，以分号 ; 结尾。
  - 选择器用于选择一种或多种HTML元素。
  - 每个属性用一个键值对表示，键值对用冒号 : 赋值，用分号 ; 分隔。

## 选择器

选择器的分类：
- 选择一种HTML元素
    ```css
    h1 {color: red;}
    ```
- 选择多种HTML元素
    ```css
    h1,h2,h3{color: red;}
    ```
- id选择器
    ```css
    #date {color:red;}    # 选择属性 id 的值为 date 的元素
    ```
- 属性选择器
    ```css
    [id] {color:red;}               # 选择带有属性 id 的所有元素
    [id="date"] {color:red;}        # 选择属性 id 的值为 "date" 的所有元素
    [id*="d"] {color:red;}          # 选择属性 id 的值包含字符串 "d" 的所有元素
    [id^="d"] {color:red;}          # 选择属性 id 的值以字符串 "d" 开头的所有元素
    [id$="d"] {color:red;}          # 选择属性 id 的值以字符串 "d" 结尾的所有元素
    input[id="date"] {color:red;}   # 选择属性 id 的值为 "date" 的所有 input 元素
    ```
- 兄弟选择器
    ```css
    h1 + p {margin-top:20px;}   # 选择紧跟在 h1 元素之后的 p 元素
    ```
- 后代选择器（后代元素包括子元素、孙元素等）
    ```css
    p strong {color: red;}      # 选择 p 元素的后代元素中的 strong 元素
    ```
- 子元素选择器
    ```css
    p > strong {color: red;}    # 选择 p 元素的子元素中的 strong 元素
    ```
- 类选择器
    ```css
    .class1 {text-align: center;}   # 选择使用 class1 类的所有元素
    p.class1 {text-align: center;}  # 选择使用 class1 类的 p 元素
    ```
- 伪类选择器（Pseudo-classes）
  - link、visited、hover、active四种伪类作用于“链接”类型的元素。
  - focus：选择拥有键盘焦点的元素。
  - first-child：选择元素的第一个实例。
  - lang：选择带有lang属性的元素。
  - 例：
    ```css
    a:link {color: #FF0000}	          # 在 : 后声明伪类
    a.red : visited {color: #FF0000}  # 伪类可以与CSS类组合使用
    p:first-child {font-weight: bold;}
    ```
- 伪元素选择器（Pseudo-elements）
  - first-letter：选择元素的首字母。
  - first-line：选择元素的首行。
  - before：在元素之前加入内容。
  - after：在元素之后加入内容。
  - 例：
    ```css
    p:first-letter{color: #FF0000;}
    h1:before{content: url(logo.gif);}
    ```
