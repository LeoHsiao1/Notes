"""
根据 docs/index.md 及各书籍目录下的 index.md 文件中的目录，生成 docs/.vuepress/config.js 文件中的 nav、sidebar 目录。
"""
import os
import re

# 获取书籍列表
with open('docs/index.md', encoding='utf-8') as f:
    text = f.read()

book_list = re.findall(r'> - \[《\w*》\]\(([^\)]*)/index.md\)', text)

# 获取各书籍的信息，包括名字、目录
books_info = []
for book in book_list:
    index_path = 'docs/{}/index.md'.format(book)
    with open(index_path, encoding='utf-8') as f:
        text = f.read()
    
    book_info = {}
    book_info['dirname'] = book
    book_info['display_name'] = re.findall(r'\[《(\w*)》\]\(index.md\)', text)[0]
    
    book_info['catalog'] = {}
    current_chapter = ''
    for line in text.split('\n'):
        chapter = re.findall(r'- ([^\[].*)', line)
        article_path = re.findall(r'  - \[.*\]\(([^\)]*).md\)', line)
        if chapter:
            current_chapter = chapter[0]
            book_info['catalog'][current_chapter] = []
        elif article_path:
            book_info['catalog'][current_chapter].append(article_path[0])
        else:
            continue
    books_info.append(book_info)


# 读取 configs.js
configs_path = 'docs/.vuepress/config.js'
with open(configs_path, encoding='utf-8') as f:
    text = f.read()

# 生成 nav 目录
nav = '''
			text: 'Notes',
            items: [
'''
nav_item_template = '''
                {{
                    text: '《{}》',
                    link: '/{}/index'
                }},
'''.lstrip('\n')
for book_info in books_info:
    nav += nav_item_template.format(book_info['display_name'], book_info['dirname'])

nav += '            ]'
# print(nav)
text = re.sub(r"\n[^\n]*text: 'Notes',\s*items: \[[^\]]*\]", nav, text, flags=re.S)

# 生成 sidebar 目录
sidebar = '''
        sidebar: {
'''
sidebar_title_template = '''
            '/{}/': [{{
                    title: '《{}》',
                    path: '/{}/',
                }},
'''.lstrip('\n')
sidebar_chapter_template = '''
                {{
                    title: '{}',
                    collapsable: true,
                    sidebarDepth: 2,
                    children: [
'''.lstrip('\n')
for book_info in books_info:
    sidebar += sidebar_title_template.format(book_info['dirname'], book_info['display_name'], book_info['dirname'])
    for chapter, article_path_list in book_info['catalog'].items():
        sidebar += sidebar_chapter_template.format(chapter)
        for path in article_path_list:
            sidebar += "                        '{}',\n".format(path)
        sidebar += '''                    ]\n                },\n'''
    sidebar += '''            ],\n'''

sidebar += '''
        },
        nextLinks: false,
'''.strip('\n')
# print(sidebar)
text = re.sub(r"\n[^\n]*sidebar: \{.*\},\s*nextLinks: false,", sidebar, text, flags=re.S)

# 保存到 configs.js 中
with open(configs_path, 'w', encoding='utf-8') as f:
    f.write(text)
