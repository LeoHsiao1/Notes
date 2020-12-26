


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








- 如果请求URL与URLconf中的任何模式都不匹配，并且不以斜杠结尾，则将HTTP重定向发送到同一URL，并附加斜杠。请注意，重定向可能会导致POST请求中提交的所有数据丢失。

