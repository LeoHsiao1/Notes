# Nextcloud

：一个开源的对象存储服务器软件，基于 Go 开发。
- 很轻量级，读写速度快，云原生架构。
- 提供了 Web 页面，支持创建分享链接。
- 提供了命令行客户端 `mc` ，支持 ls、cp、rm、find 等多种 Unix 风格的命令。
- 提供了 Python、Go、Java 等语言的 SDK 。
- 兼容 Amazon S3 的 API 。
- [官方文档](https://docs.min.io/docs/)

## 部署

- 运行 Docker 镜像：
  ```sh
  docker run -d -p 9000:9000 \
          --name minio \
          -e "MINIO_ACCESS_KEY=admin" \     # 账号
          -e "MINIO_SECRET_KEY=******" \    # 密码
          -v /opt/minio:/data \
          minio/minio server /data
  ```

## 原理

- Web 页面示例：
  ![](./MinIO.png)

- 用户可以创建多个 Bucket（存储桶），每个 Bucket 中可以存储多个文件。
  - 每个用户拥有一个独立的存储空间，用户之间不支持分享文件。
  - 默认只有一个用户。
- Bucket 可以启用版本控制。
- 基于纠删码（Erasure Code）算法存储数据，即使丢失 N/2 个硬盘，也可以恢复数据。
