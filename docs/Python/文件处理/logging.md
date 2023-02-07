# ♢ logging

：Python 的标准库，用于记录日志。
- [官方文档](https://docs.python.org/3/library/logging.html)

## 用法示例

```py
import logging

formatter = logging.Formatter(             # 创建一个格式器
    fmt='{asctime} {levelname:5} {threadName:15}  {message}',
    datefmt='%Y-%m-%d %H:%M:%S',
    style='{')

handler = logging.FileHandler('error.log') # 创建一个 handler 实例
handler.setLevel(logging.INFO)             # 设置日志级别，它会忽略该级别以下的日志
handler.setFormatter(formatter)            # 设置该 handler 的格式器

handler = logging.FileHandler(filename='error.log', mode='a', encoding='utf-8') # 创建一个 handler 实例
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

logger = logging.getLogger('logger1')      # 创建一个 logger 实例
logger.setLevel(logging.ERROR)             # 设置日志级别，它会忽略该级别以下的日志
logger.addHandler(handler)                 # 为该 logger 添加一个 handle
logger.addHandler(console_handler)         # 一个 logger 可以添加多个 handle ，将日志同时传给它们

logger.debug('测试日志')                    # 记录一条 DEBUG 级别的日志事件
logger.error('测试日志')
```

上例中输出的日志为：
```
2020-01-12 12:27:14 ERROR MainThread      测试日志
```

## 原理

- 开发应用程序时，应该让程序自动记录日志（log），描述程序运行时发生的某些事件，便于用户了解程序的运行状态，排查问题。
  - 日志通常以文本形式记录，可以输出到终端，也可以保存到文件中。
  - 有的日志保存成 JSON 格式，便于其它软件解析日志。
- 通常每行记录一条日志，称为一个事件。
  - 通常将事件按重要程度分成多种级别（level），以便于过滤出重要的日志。
  - 每个事件通常记录了日志级别、发生时间、发生位置、具体描述等信息。
- logging 模块定义了多种日志级别，它们分别用一个 int 数值代表。
  ```py
  FATAL = CRITICAL
  CRITICAL = 50     # 常用于记录致命的错误，比如程序无法启动、基本功能无法实现
  ERROR = 40        # 常用于记录报错信息，比如程序的某些功能无法实现
  WARNING = 30      # 常用于记录警告信息
  WARN = WARNING
  INFO = 20         # 常用于记录重要但不算报错的信息，比如程序是否在正常运行
  DEBUG = 10        # 常用于记录调试信息，比如程序正在执行哪个函数
  NOTSET = 0
  ```
  - 用户可以通过 `logging.DEBUG` 的形式引用这些日志级别，也可以直接指定 int 数值。
  - FATAL 的重要级别最高， NOTSET 的重要级别最低。
    - 调试程序时，通常记录 DEBUG 或 INFO 级别以上的详细日志。
    - 程序正常运行时，通常只记录 WARNING 或 ERROR 级别以上的日志，从而简化日志数量、避免频繁写入日志文件。

## 日志类

logging 模块的主要功能分别由四个类实现：
- Logger ：日志的记录器。
- Formatter ：日志的格式器，负责根据日志事件的内容、当前时间等信息，按特定格式生成日志文本。
- Filter ：日志的过滤器，可以定义比日志级别更复杂的过滤规则。
- Handler ：日志的处理器，负责将日志输出到某个地方。

一个日志事件的处理过程：
1. 程序调用 logger 实例，输入一个字符串，产生一个日志事件。
2. logger 根据 filter 过滤日志，然后将日志传给 handle 。
3. handle 根据 formatter 生成日志文件，然后输出。

### logger

- 调用 `logging.getLogger(name)` 会创建一个指定名称的 logger 实例。
  - 如果指定的 name 与某个已存在的 logger 相同，则返回那个 logger 的引用（可以跨源文件引用）。
  - 如果不指定 name ，则默认返回名为 root 的 logger 。
    - root logger 默认采用 WARN 日志级别，将日志输出到 sys.stderr 。
  - 例：
    ```py
    >>> logger = logging.getLogger('logger1')
    >>> logger             
    <Logger logger1 (ERROR)>
    >>> logger.name
    'logger1'
    >>> logger.level
    40
    ```
  
- name 可以声明多个层级，用 . 作为分隔符。
  - 例如 `logger1.logger2.logger3` ， 当最低层的 logger3 收到一条日志时，会将日志传递给更高层的 logger1.logger2 。
    - 传递时不受 filter 限制。
    - 此时应该只对最高层的 logger3 分配 handle ，以免重复输出日志。
  - 执行 `logging.getLogger(__name__)` 时，就是使用 Python 的模块路径作为 name 。
  - 例：
    ```py
    >>> logger.parent
    <RootLogger root (WARNING)>
    >>> logger.getChild('logger2')    # 返回指定后缀的低层 logger 实例
    <Logger logger1.logger2 (ERROR)>
    ```

- 用户可以调用 logger 实例的以下方法，记录不同级别的日志：
  ```py
  logger.debug(msg)
  logger.info(msg)
  logger.warning(msg)
  logger.error(msg)
  logger.fatal(msg)
  logger.log(level: int, msg)     # 例如 logger.log(logging.ERROR, '测试日志')
  ```

- logger 的其它成员：
  ```py
  >>> logger.filters 
  []
  >>> logger.handlers
  [<FileHandler D:\1\error.log (INFO)>, <StreamHandler <stderr> (INFO)>]
  ```

### Formatter

- 例：
  ```py
  formatter = logging.Formatter(                                  # 创建一个格式器
      fmt='{asctime} {levelname:5} {threadName:15}  {message}',   # 设置每个日志事件的格式化字符串
      datefmt='%Y-%m-%d %H:%M:%S',                                # 设置 asctime 时间字段的格式化字符串
      style='{')
  ```
  - 在 fmt 中嵌入字段的格式：
    - 默认采用 `%` 风格，使用格式如同 `%(asctime)s` 。
    - 可以采用 `{` 风格，使用格式如同 `{asctime}` 。

- logging 模块提供了一些可以嵌入到日志中的字段：
  ```sh
  asctime     # 当前时间
  name        # 当前日志器的名称
  levelname   # 当前日志器的日志级别的名称
  message     # 日志事件的内容

  pathname    # 当前程序文件的绝对路径
  filename    # pathname 的文件名部分，包含扩展名
  module      # pathname 的文件名部分，不包含扩展名
  funcName    # 当前代码所在函数名
  lineno      # 当前代码所在行号

  process     # 当前的进程 ID
  processName # 当前的进程名称
  thread      # 当前的线程 ID
  threadName  # 当前的线程名称
  ```

## dictConfig

可以用字典形式声明 logging 模块的全局配置，如下：
```py
import logging
import logging.config
from datetime import datetime


LOGGING = {
    'version': 1,                               # 声明配置格式的版本
    'disable_existing_loggers': False,          # 是否禁用已存在的其它 logger 实例
    'formatters': {
        'verbose': {                            # 定义一个日志的格式器
            'format': '{asctime} {levelname:5} {threadName:15}  {message}',
            'datefmt': '%Y/%m/%d %H:%M:%S',
            'style': '{',
        },
    },
    'filters': {
    },
    'handlers': {
        'console': {                            # 定义一个日志的处理器
            'level': 'DEBUG',                   # 记录 DEBUG 级别以上的日志
            'formatter': 'verbose',
            'class': 'logging.StreamHandler',   # 将日志输出到终端
        },
        'logfile': {
            'level': 'DEBUG',
            'formatter': 'verbose',
            # 'class': 'logging.FileHandler',   # 将日志输出到文件
            'class': 'logging.handlers.TimedRotatingFileHandler',  # 将日志输出到文件，并按时间自动翻转文件
            'filename': 'main.log.' + datetime.now().strftime('%Y-%m-%d'),
            'encoding': 'utf-8',
            'utc': False,                       # 是否采用 UTC 时间
            'when': 'D',                        # 指定计时的单位，可以是 S、M、H、D 等
            'interval': 1,                      # 从午夜开始计算，每隔 interval x when 时长就创建一个日志文件
            'backupCount': 7,                   # 最多保留多少个日志文件
            # 这会先创建一个以 filename 命名的日志文件，如果当前时间需要翻转日志，则将原日志文件重命名，比如改成 main.log.2020-01-12
        },
    },
    'loggers': {
        'logger1': {                            # 定义一个日志的记录器
            'handlers': ['console', 'logfile'], # 将日志传给这些 handle 处理
            'level': 'WARN',
            'propagate': True,                  # 是否将日志传递给更高层的 logger
        }
    }
}

logging.config.dictConfig(LOGGING)
logging.addLevelName(logging.WARNING, 'WARN')   # 自定义 WARNING 日志级别显示的字符串名称
logging.addLevelName(logging.CRITICAL, 'FATAL')
logger = logging.getLogger('logger1')
logger.error('测试日志')
```
