# Ansible

：一个配置管理工具，基于 Python 开发，可以自动化地管理大量主机、批量执行脚本。
- Ansible 采用主从架构，而不是 C/S 工作模式。
  - 选取一个或多个主机运行 Ansible ，称为控制节点（Control node），负责控制其它远程主机。
  - 远程主机上不需要运行 Ansible 客户端，只要能通过 SSH 登录，Ansible 便可以连接到远程主机并执行命令。
- [官方文档](https://docs.ansible.com/ansible/latest/user_guide/index.html)

## 安装

- 用 pip 安装 Ansible ：
  ```sh
  yum install python36 sshpass    # 安装依赖
  pip3 install ansible
  ```

## 命令

```sh
ansible 
        <pattern> [-m <name>] [-a <args>]  # 在远程主机上执行一个模块（默认是采用 command 模块），并给模块传入参数
        --version                          # 显示版本、配置文件的位置
```
- pattern 是一个字符串，用于匹配 host 或组名，如果匹配结果为空则不执行任务。
  - 默认可使用 shell 风格的通配符，以 ~ 开头时则视作正则表达式。
- 例：
  ```sh
  ansible all -m ping           # 测试连接所有 host
  ansible all -a ls
  ansible 10.0.* -m shell -a "pwd"
  ansible ~10.0.0.(1|2) -m shell -a "pwd"
  ```

执行 playbook ：
```sh
ansible-playbook <name>.yml...       # 执行 playbook
                -t <tags>            # 只执行某些 tags 的 task
                -i <file>            # 指定 Inventory 文件
                -e "A=Hello B=World" # 传入变量
                -v                   # 显示详细的执行信息
                -vvv                 # 显示更详细的信息
                --syntax-check       # 不执行，只是检查 playbook 的语法是否正确
                --list-task          # 不执行，只是显示所有任务
                --list-hosts         # 不执行，只是显示所有 host
```

## 配置

Ansible 的配置文件默认位于 `/etc/ansible/ansible.cfg` ，内容如下：
```ini
[defaults]
; inventory=/etc/ansible/hosts      ; Inventory 文件的路径
log_path=/var/log/ansible.log       ; 记录每次执行 ansible 的 stdout（默认不保存日志）
; forks=5                           ; 同时最多运行多少个 Ansible 进程
host_key_checking=False             ; 第一次连接到远程主机时，是否提示添加 authorized_keys
; remote_tmp=$HOME/.ansible/tmp     ; 登录远程主机时使用的工作目录
```

## Inventory

Ansible 将待管理主机（称为 host）的配置信息保存在 .ini 文件中，称为 Inventory（资产清单）。

配置示例：
```ini
localhost ansible_connection=local    ; 定义一个不分组的 host

[webservers]                          ; 定义一个 组
www.example.com                       ; 添加一个 host 的地址
10.0.0.1
node100 ansible_host=10.0.0.2         ; 添加一个 host 的名字、地址

[webservers:vars]                     ; 设置组 webservers 的参数
; ansible_connection=ssh              ; ansible 的连接方式
; ansible_ssh_port=22                 ; SSH 登录时的端口号
ansible_ssh_user='root'               ; SSH 登录时的用户名
ansible_ssh_pass='123456'             ; SSH 登录时的密码（使用该项需要安装 sshpass）
; ansible_ssh_private_key_file='~/.ssh/id_rsa'   ; 用密钥文件进行 SSH 登录
; ansible_become=false                ; SSH 登录之后是否切换用户
; ansible_become_user=root            ; 切换到哪个用户
; ansible_become_method=sudo          ; 切换用户的方法
; ansible_become_pass='123456'        ; 用 sudo 切换用户时的密码
```
- 默认有两个隐式的分组：
  - all ：包含所有 host 。
  - ungrouped ：包含所有未分组的 host 。
- host 的地址可以为 IP 、域名或主机名，只要能被 SSH 连接。
- 一个 host 可以同时属于多个组，甚至一个组可以是另一个组的成员。
- 组名支持使用下标，如下：
  ```ini
  webservers[0]     # 选取第一个 host
  webservers[0:4]   # 选取第 0 ~ 4 个 host （包括第 4 个）
  webservers[-1]
  ```

## Playbook

Ansible 将待执行任务（称为 task）的配置信息保存在 .yml 文件中，称为 Playbook 。

配置示例：
```yaml
- name: Test
  hosts: 10.0.*                          # 一个 pattern ，用于匹配要管理的 host 或 组
  # become: yes                          # SSH 登录之后是否切换用户
  # become_user: root
  # gather_facts: true
  tasks:                                 # 任务列表
    - name: test echo                    # 第一个任务（如果不设置 name ，会默认设置成模块名）
      shell: echo Hello                  # 调用 shell 模块
    - name: start httpd                  # 第二个任务
      service: name=httpd state=started  # 调用 service 模块
      notify:                            # 执行一个 handler
        - stop httpd
    handlers:                            # 定义 handlers
      - name: stop httpd
        service: name=httpd state=stop
```

### task

- Ansible 会依次提取 playbook 中的 task ，在所有 host 上并行执行。
  - 等所有 host 都执行完当前 task 之后，才执行下一个 task 。
  - 如果某个 task 执行之后的返回值不为 0 ，Ansible 就会终止执行并报错。
- 每个 task 通过调用一个模块来完成某项操作。
  - Ansible 每执行一个 task 时，会生成一个临时的 .py 文件，传送到 host 上，用 python 解释器执行。如下：
    ```sh
    /bin/sh -c '/usr/bin/python /root/.ansible/tmp/ansible-tmp-xxx.py && sleep 0'
    ```
  - 默认执行的第一个任务是 Gathering Facts ，收集 host 的信息。管理大量 host 时，禁用该任务可以节省一些时间。
- handler 与 task 类似，由某个 task 通过 notify 激活，在所有 tasks 都执行完之后才会执行，且只会执行一次。
- 可以给整个 playbook 设置 become 选项，也可以给单独某个 task 设置 become 选项。
  ```yaml
  - name: test echo
    # become: yes
    # become_user: root
    shell: echo Hello
  ```

- 可以给 task 加上 tags ，便于在执行 playbook 时选择只执行带有特定标签的 task 。如下：
  ```yaml
  - name: start httpd
    service: name=httpd state=started
    tags:
      - debug
      - always
  ```
  - 带有 always 标志的 task 总是会被选中执行。

- 可以给 task 加上 when 条件，当满足条件时才执行该 task ，否则跳过该 task 。如下：
  ```yaml
  - name: test echo
    shell: echo {{A}}
    when:
      - A is defined                                 # 如果变量 A 已定义
      - A | int >= 1                                 # 将变量 A 转换成 int 类型再比较大小
      - ( A == '1' ) or (A == 'Hello' and B == '2')  # 使用逻辑运算符
      - not (A == '2' and B == "2")
  ```
  注意 `1` 表示数字 1 ，而 `'1'` 表示字符串 1 。 

- 可以用 with_items 语句迭代一组 item 变量，每次迭代就循环执行一次模块。如下：
  ```yaml
  - name: test echo
    shell: echo {{item}}
    with_items:
      - Hello
      - World
  - name: test echo
    shell: echo {{item.value}} {{item.length}}
    with_items:
      - {src: A, dest: 1}
      - src: B
        dest: 2
  ```

### 使用变量

- 例：
  ```yaml
  - name: Test
    hosts: 10.0.*
    vars:                   # 定义变量
      - tips: Hello         # 定义键值对类型的变量
      - service:            # 定义字典类型的变量
          name: httpd
          port: 80
    # vars_files:           # 从文件中导入变量
    #   - external_vars.yml
    tasks:
      - name: test echo
        shell: echo {{tips}}
      - name: start httpd
        service: name={{service.name}} state=started
  ```

::: v-pre
- Ansible 采用 Jinja2 模板语言渲染 Playbook ，因此其中的变量要使用 `{{var}}` 的格式取值。
  不过在 YAML 文件中，如果该变量独占一个字段，则需要用 `"{{var}}"` 的格式取值，否则不会被 YAML 视作字符串，导致语法错误。
:::
- 变量名只能包含字母、数字、下划线，且只能以字母开头。
- 字典类型的变量可以用以下两种格式取值：
  ```yaml
  echo {{service.name}}       # 这种格式的缺点是：key 的名字不能与 Python 中字典对象的成员名冲突
  echo {{service['name']}}
  ```
- 变量的值允许换行输入，如下：
  ```yaml
  vars:
    - text: |
        Hello
          World
        # 注意缩进到这个位置
  tasks:
    - shell: echo "{{text}}" >> f1
  ```

- Ansible 提供了一些内置变量。如下：
  ```yaml
  debug:
    var: inventory_hostname         # 获取当前 host 的名称
  ```
  获取指定 host 的配置变量：
  ```yaml
  hostvars['localhost']             # 一个字典
  hostvars['localhost']['inventory_hostname']
  ```
  获取从当前 host 收集的信息：
  ```yaml
  ansible_facts                     # 一个字典
  ansible_facts['distribution']
  ```

- Ansible 会将每个模块的执行结果记录成一段 JSON 信息，可以用 register 选项暂存。如下：
  ```yaml
  tasks:
    - name: step1
      shell: ls f1
      register: step1_result              # 将模块的执行结果赋值给变量 step1_result
      ignore_errors: True                 # 即使该模块执行失败，也继续执行下一个模块

    - shell: echo {{step1_result}}        # 输出示例： {changed: True, end: 2020-06-08 13:50:28.332773, stdout: f1, cmd: ls f1, rc: 0, start: 2020-06-08 13:50:28.329216, stderr: , delta: 0:00:00.003557, stdout_lines: [f1], stderr_lines: [], failed: False}
    
    - shell: echo {{step1_result.stdout}} # 输出示例： f1

    - shell: echo "step1 failed!"
      when: step1_result.failed
      # when: step1_result.rc != 0
  ```
  不同模块的执行结果的格式可能不同，返回码表示的含义也可能不同。

## Module

- 如果 host 上启用了 SELinux ，则需要先在它上面安装 `yum install libselinux-python` ，否则一些模块不能执行。
- Ansible 提供了一些具有幂等性的模块。
  - 幂等性可以保证对同一个 host 重复执行一个 playbook 时，只会产生一次效果，不会因为重复执行而出错。比如使用 yum 模块安装软件时，它会检查是否已经安装，如果已经安装就不执行。
  - 重复执行幂等性模块时，只有第一次的执行结果中的 "changed" 参数为 true ，表示成功将 host 改变成了目标状态。之后重复执行时，"changed" 参数应该总是为 false 。
- [官方的模块列表](https://docs.ansible.com/ansible/latest/modules/list_of_all_modules.html)

### 关于执行命令

- 测试连接 host ：
  ```yaml
  ping:
  ```
  - ping 模块会测试能否通过 ssh 登录 host，并检查是否有可用的 Python 解释器，如果操作成功则返回 pong 。

- 用 command、shell、raw 模块可以在 host 上执行 shell 命令：
  
  - 
    ```yaml
    command: /tmp/test.sh chdir=/tmp/
    ```
    调用模块时也可以写作以下格式：
    ```yaml
    command:
      cmd: /tmp/test.sh
      # chdir: /tmp/      # 执行该命令之前，先切换到指定目录（可以是绝对路径或相对路径）
      # creates: /tmp/f1  # 如果该文件存在，则跳过该任务（这样有利于实现幂等性）
      # removes: /tmp/f1  # 如果该文件不存在，则跳过该任务
    ```
  - 
    ```yaml
    shell:
      cmd: ls | grep ssh
      # executable: /bin/sh   # 指定要执行 shell 命令的可执行文件
      # chdir: /tmp/
      # creates: /tmp/f1
      # removes: /tmp/f1
    ```
    shell 模块时会在 Python 中调用 subprocess.Popen(cmd, shell=True) ，新建一个 shell 终端来执行 cmd 命令。
    而 command 模块是调用 subprocess.Popen(cmd, shell=False) ，不在 shell 终端中执行 cmd 命令。因此可以防止 shell 注入攻击，但是不支持一些 shell 语法。此如下：
    ```sh
    [root@Centos ~]# ansible localhost -a 'echo $PWD >> f1 && ls'
    localhost | CHANGED | rc=0 >>
    /etc/ansible >> f1 && ls
    ```
  - 
    ```yaml
    raw: echo hello
    # args:
    #   executable: /bin/bash   # 指定解释器
    ```
    raw 模块是通过 ssh 直接向 host 发送 shell 命令。适用于 host 上没有安装 Python 解释器，而无法使用 command、shell 模块的情况。
    
  - 按以下格式可以给模块输入多行字符串：
    ```yaml
    shell: |
      cd /tmp
      pwd
      touch f1
    ```
    注意输入的内容要缩进一层。

  - 虽然这三个模块可以自由地执行命令，通用性强，但是使用 copy 等具体的模块可以保证幂等性。

- 在 host 上执行脚本：
  ```yaml
  script:
    cmd: /tmp/test.sh
    # executable: /bin/bash  # 设置执行该脚本的程序
    # chdir: /tmp/
    # creates: /tmp/f1
    # removes: /tmp/f1
  ```
  - cmd 是本机上的一个脚本的路径，它会被拷贝到 host 上执行，执行完之后会自动删除。
  - executable 不一定是 shell 解释器，因此执行的不一定是 shell 脚本，比如：`script: "executable=/usr/bin/python /tmp/1.py"`

- 打印调试信息：
  ```yaml
  debug:
    var: hostvars[inventory_hostname]
  ```
  ```yaml
  debug:
    msg: System {{inventory_hostname}} has gateway {{ansible_default_ipv4.gateway}}
  when: ansible_default_ipv4.gateway is defined
  ```
  - var 、msg 选项不能同时使用。
  - when 条件、debug 模块的 var 选项已经隐式地用花括号包装，因此不需要再给变量加花括号取值。

- 加入断言：
  ```yaml
  assert:
    that:                                                     # 相当于 when 条件
      - ansible_facts['distribution'] == "CentOS"
      - ansible_facts['distribution_major_version'] == "7"
    # quiet: no                                               # 是否显示执行的结果信息
    # fail_msg: "This system is not CentOS7."                 # 失败时显示该消息（需要 quiet 为 no ）
    # success_msg: "This system is CentOS7."
  ```

### 关于管理文件

- 管理 host 上的文件或目录：
  ```yaml
  file:
    path: /tmp/f1
    # state: touch    # 可以取值为 touch（创建文件）、directory（创建目录）、link（创建软链接）、hard（创建硬链接）、absent（删除文件）
    # mode: 0774      # 设置文件的权限（加上前缀 0 ，声明这是八进制）
    # owner: root     # 设置文件的所有者
    # group: root     # 设置文件的所有者组
  ```

- 将本机的文件拷贝到 host 上：
  ```yaml
  copy:
    src: f1
    dest: /tmp/
    # mode: 0774
    # owner: root
    # group: root
  ```
  - src 可以是绝对路径或相对路径。
  - 当 src 是目录时，如果以 / 结尾，则会拷贝其中的所有文件到 dest 目录下，否则直接拷贝 src 目录。
  - 如果 dest 目录并不存在，则会自动创建。
  - 如果 dest 目录下存在同名文件，且 md5 值相同，则不拷贝，否则会拷贝并覆盖。

- 将 host 上的文件拷贝到本机：
  ```yaml
  fetch:
    src: /tmp/f1
    dest: /tmp/     # 以 / 结尾，表示这是一个已存在的目录
    # flat: no      # 默认为 no ，表示保存路径为 dest_path/hostname/src_path ，设置成 yes 则是 dest_path/filename
  ```
  - src 必须是一个文件的路径，不能是一个目录。

- 对 host 上的文本文件插入多行字符串：
  ```yaml
  blockinfile:
    path: /var/spool/cron/root
    block: |
      */1 * * * * echo Hello
      */1 * * * * echo World
    # create: no                  # 如果不存在该文件，是否自动创建它
    # state: present              # 取值为 absent 则会删除该 block
    # insertafter: EOF            # 将 block 插入到该正则表达式的最后一个匹配项之后（默认取值为 EOF ，即插入到文件末尾）
    # insertbefore: BOF           # 将 block 插入到该正则表达式的最后一个匹配项之前（取值为 BOF 则插入到文件开头）
    # marker: # {mark} ANSIBLE MANAGED BLOCK    # 设置该 block 的标记语，其中 {mark} 会被 marker_begin 或 marker_end 替换
    # marker_begin: BEGIN 
    # marker_end: END
  ```
  - 上例中最终插入的 block 如下：
    ```sh
    # BEGIN ANSIBLE MANAGED BLOCK
    */1 * * * * echo Hello
    */1 * * * * echo World
    # END ANSIBLE MANAGED BLOCK
    ```
  - Ansible 在插入 block 时，会自动在开始、结束处加上一行 marker 字符串作为标记。重复插入该 block 时，如果检查到该标记，且标记中的内容相同，则不会修改文件。

- 对 host 上的文本文件进行正则替换：
  ```yaml
  replace:
    path: /tmp/f1
    regexp: 'Hello(\w*)'    # 将匹配 regexp 的部分替换为 replace
    replace: 'Hi\1'         # 这里用 \1 引用匹配的第一个元素组
    # after: 'line_1'       # 在某位置之后开始匹配
    # before: 'line_10.*'   # 在某位置之前开始匹配
    # encoding: 'utf-8'
  ```
  - 采用 Python 的正则引擎，默认的编码格式是 utf-8 。

- 渲染 Jinja2 模块文件，生成新文件：
  ```yaml
  template:
    src: templates/test.conf.j2
    dest: /tmp/test.conf
    # mode: 0774    # 拷贝后文件的权限
    # owner: root   # 拷贝后文件的所有者
    # group: root   # 拷贝后文件的所有者组
  ```

### 关于配置系统

- 创建用户：
  ```yaml
  user:
    name: leo
    # home: /home/leo
    # password: "{{'123456' | password_hash('sha512')}}"    # 设置密码
    # update_password: always # 可以取值为 always（默认，总是设置密码）、on_create（仅在创建用户时才设置密码）
    # shell: /bin/bash
    # group: root             # 设置基本用户组（该 group 必须已存在）
    # groups: root,docker     # 设置扩展用户组
    # append: no              # 默认取值为 no ，会将用户从其它组删除
    # comment: testing        # 添加备注信息
    # expires: 1591343903     # 设置过期时间
    # generate_ssh_key: no    # 是否生成 ssh 密钥（已存在密钥的话不会覆盖）
  ```
  ```yaml
  user:
    name: leo
    state: absent         # 删除用户
    # remove: yes         # 删除家目录
  ```

- 用 yum 安装软件：
  ```yaml
  yum:
    name: ['vim', 'git', 'tmux']
    state: latest     # 可以取值为 installed（安装了即可）、latest（安装最新版本）、removed（卸载）
  ```

- 管理 systemd 服务：
  ```yaml
  systemd:
    name: httpd
    state: started        # 可以取值为 started、stopped、restarted、reloaded
    enabled: yes
    # daemon-reload: no   # 是否重新加载 unit 的配置文件
  ```

- 配置 firewalld 防火墙：
  ```yaml
  firewalld:              # 设置启用的 zone
    zone: public
    state: present        # zone 的 state 可以取值为 present 或 absent
    permanent: yes
  ```
  ```yaml
  firewalld:
    service: http         # 同时只能指定一个 service
    # port: 80/tcp        # 同时只能指定一个端口
    # rich_rule: rule family='ipv4' port port=22 protocol=tcp accept
    state: enabled        # 可以取值为 enabled 或 disabled
    # zone: public
    # interface: eth2
    permanent: yes
    immediate: yes        # 是否立即生效（当 permanent 为 yes 时，默认 immediate 为 no ）
  ```

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
  ```yaml
  - name: Build AWX Docker Images
    hosts: all
    gather_facts: false
    roles:
      - { role: image_build }                                     # 调用一个 role
      - { role: image_push, when: "docker_registry is defined" }  # 调用另一个 role
  ```

- 可以到官方的 roles 分享平台 <galaxy.ansible.com> 上寻找可用的 roles ，然后用 ansible-galaxy 命令下载 roles 。命令如下：
  ```sh
  ansible-galaxy
                install <name>
                search <name>
  ```

## Ansible AWX

- Ansible Tower 提供了 Ansible 的 Web 操作页面，基于 Django 开发，其开源版本是 Ansible AWX 。
- [官方文档](https://docs.ansible.com/ansible-tower/latest/html/userguide/index.html)
- 用 docker-compose 部署 Ansible AWX ：
  ```sh
  pip3 install docker-compose
  wget https://github.com/ansible/awx/archive/11.2.0.tar.gz    # 下载 Ansible AWX
  tar -zxvf 11.2.0.tar.gz
  cd awx-11.2.0/installer
  ansible-playbook -i inventory install.yml                    # 用 Ansible 启动 Ansible AWX，这会花一段时间拉取 docker 镜像
  ```
  默认将 docker-compose 的配置文件保存在 ~/.awx/awxcompose/docker-compose.yml 。
  默认访问地址为 <http://localhost:80> ，用户名、密码为 admin 、 password 。

- 用法：
  - 可以在 Web 页面上方便地调用大量 playbook ，不过不能直接在 Web 页面上编辑 playbook 。因此只适合管理已稳定可用的 playbook 。
  - 以 Project 为单位执行任务，可以从 Git、SVN仓库或本地目录导入 Playbook 文件。
  - 删除一个机构时，会自动删除其下的 Inventory 等配置。
