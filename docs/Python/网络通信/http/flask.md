# import flask

：Python 的第三方库，是一个轻量级的 Web 开发框架，用于开发简单的 Web 应用。
- [官方文档](https://flask.palletsprojects.com/en/3.0.x/)
- 安装：`pip install flask`

## 启动

- 可以在 Python 交互式终端中使用 Flask ，如下：
  ```py
  >>> from flask import Flask
  >>> app = Flask('test')   # 创建一个 Flask 对象，代表一个 Web 应用，并设置名称
  >>> app
  <Flask 'test'>
  >>> @app.route('/')   # 通过 app.route() 装饰器，可以声明一条 URL 路由。每次收到访问该 URL 的 HTTP 请求，就交给被装饰的函数处理
  ... def index():
  ...     return '<p>Hello, World!</p>'
  ...
  >>> app.run(host='0.0.0.0', port=8080)   # 启动 Web 服务器，并保持运行，这会阻塞当前线程
  * Serving Flask app 'test'
  * Debug mode: off
  WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
  * Running on all addresses (0.0.0.0)
  * Running on http://127.0.0.1:8080
  ```
  - `app.run()` 启动的是一个简单的 Web 服务器，适合开发环境。如果要部署到生产环境，则建议改用 WSGI 服务器。
  - 可选输入 `app.run(debug=True)` ，启用调试模式，作用如下：
    - 将报错信息显示在 Web 页面上，方便查看。
    - 每当 Python 源代码文件变化时，会自动重新加载源代码、更新 Web 服务器。

- 基于 Flask 开发 Web 应用时，通常将源代码保存为 Python 脚本文件，如下：
  ```py
  from flask import Flask

  app = Flask(__name__)

  @app.route('/')
  def index():
      return '<p>Hello, World!</p>'

  if __name__ == '__main__':
      app.run(host="0.0.0.0", port=8080, debug=False)
  ```
  然后在主机终端运行 Python 脚本，从而启动 Web 服务器：
  ```sh
  python test.py
  ```

## route()

- `app.route()` 声明 URL 路由时，是否以斜杆结尾，会产生不同的效果：
  ```py
  @app.route('/index')  # 可以访问 /index ，访问 /index/ 会报错 404
  @app.route('/index/') # 可以访问 /index/ ，访问 /index 会被重定向到 /index/
  ```

- 可以提取 URL 中的一个字段，作为变量，传入函数：
  ```py
  @app.route('/user/<uid>/')
  def user(uid):
      return f'uid: {uid}'
  ```
  可以限制变量的取值类型：
  ```py
  @app.route('/user/<path:subpath>')  # 要求取值为 string 类型，可以包含 / 斜杆
  @app.route('/user/<string:uid>')    # 要求取值为 string 类型，不包含 / 斜杆
  @app.route('/user/<int:uid>')       # 要求取值为 int 类型
  @app.route('/user/<float:uid>')     # 要求取值为 float 类型
  ```

- 多个 `app.route()` 可以绑定到同一个函数：
  ```py
  @app.route('/index')
  @app.route('/index/')
  @app.route('/index/<path:subpath>')
  def index(subpath=''):
      return f'subpath: {subpath}'
  ```

- `app.route()` 默认允许接收所有 method 的 HTTP 请求，可以只接收指定的 method ：
  ```py
  @app.route('/index', methods=['GET'])   # 只接收 GET 方法
  ```

## request

- flask 提供了一个全局变量 `request` ，代表当前接收的 HTTP 请求，常用属性如下：
  ```py
  request.query_string    # 获取 HTTP 请求的 Query String ，取值为 bytes 类型
  request.args.get('uid') # 从 Query String 中，获取名为 uid 的那个参数的值

  request.form.get('uid') # 从 x-www-form-urlencoded 格式的 request body 中，获取名为 uid 的那个参数的值
  request.json            # 获取 application/json 格式的 request body ，取值为 dict类型
  request.data            # 获取 application/json 格式或 text/xml 格式的 request body ，取值为 bytes 类型

  request.url             # HTTP 请求的目标 URL
  request.method          # HTTP 请求的方法名
  request.headers         # HTTP 请求的 headers ，取值为 dict 类型
  request.remote_addr     # 客户端的 IP 地址
  ```

- route 函数的返回值，决定了返回什么样的 HTTP response 给客户端。例如：
  ```py
  return 'OK'         # 返回一个字符串，作为 HTTP response body 。此时默认 HTTP 状态码为 200
  return 'OK', 200    # 返回一个字符串，并指定 HTTP 状态码
  return redirect('/')  # 重定向到一个 URL
  return render_template('index.html', tips='Welcome!') # 输入一个名为 index.html 的模板文件、一个名为 tips 的变量，渲染得到一个 HTML 文件，作为 HTTP response body
  return jsonify(data)  # 将字典转换成 JSON 格式，作为 HTTP response body
  ```

- 关于模板。
  - flask 的设计初衷，是轻量级 Web 开发，因此不擅长处理 HTML 文件。
  - 用户可以使用 `render_template()` 渲染 HTML 文件，采用 Jinja 模板语法，与 Django 相似。
  - flask 默认会到 `./templates/` 目录下，寻找模板文件。

- 例：
  ```py
  from flask import Flask, request, render_template, redirect

  @app.route('/login', methods=['GET', 'POST'])
  def login():
      if request.method == 'GET':
          uid = request.args.get('uid', 0)
          return render_template('login.html', msg='Please input your account.')
      elif request.method == 'POST':
          form = {'username': request.form['username'],
                  'password': request.form['password']}
          return redirect('/index')
  ```

## session

- flask 提供了一个全局变量 `session` ，代表当前接收的 HTTP 请求所属的会话。
  - flask 能自动为每个客户端，生成不同的 cookies 。这些 cookies 存储在每个客户端的电脑上，是每个客户端的专有数据。
  - HTTP 协议本身是无状态的，每个 HTTP 请求互不影响。但如果一个 Web 客户端发出的多个 HTTP 请求携带相同的 cookies ，则可以被 Web 服务器，识别为同一个客户端、同一个 session 。

- 例：
  ```py
  import os
  from flask import session

  app.secret_key = os.urandom(24)   # 设置 session 的加密盐，从而保证生成的 cookies 是随机的，，提高安全性

  @app.route('/', methods=['GET'])
  def index():
      session['username'] = 'test1' # 在当前 session 的 cookies 中，写入一个参数
      session.get('username')       # 读取一个参数
      session.pop('username')       # 删除一个参数
      ...
  ```

- session 的过期时间。
  - 当用户使用 Web 浏览器作为客户端时，通常会一直保存 cookies ，直到用户关闭 Web 浏览器。
  - 可以主动设置 session 的过期时间：
    ```py
    from datetime import timedelta

    app.permanent_session_lifetime = timedelta(hours=1) # 设置 session 的过期时间

    @app.route('/', methods=['GET'])
    def index():
        session.permanent = True  # 对当前 session 启用过期时间
        ...
    ```
