# OpenSearch

- 2019 年，AWS 公司创建了 Open Distro for Elasticsearch 项目，通过给 ES、Kibana 的 OSS 版安装一些插件，实现 x-pack 的功能。
  - 与 x-pack 的功能、配置有些小差异，这是为了回避 Elastic 公司的版权。
- 2021 年，ES、Kibana 软件从 v7.11 版本开始，将开源协议从 Apache V2 改为 SSPL 。
  - SSPL 是一种未被 OSI（Open Source Initiative）组织认可的开源协议，禁止用户将该软件作为服务出售，除非购买商业许可证。
  - 对此，AWS 公司宣布从 ES、Kibana 分叉出 [OpenSearch](https://opensearch.org) 项目，取代之前的 Open Distro for Elasticsearch 项目，采用 Apache V2 开源协议。主要发布了以下软件：
    - [OpenSearch](https://github.com/opensearch-project/OpenSearch) ：对标 ES 。
    - [OpenSearch-Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards) ：对标 Kibana 。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    opensearch:
      container_name: opensearch
      image: opensearchproject/opensearch:2.6.0
      restart: unless-stopped
      ports:
        - 9200:9200
      volumes:
        - ./config:/usr/share/opensearch/config
        - ./data:/usr/share/opensearch/data
  ```
  ```yml
  version: '3'

  services:
    opensearch_dashboards:
      container_name: opensearch_dashboards
      image: opensearchproject/opensearch-dashboards:2.6.0
      restart: unless-stopped
      ports:
        - 5601:5601
      volumes:
        - ./config:/usr/share/opensearch-dashboards/config
        - ./data:/usr/share/opensearch-dashboards/data
  ```
  - 容器内以非 root 用户运行服务，需要调整挂载目录的权限：
    ```sh
    mkdir -p data
    chown -R 1000 .
    ```

## 配置

- elasticsearch.yml 的配置示例：
  ```yml
  cluster.name: cluster-1
  discovery.type: single-node
  node.name: node-1
  network.host: 0.0.0.0
  network.publish_host: 10.0.0.1

  compatibility.override_main_response_version: true  # 提供 version.number ，且固定为 7.10.2 ，从而与其它客户端软件兼容
  ```

- opensearch_dashboards.yml 的配置示例：
  ```yml
  server.port: 5601
  server.host: 0.0.0.0
  server.name: opensearch_dashboards

  opensearch.hosts: ['https://10.0.0.1:9200']  # 连接 ES 时采用 HTTPS 协议
  opensearch.ssl.verificationMode: none        # 不验证 ES 的 SSL 证书是否有效
  opensearch.username: kibanaserver
  opensearch.password: ******
  opensearch.requestHeadersWhitelist: [securitytenant,Authorization]

  opensearch_security.cookie.secure: false        # 当前端采用 HTTPS 时启用它
  opensearch_security.cookie.ttl: 86400000        # cookie 的有效期，单位 ms ，默认为 1 小时
  opensearch_security.session.ttl: 86400000       # session 的有效期，超时则需要用户重新登录。默认为 1 小时
  ```

- 让 Logstash 输出到 OpenSearch 的方法：
  1. 在 Logstash 中安装插件：
      ```sh
      logstash-plugin install logstash-output-opensearch
      ```
  2. 将 Logstash 的输出端从 elasticsearch 改名为 opensearch ：
      ```ruby
      opensearch {
          hosts => ["http://10.0.0.1:9200"]
          ...
      }
      ```

### Security 插件

- 默认启用了 Security 插件，但还需要在 elasticsearch.yml 中加入配置：
  ```yml
  # plugins.security.disabled: false
  plugins.security.ssl.transport.pemcert_filepath: admin.pem            # SSL 证书文件。必须在 config 目录下，使用相对路径
  plugins.security.ssl.transport.pemkey_filepath: admin-key.pem         # SSL 私钥
  plugins.security.ssl.transport.pemtrustedcas_filepath: root-ca.pem    # SSL 根证书
  plugins.security.ssl.transport.enforce_hostname_verification: false   # 是否验证主机名
  plugins.security.ssl.http.enabled: true                               # 是否让 ES 监听 HTTPS 端口
  plugins.security.ssl.http.pemcert_filepath: admin.pem
  plugins.security.ssl.http.pemkey_filepath: admin-key.pem
  plugins.security.ssl.http.pemtrustedcas_filepath: root-ca.pem
  plugins.security.allow_unsafe_democertificates: true
  plugins.security.allow_default_init_securityindex: true
  plugins.security.authcz.admin_dn:               # 将使用指定证书的客户端视作管理员
    - CN=ADMIN,OU=UNIT,O=ORG,L=TORONTO,ST=ONTARIO,C=CA
  plugins.security.audit.type: internal_opensearch
  plugins.security.enable_snapshot_restore_privilege: true
  plugins.security.check_snapshot_restore_write_privileges: true
  plugins.security.restapi.roles_enabled: ["all_access", "security_rest_api_access"]
  plugins.security.system_indices.enabled: true
  plugins.security.system_indices.indices: [".opendistro-alerting-config", ".opendistro-alerting-alert*", ".opendistro-anomaly-results*", ".opendistro-anomaly-detector*", ".opendistro-anomaly-checkpoints", ".opendistro-anomaly-detection-state", ".opendistro-reports-*", ".opendistro-notifications-*", ".opendistro-notebooks", ".opendistro-asynchronous-search-response*"]
  ```
  - 需要用 openssl 生成 SSL 自签名证书：
    ```sh
    # 为网站生成 SSL 自签名证书
    openssl genrsa -out root-ca-key.pem 2048
    openssl req -new -x509 -sha256 -key root-ca-key.pem -subj "/C=CA/ST=ONTARIO/L=TORONTO/O=ORG/OU=UNIT/CN=ROOT" -out root-ca.pem -days 730

    # 为管理员生成证书
    openssl genrsa -out admin-key-temp.pem 2048
    openssl pkcs8 -inform PEM -outform PEM -in admin-key-temp.pem -topk8 -nocrypt -v1 PBE-SHA1-3DES -out admin-key.pem
    openssl req -new -key admin-key.pem -subj "/C=CA/ST=ONTARIO/L=TORONTO/O=ORG/OU=UNIT/CN=ADMIN" -out admin.csr
    openssl x509 -req -in admin.csr -CA root-ca.pem -CAkey root-ca-key.pem -CAcreateserial -sha256 -out admin.pem -days 730

    # 删除不用的文件
    rm -f root-ca-key.pem root-ca.srl
    rm -f admin.csr admin-key-temp.pem
    ```

- 当 ES 初次启动时，Security 插件会进行初始化：
  - 读取 `/usr/share/opensearch/plugins/opensearch-security/securityconfig/` 目录下的各个配置文件，随后一直将自身的数据存储在 ES 的名为 .opendistro_security 的索引中。
  - 根据 internal_users.yml 文件创建内部用户数据库，包含多个用户。

- 如果想修改 Security 插件的配置，需要先使用 securityadmin.sh 从 ES 下载运行时的配置信息，修改之后再上传。如下：
  ```sh
  bash plugins/opensearch-security/tools/securityadmin.sh \
      # -h localhost \              # ES 的地址
      -backup tmp/ \                # 下载配置文件到该目录（会下载全部类型的配置文件）
      # -cd tmp/ \                  # 上传该目录下的配置文件（该目录下必须包含全部类型的配置文件）
      -icl \                        # 忽略 ES 集群的名称
      -nhnv \                       # 不验证 SSL 证书是否有效
      -cacert config/root-ca.pem \
      -cert config/admin.pem \
      -key config/admin-key.pem
  ```

### 用户

- Security 插件支持多种认证后端，比如内部用户数据库（Internal users Database）、LDAP、Kerberos 等。
  - 如果启用了多个后端，当用户登录时，会依次尝试用各个后端进行身份认证，直到有一个认证成功，或者全部认证失败。

- 可以通过 HTTP Basic Auth 方式进行身份认证：
  ```sh
  curl -u admin:admin --insecure https://127.0.0.1:9200/_cat/indices
  ```

- admin、kibanaserver 两个用户是保留的（Reserved），不允许在网页上修改，只能在 internal_users.yml 中修改。步骤如下：
  1. 使用 ES 自带的脚本，生成密码的哈希值：
      ```sh
      docker exec -it elasticsearch bash plugins/opensearch-security/tools/hash.sh
      ```
  2. 修改 internal_users.yml 中的用户密码哈希值：
  3. 让 Security 插件应用新的配置：
      - 可以清空 ES 挂载的 data 目录，再重新启动容器，让 Security 插件重新初始化。
      - 或者使用 securityadmin.sh 脚本上传配置文件。
  4. 更新 opensearch_dashboards.yml 等文件中使用的用户密码。

- 其他用户，比如 kibanaro、logstash ，都可以在网页上修改自己的密码。
  - 每个用户的初始密码与用户名相同。为了安全，应该都更新密码。
  - admin 用户有权限查看 Security 插件的配置页面，管理所有用户。

### 角色

- Security 插件根据角色（Roles）控制每个用户的访问权限。
- 创建一个角色时，可以配置该角色有权访问哪些资源。
  - 可以限制访问的索引，还可以筛选可见的文档、字段，可以根据用户的属性值控制权限。
- 创建角色之后再点击查看它的 Mapped users 选项卡，配置它映射（Map）到哪些用户或后端角色。
  - 编辑用户时，可以选择将该用户映射到 LDAP 等外部后端中的后端角色（Backend Roles），便于批量管理。
  - 如果一个用户映射了多个角色，权限较少的角色可能会覆盖权限较多的角色。
  - 修改了角色权限之后，用户要重新登录才会生效。

### 权限

- 权限（Permissions）：表示允许某种操作，比如 `cluster:monitor/health`、`indices:data/read/get` 。
- 还可以定义动作组（Action Group），包含一组权限或动作组。
- 创建普通角色时，可以只分配以下权限：
  - 对集群 cluster 没有权限
  - 对索引 .kibana* 的 read 权限（read 包括 get、mget、search）
  - 对索引 logstash* 的 read 权限，可以筛选可见的文档、字段
  - 对 Global tenant 的 Read only 权限

### 租户

- 租户（tenant）：一种命名空间，用于独立保存索引模式、可视化、仪表盘等配置。
- 每个用户在登录之后，需要选用一个租户，并可以随时切换租户。
- 可以控制一个用户有权读取、修改哪些租户。
- 默认创建了两个特殊租户：
  - Global ：一个全局唯一的租户，被所有用户共享，可以同时修改。
  - Private ：每个用户都会创建一个私有租户，不会被其它用户看到。
- opensearch_dashboards.yml 的相关配置：
  ```yml
  opensearch_security.multitenancy.enabled: true                            # 是否启用多租户功能
  opensearch_security.multitenancy.tenants.preferred: ["Private", "Global"] # 默认显示的租户顺序
  # opensearch_security.multitenancy.tenants.enable_global: true            # 是否启用 Global 租户
  # opensearch_security.multitenancy.tenants.enable_private: true
  ```

### ISM

：索引状态管理（Index State Management），是一些自动管理索引的策略，对标 ES 社区版的 ILM 功能。
- ISM 策略给索引定义了多个状态（state）。
  - 索引同时只能处于一个状态。
  - 每个状态的主要内容：
    - actions ：该状态需要执行的一组动作。
    - transitions ：控制如何切换到下一个状态。
- 默认每隔 5 分钟执行一次所有 ISM 策略。
  - 每个执行周期，只会执行 ISM 策略中的一个步骤，然后暂停执行，等待下一个执行周期。

- 创建一个 ISM 策略之后，其工作步骤如下：
  1. 初始化 ISM 策略，让索引进入初始状态。
  2. 根据索引所处的状态，按顺序执行 actions 。
  3. 根据索引所处的状态，执行 transitions 条件。
     - 如果满足条件则切换到下一个状态，从第 2 步开始重复。
     - 如果不满足，则从第 3 步开始重复。

- 例：创建一个 ISM 策略
  ```json
  {
      "policy": {
          "description": "管理一般的日志索引",
          "ism_template": {
              "index_patterns": ["logstash*", "filebeat*"], // 指定一些索引模式，被该 ISM 策略管理
              // "priority": 100                            // 优先级，默认为 0 。如果一个索引匹配多个 ISM ，则采用优先级最高的那个
          },
          "default_state": "creat",                         // 执行该 ISM 策略时，索引的初始状态
          "states": [{                                      // 定义状态列表
                  "name": "creat",                          // 一个状态的名称
                  "actions": [{
                      "replica_count": {                    // 执行内置的 replica_count 动作，用于设置 replica shard 的数量
                          "number_of_replicas": 0
                      }
                      // "timeout": "1h",                   // 执行该动作的超时时间
                      // "retry": {                         // 执行该动作失败时进行重试
                      //    "count": 3,                     // 最多重试几次
                      //    "delay": "10m"                  // 每次延迟一定时长再重试，默认为 1m
                      // }
                  }],
                  "transitions": [{                         // 如果满足 conditions 条件，就切换到指定状态
                      "state_name": "keep",
                      // "conditions": {}                   // 如果省略条件，则会立即切换
                  }]
              },
              {
                  "name": "keep",
                  "actions": [],
                  "transitions": [{
                      "state_name": "delete",
                      "conditions": {
                          "min_index_age": "30d"            // 如果索引创建之后超过一定时长，则删除索引
                      }
                  }]
              },
              {
                  "name": "delete",
                  "actions": [{
                      "delete": {}
                  }],
                  "transitions": []
              }
          ]
      }
  }
  ```
  - 创建 ISM 策略之后，会在每个索引创建时根据 index_patterns 自动应用，但不会影响已存在的索引，需要手动应用。
  - 当索引已经应用 ISM 策略之后，修改 ISM 策略并不会生效，需要移除策略，再重新应用。
