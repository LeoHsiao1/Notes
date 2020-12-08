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


## 外键

- 在 admin 页面编辑外键字段时，默认会通过一个下拉框显示可选的所有外键条目。
  
- 为 ManyToManyField 外键赋值：
  ```py
  book = Book()                       # 创建一个 book 对象
  book.save()                         # 将 book 对象保存到数据库中（这样才能建立外键）
  person = Person.objects.get(id=1)
  book.reader_set.add(Person)         # 增加外键的值
  ```
- 在 admin 的详情页面，ManyToManyField 字段默认显示成一个多选框，条目较多时很不方便。有以下几种改进方案：
  - 在 autocomplete_fields 参数中声明该字段。
  - 在 filter_horizontal 参数中声明该字段。
  - 在 filter_vertical 参数中声明该字段。
  - 通过内联模型显示外键。

- ManyToManyField 字段可以在 admin 的详情页面显示并编辑，但不能在 admin 的表格页面显示，因为它的值并不是 str 类型。
  - 可以创建一个虚拟字段，将它的值转换成 str 类型，以便显示。



## QuerySet

QuerySet 是对数据库的慢查询，等取用数据时才会实际执行 SQL 。

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

- 例：手动执行 Model 的查询语句
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



如果调用数据库，改变方法 add()， remove()， clear()或 set()上 ，对于关系的任何预取缓存将被清除
总之，命中缓存的逻辑比较复杂，应该调试一下是否命中缓存。还需要考虑缓存的过期时间、什么时候应该主动刷新缓存。

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

