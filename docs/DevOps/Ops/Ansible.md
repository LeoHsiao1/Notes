# Ansible

：一个用于管理大量主机的工具，基于Python，常用于配置系统环境、批量执行脚本。
- Ansible采用主从架构，而不是C/S架构。
  - 在一台主机上安装Ansible服务器，以控制其它工作主机。
  - 工作主机上不需要安装Ansible客户端，只要能通过SSH登录，Ansible便可以连接到工作主机并执行命令。
- Ansible Tower提供了Ansible的Web管理页面。
  - Ansible AWX是Ansible Tower的开源版本。

## 安装

使用docker-compose安装Ansible AWX：
```shell
yum install -y docker-ce make git nodejs npm python python36-pip	# 安装依赖
pip3 install docker docker-compose ansible	                      # 安装Ansible
curl -O https://github.com/ansible/awx/archive/7.0.0.tar.gz	      # 下载Ansible AWX
tar -zxvf awx-7.0.0.tar.gz
cd awx-7.0.0/installer
ansible-playbook -i inventory install.yml		  # 用Ansible启动Ansible AWX
```

## 命令

```shell
ansible-playbook <name>.yml...  # 执行playbook
                --syntax-check  # 检查playbook的语法是否正确
                --list-hosts    # 显示所有host
                --list-task     # 显示所有任务
                -t <tags>       # 只执行某些tags的task
                -i <file>       # 指定Inventory文件
```

```shell
ansible <host> [-m <name>] -a <args>  # 在指定主机上执行一个模块，并给模块传入参数
```
- 不指定模块时，默认是执行command模块。
- 例：
    ```
    ansible all -a ls
    ansible all -m script -a "chdir=/root/ 1.sh"
    ```

## Inventory

Ansible将待管理主机（称为host）的配置信息保存在 .ini 文件中，称为Inventory（资产清单）。
- Ansible默认使用的Inventory文件是`/etc/ansible/hosts`。

配置示例：
```ini
[webservers]                  # 定义一个host组
green.example.com             # 添加一个host
192.168.0.1
192.168.0.2

[webservers:vars]             # 设置组webservers的参数
#ansible_ssh_port=22          # SSH登录时的端口号
ansible_ssh_user='root'       # SSH登录时的用户名
ansible_ssh_pass='123456'     # SSH登录时的密码
#ansible_ssh_private_key_file # 用密钥文件进行SSH登录
#ansible_sudo_pass='123456'   # SSH登录后用sudo命令时的密码
```
- host可以为IP地址、域名或主机名，只要能被SSH连接。
- 可以在定义任何host组之前添加未分组的host，如下：
    ```
    192.168.0.1  ansible_ssh_user='root'  ansible_ssh_pass='123456'
    ```
 
## playbook

Ansible将待执行任务（称为task）的配置信息保存在 .yml 文件中，称为playbook。

配置示例：
```yaml
- hosts: 192.168.0.1      # 待管理的host（可以是一个host或一个host组）
  remote_user: root       # 以哪个用户的身份管理host
  # become: yes				    # SSH连接之后，用sudo切换用户
  # become_user: nginx		# 切换到用户nginx
  vars:						        # 定义变量
    - service_name: httpd
  tasks:						                    # 任务列表
    - name: disable selinux	            # 第一个任务
      command: "/sbin/setenforce 0"	    # 调用command模块，执行一条命令
    - name: start httpd                 # 第二个任务
      service: name=httpd state=started
      notify:					                  # 执行一个handler
        - stop httpd
    handlers:                           # 定义handlers
      - name: stop httpd
        service: name={{service_name}} state=stop
```
- 每个task通过调用一个模块来执行某种操作。
- Ansible会依次提取playbook中的task，在所有host上同时执行。
  - 等所有host都执行完当前task之后，才执行下一个task。
  - 如果某个task执行之后的返回值不为0，Ansible就会终止执行并报错。
- 可以给task加上前置条件，当满足条件时才执行该task。如下：
    ```ini
    - name: start httpd
      service: name=httpd state=started
        when:
          - service_name | match("httpd")
    ```
- 可以给task加上tags，便于在执行playbook时选择只执行带有特定标签的task。如下：
    ```ini
    - name: start httpd
      service: name=httpd state=started
      tags:
        - debug
        - always
    ```
  - 带有always标志的task总是会被选中执行。
- handler与task类似，由某个task通过notify激活，会在所有tasks执行完成之后执行，且只会执行一次。

### 常用模块

Ansible提供了一些具有幂等性的模块。
- 幂等性可以保证对同一个host重复执行一个playbook时，只会产生一次效果，不会因为重复执行而出错。比如使用yum模块安装软件时，它会检查是否已经安装，如果已经安装就不执行。


常用的幂等性模块如下：

- 
  ```ini
  command: ls					# 执行一条shell命令
  ```
  - 可用选项：
    ```ini
    chdir=/root/		  # 在执行命令之前，先切换到指定目录
    creates:/root/f1  # 如果该文件存在，则跳过该任务（这样有助于更好的幂等性）
    removes:/root/f1  # 如果该文件不存在，则跳过该任务
    ```
  - 不支持 $ & < > | 等运算符。

- 
  ```ini
  shell: "ls | grep ssh"		# 执行一条shell命令
  ```
  - 兼容command模块的选项。
  - 特有的选项：
    ```ini
    executable=/bin/bash		# 指定要执行shell命令的可执行文件（默认是/bin/sh）
    ```
  - shell模块没有幂等性，常用于实现用户自定义的、不在乎幂等性的操作。

- 
  ```ini
  script: 1.sh              # 将服务器上的一个脚本拷贝到host上执行，执行完之后会删掉它
  ```
  - 兼容shell模块的选项。
  - 例：
    ```ini
    script: "executable=/usr/bin/python 1.py"
    ```

- 
  ```ini
  copy: "src=f1 dest=/root/"  # 将服务器上的一个文件或目录拷贝到host上
  ```
  - 当src是目录时，如果以 / 结尾，则会拷贝其中的所有文件到dest目录下，否则直接拷贝src目录。
  - 其它可用选项：
    ```ini
    mode=0755	    # 拷贝后文件的权限
    owner=root    # 拷贝后文件的所有者
    group=root    # 拷贝后文件的所有者组
    ```

- 
  ```ini
  fetch: "src=/root/f1 dest=/root/"		# 将host上的文件拷贝到服务器上
  ```
  - src路径不能是目录。
  - 其它可用选项：
    ```ini
    flat=yes    # 保存路径为dest路径+文件名（默认为dest路径+host名+src路径）
    ```

- 
  ```ini
  file: "path=/root/f1 state=touch"		# 创建一个文件
  ```
  - state选项可以取值为touch（创建文件）、directory（创建目录）、link（创建软链接）、hard（创建硬链接）、absent（删除文件）。
  - 兼容copy模块的mode、owner、group选项。

- 
  ```ini
  yum: "name=nginx state=latest"		# 安装软件
  ```
  - state选项可以取值为latest（安装最新版本）、installed（安装了即可）、absent（卸载软件）。

## role

处理大型任务时，可以将一些playbook、配置文件整合在一个目录下，称为role，可以被其它playbook调用。

- role的目录结构示例：
  ```
  image_build/					    # role目录名
  |-- files					        # 存放要拷贝到host的文件
  |   |-- ansible.repo
  |   |-- Dockerfile.sdist
  |   |-- launch_awx.sh
  |   |-- launch_awx_task.sh
  |   |-- RPM-GPG-KEY-ansible-release
  |   |-- settings.py
  |   |-- supervisor.conf
  |   `-- supervisor_task.conf
  |-- tasks					        # 存放playbook
  |   `-- main.yml
  `-- templates				      # 存放一些通用的模板文件
      |-- Dockerfile.j2
      |-- Dockerfile.task.j2
      `-- nginx.conf.j2
  ```

- 调用role的示例：
  ```ini
  - name: Build AWX Docker Images
    hosts: all
    gather_facts: false
    roles:
      - { role: image_build }										                  # 调用一个role
      - { role: image_push, when: "docker_registry is defined" }  # 调用第二个role
  ```

- 可以到官方的roles分享平台 galaxy.ansible.com 上寻找可用的roles，然后用ansible-galaxy命令下载roles。命令如下：
  ```shell
  ansible-galaxy
                install <name>
                search <name>
  ```
