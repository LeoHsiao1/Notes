# JavaScript

：一种脚本语言，简称为 JS ，主要用于前端开发。
- JS 代码可以通过标签 `<script>` 嵌入 HTML 文件。
- HTML、CSS 都是文本标记语言，而 JS 是编程语言，可以编写一些程序逻辑，被 Web 浏览器执行。

## 语法特点

- 脚本文件的扩展名为 .js 。
- 每个语句的末尾以换行符或分号 `;` 作为分隔符。
- 用 `//` 声明单行注释，用 `/*` 和 `*/` 声明多行注释。
- 支持定义函数，不支持定义类，但可以通过封装函数实现面向对象编程。

## 用法示例

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
  - 例如，下方表示节点 book 拥有一个属性节点 category、一个元素节点 year ，节点 year 拥有一个值为"2000"的文本节点。
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
  - 2020 年底，成为 Appache 顶级项目。并发布 v5.0 版本，将项目代码迁移到 TypeScript 。
  - 支持的图表类型很多，显示样式美观。
  - 支持绘制常规图表的 3D 版。
  - 支持绘制一些特殊图表，比如：K 线图、树形图、仪表盘、地图、3D 地图。

