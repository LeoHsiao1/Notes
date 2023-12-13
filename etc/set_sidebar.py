"""
根据 `docs/index.md`、`docs/${BOOK}/index.md` 文件中的目录，修改 `docs/.vuepress/config.js` 文件中的 nav、sidebar 配置。
"""
import json
import re


print('获取所有书籍的名称、路径 ...')
with open('docs/index.md', encoding='utf-8') as f:
    book_list = re.findall(r'\n> - \[(《.+?》)\]\((.+?)/index.md\)', f.read())

print('生成 navbar ...')
navbar_items = [
    {
        'text': book[0],
        'link': '/{}/index'.format(book[1])
    }
    for book in book_list
]
navbar = {'text': 'Notes', 'items': navbar_items}
navbar = json.dumps(navbar, ensure_ascii=False, indent=4)   # 格式化为 JSON 文本
navbar = re.sub(r'"(\w+)": ', r'\1: ', navbar)              # 去掉字典的 key 的双引号
navbar = re.sub(r'\n', '\n'+' '*8, navbar)                  # 整体增加缩进
navbar = '''        nav: [{}],'''.format(navbar)


def parse_index_md(index_md, line_num=0, base_url='/', collapsable=True):
    """
    - 用于解析 index.md 中的文档目录，保存到一个 dict 中
    - 函数每次只解析同一层级的文档，通过递归解析子层的文档
    - 文档组默认是可折叠的（collapsable），但除了第一层以外的文档组，全部取消折叠，避免经常需要鼠标点击展开。
      - 建议可折叠的文档组，组名不要添加链接，只担任分组。否则单击一次不会展开，需要单击两次。
    """

    def split_line(line_num):
        """ 分割第 line_num 行字符串 """
        if line_num < len(index_md):
            line = index_md[line_num]
            match = re.search(r'^( *)(- )?(.*)$', line)
            indent, prefix, content = match.groups()
            return len(indent), content
        else:
            return 0, ''

    doc_list = []

    # 循环，每次解析 index_md 中的第 line_num 行字符串
    while line_num < len(index_md):
        depth, content = split_line(line_num)
        line_num += 1
        next_doc_depth = split_line(line_num)[0]

        # 解析当前行的内容
        doc = {}
        if content.startswith('['):
            match = re.search(r'^\[(.*?)\]\((.*?)\)$', content)
            if not match:
                raise ValueError('解析失败：' + content)
            doc['title'], doc['path'] = match.groups()
            doc['path'] = doc['path'].removesuffix('.md')

            # 如果 path 是相对路径，则在开头加上 base_url
            if doc['path'].startswith('/') or doc['path'].startswith('https://'):
                pass
            else:
                if doc['path'] == 'index':
                    doc['path'] = ''
                doc['path'] = base_url + doc['path']
        else:
            doc['title'] = content

        # 分别处理下一个文档是同级目录、子级目录、父级目录的情况
        if depth == next_doc_depth:
            doc_list.append(doc)
        elif depth < next_doc_depth:
            if not collapsable:
                doc['collapsable'] = False
            doc['children'], line_num = parse_index_md(index_md, line_num, base_url, collapsable=False)
            doc_list.append(doc)
            # 如果下一个文档属于上层文档组，则结束遍历当前文档组
            next_doc_depth = split_line(line_num)[0]
            if depth > next_doc_depth:
                return doc_list, line_num
        elif depth > next_doc_depth:
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
sidebar = re.sub(r'\n', '\n'+' '*8, sidebar)                # 整体增加缩进
sidebar = '''        sidebar: {}'''.format(sidebar)


print('修改 configs.js ...')
with open('docs/.vuepress/config.js', 'r+', encoding='utf-8') as f:
    config_js = f.read()

    # 替换 navbar
    navbar_pattern = r'''        nav: \[\{
.+?
        \}\],'''
    config_js = re.sub(navbar_pattern, navbar, config_js, flags=re.S)

    # 替换 sidebar
    sidebar_pattern = r'''        sidebar: \{
.+?
        \}'''
    config_js = re.sub(sidebar_pattern, sidebar, config_js, flags=re.S)

    # 保存 config.js
    f.seek(0)
    f.truncate()
    f.write(config_js)


print('完成')
