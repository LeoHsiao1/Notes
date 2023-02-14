# Ansible

：一个命令行工具，用于批量管理主机、批量执行脚本。
- [官方文档](https://docs.ansible.com/ansible/latest/user_guide/index.html)
- 采用 Python 开发。于 2012 年发布，2015 年被红帽公司收购。
- 采用主从架构，比较轻量级。
  - 选取一个或多个主机安装 Ansible ，作为控制节点（Control node），负责控制其它远程主机。
  - 远程主机只需要能通过 SSH 登录，即可供 Ansible 执行 shell 命令。

## 安装

- 用 pip 安装 Ansible ：
  ```sh
  yum install python36 sshpass libselinux-python    # 安装依赖
  pip3 install ansible
  ```

## 命令

### ansible

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

### ansible-playbook

```sh
ansible-playbook <name>.yml...       # 执行 playbook
                -i <file>            # 指定 Inventory 文件
                -e "A=Hello B=World" # 传入变量
                -t tag1,tag2,tag3    # 只执行具有某些 tag 的 task
                --skip-tags tag1     # 不执行具有某些 tag 的 task
                -v                   # 显示详细的执行信息
                -vvv                 # 显示更详细的信息

                --syntax-check       # 不执行，只是检查 playbook 的语法是否正确
                --list-hosts         # 不执行，只是列出所有 host
                --list-task          # 不执行，只是列出所有 task
                --list-tags          # 不执行，只是列出所有 tag
```

## 配置

执行 ansible 命令时，会按以下顺序查找配置文件：
- `$ANSIBLE_CONFIG`
- `./ansible.cfg`
- `~/.ansible.cfg`
- `/etc/ansible/ansible.cfg`

配置示例：
```ini
[defaults]
# inventory = /etc/ansible/hosts      # Inventory 文件的路径
log_path = /var/log/ansible.log       # 记录每次执行 ansible 的 stdout（默认不保存日志）
# forks = 5                           # 同时最多执行多少个任务
host_key_checking = False             # 进行 SSH 连接时不检查远程主机的密钥是否与 ~/.ssh/known_hosts 中记录的一致
# remote_tmp = $HOME/.ansible/tmp     # 登录远程主机时使用的工作目录
# interpreter_python = auto_legacy    # 远程主机上的 Python 解释器的路径，用于执行 Ansible 模块
```
- auto_legacy 表示默认使用 `/usr/bin/python` ，如果不存在则查找其它 Python 路径。

## Inventory

Ansible 将待管理主机（称为 host）的配置信息保存在 .ini 文件中，称为 Inventory（资产清单）。

配置示例：
```ini
localhost ansible_connection=local    # 定义一个不分组的 host ，连接方式为本机

[web_nodes]                           # 定义一个组，名为 web_nodes
www.example.com                       # 添加一个 host 的地址
10.0.0.1
node100 ansible_host=10.0.0.2         # 添加一个 host 的名字、地址

[web_nodes:vars]                      # 设置组 web_nodes 的参数
# ansible_connection=ssh              # Ansible 的连接方式
# ansible_ssh_port=22                 # SSH 登录时的端口号
ansible_ssh_user='root'               # SSH 登录时的用户名
ansible_ssh_pass='******'             # SSH 登录时的密码（使用该项需要安装 sshpass）
# ansible_ssh_private_key_file='~/.ssh/id_rsa'   # 用密钥文件进行 SSH 登录
# ansible_become=false                # SSH 登录之后是否切换用户
# ansible_become_method=sudo          # 切换用户的方式
# ansible_become_user=root            # 切换到哪个用户
# ansible_become_pass='******'        # 用 sudo 切换用户时的密码
# ansible_python_interpreter=/usr/bin/python
# timeout=10                          # SSH 登录的超时时间
```
- host 的地址可以为 IP 、域名或主机名，只要能被 SSH 连接。
  - 特别地， `ansible_connection=local` 代表直接连接本机，不会采用 SSH 连接的配置参数。
- 一个 host 可以同时属于多个组，甚至一个组可以是另一个组的成员。
  - 默认有两个隐式的分组：
    - all ：包含所有 host 。
    - ungrouped ：包含所有未分组的 host 。
- 组名支持通过下标进行索引、切片，如下：
  ```ini
  web_nodes[0]    # 选取第一个 host
  web_nodes[0:4]  # 选取第 0 ~ 4 个 host （包括第 4 个）
  web_nodes[-1]
  ```
- Inventory 文件中以明文形式存储 SSH 密钥，需要小心泄露。比如将 Ansible 目录设置为只允许 root 用户访问：
  ```sh
  chmod -R go=- /etc/ansible
  ```

## Playbook

Ansible 将待执行任务（称为 task）的配置信息保存在 .yml 文件中，称为 Playbook 。

配置示例：
```yml
- name: Test                             # 定义一个 playbook
  hosts: 10.0.*                          # 是一个 pattern ，用于匹配要管理的 host 或 组
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
- 每个 .yml 文件中可以定义一组 playbook ，每个 playbook 中可以定义一组 task 。
  - 定义 playbook 时，只有 hosts 是必填项。
- 执行一个 playbook 时，Ansible 会逐个提取其中的 task ，在所有 host 上并行执行。
  - 等所有 host 都执行完当前 task 之后，才执行下一个 task 。
  - 如果某个 task 执行之后的返回值不为 0 ，Ansible 就会终止执行并报错。
- playbook 中默认执行的第一个任务是 Gathering Facts ，收集 host 的信息。处理大量 host 时，设置 `gather_facts: false` 可以节省一些时间。
- handler 与 task 类似，由某个 task 通过 notify 激活，在所有 tasks 都执行完之后才会执行，且只会执行一次。

### task

- task 是 Ansible 执行任务的基本单位，而模块是 Ansible 执行任务的基本方式。每个 task 通过调用一个模块来实现某种操作。

- Ansible 在执行 task 时，会为每个 host 创建一个子进程，然后通过 SSH 连接到 host ，执行任务。进程树如下：
  ```sh
  -bash
  \_ /usr/bin/python3 /usr/local/bin/ansible web_nodes -m shell -a ping localhost
      \_ /usr/bin/python3 /usr/local/bin/ansible web_nodes -m shell -a ping localhost
      |   \_ sshpass -d11 ssh -C -o ControlMaster=auto -o ControlPersist=60s -o StrictHostKeyChecking=no -o User="root" -o ConnectTi
  meout=10 -o ControlPath=/root/.ansible/cp/5d2a6a8c55 -tt 10.0.0.1 /bin/sh -c '/usr/bin/python2.7 /root/.ansible/tmp/ansible-tmp-1619313582.094223-15190-6242900803349/AnsiballZ_command.py && sleep 0'
      \_ /usr/bin/python3 /usr/local/bin/ansible web_nodes -m shell -a ping localhost
          \_ sshpass ...
  ```
  - 执行每个 task 时，会生成一个临时的 .py 文件，拷贝到 host 上，用 python 解释器执行。

- 可以给 playbook 或 task 设置 become 选项，用于控制在 SSH 登录之后是否切换用户。如下：
  ```yml
  - name: Test
    hosts: localhost
    # become: yes               # 默认在 SSH 登录之后会切换用户
    # become_user: root         # 默认切换到 root 用户
    tasks:
      - shell: echo Hello
        # become: yes
        # become_user: root
  ```
  - 不支持在 shell 模块中执行 su 命令切换用户，否则会阻塞。但可以执行 sudo 命令，或者通过 become 选项切换用户。

- 可以给 task 加上 when 条件选项，当满足条件时才执行该 task ，否则跳过该 task 。如下：
  ```yml
  - name: test echo
    shell: echo {{A}}
    when:
      - A is defined                                 # 如果变量 A 已定义
      - A | int >= 1                                 # 将变量 A 转换成 int 类型再比较大小
      - ( A == '1' ) or (A == 'Hello' and B == '2')  # 使用逻辑运算符
      - not (A == '2' and B == "2")
  ```
  - 注意 `1` 表示数字 1 ，而 `'1'` 表示字符串 1 。
  - 判断变量的值时，如果该变量未定义，则会报错。

- task 可以通过 with_items 选项迭代一组 item 变量，每次迭代就循环执行一次模块。如下：
  ```yml
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

### tags

- 可以给 playbook 或 task 声明 tags 选项，从而允许只执行具有特定标签的任务。如下：
  ```yml
  - name: Test
    hosts: localhost
    tags: test
    tasks:
      - shell: echo step1
        tags:                     # 按 YAML 列表的格式定义标签
          - debug

      - shell: echo step2
        tags: debug, test         # 按逗号分隔符的格式定义标签

      - shell: echo step3
        tags: ["debug", "never"]  # 按数组的格式定义标签
  ```
  - playbook 的标签会被它的所有 task 继承。
  - never 标签默认不会被执行，除非被指定执行。
  - always 标签总是会被执行，除非被 --skip-tags 指定跳过。

- 例如：`ansible-playbook test.yml -t debug` 表示只执行具有 debug 标签的内容。
  - 如果不输入 -t 选项，则默认会输入 `-t all` ，选中所有标签。
  - 如果输入 -t 选项，且指定的标签在 playbook 中并不存在，则不会执行任何 task 。（除非具有 always 标签）
  - 输入 `-t tagged` 会执行所有打了标签的，输入 `-t untagged` 会执行所有没打标签的。

### vars

- Ansible 支持在 playbook 中定义变量并调用。如下：
  ```yml
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
- Ansible 采用 Jinja2 模板语言渲染 playbook ，因此其中的变量要使用 `{{var}}` 的格式取值。
  - 不过在 YAML 文件中，如果该变量独占一个字段，则需要用 `"{{var}}"` 的格式取值，否则不会被 YAML 视作字符串，导致语法错误。
  - 如果读取的变量不存在，则会报错，而不会默认取值为空。
:::

- 启动 playbook 时，可以用 `ansible-playbook test.yml -e "tips=Hello"` 的格式传入外部变量，这会覆盖同名的内部变量。
- 变量名只能包含字母、数字、下划线，且只能以字母开头。
- 字典类型的变量可以用以下两种格式取值：
  ```yml
  echo {{service.name}}       # 这种格式的缺点是：key 的名字不能与 Python 中字典对象的成员名冲突
  echo {{service['name']}}
  ```
- 变量的值允许换行输入，如下：
  ```yml
  vars:
    - text: |
        Hello
          World
        # 注意缩进到这个位置
  tasks:
    - shell: echo "{{text}}" >> f1
  ```

- Ansible 提供了一些内置变量。如下：
  ```yml
  debug:
    var: inventory_hostname         # 获取当前 host 的名称
  ```
  获取指定 host 的配置变量：
  ```yml
  hostvars['localhost']             # 一个字典
  hostvars['localhost']['inventory_hostname']
  ```
  获取从当前 host 收集的信息：
  ```yml
  ansible_facts                     # 一个字典
  ansible_facts['distribution']
  ```

- Ansible 会将每个模块的执行结果记录成一段 JSON 信息，可以用 register 选项赋值给变量。如下：
  ```yml
  tasks:
    - name: step1
      shell: ls f1
      register: step1_result              # 将模块的执行结果赋值给变量 step1_result
      ignore_errors: True                 # 即使该模块执行失败，也继续执行下一个模块

    - shell: echo {{step1_result}}
      # 直接打印，则是一个 JSON 对象，如下：
      # {changed: True, end: 2020-06-08 13:50:28.332773, stdout: f1, cmd: ls f1, rc: 0, start: 2020-06-08 13:50:28.329216, stderr: , delta: 0:00:00.003557, stdout_lines: [f1], stderr_lines: [], failed: False}

    - shell: echo {{step1_result.stdout}}

    - shell: echo "step1 failed!"
      when: step1_result.failed
      # when: step1_result.rc != 0
  ```
  不同模块的执行结果的格式可能不同，返回码代表的含义也可能不同。

### environment

- 可以给 playbook 或 task 声明 environment ，从而设置终端的环境变量。如下：
  ```yml
  - name: Test
    hosts: localhost
    vars:
      PATH: /usr/local/sbin:/usr/local/bin:/usr/bin/
    environment:
      A: Hello
      PATH: '{{ PATH }}'    # 可以在环境变量中引用 Ansible 变量
    tasks:
      - shell: env          # 打印环境变量
        environment:
          B: World
  ```

## Module

- Anisble 内置了很多种用途的模块，参考 [官方的模块列表](https://docs.ansible.com/ansible/latest/collections/index_module.html)
- 如果 host 上启用了 SELinux ，则需要先在它上面安装 `yum install libselinux-python` ，否则一些模块不能执行。
- Ansible 内置的模块大多具有幂等性。
  - 幂等性可以保证对同一个 host 重复执行一个 playbook 时，只会产生一次效果，不会因为重复执行而出错。比如使用 yum 模块安装软件时，它会检查是否已经安装，如果已经安装就不执行。
  - 重复执行幂等性模块时，只有第一次的执行结果中的 "changed" 参数为 true ，表示成功将 host 改变成了目标状态。之后重复执行时，"changed" 参数应该总是为 false 。
- 例如：
  - 使用 command、shell、raw 模块时可以自由地执行 shell 命令，通用性强，但不保证幂等性。
  - 使用 file、copy 模块可以保证幂等性，但通用性差，需要分别学习它们的用法。

### 关于执行命令

- 测试连接 host ：
  ```yml
  ping:
  ```
  - ping 模块会测试能否通过 ssh 登录 host ，并检查是否有可用的 Python 解释器，如果操作成功则返回 pong 。

- 用 command、shell、raw 模块可以在 host 上执行 shell 命令：
  - command 模块是在 Python 中调用 `subprocess.Popen(cmd, shell=False)` 来执行 cmd 命令。
    - 不是直接在 shell 终端执行命令。因此可以防止 shell 注入攻击，但是不支持管道符等 shell 语法。例如：
      ```sh
      [root@CentOS ~]# ansible localhost -a 'echo $PWD | wc -l >> f1 && echo $PWD'
      localhost | CHANGED | rc=0 >>
      /etc/ansible | wc -l >> f1 && echo /etc/ansible
      ```
    - 如果 command 模块中调用了 shell 环境变量，则会在执行命令之前就完成替换。
  - shell 模块是调用 `subprocess.Popen(cmd, shell=True)` ，新建一个 shell 终端来执行 cmd 命令。
  - raw 模块是通过 ssh 向 host 发送 shell 命令。适用于 host 上没有安装 Python 解释器，而无法使用 command、shell 模块的情况。

- command 模块：
  ```yml
  command: /tmp/test.sh chdir=/tmp/
  ```
  也可以写作以下格式：
  ```yml
  command:
    cmd: /tmp/test.sh
    # chdir: /tmp/      # 执行该命令之前，先切换到指定目录（可以是绝对路径或相对路径）
    # creates: /tmp/f1  # 如果该文件存在，则跳过该任务（这样有利于实现幂等性）
    # removes: /tmp/f1  # 如果该文件不存在，则跳过该任务
  ```
- shell 模块：
  ```yml
  shell:
    cmd: ls | grep ssh
    # executable: /bin/sh   # 指定要执行 shell 命令的可执行文件
    # chdir: /tmp/
    # creates: /tmp/f1
    # removes: /tmp/f1
  ```
  - 按以下格式可以给模块输入多行字符串：
    ```yml
    shell: |
      cd /tmp
      pwd
      touch f1
    ```
    注意输入的内容要缩进一层。
- raw 模块：
  ```yml
  raw: echo hello
  # args:
  #   executable: /bin/bash   # 指定解释器
  ```

- 在 host 上执行脚本：
  ```yml
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
  ```yml
  debug:
    var: hostvars[inventory_hostname]
  ```
  ```yml
  debug:
    msg: System {{inventory_hostname}} has gateway {{ansible_default_ipv4.gateway}}
  when: ansible_default_ipv4.gateway is defined
  ```
  - debug 模块的 var 、msg 选项不能同时使用。
  - when 选项、debug 模块的 var 选项已经隐式地用花括号包装，因此不需要再给变量加花括号取值。

- 加入断言：
  ```yml
  assert:
    that:                                                     # 相当于 when 选项
      - ansible_facts['distribution'] == "CentOS"
      - ansible_facts['distribution_major_version'] == "7"
    # quiet: no                                               # 是否显示执行的结果信息
    # fail_msg: "This system is not CentOS7."                 # 失败时显示该消息（需要 quiet 为 no ）
    # success_msg: "This system is CentOS7."
  ```

- 主动结束脚本的执行：
  ```yml
  - name: End the playbook
    when:
      - ansible_facts['distribution'] == "CentOS"
    meta: end_host            # 结束脚本在当前主机上的执行
    # meta: end_play          # 结束脚本在所有主机上的执行
  ```
  - 主动结束脚本时，该 task 不会记录在终端。

### 关于管理文件

- 管理 host 上的文件或目录：
  ```yml
  file:
    path: /tmp/f1
    # state: touch    # 可以取值为 touch（创建文件）、directory（创建目录）、link（创建软链接）、hard（创建硬链接）、absent（删除文件）
    # mode: 0774      # 设置文件的权限（加上前缀 0 ，声明这是八进制）
    # owner: root     # 设置文件的所有者
    # group: root     # 设置文件的所有者组
  ```
  - 在 path 字符串中不能使用 * 通配符。

- 将本机的文件拷贝到 host 上：
  ```yml
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
  - Ansible 默认通过 SFTP 传输文件。

- 将 host 上的文件拷贝到本机：
  ```yml
  fetch:
    src: /tmp/f1
    dest: /tmp/     # 以 / 结尾，表示这是一个已存在的目录
    # flat: no      # 默认为 no ，表示保存路径为 dest_path/hostname/src_path ，设置成 yes 则是 dest_path/filename
  ```
  - src 必须是一个文件的路径，不能是一个目录。

- 对 host 上的文本文件插入多行字符串：
  ```yml
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
  - Ansible 在插入 block 时，会自动在开始、结束处加上一行 marker 字符串作为标记。重复插入该 block 时，如果检查到该标记，且标记中的内容相同，则不会修改该文件。

- 对 host 上的文本文件进行正则替换：
  ```yml
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
  ```yml
  template:
    src: templates/test.conf.j2
    dest: /tmp/test.conf
    # mode: 0774    # 拷贝后文件的权限
    # owner: root   # 拷贝后文件的所有者
    # group: root   # 拷贝后文件的所有者组
  ```

### 关于配置系统

- 创建用户：
  ```yml
  user:
    name: leo
    # password: "{{'123456' | password_hash('sha512')}}"    # 设置密码
    # update_password: always # 可以取值为 always（默认，总是设置密码）、on_create（仅在创建用户时才设置密码）
    # generate_ssh_key: no    # 是否生成 ssh 密钥（已存在密钥的话不会覆盖）
    # home: /home/leo
    # shell: /bin/bash
    # group: root             # 设置基本用户组（该 group 必须已存在）
    # groups: root,docker     # 设置扩展用户组
    # append: no              # 默认取值为 no ，会将用户从其它组删除
    # comment: testing        # 添加备注信息
    # expires: 1591343903     # 设置过期时间
  ```
  ```yml
  user:
    name: leo
    state: absent         # 删除用户
    # remove: yes         # 删除家目录
  ```

- 用 yum 安装软件：
  ```yml
  yum:
    name:
      - vim
      - git
      - httpd-2.2.29
    # state: installed    # 可以取值为 installed（安装了即可，默认这种）、latest（安装最新版本）、removed（卸载）
  ```

- 管理 systemd 服务：
  ```yml
  systemd:
    name: httpd
    state: started        # 可以取值为 started、stopped、restarted、reloaded
    enabled: yes
    # daemon-reload: no   # 是否重新加载 unit 的配置文件
  ```

- 配置 firewalld 防火墙：
  ```yml
  firewalld:              # 设置启用的 zone
    zone: public
    state: present        # zone 的 state 可以取值为 present 或 absent
    permanent: yes
  ```
  ```yml
  firewalld:
    service: http         # 同时只能指定一个 service
    # port: 80/tcp        # 同时只能指定一个端口
    # rich_rule: rule family='ipv4' port port=22 protocol=tcp accept
    state: enabled        # 可以取值为 enabled 或 disabled
    permanent: yes
    immediate: yes        # 是否立即生效（当 permanent 为 yes 时，默认 immediate 为 no ）
    # zone: public
    # interface: eth2
  ```
  - 如果 firewalld 没有启动，则该模块会无法执行而报错。


## include

Ansible 原本采用 include 选项导入其它 playbook 文件的内容到当前文件中，不过从 2.4 版本开始拆分成多个具体的选项，如下：
- import_tasks
- include_tasks ：用于导入 tasks 列表文件。
- import_playbook ：用于导入 playbook 文件。
- import_role ：用于导入 role ，与 role 选项的原理相同。
- include_role

特点：
- import_* 导入的内容会在所有 playbook 启动之前就被预处理，比如确定变量的值，属于静态导入。
- include_* 导入的内容会在被执行时才开始解析，比如可以每次循环使用不同的变量值，属于动态导入。

例：
```yml
- name: test1
  hosts: "{{host}}"
  vars:
    - tips: Hello
  tasks:
    - include_tasks: tasks/test2.yml  # 导入一个 playbook ，不指定路径则默认是在当前目录下
      vars:                           # 传入变量
        tips: Hi

- name: test3
  import_playbook: test4.yml
  # hosts: localhost                  # 不能设置 hosts 选项，它会沿用前一个 playbook 的 host
  vars:
    tips: Hello
```
- include_tasks 必须作为一个 playbook 的 task 使用，且导入的目标文件必须是一个纯 tasks 列表，如下：
    ```yml
    - command: echo {{tips}}
    - command: ls
    ```
  上例中，被导入的 test2.yml 会继承 test1 的 vars ，且接受从外部传入的变量、标签。

- import_playbook 必须在已定义的 playbook 之后使用，导入一个独立的 playbook 文件。
  上例中，被导入的 test4.yml 不会继承 test1 的 vars ，只会接受从外部传入的变量、标签。

- 使用 include 这类选项时，不能选择只导入具有某些标签的内容，如下：
  ```yml
  - name: test3
    import_playbook: test4.yml
    tags:             # 这里声明的 tags 会作用于 test3
      - debug
  ```
  因此，只能将要导入的内容拆分成不同文件，或者通过变量判断是否执行某些内容，如下：
  ```yml
  - name: test3
    import_playbook: test4.yml
    vars:
      debug:
      tips: Hello
  ```
  ```yml
  - name: test4
    host: "{{host}}"
    tasks:
    - shell: echo {{tips}}
      when: debug is defined
  ```

## role

- 处理大型任务时，可以将一些 playbook、配置文件整合在一个目录下，称为 role 。
- 可以到官方的 roles 分享平台 galaxy.ansible.com 上寻找可用的 roles ，然后用 ansible-galaxy 命令下载 roles 。命令如下：
  ```sh
  ansible-galaxy
                install <name>
                search <name>
  ```

- 项目的目录结构示例：
  ```
  ├── hosts
  ├── README.md
  ├── roles/
  │   └── common/                   # 一个 role
  │       ├── defaults/             # 保存该 role 的默认变量
  │       │   └── main.yml
  │       ├── files/                # 存放一些文件，比如要拷贝到 host 上的文件
  │       │   ├── settings.py
  │       │   └── supervisor.conf
  │       ├── handlers/
  │       │   └── main.yml
  │       ├── meta/
  │       │   └── main.yml
  │       ├── tasks/
  │       │   └── main.yml
  │       ├── templates/            # 存放一些 Jinja2 模板文件
  │       │   ├── Dockerfile.j2
  │       │   └── nginx.conf.j2
  │       └── vars/                 # 存放一些变量
  │           └── main.yml
  └── site.yml
  ```
- 以上的目录结构是一种规范。
  - 导入一个 role 时，会自动导入它的 defaults/、handlers/、meta/、tasks/、vars/ 子目录下的 main.yml 文件的内容。如果这些文件不存在则忽略。
  - 使用 copy 、script 模块时会自动到 files/ 目录下寻找相应的文件，不需要指明相对路径；使用 template 模块时会自动引用 templates/ 目录；使用 include 选项时会自动引用 tasks/ 目录。

- 在 playbook 中导入 role 的示例：
  ```yml
  - name: Build Docker Image
    hosts: all
    roles:
      - role: common                # 导入一个 role ，写作 YAML 格式
        vars:
          tips: Hello
      - role: 'roles/build_image'   # 根据路径导入 role
      - { role: push_image, when: "docker_registry is defined" }  # 导入一个 role ，写作字典格式
  ```

## Ansible AWX

Ansible Tower 提供了 Ansible 的 Web UI ，采用 Django 开发，其开源版本是 Ansible AWX 。
- [官方文档](https://docs.ansible.com/ansible-tower/latest/html/userguide/index.html)
- 用 docker-compose 部署 Ansible AWX ：
  ```sh
  pip3 install docker-compose
  wget https://github.com/ansible/awx/archive/11.2.0.tar.gz    # 下载 Ansible AWX
  tar -zxvf 11.2.0.tar.gz
  cd awx-11.2.0/installer
  ansible-playbook -i inventory install.yml                    # 用 Ansible 启动 Ansible AWX ，这会花一段时间拉取 docker 镜像
  ```
  默认将 docker-compose 的配置文件保存在 ~/.awx/awxcompose/docker-compose.yml 。
  默认访问地址为 <http://localhost:80> ，用户名、密码为 admin 、 password 。

- 用法：
  - 可以在 Web 页面上方便地调用大量 playbook ，不过不能直接在 Web 页面上编辑 playbook 。因此只适合管理稳定不变的 playbook 。
  - 以 Project 为单位执行任务，可以从 Git、SVN 仓库或本地目录导入 playbook 文件。
  - 删除一个机构时，会自动删除其下的 Inventory 等配置。
