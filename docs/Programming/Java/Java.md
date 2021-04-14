# Java

：一个编译型语言。
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
  - ：一个动态网页开发技术，可以在 HTML 文件中通过特定的标签嵌入 Java 代码。
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
- Mybatis
  - ：一个 Java 的持久化框架。
  - 用户不需要直接编写 JDBC 代码，而是先在 XML 文件中编写 SQL 语句，然后通过 Java 方法调用。但可读性差。
  - Java 持久化框架还有 Hibernate、JPA 等。
  - 开发 Java Web 项目的常用框架：
    - SSH（Spring + Struts + Hibernate）
    - SSM（Spring + SpringMVC + MyBatis）
- Servlet
  - ：一种提供 Web 应用服务的 Java 程序，本质上是实现了 javax.servlet.Servlet 接口的 Java 类。
  - 可以运行在支持 Servlet 规范的 Web 服务器中，比如 Tomcat、Jetty 。

### Spring

- Spring Framework
  - ：一个流行的 Java 应用开发框架，于 2002 年发布。
  - 内嵌了一个 Tomcat ，因此可以开发 Web 应用，作为 Web 服务器运行。
  - Spring 中的应用程序由一个或多个 bean 对象组成，由 IoC 容器管理。
  - 编程时不需要主动 new 对象，而是在代码中声明需要的对象，并在 XML 文件中配置。程序运行时，IoC 容器会去自动根据配置创建对象。
    - 对象的控制权从程序员手中，转交给了程序自身，因此称为控制反转（Inversion of Control，IoC）。
    - 例：
      ```java
      @Component              // 使用 Component 注解，将该类定义为 Bean ，默认命名为开头小写的类名，即 phone
      public class Phone {
          ...
      }

      @Component
      public class Person {
          @Autowired          // 使用 Autowired 注解，创建对应类型的 Bean 对象并注入该属性
          Phone phone;

          ...
      }
      ```

- Spring Boot
  - ：对 Spring 框架进行了一些开箱即用的配置，简化了开发的过程。
  - 可以基于 Spring Boot 快速开发单个应用，比如单个微服务。

- Spring Cloud
  - ：一个基于 Spring Boot 的开发框架，适合开发分布式应用，比如微服务。
  - 提供了构建分布式系统的一系列工具，比如配置管理、服务发现、服务网关等。
