# MySQL

：一个流行的关系型数据库，基于C++。
- [官方文档](https://dev.mysql.com/doc/refman/5.7/en/)

MySQL存在多个分支：
- MySQL：最初由MySQL公司开发，后来被Sun公司收购，再后来与Sun公司一起被Oracle公司收购。
- MariaDB：MySQL被收购之后，MySQL创始人在开源社区创建了MariaDB。
- Percona：与MySQL完全兼容，还提供了XtraDB引擎。
- Drizzle：与MySQL的差异较大。

## 服务器

运行mysqld进程的主机即可担任MySQL服务器。
- 通常作为守护进程运行，监听3306端口，供MySQL客户端连接。

### 启动

这里使用的是Percona服务器。

- 用yum安装：
  ```sh
  curl -O https://www.percona.com/downloads/Percona-Server-5.7/Percona-Server-5.7.28-31/binary/redhat/7/x86_64/Percona-Server-5.7.28-31-rd14ef86-el7-x86_64-bundle.tar
  tar -xvf Percona-Server-5.7.26-29-r11ad961-el7-x86_64-bundle.tar
  yum install -y Percona-Server*.rpm
  rm -f Percona-Server*
  systemctl start mysqld                    # 启动服务器

  cat /var/log/mysqld.log | grep password   # 查看初始密码
  mysql -u root -p                          # 登录，输入初始密码
  set password for 'root'@'localhost' = password('******');  # 设置新密码
  ```

- 不安装，而是运行docker镜像：
  ```sh
  docker pull percona:5.7.26-centos
  docker run -d --name percona -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 percona:5.7.26-centos
  ```
  - 启动之后要修改密码：
    ```
    docker exec -it percona bash
    mysql -u root -p
    123456
    set password for 'root'@'localhost' = password('******');  # 设置高强度的密码
    ```

### 配置

MySQL服务器启动时，默认会使用以下位置的配置文件。如果前一个配置文件不存在则使用后一个，如果都不存在则使用默认配置。
```
/etc/my.cnf
/etc/mysql/my.cnf
/usr/etc/my.cnf
~/.my.cnf 
```
- 这些配置文件的后缀名为 .cnf ，采用 ini 的语法。
- Mysql会将用户输入的所有命令保存在 `~/.mysql_history` 文件中。

配置示例：
```ini
[mysqld]                # 这部分配置会被mysqld命令读取
bind-address=0.0.0.0    # 允许从任何IP地址访问
port=3306
datadir=/var/lib/mysql  # 存储MySQL数据文件的目录
socket=/var/lib/mysql/mysql.sock
pid-file=/var/run/mysqld/mysqld.pid
log-error=/var/log/mysqld.log

default_storage_engine=InnoDB         # 设置MySQL默认使用的引擎
character-set-server=utf8mb4          # 默认的字符集
init-connect='SET NAMES utf8mb4'      # 让客户端连接之后初始化字符集

[client]                # 这部分配置会被mysql、mysqldump等客户端命令读取
#user=root              # 设置默认用户名
#password=******        # 设置默认密码
```

## 客户端

### 安装

- 安装的MySQL服务器会自带客户端，也可yum单独安装MySQL客户端：
  ```sh
  yum install mysql
  ```

- 不安装，而是运行docker镜像：
  ```sh
  docker run -it --rm percona:5.7.26-centos mysql -h 127.0.0.1 -u root -p
  ```

### 用法

```sh
mysql                    # 启动MySQL客户端
      -h <host>          # 要连接的MySQL服务器的IP地址（默认是localhost）
      -P <port>          # 连接的端口号（默认为3306）
      -u <user>          # 连接的用户名（默认为root）
      -p                 # 以带密码的方式连接（接下来会提示输入密码）
      --password=******  # 以带密码的方式连接（直接传入密码）
```
- 执行mysql命令时，如果不能成功连接并登录MySQL服务器，就不会进入MySQL客户端的终端。
- 刚安装mysql服务器时，执行`mysql -u root -p`即可登录。
  - 如果不使用 -p 选项，则默认以免密的方式连接，就不能通过MySQL服务器的身份认证。

进入MySQL客户端的终端之后，可以执行SQL命令，也可以执行内置命令。
- 执行SQL命令时必须以分号 ; 结尾，执行内置命令时则不必。
- 执行SQL命令时，有时显示结果是一个字段太多的表格，排版混乱、难以阅读。可以在执行的SQL命令的末尾加上 \G ，将显示结果从横向表格变成纵向列表，方便阅读。例如：`select * from mysql.user\G;`
- 常用的内置命令：
  ```
  connect [db]   # 重新连接到MySQL服务器
  status         # 显示MySQL服务器的状态
  exit           # 退出MySQL客户端（相当于quit）
  ```

## SQL

：结构化查询语言（Structured Query Language)，是关系型数据库的标准操作语言。
- SQL是一种交互式操作语言，但不能进行编程。
- SQL独立于数据库之外，但在不同关系型数据库上的用法稍有不同，所以不能完全通用。

语法：
- 不区分大小写。
- 字符串只能用单引号 ' 包住（此时依然可以转义字符），或者不用引号（此时字符串不能包含空格）。
  - MySQL中，字符串也可以用双引号 " 包住。
  - MySQL中，如果用户使用的字符串与MySQL内部的保留子冲突，则必须用 \` \` 包住。
- 每条语句必须以分号 ; 结尾。输入一条语句时，可以多次按回车换行输入，直到输入分号结束。
- 用 -- 声明单行注释，用 /* */ 声明多行注释。
