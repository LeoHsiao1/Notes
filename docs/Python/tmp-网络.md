::: v-pre

♢ Flask
## Flask：Python的第三方库，是一个轻量级的Web应用框架。
## 例：
from flask import Flask, request, render_template, redirect

app = Flask(__name__)        # 创建一个Flask应用

@app.route("/", methods=["GET"])        # 用装饰器声明一条URL路由，只允许使用GET方法访问
def index():                            # 当该URL被访问时，Flask就会调用该函数
    return render_template("index.html", tips="Welcome!")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        _id = request.args.get("id", 0)
        return render_template("login.html", msg="Please input your account.")
    elif request.method == "POST":
        form = {"username": request.form["username"],
                "password": request.form["password"]}
        return render_template("index.html", msg="login succeeded!")

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)        # 启动Flask应用，这会阻塞线程
- 声明URL时，是否以斜杆结尾会产生不同的效果。
  - @app.route('/index')            # 可以访问/index，访问/index/会报错404
  - @app.route('/index/')            # 可以访问/index/，访问/index会被重定向到/index/
- 全局变量request指向当前的HTTP请求，可通过它获得以下信息：
  - request.query_string            # 获取HTTP请求的Query String（bytes类型）
  - request.args.get("id")        # 从Query String中获取参数
  - 
  - request.form.get("username")    # 从x-www-form-urlencoded格式的body中获取参数
  - request.json                    # 获取application/json格式的body数据（dict类型）
  - request.data                    # 获取application/json格式或text/xml格式的body数据（bytes类型）
  - 
  - request.url                    # 客户端请求的URL
  - request.method                # 客户端请求的方法名
  - request.headers                # 客户端请求的headers（dict类型）
  - request.remote_addr            # 客户端的IP
- 网页函数的返回值有以下几种：
return "OK"        # 直接返回一个字符串
return "OK", 200    # 返回结果，并指定状态码

  - return render_template("index.html", tips="Welcome!")    # 像Django一样渲染HTML模板再返回
  - return redirect("/")                            # 重定向到一个URL
  - return jsonify(data)                            # 将字典转换成JSON格式再返回
- Flask会到同目录下的templates文件夹里寻找HTML模板。
  - 这里登录页面支持GET和POST两种请求，共用同一个html。
- 如果以调试模式启动，Flask会将运行时的报错信息显示在Web页面上。并且，当项目文件被修改时，Flask会自动重启。
## 全局变量session指向当前HTTP请求的会话（它会自动创建cookies来保持会话）。
- 使用session：
import os
from flask import session

app.secret_key = os.urandom(24)        # 设置session的加密盐

@app.route("/", methods=["GET"])
def index():
session['username'] = "test1"        # 在当前会话中保存一项数据（保存在HTTP客户端的cookies中）
    session.get('username')            # 从当前会话中读取一项数据
    session.pop('username')            # 从当前会话中删除一项数据
    ...
- 每个客户端的session默认在浏览器关闭之后就失效。可以手动指定过期时间：
from datetime import timedelta

app.permanent_session_lifetime = timedelta(hours=1)        # 设置session 的过期时间

@app.route("/", methods=["GET"])
def index():
    session.permanent = True        # 对当前会话启用session 的过期时间
    ...
## 
## 
## 
 
♢ django
## django：Python的第三方库，是一个开源的Web应用框架，采用MVC设计模式。用pip install django即可安装。
- 它自带了管理工具django-admin。
django-admin startproject mysite            # 创建一个名为mysite的Django项目
python manage.py runserver 0.0.0.0:8000    # 运行Django提供的轻量级server
  - 上面的server会监听所有IP地址的8000端口，在浏览器中输入127.0.0.1:8000即可访问该server。
  - 运行server时，如果修改了源文件，会立即被检测到并应用，刷新网页即可看到改变。不过添加文件时不会被检测到。
- 一个Django项目中可以创建多个Web应用（又称为app），基本目录结构如下：
+-- mysite                    # 项目目录，该目录的名字没有影响
+-- mysite                # 该项目的主app，存放了settings.py等项目唯一的文件
    |-- __init__.py
    |-- settings.py        # 该项目的配置文件
    |-- urls.py            # 该app的可用URL目录
    `-- wsgi.py            # 该app的WSGI接口，供兼容WSGI的Web服务器访问
+-- app1                    # 该项目的另一个app
    |-- admin.py            # 注册该app的管理员页面
    |-- apps.py            # 定义该app的业务代码
    |-- models.py            # 定义该app的Model类
    |-- urls.py
    |-- views.py            # 定义该app的视图函数
`-- manage.py                # 一个管理django项目的脚本
  - 每个app的源文件保存为一个Python包，可以在Django项目内互相调用，也可以被其它Django项目复用。
  - Django会把该项目目录加入Python的sys.path中，因此可以直接导入该项目下的各个包，比如import app1。
## manage.py是一个管理当前Django项目的脚本，可以用Python启动。
- 命令：
python manage.py
startapp <应用名>        # 创建一个应用，这会自动生成一些默认文件
check                # 检查项目是否存在一些常见问题
shell                # 打开Django环境下的Python解释器

dbshell                # 打开数据库的客户端
makemigrations        # 让Django检查Model的变化，生成迁移文件
migrate                # 让Django根据迁移文件配置数据库的结构
flush                # 清空数据库的数据，只保留数据表的结构

test app1            # 执行app1目录下所有tests*.py文件中的测试用例
## 
## 
## 
 
setting.py
## setting.py文件位于Django项目的第一个app的目录下，保存了当前项目的设置信息。
# 记录该Django项目的顶级目录（绝对路径），供其它代码调用
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 在调试模式中，Web页面异常时会显示详细的调试信息，在发布阶段应该把它改为False
DEBUG = True

# 设置客户端通过哪些ip地址或域名可以访问到该server
ALLOWED_HOSTS = []
# 例如：ALLOWED_HOSTS = ['*.django.com','www.django.com']
# 当DEBUG = True时，ALLOWED_HOSTS被设置成['localhost', '127.0.0.1', '[::1]']。
# 当DEBUG = False时，ALLOWED_HOSTS = []，必须加入内容。如果设置为['*']，则允许所有ip地址或域名

# 声明在该项目中启用的app
INSTALLED_APPS = [
    'django.contrib.admin',            # 启用管理员页面
    'django.contrib.auth',            # 启用认证功能
    'django.contrib.contenttypes',        # 启用内容类型框架
    'django.contrib.sessions',            # 启用会话框架
    'django.contrib.messages',            # 启用消息框架
    'django.contrib.staticfiles',        # 启用管理静态文件的框架
    'app1'                            # 启用一个自定义的app
]

# 也可指向app1.apps.App1Config，从而可以在app1的apps.py 中配置该应用。如下：
```py
from django.apps import AppConfig


class App1Config(AppConfig):
    name = 'app1'                # 应用名，要与实际的目录名一致
    verbose_name = '应用一'    # 在admin页面显示的名字
```

# 主urls.py文件的路径
ROOT_URLPATTERN = 'mysite.urls'

# 设置django模板
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',    # 使用Django自带的模板引擎
        'DIRS': [os.path.join(BASE_DIR, 'templates')],            # Django寻找模板文件的路径
        'APP_DIRS': True,                                        # 是否在每个app的目录下寻找模板文件
        'OPTIONS': ...,                                        # 传给模板引擎的参数
    },
]
  - 可以在当前项目目录下创建templates文件夹以存放模板文件。为了避免不同app用到的模板发生重名冲突，应该再按照每个app的名字细分子文件夹。比如BASE_DIR/templates/app1/hello.html、BASE_DIR/templates/app2/index.html。
  - 也可以在每个app应用的目录下创建templates文件夹以存放模板文件，并细分子文件夹。比如BASE_DIR/app1/templates/hello.html、BASE_DIR/app1/templates/app1/detail.html。
  - 使用模板文件时，只需要指出每个模板文件在templates目录下的相对地址，比如“app1/hello.html”。
  - 不要使用绝对路径，否则每次拷贝源代码都需要手动修改。
  - 当Django在BASE_DIR/templates/目录下没有找到模板文件时，就会到每个INSTALLED_APPS的目录下寻找templates文件夹。
  - 可以在每个app目录下创建static/{app_name}/目录，用于存放该app的静态文件。
配置了 STATIC_ROOT = os.path.join(BASE_DIR, 'static') 之后，执行python manage.py collectstatic会将各个app目录下的静态文件收集到项目根目录下的static文件夹中。


LANGUAGE_CODE = 'zh-hans'        # 设置Web页面显示的语言
TIME_ZONE = 'Asia/Shanghai'    # 设置时区
USE_TZ = True                # 使用时区（内部采用UTC时区，只有通过模板显示时才自动切换成TIME_ZONE时区）

## 
## 
## 
 
urls.py
## urls.py文件中声明了app监听的所有URL以及相应的view函数，每条规则就是一个urlpattern。
- 当客户端发来HTTP请求时，Django会进入主app的urls.py，按从上往下的顺序，尝试匹配其中的urlpattern。如果有匹配的urlpattern就调用相应的view函数来处理该HTTP请求。
  - 调用view函数时，默认会传入当前的HttpRequest对象，也可以传入一些额外的参数。
  - 如果没有匹配的urlpattern就返回http404。
## 使用函数path(route, view, kwargs=None, name=None)可以设置一个urlpattern。如下：
from django.urls import path
from . import views

urlpatterns = [
    path('index', views.index)
    path('home', views.home)
]
- route    ：一个字符串，表示URL。
  - route不必以 / 开头。
例如，当客户端请求的URL为"www.example.com/app1/?page=3"时，匹配"app1/"。
  - route通常以 / 结尾。
如果route以 / 结尾，则用户可以访问app1/，访问app1时会自动跳转app1/的路径。
如果route不以 / 结尾，则用户只能访问app1，访问app1/时会报错404。
- view        ：指向一个视图函数。
- kwargs    ：一些字典参数，可以传给view函数。
- name        ：该URL的名字。设置了name之后，就可以在Django中通过name引用该URL。
## 可以使用Path转换器从URL提取某个字段的值，传入view函数。如下：
path('index/<int:id>/', views.hello)    # 当URL为"index/10/"时，会给 views.hello函数传入参数id=10
- Path转换器可以是以下类型：
<int:x>        # 匹配一个int型常量
<str:x>        # 匹配一个不包含斜杆 / 的字符串
<path:x>        # 匹配一个任意形式的字符串
## 用re_path()函数可以按照正则表达式进行匹配。如下：
from django.urls import re_path
from . import views

urlpatterns = [
re_path(r'^hello/$', views.hello)
re_path(r'^date/(?P<year>[0-9]{4})/$', views.date),    # 将第二个字段作为year参数传给视图函数
]
## 可以在urlpattern中直接重定向：
from django.views.generic import RedirectView
urlpatterns = [
    path('home/', view.home),
    path('', RedirectView.as_view(url='/home')),
]
## 可以在主urls.py中设置400等报错页面。
from . import views

handler400 = views.bad_request
handler403 = views.permission_denied
handler404 = views.page_not_found
handler500 = views.error
## 用include()函数可以将URL转发到其它urls.py文件（这些urls.py文件必须已经声明app_name）。
from django.urls import include
from . import views

urlpatterns = [
    path('hello/', include('app1.urls', namespace='app1')),
            # 例如：当URL为"hello/10/"时，会匹配'hello/'，然后将剩下的"10/"传入app1.urls继续匹配
    path('hello_pre/', include('app1.urls', namespace='app1_pre')),
    path('test/', include([            # 可以给include()函数输入一个urlpattern的列表
        path('get/', views.test_get),
        path('post/', views.test_post)
    ]))
]
- 重复引入同一个app的urls.py时，要使用不同的namespace来区分，当做该app的不同实例。
  - app_name是app的应用命名空间，而namespace是app的实例命名空间。
- 可以动态获取当前的namespace：
def hello2(request):
namespace = request.resolver_match.namespace
url_name='{}:hello'.format(namespace)
return redirect(reverse(url_name))
## 为了避免不同app的URL名字发生重名冲突，可以通过命名空间进行划分。
- 例：
  - 编写app1的urls.py：
app_name = 'app1'                                    # 设置app的名字
urlpatterns = [
    path('hello/', views.hello, name='hello'),        # 设置urlpattern的名字
    path('hello2/', views.hello2, name='hello2'),
]
  - 编写主app的urls.py：
urlpatterns = [
    path('', include('app1.urls', 'app1')),
]
  - 在view函数中根据名字使用URL：
from django.shortcuts import redirect, reverse

def hello(request):
    return render(request, 'hello.html')

def hello2(request):
    return redirect(reverse('app1:hello'))        # 根据URL的名字反向解析出URL，然后重定向到它
  - 在模板中根据名字使用URL：
<a href="/'hello/{{ id }}/">hello</a>                # 使用实际URL，给id变量赋值
<a href="{% url 'hello' id %}">hello</a>            # 根据名字使用URL
<a href="{% url 'app1:hello' id %}">hello</a>        # 指定app_name
## 
## 
## 
 
Models
## Django中，用Model类表示数据表结构，通过内置的ORM方法来操作数据库。
- Model类通常保存在models.py文件中。
- 默认使用SQLite数据库，也可以使用MySQL、Oracle等数据库。
## 使用数据库的流程。
1.    修改settings.py中的数据库配置。
  - 默认使用SQLite数据库，此时name参数代表保存数据库文件时的绝对路径。
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    },
}
2.    打开settings.py，在INSTALLED_APPS中加入用到数据库的app的名称"app1"。
3.    在app1目录下创建一个models.py，定义Model。
内容略
4.    输入以下命令配置数据库。
python manage.py makemigrations            # 让Django检查Model的变化，生成迁移文件
python manage.py makemigrations [app]...    # 只检查指定app的Model的变化
python manage.py migrate                    # 让Django根据迁移文件配置数据库的结构
  - makemigrations会将Model被修改的部分保存为./migrations目录下的一个迁移文件（比如0001_initial.py），以便以后回滚数据库的配置。
  - migrate会检查每个INSTALLED_APPS定义的Model、这些Model有哪些未被应用的迁移文件，然后根据这些迁移文件来配置数据库。
  - 也可以使用指定的迁移文件来配置数据库，如下：
python manage.py migrate app1 0001
5.    接下来就可以读写该数据库了。可以创建一个apps.py，编写相应的代码；也可以输入命令python manage.py shell开启一个可以导入Django包的Python解释器，试用该数据库：
>>> from .models import Student
>>> s = Student(name="Leo")
>>> s.save()
>>> s.id
1
>>> Student.objects.get(id=1)
<Student: Leo>
## 使用MySQL数据库时的注意事项。
- 默认使用的数据库驱动模块是mysqlclient，安装方法：
yum install mysql-devel gcc python3-devel
pip3 install mysqlclient
- settings.py中的数据库配置格式如下：
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',    # 使用的数据库引擎，不需要改
        'NAME': 'app1',         # MySQL中使用的database名称
        'USER': 'root',         # MySQL的用户名
        'PASSWORD': '******',   # MySQL的密码
        'HOST': '127.0.0.1',    # MySQL服务器的IP地址（如果没配置，Django会连接本机的mysql.sock）
        'PORT': '3306',         # MySQL服务器的端口号
        'OPTIONS': {
            'charset': 'utf8mb4',
            "init_command": '',
        },
    }
}
- Django会自动在数据库中创建数据表，但需要先手动创建database。
## 
## 
## 
 
Model类
## 例：
from django.db import models

class Student(models.Model):                    # 定义一张数据表
    name = models.CharField(max_length=32)        # 定义一个类变量，代表表中的一个字段
    age = models.IntegerField(default=0)

    def __str__(self):                    # 设置单条数据的显示名字
        return self.name

    class Meta:                            # 设置该模型的元数据
        verbose_name = "账号"                # 该Model在admin页面显示的名字
        verbose_name_plural = "账号"        # 复数时的显示名字
        ordering = ["-age"]    # 按age字段的值排序，前缀的减号 – 表示降序
        #abstract=True        # 将该Model设置成抽象类，不会保存到数据库中，常用作其它Model的父类
        #unique_together = (('name', 'age'),)    # 联合约束，限制指定字段的组合的取值不能重复
        indexes = [                                        # 添加索引
            models.Index(fields=['age'], name='age_idx'),    # 添加一个单列索引
            models.Index(fields=['name', 'age']),            # 添加一个组合索引
        ]
- Django会自动在数据库中创建相应的表，默认名为“项目名_类名”。比如app1_student。
## Model类支持继承。
- 父类应该定义成抽象类。
- 子类会继承父类的所有属性、方法。
  - 如果父类的某些成员不适合沿用，子类应该重载它。
  - 子类应该单独定义自己的meta类。
## 
## 
## 
 
字段类
## 每个模型类都是django.db.models.Model类的子类，每个字段类都是django.db.fields.Field类的子类。
## 常用的字段类。
- models.AutoField(...)
  - 自增的int型字段。
  - 如果用户没有定义主键字段，Django会隐式地定义id = models.AutoField(primary_key=True)。
- models.IntegerField(...)
  - int型字段。
- models.FloatField(...)
  - float型字段。
- models.DecimalField(max_digits=5, decimal_places=2)
  - decimal型字段。max_digits表示总位数，decimal_places表示小数位数。
- models.CharField(verbose_name="名字", blank=True, default="", unique=True, max_length=20)
  - str型字段，用于存储较短的字符串。
- models.TextField(...)
  - 文本字段，用于存储较长的字符串。
- models.BooleanField(...)
- models.DateField(auto_now_add=True)
  - 会自动使用当前的datetime.date实例。
  - 不能设置default参数。
  - 以下两个参数可以启用一个，但启用之后该字段会变成editable=False，即不可修改。
auto_now=True        ：当数据被保存时，自动将该字段设置成当前时间。常用于保存修改时间。
auto_now_add=True    ：当数据被创建时，自动将该字段设置成当前时间。常用于保存创建时间。
- models.DateTimeField(auto_now_add=True)
  - 会自动使用当前的datetime实例。用法与models.DateField相同。
## 定义字段时的常用参数。
- primary_key=True        ：将该字段设置成主键。
- verbose_name=None    ：该字段在admin页面显示的名字。
- null=False    ：在数据库中定义数据表时，该字段不可以为null。
- blank=False    ：新增数据项时不可以不填该字段。（在admin页面中，必填字段显示为粗体）
- default        ：该字段的默认值。如果新增数据项时没有填该字段，则将默认值存储到数据库中。
  default参数不能设置成列表等可变类型。
  default参数可以传入一个函数名（不能用lambda函数，因为要序列化），由它动态生成默认值。
- unique=False    ：该字段的值不能重复。
- max_length    ：最大长度。
- min_length    ：最小长度。
- validators    ：传入一些验证该字段的值是否有效的函数。
  - 例：
from django.core.exceptions import ValidationError

def validate_name(value):
    if len(value) > 10:
        raise ValidationError("{} should be no longer than 10.".format(value))

class Project(models.Model):
    name = models.CharField(default="", validators=[validate_name])
- choices    ：显示一个下拉框，从中选取该字段的值。
  - 例：choices=(('male', '男'),('female', '女'))
## 特殊类型的字段类。
- models.EmailField(verbose_name='邮箱地址')
- models.GenericIPAddressField(verbose_name='IP地址')
必须输入一个有效的 IPv4 或 IPv6 地址，且不能为空。
- models.FileField(upload_to='uploads/')
  - 用于保存用户上传的文件。该文件会被保存到服务器的指定目录，然后将其保存路径（默认max_length=100）写入数据库。
  - upload_to参数表示上传到哪个目录。可以传入一个函数，由它返回保存路径，如下：
def get_upload_path(instance, filename):    # instance是该数据实例、filename是用户上传的文件名
    return 'user_{}/{}'.format(instance.username, filename)

class MyModel(models.Model):
    upload_path = models.FileField(upload_to=get_upload_path)
- models.FilePathField(path='/home/images/', match=".*.jpg$", recursive=True)
  - 用于选择服务器上已有的文件。
  - 参数：
path        ：服务器上的一个绝对路径。
match    ：一个正则表达式，用于过滤文件名。
recursive：是否递归显示子目录中的文件。
## 可以定义虚拟字段函数，调用它时会返回虚拟字段的值，但不会把该字段存储到数据库中，也不允许用户修改。
    from django.utils.html import format_html

    def info(self):                        # 创建一个"info"字段
        return format_html('<span style="color: #{};">{}</span>', "FF0000", self.name)
    
    info.short_description = "INFO"        # 设置该字段的名称
    info.admin_order_field = "name"        # 设置该字段按self.name的值排序（否则该字段不能排序）

- 导入format_html函数，用它代替str.format()生成HTML语句，否则Django会把这些HTML语句看做字符串。
## 使用JSON字段：可以把该字段当作Python的字典类型，直接从数据库读写。
1.    安装：pip install django-mysql
2.    在settings.py的INSTALLED_APPS中加入'django_mysql'。
3.    在settings.py的DATABASES中加入OPTIONS：
'default': {
    'ENGINE': 'django.db.backends.mysql',
    ...
    'OPTIONS': {
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES', innodb_strict_mode=1",
        'charset':'utf8mb4'
    }
}
4.    在models.py中创建JSON字段：
from django.db import models
from django_mysql.models import JSONField

def json_default():
    return {}

class Student(models.Model):
    name = models.CharField(max_length=32)
    detail = JSONField(default=json_default)        # 默认值要通过一个函数返回
5.    读写JSON字段：
Student.objects.create(name='Feta', detail={'smelliness': 3, 'crumbliness': 10})
Student.objects.filter(detail={'smelliness': 5})
Student.objects.filter(detail__exact={'smelliness': 3, 'crumbliness': 10})
## 
## 
## 
 
外键
## 一对一的外键。
last_name = models.OneToOneField(to=Name, on_delete=models.PROTECT)
## 多对一的外键。
school = models.ForeignKey(to=School, on_delete=models.PROTECT, default=1)
- 这里是将当前表的school字段关联到School表中的数据项。
  - Django会在数据库中创建school_id字段作为外键，并建立索引。
- 常用参数：
  - to参数表示要关联的目标数据表。用to="self"可以关联到自身。
  - on_delete参数表示当被关联的目标数据被删除时，执行什么操作。
on_delete=models.CASCADE表示级联删除当前的数据项。
on_delete=models.PROTECT表示报出完整性错误。
on_delete=models.SET_DEFAULT表示使用默认值。
  - to_field="..."表示要关联的目标字段。默认关联到主键
  - parent_link=True表示在admin页面中，点击该字段会跳转到被关联的目标数据。
- Django会给被关联的目标表创建一个虚机字段，默认名为"student_set"的格式，它记录了指向某个school的所有student实例，从而可以反向查询。如下：
s = School.objects.get(pk=1)
s.student_set.all()
  - 可以用related_name="students"设置该字段的名字。
## 多对多的外键。
models.ManyToManyField(to="self")
- Django会在数据库中创建一个中间表来存储多对多关系。该中间表默认包含三个字段：id、Model A的id、Model B的id。
- 可以自定义中间表，如下：
class Student(models.Model):
    name = models.CharField(max_length=32, default='')
    def __str__(self):
        return self.name

class Group(models.Model):
    name = models.CharField(max_length=32, default='')
    members = models.ManyToManyField(
        Person,
        through='Membership',                # 使用Membership表作为多对多关系的中间表
        through_fields=('group', 'student'),# 从Membership表的group字段到student字段建立多对多关系
    )
    def __str__(self):
        return self.name

class Membership(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    inviter = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="membership_invites",
    )
    add_time = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return "{}-{}".format(self.group, self.student)
## 
## 
## 

 
增查改删
## 增
- 先创建对象，再保存到数据库:
s = Student(name='Leo')    # 创建一个Student Model的对象
s.save()                    # 保存到数据库中
s.id                        # 获取其自动生成的主键id
- 一步创建并保存:
Student.objects.create(name='Leo')
- 多对多外键字段不能直接赋值，要用add()方法：
s1 = Student.objects.create(name="Leo")
s2 = Student.objects.create(name="Will")
Group.members.add(s1, s2)
## 查
- 获取所有数据：
Student.objects.all()                        # 返回一个QuerySet对象
Student.objects.all().order_by("id")        # 排序，返回一个QuerySet对象
Student.objects.all().order_by("id")[0:2]    # 切片
  - QuerySet对象可以当作列表索引、迭代，也可以用filter()等方法处理。
- 筛选：
QuerySet.filter(name='Leo')        # 筛选符合条件的所有数据，返回一个QuerySet对象。如果没有数据则返回[]
QuerySet.exclude(name='Leo')        # 筛选不符合条件的所有数据，返回一个QuerySet对象
  - 可以使用高级的筛选条件：
QuerySet.filter(name__startswith='L')    # 用__istartswith、__iendswith、__icontains则是不区分大小写
QuerySet.filter(name__endswith='o')
QuerySet.filter(name__contains='L')
- 精确查询：
s = Student.objects.get(id=1)        # 返回一个Student对象
s = Student.objects.get(pk=1)        # pk代表主键
  - get()方法容易引发异常，要谨慎使用。
如果数据表中存在多个符合条件的数据，则抛出MultipleObjectsReturned异常
如果数据表中不存在符合条件的数据，则抛出DoesNotExist异常
如果数据表中没有定义该字段，则抛出FieldError异常
- 关于查询的API：
http://www.liujiangblog.com/course/django/130
http://www.liujiangblog.com/course/django/131
http://www.liujiangblog.com/course/django/132
## 改
- 修改实例的属性：
s.name = 'Hello'
s.save()
- 使用queryset对象的update方法：
Student.objects.get(id=1).update(name='Hello')
## 删
Student.objects.filter(id=1).delete()        # 删除该QuerySet的所有数据
## 其它操作。
- 事务：
from django.db import transaction
try:
    with transaction.atomic():
        Student.objects.create(name='Leo')
except Exception as e:
    print(e)
- 数据库锁：
Student.objects.select_for_update().filter(name__contains='L')
    # 这会锁住匹配的每行数据，直到事务结束
## 
## 
## 
 
Views
## Django中，视图函数负责接收HTTP请求、返回HTTP响应。
- 视图函数通常保存在views.py文件中。
- 一个视图函数会绑定到一个或多个URL。
## 使用视图函数的流程。
1.    添加模板：在项目目录下创建一个templates文件夹，添加一个hello.html，其内容如下：
<h1>{{ str1 }}</h1>
2.    登记模板文件的路径：在settings.py中，将TEMPLATES的'DIRS'赋值为 [BASE_DIR+"/templates"]。
3.    编辑view函数：在app1目录下创建一个views.py，内容如下：
from django.shortcuts import render

def hello(request):
    context = {}
    context['str1'] = 'Hello World!'                    # 将要传给模板的参数保存在context字典中
    return render(request, 'hello.html', context)        # 使用名为'hello.html'的模板
4.    在urls.py中声明URL：
from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello)
]
5.    运行server，访问127.0.0.1:8000/hello/试试。
## 
## 
## 
 
HTTP请求
## Django会将HTTP请求用HttpRequest对象表示，作为第一个参数传入视图函数。
## 默认情况下，视图函数会收到发往其URL的所有HTTP请求。可以限制请求方法的类型，如下：
from django.views.decorators.http import require_http_methods

@require_http_methods(['GET','POST'])        # 只接收指定的请求方法。如果收到其它类型的请求，则返回405
def view(request):
    pass
## HttpRequest对象的属性和方法。
- 关于报文头部。
>>> request.META                # 获取所有HTTP headers（dict类型）
{'XDG_SESSION_ID': '23371', 'TERM_PROGRAM': 'vscode', 'HOSTNAME': 'centos', ...}
>>> request.COOKIES            # 获取所有cookies（dict类型）
{'_ga': 'GA1.2.1316405776.1562028141', 'csrftoken': 'HJzWvIWAtQYjOmXmYpukHdaNvVjJYOtJVsZUD4p0QhOecFUbis9wbcr4d8tyK4wl', 'sessionid': '84dblh70fceg9rxelm2f20hmoa535ejd'}
>>> request.encoding            # 获取请求报文的编码方式（如果修改了该值，以后都会根据它来解析请求报文）
None                            # encoding为None时，则使用默认的编码方式
>>> request.content_type        # 获取请求报文的MIME类型
'text/plain'
- 关于报文内容。
>>> request.GET                # 获取URL请求字符串中的参数（dict类型）
<QueryDict: {}>
>>> request.body                # 获取请求报文的body（bytes类型）
b'...'
>>> request.POST                # 获取x-www-form-urlencoded格式的body中的参数（dict类型）
<QueryDict: {}>
>>> request.FILES                # 获取请求报文中上传的文件数据（dict类型）
...
- 关于报文属性。
>>> request.method            # 获取HTTP请求的方法名（采用大写）
'GET'
>>> request.is_secure()        # 判断请求报文是否采用HTTPS协议
False
>>> request.is_ajax()            # 判断请求报文是否为ajax请求
False
>>> request.path                # 获取请求报文指向的URL（不包括域名、请求字符串）
'/index/'
>>> request.get_full_path()    # 获取请求报文指向的完整URL（不包括域名，包括请求字符串）
'/index/?id=001'
>>> request.get_host()        # 获取请求报文指向的服务器的IP地址和端口号
‘127.0.0.1:8080’
>>> request.get_port()        # 获取请求报文指向的服务器的端口号
‘8080’

>>> request.META.get('REMOTE_ADDR')        # 获取客户端的 IP 地址
‘127.0.0.1’

## 
## 
## 
 
HTTP响应
## 视图函数的返回值可以是重定向、仅状态码、纯文本、HTML网页、文件。
- 如果视图函数没有返回值，浏览器会在等待一段时间之后报错：服务器无响应。
## 返回HTTP响应报文。
- class HttpResponse(content=b'', content_type=None, status=None, reason=None, charset=None)
  - 功能：传入二进制形式的报文body，生成一个HTTP响应报文。
  - content_type表示报文body的MIME类型，比如"application/json"。
  - 例：
from django.http import HttpResponse

def home(request):
    return HttpResponse(b"Hello World!", status=200)    # 该响应报文的body中只包含该字符串
    return HttpResponse('<h1>Page not found</h1>', status=404)
- 设置响应报文的参数。
  - 设置headers：
response = HttpResponse()
response['Age'] = 120
del response['Age']
  - 设置cookie：
response.set_cookie(key, value='', max_age=None, expires=None, path='/', domain=None, secure=None, httponly=False)
# max_age表示有效时长，单位为秒
# expires表示过期时刻
# domain参数用于跨域。比如domain=".test.com"的cookie可以被www.test.com、dev.test.com等域名使用
# httponly=False表示允许通过JS脚本等方式读取cookie的内容
  - 删除cookie：
response.delete_cookie(key, path='/', domain=None)
- class JsonResponse(data, encoder=DjangoJSONEncoder, safe=True, json_dumps_params=None, content_type=None, status=None, reason=None, charset=None)
  - 功能：传入dict类型的data，转换成application/json类型的body，再生成HTTP响应报文。
  - 例：
from django.http import JsonResponse
return JsonResponse({'a': 1})
- def render(request, template_name, context=None, content_type=None, status=None, using=None)
  - 功能：根据request、HTML模板、context参数，渲染出一个HTML作为报文body，再生成HTTP响应报文。
  - 例：
render(request, 'hello.html', {'str1': 'Hello World!'})
  - render会使用找到的第一个名为'hello.html'的模板，将context的内容填入该模板。
  - 为了避免多个app的模板发生重名冲突，可以在templates/目录下再细分子目录，比如存放在templates/app1/hello.html，然后用相对地址"app1/hello.html"引用该模板。
  - 当用户停留在某个页面时，用locals()函数可以复用当前的context参数。如下：
return render(request, 'login/login.html', locals())
## 返回重定向报文。
- def redirect(to, *args, permanent=False, **kwargs)
  - 功能：返回一个HTTP重定向报文。
  - 参数to表示重定向到哪里。
  - 参数permanent表示是否为永久重定向。默认为302临时重定向。
  - 例：
from django.shortcuts import redirect
return redirect('home/')                    # 重定向到一个相对路径的URL
return redirect('/home/')                    # 重定向到一个绝对路径的URL
return redirect('https://www.baidu.com/')    # 重定向到另一个网站
return redirect('view1', a=1)                # 重定向到一个视图函数，并传入参数
- def reverse(viewname, urlconf=None, args=None, kwargs=None, current_app=None)
  - 功能：反向解析viewname，返回对应的URL（绝对路径）。
  - viewname可以是URLconf的名字，也可以是视图函数的名字（此时可用传入args、kwargs参数）。
  - 例：
from django.shortcuts import reverse
reverse('home')
reverse('view1', a=1)
## 可以抛出HTTP异常。Django会使用默认的html模板做出响应。
- 例：
from django.http import Http404
from .models import Student

try:
    s = Student.objects.get(id=1)
except Student.DoesNotExist:
    raise Http404("Data does not exist")
- 上面的try语句可以简化成：
from django.shortcuts import get_object_or_404
s = get_object_or_404(Student, id=1)
  - 类似的还有get_list_or_404()函数，它会调用filter()方法，如果返回的列表为空就抛出Http404异常。
## 返回文件的方法：

from django.http import HttpResponse, StreamingHttpResponse, Http404

# 先判断文件是否存在
import os
file_path = '1.txt'
if not os.path.isfile(file_path):
    raise Http404

# 法一：一次性读取文件的内容并传输，这样可能会占用服务器的大量内存
with open(file_path, 'rb') as f:
    response = HttpResponse(f.read(), content_type='application/octet-stream')
    response['Content-Disposition'] = 'attachment; filename=' + file_path
    return response


# 法二 ： 分段读取文件的内容并传输
with open(file_path, 'rb') as f:
    response = StreamingHttpResponse(f, content_type='application/octet-stream')
    response['Content-Disposition'] = 'attachment; filename=' + '1.txt'
    return response



## 
## 
 
view模板
## Django提供了一些抽象的View类作为视图模板，通过继承它们可以快速定义View类。
- ListView类：用于显示某个Model的实例列表。
  - 使用该视图模板时，在path()中调用其as_view()方法即可。如下：
path('', views.IndexView.as_view(), name='index')
  - 它的template_name属性默认为"<app name>/<model name>_list.html"。
  - 它内置了get_queryset()方法，会自动显示该Model所有实例的列表，相当于Model.objects.all()。用户也可以重载该方法。
  - 它会自动设置要传给模板文件的context字典中各个参数的名称。比如当Model名为Question时，会自动生成question参数、question_list参数，以及其属性question.id、question.question_text。
  - 用户也可以重载get_context_data ()方法，往context字典加入一些参数。
- DetailView类：用于显示某个Model实例的全部属性。
  - 它的template_name属性默认为"<app name>/<model name>_detail.html"。
  - 它默认从URL中接收一个名为"pk"的参数，并调用get_object()获取Model列表中id为"pk"的实例，自动显示其全部属性。
- 例：
from django.views.generic import Listview, DetailView

class IndexView(ListView):                            # 自定义一个View类，继承视图模板类
model = Question                                    # 设置该视图模板类采用的Model
    template_name = 'app1/index.html'                    # 设置要使用的模板文件
    context_object_name = 'latest_question_list'
        # get_queryset()方法的返回值默认赋值给context字典中名为"<model name>_list"的参数，
        # 这里修改它的名字

    def get_queryset(self):                    # 重载该方法
        return model.objects.order_by('-pub_date')[:5]

def get_context_data(self, **kwargs):
    kwargs['category_list'] = Question.objects.all().order_by('name')
    return super(IndexView, self).get_context_data(**kwargs)

class DetailView(DetailView):                    # 重载该方法
    model = Question
    template_name = 'detail.html'
    
def get_object(self, queryset=None):        # 重载该方法
    obj = super(DetailView, self).get_object()
    return obj
## 
## 
## 
 
HTML模板
## Django中，可以将HTML文件抽象为HTML模板，以便于复用、动态调整。
- HTML模板要使用Django自带的DTL（Django Template Language ）语言编写。
  - HTML模板文件的后缀名也是 .html 。
  - 将一些参数传入HTML模板，就可以生成标准的HTML文件。
- 如果把Django用作纯后端服务器，则不必返回HTML，而是返回JSON等格式的数据。
## DTL的语法。
- 用{% if %}标签进行判断，if后可使用and、or、not关键字：
{% if ... and ...  %}
   <h1>Hello World!</h1>                # 静态的HTML语句，显示内容已经固定
{% elif ... %}
   <h1>{{ str1 }}</h1>                # 一个名为str1的变量，可以赋值
{% else %}
   <h1>{{ ... }}</h1>
{% endif %}
- 用{% ifequal %}、{% ifnotequal %}标签可判断两个值是否相等：
{% ifequal user currentuser %}
    <h1>Welcome!</h1>
{% else %}
    <h1>No News Here</h1>
{% endifequal %}
- 用{% for %}标签进行遍历。
{% for i in list1 %}
    <h1>{{ i.name }}</h1>            # 显示一行标题
    <ul>                            # 显示一个无序列表
    {% for x in i.list %}
        <li>{{ x }}</li>
    {% endfor %}
    </ul>
{% endfor %}
- 用{# ... #}标签进行注释。
- 用{% include %}标签可以加入其它模板的内容：
{% include "1.html" %}
- 用基于管道符的过滤器可以修改要显示的变量：
{{ name|first|upper }}        # django提供了first、upper等关键字可修改变量的值
- Django模板支持继承：
{% extends "1.html" %}            # 继承1.html

{% block str1 %}                    # 覆盖1.html中名为str1的block块
<p>继承了1.html文件</p>
{% endblock %}
- 用{% static %}标签导入静态文件。
{% load static %}        # 在HTML头部声明要导入静态文件
<link rel="stylesheet" type="text/css" href="{% static 'app1/css/style.css' %}">

  - 它会将静态文件从相对路径转换成绝对路径，相当于：
<link rel="stylesheet" type="text/css" href="/static/app1/css/style.css">

- 使用post方法时，总是应该加上{% csrf_token %}标签，以防止跨站请求伪造。
<form action="{% url 'polls:vote' question.id %}" method="post">
{% csrf_token %}
{% for choice in question.choice_set.all %}
    <input type="radio" name="choice" id="choice{{ forloop.counter }}" value="{{ choice.id }}">
    <label for="choice{{ forloop.counter }}">{{ choice.choice_text }}</label><br>
{% endfor %}
<input type="submit" value="Vote">
</form>
## 
## 
## 
 
表单类
## Django内置了一些表单类，便于在HTML中插入表单。
## 例：
1.    在app目录下创建一个forms.py，像定义数据库Model一样定义表单的结构。
from django import forms                    # 导入forms模块
from captcha.fields import CaptchaField    # 导入验证码模块

class UserForm(forms.Form):        # 继承Form类
    gender = (
        ('male', "男"),
        ('female', "女"),
    )
    username = forms.CharField(label="用户名", max_length=32, widget=forms.TextInput())
    password1 = forms.CharField(label="密码", max_length=32, widget=forms.PasswordInput())
    sex = forms.ChoiceField(label='性别', choices=gender)    # 性别采用一个下拉框输入
    captcha = CaptchaField(label='验证码')                    # 创建一个验证码字段

2.    然后在views.py中使用该表单：
from . import forms

if request.method == 'POST':
    login_form = forms.UserForm(request.POST)        # 实例化表单对象
    if login_form.is_valid():
        username = login_form.cleaned_data.get('username')# 表单类的cleaned_data是一个参数字典
        password = login_form.cleaned_data.get('password')

try:
    user = models.User.objects.get(name=username)
    ...
except:
    ...
else:
    return render(request, 'app1/login.html', locals())
  - 可通过表单类的内置方法is_valid()判断接收的参数是否合法。
  - 表单类的cleaned_data属性以字典的形式存储了所有表单数据。
3.    最后在HTML模板中使用表单类的名字作为标签即可：
<form class="form-login" action="/login/" method="post">
{% csrf_token %}
{{ login_form }}
</form>
  - 在生成HTML文件时，Django会自动将模板中的{{ login_form }}转换成HTML语句，例如：
<div class="form-group">
<label for="id_username">用户名:</label> <input type="text" name="username" class="form-control" placeholder="username" autofocus="" maxlength="128" required id="id_username">
</div>
## 使用Django自带的简单验证码插件：
1.    输入命令pip install django-simple-captcha安装验证码插件。
2.    在INSTALLED_APPS中加入'captcha'，然后输入命令python manage.py migrate刷新数据库。
3.    在主urls.py中加入path('/captcha/', include('captcha.urls'))。
4.    在models.py或forms.py中导入from captcha.fields import CaptchaField，即可使用CaptchaField()定义字段。
  - 当用户输错验证码时，Django会自动在页面上报错。
## 可以以Model类为基础创建表单类。
from django.forms import ModelForm
from .models import Student

class StudentForm(ModelForm):
    class Meta:
        model = Student
        fields = ['name', 'school']
## 
## 
## 
## 
## 
 
session
## Django默认导入了django.contrib.sessions模块，封装好了session功能。
- session数据默认保存在数据库的django_session表中。
## 使用session。
- 可以通过request对象的session成员访问该HTTP请求的session。
  - 例：
user = User.objects.get(username=request.POST['username'])
if user.password == request.POST['password']:
    request.session["username"] = username        # 可以像字典一样直接读写

if request.session.get("username"):
    return HttpResponse("You're logged in.")

if request.session.get("username"):
    del request.session["username"]
    return HttpResponse("You're logged out.")
- 判断客户端是否支持使用cookie：
  - 在一个视图中调用request.session.set_test_cookie()，然后在之后的视图中调用request.session.test_cookie_worked()。例：
def login(request):
    if request.method == 'POST':
        if request.session.test_cookie_worked():
            request.session.delete_test_cookie()
            return HttpResponse("You're logged in.")
        else:
            return HttpResponse("Please enable cookies and try again.")
    request.session.set_test_cookie()
    return render(request, 'login.html')
- 可以创建独立的session对象：
session.create()                    # 创建一个session实例

session.set_expiry(value)            # 设置session的有效期
# value可以为int或datetime、datedelta对象
# 若value为0，则当用户关闭浏览器之后就会失效
# 若value为None，则使用全局的有效期策略（默认是等一段时间之后才过期）
session.get_expiry_age()            # 返回session剩下的有效时长（以秒为单位）
session.get_expiry_date()            # 返回session的过期日期（为datetime对象）

session.cycle_key()                # 生成一个新的session_key来保存当前的session数据
session.exist(session_key)        # 判断session_key是否存在

session.flush()                    # 删除当前的session，连session_key都会删除
session.delete(session_key=None)    # 删除某个session的数据（默认是当前session）
session.clear_expired()            # 删除已失效的所有session（Django不会自动删除它们）
## 
## 
## 
 
部署Django
## 使用uWSGI服务器可以部署Django应用，供用户访问。
- 通常在uWSGI之前再部署一个Nginx服务器作为代理，专门处理静态文件。
此时让客户端向Nginx服务器发出HTTP请求。如果请求的是静态文件，则Nginx可以直接找到静态文件回复给客户端；如果请求的不是静态文件，则Nginx会将请求转发给uWSGI服务器处理。

Nginx还可以代理多台uWSGI服务器，实现负载均衡。
- 部署的步骤是：
  - 使用python manage.py runserver，检查Django项目是否可用。
  - 用uWSGI服务器运行Django项目，监听 127.0.0.1:79 。（只接收来自本机的、发到80端口的HTTP请求）
  - 让Nginx暴露在外网中，监听 *:80 。（接收来自任意IP地址的、发到80端口的HTTP请求）
收到HTTP静态请求时，Nginx就自行解决。（搜集相应的静态文件，回复给客户端）
收到HTTP动态请求时，Nginx就转发到127.0.0.1:79，由uWSGI服务器处理。
## 安装及配置uWSGI服务器。
1.    安装依赖库：
yum install gcc build-essential python3-devel
2.    安装uwsgi：
pip install uwsgi    
3.    进入项目目录，创建一个uwsgi文件夹，再在其下创建一个uwsgi.ini，作为配置文件：
mkdir uwsgi
vim uwsgi/uwsgi.ini
配置文件的内容如下：
[uwsgi]                ; ini文件使用分号 ; 注释，使用中括号 […] 标明每个部分，使用键值对配置各项参数

http = 0.0.0.0:80    ; 监听来自哪些IP地址、发送到哪个端口的HTTP请求（这里只准在本地访问）
            # socket = 127.0.0.1:79        # 采用socket方式访问（被Nginx代理时更快）
chdir = /root/django                        ; 设置工作目录（这里是Django项目的目录）
wsgi-file = %(chdir)/mysite/wsgi.py        ; 指定wsgi.py文件


; 以下为非必填内容
daemonize = %(chdir)/uwsgi/uwsgi.log          ; 将uwsgi作为守护进程运行，并将日志保存在该路径
pidfile = %(chdir)/uwsgi/uwsgi.pid         ; 设置uwsgi.pid文件的保存路径

# stats = 127.0.0.1:9191        # 启用uWSGI的stats服务器，访问它可以获取JSON格式的统计信息
# home = %(chdir)/.venv                       ; 指定Python解释器的安装目录（这里是virtualenv的目录）
processes = 2                               ; 启动2个进程（称为uwsgi的worker）
threads = 2                                ; 每个worker创建2个线程
max-requests = 2000                         ; 每个worker最多处理多少个请求
4.    用法：
uwsgi
--ini uwsgi/uwsgi.ini            # 使用配置文件启动uwsgi服务器（默认在后台运行）
    --stop uwsgi/uwsgi.pid        # 停止uwsgi服务器(根据pid文件)
    --reload uwsgi/uwsgi.pid        # 重启
## 安装及配置Nginx服务器。
1.    在项目目录下执行以下命令，收集静态文件：
python manage.py collectstatic
2.    编辑配置文件nginx.conf：
server {
    listen  80;
    # server_name  ---.com;

    charset  utf-8;
    access_log  /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    # 设置网站的根目录
    location / {
        include    /etc/nginx/uwsgi_params;    # 连接uwsgi服务器时的配置文件
        uwsgi_pass    127.0.0.1:79;            # 当客户端访问该网站时，Nginx就转发给uwsgi服务器
    }

    # 设置静态文件的目录
    location /static {
        root /root/django;            # 如果客户端访问 ~.com/static，Nginx就到这里查找文件
    }
}
3.    先启动uWSGI服务器，再启动Nginx服务器：
docker run -d --name nginx -p 80:80 -v nginx.conf:/etc/nginx/nginx.conf nginx
docker exec -it nginx nginx -s quit        # 停止
## 静态文件、HTML模板通常保存在项目目录或应用目录下的static文件夹中，并在其下按app名称细分子文件夹。
- 使用django测试服务器时，django会自动到项目目录、应用目录下的static文件夹中寻找静态文件。
- 使用Nginx等外部服务器运行Django项目时，通常把静态文件集中放到一个目录下。
1.    在settings.py中添加如下配置：

STATIC_URL = "/static/"        # 设置静态文件的URL前缀，比如127.0.0.1:8000/static/1.jpg
STATIC_ROOT = os.path.join(BASE_DIR, 'static')    # 设置放置收集后的静态文件的目录
STATICFILES_DIRS = [            # 设置查找静态文件的后端目录（默认会查找所有app下的static目录）
    os.path.join(BASE_DIR, 'static_2'),
]

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")    # 设置media目录，通常用于存放用户上传的文件

2.    执行命令`python manage.py collectstatic`，它会将项目目录、应用目录下的static文件夹，以及STATICFILES_DIRS记录的静态文件，都拷贝到STATIC_ROOT目录下。
3.    最后修改Nginx的配置文件，让它使用这些静态文件。
location /static {
    alias /root/django/static;
}
location /media  {
    alias /root/django/media;
}

当 DEBUG = False 时，Django 只提供后端服务器的功能，不会寻找静态文件回复给客户端。

## 
## 
## 
 
admin页面
## Django自带了一个admin模块，用于显示Web形式的后台管理页面，可以管理用户组、数据库、各个数据表。
- admin页面使用的模板文件保存在Django安装目录的django/contrib/admin/templates目录下，可以将这些模板文件拷贝到当前的app目录下，改写它们。
## 用法。
1.    在一个models.py的同目录下创建一个admin.py：
from django.contrib import admin
from .models import Student

admin.site.register(Student)                # 将数据库的Model注册到admin页面中
2.    在urls.py中声明该页面的URL（默认已经声明了）。
from django.urls import path
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),        # 管理员界面是绑定到django.contrib.admin.site.urls上
]
3.    创建一个管理员账号（可以创建多个）：
python manage.py createsuperuser
4.    在域名后加上'admin/'即可访问管理员页面。
## 设置admin页面。
from django.contrib import admin

admin.site.site_title = "后台管理"        # 设置网页的标题
admin.site.site_header = "后台管理"    # 设置网页中显示的名称

## 定义Model的显示类。
- 通过继承admin.ModelAdmin类可以定义某个Model的显示类，并用@admin.register()注册。如下：
from django.contrib import admin
from .models import Choice, Question

class ChoiceInline(admin.TabularInline):        # 继承admin.TabularInline类
    model = Choice
    extra = 3                                    # 每次额外显示3个choice项

@admin.register(Question)                        # 将QuestionAdmin配置应用到Question表
class QuestionAdmin(admin.ModelAdmin):            # 继承自admin.ModelAdmin类
    # 设置该Model的管理页面（是一个列表）
    list_display = ["name", "text"]    # 设置要显示的字段（默认只显示__str__()）
    list_display_links = ["name"]        # 点击list_display中的哪些字段可以链接到实例的修改页面
    list_editable = ["text"]            # 设置list_display中的哪些字段可以编辑（会显示成文本框）
    list_filter = ["pub_date"]            # 在页面右侧显示一个过滤器，可根据指定字段筛选数据
    search_fields = ["name"]            # 在页面顶部显示一个搜索栏，可根据指定字段搜索数据

    # 设置每个Model实例的修改页面
    fieldsets = [                                # 设置要显示的字段
        (None,      {"fields": ["text"]}),        # 这一栏名为None（即不显示），包含一个字段
        ("advance", {"fields": ["pub_date"], "classes": ["collapse"]}),    # 这一栏默认为折叠样式
    ]
    readonly_fields = ["name"]                    # 设置哪些字段是只读的，不可修改

    inlines = [ChoiceInline]                    # 添加Choice对象作为内部属性

    def save_model(self, request, obj, form, change):        # 重载“保存”按钮的方法
        if form.is_valid():
            ...
        if not change:
            ...
        super().save_model(request, obj, form, change)
- 搜索栏的使用规则。
  - 若search_fields = ["name", "text"]，则当用户搜索"1 2"时，Django会按以下逻辑进行搜索：
WHERE (name ILIKE '%1%' OR text ILIKE '%1%') AND (name ILIKE '%2%' OR text ILIKE '%2%')
  - search_fields = ["^name", "=text"]，则当用户搜索"1 2"时，Django会按以下逻辑进行搜索：
WHERE (name ILIKE '1%' OR text ILIKE '1') AND (name ILIKE '2%' OR text ILIKE '2')
- 其它设置。
list_per_page = 100            # 每页最多显示多少条数据（默认100）
list_max_show_all = 200        # 当总数低于多少时显示"show all"按钮，允许用户查看所有数据（默认200）

view_on_site = True            # 在admin页面的右上角显示一个跳转到前台网站的链接

- 添加Action。
actions_on_top = True        # 是否在列表上方显示actions的下拉框，默认为True
actions = ["delete"]        # 一个列表，包含自定义的actions

# 定义action函数，它接收三个参数，其中queryset表示被选中的数据项的集合
def delete(self, request, queryset):
    queryset.update(text="")
    self.message_user(request, "action done")     # 在admin页面上方显示一行提示

# 设置action的名字
delete.short_description = "delete"
  - 调用完action函数之后，Django默认会返回之前的修改页面。可以自定义return的结果。比如：return redirect(...)
## 
## 
## 
 
♢ xadmin
## xadmin：Python的第三方库，是Django的插件，提供了更美观的admin页面。
- 优点：
  - 比Django自带的admin增加了少许功能，比如导出表格、显示外键关系。
- 缺点：
  - 使用时需要修改admin.py的内容。
## 用法。
1.    安装：pip install xadmin2
2.    在settings.py的INSTALLED_APPS[]中加入'xadmin'和'crispy_forms'。
3.    更新数据库：
python manage.py makemigrations
python manage.py migrate
4.    在主urls.py中加入URL：
import xadmin

urlpatterns = [
    path('xadmin/', xadmin.site.urls),
]
5.    在每个app下创建adminx.py，格式如下：
import xadmin
from xadmin import views
from xadmin.plugins.actions import BaseActionView

from .models import Project

@xadmin.sites.register(views.BaseAdminView)
class BaseSetting():    # 基本设置
    enable_themes = True  # 开启主题功能
    use_bootswatch = True  # 显示切换主题的下拉框

@xadmin.sites.register(views.CommAdminView)
class GlobalSetting():  # 全局设置
    site_title = "管理平台"   # 设置页面标题
    site_footer = "管理平台"  # 设置页脚
    menu_style = "accordion"   # 左侧菜单折叠显示

class MyAction(BaseActionView): # 定义一个动作
    action_name = "my_action"  # 动作名
    description = "参数化构建"  # 要显示的名字
    model_perm = "change"   # 该动作所需权限

    def do_action(self, queryset):  # 重载do_action()方法
        try:
            for i in queryset:
                ...
            self.message_user(message="Done", level="success")    # level的值必须小写
        except Exception as e:
            self.message_user(e, "error")

@xadmin.sites.register(Project)
class ProjectAdmin():
    list_display = ["project_name"]
    search_fields = ["project_name"]
    fieldsets = [(None, {"fields": ["project_name"]})]
    actions = [MyAction]
## 
## 
## 
 
♢ simpleui
## simpleui：Python的第三方库，是Django的插件，提供了更美观的admin页面。
- 优点：
  - 显示界面比较轻巧、美观。
  - 使用时不需要修改admin.py的内容，完全兼容Django自带的admin。
  - 将页面显示成框架中的视图，方便嵌入自制的页面。
- 缺点：
  - 功能与Django自带的admin一样少。
  - 加载速度有点慢。
## 用法。
1.    先启用Django自带的admin页面。
2.    安装：pip install django-simpleui
3.    在settings.py的INSTALLED_APPS[]中加入'simpleui'，放在第一行。
## 在settings.py中增加simpleui的配置：
# 设置首页
# SIMPLEUI_HOME_PAGE = 'https://www.baidu.com'

# 首页图标,支持element-ui的图标和fontawesome的图标
# SIMPLEUI_HOME_ICON = 'el-icon-date'

# 设置simpleui 点击首页图标跳转的地址
SIMPLEUI_INDEX = 'https://www.88cto.com'

# 首页显示服务器、python、django、simpleui相关信息
# SIMPLEUI_HOME_INFO = True

# 首页显示快速操作
# SIMPLEUI_HOME_QUICK = True

# 首页显示最近动作
# SIMPLEUI_HOME_ACTION = True

# 自定义SIMPLEUI的Logo
# SIMPLEUI_LOGO = 'https://avatars2.githubusercontent.com/u/13655483?s=60&v=4'

# 登录页粒子动画
# SIMPLEUI_LOGIN_PARTICLES = True

# 自定义simpleui 菜单
SIMPLEUI_CONFIG = {
    'system_keep': True,    # 在自定义菜单的基础上保留系统模块
    'menus': [{
        'name': 'Simpleui',
        'icon': 'fas fa-code',
        'url': 'https://gitee.com/tompeppa/simpleui'
    }, {
        'name': '测试',
        'icon': 'fa fa-file',
        'models': [{
            'name': 'Baidu',
            'url': 'http://baidu.com',
            'icon': 'far fa-surprise'
        }, {
            'name': '内网穿透',
            'url': 'https://www.wezoz.com',
            'icon': 'fab fa-github'
        }, {
            'name': '内网穿透',
            'url': 'https://www.wezoz.com',
            'icon': 'fab fa-github'
        }, {
            'name': '登录页嵌套测试',
            'url': '/login'
        }]
    }]
}

# 是否显示默认图标
# SIMPLEUI_DEFAULT_ICON = True

# 图标设置，图标参考：
SIMPLEUI_ICON = {
    '系统管理': 'fab fa-apple',
    '员工管理': 'fas fa-user-tie'
}

# 指定simpleui 是否以脱机模式加载静态资源，为True的时候将默认从本地读取所有资源，即使没有联网一样可以。适合内网项目
# 不填该项或者为False的时候，默认从第三方的cdn获取
SIMPLEUI_STATIC_OFFLINE = False


## 
## 
 
♢ restframework
## restframework：Python的第三方库，是Django的插件，用于更好地实现Django的Restful API。
- 特点。
  - 让Django通过Restful API与前端通信，返回JSON格式的数据。
  - 提供了调试用的API网页，可以发出OPTIONS、GET、POST等请求。
  - 提供了将Model序列化、反序列化的方法。
## 用法示例。
1.    安装模块：pip install djangorestframework
2.    在settings.py的INSTALLED_APPS中加入'rest_framework'。
3.    在app目录下的models.py文件中定义数据表：
from django.db import models

class Student(models.Model):
    name = models.CharField(max_length=32, default='')
    add_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
4.    在app目录下创建一个serializers.py文件，用于定义序列化器。
from .models import Student
from rest_framework import serializers

class StudentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Student
        fields = ('name', 'add_date')
)
5.    在app目录下的views.py文件中加入如下内容，显示默认的API页面。
from .models import Student
from .serializers import StudentSerializer
from rest_framework import viewsets

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('add_date')        # 重载ModelViewSet的两个属性
    serializer_class = StudentSerializer
6.    最后，在urls.py文件中注册URL路径，如下。
from django.urls import path, include
from rest_framework import routers
from .views import StudentViewSet

router = routers.DefaultRouter()
router.register(r'students', StudentViewSet)    # 用routers路由器注册viewsets

urlpatterns = [path(r'', include(router.urls))
                ]
7.    启动测试服务器之后，访问 127.0.0.1/students/ 即可看到对应的API页面。
## 定义视图函数的示例。
from rest_framework.decorators import api_view

@api_view(['GET','POST'])
def test(request, format=None):
    if request.method == "GET":
        ...
    if request.method == "POST":
        ...

## 定义视图类的示例。
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer

class StudentView(APIView):
    def get(self, request, format=None):
        students = Student.objects.all()
        # 创建序列化器，将多个Model实例序列化成JSON文本（默认many=False，用于序列化一个实例）
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = StudentSerializer(data=request.data)   # 创建序列化器，将JSON文本反序列化
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def put(self, request, pk, format=None):
        student = get_object_or_404(Student, pk)
        serializer = StudentSerializer(student, data=request.data)  # 反序列化并更新实例
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk, format=None):
        student = get_object_or_404(Student, pk)
        student.delete()
        return Response(status=204)

- 在urls.py文件中注册该URL：
urlpatterns = [
    path('students/', views.StudentView.as_view()),
]
- 可以基于Model示例或JSON文本创建serializer序列化器，然后可以用serializer.data导出JSON文本，也可以用serializer.save()保存到数据库中。
- restframework修改了request对象，可通过request.data获取请求报文的body（dict类型）。
- restframework提供了更灵活的Response()函数，直接请求127.0.0.1/students/会返回JSON格式的报文body，而请求127.0.0.1/students/?format=api时会返回HTML格式的报文body，用于显示API页面。
## 可在settings.py中加入如下字典，用于保存restframework的配置：
REST_FRAMEWORK = {
    ...
}
## 
## 
## 
 
tests
## Django提供了django.test.TestCase类，通过继承它可以定义测试类，测试方法的名字要以test开头。如下：
from django.test import TestCase

class QuestionModelTests(TestCase):
    def test_was_published(self):
        self.assertIs(Question.was_published(), False)        # 断言某个值应该为False，否则报错
- 也可以安装pytest-django模块，用pytest执行Django项目目录下的测试用例。
- 原则上，应该对每个Model、视图都分别编写测试用例。
## 
## 
## 
## 
## 
 
示例
## 登录模块。
- 需要设计的页面：login页面、register页面、logout页面、home页面。
  - 用户访问login页面即可登录。
  - 在login页面有一个register页面的链接，用户可以点击它进行注册。
  - 当用户登录之后，在一般页面上不再显示“登录”按钮，而是显示“注销”按钮。用户在注销之后会被重定向到logout页面，或者login页面。
- 下例是一个处理登录请求的view函数：
@require_http_methods(["POST"])
def login(request):
username = request.POST.get('username')        # 从POST表单中提取用户名、密码
password = request.POST.get('password')

if request.session.get("username"):            # 已登录的用户不能重复登录
    return JsonResponse({'error': 'Already logged in.'}, status=403)

user = models.User.objects.get(name=username)
if check_hash(password, user.password):        # 根据哈希值判断密码是否正确
    request.session["username"] = ...            # 将用户名保存到session中，表示该用户已登录
    return redirect("/")                        # 登录成功之后，重定向到其它页面

- 服务器每次收到用户的HTTP请求时，都要检查用户是否已登录。如果未登录，则重定向到login页面。
if not request.session.get("username"):
    return redirect("/login")
- 除了密码，还可通过OAuth、SSH密钥、API密钥等方式进行认证。
## 权限管理系统。

RBAC  是基于角色的访问控制（Role-Based Access Control ）在 RBAC  中，权限与角色相关联，用户通过成为适当角色的成员而得到这些角色的权限。
- 需要设计的数据表：User、Group、Permission
  - User与Group、User与Permission、Group与Permission都是多对多关系。
  - User的示例：
class User(models.Model):
    username = models.CharField('username', max_length=32, unique=True, validators=[username_validator])
    password = models.CharField('password', max_length=32)        # 密码要按哈希值存储
    email = models.EmailField('email address', blank=True)
    date_joined = models.DateTimeField('date joined', auto_now_add=True)

    is_superuser = models.BooleanField('is superuser', default=False)
    groups = models.ManyToManyField(Group, verbose_name='groups', blank=True)
    permissions = models.ManyToManyField(Permission, verbose_name='permissions', blank=True)

    def has_permission(self, permission, obj=None):
        if self.is_superuser:        # 如果用户是超级管理员，则拥有所有权限
            return True
        ...

- 服务器每次收到用户的HTTP请求时，都要检查用户是否对该操作有权限。如下：
if not self.has_permission(request, obj):
    return JsonResponse({'error': '403 Forbidden'}, status=403)
## CMDB（Configuration Management Database，配置管理数据库）：用于存储硬件、软件资源的信息并进行管理。
- CMDB是运维的主要工具，一般做成Web或软件，可在CMDB的基础上搭建其它管理系统。
- CMDB系统应该至少分为两层：
  - 管理层：管理实际的资源。
  - 业务层：通过UI界面与用户交互。
## DevOps平台：将DevOps流程整合到一个网站上。包含以下功能：
- 从开发到部署的流程
  - 部署的环节是容器编排
- CMDB
- 监控系统：记录日志、自动告警
- 自动运维：比如自动执行一些脚本
- 统计报表
## 
## 
## 
## 
## 
## 
:::