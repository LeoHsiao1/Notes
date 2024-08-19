## import PyQt

：Python 的第三方库，用于调用 Qt 的 API ，从而制作 GUI 软件。
- [官方文档](https://www.riverbankcomputing.com/software/pyqt/)
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
  - Qt GUI
  - Qt Widgets
    - ：提供一些传统风格的 widget 。
  - Qt Quick
    - ：提供一些动态的、可触摸的 widget ，更适合手机 app 。
  - Qt Creator
    - ：一个 IDE ，只支持编写 C++ 代码。
  - Qt Designer
    - ：一个可视化编辑器。用户可以用鼠标拖动 widget ，来编辑 GUI 界面。
    - 编辑结果，通常保存为一个 .ui 文件，用于描述 GUI 界面，采用 XML 语法。比如显示哪些 widget 、每个 widget 的样式。
  - Qt QML
    - Qt 最初只用 XML 文件来描述 GUI 界面，但它不方便人类阅读。于是发明了一种新的语言，称为 QML ，比 XML 更简洁、功能更多。
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

- 用户对 widget 进行的鼠标点击、键盘输入等操作，统称为事件（event）。
  - 每个 widget 发生一个 event 时，可以发送一个信号（signal），通知其它 widget 。
  - 每个 widget 可以通过 slot 函数监听某个信号。一旦收到目标信号，则调用 slot 函数，从而执行特定的操作。这就是观察者模式。

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

## widget

### QWidget

：用于创建普通窗口。
- QWidget是所有窗口的基类，是 QMainWindow、QDialog、QFrame 的父类。
- 例：
  ```py
  from PyQt6.QtWidgets import QWidget

  window = QWidget(parent= None)
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

## 其它类

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

## 其它工具

### pyuic

- Qt Designer 生成的 .ui 文件，如何在 Python 中使用？
  1. 先用 pyuic 工具，将 .ui 文件，转换成 .py 文件。如下：
      ```sh
      pyuic5 mainwindow.ui -o mainwindow_ui.py
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
      window = QMainWindow()
      ui = MyWindow()
      ui.setupUi(window)
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

- Qt5 提供 pyrcc5 工具，用于将 .qrc 文件转换成 .py 文件。
  - 例：
    ```sh
    pyrcc5 resource.qrc -o resource.py
    ```
  - 然后可在 Python 代码中，引用 .qrc 文件中的图片：
    ```py
    import resource
    QPixmap(r':resource/img/1.jpg')
    ```
  - 用 pyinstaller 打包时，需要指定各个 resource 文件的路径，从而加入打包：
    ```sh
    pyinstaller mainwindow.py -w -i resource/img/1.jpg
    ```

- PyQt6 删除了 pyrcc 程序。
