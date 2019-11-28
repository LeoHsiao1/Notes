# GitHub Actions

GitHub提供了Actions功能，以实现CI/CD。
- [官方文档](https://help.github.com/en/actions)

## Actions

Actions是类似Jenkins的流水线，用YAML的语法描述，保存为 .github/workflows/xx.yml 文件。

例：

```yaml
name: Python test

on: [push]  # 定义触发流水线的事件

jobs:       # 开始流水线任务
  job1:     # 第一个任务
    runs-on: ${{ matrix.os }}   # 定义运行环境
    strategy:               # 定义多个运行环境，每个环境都会构建一次
      max-parallel: 4       # 可以同时运行的任务数量
      matrix:
        os: [ubuntu-18.04, windows-2019]
        python-version: [3.5, 3.6, 3.7, 3.8]

    steps:    # 开始流水线步骤
    - name: git pull   # 一个流水线步骤的名字
      uses: actions/checkout@v1    # 调用一个内置动作，其版本为v1
      with:
        ref: master
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v1  # 安装Python
      with:
        python-version: ${{ matrix.python-version }}
    - name: Install dependencies
      run: |
        pip install pytest psutil
        echo $VAR1 $VAR2
      env:    # 定义环境变量
        VAR1: Hello
        VAR2: World
    - name: Test
      run: |
        pytest -v
```

- 执行每个step之前，都会切换到一个临时工作目录，例如：/root/actions-runner/_work/Notes/Notes

## Runner

Actions默认运行在GitHub提供的运行环境中（包括Linux、Windows、MacOS），用户也可以添加自己主机作为运行环境，称为Runner。
- 作为Runner的机器要保持运行一个进程，连接到GitHub仓库，接受控制。
- Github仓库的Settings->Actions页面上有添加Runner的教程，在自己的主机上执行它要求的命令即可。首先要创建一个非root用户：
  ```
  useradd github
  su - github
  ```
- 在流水线文件中用`self-hosted`标签即可使用自己的Runner，如下：

      runs-on: [self-hosted, linux]

- 使用自己的Runner构建项目时，要小心仓库中有恶意代码被执行。
