# 我的笔记

## 特征

- 该笔记的主要目的是记录知识点，没有详细的原理讲解
- 欢迎指正
- 笔记保存为MarkDown格式的文件
- 基于Jekyll构建静态网站，访问URL：<https://leohsiao1.github.io/>

## 网站还在施工中

## 构建

```shell
node_version=node-v12.13.0-linux-x64
curl -O https://nodejs.org/dist/v12.13.0/${node_version}.tar.xz
tar -xvf ${node_version}.tar.xz -C /usr/local
rm -f ${node_version}.tar.xz
ln -sf /usr/local/${node_version}/bin/node /usr/bin/node
ln -sf /usr/local/${node_version}/bin/npm /usr/bin/npm
ln -sf /usr/local/${node_version}/bin/npx /usr/bin/npx
npm install gitbook-cli

node_modules/.bin/gitbook init
node_modules/.bin/gitbook build
```
