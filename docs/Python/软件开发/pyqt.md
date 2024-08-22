## import PyQt

：Python 的第三方库，用于调用 Qt 的 API ，从而制作 GUI 软件。
- [官方文档](https://doc.qt.io/qtforpython-6/index.html)
- 安装：`pip install PyQt6` ，另外建议安装 Qt Designer 。

## Qt

- Qt 是一个 GUI 工具包。
  - 很多工具都可以开发 GUI 软件，而 Qt 擅长开发跨平台的 GUI 软件。
    - 使用 Qt 开发一个 GUI 软件之后，在不修改源代码的情况下，可以为 Windows、Linux、Android、MacOS、iOS 等平台，分别构建一个可执行文件。
    - 例如 Linux 常见的图形桌面 KDE 就是基于 Qt 开发的。
  - Qt 本身是用 C++ 开发的，因此最初只能用 C++ 开发 GUI 软件。但后来也可以用 C#、Python 等编程语言，调用 Qt 的 API ，从而开发 GUI 软件。

- [Qt 的版本](https://wiki.qt.io/Qt_version_history)
  - 首次发布于 1995 年。
  - Qt 4.0
    - 于 2005 年发布。
    - Qt 4.7 添加了 Qt Quick 和 Qt QML 。
  - Qt 5.0
    - 于 2012 年发布。
    - 进行了重构，拆分为几十个模块。因此不兼容 Qt4 。
  - Qt 6.0
    - 于 2020 年发布。
    - 兼容 Qt5 。

- Qt5 的常用模块：
  - Qt Core
    - ：提供 signal、slot 等核心的 Qt 功能。
  - Qt GUI
    - ：提供 QPainter、QColor 等基础的 GUI 功能。
  - Qt Widgets
    - ：提供 Window、Frame、Label、Button 等多种类型的 widget 。
  - Qt Creator
    - ：一个 IDE 。
  - Qt Designer
    - ：一个可视化编辑器。用户可以用鼠标拖动 widget ，来编辑 GUI 界面。
    - 编辑结果，通常保存为一个 .ui 文件，用于描述 GUI 界面，采用 XML 语法。比如显示哪些 widget 、每个 widget 的样式。
  - Qt QML
    - Qt 最初采用 XML 语法来描述 GUI 界面，但它不方便人类阅读。于是 Qt 发明了一种新的语言，称为 QML ，比 XML 更简洁、功能更多。
  - Qt Quick
    - ：提供一些动态的、可触摸的 widget ，更适合手机 app 。
    - 传统 Qt 开发模式，是用 Qt Designer 设计 GUI 界面，基于 Qt Widgets 显示各种 widget 。
    - 新的 Qt 开发模式，是用 QML 设计 GUI 界面，基于 Qt Quick 显示各种 widget 。本文不介绍 Qt Quick 。
  - qmake
    - ：可以为 Windows、Linux 等不同平台，分别生成一个 Makefile 。
  - Qt Network
    - ：用于进行网络通信，支持 TCP、UDP、HTTP 等协议。
  - Qt Multimedia
    - ：用于播放多媒体，比如图片、音频、视频。

- Qt 可以显示 Window、Frame、Label、Button 等多种类型的 GUI 元素，它们统称为控件（widget）。
  - 大部分 widget 之间存在父子关系。例如一个 Frame 可能包含多个 Label ，担任它们的父容器（parent）。
  - 当父控件被销毁时，它的所有子控件都会被自动销毁。
  - 一个 GUI 软件可能显示多个窗口。通常将第一个显示的窗口，称为主窗口。主窗口通常包含很多子控件。
  - 除了 Qt 自带的各种 widget ，用户也可以自定义 widget ，做成插件，然后便可以显示在 Qt Designer 左侧的 widget 列表中，也可以通过 "promoted widget" 功能导入。

## 启动

- 执行以下代码，即可显示一个 GUI 窗口：
  ```py
  from PyQt6.QtWidgets import QApplication, QWidget
  import sys

  app = QApplication(sys.argv)  # 创建一个 QApplication 对象，代表一个 GUI 程序
  window = QWidget()            # 创建一个窗口，作为主窗口
  window.show()                 # 显示窗口

  sys.exit(app.exec())          # 进入 app 的主循环，阻塞当前线程。一旦 app 结束，就终止当前 Python 进程
  ```
  - QApplication 采用单例模式。可以重复调用 `QApplication.instance()` ，获取对 app 的引用。
  - 同一 GUI 程序中，只能存在一个主窗口。如果重复调用 `QWidget()` 创建一个主窗口，则会自动销毁之前的主窗口。

## QtCore

### QEvent

- 用户对 widget 进行的鼠标点击、键盘输入等操作，统称为事件（event）。
  - Qt 自带了多种 widget ，每种 widget 支持多种 event 。

- 可以重载 widget 对某种 event 的处理方法。使得每次发生该 event 时，就执行特定的操作。
  - 例：
    ```py
    class MyWindow(QWidget):
        def __init__(self):
            super().__init__()
        def keyPressEvent(self, event):
            print(event.key())    # 获取用户按下的按键键值，比如按键 A 的键值是 65（不受大小写的影响）
        def mouseMoveEvent(self, event):
            print(event.pos())    # 获取鼠标的相对坐标（以窗口左上角为原点，当鼠标移到窗口外部时，坐标可能为负数）
    ```
    - 默认情况下，当用户按住鼠标并移动时，才会触发 mouseMoveEvent 事件。如果设置 `self.setMouseTracking(True)` ，则只要用户在窗口范围内移动鼠标，就会触发 mouseMoveEvent 事件。

### Signal

- widget 可以在发生某种 event 时，自动发送某种信号（signal），通知其它对象。
  - 用户可以将 widget 的某种信号，绑定到一个函数，称为槽（slot）函数。使得每次发生该信号时，就调用一次槽函数，从而执行特定的操作。
  - 每种 widget 自带了几种信号、槽函数。用户也可以增加新的信号、槽函数。
- 例：
  - QPushButton 按钮提供了几种信号：
    ```py
    >>> button = QPushButton('Close', window)
    >>> button.show()
    >>> button.pressed    # 用户在按钮区域，按下鼠标左键时，会触发该信号
    <bound PYQT_SIGNAL pressed of QPushButton object at 0x000001DBBDEBCC10>
    >>> button.clicked    # 用户在按钮区域，按下鼠标左键并释放时，会触发该信号
    <bound PYQT_SIGNAL clicked of QPushButton object at 0x000001DBBDEBCC10>
    ```
  - 调用信号的 `connect()` 方法，可以将该信号，绑定到一个函数。
    ```py
    >>> button.clicked.connect(print)           # 绑定一个槽函数
    <PyQt6.QtCore.QMetaObject.Connection object at 0x000001DBBDEF4C10>
    >>> button.clicked.connect(window.close)    # 每种信号，可以绑定多个槽函数
    <PyQt6.QtCore.QMetaObject.Connection object at 0x000001DBBDEF4C80>
    ```
  - 可以将一个信号，绑定到另一个信号。使得前一个信号发生时，自动触发后一个信号。
    ```py
    button2 = QPushButton('button2', window)
    button2.clicked.connect(button2.clicked)
    ```
  - 调用信号的 `disconnect()` 方法，可以解绑一个槽函数。（如果不存在该绑定关系，则会抛出异常）
    ```py
    >>> button.clicked.disconnect(window.close)
    ```
  - 调用信号的 `emit()` 方法，可以主动触发一次该信号。
    ```py
    >>> button.clicked.emit()
    ```
- 例：自定义信号
  ```py
  >>> from PyQt6.QtCore import pyqtSignal
  >>> class MyWindow(QWidget):
  ...     _signal = pyqtSignal(str)   # 自定义一个信号，并声明其各个形参的数据类型
  ...     def __init__(self):
  ...         super().__init__()
  ...         self._signal.connect(self._slot)
  ...         self._signal.emit('testing')
  ...     def _slot(self, string):
  ...         print(string)
  ...
  >>> window = MyWindow()
  testing
  ```

### QTime

- ：用于获取时间。
- 例：
  ```py
  >>> from PyQt6.QtCore import QDateTime, QDate, QTime
  >>> QDateTime.currentDateTime()
  PyQt6.QtCore.QDateTime(2020, 1, 12, 10, 56, 40, 638)
  >>> QDate.currentDate()
  PyQt6.QtCore.QDate(2020, 1, 12)
  >>> QTime.currentTime()
  PyQt6.QtCore.QTime(10, 57, 14, 447)
  >>> _.second()
  14
  ```
- 也可使用 Python 自带的 time、datetime 模块，获取时间。

### QTimer

- ：定时器。用于在一段时间之后，执行特定操作。
- 定义：
  ```py
  from PyQt6.QtCore import QTimer
  QTimer(parent: QObject = None)
  ```
- 例：
  ```py
  >>> timer = QTimer(window)                  # 创建一个定时器
  >>> timer.timeout.connect(lambda:print(1))  # 当定时器到达目标时刻时，会发出 timeout 信号。这里给 timeout 信号绑定一个槽函数
  <PyQt6.QtCore.QMetaObject.Connection object at 0x000001F8DBC5DBA0>
  >>> timer.setInterval(1000)                 # 设置定时器的间隔时间，即多久发出一次 timeout 信号，单位为毫秒
  >>> timer.start()                           # 启动定时器。定时器会一直运行，循环发出 timeout 信号
  1                                           # 可以用timer.start(1000)，在启动时设置间隔时间
  1
  1
  >>> timer.stop()                            # 停止定时器。此后可以用 timer.start() 再次启动
  ```
  ```py
  >>> timer.isActive()          # 定时器是否激活，正在运行
  False
  >>> timer.remainingTime()     # 距离 timeout 的剩余时间
  -1
  >>> timer.setSingleShot(True) # 采用 SingleShot 模式，让定时器发生一次 timeout 之后，自动 stop
  >>> timer.isSingleShot()      # 判断是否采用 SingleShot 模式
  True
  ```

## QtGui

### QPainter

- 用于绘制 2D 图像。

### QColor

- ：用于选择颜色。
- 定义：
  ```py
  from PyQt6.QtGui import QColor
  QColor(int, int, int, alpha: int = 255)
      # 前三个参数，代表 RGB 三个通道的值，取值范围为 0~255
      # alpha 参数，表示不透明度。最大为 255 ，表示完全不透明
  ```
- 例：
  ```py
  >>> color = QColor(0, 0, 255) # 选择颜色
  >>> color.name()              # 返回颜色的十六进制值
  '#0000ff'
  >>> color.isValid()           # 判断是否为有效的颜色值
  True
  ```
- 可以单独读取 red、green、blue、alpha 通道，或者调用 `setxxx()` 进行赋值。
  ```py
  >>> color.alpha()
  255
  >>> color.setAlpha(0)
  ```

### QFont

- ：用于选择字体。
- 例：
  ```py
  >>> from PyQt6.QtGui import QFont
  >>> QFont('微软雅黑', 12)        # 输入字体名称、字号
  <PyQt6.QtGui.QFont object at 0x0000023BE20F9358>
  ```

### QIcon

- ：用于显示图标。
  ```py
  from PyQt6.QtGui import QIcon
  icon = QIcon(r'./1.jpg')
  button = QPushButton('test', parent=window)
  button.setIcon(icon)
  ```

### QPixmap

- ：用于显示图片。
- 例：
  ```py
  from PyQt6.QtGui import QPixmap
  pixmap = QPixmap(r'./1.jpg')
  label = QLabel(window)
  label.setPixmap(pixmap)   # 用图片填充 label ，作为背景图
  window.resize(pixmap.width(), pixmap.height())
  ```

## QtWidgets

### QWidget

：用于创建普通窗口。
- QWidget是所有窗口的基类，是 QMainWindow、QDialog、QFrame 的父类。
- 定义：
  ```py
  from PyQt6.QtWidgets import QWidget

  window = QWidget(parent: QWidget= None)
      # 功能：创建一个窗口
      # 如果不指定 parent 父控件，则它会成为主窗口
  ```

- 一般控件的通用方法：
  ```py
  window.show() -> None
      # 功能：显示该控件
      # 父控件在第一次显示时会初始化布局，将它的各个子控件也显示出来
      # 如果在父控件初始化之后，才加入子控件，则需要主动调用子控件的 show() 方法

  window.close() -> Bool
    # 功能：关闭该控件的显示（但并没有销毁）
    # 如果成功关闭显示，或者该控件本来就没有显示，则返回 True

  window.setEnabled(bool) -> None
      # 功能：设置控件是否可以被用户操作，即接收用户的鼠标点击、键盘输入
      # 这会影响到它的所有子控件

  window.setToolTip(str) -> None
      # 功能：设置提示语
      # 当鼠标悬停在一个控件上方时，会显示其提示语
      # 可以设置字体，例如： QToolTip.setFont(QFont('微软雅黑', 12))
      # 可以使用 HTML 语法，例如： window.setToolTip('This is a <font color="red">tip</font>.')

  window.setFocus() -> None
      # 功能：使控件得到屏幕焦点

  window.isActiveWindow() -> bool
      # 功能：判断控件是否获得了屏幕焦点

  window.isVisible() -> bool
      # 功能：判断控件是否正在显示
      # 如果控件刚刚创建，尚未调用 show() ，则没有显示
      # 如果控件调用了 close() ，则没有显示
  ```

- QWidget 的特有方法：
  ```py
  window.setWindowTitle(str) -> None
      # 功能：设置窗口的标题

  window.setWindowIcon(QIcon) -> None
      # 功能：设置窗口的图标

  window.isMaximized() -> bool
      # 功能：判断窗口当前的显示，是否最大化
      # 窗口最大化时，不一定是全屏。比如限制了窗口最大尺寸时，不能填满屏幕

  window.isMaximized() -> bool
      # 功能：判断窗口当前的显示，是否最小化
  ```

### QMainWindow

- QMainWindow 是 QWidget 的子类，增加了以下特性：
  - 能显示菜单栏、工具栏、状态栏，因此更擅长担任主窗口。
  - 预先划分了布局，在工具栏与状态栏之间，存在一个 central 区域。调用以下方法，可将一个 widget 放在 central 区域：
    ```py
    window.setCentralWidget(QLabel('hello'))
    ```

- 定义：
  ```py
  from PyQt6.QtWidgets import QMainWindow
  window = QMainWindow(parent: QWidget= None)
  ```

- 菜单栏，是在窗口的顶部，显示一行动作按钮。
  - 菜单栏（menu bar）可以包含一组菜单（menu），每个菜单可以包含一组动作按钮。
  - 创建菜单栏：
    ```py
    menubar = window.menuBar()  # 第一次调用将创建菜单栏，重复调用将返回菜单栏这个单例对象的引用
    ```
  - 往菜单栏中，添加菜单：
    ```py
    menubar.addMenu(str)        -> QMenu  # 输入名字，添加一个菜单
    menubar.addMenu(QIcon, str) -> QMenu  # 输入图标和名字，添加一个菜单
    menubar.addMenu(QMenu)      -> QMenu  # 输入一个 QMenu 对象，添加一个菜单
    ```
  - 可以在一个菜单中，嵌套另一个菜单，称为子菜单。例：
    ```py
    file_menu = menubar.addMenu('File')
    sub_menu = file_menu.addMenu('Open Recent File...')
    ```
  - 每个菜单，可以包含一组动作按钮：
    ```py
    QMenu.addAction(str)        -> QAction
    QMenu.addAction(QIcon, str) -> QAction
    QMenu.addAction(QAction)    -> QAction
    ```

- 例：添加一个动作按钮，会被鼠标单击触发
  ```py
  from PyQt6.QtGui import QAction

  exit_action = QAction('Exit', window)
  exit_action.setShortcut('Ctrl+Q')                 # 设置快捷键
  exit_action.setStatusTip('Exit the application.') # 设置显示在状态栏的提示
  exit_action.triggered.connect(app.quit)           # 绑定到一个槽函数。当用户点击该按钮时，就会调用槽函数

  menubar = window.menuBar()
  file_menu = menubar.addMenu('File') # 创建菜单
  file_menu.addAction(exit_action)    # 添加动作
  ```

- 例：添加一个动作按钮，可以勾选
  ```py
  def debug_mode(state):    # 触发该槽函数时，会传入一个 state 参数，表示当前按钮是否被勾选
      if state:
          window.statusBar().showMessage('Debug mode is enabled')
      else:
          window.statusBar().showMessage('Debug mode is disabled')

  debug_action = QAction('Debug Mode', window, checkable=True)
  debug_action.setChecked(False)  # 设置按钮的初始状态，是否被勾选
  debug_action.triggered.connect(debug_mode)

  menubar = window.menuBar()
  fileMenu = menubar.addMenu('File')
  fileMenu.addAction(debug_action)
  ```

- 工具栏，是在菜单栏下方显示一行常用的动作按钮，方便用户点击。
  ```py
  window.exit_tool = window.addToolBar('Exit')
  window.exit_tool.addAction(exit_action)
  ```

- 状态栏，是在窗口的底部显示一行文字，供用户查看。
  - 例：
    ```py
    statuebar = window.statusBar()
        # 功能：第一次调用将创建状态栏，重复调用将返回状态栏这个单例对象的引用

    statuebar.showMessage(str, msecs: int = 0)
        # 功能：在状态栏显示一行字符串
        # msecs 参数表示显示多少毫秒。默认为 0 ，表示永久显示
    ```

- 上下文菜单，是单击鼠标右键会显示的一个菜单。
  - 不止是 QMainWindow ， QWidget 窗口都支持显示上下文菜单。
  - 定义上下文菜单，需要重载 contextMenuEvent() 方法。如下：
    ```py
    from PyQt6.QtWidgets import QApplication, QMainWindow, QMenu
    import sys

    app = QApplication(sys.argv)

    class MyWindow(QMainWindow):
        def contextMenuEvent(self, event):
            # 创建一个菜单，以 self 作为父容器
            contextMenu = QMenu(self)

            # 在菜单中，添加动作按钮
            open_action = contextMenu.addAction('open')
            exit_action = contextMenu.addAction('exit')
            exit_action.triggered.connect(app.exit)

            # 在鼠标的当前坐标处，显示菜单
            # 当用户点击任意动作按钮，就会关闭菜单的显示，并返回该按钮的引用
            clicked_action = contextMenu.exec(self.mapToGlobal(event.pos()))

            # 如果没有绑定槽函数，也可通过以下代码，检查用户点击了哪个按钮，然后执行相应的操作
            # if clicked_action == open_action:
            #     pass
            # elif clicked_action == exit_action:
            #     app.quit()

    window = MyWindow()
    window.show()
    sys.exit(app.exec())
    ```

### QLabel

- ：标签，即一个只读的字符串。
- 定义：
  ```py
  from PyQt6.QtWidgets import QLabel
  QLabel(text: str, parent: QWidget = None)
  ```
- 例：
  ```py
  label = QLabel('hello', window)   # 这里如果不指定 parent=window ，则该 label 不会显示在主窗口中
  window.show()
  ```

### QLineEdit

- ：单行输入框，用于输入一行字符串。
- 定义：
  ```py
  from PyQt6.QtWidgets import QLineEdit
  QLineEdit(parent: QWidget = None)
  QLineEdit(contents: str, parent: QWidget = None)  # 如果输入 contents 参数，则会作为输入框的初始内容
  ```
- 例：
  ```py
  >>> lineEdit = QLineEdit(window)
  >>> lineEdit.show()
  >>> lineEdit.setText('hello')   # 设置输入框的内容
  >>> lineEdit.text()             # 获取输入框的内容
  'hello'
  >>> lineEdit.setMaxLength(10)   # 限制输入内容的最大长度，超过则无法输入
  >>> lineEdit.setReadOnly(True)  # 使输入框变成只读。不能编辑，但可以选中、复制
  >>> lineEdit.setEchoMode(QLineEdit.EchoMode.Password)  # 使输入框的内容，显示成 *
  >>> lineEdit.clear()            # 清空输入框
  ```
- 常用信号：
  ```py
  lineEdit.textChanged.connect(...)       # 当输入框的内容改变时（不管是被用户改变，还是被程序改变）
  lineEdit.editingFinished.connect(...)   # 当用户输入结束时（比如按下回车、焦点从输入框移动到其它控件）
  lineEdit.selectionChanged.connect(...)  # 当用户的选中范围改变时（如果没有选中一段字符串，则不会触发）
  ```

### QTextEdit

- ：多行输入框，用于输入多行字符串。
- 定义：
  ```py
  from PyQt6.QtWidgets import QTextEdit
  QTextEdit(parent: QWidget = None)
  QTextEdit(text: str, parent: QWidget = None)
  ```
- 例：
  ```py
  >>> textEdit = QTextEdit(window)
  >>> textEdit.show()
  >>> textEdit.setPlainText('hello')  # 在纯文本模式下，设置输入框的内容
  >>> textEdit.toPlainText()          # 在纯文本模式下，获取输入框的内容
  'hello'
  >>> textEdit.clear()  # 清空输入框
  ```
  - 当输入的字符串行数过多时，会自动显示一个垂直滚动条。

- QTextEdit 支持 HTML、Markdown 语法，从而显示富文本。
  ```py
  >>> textEdit.setHtml('<h1>标题一</h1>') # 在 HTML 模式下，设置输入框的内容
  >>> textEdit.toHtml()                  # 在 HTML 模式下，获取输入框的内容
  '<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.0//EN' ...'
  >>> textEdit.toPlainText()             # 在屏幕上，会显示这段文本，而不是 HTML 源代码
  '标题一'
  ```
  ```py
  >>> textEdit.setMarkdown('# 标题一')  # 在 Markdown 模式下，设置输入框的内容
  >>> textEdit.toMarkdown()            # 在 Markdown 模式下，获取输入框的内容
  '# 标题一\n\n'
  >>> textEdit.toPlainText()
  '标题一'
  ```

- 关于插入文本：
  ```py
  textEdit.append('hello')                # 在末尾附加内容（这会新增一行）
  ```
  ```py
  from PyQt6.QtGui import QTextCursor
  textEdit.moveCursor(QTextCursor.Start)  # 将光标移动到最前面
  textEdit.moveCursor(QTextCursor.End)    # 将光标移动到最后面
  textEdit.insertPlainText('hello')       # 在光标处插入纯文本
  textEdit.insertHtml('<h1>标题一</h1>')  # 在光标处插入 html
  ```

### 关于按钮

#### QPushButton

- ：普通按钮。
- 定义：
  ```py
  from PyQt6.QtWidgets import QPushButton
  QPushButton(parent: QWidget = None)             # 只指定父控件，则显示一个空白按钮
  QPushButton(text: str, parent: QWidget = None)  # 输入一个要显示的字符串，再指定父控件
  QPushButton(icon: QIcon, text: str, parent: QWidget = None) # 输入图标、字符串、父控件
  ```

- 例：
  ```py
  >>> button = QPushButton('Quit', window)
  >>> button.text()                     # 返回按钮中的字符串
  'Quit'
  >>> button.clicked.connect(app.quit)  # 将按钮按下的信号，绑定到一个槽函数
  ```

#### QCheckBox

- ：勾选按钮。有 "选中"、"未选中" 两种状态。

- 定义：
  ```py
  from PyQt6.QtWidgets import QCheckBox
  QCheckBox(parent: QWidget = None)
  QCheckBox(text: str, parent: QWidget = None)
  ```

- 例：
  ```py
  def changeState(self, state):
      if state == Qt.Checked:
          print('on')
      else:
          print('off')

  >>> checkBox = QCheckBox('debug', w)
  >>> checkBox.stateChanged.connect(changeState)  # 将状态改变的信号，绑定到一个槽函数
  >>> checkBox.isChecked()                        # 判断按钮是否被选中了
  True
  >>> checkBox.setChecked(True)                   # 设置状态
  >>> checkBox.toggle()                           # 切换一次状态
  ```

- 例：让普通按钮，保持在 "按下" 或 "未按下" 状态，像一个勾选按钮
  ```py
  def changeState(pressed):
      if pressed:
          print('on')
      else:
          print('off')

  button = QPushButton('debug', window)
  button.setCheckable(True)                   # 使普通按钮可以保持状态
  button.clicked[bool].connect(changeState)   # 绑定信号
  button.toggle()                             # 切换一次状态
  ```

#### QRadioButton

- ：单选按钮。

#### QComboBox

- ：下拉列表。
- 定义：
  ```py
  from PyQt6.QtWidgets import QComboBox
  QComboBox(parent: QWidget = None)
  ```
- 例：
  ```py
  >>> combo = QComboBox(window)
  >>> combo.show()
  >>> combo.addItem('one')  # 添加一个选项，并设置该选项显示的字符串
  >>> combo.addItem('two')
  >>> combo.currentText()   # 获取用户当前选中的选项
  'one'
  ```

#### QScrollBar

- ：滚动条，用于拖动显示区域。

#### QSlider

- ：滑块，用于调整某个数值。
- 定义：
  ```py
  from PyQt6.QtWidgets import QSlider
  QSlider(parent: QWidget = None)
  QSlider(orientation, parent: QWidget = None)
  ```
  - Qt.Orientation 表示显示方向，有两种取值：
    ```py
    from PyQt6.QtCore import Qt
    Qt.Orientation.Horizontal # 垂直方向
    Qt.Orientation.Vertical   # 水平方向
    ```
- 例：
  ```py
  >>> slider = QSlider(window)
  >>> slider.show()
  >>> slider.setValue(100)  # 设置数值，取值范围为 0~99 ，超出范围则自动赋值为最小值、最大值
  >>> slider.value()        # 获取数值
  99
  ```

- 常用信号：
  ```py
  slider.valueChanged.connect(print)    # 当滑块的数值改变时，会触发该信号，给槽函数传入当前的数值
  slider.sliderPressed.connect(print)   # 当用户单击滑块时（只能使用鼠标左键，而鼠标右键无效）
  slider.sliderReleased.connect(print)  # 当用户松开鼠标左键时
  ```

### 关于对话框

- 对话框是一种小型窗口，通常只会短暂显示。
- QDialog 是 QtWidget 的子类，是各种对话框窗口的父类。
  - 创建一个对话框时，会立即显示它，不会等到调用 show() 方法。
  - 显示一个对话框时，会阻塞当前线程，直到对话框被关闭。

#### QInputDialog

- 输入对话框，用于输入一行字符串。
- 例：
  ```py
  >>> from PyQt6.QtWidgets import QInputDialog
  >>> text, ret = QInputDialog.getText(window, 'Input Dialog', 'Please input your name:')
  >>> text, ret
  ('hello', True)
  ```
  - 显示该对话框时，用户可以点击 OK 或 Cancel 按钮，或右上角的 Close 按钮。
    - 如果用户点击了 OK 按钮，则返回的 ret 为 True ，并且 text 存储了用户输入的文本。
    - 如果用户点击了 Cancel 或 Close 按钮，则返回的 ret 为 False ，并且 text 总是为空。

#### QColorDialog

- 颜色对话框，用于选择一个颜色。
- 例：
  ```py
  >>> from PyQt6.QtWidgets import QColorDialog
  >>> color = QColorDialog.getColor(parent=window, title='Select Color')
  >>> color
  <PyQt6.QtGui.QColor object at 0x000001486A345E40>
  >>> color.name()
  '#ffffff'
  ```

#### QFileDialog

- ：文件对话框，用于选择本机的文件或目录。
- 选择一个文件：
  ```py
  >>> from PyQt6.QtWidgets import QFileDialog
  >>> filename, _filter = QFileDialog.getOpenFileName(window, 'Open file', '.', '*.py') # 输入参数：父控件、对话框标题、打开的目录、筛选的文件名
  >>> filename, _filter   # 返回的 filename 和 _filter ，都是 str 型
  ('D:/test/1.py', '*.py')
  ```
- 选择多个文件：
  ```py
  >>> filenames, _filter = QFileDialog.getOpenFileNames(window, 'Open files', '.', '*.py')
  >>> filenames, _filter  # 返回的 filenames 是一个字符串列表
  (['D:/test/1.py', 'D:/test/2.py'], '*.py')
  ```
- 选择文件的保存路径：
  ```py
  >>> QFileDialog.getSaveFileName(window, 'Save to', '.', '*.py')
  ('D:/test/3.py', '*.py')
  ```
- 选择一个目录：
  ```py
  >>> QFileDialog.getExistingDirectory(window, 'Open Directory', '.')
  'D:/test'
  ```

#### QMessageBox

- ：消息框，用于通知用户某个消息。

- 提问框，有 Yes、No 两个选项。
  ```py
  >>> from PyQt6.QtWidgets import QMessageBox
  >>> reply = QMessageBox.question(window, '标题', '内容')
  >>> reply == QMessageBox.StandardButton.Yes
  True
  >>> reply == QMessageBox.StandardButton.No # 如果用户点击 No 或 Close 按钮，则返回值为 No
  False
  ```
- 提示框，只有一个 OK 选项。
  ```py
  >>> reply = QMessageBox.information(window, '标题', '内容')
  >>> reply == QMessageBox.StandardButton.Ok # 不管用户点击 Ok 还是 Close 按钮，返回值都为 Ok
  True
  ```
- 警告框，只有一个 OK 选项。
  ```py
  >>> reply = QMessageBox.warning(w, '标题', '内容')
  ```
- 错误框：只有一个 OK 选项。
  ```py
  >>> reply = QMessageBox.critical(w, '标题', '内容')
  ```

### 关于时间

- 相关 widget ：
  ```py
  QDateEdit(parent: QWidget = None)
      # 功能：显示单行输入框，只能输入年月日格式的字符串

  QTimeEdit(parent: QWidget = None)
      # 功能：显示单行输入框，只能输入 24 小时格式的字符串

  QDateTimeEdit(parent: QWidget = None)
      # 功能：显示单行输入框，只能输入年月日 + 24 小时格式的字符串

  QCalendarWidget(parent: QWidget = None)
      # 功能：显示一个日历，用户通过鼠标单击，即可选择一个日期
  ```

### QProgressBar

- ：进度条。
- 定义：
  ```py
  from PyQt6.QtWidgets import QProgressBar
  QProgressBar(parent: QWidget = None)
  ```
- 例：
  ```py
  progressBar = QProgressBar(window)
  progressBar.setValue(80)  # 设置进度值。取值范围为 0~100 。如果输入为 float 类型，则小数部分会被舍去
  # progressBar.value()     # 返回当前的进度值
  window.show()
  ```

## 排版

### stylesheet

- Qt 支持设置各个 widget 的样式（stylesheet），语法与 CSS 相似。
  - [官方文档](https://doc.qt.io/qtforpython-6/overviews/stylesheet-examples.html)
  - 例：
    ```py
    app.setStyleSheet("""
    QWidget{           # 作用于 QWidget 类的所有对象
        background-image: url(img/1.jpg);
    }
    QWidget:window {   # 作用于 QWidget 类，名为 window 的那个对象
        background-color: rgb(255, 255, 0);
        color: rgb(255, 85, 0);
    }
    """)
    ```
  - 子控件默认会继承父控件的 stylesheet 。

## 其它工具

### pyuic

- Qt Designer 生成的 .ui 文件，如何在 Python 中使用？
  1. 先用 pyuic 工具，将 .ui 文件，转换成 .py 文件。如下：
      ```sh
      pyuic6 mainwindow.ui -o mainwindow_ui.py
      ```
  2. 然后在 mainwindow.py 中导入 mainwindow_ui.py ：
      ```py
      import sys
      from PyQt6.QtWidgets import QApplication, QMainWindow
      from mainwindow_ui import Ui_MainWindow

      class MyWindow(QMainWindow, Ui_MainWindow):  # 多继承
          def __init__(self):
              super().__init__()
              self.setupUi(self)

      app = QApplication(sys.argv)
      window = MyWindow()
      window.show()
      sys.exit(app.exec())
      ```

### pyrcc

- Qt Designer 中如何导入图片？
  1. 创建一个 Label ，然后修改其 pixmap 属性，用一张图片填充该 Label 。
  2. 不能直接使用磁盘中的图片文件。需要先创建一个 .qrc 文件，用于记录当前 GUI 软件使用的各个资源文件的磁盘路径，采用 XML 语法。例如：
      ```xml
      <RCC>
        <qresource prefix="resource"> # 一个前缀，可以被多个资源文件共享
          <file>img/1.jpg</file>      # 一个资源文件的磁盘路径（相对路径）
        </qresource>
      </RCC>
      ```
      然后在 .ui 文件中，引用 .qrc 文件中的图片：
      ```xml
      <pixmap resource="resource.qrc">:resource/img/1.jpg</pixmap>
      ```

- .qrc 文件，如何在 Python 中使用？
  - 可用 pyrcc 工具，将 .qrc 文件转换成 .py 文件。这会将各个图片的二进制内容，存储在 .py 文件中。
    - 例如使用 PyQt5 时，执行：
      ```sh
      pyrcc5 resource.qrc -o resource.py
      ```
    - 使用 PyQt6 时，该工具改名为 pyside6-rcc ，并且需要安装 `pip install PySide6` 。
  - 然后可在 Python 代码中，引用 .qrc 文件中的图片：
    ```py
    import resource
    QPixmap(r':resource/img/1.jpg')
    ```
  - 用 pyinstaller 打包时，需要指定各个 resource 文件的路径，从而加入打包：
    ```sh
    pyinstaller mainwindow.py -w -i resource/img/1.jpg
    ```
