# Java

：一种编译型语言。
- 通过 JVM 容易实现跨平台运行，因此常用于开发 Web 应用、Android 应用。

## 相关历史

- 1991 年，Sun 公司的 James Gosling 等人开始研发一种适用于单片机系统的编程语言。
  - 他们将 C++ 语言进行简化，抛弃了多继承、指针等复杂功能，并提高程序的兼容性。
  - 他们将这种语言取名为 Oak ，介绍给硬件厂商，但并没有受到欢迎。
- 1995 年，Sun 公司发现 Oak 语言在互联网上的应用优势：它容易移植到不同平台上运行。于是将它改名为 Java 重新发布，终于成功推广。
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

- JMX（Java Management Extensions）
  - ：一组用于监控、管理 Java 应用的 API ，属于 Java 标准库。
    - 将被管理的对象称为 MBean（Managed Bean）。
    - 基于 RMI（Remote Method Invocation ，远程方法调用）协议进行通信。
  - 在 Java 应用中调用 JMX 库，实现其接口，便可以从外部通过 HTTP 通信等方式监控、管理该 Java 应用。
- JAAS（Java Authentication and Authorization Service ，Java 认证和授权服务）
  - ：一个进行身份认证的 Java 框架，内置在 JRE 中。
- JDBC（Java Database Connectivity）
  - ：Java 程序访问数据库的 API 规范，主要用于关系型数据库。
  - JDBC 通过特定格式的 URL 连接到数据库，配置示例：
    ```yml
    datasource:
      driverClassName: com.mysql.jdbc.Driver
      url: jdbc:mysql://10.0.0.1:3306/test?characterEncoding=utf8&connectionCollation=utf8mb4_general_ci&autoReconnect=true&useSSL=false
      username: root
      password: ******
    ```
- Mybatis
  - ：一个 Java 的持久化框架。
  - 用户不需要直接编写 JDBC 代码，而是先在 XML 文件中编写 SQL 语句，然后通过 Java 方法调用。但可读性差。
  - Java 持久化框架还有 Hibernate、JPA 等。
  - 开发 Java Web 项目的常用框架：
    - SSH（Spring + Struts + Hibernate）
    - SSM（Spring + SpringMVC + MyBatis）
- Java 的日志框架
  - java.util.logging ：Java 的标准库，是 JDK 内置的日志框架。
  - Log4j ：一个 Apache 开源项目，已停止开发。使用一个配置文件 log4j.properties ，支持自动轮换日志文件。
  - LogBack ：重新实现了 Log4j ，大幅优化。
  - Log4j2 ：对 Log4j 进行了重构优化。
- Scala
  - ：一种基于 Java 的编译型语言，于 2004 年发布。
  - 将源代码编译成 Java 字节码，然后由 JVM 运行。
  - 支持面向对象编程、函数式编程，属于静态类型语言。

### GC

：垃圾回收（Garbage Collection），指销毁 Java 进程中不需要保留的对象，回收其内存。

- Java 进程占用的内存分为几部分：
  - Heap ：堆内存。主要存放 Java 类的实例对象。
  - Direct Memory ：直接内存，存放与操作系统交互的数据，比如文件。
  - Metaspace ：存放 Java 类的元数据，包括常量、注解等。替代了 Java 8 以前的永久代（Permanent）。
  - JVM native ：运行 JVM 本身占用的内存。
  - Code Cache ：存放根据 Java 字节码生成的机器代码。
  - Thread Stack ：线程堆栈。

- Java 进程运行时，会从操作系统申请一些内存空间，划分为 Heap、Metaspace 等区域，统称为 committed_memory 。
  - 申请的内存空间不一定实际使用、存放了数据。JVM 内部实际使用的内存称为 used_memory ，它小于等于 committed_memory 。
  - 在 JVM 外部、操作系统的视角， committed_memory 全部属于 Java 进程占用的内存，会计入主机的 used 内存。
  - Java GC 的目的，是在 committed_memory 中减少 used_memory ，从而腾出内存空间来写入新数据。
    - 一般不会减少 committed_memory ，也不会将 committed_memory 中的空闲内存释放给操作系统，而是留给 JVM 自己以后使用。因为释放内存、重新申请内存的开销都较大。

- 对象的引用分为四种，从强到弱如下：
  - 强引用（Strong Reference）
    - ：指向一些必须保留的对象，比如 `Object obj = new Object()` 。
    - 即使内存不足，强引用也不会被 GC 算法回收。
    - 强引用是造成内存泄漏的主要原因。
  - 软引用（Soft Reference）
    - ：指向一些可能有用，但不是必须保留的对象。
    - 当内存不足时，会被 GC 算法回收。
  - 弱引用（Weak Reference）
    - ：指向一些不需要保留的对象。
    - 每次 GC 时，都会被回收。
  - 虚引用（Phantom Reference）
    - ：最弱的引用，相当于没有引用。
    - 不能用于获取对象的实例，主要用于判断对象是否被垃圾回收。

- 发现垃圾对象的常见算法：
  - 引用计数（Reference Counting）
    - 原理：
      - 每个对象内置一个引用计数器，表示有多少个地方引用了它。当引用数减为 0 时，就可以销毁该对象。
      - 创建一个对象并传递给一个变量时，该对象的引用计数为 1 。
      - 销毁一个对象时，将它引用的其它所有对象的引用技术减 1 。
    - 缺点：
      - 修改引用计数的开销较大。
      - 难以发现循环引用的对象。比如对象 A、B 相互引用，则可能一直不会被销毁。
  - 跟踪（Tracing）
    - 又称为可达性分析。
    - 原理：
      1. 选出当前的局部变量、静态变量、线程等对象，作为根集（Root Set）。
      2. 遍历根集中的各个对象，递归寻找它们引用的对象，记录成一条条引用链。
      3. 不在引用链上的对象，就可以销毁。
    - 目前跟踪算法更常用。

- 发现垃圾对象之后，常见的 GC 算法：
  - 标记-删除算法
    - ：先标记垃圾对象，然后删除它们。
    - 缺点：容易在内存中产生大量碎片空间。
  - 标记-整理算法
    - ：在标记-删除算法之后，增加一个整理阶段，减少内存碎片。
    - 缺点：增加了 GC 耗时。
  - 复制算法
    - ：划分两块内存空间。开始一次 GC 时，将前一个空间中的非垃圾对象全部拷贝到后一个空间，然后清空前一个空间。如此循环切换内存空间。
    - 这样能减少内存碎片，但是内存利用率只有 50% 。
  - 分代收集算法
    - ：划分两块内存空间，采用不同的 GC 算法：
      - 年轻代（young generation）：又称为新生代（new generation），用于存放寿命较短的对象，适合复制算法。细分为两种区域：
        - 伊甸园空间（eden space）：用于存放新创建的对象。
        - 幸存者空间（survivor space）：用于存放在 young GC 之后幸存、但尚未存入 old 区域的对象。默认有两个 survivor space ，简称为 S0、S1 。
      - 老生代（old generation）：用于存放寿命较长的对象，适合标记-整理算法。
    - 大部分 Java 对象的寿命都较短，很快就没用了，因此采用分代收集算法的效率较高。
      - 新创建的对象最初存放在 young 区域的 eden space ，其中大部分会在短期内停止引用而被销毁。
      - young GC ：当 eden space 内存不足以存入新对象时，会触发一次 GC ，进行以下操作：
        - 将 eden space 中被标记引用的对象移到 survivor space 。如果 survivor space 内存不足，则直接移到 old 区域。
        - 将 survivor space 中存在时间较长的对象（即活过了多次 young GC）移到 old 区域。
        - 按复制算法，交替使用两个 survivor space ，从而减少内存碎片。比如将 S0 中的全部对象复制到 S1 ，然后清空 S0 。
      - old GC ：当 old 区域的内存不足以存入新对象时，会触发一次 GC ，将存在时间较长的对象删除。
        - 发生 young GC 之前、之后，都可能判断出 old 区域内存不足，从而触发 old GC 。
      - full GC ：对 young、old、Permanent 区域进行 GC ，清理全部堆内存。
        - 不同垃圾收集器触发 full GC 的条件不同。

- STW（Stop The World）
  - ：GC 过程中的一种状态，暂停用户线程，只执行 GC 线程。
  - STW 状态是不可避免的，不同的 GC 算法可能 STW 时长不同，越短越好。
  - full GC 的 STW 时间通常最长，导致用户线程的明显停顿。

- JVM 规范不包含 GC ，但 JVM 通常提供了 GC 功能，常见的几种垃圾收集器：
  - Serial GC
    - ：串行收集。GC 时运行单个 GC 线程，全程为 STW 状态。
  - Parallel GC
    - ：并行收集。GC 时运行多个 GC 线程，全程为 STW 状态。
    - 比 Serial 的速度快几倍。
  - Concurrent Mark-Sweep（CMS） GC
    - ：并发收集。GC 时分为多个阶段，部分阶段允许同时运行 GC 线程、用户线程。
    - young GC、full GC 全程为 STW 状态，而 old GC 只有部分阶段会 STW 。
    - 例如 ElasticSearch 默认采用 CMS GC 算法。
  - G1 GC
    - ：类似 CMS 算法，但能减少内存碎片、控制 STW 时长。
    - 传统 GC 算法的 young、old 区域分别是一块地址连续的内存空间。而 G1 GC 在堆内存中划分大量 region ，分别分配给 eden、survivor、old 区域。
      - 每个 region 是一小块地址连续的内存空间，体积相同。
      - 体积巨大的对象（humongous object）可能占用多个地址连续的 region 。
      - 分代 GC 时只需改变 region 所属的内存区域，属于移动式算法，不需要复制 region 。
    - G1 GC 有几种模式：
      - young GC ：清理年轻代。比如将 eden 区域中幸存的 region 分配给 survivor、old 区域。
      - mixed GC ：清理年轻代，还会清理老生代中垃圾较多（即活动对象较少）的 region ，称为垃圾优先。
      - full GC ：当老年代内存不足时，清理全部堆内存。
    - 例如 Java 8 默认采用 Parallel 算法，Java 9 开始默认采用 G1 算法。

### 关于 Web

- JSP（Java Server Pages）
  - ：一种动态网页开发技术，可以在 HTML 文件中通过特定的标签嵌入 Java 代码。
  - 例：
    ```html
    <p>
    今天的日期是: <%= (new java.util.Date()).toLocaleString()%>
    </p>
    ```

- Servlet
  - ：一个提供 Web 应用服务的 Java 程序，本质上是实现了 javax.servlet.Servlet 接口的 Java 类。
  - 可以运行在支持 Servlet 规范的 Web 服务器中，比如 Tomcat、Jetty 。

- Netty
  - ：一个 Java 的 Socket 通信框架，支持 TCP、UDP 等协议，或自定义协议。
  - 采用非阻塞 IO （NIO），并发能力强。

### spring

- Spring Framework
  - ：一个流行的 Java 应用开发框架，于 2002 年发布。
  - 内嵌了一个 Tomcat ，因此可以开发 Web 应用，作为 Web 服务器运行。
  - Spring 中的应用程序由一个或多个 bean 对象组成，由 IoC 容器管理。
  - 编程时不需要主动 new 对象，而是在代码中声明需要的对象，并在 XML 文件中配置。程序运行时，IoC 容器会去自动根据配置创建对象。
    - 对象的控制权从程序员手中，转交给了程序自身，因此称为控制反转（Inversion of Control ，IoC）。
    - 例：
      ```java
      @Component              // 使用 Component 注解，将该类定义为 Bean 。创建对象时，会根据类名来默认命名（开头小写），比如 phone
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

- [Spring Boot](https://spring.io/projects/spring-boot)
  - ：一个基于 Spring Framework 4.0 的轻量级框架，于 2014 年发布。
  - 增加了一些默认配置，简化了开发流程，可以快速开发单个应用。

- Spring Cloud
  - ：一个基于 Spring Boot 的微服务框架，于 2015 年发布。
  - 包含多个组件：
    - Config ：配置管理中心，基于 git 存储配置信息。例：
      ```java
      @Value("${test.name}")    // 添加注解，将指定的配置参数赋值给该变量
      String name = "Hello";
      ```
    - Bus ：消息总线，用于动态更新配置。
      - 每次修改配置时，会自动发送 HTTP 请求通知使用该配置的所有服务，让它们重新从 Config 读取配置。
    - Eureka ：用于服务发现。
    - Ribbon ：一个 HTTP 客户端，发出请求时会对服务器进行负载均衡。
    - Feign ：一个声明式的 Restful 客户端，简化了访问微服务的过程，并基于 Ribbon 进行负载均衡。例：
      ```java
      @FeignClient("service1")        // 添加注解，声明要调用的目标服务名
      static interface TestService {
          @GetMapping("/name")        // 添加注解，使得调用该方法时，会发送 GET 请求到目标服务的指定 URL
          public String name();
      }
      ```
    - Hystrix ：断路器，自动进行服务熔断。
    - Zuul ：API 网关，用于将服务暴露到集群外，并进行负载均衡、鉴权。
