# Ansible

：一个配置管理工具，基于 Python 开发，可以自动化地管理大量主机、批量执行脚本。
- Ansible 采用主从架构，而不是 C/S 工作模式。
  - 在一个主机上安装 Ansible 服务器，以控制其它工作主机。
  - 工作主机上不需要安装 Ansible 客户端，只要能通过 SSH 登录，Ansible 便可以连接到工作主机并执行命令。
- Ansible Tower 提供了 Ansible 的 Web 管理页面。
  - Ansible AWX 是 Ansible Tower 的开源版本。

## 安装

- 用 docker-compose 安装 Ansible AWX ：
  ```sh
  yum install -y docker-ce make git nodejs npm python python36-pip  # 安装依赖
  pip3 install docker docker-compose ansible                        # 安装 Ansible
  curl -O https://github.com/ansible/awx/archive/7.0.0.tar.gz       # 下载 Ansible AWX
  tar -zxvf awx-7.0.0.tar.gz
  cd awx-7.0.0/installer
  ansible-playbook -i inventory install.yml    # 用 Ansible 启动 Ansible AWX
  ```

## 命令

```sh
ansible-playbook <name>.yml...  # 执行 playbook
                --syntax-check  # 检查 playbook 的语法是否正确
                --list-hosts    # 显示所有 host
                --list-task     # 显示所有任务
                -t <tags>       # 只执行某些 tags 的 task
                -i <file>       # 指定 Inventory 文件
```

```sh
ansible <host> [-m <name>] -a <args>  # 在指定主机上执行一个模块，并给模块传入参数
```
- 不指定模块时，默认是执行 command 模块。
- 例：
    ```
    ansible all -a ls
    ansible all -m script -a "chdir=/root/ 1.sh"
    ```

## Inventory

Ansible 将待管理主机（称为 host）的配置信息保存在 .ini 文件中，称为 Inventory（资产清单）。
- Ansible 默认使用的 Inventory 文件是`/etc/ansible/hosts`。

配置示例：
```ini
[webservers]                  # 定义一个 host 组
green.example.com             # 添加一个 host
192.168.0.1
192.168.0.2

[webservers:vars]             # 设置组 webservers 的参数
#ansible_ssh_port=22          # SSH 登录时的端口号
ansible_ssh_user='root'       # SSH 登录时的用户名
ansible_ssh_pass='123456'     # SSH 登录时的密码
#ansible_ssh_private_key_file # 用密钥文件进行 SSH 登录
#ansible_sudo_pass='123456'   # SSH 登录后用 sudo 命令时的密码
```
- host 可以为 IP 地址、域名或主机名，只要能被 SSH 连接。
- 可以在定义任何 host 组之前添加未分组的 host ，如下：
    ```
    192.168.0.1  ansible_ssh_user='root'  ansible_ssh_pass='123456'
    ```
 
## playbook

Ansible 将待执行任务（称为 task）的配置信息保存在 .yml 文件中，称为 playbook 。

配置示例：
```yaml
- hosts: 192.168.0.1      # 待管理的 host（可以是一个 host 或一个 host 组）
  remote_user: root       # 以哪个用户的身份管理 host
  # become: yes           # SSH 连接之后，用 sudo 切换用户
  # become_user: nginx    # 切换到用户 nginx
  vars:                   # 定义变量
    - service_name: httpd
  tasks:                                # 任务列表
    - name: disable selinux             # 第一个任务
      command: "/sbin/setenforce 0"     # 调用 command 模块，执行一条命令
    - name: start httpd                 # 第二个任务
      service: name=httpd state=started
      notify:                           # 执行一个 handler
        - stop httpd
    handlers:                           # 定义 handlers
      - name: stop httpd
        service: name={{service_name}} state=stop
```
- 每个 task 通过调用一个模块来执行某种操作。
- Ansible 会依次提取 playbook 中的 task ，在所有 host 上同时执行。
  - 等所有 host 都执行完当前 task 之后，才执行下一个 task 。
  - 如果某个 task 执行之后的返回值不为 0 ，Ansible 就会终止执行并报错。
- 可以给 task 加上前置条件，当满足条件时才执行该 task 。如下：
    ```ini
    - name: start httpd
      service: name=httpd state=started
        when:
          - service_name | match("httpd")
    ```
- 可以给 task 加上 tags ，便于在执行 playbook 时选择只执行带有特定标签的 task 。如下：
    ```ini
    - name: start httpd
      service: name=httpd state=started
      tags:
        - debug
        - always
    ```
  - 带有 always 标志的 task 总是会被选中执行。
- handler 与 task 类似，由某个 task 通过 notify 激活，会在所有 tasks 执行完成之后执行，且只会执行一次。

### 常用模块

Ansible 提供了一些具有幂等性的模块。
- 幂等性可以保证对同一个 host 重复执行一个 playbook 时，只会产生一次效果，不会因为重复执行而出错。比如使用 yum 模块安装软件时，它会检查是否已经安装，如果已经安装就不执行。


常用的模块如下：

- 
  ```ini
  command: ls         # 执行一条 shell 命令
  ```
  - 可用选项：
    - `chdir=/root/`     ：在执行命令之前，先切换到指定目录。
    - `creates:/root/f1` ：如果该文件存在，则跳过该任务（这样有利于保证幂等性）。
    - `removes:/root/f1` ：如果该文件不存在，则跳过该任务。
  - 不支持 $ & < > | 等运算符。

- 
  ```ini
  shell: "ls | grep ssh"    # 执行一条 shell 命令
  ```
  - 兼容 command 模块的选项。
  - 特有的选项：
    `executable=/bin/bash`：指定要执行 shell 命令的可执行文件（默认是/bin/sh）。
  - shell 模块没有幂等性，常用于实现用户自定义的、不在乎幂等性的操作。

- 
  ```ini
  script: 1.sh              # 将服务器上的一个脚本拷贝到 host 上执行，执行完之后会删掉它
  ```
  - 兼容 shell 模块的选项。
  - 例：`script: "executable=/usr/bin/python 1.py"`

- 
  ```ini
  copy: "src=f1 dest=/root/"  # 将服务器上的一个文件或目录拷贝到 host 上
  ```
  - 当 src 是目录时，如果以 / 结尾，则会拷贝其中的所有文件到 dest 目录下，否则直接拷贝 src 目录。
  - 其它可用选项：
    `mode=0755` ：拷贝后文件的权限。
    `owner=root`：拷贝后文件的所有者。
    `group=root`：拷贝后文件的所有者组。

- 
  ```ini
  fetch: "src=/root/f1 dest=/root/"  # 将 host 上的文件拷贝到服务器上
  ```
  - src 路径不能是目录。
  - 其它可用选项：
    `flat=yes`：使保存路径为 `dest 路径 + 文件名` 。（默认为 `dest 路径 + host 名 + src 路径` ）

- 
  ```ini
  file: "path=/root/f1 state=touch"   # 创建一个文件
  ```
  - state 选项可以取值为 touch（创建文件）、directory（创建目录）、link（创建软链接）、hard（创建硬链接）、absent（删除文件）。
  - 兼容 copy 模块的 mode、owner、group 选项。

- 
  ```ini
  yum: "name=nginx state=latest"      # 安装软件
  ```
  - state 选项可以取值为 latest（安装最新版本）、installed（安装了即可）、absent（卸载软件）。

## role

处理大型任务时，可以将一些 playbook、配置文件整合在一个目录下，称为 role ，可以被其它 playbook 调用。

- role 的目录结构示例：
  ```
  image_build/                  # role 目录名
  |-- files                     # 存放要拷贝到 host 的文件
  |   |-- ansible.repo
  |   |-- Dockerfile.sdist
  |   |-- launch_awx.sh
  |   |-- launch_awx_task.sh
  |   |-- RPM-GPG-KEY-ansible-release
  |   |-- settings.py
  |   |-- supervisor.conf
  |   `-- supervisor_task.conf
  |-- tasks                     # 存放 playbook
  |   `-- main.yml
  `-- templates                 # 存放一些通用的模板文件
      |-- Dockerfile.j2
      |-- Dockerfile.task.j2
      `-- nginx.conf.j2
  ```

- 调用 role 的示例：
  ```ini
  - name: Build AWX Docker Images
    hosts: all
    gather_facts: false
    roles:
      - { role: image_build }                                     # 调用一个 role
      - { role: image_push, when: "docker_registry is defined" }  # 调用第二个 role
  ```

- 可以到官方的 roles 分享平台 galaxy.ansible.com 上寻找可用的 roles ，然后用 ansible-galaxy 命令下载 roles 。命令如下：
  ```sh
  ansible-galaxy
                install <name>
                search <name>
  ```
