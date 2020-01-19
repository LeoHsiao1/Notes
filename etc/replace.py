# -*- coding: utf-8 -*-
'''
替换文件中的字符串，基于正则语法。

Sample：
python3 replace.py --file 1.py --src '([\u4e00-\u9fa5])(\w)' --dst '$1 $2'
'''
import re
import argparse


def replace(string, src: str, dst: str) -> str:
    """
    Replace `src` with `dst` in `string`, based on regular expressions.
    
    Sample:
    >>> replace('Hello World', 'Hello', 'hi')
    'hi World'
    >>> replace('Hello World', '(Hello).', 'hi')
    'hiWorld'
    >>> replace('Hello World', '(Hello).', '$1,')
    'Hello,World'
    >>> replace('Hello World', 'Hello', '$1')
    ValueError: group id out of range : $1
    >>> replace('你好World', '([\\u4e00-\\u9fa5])(\w)', '$1 $2')
    '你好 World'
    """
    # Check the element group
    src_group_num = min(len(re.findall(r'\(', src, re.A)), len(re.findall(r'\)', src, re.A)))
    dst_group_ids = re.findall(r'\$(\d)', dst, re.A)
    if dst_group_ids:
        dst_group_ids = list(set(dst_group_ids))  # Remove duplicate id
        dst_group_ids.sort()
        max_group_id = int(dst_group_ids[-1])
        if max_group_id > src_group_num:
            raise ValueError('group id out of range : ${}'.format(max_group_id))

    # replace
    if dst_group_ids:
        pattern = re.compile('({})'.format(src), re.A)
        result = string[:]
        for match in pattern.findall(string):
            _dst = dst[:]
            for i in dst_group_ids:
                i = int(i)
                _dst = _dst.replace('${}'.format(i), match[i])
            result = result.replace(match[0], _dst)
    else:
        pattern = re.compile(src, re.A)
        result = pattern.sub(dst, string)

    return result


parser = argparse.ArgumentParser(description=r"""This script is use to replace string in a file. Sample: python3 replace.py --file 1.py --src '([\u4e00-\u9fa5])(\w)' --dst '$1 $2' """)
parser.add_argument('--file', help='a valid file path', type=str, required=True)
parser.add_argument('--src', help='the source string, which is a regular expression.', type=str, required=True)
parser.add_argument('--dst', help='the destination string', type=str, required=True)
parser.add_argument('--encoding', help='the encoding of the original file, which is utf-8 by default.', type=str, default='utf-8')
args = parser.parse_args()


try:
    # read the file
    with open(args.file, 'r', encoding=args.encoding) as f:
        text = f.read()
        print('Handling file: {} ...'.format(args.file), end='\t')

    # handling
    result = replace(text, args.src, args.dst)

    # save the result
    with open(args.file, 'w', encoding=args.encoding) as f:
        f.write(result)
        print('done')

except Exception as e:
    print('Error: {}'.format(str(e)))
