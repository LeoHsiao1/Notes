# GitHub

：一个流行的代码托管网站。
- [官方文档](https://docs.github.com/en)
- 2018 年被微软公司收购。

## Actions

：GitHub 提供的一种 CI 功能。
- [官方文档](https://docs.github.com/en/actions/reference)
- 使用时，需要在 GitHub 仓库的 `.github/workflows/` 目录下创建工作流文件。
  - 工作流文件采用 YAML 格式声明，描述了要执行的 CI 步骤，相当于 Jenkins 的 pipeline 脚本。
- GitHub 免费提供了一些虚拟机，用户可以直接在其中执行 workflows ，而不必自己准备主机。这是与 GitLab、Jenkins 相比的一大优点。

## Runner

- 执行 workflows 的主机称为 Runner 。

- GitHub 免费提供了一些虚拟机作为 Runner ，供用户使用。规格如下：
  - 配置都为：
    - 2-core CPU
    - 7 GB of RAM memory
    - 14 GB of SSD disk space
  - 可用的操作系统包括：
    - ubuntu-18.04 、ubuntu-20.04 等
    - macos-10.15
    - windows-2019
  - 取消了权限限制，比如使用 sudo 时不需要输入密码。

- 用户也可以添加自己的主机作为 Runner ，这需要在 Github 仓库的 `Settings -> Actions` 页面进行配置。
  - 作为 Runner 的主机要保持运行一个客户端进程，连接到 GitHub 仓库，接受控制。
    - 该进程必须使用非 root 用户启动：
        ```sh
        useradd github
        su - github
        ```
  - 使用自己的 Runner 时，要小心 workflows 中执行了恶意代码。

## workflows

### 基本示例

```yml
name: Test                        # 该 workflow 的名称。如果省略，则赋值为当前文件名

on: [push, pull_request]          # 触发该 workflow 的事件

jobs:                             # 该 workflow 的任务列表
  job1:                           # 第一个任务
    runs-on: ubuntu-18.04         # 运行该 workflow 的虚拟机
    steps:                        # 该任务包含的步骤
    - name: checkout              # 第一个步骤
      uses: actions/checkout@v2   # 调用一个动作，用于检出该 GitHub 仓库
    - name: Test                  # 第二个步骤
      run: |                      # 在终端执行命令
        pytest -v
```
- 在 GitHub 个人账号的 `Settings -> Notifications` 页面，可以设置在 GitHub Actions 执行失败时发送邮件通知。

### on

- `on` 参数用于声明触发该 workflow 的事件。如下：
  ```yml
  on:
    push:                 # Push 时触发，包括在 GitHub 网页上提交 commit 的情况
      branches:           # 只对指定分支触发
        - master
      tags:               # 只对指定 tags 触发
        - 'v1.*'          # 可以使用通配符

    pull_request:         # 提出 PR 时触发
      branches:
        - dev

    release:              # 在 GitHub 网页上发布版本时触发
      types:              # release 分为 created、edited、deleted、published 等多种情况，如果不指定 types ，则每种情况都会触发一次
        - created

    workflow_dispatch:    # 允许在 GitHub 网页上手动触发

    schedule:             # 作为定时任务触发
      - cron:  '*/15 * * * *'
  ```

### env

- `env` 参数用于定义一些环境变量，加入终端。如下：
  ```yml
  env:                            # 全局的环境变量
    VAR1: A

  jobs:
    job1:
      runs-on: ubuntu-18.04
      env:                        # 作用于 job 的环境变量
        VAR1: B
      steps:
      - name: Test
        run: |
          echo $VAR1 $VAR2
        env:                      # 作用于 step 的环境变量
          VAR1: Hello
          VAR2: World
  ```

- `$GITHUB_ENV` 指向一个存储环境变量的文件，向该文件中添加变量，就会被加入当前 job 的后续 step 的终端环境变量中。如下：
  ```yml
  steps:
  - name: Test write
    run: |
      echo  action_state=yellow  >>  $GITHUB_ENV
  - name: Test read
    run: |
      echo  $action_state
  ```
  - 这种添加环境变量的方式，比使用 `env` 参数的功能更强。

- 在 GitHub 仓库的 `Settings -> Secrets` 页面可以添加以密文形式存储的环境变量。然后在 workflow 中按如下格式使用：
  ```yml
  steps:
    - name: Test
      env:
        password: ${{ secrets.PASSWORD }}
      run: |
        echo $password
  ```
::: v-pre
  - 在 workflow 中可以通过 `${{ expression }}` 的格式获取一个表达式的值。
:::
  - 定义环境变量时，不能在同一个 env 块中读取它。

- GitHub 会自动加入一些内置的环境变量，例如：
  ```sh
  GITHUB_WORKFLOW     # 当前 workflow 的名称
  GITHUB_WORKSPACE    # 工作目录
  GITHUB_RUN_NUMBER   # 当前 workflow 执行的编号，从 1 开始递增
  GITHUB_JOB          # 当前 job 的名称
  GITHUB_SHA          # 触发该 workflow 的版本的哈希值
  ```
  - 不过这些变量只会加入终端的环境变量，不支持在 workflow 中读取。

### job

- 定义 job 的示例：
  ```yml
  jobs:                           # job 的列表
    job1:                         # 第一个 job ，其 id 为 job1
      # name: Test                # 该 job 的名称。如果省略，则赋值为 job_id
      runs-on: ubuntu-18.04       # 运行该 workflow 的虚拟机
      # continue-on-error: false  # 该 job 失败时，是否继续执行后续的 job
      # timeout-minutes: 360      # 该 job 的超时时间
      # if: ${{ success() }}      # 当之前的 job 执行成功时才执行该 job
      steps:                      # 该 job 包含的步骤
      - name: checkout
        uses: actions/checkout@v2
  ```
- 执行 job 时会创建一个临时的工作目录，比如 `/home/runner/work/repo-name/repo-name` 。
  - 执行每个 job 之前，都会重新创建该目录。因此上一个 job 生成的文件不会保留到下一个 job 。
  - 执行每个 step 之前，都会重新切换到该目录。因此上一个 step 切换的工作目录，并不会影响下一个 step 。
- 每个 job 最多执行 6 小时，超时则会放弃执行。

### job.needs

- 定义多个 job 时，默认会并行执行。可以用 needs 参数控制它们的执行顺序：
  ```yml
  jobs:
    job1:
    job2:
      needs: job1           # 当 needs 的 job 执行成功时，才执行该 job
    job3:
      if: always()          # 等 needs 的 job 执行结束之后，即使它们执行失败，也执行该 job
      needs: [job1, job2]
  ```

### job.runs-on

- `job.runs-on` 参数用于声明在哪个环境执行该 job 。
- 可以直接使用 GitHub 提供的虚拟机：
  ```yml
  job1:
    runs-on: ubuntu-18.04
  ```
- 可以使用用户自己的 Runner ：
  ```yml
  runs-on: self-hosted
  ```

### job.strategy

- `job.strategy` 用于将一个 job 以矩阵形式创建多个实例，它们会并行执行。如下：
  ```yml
  job1:
    runs-on: ubuntu-18.04
    strategy:
      matrix:
        python_version: [3.5, 3.6, 3.7, 3.8]    # 这会创建 4 个 job 实例，每个实例使用 python_version 变量的一种取值
      # fail-fast: true                         # 默认只要有一个 job 实例执行失败，则会放弃执行其它 job 实例
      # max-parallel: 2                         # 限制并行执行的 job 实例数，默认会尽量最大化
    steps:
    - name: Set up Python ${{ matrix.python_version }}    # 读取矩阵变量，它们不会自动加入终端环境变量
      uses: actions/setup-python@v1
      with:
        python-version: ${{ matrix.python_version }}
  ```
  - 最多创建 256 个 job 实例。

- 可以在 `job.strategy` 中定义 `runs-on` 用到的变量，从而创建多个运行环境：
  ```yml
  job1:
    strategy:
      matrix:                   # 这里会创建 3*4=12 个 job 实例
        os: [ubuntu-18.04, macos-10.15, windows-2019]
        python_version: [3.5, 3.6, 3.7, 3.8]
    runs-on: ${{ matrix.os }}
    steps:
    - name: Set up Python ${{ matrix.python_version }}
      uses: actions/setup-python@v1
      with:
        python-version: ${{ matrix.python_version }}
  ```

### step

- 定义 step 的示例：
  ```yml
  steps:
  - name: Install dependencies  # 该 step 的名称。如果省略，则自动命名
    # id: step1                 # 该 step 的唯一标识符
    run: |                      # 在终端执行命令，可以使用多行命令
      python -m pip install pytest psutil
      echo Hello
    # continue-on-error: false  # 该 step 失败时，是否继续执行后续的 step
    # timeout-minutes: 360      # 该 step 的超时时间
    # if: ${{ success() }}      # 当之前的 step 执行成功时才执行该 step
  ```

### step.uses

- `step.uses` 参数用于调用一个 Action 。
  - Action 是一个实现某种动作的功能模块，命名格式为 ` 作者名/模块名@版本号 ` 。
  - [搜索可用的 Actions](https://github.com/marketplace?type=actions)

- 检出仓库的示例：
  ```yml
  steps:
  - name: Check out repository
    uses: actions/checkout@v2   # 检出该仓库，相当于 git checkout
    # with:                     # 通过 with 为 action 传入参数
    #  ref: master              # 切换到哪个 ref 。默认是切换到触发该 workflow 的 commit ，如果不是被 commit 触发则切换到默认分支
  ```

- 安装 Python 解释器：
  ```yml
  - uses: actions/setup-python@v2
    with:
      python-version: '3.8'
  ```

- 缓存文件：
  ```yml
  - uses: actions/cache@v2
    with:
      path: |                 # 指定要缓存的文件
        f1
        test/                 # 可以指定目录
        tmp*/                 # 可以使用通配符
        !test/*.py            # 可以用 ! 排除一些文件
      key: ${{ runner.os }}-${{ hashFiles('f1') }}    # 缓存项的唯一 key
  ```
  - path 指定的所有文件会先压缩成一个包，再缓存。
  - 缓存时，如果已存在相同 key 的缓存项，则称为缓存命中。否则称为未命中，并创建新的缓存项。

- 上传、下载文件：
  ```yml
  - uses: actions/upload-artifact@v2
    with:
      name: my-artifact       # 上传之后，保存的工件名
      path: |                 # 指定要上传的文件
        f1
        test/
        tmp*/
        !test/*.py
      # retention-days: 90    # 保存时长，超时之后会自动删除
  - uses: actions/download-artifact@v2
    with:
      name: my-artifact       # 指定工件名。如果省略，则下载所有工件，并根据工件名分别创建子目录
      # path: tmp/            # 指定下载到哪个目录
  ```
  - path 指定的所有文件会先压缩成一个 ZIP 包，再上传。
  - 在 GitHub 网页上查看该 workflow 的执行记录，即可看到下载 Artifacts 的链接。
