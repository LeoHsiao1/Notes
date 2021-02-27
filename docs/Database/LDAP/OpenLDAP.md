# OpenLDAP

：一个开源的 LDAP 服务器软件。
- [官网](https://www.openldap.org/)
- 它会运行一个 slapd 进程，作为 LDAP 服务器。
- 同类产品：
  - Active Directory ：简称为 AD ，同时支持 LDAP 和 Kerberos 协议。
  - Apache Directory Server

## 部署

- 用 docker-compose 运行，配置如下：
  ```yml
  version: "3"

  services:
    openldap:
      image: osixia/openldap:1.4.0
      hostname: openldap
      ports:
        - 389:389
        - 636:636
      volumes:
        - ./data:/var/lib/ldap        # 挂载存储目录
        - ./conf:/etc/ldap/slapd.d    # 挂载配置目录
  ```
  - 该 Docker 镜像的 [Github 页面](https://github.com/osixia/docker-openldap)
  - 默认监听两个端口：
    - 389 ：用于非加密通信。
    - 636 ：用于 SSL/TLS 加密通信。
  - 默认创建了一个 {1}mdb 数据库，在容器内执行以下命令尝试查询：
    ```sh
    ldapsearch -H ldapi:/// -Y EXTERNAL -b cn=config
    ldapsearch -H ldapi:/// -Y EXTERNAL -b olcDatabase={1}mdb,cn=config
    ldapsearch -x -D cn=admin,dc=example,dc=org -w admin -b dc=example,dc=org
    ```
  - 接下来可以在 Ldap Admin 中开始操作。

## 原理

- OpenLDAP 支持创建多种数据库，常见的后端类型如下：
  ```sh
  config    # 用于存储 Slapd 的配置
  bdb       # 将数据存储到 Berkeley DB 文件数据库，已弃用
  hdb       # 另一种 bdb ，已弃用
  ldap      # 将数据存储到另一个 LDAP 服务器
  ldif      # 将数据存储以 LDIF 格式存储在文件中
  mdb       # 将数据存储到 LMDB 数据库中
  meta      # 元数据目录
  monitor   # 用于监控 slapd ，只能创建一个数据库实例
  passwd    # 用于以只读权限访问 /etc/passwd 文件
  shell     # 基于 Shell
  sql       # 基于 SQL
  ```
  - 一般的数据库推荐采用 mdb 。

## 命令

- 语法：
  ```sh
  ldapadd|ldapmodify|ldapdelete|ldapsearch
          -H ldap://localhost:389     # 采用 ldap 协议，指定服务器的 URI
          -H ldaps://localhost:636    # 采用 ldaps 协议，进行加密通信
          -H ldapi:///var/run/ldapi   # 采用 ldapi 协议，通过 Unix Socket 连接
          -b <dn>                     # 指定服务器上的一个 dn 作为查询的起点
          -f <file>                   # 读取并执行 .ldif 文件的内容

          -X dn:<dn>                  # 采用 SASL 认证模式（默认采用），需要先指定用户 dn ，接着按提示输入密码
          -Y <mechanism>              # 指定 SASL 机制
          -x                          # 采用简单认证模式
          -D <dn>                     # 指定用户名
          -w <password>               # 输入明文密码（用于简单认证模式）
  ```

- 例：
  ```sh
  ldapsearch -H ldapi:/// -Y EXTERNAL -b dc=example,dc=org                    # 采用 SASL 认证模式，通过 Unix Socket 连接（这样可以免密登录）
  ldapsearch -x -b dc=example,dc=org                                          # 采用简单认证模式，但并指定用户，即作为匿名用户
  ldapsearch -x -D cn=admin,dc=example,dc=org -w admin -b dc=example,dc=org   # 采用简单认证模式，并指定用户
  ```

## 配置

- OpenLDAP 提供了一个在线配置系统，称为 OLC 。
  - OLC 系统使用一个 Root DN 为 `cn=config` 的 DIT 来存储配置信息，从而支持在线修改配置，且不用重启就能生效。
  - OLC 系统的配置属性的名称都以 `olc` 开头。
- OLC 系统中的每个条目会在磁盘的配置文件目录下保存为一个 .ldif 文件，如下：
  ```sh
  /etc/ldap/slapd.d/
  ├── cn=config.ldif                  # 存储 `dn: cn=config` 条目，该条目的子节点则存储在 cn=config/ 目录下
  └── cn=config/
      ├── cn=module{0}.ldif           # 存储 `dn: cn=module{0}` 条目，它用于加载模块
      ├── cn=schema.ldif
      ├── cn=schema/
      │   ├── cn={0}core.ldif
      │   ├── cn={1}cosine.ldif
      │   └── cn={2}nis.ldif
      ├── olcDatabase={0}config.ldif
      ├── olcDatabase={-1}frontend.ldif
      ├── olcDatabase={1}mdb.ldif
      └── olcDatabase={1}mdb/
          ├── olcOverlay={0}memberof.ldif
          └── olcOverlay={1}refint.ldif
  ```
  - 用户不应该直接修改这些 .ldif 文件，而应该通过 ldapadd、ldapmodify 等命令进行在线配置。

- `olcDatabase={0}config.ldif` 的内容示例如下：
  ```sh
  dn: olcDatabase={0}config
  objectClass: olcDatabaseConfig
  olcDatabase: {0}config
  olcAccess: {0}to * by dn.exact=gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth manage
                     by * break
  olcRootDN: cn=admin,cn=config
  olcRootPW: e1NTSEF9MGJYN2xxMDZZOEQxVmZwVTFyZUs3RFZrMng4TDFPYWk=
  structuralObjectClass: olcDatabase
  ConfigentryUUID: 72c4b61a-be77-103a-9ff0-9ddaa4d2c622
  creatorsName: cn=config
  createTimestamp: 20201119055436Z
  entryCSN: 20201119072303.463947Z#000000#000#000000
  modifiersName: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth    # 这一个长 dn 是默认用户
  modifyTimestamp: 20201119072303Z
  ```
  - `olcDatabase ：[{<index>}] <type>`
    - 用于创建一个数据库实例。
    - index ：该数据库实例在同类数据库中的索引。不指定时会根据创建顺序自动生成。
    - type ：该数据库的后端类型。
  - `olcSuffix: <dn suffix>`
    - 指定一个 dn 后缀。所有包含该 dn 后缀的查询请求会被转发到该数据库，通常与该数据库的 Root DN 相同。
    - 查询目标指向 olcDatabase 的 dn 时，会返回该该数据库的配置信息。而查询目标指向 olcSuffix 时，会返回该数据库中存储的条目。
  - `olcRootDN ：<dn>`
    - 创建一个对该数据库有完全权限的 root 用户（这会保存为指定 dn 的条目）。
    - dn ：root 用户的名称，不一定指向实际存在的条目。可以引用 SASL 用户。
  - `olcRootPW ：<password>`
    - 为 root 用户指定密码。可以指定多个密码。
    - password ：可以是明文密码，也可以是密码的哈希值。
  - `olcAccess: to <what> [ by <who> [<accesslevel>] [<control>] ]+`
    - 允许 what 被 who 访问，分配 accesslevel 级别的权限。
    - 如果不配置 olcAccess ，则默认为 `* by * read` 。
    - 如果用户访问一个对象时没有读取权限，会报错该对象不存在。
    - 在存在多个 olcAccess 规则时，最先匹配的那个会生效。如下，匿名用户会应用第二个 by 规则。
      ```
      olcAccess: {0}to *
                          by self write
                          by anonymous auth
                          by * read
      ```
    - what 的取值示例：
      ```sh
      *           # 所有条目或属性
      dn=<regex>  # 与正则表达式匹配的条目或属性
      ```
    - who 的取值示例：
      ```sh
      *           # 所有用户，包括匿名用户
      anonymous   # 匿名用户
      users       # 通过身份认证的用户
      self        # 目标条目自身的用户
      dn=<regex>  # 与正则表达式匹配的用户
      ```

### 配置密码

1. 生成密码的哈希值：
    ```sh
    root@openldap:/# slappasswd
    New password:                             # 按提示输入密码
    Re-enter new password:
    {SSHA}CZX8qY73ejSEKSyWsKFxpWqSJoyDgCRG    # 它会根据输入的密码生成一个哈希值
    ```

2. 创建一个 .ldif 文件：
    ```ini
    # 替换 {0}config 数据库的 Root 密码
    dn: olcDatabase={0}config, cn=config                # 指定一个要操作的条目
    changetype: modify                                  # 指定操作类型为 modify
    replace: olcRootPW                                  # 指定 modify 类型为 replace ，并指定要操作的属性
    olcRootPW: {SSHA}CZX8qY73ejSEKSyWsKFxpWqSJoyDgCRG   # 采用刚刚生成的哈希值作为密码
    ```

3. 导入 .ldif 文件：
    ```sh
    root@openldap:~# ldapadd -H ldapi:/// -Y EXTERNAL -f 1.ldif
    SASL/EXTERNAL authentication started                                    # 显示的前 3 行表示正在进行 SASL 认证
    SASL username: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth  # 当前 SASL 的用户名
    SASL SSF: 0
    modifying entry "olcDatabase={0}config, cn=config"                      # 正在修改一个条目（操作成功并不会显示反馈，操作失败才会显示报错）

    ```

4. 尝试用新密码查询：
    ```sh
    ldapsearch -x -D "cn=admin,cn=config" -w ****** -b 'cn=config'
    ```

### 配置数据库

1. 创建一个 .ldif 文件：
    ```ini
    # 设置 {1}mdb 数据库的 olcSuffix
    dn: olcDatabase={1}mdb,cn=config
    changetype: modify
    replace: olcSuffix
    olcSuffix: dc=example,dc=org

    # 设置 {1}mdb 数据库的 root 名
    dn: olcDatabase={1}mdb,cn=config
    changetype: modify
    replace: olcRootDN
    olcRootDN: cn=root,dc=example,dc=org

    # 设置 {1}mdb 数据库的 root 密码
    dn: olcDatabase={1}mdb,cn=config
    changetype: modify
    replace: olcRootPW
    olcRootPW:{SSHA}CZX8qY73ejSEKSyWsKFxpWqSJoyDgCRG

    # 设置 {1}mdb 数据库的访问权限
    dn: olcDatabase={1}mdb,cn=config
    changetype: modify
    replace: olcAccess
    olcAccess: {0}to * by dn.exact=gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth manage
      by * break
    olcAccess: {1}to attrs=userPassword,shadowLastChange by self write      # 设置对密码的权限
      by dn="cn=root,dc=example,dc=org" write
      by anonymous auth
      by * none
    olcAccess: {2}to * by self read                                         # 设置对条目的权限
      by dn="cn=root,dc=example,dc=org" write
      by * none
    ```
    TODO ：
    - 这里使用默认创建的 `olcDatabase={1}mdb,cn=config` 数据库，不知道如何创建新的数据库。
    - 上述配置中可以修改 olcRootDN 的名称，但改变默认的 olcSuffix 就会导致查询不到。


2. 导入 .ldif 文件：
    ```sh
    root@openldap:~# ldapadd -H ldapi:/// -Y EXTERNAL -f 1.ldif
    SASL/EXTERNAL authentication started
    SASL username: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth
    SASL SSF: 0
    modifying entry "olcDatabase={1}mdb,cn=config"

    modifying entry "olcDatabase={1}mdb,cn=config"

    modifying entry "olcDatabase={1}mdb,cn=config"

    modifying entry "olcDatabase={1}mdb,cn=config"

    ```

### 导入条目

1. 创建一个 .ldif 文件：
    ```ini
    dn: ou=dev,dc=example,dc=org
    objectClass: organizationalUnit
    ou: dev

    dn: ou=ops,dc=example,dc=org
    objectClass: organizationalUnit
    ou: ops

    dn: cn=LeoHsiao,ou=ops,dc=example,dc=org
    objectClass: person
    cn: LeoHsiao
    sn: Leo
    ```

2. 导入 .ldif 文件：
    ```sh
    root@openldap:~# ldapadd -H ldapi:/// -Y EXTERNAL -f 1.ldif
    SASL/EXTERNAL authentication started
    SASL username: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth
    SASL SSF: 0
    adding new entry "ou=dev,dc=example,dc=org"

    adding new entry "ou=ops,dc=example,dc=org"

    adding new entry "cn=LeoHsiao,ou=ops,dc=example,dc=org"
    ```
