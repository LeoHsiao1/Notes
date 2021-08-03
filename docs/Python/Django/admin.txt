# admin


- admin 模块可用于查看、管理 Django 中定义的所有 Model 数据表。
- 在 Web 页面上查看 admin 系统时，主要有两种显示页面：
  - changelist_view ：表格视图。通过一个表格显示一个数据表的内容，每行显示一个 Model 实例，支持搜索、排序等功能。
  - changeform_view ：表单视图。通过一组表单显示某个 Model 实例的各个字段的内容，常用于新增、查看、编辑实例。

admin 页面
## Django 自带了一个 admin 模块，用于显示 Web 形式的后台管理页面，可以管理用户组、数据库、各个数据表。
- admin 页面使用的模板文件保存在 Django 安装目录的 django/contrib/admin/templates 目录下，可以将这些模板文件拷贝到当前的 app 目录下，改写它们。
- admin 系统本身会创建一些表。比如 django_admin_log 表用于记录用户在 admin 页面上进行的操作，比如对某个数据表的修改时间。

## 用法。
1.    在一个 models.py 的同目录下创建一个 admin.py ：
from django.contrib import admin
from .models import Student

admin.site.register(Student)                # 将数据库的 Model 注册到 admin 页面中
2.    在 urls.py 中声明该页面的 URL（默认已经声明了）。
from django.urls import path
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),        # 管理员界面是绑定到 django.contrib.admin.site.urls 上
]
3.    创建一个管理员账号（可以创建多个）：
python manage.py createsuperuser
4.    在域名后加上'admin/'即可访问管理员页面。
## 设置 admin 页面。
from django.contrib import admin

admin.site.site_title = "后台管理"        # 设置网页的标题
admin.site.site_header = "后台管理"    # 设置网页中显示的名称

## 定义 Model 的显示类。
- 通过继承 admin.ModelAdmin 类可以定义某个 Model 的显示类，并用@admin.register()注册。如下：
from django.contrib import admin
from .models import Choice, Question

class ChoiceInline(admin.TabularInline):        # 继承 admin.TabularInline 类
    model = Choice
    extra = 3                                    # 每次额外显示 3 个 choice 项

@admin.register(Question)                        # 将 QuestionAdmin 配置应用到 Question 表
class QuestionAdmin(admin.ModelAdmin):            # 继承自 admin.ModelAdmin 类
    # 设置该 Model 的管理页面（是一个列表）
    list_display = ["name", "text"]    # 设置要显示的字段（默认只显示 __str__()）
    list_display_links = ["name"]        # 点击 list_display 中的哪些字段显示成链接，可以跳转到实例的修改页面
    # 这些字段必须在 list_display 列表中存在
    # list_display_links = None 表示不会显示链接

    list_editable = ["text"]            # 设置 list_display 中的哪些字段可以编辑（会显示成文本框）
    list_filter = ["pub_date"]          # 在页面右侧显示一个过滤器，可根据指定字段筛选数据。这些字段不能是虚拟字段，但不必在 list_display 列表中存在
    search_fields = ["name"]            # 在页面顶部显示一个搜索栏，可根据指定字段搜索数据
    # filter_horizontal = ('friends',)  # 专门用于编辑 ManyToManyField 类型的字段，显示两个多选框以便于筛选（否则默认只显示一个下拉框）

    # 设置在 changeform_view 视图显示哪些字段，可以将显示区域分成竖向的多栏
    fieldsets = [
        (None,      {"fields": ["text"]}),                  # 定义第一栏，名为 None（即不显示名称），包含一个字段
        ("details", {"fields": ['id', 'name', "pub_date"],  # 定义第二栏，名为 details
                     "classes": ["collapse"],               # 采用指定的 CSS 样式
                     'description': 'this is for test',     # 显示一段注释文字
                    }),
    ]

    # 默认每个字段在显示时独占一行，相邻字段之间的距离为 2 倍行距。可以将多个字段组合成一个元组，从而将它们的显示间距减少为 1 倍行距。
    # "fields": [('id', 'name'), "pub_date"]

    # 常用的 CSS 样式：
    # collapse    # 折叠显示
    # wide        # 每个字段的名称与值之间的间距增加一半


    readonly_fields = ["name"]                    # 设置哪些字段是只读的，不可修改

    inlines = [ChoiceInline]                    # 添加 Choice 对象作为内部属性

    def save_model(self, request, obj, form, change):        # 重载“保存”按钮的方法
        if form.is_valid():
            ...
        if not change:
            ...
        super().save_model(request, obj, form, change)
- 搜索框的使用规则。
  - 若 search_fields = ["name", "text"]，则当用户搜索"1 2"时，Django 会按以下逻辑进行搜索：
WHERE (name ILIKE '%1%' OR text ILIKE '%1%') AND (name ILIKE '%2%' OR text ILIKE '%2%')
  - search_fields = ["^name", "=text"]，则当用户搜索"1 2"时，Django 会按以下逻辑进行搜索：
WHERE (name ILIKE '1%' OR text ILIKE '1') AND (name ILIKE '2%' OR text ILIKE '2')



- 其它设置。
list_per_page = 100            # 每页最多显示多少条数据（默认 100）
list_max_show_all = 200        # 当总数低于多少时显示"show all"按钮，允许用户查看所有数据（默认 200）

view_on_site = True            # 在 admin 页面的右上角显示一个跳转到前台网站的链接

# 关于实例的修改页面
save_as = True        # 是显示 “保存为新的” 按钮，还是 “保存并增加另一个” 按钮
save_on_top = True    # 是否在页面顶部重复显示按钮（默认只在页面底部显示）


- 添加 Action 。

# 定义 action 函数，它接收三个参数，其中 queryset 表示被选中的数据项的集合
def delete(self, request, queryset):
    queryset.update(text="")
    self.message_user(request, "action done")     # 在 admin 页面上方显示一行提示

# 设置 action 显示的名字
delete.short_description = "delete"

# actions_selection_counter = True  # 是否显示当前勾选的实例数量
# actions_on_top = True             # 是否在列表上方显示按钮
# actions_on_bottom = False         # 是否在列表下方显示按钮
actions = ["delete"]                # 一个列表，记录所有 actions 的方法名


  - 调用完 action 函数之后，Django 默认会返回之前的修改页面。可以自定义 return 的结果。比如：return redirect(...)

##
##
##

django-import-export ：一个插件，用于在 admin 表格页面增加导入、导出两个按钮。


♢ xadmin
## xadmin ：Python 的第三方库，是 Django 的插件，提供了更美观的 admin 页面。
- 优点：
  - 比 Django 自带的 admin 增加了少许功能，比如导出表格、显示外键关系。
- 缺点：
  - 使用时需要修改 admin.py 的内容。
## 用法。
1.    安装：pip install xadmin2
2.    在 settings.py 的 INSTALLED_APPS[]中加入'xadmin'和'crispy_forms'。
3.    更新数据库：
python manage.py makemigrations
python manage.py migrate
4.    在主 urls.py 中加入 URL ：
import xadmin

urlpatterns = [
    path('xadmin/', xadmin.site.urls),
]
5.    在每个 app 下创建 adminx.py ，格式如下：
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

    def do_action(self, queryset):  # 重载 do_action()方法
        try:
            for i in queryset:
                ...
            self.message_user(message="Done", level="success")    # level 的值必须小写
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
## simpleui ：Python 的第三方库，是 Django 的插件，提供了更美观的 admin 页面。
官方文档：https://simpleui.88cto.com/docs/simpleui/quick.html

- 优点：
  - 显示界面比较轻巧、美观。
  - 使用时不需要修改 admin.py 的内容，完全兼容 Django 自带的 admin 。
  - 将页面显示成框架中的视图，方便嵌入自制的页面。
- 缺点：
  - 功能与 Django 自带的 admin 一样少。
  - 加载速度有点慢。
## 用法。
1.    先启用 Django 自带的 admin 页面。
2.    安装：pip install django-simpleui
3.    在 settings.py 中 INSTALLED_APPS[] 中加入 simpleui ：
```py
INSTALLED_APPS = [
    'simpleui',       # 在原 admin 之前导入 simpleui
    'django.contrib.admin',
    'django.contrib.auth',
    ...
]
```


## 在 settings.py 中增加 simpleui 的配置：
# 设置首页
# SIMPLEUI_HOME_PAGE = 'https://www.baidu.com'

# 首页图标,支持 element-ui 的图标和 fontawesome 的图标
# SIMPLEUI_HOME_ICON = 'el-icon-date'

# 设置 simpleui 点击首页图标跳转的地址
SIMPLEUI_INDEX = 'https://www.88cto.com'

# 首页显示服务器、python、django、simpleui 相关信息
# SIMPLEUI_HOME_INFO = True

# 首页显示快速操作
# SIMPLEUI_HOME_QUICK = True

# 首页显示最近动作
# SIMPLEUI_HOME_ACTION = True

# 自定义 SIMPLEUI 的 Logo
# SIMPLEUI_LOGO = 'https://avatars2.githubusercontent.com/u/13655483?s=60&v=4'

# 登录页粒子动画
# SIMPLEUI_LOGIN_PARTICLES = True

# 自定义 simpleui 菜单
SIMPLEUI_CONFIG = {
    'system_keep': True,    # 显示系统默认菜单
    'menus': [{     # 自定义菜单（系统默认显示的菜单只包含用户有权限查看的部分，但自定义的菜单总是会全部显示，但是如果用户没有查看权限，则会在点击时返回 403 页面）
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

# 可以到 https://fa5.dashgame.com/ 挑选图标

# 是否显示默认图标
# SIMPLEUI_DEFAULT_ICON = True

# 图标设置，图标参考：
SIMPLEUI_ICON = {
    '系统管理': 'fab fa-apple',
    '员工管理': 'fas fa-user-tie'
}

# 指定 simpleui 是否以脱机模式加载静态资源，为 True 的时候将默认从本地读取所有资源，即使没有联网一样可以。适合内网项目
# 不填该项或者为 False 的时候，默认从第三方的 cdn 获取
SIMPLEUI_STATIC_OFFLINE = False



## 例

```py
from django import db
from django import forms
from django.contrib import admin
from . import models


@admin.register(models.Person)
class PersonAdmin(admin.ModelAdmin):
    # list_display        = ['id', 'creation_time', 'changed_time', 'severity', 'project', 'subject', 'is_resolved', 'handler_link']
    # list_display_links  = ['id']
    # list_filter         = ['creation_time', 'changed_time']
    # search_fields       = ['id', 'severity', 'project', 'subject', 'handler__name']
    # fieldsets           = [(None, {'fields': [('id', 'creation_time', 'changed_time', 'severity', 'project', 'subject', 'is_resolved'), 'handler', 'cause', 'measure']})]
    # readonly_fields     = ['id', 'creation_time', 'changed_time']
    # autocomplete_fields = ['handler']
    # inlines             = [EmailInline, SmsInline]

    formfield_overrides = {     # 覆盖 form 表单的显示样式
        db.models.CharField: {'widget': forms.TextInput(attrs={'size':'20'})},
        db.models.TextField: {'widget': forms.Textarea(attrs={'rows':4, 'cols':40})},
    }


```
<!-- 可以通过 person__name、reader_set__name 的形式引用外键的字段。 -->





## 相关源代码

```py
# django/contrib/admin/options.py
class BaseModelAdmin(metaclass=forms.MediaDefiningClass):
    
    ...

    def get_queryset(self, request):
      """ 获取一个 QuerySet ，包含该 Model 的全部实例，用于显示 changelist_view 视图 """

    def has_add_permission(self, request, obj=None):
      opts = self.opts
      codename = get_permission_codename('add', opts)
      return request.user.has_perm("%s.%s" % (opts.app_label, codename))

    def has_change_permission(self, request, obj=None):

    def has_delete_permission(self, request, obj=None):

    def has_view_permission(self, request, obj=None):



```

```py
class ModelAdmin(BaseModelAdmin):

    ...

    def __init__(self, model, admin_site):
        self.model = model
        self.opts = model._meta
        self.admin_site = admin_site
        super().__init__()

    def __str__(self):
        return "%s.%s" % (self.model._meta.app_label, self.__class__.__name__)

    def get_urls(self):
        """ 生成 admin 模块的 URL 列表，用于在 urls.py 中登记 """
        from django.urls import path

        def wrap(view):
            def wrapper(*args, **kwargs):
                return self.admin_site.admin_view(view)(*args, **kwargs)
            wrapper.model_admin = self
            return update_wrapper(wrapper, view)

        info = self.model._meta.app_label, self.model._meta.model_name

        return [
            path('', wrap(self.changelist_view), name='%s_%s_changelist' % info),
            path('add/', wrap(self.add_view), name='%s_%s_add' % info),
            path('autocomplete/', wrap(self.autocomplete_view), name='%s_%s_autocomplete' % info),
            path('<path:object_id>/history/', wrap(self.history_view), name='%s_%s_history' % info),
            path('<path:object_id>/delete/', wrap(self.delete_view), name='%s_%s_delete' % info),
            path('<path:object_id>/change/', wrap(self.change_view), name='%s_%s_change' % info),
            # For backwards compatibility (was the change url before 1.9)
            path('<path:object_id>/', wrap(RedirectView.as_view(
                pattern_name='%s:%s_%s_change' % ((self.admin_site.name,) + info)
            ))),
        ]

    @property
    def urls(self):
        return self.get_urls()

    def get_form(self, request, obj=None, change=False, **kwargs):
      """ 获取数据，用于填入 add_view、change_view 视图的表单 """

    @csrf_protect_m
    def changelist_view(self, request, extra_context=None)
      """ 生成 changelist_view 视图的 HTTP 响应报文 """
      ...
      context = {
          **self.admin_site.each_context(request),
          'module_name': str(opts.verbose_name_plural),
          'selection_note': _('0 of %(cnt)s selected') % {'cnt': len(cl.result_list)},
          'selection_note_all': selection_note_all % {'total_count': cl.result_count},
          'title': cl.title,
          'is_popup': cl.is_popup,
          'to_field': cl.to_field,
          'cl': cl,
          'media': media,
          'has_add_permission': self.has_add_permission(request),
          'opts': cl.opts,
          'action_form': action_form,
          'actions_on_top': self.actions_on_top,
          'actions_on_bottom': self.actions_on_bottom,
          'actions_selection_counter': self.actions_selection_counter,
          'preserved_filters': self.get_preserved_filters(request),
          **(extra_context or {}),
      }
      request.current_app = self.admin_site.name
      return TemplateResponse(request, self.change_list_template or [
          'admin/%s/%s/change_list.html' % (app_label, opts.model_name),    # 尝试从这些位置查找模板文件
          'admin/%s/change_list.html' % app_label,
          'admin/change_list.html'
      ], context)

    def get_search_results(self, request, queryset, search_term):
        """ 用于实现 changelist_view 视图的搜索框。输入的 queryset 是事先查询出的该表全部实例，search_term 是查询字符串。 """
        ...
        search_fields = self.get_search_fields(request)
        if search_fields and search_term:         # 如果这两项不为空，才执行查询
            for bit in search_term.split():       # 将 search_term 按空白字符分割成多个字段，筛选出同时包含这些字段的实例
                queryset = queryset.filter(...)
            use_distinct = ...                    # 判断搜索结果是否包含重复项
        return queryset, use_distinct

```

## 外键

- 在 admin 页面显示可编辑的外键时，默认会通过一个下拉框显示可选的所有外键条目。
- ManyToManyField 字段默认显示成一个多选框，条目较多时很不方便。有以下几种改进方案：
  - 在 autocomplete_fields 参数中声明该字段。
  - 在 filter_horizontal 参数中声明该字段。
  - 在 filter_vertical 参数中声明该字段。
  - 通过内联模型显示外键。

- ManyToManyField 字段可以在 admin 的详情页面显示并编辑，但不能在 admin 的表格页面显示，因为它的值并不是 str 类型。
  - 可以创建一个虚拟字段，将它的值转换成 str 类型，以便显示。

- 在 admin 页面显示可编辑的外键时，开销比较大：
  - 以下拉框的形式显示外键时，admin 会先对外键指向的数据表进行全表查询，获取所有数据行的所有字段，再选取其中部分字段显示在下拉框中。导致耗费较多时间去执行 SQL 、渲染前端视图。
  - 以内联的形式显示外键时，渲染时间比下拉框的形式还要多一倍。
    - 建议内联表不要支持修改，只支持增加、删除条目。否则外键条目较多时，每个条目都会显示一个下拉框，线性增加渲染前端的耗时。

## 内联

- 内联是一种外键模型，用于在 admin 的详情页面显示外键时，以列表形式显示每个外键实例，且允许编辑。
- 内联模型相当于一个额外的字段，因此会与原本的外键下拉框同时显示。但不会重复查询数据表中的外键条目。
- 例：加入一个内联模型
  ```py
  class BookInline(admin.TabularInline):  # 定义一个内联模型，继承 admin.TabularInline 类
      model = Book                        # 该内联模型指向的数据表
      # model = Book.editor_set.through   # 如果是 ManyToManyField 外键，则需要采用这种格式

      # def has_change_permission(self, request, obj=None):
      #     return False                  # 不允许修改

  class PersonAdmin(admin.ModelAdmin):
      inlines = [BookInline]              # 使用内联模型，可以使用多个
  ```

## 相关源代码

```py
# django/contrib/admin/options.py

class InlineModelAdmin(BaseModelAdmin):
    model               = None
    fk_name             = None    # 外键的字段名（fk 是 Foreign Key 的缩写）。如果当前表指向 model 表的外键不止一个，才需要指定该参数
    extra               = 3       # 额外显示几个空白的输入框，以供选择内联实例
    min_num             = None
    max_num             = None
    template            = None
    verbose_name        = None
    verbose_name_plural = None
    can_delete          = True

    def get_formset(self, request, obj=None, **kwargs):
        """ 获取数据，用于填入 add_view、change_view 视图中的 formset 表单集 """

    ...

class TabularInline(InlineModelAdmin):
    template = 'admin/edit_inline/tabular.html'


class StackedInline(InlineModelAdmin):        # 比 TabularInline 模型的显示多些冗余，每个外键条目都显示其名称
    template = 'admin/edit_inline/stacked.html'

```
