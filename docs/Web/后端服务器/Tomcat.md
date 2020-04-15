# Tomcat

：一个 Web 服务器软件，由 Apache 基金会推出。支持 Servlet、JSP ，常用于运行中小型 Java Web 项目。
- [官方文档](http://tomcat.apache.org/tomcat-9.0-doc/index.html)

## 安装

- 下载源代码包并启动：
    ```sh
    yum install java-1.8.0-openjdk-devel  # 安装 jdk
    curl -O https://mirrors.tuna.tsinghua.edu.cn/apache/tomcat/tomcat-9/v9.0.33/bin/apache-tomcat-9.0.33.tar.gz
    tar -zxvf apache-tomcat-9.0.33.tar.gz
    cd apache-tomcat-9.0.33/bin/
    ./startup.sh
    ```

- 或者运行 Docker 镜像：
    ```sh
    docker run -d --name=tomcat -p 8080:8080 tomcat:9.0

    docker cp 1.war tomcat:/usr/local/tomcat/webapps      # 拷贝 war 包
    docker exec tomcat /usr/local/tomcat/bin/startup.sh   # 启动
    docker exec tomcat /usr/local/tomcat/bin/shutdown.sh  # 停止
    ```

## 启动与停止

- tomcat/bin/ 目录下有一些管理 Tomcat 的脚本：
  - startup.sh  ：用于启动 Tomcat ，实际上是调用`catalina.sh start`。
    - 默认以 daemon 方式运行，使用`catalina.sh run`则会在前台运行。
  - shutdown.sh ：用于停止 Tomcat ，实际上是调用`catalina.sh stop`。
  - version.sh  ：用于显示版本信息。

- 每次更新 Tomcat 应用或配置时，建议重启 Tomcat ，使修改立即生效。可以自定义一个重启脚本 restart.sh ：
    ```sh
    tomcat/bin/shutdown.sh
    sleep 5
    pid=`ps -ef | grep Dcatalina.home=/opt/tomcat-7.0.100-jdk1.8 | grep -v grep | awk '{print $2}'`
    kill -9 $pid
    echo 已停止 Tomcat
    rm -rf tomcat/work/Catalina/    # 删除 JSP 页面编译后的缓存
    tomcat/bin/startup.sh
    ```

## 初始页面

启动 Tomcat 之后，访问 `http://localhost:8080/` 即可进入 Tomcat 的初始页面，这里有 Server Status、Manager App、Host Manager 三个内置应用。相关配置如下：

- 编辑`tomcat/webapps/manager/META-INF/context.xml`，将其中的`allow="127`改为`allow="\d+`，从而允许从其它 IP 地址登录初始页面。
  ```xml
  <Valve className="org.apache.catalina.valves.RemoteAddrValve"
      allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
  ```
  - Tomcat 会监控 context.xml 的状态，发现它被修改了就会自动载入。

- 编辑`tomcat/conf/tomcat-users.xml`，在末尾的`</tomcat-users>`之前添加以下内容，从而创建一个管理员账号：
  ```xml
  <role rolename="manager-gui"/>
  <role rolename="manager-script"/>
  <role rolename="manager-jmx"/>
  <role rolename="manager-status"/>
  <user username="admin" password="123456" roles="manager-gui,manager-script,manager-jmx,manager-status"/>
  ```

## 部署 Web 应用

在 Tomcat 中部署 Java Web 应用的方案有多种：

- 方案一：将 war 包放到 `tomcat/webapps/` 目录下。Tomcat 会自动解压该 war 包并载入。

- 方案二：编辑 `tomcat/conf/server.xml` ，在 Host 配置中添加一条 Context ，如下：
  ```xml
  <Host name="www.test.com">
      <Valve ... />
      <Context path="/upload" docBase="/opt/upload" />
      <Context path="/app1" docBase="tomcat/webapps/app1" reloadable="false" debug="0" privileged="true"/>
  </Host>
  ```
  - docBase ：该 app 的所在目录。
  - path ：该 app 的起始 URL 。
  - reloadable ：让 Tomcat 监视该 app 的 `WEB-INF/lib/` 、`WEB-INF/classes/` 目录，如果内容发生变化就自动载入。在开发时应该设置为 true ，支持热部署，方便调试；在发布时应该设置为 false ，减少开销。
  - debug ：调试级别。取值范围为 0 ~ 9 ，0 级的调试信息最少。
  - privileged ：给予该 app 特权，允许访问 Tomcat 的内置应用。默认为 False 。

- 方案三：创建 `tomcat/Catalina/localhost/app1.xml` ，添加一条 Context ：
  ```xml
  <Context path="/app1" docBase="tomcat/webapps/app1" reloadable="false" debug="0" privileged="true"/>
  ```
  - 采用这种方案，容易加入、删除 XML 文件。

- 方案四：用管理员账户登录 Tomcat 的初始页面，上传 war 包并点击“部署”，还可以点击“取消部署”。

## server.xml

`tomcat/conf/server.xml` 是 Tomcat 的主要配置文件，内容示例如下：
```xml
<Server port="8005" shutdown="SHUTDOWN">
  <Listener ... />
  <GlobalNamingResources> ... </GlobalNamingResources>
  <Service name="Catalina" defaultHost="localhost">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
    <Engine name="Catalina" defaultHost="localhost">
      <Realm> ... </Realm>
      <Host name="localhost"  appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
        <Context path="/upload" docBase="/opt/upload" />
      </Host>
    </Engine>
  </Service>
</Server>
```
- `<Server>` 是根元素，代表 Tomcat 所在的主机。
  - 上例中，执行`telnet 127.0.0.1:8005`，然后输入 SHUTDOWN ，即可停止 Server 。shutdown.sh 就是通过该端口停止 Server 的。

- `<Service>` 代表一个接受 HTTP 请求的服务器（逻辑上的）。
  - 配置文件中只能定义一个`<Server>`，而`<Server>`中可以定义多个`<Service>`。
  - 每个`<Service>`中可以定义一个`<Engine>`和多个`<Connector>`。
  - 每个`<Connector>`监听一个端口，它们收到的 HTTP 请求都会交给`<Engine>`处理。
  - 每个`<Service>.<Engine>`中可以定义多个`<Host>`。`<Service>`收到的 HTTP 请求最终会交给与 name 匹配的`<Host>`处理，如果没有匹配的，则交给 defaultHost 处理。

- `<Host>`代表一个匹配 HTTP 请求的主机（逻辑上的）。
  - 设置了`unpackWARs="true" autoDeploy="true"`之后，Tomcat 就能自动解压 webapps/ 目录下的 war 包并载入。
  - `<Value>`代表一个处理 HTTP 请求的组件。上例中定义了一个记录日志的组件。
  - `<Context>`代表一个 URL 。

## 日志

Tomcat 的日志文件保存在 `tomcat/logs/` 目录下，常用的有以下几种：
- catalina.out ：记录了 Tomcat 的 stdout、stderr 。
- localhost_access_log.YYYY-MM-DD.txt ：记录了用户访问 Tomcat 的日志。
