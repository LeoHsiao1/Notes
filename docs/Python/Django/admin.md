# admin


定义 Model 的示例：
```py
class Author(models.Model):
   name = models.CharField(max_length=32)

class Book(models.Model):
   name = models.CharField(max_length=32)
   author = models.ForeignKey(Author, on_delete=models.PROTECT, verbose_name='作者', related_name='book_set', null=True, blank=True)
   editor_set = models.ManyToManyField(to=Author, verbose_name='编辑', related_name='edit_book_set', blank=True)
```


## 外键

- 如果表 A 存在指向表 B 的外键，则在 admin 页面编辑表 A 实例时，外键字段默认会显示成一个下拉框。


- 为 ManyToManyField 外键赋值：
    ```py
    book = Book()                       # 创建一个 book 对象
    book.save()                         # 将 book 对象保存到数据库中（这样才能建立外键）
    author = Author.objects.get(id=1)
    book.editor_set.add(author)         # 增加外键的值
    ```

## 内联

- 使用内联模型，可以在详情页面编辑外键字段时，以列表形式显示每个外键实例，且允许编辑。
- 例如：
    ```py
    class BookInline(admin.TabularInline):  # 定义一个内联模型，继承 admin.TabularInline 类
        model = Book                        # 该内联模型指向的数据表
        # model = Book.editor_set.through   # ManyToManyField 外键需要采用这种格式
        # verbose_name = None
        # verbose_name_plural = None
        # extra = 3                         # 额外显示几个空白的输入框，以供选择内联实例
        # min_num = None
        # max_num = None
        # can_delete = True

    class AuthorAdmin(admin.ModelAdmin):
        inlines = [BookInline]              # 使用内联模型，可以使用多个
    ```
