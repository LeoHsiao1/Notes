# Nextcloud

：一个开源的对象存储服务器软件，很轻量级。
- 提供了 Web 页面，支持创建分享链接。
- 提供了命令行客户端 `mc` ，和 Python、Go、Java 等语言的 SDK 。
- 与 Amazon S3 云存储兼容。
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

## 用法

- Web 页面示例：
  ![](./MinIO.png)

- 先创建 Bucket（存储桶），然后可以上传任意个文件到其中。
- Bucket 可以启用版本控制。
