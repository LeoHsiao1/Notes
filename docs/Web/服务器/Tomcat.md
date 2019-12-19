Tomcat
## Tomcat是一个由Apache基金会开发的服务器软件。支持Servlet、JSP，主要用于中小型Java Web项目。
- 安装：
  - 在Centos上安装：
yum install java-1.8.0-openjdk-devel    # 安装JDK
yum install tomcat
systemctl start tomcat
  - 用docker运行：
docker pull tomcat:8.5
docker run -d --name=tomcat -p 8080:8080 tomcat:8.5

docker cp 1.war tomcat:/usr/local/tomcat/webapps    # 拷贝war包到tomcat的webapps目录下
docker exec tomcat /usr/local/tomcat/bin/startup.sh    # 启动
docker exec tomcat /usr/local/tomcat/bin/shutdown.sh  # 停止
## 安装后，访问该主机的8080端口时，会进入Tomcat的Web管理页面。
- 修改tomcat/webapps/manager/META-INF/context.xml。将其中的allow="127改为allow="\d+，从而允许从其它IP地址登录Web管理页面。
<Valve className="org.apache.catalina.valves.RemoteAddrValve"
    allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
  - Tomcat会监控context.xml的状态，发现它被修改了就自动加载。
- 修改tomcat/conf/tomcat-users.xml。加上以下语句，添加一个管理员账号：
<role rolename="manager-gui"/>
<role rolename="manager-script"/>
<role rolename="manager-jmx"/>
<role rolename="manager-status"/>
<user username="admin" password="admin" roles="manager-gui,manager-script,manager-jmx,manager-status"/>
## 
## 
## war包是java web项目的压缩文件
## 
## 在Linux上运行jar包程序：
java -jar xxx.jar    # 直接在前台运行（这会阻塞终端）
nohup java -jar xxx.jar & > out.log    # 在后台保持运行
## 
## 
 
