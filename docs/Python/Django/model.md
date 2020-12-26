# model


定义 Model 的示例：
```py
class Person(models.Model):
   name       = models.CharField(max_length=32)

class Book(models.Model):
   name       = models.CharField(max_length=32)
   author     = models.ForeignKey(Person, on_delete=models.PROTECT, verbose_name='作者', related_name='book_set', null=True, blank=True)
   reader_set = models.ManyToManyField(to=Person, verbose_name='读者', related_name='read_book_set', blank=True)
```

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
  如果删掉了迁移文件，则执行 python manage.py migrate 时就不能发现用户对数据库进行了哪些修改。
  如果嫌迁移文件太多，可以先执行一次成功的 python manage.py migrate ，然后把 migrations 目录清空，执行 python manage.py makemigrations ，从 0001_initial.py 开始重新生成迁移文件。
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
- 设置了 ordering 之后，每次查询数据时 Django 都会将返回的数据进行排序。
    ordering 可以设置多个排序字段。
    不能直接使用多对多外键作为排序字段，


## Model类支持继承。
- 父类应该定义成抽象类。
- 子类会继承父类的所有属性、方法。
  - 子类应该单独定义自己的meta类。


子类不能重载父类的字段。如下：
```py
class Human(models.Model):
    name = models.CharField(verbose_name='姓名', max_length=32)

class Man(Human):
    name = models.CharField(verbose_name='姓名', max_length=32)
```
```
django.core.exceptions.FieldError: Local field 'name' in class 'Man' clashes with field of the same name from base class 'Human'.
```



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
  - int型字段。(注意是指 MySQL 中的 int 型）
- models.FloatField(...)
  - float型字段。
- models.DecimalField(max_digits=5, decimal_places=2)
  - decimal型字段。max_digits表示总位数，decimal_places表示小数位数。
- models.CharField(verbose_name="名字", default="", blank=True, unique=True, max_length=20)
  - str型字段，用于存储较短的字符串。
  该字段在 MySQL 中会保存为 varchar 型的值

- models.TextField(...)
  - 文本字段，用于存储较长的字符串。
  该字段在 MySQL 中会保存为 text 型的值

- models.BooleanField(verbose_name='是否开启', default=True)
- models.DateField(verbose_name='更新日期', null=True, blank=True)
  - 会自动使用当前的datetime.date实例。
  - 不能设置default参数。
  - 以下两个参数可以启用一个，但启用之后该字段会变成editable=False，即不可修改。
  - 该字段在 MySQL 中会保存为 date 型的值。

auto_now=True        ：当数据被保存时，自动将该字段设置成当前时间。常用于保存修改时间。
auto_now_add=True    ：当数据被创建时，自动将该字段设置成当前时间。常用于保存创建时间。
- models.DateTimeField(auto_now_add=True)
  - 会自动使用当前的datetime实例。用法与models.DateField相同。


## 定义字段时的常用参数。
- primary_key=True        ：将该字段设置成主键。
- verbose_name=None    ：该字段在admin页面显示的名字。
- null=False    ：在数据库中定义数据表时，设置该字段不允许为null。
  如果设置了 null=False ，则必须给该字段设置 default 值。
- blank=False    ：在 admin 页面上新增数据项时不可以不填该字段。（在admin页面中，必填字段会显示为粗体）
    使用 blank=False 选项时，需要该字段已经设置了默认值，否则写入数据库时会报错。

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
- models.EmailField(verbose_name='邮箱地址')        # 要求输入一个有效的 email 地址，且不能为空
  email = models.EmailField(verbose_name='邮箱', default='', blank=True) # 可以为空
  该字段在 MySQL 中会保存为 varchar 型的值

- models.GenericIPAddressField(verbose_name='私有IP') # 要求输入一个有效的 IPv4 或 IPv6 地址，且不能为空
  models.GenericIPAddressField(verbose_name='公有IP', null=True, blank=True)  # 可以为空
  该字段在 MySQL 中会保存为 char 型的值

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
    虚拟字段可以在 list_display 中显示，但不能用作 list_filter、search_fields 等功能。

    from django.utils.html import format_html

    def info(self):                        # 创建一个"info"字段
        return format_html('<span style="color: #{};">{}</span>', "FF0000", self.name)

    info.short_description = "INFO"        # 设置该字段的名称
    info.admin_order_field = "name"        # 设置该字段按self.name的值排序（否则该字段不能排序）


定义：def format_html(format_string: str, *args: Any, **kwargs: Any)
原理类似于 str.format() 方法，第一个参数是格式化字符串，后面的参数会被填进来。
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
定义：models.OneToOneField(to, on_delete, to_field=None, ...)
last_name = models.OneToOneField(to=Name, on_delete=models.PROTECT)


## 多对一的外键。
定义：models.ForeignKey(to, on_delete, related_name=None, related_query_name=None, parent_link=False, to_field=None, ...)
school = models.ForeignKey(to=School, on_delete=models.PROTECT, verbose_name='学校', null=True, blank=True)
- 这里是将当前表的school字段关联到School表中的数据项。
  - Django会在该数据表中创建 school_id 字段作为外键，并建立索引。
- 一对一、多对一外键都会在当前数据表中创建一个外键字段，如果该字段的值无效（比如为空），则会报错。
- 因为外键是指向一个对象，而不是str，所以不能直接用于 search_fields 中，需要按以下格式指明外键的目标字段：
    search_fields = ['student__name', 'friends_set__name']


- 常用参数：
  - to参数表示要关联的目标数据表。用to="self"可以关联到自身。
  - on_delete参数表示当被关联的目标数据被删除时，执行什么操作。
on_delete=models.CASCADE 表示级联删除当前的数据项。
on_delete=models.PROTECT 表示报出完整性错误。
on_delete=models.SET_DEFAULT 表示使用默认值。
  - to_field="..."表示要关联的目标字段。默认关联到主键
  - 如果该表是目标表的子类，且设置了 parent_link=True ，则在admin页面中，点击该字段会跳转到被关联的目标表。
- Django会给被关联的目标表创建一个虚机字段，默认名为"student_set"的格式，它记录了指向某个school的所有student实例，从而可以反向查询。如下：
s = School.objects.get(pk=1)
s.student_set.all()
  - 可以用related_name="students"设置该字段的名字。
  - 因此两个表之间存在外键关系时，只需要在一个表中定义一个外键，在另一表中可以用 related_name 反向查询。不需要在两个表中都定义一个外键。不过这样也只能在一个表中编辑外键。


例：
class Author(models.Model):
    name = models.CharField(verbose_name='姓名', max_length=32)

class Book(models.Model):
    name = models.CharField(verbose_name='书名', max_length=32)
    author = models.ForeignKey(Author, verbose_name='作者', related_name='book_set', related_query_name='whose_book')


- 调用外键字段的 .all() 方法会返回一个QuerySet对象，包含所有与它存在外键关系的对象。如下：
>>> b = Book.objects.get(id=1)
>>> list(b.author.all())
[<Student: Leo>]


related_name、related_query_name是两个虚拟字段，用于反向查询。
- 通过 related_name 可以查询到该作者的所有书。如下：
>>> a = Author.objects.get(id=1)
>>> list(a.book_set.all())
[<Student: Hello World>]

- 通过 related_query_name 可以查询到拥有指定书的作者。如下：
Author.objects.filter(whose_book__name='Hello World')








## 多对多的外键。


定义：models.ManyToManyField(to, related_name=None, related_query_name=None, through=None, through_fields=None, ...)


例：
class Team(models.Model):
    name = models.CharField(verbose_name='名称', max_length=32, unique=True)

class Member(models.Model):
    name = models.CharField(verbose_name='名称', max_length=32, unique=True)
    team_set = models.ManyToManyField(to=Team, verbose_name= '团队')

- Django会在数据库中创建一个中间表来存储多对多关系。该中间表的命名格式如同 ${appname}_member_team_set ，包含三个字段：id、member_id、team_id。
- 多对多外键没有 on_delete 选项，删除一条数据时会自动删掉它的外键关系，即使重新创建它也不会恢复（因为 id 不同）。
- 因为它是通过中间表存储外键关系，所以可以不填：设置 blank=True 参数（不必设置 default 参数），就允许在新增数据时不选择外键。
- 可以自定义中间表，如下：
class Student(models.Model):
    name = models.CharField(max_length=32, default='')
    def __str__(self):
        return self.name

class Group(models.Model):
    name = models.CharField(max_length=32, default='')
    members = models.ManyToManyField(
        Student,
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


ManyToManyField 如果指向当前表，则默认会创建对称的多对多外键。

如下：
class Person(models.Model):
    name = models.CharField(verbose_name='名字', max_length=32, unique=True)
    friends = models.ManyToManyField("self")        # 默认是对称的
    # friends = models.ManyToManyField("self", symmetrical=False)   # 取消对称

如果创建两个 Person，名 A 和 B ，然后在 A 的 friends 中加入 B ，则默认会自动在 B 的 friends 中加入 A 。最终保存的中间表如下：
id from_person_id to_person_id
1	1	2
2	2	1




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
Student.objects.all().order_by("id")         # 排序（从小到大），返回一个QuerySet对象
Student.objects.all().order_by("-id")        # 倒序排序（从大到小）
Student.objects.all().order_by("id")[0:2]    # 切片

  - QuerySet对象可以当作列表索引、迭代，也可以用filter()等方法处理。
- 筛选：

QuerySet.first()    # 如果 QuerySet 不为空，则返回第一个元素。如果为空，则返回 None
QuerySet.last()     # 如果 QuerySet 不为空，则返回最后一个元素


当 QuerySet 为空时，使用索引会报错，使用 first() 会返回 None ，如下：
```py
>>> Student.objects.filter(id=10)
<QuerySet []>
>>> Student.objects.filter(id=10)[0]
IndexError: list index out of range
>>> Student.objects.filter(id=10).first()
```




QuerySet.filter(name='Leo')        # 筛选符合条件的所有数据，返回一个QuerySet对象。如果没有数据则返回[]
QuerySet.filter(name='Leo', id=1) # 可以同时查询多个字段


QuerySet.exclude(name='Leo')        # 筛选不符合条件的所有数据，返回一个QuerySet对象
  - 可以使用高级的筛选条件：
QuerySet.filter(name__startswith='L')    # 用__istartswith、__iendswith、__icontains则是不区分大小写
QuerySet.filter(name__endswith='o')
QuerySet.filter(name__contains='L')
- 精确查询：
s = Student.objects.get(id=1)        # 返回一个Student对象
s = Student.objects.get(pk=1)        # pk代表主键
  - get()方法容易引发异常，要谨慎使用。不如使用 QuerySet.filter(name='Leo').first()
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



## 外键



- 为 ManyToManyField 外键赋值：
  ```py
  book = Book()                       # 创建一个 book 对象
  book.save()                         # 将 book 对象保存到数据库中（这样才能建立外键）
  person = Person.objects.get(id=1)
  book.reader_set.add(Person)         # 增加外键的值
  ```

- 遍历多对多外键：
  ```py
  for i in book.reader_set.all():
      pass
  ```



## QuerySet



```py
class QuerySet:
    
    ...

    def select_related(self, *fields)
        """
        返回一个新的 QuerySet ，将当前 QuerySet 的外键所指的对象也查询出来并缓存。常用于预先查询外键，以免每次访问外键时才开始查询，减少执行 SQL 的次数。
        只支持 OneToOneField、ForeignKey 外键。
        例：
        ```py
        .select_related()                    # 默认查询所有外键字段所指的对象
        .select_related('field1', 'field2')  # 只查询指定外键所指的对象
        .select_related(None)                # 传入 None 会清空 select_related 缓存的数据
        """

    def prefetch_related(self, *lookups)
        """
        与 select_related 相似，但原理是分别查询当前表和被外键关联的表。
        主要用于 ForeignKey、ManyToManyField 外键。
        """

```

### 利用缓存

- 一般的查询过程：
  ```py
  [root@Centos ~]# python manage.py shell
  >>> from app1.models import Book
  >>> book = Book.objects.get(pk=1)   # 此时会执行 SQL ，查询 book 实例的所有字段，并缓存
  [Execute SQL] SELECT "app1_book"."id", "app1_book"."name", "app1_book"."abstract", "app1_book"."author_id", "app1_book"."datetime" FROM "app1_book" WHERE "app1_book"."id" = ? LIMIT 21
  >>> book.name                       # 此时不会再执行 SQL ，而是使用缓存的数据
  '测试1'
  >>> book.author                     # 此时会查询外键实例的所有字段，并缓存
  [Execute SQL] SELECT "app1_person"."id", "app1_person"."name" FROM "app1_person" WHERE "app1_person"."id" = ? LIMIT 21
  <Person: Leo>
  >>> book.author                     # 此时不会再执行 SQL ，而是使用缓存的数据
  <Person: Leo>
  >>> book.author.name
  'Leo'
  ```
  - pk 是 Primary Key 的缩写。

- QuerySet 是对数据库的 lazy 查询，等取用数据时才会实际执行 SQL 。
  - 如果进行多个 QuerySet 的级联查询，则会将这些查询操作合并成一个 SQL 语句，返回最后一个 QuerySet 时才执行该 SQL 。如下：
    ```py
    >>> Book.objects.filter(pk=1).filter(pk=1).filter(pk=1)
    [Execute SQL] SELECT "app1_book"."id", "app1_book"."name", "app1_book"."abstract", "app1_book"."author_id", "app1_book"."datetime" FROM "app1_book" WHERE ("app1_book"."id" = ? AND "app1_book"."id" = ? AND "app1_book"."id" = ?) ORDER BY "app1_book"."datetime" DESC LIMIT 21
    <QuerySet [<Book: 测试1>]>
    ```
    除了最后一个 QuerySet ，不需要担心其它 QuerySet 的返回值为空导致查询中断，因为它们实际上并不会执行 SQL 。





- 例：调用 QuerySet.select_related() 方法
  ```py
  >>> book = Book.objects.filter(pk=1).select_related('author').first()
  [Execute SQL] SELECT "app1_book"."id", "app1_book"."name", "app1_book"."abstract", "app1_book"."author_id", "app1_book"."datetime", "app1_person"."id", "app1_person"."name" FROM "app1_book" LEFT OUTER JOIN "app1_person" ON ("app1_book"."author_id" = "app1_person"."id") WHERE "app1_book"."id" = ? ORDER BY "app1_book"."datetime" DESC LIMIT 1
  >>> book.author
  <Person: Will>
  >>> book = Book.objects.filter(pk=2).select_related('author').first()   # 这里重复调用 select_related() 时会重复执行 SQL ，因为被视作从 Book.objects.all() 开始的一次全新查询
  [Execute SQL] SELECT "app1_book"."id", "app1_book"."name", "app1_book"."abstract", "app1_book"."author_id", "app1_book"."datetime", "app1_person"."id", "app1_person"."name" FROM "app1_book" LEFT OUTER JOIN "app1_person" ON ("app1_book"."author_id" = "app1_person"."id") WHERE "app1_book"."id" = ? ORDER BY "app1_book"."datetime" DESC LIMIT 1
  ```

- 例：调用 QuerySet.prefetch_related() 方法
  ```py
  >>> book.reader_set 
  <django.db.models.fields.related_descriptors.create_forward_many_to_many_manager.<locals>.ManyRelatedManager object at 0x000002BF1AC772B0>
  >>> book.reader_set.all()
  [Execute SQL] SELECT "app1_person"."id", "app1_person"."name" FROM "app1_person" INNER JOIN "app1_book_reader_set" ON ("app1_person"."id" = "app1_book_reader_set"."person_id") WHERE "app1_book_reader_set"."book_id" = ? LIMIT 21
  <QuerySet [<Person: Leo>]>
  >>> book.reader_set.all()     # 重复查询 ManyToManyField 外键，会重复执行 SQL
  [Execute SQL] SELECT "app1_person"."id", "app1_person"."name" FROM "app1_person" INNER JOIN "app1_book_reader_set" ON ("app1_person"."id" = "app1_book_reader_set"."person_id") WHERE "app1_book_reader_set"."book_id" = ? LIMIT 21
  <QuerySet [<Person: Leo>]>
  >>> book = Book.objects.filter(pk=1).prefetch_related('reader_set').first()   # 预查询 ManyToManyField 外键
  [Print the SQL] SELECT "app1_book"."id", "app1_book"."name", "app1_book"."abstract", "app1_book"."author_id", "app1_book"."datetime" FROM "app1_book" WHERE "app1_book"."id" = ? ORDER BY "app1_book"."datetime" DESC LIMIT 1
  [Print the SQL] SELECT ("app1_book_reader_set"."book_id") AS "_prefetch_related_val_book_id", "app1_person"."id", "app1_person"."name" FROM "app1_person" INNER JOIN "app1_book_reader_set" ON ("app1_person"."id" = "app1_book_reader_set"."person_id") WHERE "app1_book_reader_set"."book_id" IN (?)
  >>> book.reader_set.all()     # 此时不再重复执行 SQL
  <QuerySet [<Person: Leo>]>
  >>> book.reader_set.all()[0] 
  <Person: Leo>
  ```


如果调用数据库，改变方法 add()， remove()， clear()或 set()上 ，对于关系的任何预取缓存将被清除
总之，命中缓存的逻辑比较复杂，应该调试一下是否命中缓存。还需要考虑缓存的过期时间、什么时候应该主动刷新缓存。

