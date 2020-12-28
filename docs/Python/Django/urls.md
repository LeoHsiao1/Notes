


urls.py
## urls.py 文件中声明了 app 监听的所有 URL 以及相应的 view 函数，每条规则就是一个 urlpattern 。
- 当客户端发来 HTTP 请求时，Django 会进入主 app 的 urls.py ，按从上往下的顺序，尝试匹配其中的 urlpattern 。如果有匹配的 urlpattern 就调用相应的 view 函数来处理该 HTTP 请求。
  - 调用 view 函数时，默认会传入当前的 HttpRequest 对象，也可以传入一些额外的参数。
  - 如果没有匹配的 urlpattern 就返回 http404 。
## 使用函数 path(route, view, kwargs=None, name=None)可以设置一个 urlpattern 。如下：
from django.urls import path
from . import views

urlpatterns = [
    path('index', views.index)
    path('home', views.home)
]
- route    ：一个字符串，表示 URL 。
  - route 不必以 / 开头。
例如，当客户端请求的 URL 为"www.example.com/app1/?page=3"时，匹配"app1/"。
  - route 通常以 / 结尾。
如果 route 以 / 结尾，则用户可以访问 app1/，访问 app1 时会自动跳转 app1/的路径。
如果 route 不以 / 结尾，则用户只能访问 app1 ，访问 app1/时会报错 404 。
- view        ：指向一个视图函数。
- kwargs    ：一些字典参数，可以传给 view 函数。
- name        ：该 URL 的名字。设置了 name 之后，就可以在 Django 中通过 name 引用该 URL 。
## 可以使用 Path 转换器从 URL 提取某个字段的值，传入 view 函数。如下：
path('index/<int:id>/', views.hello)    # 当 URL 为"index/10/"时，会给 views.hello 函数传入参数 id=10
- Path 转换器可以是以下类型：
<int:x>        # 匹配一个 int 型常量
<str:x>        # 匹配一个不包含斜杆 / 的字符串
<path:x>        # 匹配一个任意形式的字符串
## 用 re_path()函数可以按照正则表达式进行匹配。如下：
from django.urls import re_path
from . import views

urlpatterns = [
re_path(r'^hello/$', views.hello)
re_path(r'^date/(?P<year>[0-9]{4})/$', views.date),    # 将第二个字段作为 year 参数传给视图函数
]
## 可以在 urlpattern 中直接重定向：
from django.views.generic import RedirectView
urlpatterns = [
    path('home/', view.home),
    path('', RedirectView.as_view(url='/home')),
]
## 可以在主 urls.py 中设置 400 等报错页面。
from . import views

handler400 = views.bad_request
handler403 = views.permission_denied
handler404 = views.page_not_found
handler500 = views.error
## 用 include()函数可以将 URL 转发到其它 urls.py 文件（这些 urls.py 文件必须已经声明 app_name）。
from django.urls import include
from . import views

urlpatterns = [
    path('hello/', include('app1.urls', namespace='app1')),
            # 例如：当 URL 为"hello/10/"时，会匹配'hello/'，然后将剩下的"10/"传入 app1.urls 继续匹配
    path('hello_pre/', include('app1.urls', namespace='app1_pre')),
    path('test/', include([            # 可以给 include()函数输入一个 urlpattern 的列表
        path('get/', views.test_get),
        path('post/', views.test_post)
    ]))
]
- 重复引入同一个 app 的 urls.py 时，要使用不同的 namespace 来区分，当做该 app 的不同实例。
  - app_name 是 app 的应用命名空间，而 namespace 是 app 的实例命名空间。
- 可以动态获取当前的 namespace ：
def hello2(request):
namespace = request.resolver_match.namespace
url_name='{}:hello'.format(namespace)
return redirect(reverse(url_name))
## 为了避免不同 app 的 URL 名字发生重名冲突，可以通过命名空间进行划分。
- 例：
  - 编写 app1 的 urls.py ：
app_name = 'app1'                                    # 设置 app 的名字
urlpatterns = [
    path('hello/', views.hello, name='hello'),        # 设置 urlpattern 的名字
    path('hello2/', views.hello2, name='hello2'),
]
  - 编写主 app 的 urls.py ：
urlpatterns = [
    path('', include('app1.urls', 'app1')),
]
  - 在 view 函数中根据名字使用 URL ：
from django.shortcuts import redirect, reverse

def hello(request):
    return render(request, 'hello.html')

def hello2(request):
    return redirect(reverse('app1:hello'))        # 根据 URL 的名字反向解析出 URL ，然后重定向到它
  - 在模板中根据名字使用 URL ：
<a href="/'hello/{{ id }}/">hello</a>                # 使用实际 URL ，给 id 变量赋值
<a href="{% url 'hello' id %}">hello</a>            # 根据名字使用 URL
<a href="{% url 'app1:hello' id %}">hello</a>        # 指定 app_name








- 如果请求 URL 与 URLconf 中的任何模式都不匹配，并且不以斜杠结尾，则将 HTTP 重定向发送到同一 URL ，并附加斜杠。请注意，重定向可能会导致 POST 请求中提交的所有数据丢失。

