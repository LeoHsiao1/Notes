# Jinja

：一种基于 Python 的模板语言。
- 由 Flask 作者开发，最初是模仿 Django 的模板引擎，处理 HTML 文件，后来推广到处理各种类型的文本文件。
- [官方文档](https://jinja.palletsprojects.com/en/2.10.x/)

## 语法

三种定界符：
```sh
{{ }}    # 声明变量
{% %}    # 插入控制语句
{# #}    # 声明单行注释
```
- 渲染模板文件时会删除所有注释。
- 声明多行注释：
  ```sh
  {% comment %}
  ...
  {% endcomment %}
  ```

### 变量

例：
```sh
传入变量：{{ name }}
调用属性：{{ name.encode }}
调用方法：{{ name.encode() }}
传入字典：{{ dict1['a'] }}
传入列表：{{ list1[0] }}
```
- 可以传入 Python 中任意类型的对象，甚至可以调用对象的属性、方法。

### 控制结构

if 语句：
```sh
{% if a %}
a is True.
{% elif b %}
b is True.
{% else %}
All are False.
{% endif %}
```

迭代列表：
```sh
<ul>
  {% for i in list1 %}
  <li>{{ i }}</li>
  {% endfor %}
</ul>
```

迭代字典：
```sh
<dl>
  {% for k, v in dict1.items() %}
  <dt>{{ k }}</dt>
  <dd>{{ v }}</dd>
  {% endfor %}
</dl>
```

继承：
```sh
{% extends "base.html" %}   # 继承 base.html
 
{% block head %}            # 重载父文件中，名为 head 的 block
    {{ super() }}           # 插入父文件中，这部分的内容
    <title>Hello</title>
{% endblock %}
 
# 其它部分会继承父文件的内容
```

## ♢ Jinja2

：Python 的第三方库，用作 Jinjia 引擎。
- 安装：`pip install Jinja2`

### 用法示例

```py
>>> from jinja2 import Template
>>> text="""
... k1: Hello
... k2: {{ v2 }}
... """
>>> Template(text).render(v2='World')    # 传入参数，渲染模板，返回 str 值
'k1: Hello\nk2: World'
```

调用 render()时：
- 可以传入关键字参数，也可以传入一个字典。如下：
    ```py
    template.render(v2='World')
    template.render({v2:'World'})
    ```
- 如果某个参数在模板中声明了，却没有传入，则会被替换成空字符串。
- 如果某个参数在模板中没有声明，却传入了，则会被忽略。
