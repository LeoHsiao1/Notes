# Jinja

：一个基于 Python 的模板语言。
- [官方文档](https://jinja.palletsprojects.com/en/2.10.x/)
- 由 Flask 的作者开发，最初是模仿 Django 的 DTL 模板语言，处理 HTML 文件，后来推广到处理各种类型的文本文件。

## 语法

- 三种定界符：
  ```sh
  {{ }}    # 用于读取变量的值，并嵌入模板文本中
  {% %}    # 用于执行指令
  {# #}    # 用于声明单行注释
  ```
  - 渲染模板文件时会删除所有注释。
  - 声明多行注释的方法：
    ```sh
    {% comment %}
    This is a comment.
    {% endcomment %}
    ```

### 变量

- 例：
  ```sh
  {% set a='Hello' %}   # 创建变量
  {% set b=a %}         # 将变量赋值给另一个变量
  {{ b }}               # 读取变量的值
  ```
  - 如果读取的变量不存在，则取值为空字符串。

- 变量可以是 Python 中任意类型的对象，可以调用该对象的属性、方法：
  ```sh
  {{ name }}            # 读取变量
  {{ name.__doc__ }}    # 调用属性
  {{ name.encode() }}   # 调用方法
  {{ dict1['A'] }}      # 读取字典
  {{ list1[0] }}        # 读取列表
  ```

### 控制结构

- if 语句：
  ```sh
  {% if a is defined %}   # 判断变量是否已定义
  AAA
  {% elif not b %}
  BBB
  {% else %}
  CCC
  {% endif %}
  ```

- 迭代列表：
  ```sh
  <ul>
    {% for i in list1 %}
    <li>{{ i }}</li>
    {% endfor %}
  </ul>
  ```

- 迭代字典：
  ```sh
  <dl>
    {% for k, v in dict1.items() %}
    <dt>{{ k }}</dt>
    <dd>{{ v }}</dd>
    {% endfor %}
  </dl>
  ```

- 继承：
  ```sh
  {% extends "base.html" %}   # 继承 base.html 的内容

  {% block head %}            # 定义一个 block 块，如果继承的父文件中存在同名的 block ，则会覆盖它
      {{ super() }}           # 插入父文件中同名的 block 的内容
      <title>Hello</title>
  {% endblock %}
  ```

## ♢ Jinja2

：Python 的第三方库，用作 Jinjia 引擎。
- 安装：`pip install Jinja2`

### 用法

- 例：
  ```py
  >>> from jinja2 import Template
  >>> text = "Hello {{a}}"
  >>> template = Template(text)   # 根据字符串创建模板
  >>> template.render(a='Word')   # 传入变量，渲染模板并返回
  'Hello Word'
  ```
  可以合并成一步：
  ```py
  >>> Template('Hello {{a}}').render(a='Word')      
  'Hello Word'
  >>> Template('Hello {{b}}').render(a='Word')      # 变量 b 不存在，因此读取到的值为空字符串
  'Hello '
  >>> Template('Hello {{a, b}}').render(a='Word')   # 这里相当于读取元组 (a, b) 的值
  "Hello ('Word', Undefined)"
  ```

- 调用 render() 时可以传入关键字形式的参数，也可以传入一个字典：
  ```py
  template.render(a='Word')
  template.render({'a':'World'}) 
  ```
