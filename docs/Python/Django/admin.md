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
- 在 admin 的编辑页面，多对多外键默认显示成一个多选框，且不支持查询，条目较多时很不方便。有以下改进方案：
  - 在 filter_horizontal 参数中声明多对多外键，此时会显示成横向的两个多选框，一个用于显示待选条目，一个用于显示已选条目，还支持查询。
    ```py
    class AuthorAdmin(admin.ModelAdmin):
        ...
        filter_horizontal  = ('editor_set', )
    ```
  - 在 filter_vertical 参数中声明多对多外键，此时会显示成竖向的两个多选框。
  - 通过内联模型显示外键。

## 内联

- 内联是一种外键模型，用于在 admin 编辑页面显示外键时，以列表形式显示每个外键实例，且允许编辑。
- 内联模型相当于一个额外的字段，因此会与原本的外键下拉框同时显示。但不会重复查询数据表中的外键条目。
- 例：加入一个内联模型
    ```py
    class BookInline(admin.TabularInline):  # 定义一个内联模型，继承 admin.TabularInline 类
        model = Book                        # 该内联模型指向的数据表
        # model = Book.editor_set.through   # ManyToManyField 外键需要采用这种格式

    class AuthorAdmin(admin.ModelAdmin):
        inlines = [BookInline]              # 使用内联模型，可以使用多个
    ```

- 相关源代码：
  ```py
  # django/contrib/admin/options.py

  class InlineModelAdmin(BaseModelAdmin):
      model = None
      fk_name = None    # 外键的字段名，如果当前表指向 model 表的外键不止一个，才需要指定该参数
      extra = 3         # 额外显示几个空白的输入框，以供选择内联实例
      min_num = None
      max_num = None
      template = None
      verbose_name = None
      verbose_name_plural = None
      can_delete = True

      def has_add_permission(self, request, obj):
          if self.opts.auto_created:
              return self._has_any_perms_for_target_model(request, ['change'])
          return super().has_add_permission(request)

      def has_change_permission(self, request, obj=None):
          if self.opts.auto_created:
              return self._has_any_perms_for_target_model(request, ['change'])
          return super().has_change_permission(request)

      def has_delete_permission(self, request, obj=None):
          if self.opts.auto_created:
              return self._has_any_perms_for_target_model(request, ['change'])
          return super().has_delete_permission(request, obj)

      def has_view_permission(self, request, obj=None):
          if self.opts.auto_created:
              return self._has_any_perms_for_target_model(request, ['view', 'change'])
          return super().has_view_permission(request)
      ...


  class TabularInline(InlineModelAdmin):
      template = 'admin/edit_inline/tabular.html'

  ```
