# ♢ Django

：Python 的第三方库，是一个大型的 Web 应用开发框架。
- [官方文档](https://docs.djangoproject.com/)
- 读音为 `/ˈdʒæŋɡoʊ/`
- 安装：`pip install django`
- 提供了一个测试服务器，便于开发调试。
- 提供了一个管理页面，可以在 Web 页面显示数据表，进行增删改查。

## 版本

- v1.0 ：于 2008 年发布，采用 Python 2 开发。
- v2.0 ：于 2017 年底发布，仅支持 Python 3 。
- v3.0 ：于 2019 年底发布。
  - 支持 ASGI 接口，从而允许异步请求。

## 框架

- 一个 Django 项目中可以包含多个 Web 应用（application）。
  - 每个 Web 应用用一个 Python 包表示，提供了一些 URL 供用户访问。
  - 每个 Web 应用默认是独立工作，也可以相互调用。
- 每个 Web 应用采用 MVC 设计模式。
  - 在 models.py 中定义数据表模型。
    - 用于在 MySQL 等数据库中创建数据表，供该 Web 应用存储数据。
    - 虽然用户可以用 Python 直接连接数据库进行操作，但 Django 推荐定义数据表模型，以对象关系映射（ORM）的方式操作数据库，以提高效率。
  - 在 views.py 中定义每个 URL 显示的视图。
    - 比如定义一个视图函数，控制收到 HTTP 请求时如何返回 HTTP 响应。
  - 在 urls.py 文件中定义 URL 的路由规则，即收到指向某个 URL 的 HTTP 请求时交给哪个视图函数处理。
    - 准确来说，这里的 URL 是指不包含服务器地址的 URI 。

## 创建项目

1. 安装 Django 之后，使用其自带的命令行工具创建一个新项目：
    ```sh
    django-admin startproject django_site
    ```
    这会创建一个名为 django_site 的目录，目录结构如下：
    ```sh
    django_site             # 项目的根目录，该目录的名称没有影响
    ├── django_site         # 一个 Web 应用的目录，又称为 app 目录
    │   ├── __init__.py
    │   ├── settings.py     # 包含 Django 框架的配置
    │   ├── urls.py         # 包含 Django 项目的 URL 主路由规则
    │   └── wsgi.py         # 用于让其它 Web 服务器通过 WSGI 接口运行该 Django 项目
    └── manage.py           # 用于管理 Django 项目、启动测试服务器
    ```
    - 此时该项目中只包含一个主 Web 应用和一些基础的文件，使得该 Django 项目能够运行。
    - 主 Web 应用，通常用于存放 Django 本身的配置文件，不包含业务代码。

2. 进入项目目录，创建一个新 Web 应用：
    ```sh
    python manage.py startapp app1
    ```
    此时的目录结构示如下：
    ```sh
    django_site
    ├── django_site
    │   ├── __init__.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── app1                # 另一个 app 目录
    │   ├── __init__.py
    │   ├── admin.py        # 可选，包含该 app 的 admin 页面的配置
    │   ├── apps.py         # 可选，包含该 app 在 Django 中的配置
    │   ├── models.py
    │   ├── urls.py
    │   ├── test.py         # 可选，包含测试用例
    │   └── views.py
    └── manage.py           # 用于管理 Django 项目
    ```

3. 运行 Django 自带的测试服务器：
    ```sh
    python manage.py runserver 0.0.0.0:80
    ```
    - 该 server 会监听并接收源 IP 为任意、目标端口为 80 的 TCP 包，在浏览器中输入 `127.0.0.1:80` 即可访问该 server 。
    - 运行测试服务器时，如果修改了 Django 调用的任何 Python 源文件，测试服务器会自动发现并重启。

## 管理项目

manage.py 脚本提供了一些管理 Django 项目的功能：
```sh
python manage.py
                startapp <app_name>   # 创建一个 Web 应用
                shell                 # 打开 Django 环境下的 Python 解释器

                dbshell               # 打开连接数据库的客户端
                makemigrations        # 检查 Model 的变化，生成迁移文件
                    <app_name>...     # 只检查指定应用
                migrate               # 根据迁移文件修改数据库
                flush                 # 清空数据库中存储的数据，只保留数据表的结构

                check                 # 检查项目是否存在一些常见问题
                test                  # 执行所有 tests*.py 文件中的测试用例
```
- Django 会在每个应用目录之下创建 migrations 目录，每次执行 makemigrations 都会生成一个新的迁移文件来修改数据库，记录增量修改的历史。
  - 建议将 migrations 目录保存到 git 仓库中。

## 配置项目

setting.py 文件包含了 Django 框架的配置（与业务代码无关），如下：
```py
import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))    # 该 Django 项目的根目录（绝对路径）
SECRET_KEY = '******'               # 用于加密签名，应该使用一个较长的随机值并保密

DEBUG = True            # 是否开启调试模式
# 调试模式下，当 Django 抛出异常时会在 Web 页面显示详细的调试信息
# 在生产环境应该关闭调试模式，否则会泄露服务器的配置、源代码

ALLOWED_HOSTS = ['*']   # 限制 HTTP 请求头部中的 Host 字段，如果不匹配则返回 HTTP 400 响应，用于避免 CSRF 攻击。例如：['*.test.com', 'localhost']

INSTALLED_APPS = [                  # 声明启用的 Web 应用
    'django.contrib.admin',         # 用于显示管理页面
    'django.contrib.auth',          # 用于用户的身份认证
    'django.contrib.contenttypes',  # 启用 contenttypes 框架
    'django.contrib.sessions',      # 用于创建 session
    'django.contrib.messages',      # 启用消息框架，用于在浏览器中显示提示信息
    'django.contrib.staticfiles',   # 用于管理静态文件
    'app1.apps.App1Config',         # 启用一个自定义的 Web 应用
]
# 这里的路径不是文件的绝对路径，而是 Python 包的导入路径
# Django 会将 BASE_DIR 加入 Python 的 sys.path 中，因此可以直接通过包名导入 Web 应用，比如 import app1


MIDDLEWARE = [                      # 声明启用的中间件
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTH_PASSWORD_VALIDATORS = [        # 用于验证用户密码的强度
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


DATABASES = {                                           # 配置使用的数据库
    'default': {                                        # 至少要定义一个 default 数据库，默认使用它
        'ENGINE': 'django.db.backends.sqlite3',         # 选择数据库引擎，这里是 SQLite
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),   # SQLite 数据库文件的保存路径
    },
    'mysql': {
        'ENGINE': 'django.db.backends.mysql',           # 采用 MySQL 数据库引擎
        'NAME': 'db1',
        'USER': 'root',
        'PASSWORD': '******',
        'HOST': '10.0.0.1',
        'PORT': '3306',
        'OPTIONS': {                                    # 连接数据库时的参数
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES', innodb_strict_mode=1",
            'charset': 'utf8mb4',
        }
    }
}

ROOT_URLPATTERN  = 'django_site.urls'             # 主 urls.py 的路径，它是所有路由规则的起点，由它调用其它 Web 应用的 urls.py
WSGI_APPLICATION = 'django_site.wsgi.application' # wsgi 应用的路径

LANGUAGE_CODE    = 'zh-hans'        # 设置语言
TIME_ZONE        = 'Asia/Shanghai'  # 设置时区
USE_I18N         = True             # 是否自动翻译前端的一些单词
USE_L10N         = True             # 是否按本地格式显示日期时间
USE_TZ           = True             # 在 Django 内部按 UTC 时区处理时间，输出到视图或终端时才自动转换成本地时区

# Django 基于 Python 的标准库 logging 记录日志，用户可以自定义日志器，覆盖默认的日志配置
import logging
LOGGING = { ... }                   # 配置日志器，略
logging.config.dictConfig(LOGGING)
logger = logging.getLogger('django')
```


每个 Web 应用的 apps.py 文件包含了其配置，如下：
```py
from django.apps import AppConfig


class App1Config(AppConfig):
    name = 'app1'                # 该应用的目录名
    verbose_name = '应用一'       # 显示的名称

```

