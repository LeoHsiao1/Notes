# Open Distro

- ELK 系统的普通发行版称为 OSS ，收费版本称为 X-Pack 。
  - Elastic 公司加大了商业化的程度，逐渐对软件的部分功能收费，导致 OSS 版缺少一些重要功能，比如身份认证、用户权限控制、告警。
- 2019 年，AWS 公司创建了 Open Distro for Elasticsearch 项目，通过给 ES、Kibana 软件安装一些插件，以完全开源的方式扩展其功能。
  - [官方文档](https://opendistro.github.io/for-elasticsearch-docs/)
  - 功能、配置有些小差异，这是为了回避 Elastic 公司的版权。
- 2021 年初，Elastic 公司宣布从 v7.11 版本开始，将 ES、Kibana 项目的开源协议从 Apache V2 改为 SSPL 。
  - SSPL 是一种未被 OSI（Open Source Initiative）组织认可的开源协议，禁止用户将该软件作为服务出售，除非购买商业许可证。
  - 对此，AWS 公司宣布分叉 ES、Kibana 项目并独立维护，采用 Apache V2 开源协议。

## 部署

- 可以部署 Open Distro 整合版，也可以给普通的 ES、Kibana 软件安装一些 Open Distro 插件（这需要考虑版本兼容性）。
- 用 docker-compose 部署整合版：
  ```yml
  version: '3'

  services:
    elasticsearch:
      image: amazon/opendistro-for-elasticsearch:1.13.0
      container_name: elasticsearch
      network_mode:
        host            # 使用宿主机的网卡，以便绑定宿主机的对外 IP
      volumes:
        - ./elasticsearch/data:/usr/share/elasticsearch/data
      #  - ./elasticsearch/config:/usr/share/elasticsearch/config
      ulimits:
        memlock:
          soft: -1
          hard: -1
        nofile:
          soft: 65536
          hard: 65536

    kibana:
      image: amazon/opendistro-for-elasticsearch-kibana:1.13.0
      container_name: kibana
      depends_on:
        - elasticsearch
      ports:
        - 5601:5601
      volumes:
       - ./kibana/data:/usr/share/kibana/data
      # - ./kibana/config:/usr/share/kibana/config
  ```
  - 容器内以非 root 用户运行服务，对于挂载目录可能没有访问权限，需要先在宿主机上修改文件权限：
    ```sh
    mkdir -p elasticsearch/data elasticsearch/config kibana/data kibana/config
    chown -R 1000 elasticsearch kibana
    ```
  - 先不挂载配置目录，启动一次。然后将容器内的 config 目录拷贝出来（包含了自动生成的 pem 文件），修改之后再挂载配置目录，重新启动容器。

## 配置

- elasticsearch.yml 的配置示例：
  ```yml
  cluster.name: cluster-log
  node.name: node-1

  network.host: 10.0.0.1
  http.port: 9200
  transport.port: 9300

  discovery.seed_hosts:
    - localhost:9300

  cluster.initial_master_nodes:
    - node-1

  opendistro_security.ssl.http.enabled: true      # HTTP 通信时是否启用 SSL（TCP 通信时必须启用，不支持关闭）
  ...
  ```

- kibana.yml 的配置示例：
  ```yml
  server.port: 5601
  server.host: '0.0.0.0'
  server.name: 'kibana'

  elasticsearch.hosts: ['https://10.0.0.1:9200']  # 连接 ES 时采用 HTTPS 协议
  elasticsearch.ssl.verificationMode: none        # 不验证 ES 的 SSL 证书是否有效
  elasticsearch.username: kibanaserver
  elasticsearch.password: kibanaserver
  elasticsearch.requestHeadersWhitelist: ["securitytenant","Authorization"]

  ...
  ```

## Security 插件

默认启用了 Security 插件。
- 它会在初始化 ES 时读取一次 `/usr/share/elasticsearch/plugins/opendistro_security/securityconfig/` 目录下的各个配置文件，随后一直将自身的数据存储在 ES 中名为 .opendistro_security 的索引中。
- 如果想修改 Security 插件的配置，应该先使用 securityadmin.sh 从 ES 下载配置文件，修改之后再上传。如下：
  ```sh
  bash plugins/opendistro_security/tools/securityadmin.sh \
      -backup tmp/ \                                        # 下载配置文件到该目录（会下载全部类型的配置文件）
      # -cd plugins/opendistro_security/securityconfig/ \   # 上传该目录下的配置文件（该目录下必须包含全部类型的配置文件）
      -icl \                                                # 忽略 ES 集群的名称
      -nhnv \                                               # 不验证 SSL 证书是否有效
      -cacert config/root-ca.pem \                          # 使用 root 用户的 SSL 证书
      -cert config/kirk.pem \
      -key config/kirk-key.pem
  ```

### 用户

- Security 插件支持多种认证后端，比如内部用户数据库（Internal users Database）、LDAP、Kerberos 等。
  - 如果启用了多个后端，当用户登录时，会依次尝试用各个后端进行身份认证，直到认证成功，或者全部认证失败。
- 初始化 ES 时，Security 插件会根据 internal_users.yml 文件创建内部用户数据库，包含多个用户。
- 每个用户的初始密码等于用户名。
- 可以按 HTTP Basic Auth 的方式进行用户认证，如下：
  ```sh
  curl -u admin:admin --insecure https://127.0.0.1:9200/_cat/indices
  ```
- admin、kibanaserver 两个用户是保留的（Reserved），不允许修改，只能在 internal_users.yml 中修改。步骤如下：
  1. 使用 ES 自带的脚本，生成密码的哈希值：
      ```sh
      docker exec -it elasticsearch bash plugins/opendistro_security/tools/hash.sh
      ```
  2. 修改 internal_users.yml 中的用户密码哈希值：
  3. 让 Security 插件应用新的配置：
      - 可以清空 ES 挂载的 data 目录，再重新启动容器，让 Security 插件重新初始化。
      - 或者使用 securityadmin.sh 脚本上传配置文件。
  4. 更新 kibana.yml 等文件中使用的用户密码。

- kibanaro、logstash、readall、snapshotrestore 用户可以在 Kibana 的网页上修改自己的密码。
  - 为了安全，应该都改为新的密码。
  - admin 用户才有权限在 Kibana 上查看 Security 插件的配置页面，管理所有普通用户。

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
- 为了简化用户的操作，建议在 kibana.yml 中修改配置，只使用 Global 租户：
  ```yml
  opendistro_security.multitenancy.enabled: true                    # 启用租户功能
  opendistro_security.multitenancy.tenants.enable_global: true      # 启用 Global 租户
  opendistro_security.multitenancy.tenants.enable_private: false    # 禁用 Private 租户
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
