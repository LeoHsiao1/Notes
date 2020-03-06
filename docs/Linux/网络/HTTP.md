# HTTP

## curl

：一个与网络服务器通信的工具，基于 libcurl 库，支持 HTTP、HTTPS、FTP、SMTP 等多种协议，功能丰富。

用法：
```sh
$ curl <URL>...                    # 访问指定网址（默认为 GET 方法），并将网页内容打印到 stdout 上
       -O                          # 下载该文件并保存到当前目录
       -o <path>                   # 下载该文件并保存到指定路径（目标路径必须已存在）
       -k                          # 允许不验证网站证书就连接到 HTTPS 网站
       -u <user>[:password]        # 发送用户名，或者用户名加密码

       -I                          # 只显示 response header
       -L                          # 跟随重定向
       -v                          # 显示通信过程的具体信息
       --connect-timeout 3         # 连接上 Web 服务器的超时时间（单位为秒）
       -m 10                       # 整个操作的超时时间（单位为秒）

       -x [PROTOCOL://]HOST[:PORT] # 使用代理服务器
       -X POST                     # 使用指定类型的 HTTP 方法
       -H "Connection: Keep-Alive" # 加上 header（可以重复使用该命令选项）
       -b "name=leo"               # 加上 cookies
       -d "id=001&name=leo"        # 加上 POST data（默认为 application/x-www-form-urlencoded 格式）
```
- 如果 URL 包含特殊字符，则要用双引号包住。
- 也可以用 curl ip:port 测试网络端口能否连通。

## wget

：一个从网络服务器下载文件的工具，只支持 HTTP、HTTPS、FTP 协议。

用法：
```sh
$ wget <URL>...               # 下载指定网址的文件，并自动保存为当前目录下的文件或目录
       -b                     # 后台下载
       -O f1.zip              # 保存为指定文件
       -P d1                  # 保存到指定目录下
       --spider               # 不下载文件，可用于检测该网址是否有效
       -t 10                  # 设置下载失败时的重试次数（0 是无限次）
       --limit-rate=300k      # 限制下载速度
       --no-check-certificate # 不检查 HTTPS 网址的证书
```
- `wget URL` 相当于 `curl -O URL` 。
- 例：爬取网页
    ```sh
    wget -e robots=off -r -np -p -k <网址>
         -e robots=off # 忽略 robot 协议
         -r            # 递归下载该目录下的所有文件
         -np           # 递归下载时不遍历上层目录
         -p            # 下载显示在网页中的所有文件
         -k            # 将网页中的绝对链接改为本地链接
    ```
