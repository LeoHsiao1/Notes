# OpenWrt

：一个小型的 Linux 发行版，常用于构成路由器的固件，实现丰富的功能。

## opkg

：一个轻量级的包管理工具，常用于路由、交换机等嵌入式设备中。
- 使用的软件安装包的后缀名是 .ipk 。
- 用法：
    ```
    $ opkg
          install <name>.ipk # 安装软件包
          remove <name>.ipk  # 卸载软件包

          update             # 更新可获取的软件包列表
          upgrade            # 升级本机已安装的软件包

          list               # 显示软件包列表
    ```
