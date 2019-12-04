# DOM

：XML文档对象模型（XML Document Object Model），是一个访问XML格式文本的API标准。
- 通常研究的是XML DOM，有时也研究HTML DOM。
- DOM将XML文档表示成一个树形结构，XML中的每个元素都表示成一个单一的节点（元素的值也表示成子节点）。
  <br>例如，下方表示节点book拥有一个属性节点category、一个元素节点year，节点year拥有一个值为"2000"的文本节点。
    ```xml
    <book category="web">
        <year>2000</year> 
    </book>
    ```

## 生成DOM

Web浏览器一般会提供XML解析器，用于将XML文档解析成可被JavaScript访问的XML DOM对象。
- IE浏览器的DOM API与其它浏览器不一样。
- IE浏览器不会把空格或换行符当作文本节点的值，而其它浏览器会。
- 例：从XML文件中载入DOM对象

    ```js
    function loadXMLDoc(filename) {
        try // Internet Explorer
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        }
        catch (e) {
            try // Other browsers
            {
                xmlDoc = document.implementation.createDocument("", "", null);  // 创建一个空的DOM
            }
            catch (e) { alert(e.message) }
        }
        try {
            xmlDoc.async = "false";  // 关闭异步加载，在加载完该XML之前暂停执行JS代码
            xmlDoc.load(filename);  // 从XML文件中载入DOM
            return (xmlDoc);
        } catch (e) {
            alert(e.message)
        }
        return (null);
    }
    ```

- 例：将XML字符串转换成DOM对象

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
                parser = new DOMParser();  // 创建一个空的DOM
                xmlDoc = parser.parseFromString(text, "text/xml");  // 将text转换成DOM
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

## DOM节点的操作

DOM节点的方法：
- .getElementsByTagName(name)：获取指定名字的所有元素
- .appendChild(node)：插入子节点
- .removeChild(node)：删除子节点

DOM节点的属性：
- .nodeName：节点名称
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
  - 1表示元素节点，2表示属性节点，3表示文本节点，8表示注释节点，9表示文档节点
- .parentNode：父节点
- .childNodes：子节点的列表
- .attributes：属性节点的列表

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
