"""
根据 docs/index.md 及各书籍目录下的 index.md 文件中的目录信息，生成 docs/.vuepress/config.js 文件中的 nav、sidebar 目录。
"""
import re


def get_book_info(book_dirname):
    """ 获取指定目录名的一个书籍的章节目录等信息 """
    with open('docs/{}/index.md'.format(book_dirname), encoding='utf-8') as f:
        book_index = f.read()

    book_info = {}
    book_info['dirname'] = book_dirname
    book_info['display_name'] = re.findall(r'\[《(\w*)》\]\(index.md\)', book_index)[0]

    book_info['catalog'] = {}
    current_chapter = ''
    for line in book_index.split('\n'):
        chapter = re.findall(r'^- ([^\[].*)$', line)
        article_path = re.findall(r'^  - \[.*\]\(([^\)]*).md\)$', line)
        if chapter:
            current_chapter = chapter[0]
            book_info['catalog'][current_chapter] = []
        elif article_path:
            book_info['catalog'][current_chapter].append(article_path[0])
        else:
            continue
    return book_info


print('获取所有书籍的名称 ...')
with open('docs/index.md', encoding='utf-8') as f:
    books_dirname = re.findall(r'> - \[《\w*》\]\(([^\)]*)/index.md\)', f.read())

print('获取所有书籍的章节目录等信息 ...')
books_info = [get_book_info(book_dirname) for book_dirname in books_dirname]

print('读取 configs.js ...')
config_js_path = 'docs/.vuepress/config.js'
with open(config_js_path, encoding='utf-8') as f:
    config_js = f.read()

print('生成 nav 目录 ...')
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
config_js = re.sub(r"\n[^\n]*text: 'Notes',\s*items: \[[^\]]*\]", nav, config_js, flags=re.S)

print('生成 sidebar 目录 ...')
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
'''.strip('\n')         # 在 sidebar 配置之后放置 nextLinks 配置，便于正则匹配时定位
# print(sidebar)
config_js = re.sub(r"\n[^\n]*sidebar: \{.*\},\s*nextLinks: false,", sidebar, config_js, flags=re.S)

print('保存 configs.js ...')
with open(config_js_path, 'w', encoding='utf-8') as f:
    f.write(config_js)

print('完成')
