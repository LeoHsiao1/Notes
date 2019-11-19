# GitHub Actions

GitHub提供了Actions功能，以实现CI/CD。

- [官方文档](https://help.github.com/en/actions)

## Actions

Actions是类似Jenkins的流水线，用YAML的语法描述，保存为 .github/workflows/xx.yml 文件。

例：

```yaml
name: Python package

on: [push]  # 定义触发流水线的事件

jobs:       # 开始流水线任务
  job1:     # 第一个任务

    runs-on: ${{ matrix.os }}   # 定义运行环境
    strategy:               # 定义多个运行环境
      max-parallel: 4       # 可以同时运行的任务数量
      matrix:
        os: [ubuntu-latest, windows-latest]
        python-version: [3.5, 3.6, 3.7]

    steps:                  # 开始流水线步骤
    - uses: actions/checkout@v1
    - name: Set up Python ${{ matrix.python-version }}  # 一个流水线步骤的名字
      uses: actions/setup-python@v1
      with:
        python-version: ${{ matrix.python-version }}
      env:          # 定义环境变量
        VAR1: Hello
        VAR2: World
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    - name: Test with pytest
      run: |
        pip install pytest
        pytest

```

## Runner

Actions默认运行在GitHub提供的运行环境中（包括Linux、Windows、MacOS），用户也可以在仓库设置中添加自己的运行环境，称为Runner。

- 作为Runner的机器要运行一个进程，连接到GitHub仓库，接受控制。
- 使用自己的运行环境时，要避免仓库中有恶意代码被执行。
