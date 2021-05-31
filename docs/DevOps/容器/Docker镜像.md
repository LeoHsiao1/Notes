# Docker 镜像

- 每个镜像有两种标识符：
  - `image ID` ：由 dockerd 随机分配的编号。
  - `imageName:tag` ：镜像名与标签的组合，由用户自定义，通常将 tag 用于表示镜像的版本号。
- dockerd 使用的镜像都存储在宿主机上，也可以将镜像存储到镜像仓库服务器中。
  - 默认使用的是官方的镜像仓库 hub.docker.com ，也可以使用自己搭建的仓库服务器，比如 harbor 。
- 悬空镜像（dangling images）：一些只有 ID 的镜像，没有镜像名和标签（而是名为 `<none>:<none>` ），也没有被容器使用。

## 查看

```sh
docker image
            ls              # 显示本机的镜像（默认不显示悬空镜像）。等价于 docker images 命令
                -a          # 显示所有的镜像
            rm <image>...   # 删除镜像（只能删除未被容器使用的）
            prune           # 删除所有悬空镜像
                -a          # 删除所有未被容器使用的镜像
```

## 拉取

```sh
docker
      pull    <imageName>:<tag>     # 从镜像仓库拉取镜像
      push    <imageName>:<tag>     # 推送镜像到镜像仓库
      search  <imageName>           # 在镜像仓库中搜索某个镜像
      login -u leo tencentyun.com   # 使用一个用户名登录一个镜像仓库（然后会提示输入密码）
      tag <image> <imageName>:<tag> # 给镜像加上名称和 tag ，可以多次添加
```
- docker pull 时，如果不注明镜像的 tag ，则默认拉取 latest 版本。
  - 尽量不要拉取 latest 版本，否则在不同时间拉取的 latest 版本可能不一样。

## 导出

- Docker 镜像由一层或多层文件系统组成，在宿主机上存储为一些零散的文件。
- 可以将镜像导出成压缩包：
  ```sh
  docker save -o images.tar <image>...        # 将镜像打包成 tar 文件
  docker save <image>... | gzip > images.tgz  # 打包并压缩

  docker load -i images.tar                   # 导入镜像
  ```
- 例：
  ```sh
  [root@Centos ~]# docker save -o nginx.tar nginx:latest
  [root@Centos ~]# ls -lh
  total 131M
  -rw-------. 1 root root 131M Mar 28 16:04 nginx.tar
  [root@Centos ~]# tar -tf nginx.tar
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/           # 每个目录对应一层 layer
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/VERSION
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/json
  28d499c51144128e64b6ffefa6c714bbfaf3e55772b080d1b0636f1971cb3203/layer.tar  # layer 包含的文件
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/VERSION
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/json
  40aef34ac16b8c7eee6da1869452f5c9b9963ab583415d4999565738c719ded9/layer.tar
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/VERSION
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/json
  456351a127e9a9ce4cc79f7f6ad9f401d1714e514780f1603fa0b263119e329b/layer.tar
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/VERSION
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/json
  9000127bc2e7878a10491bb7a16a4b5874e4bdf6a01952d14211fad55defdd0a/layer.tar
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/VERSION
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/json
  b526b761d738d1fba0774ea5af56ae1e664c812c6ce75743d74773cb3867bf7b/layer.tar
  b8cf2cbeabb915843204ceb7ef0055fecadd55c2b0c58ac030e01fe75235885a.json
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/VERSION
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/json
  c0b073121bb2a6106dae6af85ade7274253f26626661e6e3cb20b0fa7fb59475/layer.tar
  manifest.json                                                               # 镜像的配置文件，记录了镜像名、各个 layer 的位置
  repositories
  ```

## 制作

制作 Docker 镜像的方法主要有两种：
- 将一个容器提交为镜像：
    ```sh
    docker commit <container> <imageName>:<tag>
    ```
  - 每次 commit 时，会在原镜像外部加上一层新的文件系统。因此 commit 次数越多，镜像的体积越大。

- 编写 Dockerfile 文件，然后基于它构建镜像：
    ```sh
    docker build <dir_to_Dockerfile> -t <imageName:tag>
                --build-arg VERSION="1.0"   # 传入构建参数给 Dockerfile
                --target  <stage>           # 构建到某个阶段就停止
                --network <name>            # 设置 build 过程中使用的网络
                --no-cache                  # 构建时不使用缓存
    ```
  - 例：
    ```sh
    docker build . -t centos:v1.0 --network host
    ```
  - 执行 docker build 命令时，会将 Dockerfile 所在目录及其子目录的所有文件作为构建上下文（build context），拷贝发送给 dockerd ，从而允许用 COPY 或 ADD 命令拷贝文件到容器中。
    - 可以在 `.dockerignore` 文件中声明不想被发送的文件。
