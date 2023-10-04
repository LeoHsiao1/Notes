"""
根据 `docs/index.md`、`docs/${BOOK}/index.md` 文件中的目录，修改 `docs/.vuepress/config.js` 文件中的 nav、sidebar 配置。
"""
import json
import re


print('获取所有书籍的名称、路径 ...')
with open('docs/index.md', encoding='utf-8') as f:
    book_list = re.findall(r'\n> - \[(《.+?》)\]\((.+?)/index.md\)', f.read())

print('生成 navbar ...')
navbar_children = [
    {
        'text': book[0],
        'link': '/{}/index'.format(book[1])
    }
    for book in book_list
]
navbar = {'text': 'Notes', 'icon': 'book', 'children': navbar_children}
navbar = json.dumps(navbar, ensure_ascii=False, indent=4)   # 格式化为 JSON 文本
navbar = re.sub(r'"(\w+)": ', r'\1: ', navbar)              # 去掉字典的 key 的双引号
navbar = r'''
// navbar-start
{},
// navbar-end'''.format(navbar)
navbar = re.sub(r'\n', '\n'+' '*4, navbar)  # 整体增加缩进
# print(navbar)

print('保存 navbar ...')
navbar_file = 'docs/.vuepress/navbar.ts'
with open(navbar_file, 'r', encoding='utf-8') as f:
    text = f.read()

navbar_pattern = r'''
 *// navbar-start
.+?
 *// navbar-end'''
text = re.sub(navbar_pattern, navbar, text, flags=re.S)
with open(navbar_file, 'w', encoding='utf-8') as f:
    f.write(text)



def parse_index_md(index_md, line_num=0, base_url='/', collapsible=True):
    """
    - 用于解析 index.md 中的文档目录，保存到一个 dict 中
    - 函数每次只解析同一层级的文档，通过递归解析子层的文档
    - vuepress 的文档组默认是不可折叠的，即默认配置为 collapsible=False
      - 只让第一层的文档组折叠，避免需要经常鼠标点击展开。
      - 建议可折叠的文档组，组名不要添加链接，只担任分组。否则单击一次不会展开，需要单击两次。
    """

    def split_line(line_num):
        """ 分割指定的一行 """
        if line_num < len(index_md):
            line = index_md[line_num]
            match = re.search(r'^( *)(- )?(.*)$', line)
            indent, prefix, content = match.groups()
            return len(indent), content
        else:
            return 0,''

    doc_list = []

    while line_num < len(index_md):
        depth, content = split_line(line_num)
        line_num += 1
        next_doc_depth = split_line(line_num)[0]

        # 解析当前行的内容
        doc = {}
        if content.startswith('['):
            match = re.search(r'^\[(.*?)\]\((.*?).md\)$', content)
            if not match:
                raise ValueError('解析失败：' + content)
            doc['text'], doc['link'] = match.groups()
            if doc['link'] == 'index':
                doc['link'] = ''
            doc['link'] = base_url + doc['link']
        else:
            doc['text'] = content

        # 分别处理下一个文档是同级目录、子级目录、父级目录的情况
        if next_doc_depth == depth:
            doc_list.append(doc)
        elif next_doc_depth > depth:
            # 如果启用了 collapsible ，则显式配置到 vuepress 中。如果没启用，则省略配置
            if collapsible:
                doc['collapsible'] = True
            # 解析子级目录
            doc['children'], line_num = parse_index_md(index_md, line_num, base_url, collapsible=False)
            doc_list.append(doc)
            # 如果下一个文档属于上层文档组，则结束遍历当前文档组
            next_doc_depth = split_line(line_num)[0]
            if next_doc_depth < depth:
                return doc_list, line_num
        elif next_doc_depth < depth:
            doc_list.append(doc)
            return doc_list, line_num

    return doc_list, line_num


def get_book_sidebar(book_path):
    """ 获取一个书籍对应的侧边栏目录 """
    with open('docs/{}/index.md'.format(book_path), encoding='utf-8') as f:
        index_md = f.read()

    # 去除空行
    index_md = re.sub(r'\n\s*\n', '\n', index_md)
    index_md = index_md.strip('\n').split('\n')

    sidebar, _ = parse_index_md(index_md, base_url='/{}/'.format(book_path))
    return sidebar


print('生成 sidebar ...')
sidebar = {'/{}/'.format(book[1]): get_book_sidebar(book[1])
           for book in book_list}
sidebar = json.dumps(sidebar, ensure_ascii=False, indent=4) # 格式化为 JSON 文本
sidebar = re.sub(r'"(\w+)": ', r'\1: ', sidebar)            # 去掉字典的 key 的双引号
# sidebar = re.sub(r'\n', '\n'+' '*4, sidebar)              # 整体增加缩进
sidebar = r'''
// sidebar-start
{},
// sidebar-end'''.format(sidebar)

print('保存 sidebar ...')
sidebar_file = 'docs/.vuepress/sidebar.ts'
with open(sidebar_file, 'r', encoding='utf-8') as f:
    text = f.read()

sidebar_pattern = r'''
 *// sidebar-start
.+?
 *// sidebar-end'''
text = re.sub(sidebar_pattern, sidebar, text, flags=re.S)
with open(sidebar_file, 'w', encoding='utf-8') as f:
    f.write(text)


print('完成')
