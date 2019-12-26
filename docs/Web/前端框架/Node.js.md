# Node.js

：一个JavaScript运行环境，基于Chrome V8 引擎，用于在服务器上运行JS代码。

用途：
- 构建前端文件。
- 运行后端程序。
- 作为中间层，接收前端的访问请求，然后转发给真正的后端服务器。

## 安装

```shell
node_version=node-v12.13.0-linux-x64
curl -O https://nodejs.org/dist/v12.13.0/${node_version}.tar.xz
tar -xvf ${node_version}.tar.xz -C /usr/local
rm -f ${node_version}.tar.xz
ln -s /usr/local/${node_version}/bin/* /usr/local/bin/
```

## npm

：Node Package Manager，是Node.js使用的包管理工具。

命令：
```shell
npm
    init              # 在当前目录下生成一个package.json
    install           # 安装package.json里指定的所有模块，保存到./node_modules目录下
           [name]     # 安装指定的模块
           -g         # 安装到全局
    uninstall <name>  # 卸载指定的模块
    list              # 列出已安装的所有模块

    run <name>        # 运行package.json里的一个脚本
```

## gulp

：一个自动化构建工具，基于Node.js，常用于构建JS项目。
- 安装：npm install gulp

命令：
```shell
gulp [task]...    # 执行任务（默认执行default任务）
```
