# ♢ unittest

：Python 的标准库，用于编写测试脚本。
- 它是一个单元测试框架，借鉴 Java 的 JUnit 。
- [官方文档](https://docs.python.org/3/library/unittest.html#module-unittest)

## 用法示例

1. 先定义一个继承 `unittest.TestCase` 的测试类，在其中定义测试方法。如下：
    ```py
    import unittest

    class TestMath(unittest.TestCase):
        def test_add(self):
            assert 1 + 1

        def test_minus(self):
            assert 1 - 1

    ```

2. 用 unittest 模块执行这些测试方法：
    ```sh
    [root@Centos ~]# python3 -m unittest -v
    test_add (__main__.TestMath) ... ok
    test_minus (__main__.TestMath) ... FAIL

    ======================================================================
    FAIL: test_minus (__main__.TestMath)
    ----------------------------------------------------------------------
    Traceback (most recent call last):
    File "testSample.py", line 8, in test_minus
        assert 1 - 1
    AssertionError

    ----------------------------------------------------------------------
    Ran 2 tests in 0.002s

    FAILED (failures=1)
    ```

## 原理

- unittest 能自动发现并执行测试用例，规则如下：
  - 首先指定要查找的目录（默认是当前目录）。
    如果子目录属于 Python 包，则也加入查找范围。
  - 然后在该目录下查找名称匹配 `test*.py` 的文件。
  - 接着在该文件中查找继承 `unittest.TestCase` 的类，
  - 最后查找该类中名称以 `test` 开头的方法，作为测试用例来执行。

- 如果执行测试用例时没有抛出异常，则测试通过，显示 ok 。否则不通过，显示 FAIL 。
- unittest 会捕获执行过程中出现的所有异常，在执行完所有测试用例之后再打印出来。
