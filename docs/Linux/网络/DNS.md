# DNS

## DNS 配置

Linux 系统会读取如下三处 DNS 配置，它们的优先级从高到低：
- `/etc/hosts` 文件中配置了静态 DNS 路由：
  ```sh
  127.0.0.1   localhost localhost4
  ::1         localhost localhost6
  ```
  - 每行一条 DNS 路由规则，格式为 `<ip>  <hostname>...` 。
  - 如果一个主机名同时匹配多条 DNS 规则，则采用第一条匹配的。
  - 主机名中不支持使用通配符。

- `/etc/sysconfig/network-scripts/ifcfg-eth0` 文件中配置了网卡 eth0 采用的 DNS 服务器：
  ```sh
  DNS1=202.96.134.133
  DNS2=202.96.128.166
  DNS3=202.96.128.86
  DNS4=114.114.114.114
  ```
  - 修改网络配置之后需要重启 network 服务：`systemctl restart network`

- `/etc/resolv.conf` 文件保存了本机的 DNS 配置：
  ```sh
  nameserver 114.114.114.114
  nameserver 8.8.8.8
  search test.com openstacklocal
  options ndots:1 timeout:1 attempts:1 rotate
  ```
  - nameserver ：指定一个 DNS 服务器，最多可以指定三个。
    - 查询一个域名时，同时只能向一个 nameserver 发出 DNS 请求。如果超时未响应，则向下一个 nameserver 发出 DNS 请求。
  - search ：指定多个搜索域。
    - 比如查询域名 host1 时，会准备多个可能的域名，依次尝试解析：
      ```sh
      host1
      host1.test.com
      host1.openstacklocal
      ```
      - 如果某个域名解析成功，则立即结束查询。如果所有域名都解析失败，则查询失败。
      - 尝试解析每个域名时，会按 IPv4、IPv6 分别发出两个 DNS 请求。
      - 综上，查询一个域名时，最好指定完整域名，从而减少 DNS 请求数。
  - options ：指定一些额外配置。
    - ndots ：默认为 1 。如果原域名中的 . 点数小于 ndots ，则先尝试解析 search 域名，然后尝试解析原域名。否则先尝试解析原域名。
      - 比如查询域名 www.host1 时，其点数为 1 。（这里不考虑根域名 . ）
    - timeout ：发出 DNS 请求之后，等待响应的超时时间。单位为秒，默认为 5 。
    - attempts ：如果所有 nameserver 都查询失败，则重新请求所有 nameserver ，这样最多遍历 attempts 次。默认为 2 。
    - rotate ：循环使用各个 nameserver 。默认禁用，此时每个 DNS 请求都优先使用第一个 nameserver 。

## DNS 缓存

- 程序客户端、下游的 DNS 服务器每次查询 DNS 成功之后，通常会将该 DNS 记录缓存一段时间，避免频繁发出查询请求的耗时。
- 用户在域名注册商处配置 DNS 规则时，可以指定 TTL ，即这条解析规则的有效时长，超时之后应该重新向 DNS 服务器发出查询请求。
  - 每次用户在域名注册商处修改 DNS 规则之后，会在 1s 内同步到因特网上所有权威 DNS 服务器，而不需等待 TTL 。
- DNS 缓存的有效时长不一定与 TTL 一致。
  - Linux 系统默认不会在本地建立 DNS 缓存，可以安装 nscd、dnsmasq 等工具提供 DNS 缓存。
  - Windows 系统默认将所有 DNS 规则缓存 1 天，可以执行 `ipconfig /flushdns` 命令清除缓存。
  - Chrome 浏览器默认将所有 DNS 规则缓存 1 分钟，可以在 `chrome://net-internals/#dns` 页面清除缓存。

## 相关命令

### dig

：一个命令行工具，用于 DNS 查询。
- 安装：`yum install bind-utils`
- 命令：
  ```sh
  dig [name] [type]
      @<ip>     # 指定 DNS 服务器的地址。默认采用 /etc/resolv.conf
      -p 53     # 指定 DNS 服务器的端口
      -x <ip>   # 反向查询与一个 IP 关联的域名

      +short    # 只显示查询结果。默认会显示详细信息
  ```
  - type 表示 DNS 记录的类型，默认为 A 。

- 例：
  ```sh
  [root@CentOS ~]# dig baidu.com +short
  220.181.38.251
  220.181.38.148
  ```
