# MinIO

：一个 Web 服务器，提供了对象存储的功能。
- [官方文档](https://docs.min.io/docs/)
- 采用 Golang 开发，基于 HTTP 通信。
- 特点：
  - 轻量级，读写速度快，云原生架构。
  - 支持生成文件的临时下载链接。
  - 兼容 Amazon S3 的 API 。
  - 提供了命令行客户端 mc ，支持 ls、cp、rm、find 等多种 Unix 风格的命令。
  - 提供了 Python、Go、Java 等语言的客户端库。

## 部署

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:
    elasticsearch:
      container_name: minio
      image: minio/minio:RELEASE.2022-10-24T18-35-07Z
      command:
        - server
        - /data
      environment:
        - MINIO_ACCESS_KEY=admin    # 账号，默认为 minioadmin
        - MINIO_SECRET_KEY=******   # 密码，默认为 minioadmin
        - MINIO_CONSOLE_ADDRESS=:9001
      ports:
        - 9000:9000   # API 端口
        - 9001:9001   # Web 端口
      volumes:
        - ./data:/data
  ```

### 版本

- MinIO 以日期作为版本号。
- 2022 年，MinIO 宣布弃用 Gateway 模块、旧的文件系统模式。旧版本不能兼容升级到 RELEASE.2022-10-29T06-21-33Z, 或更高版本，只能用 mc 命令导出、导入 MinIO 数据。

## 用法

- Web 页面示例：

  ![](./MinIO.png)

- 用户可以创建多个 Bucket（存储桶），每个 Bucket 中可以存储多个文件。
  - 每个 Bucket 可设置访问权限为 private 或 public 。
  - Bucket 支持版本控制，存储每个文件的多个版本。

- MinIO 支持部署多个服务器实例，将一个文件存储多个副本。
  - 基于纠删码（Erasure Code）算法存储数据，即使丢失一半数量的副本，也可以恢复数据。
