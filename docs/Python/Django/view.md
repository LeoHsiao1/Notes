# view

Django 有两种定义视图的方式：
- function based view ：基于函数的视图
- class based view ：基于类的视图


## 视图函数

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



## 视图类

### 基类

通过继承 View 类可以定义视图类，使得视图可以被继承、重载。

- `django.views.generic.base.View`
  - 是所有视图类的基类。
  - 定义：
    ```py
    class View:
        http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']   # 支持的 HTTP 方法

        def __init__(self, **kwargs):
            ...
        
        @classonlymethod
        def as_view(cls, **initkwargs):
            ...
    ```
    - 调用视图类的 as_view() 方法，会将 HTTP 请求交给视图类中与请求方法同名的 method 处理。
    - 比如 GET 请求会交给 get() 方法处理。如果没有匹配的 method 则会返回响应报文：`403 Forbidden`
  - 用法：
    1. 在 views.py 中定义视图类：
        ```py
        from django.http import HttpResponse
        from django.views.generic import View
        
        class MyView(View):
            def get(self, request, *args, **kwargs):
                return HttpResponse('Hello')

        ```
    2. 在 urls.py 中使用视图类：
        ```py
        from django.urls import path, include
        from . import views
        
        urlpatterns = [
            path('index/', views.MyView.as_view()),
        ]
        ```

### 业务类

Django 提供了一些常见业务逻辑的的视图类，通过继承它们可以快速定义视图类，都不需要再定义具体的 get、post 等方法。

- `django.views.generic.base.TemplateView`
  - 用于渲染 HTML 模板。如下：
    ```py
    path('index/', TemplateView.as_view(template_name='index.html'))
    ```

- `django.views.generic.base.RedirectView`
  - 用于重定向（默认为 302 临时重定向）。如下：
    ```py
    path('index/', RedirectView.as_view(url='/home/'))
    ```

- `django.views.generic.list.ListView`
  - 用于显示某个 Model 的实例列表。
  - 收到 GET 请求时，它会调用 get_context_data() 方法生成 context 字典，然后渲染 HTML 模板，生成响应报文。
  - 如下：
    ```py
    class MyListView(ListView):
        model = Question                                # 采用的 Model
        template_name = 'app1/index.html'               # 采用的 HTML 模板，默认为 <app_name>/<model_name>_list.html
        context_object_name = 'latest_question_list'    # 默认为 `<model name>_list`

        def get_context_data(self, **kwargs):
            """
            该方法用于生成 context 字典
            - 默认会调用 get_queryset() 方法，并将它的返回值赋值给 context 字典中名为 context_object_name 的参数。
            """
            kwargs['category_list'] = Question.objects.all().order_by('name')
            return super(IndexView, self).get_context_data(**kwargs)

        def get_queryset(self):
            """ 该方法默认会返回该 Model 的所有实例 """
            return model.objects.order_by('-create_date')[:5]

    ```

- `django.views.generic.detail.DetailView`
  - 用于显示某个 Model 实例的全部属性。







