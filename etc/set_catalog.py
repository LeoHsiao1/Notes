"""
根据 docs/index.md 及各书籍目录下的 index.md 文件中的目录信息，生成 docs/.vuepress/config.js 文件中的 nav、sidebar 目录。
"""
import re


def parse_index_md(index_md, line_num=0):
    """
    - 用于解析 index.md 中的文档目录，保存到一个 dict 中
    - 函数每次只解析同一层级的文档，通过递归解析子层的文档
    """
    doc_list = []
    while line_num < len(index_md):
        line = index_md[line_num]
        line_num += 1

        # 如果该行为空，则跳过
        if not line:
            continue

        # 去掉每行末尾的空字符
        line = line.rstrip()

        # 解析当前行的缩进
        match = re.search(r'^( *)- (.*)$', line)
        if not match:
            raise ValueError('解析失败：' + line)
        indent, content = match.groups()
        doc = {}
        doc['depth'] = len(indent)

        # 解析当前行的文字内容
        if content.startswith('['):
            match = re.search(r'^\[(.*?)\]\((.*?).md\)$', content)
            if not match:
                raise ValueError('解析失败：' + content)
            doc['name'], doc['path'] = match.groups()
        else:
            doc['name'] = content

        # 如果当前目录为空，或者当前文档的 depth 与上一个文档的相等，则加入当前目录
        if not doc_list or doc['depth'] == doc_list[-1]['depth']:
            doc_list.append(doc)
        # 如果当前文档的 depth 大于上一个文档，则视作子级目录，递归处理
        elif doc['depth'] > doc_list[-1]['depth']:
            doc_list[-1]['sub_docs'], line_num = parse_index_md(index_md, line_num-1)
        # 如果当前文档的 depth 小于上一个文档，则视作上级目录（也可能是更上级目录），退出递归
        elif doc['depth'] < doc_list[-1]['depth']:
            return doc_list, line_num-1

    return doc_list, line_num


def get_book_info(book_dirname):
    """ 获取指定目录名的一个书籍的章节目录等信息 """
    with open('docs/{}/index.md'.format(book_dirname), encoding='utf-8') as f:
        index_md = f.read().split('\n')

    book_info = {}
    book_info['dirname'] = book_dirname
    book_info['display_name'] = re.findall(r'\[(《.+?》)\]\(index.md\)', index_md[0])[0]
    book_info['catalog'], _ = parse_index_md(index_md[1:])
    return book_info


print('获取所有书籍的名称 ...')
with open('docs/index.md', encoding='utf-8') as f:
    books_dirname = re.findall(r'\n> - \[《.+?》\]\((.+?)/index.md\)', f.read())

print('获取所有书籍的章节目录等信息 ...')
books_info = [get_book_info(book_dirname) for book_dirname in books_dirname]



import json
# print(json.dumps(books_info, indent=4))


# print(json.dumps(navbar, ensure_ascii=False, indent=4))






print('读取 configs.js ...')
config_js_path = 'docs/.vuepress/config.js'
with open(config_js_path, encoding='utf-8') as f:
    config_js = f.read()


print('生成 nav 目录 ...')
navbar_items = [
    {
        'text': book_info['display_name'],
        'link': '/{}/index'.format(book_info['dirname'])
    }
    for book_info in books_info
]
navbar = {'text': 'Notes', 'items': navbar_items}
navbar = json.dumps(navbar, ensure_ascii=False, indent=4)   # 格式化为 JSON 文本
navbar = re.sub(r'"(\w+)": ', r'\1: ', navbar)              # 去掉字典的 key 的双引号
navbar = re.sub(r'\n', '\n'+' '*8, navbar)                  # 整体增加缩进
navbar = '        nav: [{}],'.format(navbar)
navbar_pattern = r"""        nav: \[\{
.+?
        \}\],"""
config_js = re.sub(navbar_pattern, navbar, config_js, flags=re.S)




# print('生成 sidebar 目录 ...')
# sidebar = '''
#         sidebar: {
# '''
# sidebar_title_template = '''
#             '/{}/': [{{
#                     title: '《{}》',
#                     path: '/{}/',
#                 }},
# '''.lstrip('\n')
# sidebar_chapter_template = '''
#                 {{
#                     title: '{}',
#                     children: [
# '''.lstrip('\n')
# for book_info in books_info:
#     sidebar += sidebar_title_template.format(book_info['dirname'], book_info['display_name'], book_info['dirname'])
#     for chapter, article_path_list in book_info['catalog'].items():
#         sidebar += sidebar_chapter_template.format(chapter)
#         for path in article_path_list:
#             sidebar += "                        '{}',\n".format(path)
#         sidebar += '''                    ]\n                },\n'''
#     sidebar += '''            ],\n'''

# sidebar += '''
#         },
#         nextLinks: false,
# '''.strip('\n')         # 在 sidebar 配置之后放置 nextLinks 配置，便于正则匹配时定位
# # print(sidebar)
# config_js = re.sub(r"\n[^\n]*sidebar: \{.*\},\s*nextLinks: false,", sidebar, config_js, flags=re.S)


print('保存 configs.js ...')
with open(config_js_path, 'w', encoding='utf-8') as f:
    f.write(config_js)


print('完成')
