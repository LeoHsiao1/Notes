# YApi

：一个 API 管理网站，兼容 swagger 文档，且功能更多。
- [GitHub](https://github.com/YMFE/yapi)
- 2018 年由去哪儿网开源。
- 可用于管理大量 API 的文档，方便前后端开发人员联调。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: "3"

  services:
    mongo:
      container_name: mongo
      image: mongo:4.4.10
      restart: unless-stopped
      environment:
        MONGO_INITDB_ROOT_USERNAME: root
        MONGO_INITDB_ROOT_PASSWORD: ******
      networks:
        - net
      volumes:
        - /etc/localtime:/etc/localtime:ro
        - ./data:/data/db

    yapi:
      container_name: yapi
      image: yapipro/yapi:1.9.5
      init: true
      restart: unless-stopped
      command:
        - server/app.js
      networks:
        - net
      ports:
        - 80:80
      volumes:
        - ./config.json:/yapi/config.json

  networks:
    net:
  ```
  - 需要调整挂载目录的权限：
    ```sh
    chown -R 999 data
    ```
  - yapi 的配置文件 config.json 示例：
    ```json
    {
      "port": "80",
      "closeRegister": true,              // 是否禁止新用户注册。目前 yapi 不支持管理员创建用户
      "adminAccount": "admin@test.com",   // 管理员的邮箱地址
      "db": {
        "connectString": "mongodb://mongo:27017/yapi?authSource=admin",
        "user": "root",
        "pass": "******"
      },
      "mail": {
        "enable": true,
        "host": "smtp.gmail.com",
        "port": 465,
        "from": "*",
        "auth": {
          "user": "xxx@test.com",
          "pass": "******"
        }
      }
    }
    ```
  - 初次部署时，需要初始化数据库：
    ```sh
    docker exec -it yapi node server/install.js
    ```
  - 忘记管理员密码时，需要到 MongoDB 中修改密码：
    ```sh
    docker exec -it mongo -u root -p
    use yapi
    db.user.update({'username':'admin'},{$set:{'password':'******'}});
    ```

## 用法

- 支持搜索 API 。
- 支持自动生成 Mock 接口。
  - 当用户调用 Mock 接口时，yapi 会返回一个模拟响应，其中的响应参数是基于 Mock.js 生成的随机值。
  - 用户可以通过两种方式配置 Mock 响应：
    - Mock.js 模板
    - JS 脚本
- 支持创建多个项目。
- 支持给一个项目定义多个配置环境，包括域名、Headers、全局变量。

## Swagger

- Swagger 项目定义了一种接口描述语言，用于编写 HTTP API 的描述文档。
  - 该文档采用 JSON 或 YAML 格式。
  - 该文档容易被程序解析，但不方便供人阅读。
  - 2016 年，Swagger API 规范独立为一个项目，改名为 OpenAPI 。
- Swagger 项目包含多个工具，比如：
  - [swagger-editor](https://github.com/swagger-api/swagger-editor)
    - ：一个静态网站，用于在 Web UI 中编辑 Swagger 文档，并进行实时预览、语法检查。
    - 可自己部署，也可访问官方网站 <https://editor.swagger.io> 。
  - [swagger-ui](https://github.com/swagger-api/swagger-ui)
    - ：一个静态网站，用于在 Web UI 中查看 Swagger 文档。
    - 可自己部署，也可访问官方网站 <https://petstore.swagger.io> 。
    - 支持通过 URL 导入一个文档文件，进行显示。
    - 支持构造 API 的输入参数，测试调用。
  - [swagger-codegen](https://github.com/swagger-api/swagger-codegen)
    - ：一个 Java 程序，用于根据 Swagger 文档，自动生成符合描述的服务器、客户端代码，支持 Java(Spring)、Python(Flask) 等多种语言、框架。
  - Swagger 提供了多种编程语言的插件，支持根据项目代码中符合 swagger 规范的注释，自动生成 Swagger 文档。
- Swagger 文档的部分示例：
  ```yml
  paths:
    /user:                      # API 路径
      post:
        summary: "Add a new user"
        description: ""
        consumes:               # request body 的类型
        - "application/json"
        produces:               # response body 的类型
        - "application/json"
        parameters:             # 输入参数
        - in: "body"            # 参数的位置，是在报文 body 还是 query
          name: "username"
          description: ""
          required: true
          type: "string"
        responses:              # 响应
          "200":
            description: "success"
          "405":
            description: "Invalid input"
  ```
