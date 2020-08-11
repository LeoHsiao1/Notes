# ♢ unittest

：Python 的标准库，用于编写测试脚本。
- 它是一个单元测试框架，借鉴 Java 的 JUnit 。
- [官方文档](https://docs.python.org/3/library/unittest.html#module-unittest)

## 基础示例

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
    - unittest 会自动在指定目录（默认是当前目录）下查找名为 `test*.py` 的文件（不区分大小写），然后在该文件中查找继承 `unittest.TestCase` 的类，最后执行该类中名为 `test*` 的方法。
      如果子目录属于 Python 包，则也加入查找范围。
    - 如果执行测试用例时没有抛出异常，则测试通过，显示 ok 。否则不通过，显示 FAIL 。
    - unittest 会捕获执行过程中出现的所有异常，在执行完所有测试用例之后再打印出来。
