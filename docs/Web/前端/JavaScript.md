# JavaScript

：一种脚本语言，简称为 JS ，主要用于前端开发。
- JS 代码可以通过标签 `<script>` 嵌入 HTML 文件。
- HTML、CSS 都是文本标记语言，而 JS 是编程语言，可以编写一些程序逻辑，被 Web 浏览器执行。

## 语法特点

- 脚本文件的扩展名为 .js 。
- 每个语句的末尾以换行符或分号 `;` 作为分隔符。
- 用 `//` 声明单行注释，用 `/*` 和 `*/` 声明多行注释。
- 支持定义函数，不支持定义类，但可以通过封装函数实现面向对象编程。

## 版本

- 1995 年，Netscape 公司为浏览器发明了 JavaScript 脚本语言。
  - 之后，由 ECMA International 组织制定 JS 的语言标准，称为 ECMAScript ，简称为 ES 。
- ES1
  - 1997 年发布。
- ES2
  - 1998 年发布。
- ES4
  - 跳过发布。
- ES3
  - 1999 年发布。
  - 支持正则表达式、try-catch 。
- ES5
  - 2009 年发布。
  - 支持 JSON 。
  - 增加 String.strim()、Array.isArray() 方法。
- ES6
  - 2015 年发布。

## 例

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

## DOM

：XML 文档对象模型（XML Document Object Model），是一个访问 XML 格式文本的 API 标准。
- 通常研究的是 XML DOM ，有时也研究 HTML DOM 。
- DOM 将 XML 文档表示成一个树形结构，XML 中的每个元素都表示成一个单一的节点（元素的值也表示成子节点）。
  - 例如，下方表示节点 book 拥有一个属性节点 category、一个元素节点 year ，节点 year 拥有一个值为 "2000" 的文本节点。
    ```xml
    <book category="web">
        <year>2000</year>
    </book>
    ```

### 生成 DOM

- Web 浏览器一般会提供 XML 解析器，用于将 XML 文档解析成可被 JavaScript 访问的 XML DOM 对象。
  - IE 浏览器的 DOM API 与其它浏览器不一样。
  - IE 浏览器不会把空格或换行符当作文本节点的值，而其它浏览器会。
- 例：从 XML 文件中载入 DOM 对象
  ```js
  function loadXMLDoc(filename) {
      try     // Internet Explorer
      {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      }
      catch (e) {
          try // Other browsers
          {
              xmlDoc = document.implementation.createDocument("", "", null);  // 创建一个空的 DOM
          }
          catch (e) { alert(e.message) }
      }
      try {
          xmlDoc.async = "false";  // 关闭异步加载，在加载完该 XML 之前暂停执行 JS 代码
          xmlDoc.load(filename);   // 从 XML 文件中载入 DOM
          return (xmlDoc);
      } catch (e) {
          alert(e.message)
      }
      return (null);
  }
  ```

- 例：将 XML 字符串转换成 DOM 对象
  ```js
  function loadXMLString(filename) {
      try // Internet Explorer
      {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = "false";
          xmlDoc.loadXML(text);
      }
      catch (e) {
          try // Other browsers
          {
              parser = new DOMParser();  // 创建一个空的 DOM
              xmlDoc = parser.parseFromString(text, "text/xml");  // 将 text 转换成 DOM
              return (xmlDoc);
          }
          catch (e) { alert(e.message) }
      }
      return (null);
  }

  text = "<book>";
  text = text + "<year>2000</year>";
  text = text + "</book>";
  xmlDoc = loadXMLString(text);
  ```

### DOM 节点

DOM 节点的方法：
- .getElementsByTagName(name)：获取指定名字的所有元素
- .appendChild(node)：插入子节点
- .removeChild(node)：删除子节点

DOM 节点的属性：
- .nodeName ：节点名称
  - 只读属性
  - 元素节点的 nodeName 与标签名相同
  - 属性节点的 nodeName 是属性的名称
  - 文本节点的 nodeName 是 #text
  - 文档节点的 nodeName 是 #document
- .nodeValue ：节点的值
  - 可读可写的属性
  - 元素节点的 nodeValue 是 undefined
  - 文本节点的 nodeValue 是文本字符串
  - 属性节点的 nodeValue 是属性的值
- .nodeType  ：节点的类型
  - 只读属性
  - 1 表示元素节点，2 表示属性节点，3 表示文本节点，8 表示注释节点，9 表示文档节点
- .parentNode ：父节点
- .childNodes ：子节点的列表
- .attributes ：属性节点的列表

例：
```js
// 索引
txt = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue

// 遍历
x = xmlDoc.childNodes;
for (i = 0; i < x.length; i++) {
    document.write(x[i].nodeName);
    document.write("<br>");
}

// 判断节点类型
if (y.nodeType == 1) {
    document.write(y.nodeName + "<br>");
}
```

## AJAX

：异步 JS 和 XML（Asynchronous JavaScript and XML）
- 传统的网页是静态网页，每次改变网页内容时都要重新生成一个 HTML 文件，让浏览器重新加载网页。
  - 使用 AJAX 技术，可以让浏览器在后台向服务器发出请求，然后改变网页的部分内容，实现动态网页。
  - 使用 AJAX 技术，可以实现异步请求，让 JS 不用等待服务器的响应就继续执行。
- XMLHttpRequest() 是常用的 JS 异步请求 API ，大部分浏览器都支持。如下：
    ```js
    var xhr = new XMLHttpRequest();      // 创建一个 XHR 对象
    xhr.open("GET", "/tmp/1.txt", true); // 创建一个 GET 请求，true 表示异步请求
    xhr.send();                          // 发送请求

    xhr.open("POST", "/reply", true);    // 创建一个 POST 请求
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");  // 设置一个 header
    xhr.send("id=1&name=one");           // 设置 body 并发送请求
    ```

### CORS

：跨域资源共享（Cross-Origin Resource Sharing），是 W3C 标准定义的一种浏览器功能。
- 浏览器在访问一个网站时，如果向其它域名的网站发送 XMLHttpRequest 请求，称为跨域请求，则存在被 CSRF 攻击的风险。
  - 当网址 `protocol://host:port/path` 的前三个字段全部相同时，才不算跨域。
- 浏览器发出的 CORS 请求分为两类：
  - 简单请求
    - ：请求方法为 GET、HEAD 或 POST ，并且请求头只能使用以下 Headers ：
      ```sh
      Accept
      Accept-Language
      Content-Language
      Last-Event-ID
      Content-Type      # 只能取值为 application/x-www-form-urlencoded、multipart/form-data、text/plain
      ```
    - 工作流程：
      1. JS 脚本发送一个 XMLHttpRequest 请求。如果浏览器发现它属于 CORS 请求，就自动在请求报文中添加以下形式的 Header ：
          ```sh
          Origin: http://test.com    # 说明客户端从哪个网站发出 HTTP 请求
          ```
      2. 服务器收到请求报文，根据 Origin 决定是否允许请求。如果允许，则在响应报文中添加以下形式的 Header ：
          ```sh
          Access-Control-Allow-Origin: http://test.com      # 允许哪些 Origin ，可以填通配符 *
          Access-Control-Allow-Credentials: true            # 是否允许发送 cookie ，默认为 false
          ```
          如果浏览器发现响应报文中没有包含 Access-Control-Allow-Origin 字段，则认为 CORS 请求失败，不管响应状态码。
    - 大部分浏览器默认会拒绝执行跨域请求。需要服务器主动给 HTTP 响应报文添加特定的 header ，表示服务器愿意接受该 CORS 请求，浏览器才会发送 CORS 请求。
      - Chrome 浏览器从 v85 版本开始，不允许 CORS 的简单请求，只允许非简单请求。
- 非简单请求
    - 工作流程：
      1. 先发送一个预检请求（preflight request），申请向服务器发送 CORS 请求。例：
          ```sh
          OPTIONS / HTTP/1.1                                # 使用 OPTIONS 请求方法
          Origin: http://test.com
          Access-Control-Request-Method: PUT                # 申请额外使用的 CORS 请求方法
          Access-Control-Request-Headers: Content-Type      # 申请额外使用的 CORS 请求头
          ```
      2. 如果服务器通过预检请求，则返回 HTTP 204 响应报文，并添加以下形式的 Header ：
          ```sh
          Access-Control-Allow-Origin: http://test.com
          Access-Control-Allow-Methods: GET, POST, OPTIONS  # 允许额外使用的 CORS 请求方法
          Access-Control-Allow-Headers: Content-Type        # 允许额外使用的 CORS 请求头
          Access-Control-Max-Age: 86400                     # 该预检结果的有效时长，单位 s 。在此期间，不用再发送预检请求
          ```
      3. 浏览器发现预检通过，于是接着发送 CORS 请求。接下来的流程像 CORS 简单请求。
      4. 服务器收到 CORS 请求，返回响应。

- 例：给 Nginx 服务器添加配置，允许 CORS 请求
  ```sh
  location / {
      # 允许 CORS 简单请求
      add_header Access-Control-Allow-Origin *;
      add_header Access-Control-Allow-Credentials true;

      # 允许 CORS 预检请求
      if ($request_method = 'OPTIONS') {
          return 204;
          add_header Access-Control-Allow-Origin *;
          add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
          add_header Access-Control-Allow-Headers 'Content-Type,User-Agent,X-Requested-With';
          add_header Access-Control-Max-Age 86400;
      }
  }
  ```

- 例：在浏览器执行以下 JS 代码，发出 CORS 请求
  ```js
  fetch('https://test.com/api', {
          method: 'POST',
          mode: 'cors',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              userId: '***'
          }),
      })
      .then((res)=>{console.log(res);})
      .catch(err=>{ console.error(err);})
  ```

## 绘制图表

常见的用于绘制图表的 JS 库如下：

- [Highcharts.js](https://www.highcharts.com.cn/demo/highcharts)
  - 2009 年，由挪威的 Highsoft 公司发布。个人使用免费，商业使用收费。
  - 支持的图表类型很多，但显示样式比较单调。

- [D3.js](https://d3js.org/)（Data-Driven Documents）
  - 2011 年，由斯坦福大学的 Michael Bostock 等人开发。
  - 支持的图表类型很多。
  - 支持自定义图表，比较灵活。但用法像一个框架，比较复杂。

- [Chart.js](https://chartjs.bootcss.com/samples/)
  - 2013 年，由伦敦的 Nick Downie 发布。
  - 支持的图表类型较少，主要是曲线图、柱形图、散点图、饼状图、雷达图等常规图表。
  - 使用示例：
    ```html
    <!-- 导入 Chart.js 库 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js"></script>

    <!-- 创建一个 canvas 元素作为画布 -->
    <canvas id="myChart" width="400" height="400"></canvas>

    <script>
    // 获取 canvas 元素，在其中创建图表
    ctx = document.getElementById("myChart")
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Red", "Blue", "Yellow"],
            datasets: [{
                label: 'Sample',
                data: [12, 19, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                ],
                borderWidth: 1
            }]
        },
    });
    </script>
    ```

- [ECharts.js](https://echarts.apache.org/examples/zh/index.html)（Enterprise Charts）
  - 2013 年，由百度公司开源。
  - 2021 年初，毕业成为 Apache 顶级项目。发布 v5.0 版本，将项目代码迁移到 TypeScript 。
  - 支持的图表类型很多，显示样式美观。
  - 支持绘制常规图表的 3D 版。
  - 支持绘制一些特殊图表，比如：K 线图、树形图、仪表盘、地图、3D 地图。
