# HTML

超文本标记语言（Hyper Text Markup Language），用于描述Web网页的内容。

- 使用HTML编写的文件是文本文件，后缀名为 .html 或 .htm 。
- Web浏览器读取了HTML文件之后就能显示出对应的网页，显示效果比纯文本丰富很多。
- [HTML参考手册](https://www.w3school.com.cn/tags/index.asp)

## 版本

- 1990年，欧洲粒子物理研究所的Tim Berners Lee在发明的Web技术的过程中创造了 HTML 语言。
- 1993年，HTML1 标准发布。
- 经历了 HTML2 和 HTML3 之后，W3C在1997年发布了 HTML4 标准，此后稳定使用多年。
- 1998年，W3C停止更新 HTML4 ，开始研究将 HTML4 改为严格的XML格式，称为 XHTML 。
- 2014年，W3C正式发布 HTML5 标准。

## 基本结构

一个HTML文件中，HTML的全部内容都包含在标签`<html>`中，其下又分为`<head>`、`<body>`两部分。
- 多余的空格和换行符会被忽略，只当作一个空格。
- 用`<!--`和`-->`声明多行注释。
- 例：
    ```html
    <!DOCTYPE html>      # 声明为HTML5
    <html>               # 标记HTML文件开始

    <head>               # 标记头部开始
        <title>测试</title>   # 网页标题
    </head>              # 标记头部结束

    <body>               # 标记主体开始
        <h1>标题一</h1>  # 标题
        <p>段落一</p>    # 段落
        <br>           # 换行符
        <!-- 注释 -->    # 注释
    </body>              # 标记主体结束

    </html>              # 标记HTML文件结束
    ```

## 元素

HTML中的一个元素由一对标签和夹在中间的内容组成。
- 标签名用尖括号` < > `标记，通常一前一后成对出现，分别称为开始标签（opening tag）、结束标签（closing tag）。例如：`<p>段落一</p>`
- 如果元素的内容为空，则可以省略结束标签，在开始标签的末尾加上斜杆 / 表示结束。例如：`<br>`
- 标签名不区分大小写，但一般小写。

### 标题

用`<h1>`~`<h6>`六种标签声明，h1是最大标题，h6是最小标题。

```html
<h1>标题一</h1>
<h6>标题一</h6>
```

### 段落

用标签`<p>`声明。

```html
<p>段落一</p>
<p>段落二</p>
```

### 文本样式

HTML4采用以下方式控制文本的显示样式：
- 标签：
  - `font`：给文本设置字体。
  - `<b>`、`<strong>`：粗体（bold）
  - `<big>`：较大的字号
  - `<small>`：较小的字号
  - `<i>`：斜体（italic）
  - `<sub>`：下标（subscript）
  - `<sup>`：上标（superscript）
  - `strike`、`s`、`<del>`：删除线文本
  - `<u>`：下划线文本
- 属性：
  - align：对齐方式。例如：``
  - color：字体颜色
  - bgcolor：背景色
- 例：

    ```html
    <div align="center">
        <font size="3" color="red">Text</font>
    </div>
    ```

HTML5提倡将它们都改用 css 设置显示样式。

其它标签。
- 标签`<span>`：对文本中的某部分单独设置样式。

    ```html
    <p>显示 <span class="redText">红色</span> 的例子</p>
    ```
- 标签`<pre>`：显示预格式化的文本。保留空格、换行符，使用等宽字体。

    ```html
    <pre>
    int main(void){
        return 0;
    }
    </pre>
    ```

### 超链接

用标签`<a>`声明。

```html
<a href="https://www.baidu.com">超链接</a>
<a href="https://www.baidu.com" target="_blank">超链接</a>
<a href="#tips">查看提示</a>
```

- 属性`href`用于显示一个超链接，实现超文本引用（hypertext reference）。
  - href的值是目标资源的位置，可以是本网站的URL，也可以是其它网站的URL。
  - href="#" 指向当前网页的顶部，href="#tips" 指向当前网页中一个名为“tips”的锚点。如果没有找到该锚点，则指向 href="#" 。
- 属性`target`用于控制载入href所指资源的方式
  - target="_self"：默认值，将目标资源载入到当前窗口或当前框架中。
  - target="_parent"：清空当前框架，将目标资源载入到父级框架中。
  - target="_top"：清空当前窗口的内容，然后载入目标资源。常用于跳出框架。
  - target="_blank"：跳转到一个新窗口，然后载入目标资源。

### 图片

用标签`<img>`声明。

```html
<img src="https://www.baidu.com/img/bd_logo1.png" />
<img src="/img/bd_logo1.png" alt="logo image" width="250" height="40" />
```

- 属性 src 用于指定图片的URL。
- 属性 alt 用于设置图片的替代文本，当浏览器不能显示该图片时就显示 alt 的值。
- 属性 width 、height 用于设置图片的显示尺寸。
- 例：定义图片链接：
    ```html
    <a href="https://www.baidu.com/">
        <img border="0" src="/img/bd_logo1.png" />
    </a>
    ```

### 无序列表

unordered list，用标签`<ul>`和`<li>`声明。

```html
<ul>             # 无序列表开始
    <li>one</li> # 列表中的一项
    <li>two</li>
</ul>            # 无序列表结束
```

### 有序列表

ordered list，用标签`<ol>`和`<li>`声明。

```html
<ol>             # 有序列表开始
    <li>one</li> # 列表中的一项
    <li>two</li>
</ol>            # 有序列表结束
```

### 自定义列表

用标签`<dl>`、`<dt>`和`<dd>`声明。

```html
<dl>
    <dt>one</dt>
        <dd>- smaller</dd>
    <dt>two</dt>
        <dd>- smaller</dd>
</dl>
```

### 水平线

用标签`<hr />`声明。

```html
<hr />
```

### 表格

用标签`<table>`声明。

```html
<table border="1">    # 定义表格，边框宽度为1
    <tr>              # 定义第一行
        <td>a1</td>   # 定义该行的第一格
        <td>b1</td>   # 定义该行的第二格
    </tr>
</table>
```

### 表单

用标签`<form>`声明，用于接收用户在网页上的输入。

```html
<form name="input" action="/login" method="POST">
    username: <input type="text" name="username"><br>
    password: <input type="password" name="password"><br>
    <input type="submit" value="提交">
</form>
```

`<input>`表示输入控件，常用的类型如下：
- type="text"：输入纯文本。
- type="password"：输入密文。
- type="submit"：提交按钮。
  - 当用户点击提交按钮时，浏览器会将表单数据放在HTTP请求报文中，发送到action指向的URL。
    <br>如果没有设置属性action，则默认指向当前网页。
  - 默认method="GET"，浏览器会将表单数据放在请求的URL中发送。例如：http://127.0.0.1/login?username=Leo&password=123456
    <br>如果设置method="POST"，则浏览器会将表单数据放在报文body中发送.例如：username=Leo&password=123456

- type="button"：普通按钮。点击后会执行属性onclick指定的动作。

    ```html
    <input type="button" onclick="alert('Hello World!')" value="Button 1">
    ```

- type="radio"：单选按钮

    ```html
    <form>
        <input type="radio" name="sex" value="male">Male<br>  # 
        <input type="radio" name="sex" value="female">Female    # 
    </form>
    ```
  name属性表示该选项显示的名字。

  value属性表示该选项在POST body中的值。

- type="checkbox"：复选按钮

    ```html
    <form>
        <input type="checkbox" name="sex" value="male">Male<br>
        <input type="checkbox" name="sex" value="female">Female
    </form>
    ```

- 下拉框

    ```html
    <form>
        <select name="sex">
            <option value="male">Male</option>
            <option value="female">Female</option>
        </select>
    </form>
    ```

- type="number"：只允许输入数字。
- type="color"：输入颜色。点击该按钮会打开一个颜色选择对话框。
- type="file"：上传文件。点击该按钮会打开一个文件选择对话框。

输入控件的常用属性：
- autocomplete="on"：根据用户之前的输入值自动完成输入。
- pattern="[A-Za-z]{3}"：按正则表达式检查输入是否有效。
  <br>当输入不合法时，用户按下键盘也不会有响应。不过浏览器并不会报错，需要用JS显示报错。
- maxlength="10"：输入的最大长度。
- value="123456"：该输入控件的初始值，或者显示的名字。

以下属性不需要赋值，只要写上属性名即可启用：
- autofocus：打开网页时，使该输入控件自动获得焦点。
- disabled：禁用。不可使用、不可点击。
- readonly：只读。
- required：提交表单时的必填字段。

### 元数据

用标签`<meta>`声明。用于设置网页的属性，通常放在HTML的头部。

例：
```html
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />  # 该网页内容的类型
<meta name="keywords" content="HTML, CSS, XML, XHTML, JavaScript">     # 该网页的关键字
<meta http-equiv="refresh" content="30">    # 每隔30秒刷新该网页
```

### 区块

用标签`<div>`声明。用于将一些元素打包成一个区块，便于布局。

```html
<div style="color:blue">
    <p>段落一</p>  
</div>
```

- div、h1、p 等标签定义的元素属于块级元素，在显示时会独占一行。

### iframe

标签`<iframe>`用于在一个方框内显示一个网页。

```html
<iframe src="https://www.baidu.com/index.html"></iframe>
```

### 插入对象

用标签`<object>`或`<embed>`声明，用于插入一个对象（又称为插件），比如图片、视频、音频、flash动画等。

```html
<object data="horse.mp3"></object>
<object width="400" height="50" data="bookmark.swf"></object>
```

插入对象时，只需指明对象的URL，浏览器会负责用合适的方式显示它。

## 属性

可以在元素的开始标签中设置其属性。
- 每个属性用一个键值对表示，键值对用等号 = 赋值，用空格分隔。
- HTML5中，属性的值可以用双引号或单引号包住，也可以不用引号包住（此时不能包含空格）。
  <br>如果值本身包含了双引号或单引号，则应该用另一种引号包住。

    ```html
    <p id="P 1">段落一</p>
    <p id='P 1'>段落一</p>
    <p id='Hello "World"!'>段落一</p>
    <p id=P>段落一</p>
    ```

不同类型的元素拥有的属性不一样，但所有元素都拥有以下属性：
- `id`：元素在网页中的id，只能取唯一值。可用作元素的唯一标识符、网页中的定位锚点。
  <br>id的值区分大小写。
  <br>HTML4中，一些元素也可以用name定义锚点。
- `style`：元素的显示样式。
- `class`：使用一个css类。
  <br>类名区分大小写。
- `title`：元素的提示信息，当鼠标移到该元素上方时就会显示。
- `hidden`：使该元素不被显示。
- `contenteditable="true"`：使该元素在显示时可被编辑。
- `draggable="true"`：使该元素可被拖动。

例：

```html
<form action="/option/addnote.php" method="post" id="commentform" style="display:none;">
<div class="comt-tips">
<p title="for test">段落</p>
```

## Web浏览器

不同Web浏览器支持的HTML语法有所差异，因此需要考虑HTML文件的兼容性问题。

Web浏览器按从上到下的顺序逐行解析HTML文件，一边解析一边显示给用户看。
- 解析到href时，会在后台下载超链接的资源，不影响前台进程。
- 解析到src时，会等该资源加载完毕再继续解析。
- 解析到JavaScript时，会加载并执行该脚本，然后再继续解析。
  - 因此应该将script标签放在body的最后部分，避免阻塞前台进程。
  - 或者使用async属性，等加载了该脚本之后再执行。
  - 或者使用defer属性，等加载了该脚本、解析了整个HTML之后再执行。

## 表单设计器

<http://formbuild.leipi.org/>
