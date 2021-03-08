# Java

：一种编译型语言。
- 通过 JVM 容易实现跨平台运行，因此常用于开发 Web 应用、Android 应用。

## 相关历史

- 1991 年，Sun 公司的 James Gosling 等人开始研发一种适用于单片机系统的编程语言。
  - 他们将 C++ 语言进行简化，抛弃了多继承、指针等复杂功能，并提高程序的兼容性。
  - 他们将这种语言取名为 Oak ，介绍给硬件厂商，但并没有受到欢迎。
- 1995 年，Sun 公司发现 Oak 语言在互联网上的应用优势——它容易移植到不同平台上运行。于是将它改名为 Java 重新发布，终于成功推广。
- 2010 年，Sun 公司被 Oracle（甲骨文）公司收购。
- 从 2019 年 1 月开始，使用 Java 8 及以上版本的 Oracle JDK 需要付费。因此推荐使用 OpenJDK 。

## 语法特点

- Java 源文件的扩展名为 .java 。需要先编译成扩展名为 .class 的类文件，再交给 JVM 解释执行。
- 每个语句的末尾以分号 ; 作为分隔符。
- 用 `//` 声明单行注释，用 `/*`、`*/` 声明多行注释。
- 支持面向对象编程，但不支持定义函数。
- Java 的语法与 C++ 相似，但是做出了许多优化，比如：
  - 丢弃了 C++ 中一些难用的功能，比如操作符重载、多继承。
  - 用引用取代了指针，并自动回收垃圾内存。

## 相关概念

- JSP（Java Server Pages）
  - ：一种动态网页开发技术，可以在 HTML 文件中通过特定的标签嵌入 Java 代码。
  - 例：
    ```html
    <p>
    今天的日期是: <%= (new java.util.Date()).toLocaleString()%>
    </p>
    ```
- JMX（Java Management Extensions）
  - ：一组用于监控、管理 Java 应用的 API ，属于 Java 标准库。
  - JMX 将被管理的对象称为 MBean（Managed Bean）。
  - 在 Java 应用中调用 JMX 库，实现其接口，便可以从外部通过 HTTP 通信等方式监控、管理该 Java 应用。
  - 比如通过 JMX 接口可以获取 JVM 的运行状态。
- JDBC（Java Database Connectivity）
  - ：Java 程序访问数据库的 API 规范，主要用于关系型数据库。
- Spring
  - ：一个流行的 Java 应用开发框架。
  - 内嵌了一个 Tomcat ，因此可以开发 Web 应用，作为 Web 服务器运行。
