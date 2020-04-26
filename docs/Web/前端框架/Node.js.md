# Node.js

：一个 JavaScript 运行环境，基于 Chrome V8 引擎。
- [官方文档](https://nodejs.org/en/docs/guides/)

## 用途
- 构建前端文件。
- 运行基于 JavaScript 开发的后端程序。
  - 一般作为中间层，接收前端的访问请求，然后转发给真正的后端服务器。

## 安装

```sh
curl --silent --location https://rpm.nodesource.com/setup_12.x | sudo bash -
yum install nodejs
```
- 直接从 Centos 的默认 yum 源安装的话，会安装老旧的 8.x 版本。

## 例

下例是一个简单的 Node.js 应用：
```js
var http = require('http');   // 导入 http 模块

http.createServer(function (request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Hello World\n');
}).listen(80);

console.log('Server running at http://127.0.0.1:80/');  // 打印信息到 Linux 终端
```

用如下命令运行它：
```sh
sudo node server.js
```

## npm

：Node Package Manager ，一个 Node.js 自带的包管理工具。

命令：
```sh
npm
    init               # 初始化项目，这会在当前目录下生成一个 package.json
    install [name]     # 安装指定的包（默认安装到./node_modules 目录下）
            -g         # 安装到全局
            --save     # 安装之后记录到 package.json 的 dependencies 中
            --save-dev # 安装之后记录到 package.json 的 devDependencies 中
    install            # 安装 package.json 里记录的所有包
        --production   # 只安装属于 dependencies 的包
    uninstall <name>   # 卸载指定的包
           --save      # 卸载之后更新 package.json
    update <name>      # 升级指定的包
           --save
    list               # 列出已安装的所有包

    run <name>         # 运行 package.json 中的一个脚本
```
- 通常将项目用到的依赖库记录在 package.json 中，分为两种：
  - dependencies ：运行时的依赖
  - devDependencies ：开发时的依赖
- 安装时有两种安装位置：
  - 安装到./node_modules 目录下：此时要通过`node_modules/.bin/<name>`的方式调用。
  - 安装到全局：此时会注册到系统 PATH 目录下，可以输入命令名直接调用。
- 安装时可以指定版本号，如下：
    ```sh
    npm install jquery@3.0.0 --save
    npm update jquery@3.0.0 --save
    ```

## yarn

：一个较新的包管理工具，用于取代 npm 。
- yarn 的用法与 npm 类似，也是从 npm 源下载包，但是有以下优点：
  - 通过并行下载提高了包的安装速度。
  - 安装时会检查包文件的哈希值是否一致，更安全。
  - 用一个 yarn.lock 文件记录已安装的所有包的版本、哈希值、依赖库，从而严格地管理依赖。
- [官方文档](https://yarnpkg.com/en/docs)

安装：
```sh
# 需要已安装 Node.js
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
yum install yarn
```

命令：
```sh
yarn                     # 相当于 npm install
    init                 # 相当于 npm init
    add [name]...        # 相当于 npm install --save
        -D               # 相当于 npm install --save-dev
    remove [name]...     # 相当于 npm uninstall --save
    upgrade [name]       # 相当于 npm update --save
    list                 # 相当于 npm list
    global               # 管理安装在全局作用域的包
          add
          remove
          upgrade
          list

    run <name>           # 运行 package.json 中的一个脚本
```
- 执行 yarn init 时会生成一个 package.json 文件，安装一个包之后会自动生成一个 yarn.lock 文件。
- 如果一个包被 yarn 安装到./node_modules 目录下，则可以通过`yarn <name>`的方式调用，比 npm 更方便。

## gulp

：一个自动化构建工具，基于 Node.js ，常用于构建 JS 项目。
- 安装：npm install -g gulp

命令：
```sh
gulp [task]...    # 执行任务（默认执行 default 任务）
```
