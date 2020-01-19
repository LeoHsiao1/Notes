# Tomcat

：一个 Web 服务器软件，由 Apache 基金会推出。支持 Servlet、JSP ，常用于运行中小型 Java Web 项目。
- Java web 项目通常打包成后缀名为 .war 的文件，放到 Tomcat 的 webapps 目录下即可被解压运行。

## 启动

- 用 yum 安装：
    ```sh
    yum install java-1.8.0-openjdk-devel    # 安装 JDK
    yum install tomcat
    ```
- 启动：
    ```sh
    systemctl start tomcat
    ```

- 不安装，而是运行 docker 镜像：
    ```sh
    docker pull tomcat:8.5
    docker run -d --name=tomcat -p 8080:8080 tomcat:8.5

    docker cp 1.war tomcat:/usr/local/tomcat/webapps      # 拷贝 war 包
    docker exec tomcat /usr/local/tomcat/bin/startup.sh   # 启动
    docker exec tomcat /usr/local/tomcat/bin/shutdown.sh  # 停止
    ```

## 用法

启动 Tomcat 之后，访问该主机的 8080 端口时，会进入 Tomcat 的 Web 管理页面。基本配置如下：

- 执行`vim tomcat/webapps/manager/META-INF/context.xml`，将其中的`allow="127`改为`allow="\d+`，从而允许从其它 IP 地址登录 Web 管理页面。
  ```xml
  <Valve className="org.apache.catalina.valves.RemoteAddrValve"
      allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
  ```
  - Tomcat 会监控 context.xml 的状态，发现它被修改了就会自动加载。

- 执行`vim tomcat/conf/tomcat-users.xml`，写入以下语句，添加一个管理员账号：
  ```xml
  <role rolename="manager-gui"/>
  <role rolename="manager-script"/>
  <role rolename="manager-jmx"/>
  <role rolename="manager-status"/>
  <user username="admin" password="admin" roles="manager-gui,manager-script,manager-jmx,manager-status"/>
  ```

- 运行 jar 包程序：
  ```sh
  java -jar xxx.jar                     # 在前台运行（这会阻塞终端）
  nohup java -jar xxx.jar & > output.log   # 在后台运行
  ```
