# Node.js

：一个JavaScript运行环境，基于Chrome V8 引擎，用于在服务器上运行JS代码。
- [官方文档](https://nodejs.org/en/docs/guides/)

用途：
- 构建前端文件。
- 运行后端程序。
- 作为中间层，接收前端的访问请求，然后转发给真正的后端服务器。

安装：
```shell
curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -  # 添加yum源，否则安装的nodejs版本很老
yum install nodejs
```

## npm

：Node Package Manager，一个Node.js自带的包管理工具。

命令：
```shell
npm
    init               # 初始化项目，这会在当前目录下生成一个package.json
    install [name]     # 安装指定的包（默认安装到./node_modules目录下）
            -g         # 安装到全局
            --save     # 安装之后记录到package.json的dependencies中
            --save-dev # 安装之后记录到package.json的devDependencies中
    install            # 安装package.json里记录的所有包
        --production   # 只安装属于dependencies的包
    uninstall <name>   # 卸载指定的包
           --save      # 卸载之后更新package.json
    update <name>      # 升级指定的包
           --save
    list               # 列出已安装的所有包

    run <name>         # 运行package.json中的一个脚本
```
- 通常将项目用到的依赖库记录在package.json中，分为两种：
  - dependencies ：运行时的依赖
  - devDependencies ：开发时的依赖
- 安装时有两种安装位置：
  - 安装到./node_modules目录下：此时要通过`node_modules/.bin/<name>`的方式调用。
  - 安装到全局：此时会注册到系统PATH目录下，可以输入命令名直接调用。
- 安装时可以指定版本号，如下：
    ```shell
    npm install jquery@3.0.0 --save
    npm update jquery@3.0.0 --save
    ```

## yarn

：一个较新的包管理工具，用于取代npm。
- yarn的用法与npm类似，也是从npm源下载包，但是有以下优点：
  - 通过并行下载提高了包的安装速度。
  - 安装时会检查包文件的哈希值是否一致，更安全。
  - 用一个yarn.lock文件记录已安装的所有包的版本、哈希值、依赖库，从而严格地管理依赖。
- [官方文档](https://yarnpkg.com/en/docs)

安装：
```shell
# 需要已安装Node.js
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
yum install yarn
```

命令：
```shell
yarn                     # 相当于npm install
    init                 # 相当于npm init
    add [name]...        # 相当于npm install --save
        --dev            # 相当于npm install --save-dev
    remove [name]...     # 相当于npm uninstall --save
    upgrade [name]       # 相当于npm update --save
    list                 # 相当于npm list
    global               # 管理安装在全局作用域的包
          add
          remove
          upgrade
          list

    run <name>           # 运行package.json中的一个脚本
```
- 执行 yarn init 时会生成一个package.json文件，安装一个包之后会自动生成一个yarn.lock文件。
- 如果一个包被yarn安装到./node_modules目录下，则可以通过`yarn <name>`的方式调用，比npm更方便。

## gulp

：一个自动化构建工具，基于Node.js，常用于构建JS项目。
- 安装：npm install -g gulp

命令：
```shell
gulp [task]...    # 执行任务（默认执行default任务）
```
