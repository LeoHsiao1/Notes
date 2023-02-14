# Selenium

：一个用于 Web 自动化测试的开源项目。
- [官网](https://www.selenium.dev/)
- 发音为 `/səˈliːniəm/` 。
- Selenium 项目提供了多个工具：
  - WebDriver ：一个 HTTP 服务器，用于调用 Firefox、Chrome 等浏览器的 API 来访问网站。
  - IDE ：一个浏览器插件，用于记录用户在浏览器中的操作，记录成 Selenium 命令，便于快速创建测试用例。
  - Grid ：一个 Web 服务器，采用 Java 开发，用于在多个主机上执行 WebDriver 任务。

## WebDriver

### 安装

1. 安装 webdriver 。
    - 如果安装在本机，则需要安装某种浏览器，再下载对应版本的 webdriver 二进制文件。
    - 也可以在其它主机部署 Grid 服务器，然后在本机调用。

2. 安装 Python 的第三方库作为客户端：`pip install selenium`

### 用法

- [参考文档](https://selenium-python.readthedocs.io/)

- 例：在本机启动 webdriver 服务器
  ```py
  from selenium import webdriver

  driver = webdriver.Chrome()   # 启动 webdriver 。这会创建一个 webdriver 子进程，它又会创建几个 Chrome 子进程
  driver.quit()                 # 终止 webdriver
  ```

- 例：调用远程的 Grid 服务器
  ```py
  from selenium import webdriver
  from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

  driver = webdriver.Remote(
      command_executor="http://10.0.0.1:4444",
      desired_capabilities=DesiredCapabilities.CHROME
  )
  ```

- 例：浏览网页
  ```py
  >>> driver.get('http://www.baidu.com')   # 让浏览器返回一个 URL
  >>> driver.name            # 获取浏览器的名称
  'chrome'
  >>> driver.current_url     # 获取当前网页的 URL
  'https://www.baidu.com/'
  >>> driver.title           # 获取当前网页的标题
  '百度一下，你就知道'
  >>> driver.page_source     # 获取当前网页的 HTML 内容
  '<html><head><meta http-equiv="Content-Type" content="text/html;charset=utf-8">...
  >>> driver.save_screenshot('1.png')      # 保存网页截图（即使调用 Grid ，也能保存到本机）
  True
  ```

- 例：在网页输入信息
  ```py
  >>> from selenium.webdriver.common.keys import Keys
  >>> e = driver.find_element_by_id('kw')   # 查找 HTML 中的元素
  >>> e.send_keys('hello')                  # 输入字符串
  >>> e.send_keys(Keys.RETURN)              # 输入一个键盘快捷键
  >>> e.click()
  ```

- 例：切换浏览器的窗口
  ```py
  >>> driver.current_window_handle        # 获取当前窗口的句柄
  'CDwindow-C88E17197FCFDE3459E9E81F7498A3EA'
  >>> windows = driver.window_handles     # 获取浏览器所有窗口的句柄，返回一个 list
  >>> driver.close()                      # 关闭当前窗口
  >>> driver.switch_to.window(windows[0]) # 切换窗口
  ```
  - 浏览器可以打开多个窗口，而 driver 同时只能操纵一个窗口。

## Grid

### 架构

- Grid 包含以下组件：
  - Node
    - ：负责执行 WebDriver 任务。
    - 默认会自动发现本机上可用的 WebDriver ，注册到 Distributor 。
    - 每个 Node 提供了一定数量的 slot ，用于执行客户端 session 的任务。
  - Hub ：包含以下组件：
    - Router
      - ：作为 Grid 的入口，负责将客户端请求转发到对应的组件。
      - 例如收到客户端请求时，如果属于已有会话，则转发到 Session Map ，否则转发到 New Session Queue 。
    - Distributor
      - 负责为每个新的会话分配 Node 来执行任务。
    - Session Map
      - 负责记录每个 Session ID ，与执行该 Session 任务的 Node 的对应关系。
    - New Session Queue
    - Event Bus
      - 负责实现 Grid 各组件之间的通信。

- Grid 可以部署成分布式集群，也可以以 Standalone 模式部署单节点。

### 部署

- 下载 jar 包，然后执行：
  ```sh
  java -jar selenium-server.jar
  ```

- 用 docker-compose 部署：
  ```yml
  version: '3'

  services:

    selenium:
      container_name: selenium
      image: selenium/standalone-chrome:92.0-20210804
      restart: unless-stopped
      shm_size: 2g
      ports:
        - 4444:4444
      # volumes:
      #   - ./config.toml:/opt/selenium/config.toml
  ```
  - 该 selenium 镜像会基于 supervisor 运行浏览器、webdriver、Grid 等多个进程。
  - 容器启动时总是会重新生成配置文件 config.toml ，除非没有写入权限。可以挂载 config.toml ，内容示例：
    ```ini
    [network]
    relax-checks = true               # 是否放宽检查客户端 HTTP 请求的 Headers、Content-Type

    [node]
    # detect-drivers = true           # 是否自动发现本机上可用的 WebDriver
    # session-timeout = "300"         # 删除超过一定时长未活动的 session
    # max-sessions = 1                # 每个 node 可以分配的最大 session 数，默认等于 CPU 核数
    # override-max-sessions = false   # 是否允许设置的 max-sessions 超过 CPU 核数

    [router]
    username = admin                  # 给网站开启 Basic Auth 认证
    password = ******

    # [server]
    # port = 4444
    ```
