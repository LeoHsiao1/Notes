# MinIO

：一个 Web 服务器，提供了对象存储的功能。
- [官方文档](https://docs.min.io/docs/)
- 采用 Golang 语言开发，基于 HTTP 通信。
- 特点：
  - 轻量级，读写速度快，云原生架构。
  - 支持给文件生成 HTTP URL 形式的临时下载链接。
  - 兼容 AWS S3 协议的 API 。
  - 提供了命令行客户端 mc 。
  - 提供了 Python、Go、Java 等语言的客户端库。

## 部署

### 版本

- minio 以日期作为版本号。
- 2022 年，minio 宣布弃用 Gateway 模块、旧的文件系统模式。
  - 旧版本不能兼容升级到 `RELEASE.2022-10-29T06-21-33Z` , 或更高版本。
  - 如果用户想升级到新版 Minio ，只能用 mc 命令从旧版 Minio 导出数据，然后导入新版 minio 。

### 启动

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
        MINIO_CONSOLE_ADDRESS: :9001  # Web 端监听地址
        MINIO_ACCESS_KEY: minioadmin  # 默认账号
        MINIO_SECRET_KEY: minioadmin  # 默认密码

        # MINIO_COMPRESSION_ENABLE: off
          # 将文件存储到磁盘时，是否进行压缩
          # 默认为 off ，因为每次读写压缩文件，会增加 CPU 负载
        # MINIO_COMPRESSION_EXTENSIONS: ".txt, .log, .csv, .json, .tar, .xml, .bin"
          # 启用压缩时，只压缩这些扩展名的文件
      ports:
        - 9000:9000   # API 端口
        - 9001:9001   # Web 端口
      volumes:
        - ./data:/data
  ```

- minio server 有多种部署方案：
  ```yml
  # 在一个主机上，部署一个 server 进程，将数据存储到一个目录
  minio server /mnt/data

  # 在一个主机上，部署一个 server 进程，将数据存储到多个目录。这些目录，通常属于不同硬盘，从而横向扩容 iops
  minio server /mnt/data{1...4}

  # 在多个主机上，执行以下命令，分别部署一个 server 进程，组成一个分布式集群
  minio server http://10.0.0.{1...4}:9000/mnt/data{1...4}
  ```


### 扫描器

- 考虑到 minio 通常用于存储海量文件，因此 minio 不能实时监控所有文件的状态，而是定期扫描一遍所有文件，从而发现各个文件的最新状态。
  - 例如发现某个文件过期了，则自动删除。
  - 例如发现某个文件缺少了部分数据分片或奇偶校验分片，则根据纠错码，修复该文件。
  - 例如用户可以创建 Replication 规则，将当前 Bucket 中匹配 prefix 的文件，复制到另一个 Bucket 。
    - 创建 Replication 规则之后， minio 每次新增一个文件时，会立即检查该文件是否需要复制。
    - 创建 Replication 规则之后， minio 需要扫描一遍现有文件，才能发现各个文件是否需要复制。

- 用户可以在启动 minio 时，声明以下环境变量，从而控制扫描文件的速度：
  ```yml
  MINIO_SCANNER_SPEED: default
  ```
  - 扫描速度为 fastest 时，每扫描一批文件，立即扫描下一批文件。
  - 扫描速度为 fast 时，每扫描一批文件，等待 1 倍的本次扫描时长（最多等待 100ms ），然后扫描下一批文件。
  - 扫描速度为 default 时，每扫描一批文件，等待 2 倍的本次扫描时长（最多等待 1s ），然后扫描下一批文件。
  - 扫描速度为 slow 时，每扫描一批文件，等待 10 倍的本次扫描时长（最多等待 15s ），然后扫描下一批文件。

- 用户可执行以下命令，查看当前扫描文件的速率：
  ```yml
  mc alias set myminio http://127.0.0.1:9000 $ACCESS_KEY $SECRET_KEY
  mc admin scanner info myminio
  ```

### 纠错码

- 如何提高文件存储的可靠性？
  - 传统的文件服务器，大多是将每个文件存储 N 个副本，分散存储在不同硬盘，从而最多容忍 N-1 个硬盘故障。
  - minio 采用一种称为 Reed-Solomon 的纠错码算法：
    - 假设 minio 使用 N 个硬盘，组成一个 Erasure Set 。
    - 用户向 minio 请求写入一个文件时， minio 会将文件分割为 K 个数据分片，并编码出 M 个奇偶校验分片。然后将这些分片，分散存储到不同的硬盘。
      - 用户可以调整 M 的大小，取值范围为 `[0, N/2]` 。
      - minio 会自动计算 `K = N - M` 的数值。这样满足条件 `K + M ≤ N` ，使得各个分片，可以存储到不同的硬盘。
    - 用户向 minio 请求读取一个文件时， minio 会从各个硬盘读取该文件的分片。只要读取 K 个分片（不管是数据分片、奇偶校验分片），就可以解码出一个完整的文件。
      - 因此， minio 最多容忍 `N - K` 个硬盘故障，此时依然可以从其它硬盘读取分片。

- 如何配置纠错码？
  - minio 启动时，会默认给 M 赋值为 N/2 。
    - N 为 1 时， M 等于 0 。
    - N 为 2~3 时， M 等于 1 。
    - N 为 4~5 时， M 等于 2 。
  - 用户可以在启动 minio 时，声明以下环境变量，从而指定 M 的大小：
    ```yml
    MINIO_STORAGE_CLASS_STANDARD: "EC:2"  # 作用于 STANDARD 存储类型的文件
    MINIO_STORAGE_CLASS_RRS: "EC:2"       # 作用于 RRS 存储类型的文件
    ```
  - N 大于 1 时，即使用户将 M 设置为 0 ， minio 依然会将文件分割为 K 个数据分片，分散存储到不同的硬盘。

- 与多副本相比，纠错码（Erasure Code）的效果：
  - 优点：
    - 占用的磁盘空间少，相当于原文件体积的两倍。
  - 缺点：
    - 最多容忍 N/2 个硬盘故障，可用性低于多副本。
    - 增加了 CPU 负载。因为编码、解码奇偶校验分片，都需要 CPU 运算。
    - 增加了磁盘 IOPS 。
      - 用户向 minio 请求写入一个文件时， minio 会写入硬盘 N 次。
      - 用户向 minio 请求读取一个文件时， minio 会读取硬盘 K 次。
    - minio 只有 1 个硬盘时，不能启用纠错码。
    - minio 写入文件到硬盘之后，纠错码就固定了，不允许增加主机或硬盘来横向扩容。
      - 可以清空当前硬盘，然后重新启动 minio 。
      - 可以在当前 Erasure Set 之外，添加其它 Erasure Set 。
  - 例如：
    - 存储冷数据时，推荐使用纠删码，因为占用磁盘少于多副本。
    - 存储热数据，并且是海量小型文件时，不推荐使用纠删码，因为磁盘 IOPS 容易达到瓶颈。

## 用法

- Web 页面示例：

  ![](./MinIO.png)

- 用户可以创建多个 Bucket（存储桶），每个 Bucket 中可以存储多个文件。
  - 每个 Bucket 可设置访问权限为 private 或 public 。
  - Bucket 支持版本控制，存储每个文件的多个版本。
  - Bucket 支持生命周期：每个文件在创建之后，经过多久就算过期，可以被自动删除（但等到扫描时，才会实际删除）。

### 客户端

- 除了访问 minio 的 Web 页面，用户还可以使用 minio 的命令行客户端 mc 。
  - mc 支持 ls、cp、rm、find 等多种 Unix 风格的命令。
  - mc 兼容 AWS S3 协议的 API 。
- 用户可以运行 mc 的 docker 镜像：
  ```sh
  docker run -it --rm --entrypoint bash -v $PWD:$PWD -w $PWD minio/mc:RELEASE.2022-10-29T10-09-23Z
  ```
- 命令语法：
  ```sh
  mc
    alias
          list            # 列出已添加的所有 server 地址
          remove <name>   # 删除一个 server 地址
          set myminio http://10.0.0.1:9000 $ACCESS_KEY $SECRET_KEY # 添加一个 server 地址

    ls <path>       # 显示指定 path 之下的文件列表。如果该 path 不存在，则 mc 命令的输出为空，但返回码依然为 0
      -r            # 递归显示目录
      --versions    # 显示每个文件的所有版本。否则默认只显示最新版本
      --incomplete  # 只显示上传失败的文件

    tree <path>     # 以树形图格式，递归显示指定 path 之下的所有目录
      -f            # 增加显示每个目录下的文件
      --depth <int> # 显示子目录的最大深度

    du <path>       # 统计磁盘占用量

    diff <dir> <dir>  # 比较两个目录下所有文件的差异

    find <path>       # 查找文件
      -name '*'
      --maxdepth <int>
      --newer-than 1d # 筛选 Last Modified 时间距今不超过 1d 的文件。注意 mv 操作也会刷新 Last Modified 时间
      --older-than 1d
      --larger 1G     # 筛选体积大于 1G 的文件
      --smaller 1G

    cp <SRC> <DST>    # 拷贝文件，可以在本机与 server 之间拷贝。比如 cp test/ myminio/bucket1/
      -r              # 递归拷贝目录

    mv <SRC> <DST>    # 移动文件

    rm <path>         # 删除文件
      -r              # 递归删除目录
      --force         # 强制删除。否则如果目录不为空，则不能删除

    mb myminio/bucket1  # 创建 bucket

    rb myminio/bucket1  # 删除 bucket
      --force           # 强制删除。否则如果 bucket 不为空，则不能删除
  ```
  - mc 客户端的配置文件存储在 `~/.mc/` 目录下。
