# MinIO

：一个 Web 服务器，提供了对象存储的功能。
- [官方文档](https://docs.min.io/docs/)
- 采用 Go 开发，基于 TCP 通信。
- 特点：
  - 轻量级，读写速度快，云原生架构。
  - 支持生成文件的下载链接。
  - 提供了命令行客户端 `mc` ，支持 ls、cp、rm、find 等多种 Unix 风格的命令。
  - 提供了 Python、Go、Java 等语言的 SDK 。
  - 兼容 Amazon S3 的 API 。

## 部署

- 用 Docker 部署：
  ```sh
  docker run -d -p 9000:9000 \
          --name minio \
          -e "MINIO_ACCESS_KEY=admin" \     # 账号
          -e "MINIO_SECRET_KEY=******" \    # 密码
          -v /opt/minio:/data \
          minio/minio server /data
  ```

## 用法

- Web 页面示例：

  ![](./MinIO.png)

- 用户可以创建多个 Bucket（存储桶），每个 Bucket 中可以存储多个文件。
  - 每个用户拥有一个独立的存储空间，用户之间不支持分享文件。
  - 默认只有一个用户。
- Bucket 可以启用版本控制。
- 基于纠删码（Erasure Code）算法存储数据，即使丢失 N/2 个硬盘，也可以恢复数据。
