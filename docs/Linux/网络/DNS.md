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

- `/etc/resolv.conf` 文件中配置了 Linux 系统采用的 DNS 服务器：
  ```sh
  nameserver 114.114.114.114
  nameserver 8.8.8.8
  ```

## DNS 缓存

- 程序客户端、下游的 DNS 服务器每次查询 DNS 成功之后，通常会将该 DNS 记录缓存一段时间，避免频繁发出查询请求的耗时。
- 用户在域名注册商处配置 DNS 规则时，可以指定 TTL ，即这条解析规则的有效时长，超时之后应该重新向 DNS 服务器发出查询请求。
  - 每次用户在域名注册商处修改 DNS 规则之后，会在 1s 内同步到因特网上所有权威 DNS 服务器，而不需等待 TTL 。
- DNS 缓存的有效时长不一定与 TTL 一致。
  - Linux 系统默认不会在本地建立 DNS 缓存，可以安装 nscd、dnsmasq 等工具提供 DNS 缓存。
  - Windows 系统默认将所有 DNS 规则缓存 1 天，可以执行 `ipconfig /flushdns` 命令清除缓存。
  - Chrome 浏览器默认将所有 DNS 规则缓存 1 分钟，可以在 `chrome://net-internals/#dns` 页面清除缓存。
