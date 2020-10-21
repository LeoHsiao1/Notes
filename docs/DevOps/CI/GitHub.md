# GitHub

：一个流行的代码托管网站。
- 2018 年，被微软收购。
- [官方文档](https://docs.github.com/en)

## Actions

：GitHub 提供的一种 CI 功能。
- 它类似 Jenkins 的流水线，用 YAML 文件描述，保存为 .github/workflows/xx.yml 文件。
- [官方文档](https://help.github.com/en/actions)

例：
```yml
name: Python test

on: [push]                      # 定义触发流水线的事件

jobs:                           # 开始流水线任务
  job1:                         # 第一个任务
    runs-on: ${{ matrix.os }}   # 定义运行环境
    strategy:                   # 定义多个运行环境，每个环境都会构建一次
      matrix:
        os: [ubuntu-18.04, windows-2019]
        python-version: [3.5, 3.6, 3.7, 3.8]

    steps:                      # 开始流水线步骤
    - name: checkout            # 一个流水线步骤的名字
      uses: actions/checkout@v2 # 调用一个内置动作，其版本为 v1
      with:
        ref: master
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v1  # 安装 Python
      with:
        python-version: ${{ matrix.python-version }}
    - name: Install dependencies
      run: |
        python -m pip install pytest psutil
        echo $VAR1 $VAR2
      env:            # 定义环境变量
        VAR1: Hello
        VAR2: World
    - name: Test
      run: |
        pytest -v
```

- 执行每个 step 之前，都会切换到一个临时工作目录，例如：/root/actions-runner/_work/Notes/Notes

## Runner

Actions 默认运行在 GitHub 提供的运行环境中（包括 Linux、Windows、MacOS），用户也可以添加自己主机作为运行环境，称为 Runner 。
- 作为 Runner 的机器要保持运行一个进程，连接到 GitHub 仓库，接受控制。
- Github 仓库的 Settings->Actions 页面上有添加 Runner 的教程，在自己的主机上执行它要求的命令即可。首先要创建一个非 root 用户：
  ```sh
  useradd github
  su - github
  ```
- 在流水线文件中用 `self-hosted` 标签即可使用自己的 Runner ，如下：
  ```yml
  runs-on: [self-hosted, linux]
  ```
- 使用自己的 Runner 构建项目时，要小心仓库中有恶意代码被执行。
