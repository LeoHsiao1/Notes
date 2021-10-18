# YApi

：一个 API 管理网站，兼容 swagger 文档，且功能更多。
- [GitHub](https://github.com/YMFE/yapi)
- 2018 年由去哪儿网开源。
- 在开发项目时，可用它管理大量 API 的文档，方便前后端开发人员联调。
- 支持搜索 API 、分组管理。
- 支持创建项目、配置环境。
- 支持创建用户，划分权限。



## Swagger

- Swagger 项目定义了一种接口描述语言，用于编写 HTTP API 的描述文档。
  - 该文档容易被程序解析，但不方便供人阅读。
  - 该文档采用 JSON 或 YAML 格式。
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
  - Swagger 提供了多种编程语言的代码库，支持根据项目代码中符合 swagger 规范的注释，自动生成 Swagger 文档。
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
        # security:
        # - user_auth:
        #   - "write:user"
  ```





