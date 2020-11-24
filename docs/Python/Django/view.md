# view

Django 有两种定义视图的方式：
- function based view ：基于函数的视图
- class based view ：基于类的视图


## 视图函数



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







