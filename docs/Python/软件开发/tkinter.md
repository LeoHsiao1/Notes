# import tkinter

：Python 的标准库，用于制作 GUI 软件。
- [官方文档](https://docs.python.org/3/library/tk.html)
- 优点：
  - 兼容类 Unix 系统、Windows 系统，显示经典桌面风格的 GUI 界面。
- 缺点：
  - 功能简单，不如 PyQt 。

## 原理

- tkinter 的全名为 tk interface ，是让 Python 调用 tk 的 API 。
  - Tcl 是一种脚本语言，于 1988 年发布。
  - tk 是一个 GUI 工具包。
    - 于 1991 年发布，基于 Tcl 语言开发。后来移植到 Python、Perl 等编程语言。
    - 调用 tk 的 API ，就可以在电脑屏幕上显示窗口、按钮等元素。

- 基于 tkinter 编写一个 Python 脚本之后，启动该 Python 脚本，就能显示 GUI 界面。
  - Python 脚本需要使用 Python 解释器才能启动，而用户电脑不一定安装了 Python 解释器。因此建议用 pyinstaller ，将 Python 脚本打包成可执行文件，鼠标双击就能启动。

- tkinter 可以显示 Window、Frame、Label、Button 等多种类型的 GUI 元素，它们统称为控件（widget）。
  - 大部分 widget 之间存在父子关系。例如一个 Frame 可能包含多个 Label ，担任它们的父容器（parent）。
  - 当父控件被销毁时，它的所有子控件都会被自动销毁。
  - 一个 GUI 软件可能显示多个窗口。通常将第一个显示的窗口，称为主窗口。主窗口通常包含很多子控件。

## 启动

- 执行以下代码，即可显示一个 GUI 窗口：
  ```py
  import tkinter

  root = tkinter.Tk()
      # 这是创建一个 tk 对象，代表一个 GUI 窗口
      # 如果在 Python 交互式终端执行 tkinter.Tk() ，则会立即显示窗口
      # 如果在 Python 脚本中执行 tkinter.Tk() ，则等到执行 root.mainloop() 才会显示窗口

  root.mainloop()
      # 这是进入主循环，阻塞当前线程，监听鼠标点击、键盘输入等 event ，并相应地刷新显示的内容
      # root.mainloop() 只能在创建 root 的那个线程中调用。如果在其它线程中调用，则会导致程序崩溃退出
      # 运行 mainloop() 时，如果抛出 Python 异常，则会将报错信息，打印在 Python 终端。如果抛出严重的异常，则可能导致程序崩溃退出
  ```

- 配置窗口：
  ```py
  root.title('main window')               # 设置窗口的标题
  root.geometry('500x300+0+0')            # 设置窗口的尺寸和坐标，格式为 width x height + x坐标 + y坐标
  root.resizable(width=True, height=True) # 设置宽度、高度是否可变
  root.minsize(500, 300)                  # 设置窗口的最小尺寸
  ```
  ```py
  root.attributes('-topmost', True,     # 使窗口置顶，位于本机所有窗口的上层
                  '-fullscreen', True,  # 使窗口显示成全屏。此时不会显示窗口的边框、标题栏、关闭按钮
                  '-disabled', True,    # 使窗口无法操作。此时窗口不会接收用户的鼠标点击、键盘输入，按 alt+F4 也不能关闭它
                  '-toolwindow', True,  # 使窗口变为 toolwindow 类型，不会在电脑任务栏显示其图标
                  '-alpha', 0.9,        # 设置窗口的透明度，0 代表完全透明，1 代表完全不透明
                  )
  ```
  - 例如做一个恶作剧的窗口：同时设置 topmost、fullscreen、disable、toolwindow ，将电脑屏幕完全覆盖，导致用户不能操作电脑的其它软件。
    - 解决方法：按 Windows+Tab 快捷键，新建一个 Windows 桌面，然后打开任务栏管理器，关闭上述窗口。

## widget

### 布局

- 如何显示一个 widget ？
  - 首先，需要创建一个 widget 。如果未指定其父容器，则默认采用 root 窗口作为父容器。
  - 每个 widget 在创建之后，默认不会显示。需要调用一个布局方法，才会放到窗口中显示。例如：
    ```py
    tkinter.Label(root, text='hello').pack()  # 可以在创建 widget 的同时，进行布局
    ```
  - 如果想停止显示一个窗口、控件，可调用其 `destroy()` 方法销毁它，这会同时销毁以它为父容器的所有控件。例如：
    ```py
    root.destroy()
    ```
  - 多个 widget 可以叠加显示在同一位置，最晚显示的那个 widget 会显示在最上层。

- 每个 widget 都支持三种布局方法：
  - pack()
    ```py
    widget.pack()           # 将 widget 添加到窗口中，让它自动调整位置
    widget.pack(side='top') # 将 widget 放在窗口的某一侧，可选 top、bottom、left、right
    widget.pack(fill='y')   # 将 widget 在某一方向填满窗口，可选 none、x、y、both
    ```
  - place()
    ```py
    widget.place(width=10, height=20, x=10, y=20) # 设置 widget 在父容器中的宽度、高度、坐标
    widget.place(relwidth=0.5, relheight=0.5, relx=0.2, rely=0.2) # 相对与父容器的宽度、高度、坐标
    ```
  - grid()
    ```py
    widget.grid(row=0, column=0,  # 以网格的方式划分父容器的空间，将 widget 放在第 0 行、第 0 列
                rowspan=1,        # widget 占据几行，默认为 1
                columnspan=1,     # widget 占据几列，默认为 1
                )
    ```
    ```py
    for row in range(3):
      for column in range(3):
          tkinter.Label(root, text='hello').grid(row=row,column=column)
    ```
    - 如果将一个 widget 放在某行、某列，但是前面的一行、一列为空，不存在 widget ，则当前 widget 的坐标会自动向前漂移，从而填补空缺。
    - 可随时调用某种布局方法，修改 widget 的位置。但是调用另一种布局方法时，可能毁掉之前的布局。

### Label

- ：标签。用于显示文本或图片。
- 例：
  ```py
  label1 = tkinter.Label(master=root,   # 父容器
                         text='hello',  # 文本内容
                         width=10,      # 宽度
                         height=5       # 高度
                         bd=10,         # 边框线条的宽度
                         font=('Arial', 12),  # 字体
                         fg='#FFF',     # 字体颜色。用三个十六进制数，或已有的颜色名，选择一种颜色
                         bg='#000',     # 背景色。默认为透明
                         )
  label1.pack()
  label1['text'] = 'world'    # 修改显示的文本
  ```
- Label 可以显示 PNG、GIF 等格式的图片：
  ```py
  img = tkinter.PhotoImage(file='./1.png', width=200, height=100)
  tkinter.Label(root, image=img).pack()
  ```

### Frame

- ：框架。用于包含一堆 widget ，担任它们的父容器。
- 例：
  ```py
  frame1 = tkinter.Frame(master=root)
  frame.pack()
  tkinter.Label(frame1, text='one').pack()
  tkinter.Label(frame1, text='two').pack()
  ```

### Button

- ：按钮。
- 例：
  ```py
  button1 = tkinter.Button(master=root, text='close', command=root.destroy)
  button1.pack()
  ```
  - 创建 button 时，可以将一个函数，赋值给 command 参数。当 button 被触发时（即鼠标左键按下再松开），就会执行该函数。

### Checkbutton

- ：复选按钮。
- 例：
  ```py
  check1_var = tkinter.IntVar() # 创建一个变量，用于存储复选按钮的状态
  check1 = tkinter.Checkbutton(root, text= 'test', variable=check1_var)
  check1.pack()

  check1_var.get()  # 读取变量的值。取值为 1 或 0 ，表示复选按钮是否被勾选

  check1.select()   # 设置为选中状态
  check1.deselect() # 设置为不选中状态
  check1.toggle()   # 在选中状态，与不选中状态之间，进行切换
  check1.invoke()   # 调用此方法，会模拟用户点击一次复选按钮
  ```

### Entry

- ：输入框。供用户输入一行文本。
- 例：
  ```py
  entry1_var = tkinter.Variable() # 创建一个变量，用于存储输入框的文本内容
  entry1 = tkinter.Entry(root, textvariable=entry1_var)
  entry1.pack()

  button1 = tkinter.Button(root, text='Entry', command=lambda : print(entry1_var.get()))
  button1.pack()
  ```

### Text

- ：文本框。供用户输入多行文本，可以插入文本、图片、按钮。
- 例：
  ```py
  text1 = tkinter.Text(root)
  text1.pack()

  text1.config(state='disabled')  # 使文本框不可编辑。用户、程序都不能编辑它
  text1.config(state='normal')    # 使文本框允许编辑

  # 插入文本
  text1.insert('1.0', 'Hello\n')  # 在指定位置，插入一个字符串。这个位置可以是第几行的第几个字符，或者已命名的特定位置
  text1.delete('1.2','end')       # 删除从第 1 行的第 2 个字符，到文本末尾，之间的内容

  # 插入图片
  img = tkinter.PhotoImage(file='./1.png')
  text1.image_create('end', image=img)

  # 插入按钮
  button1 = tkinter.Button(root, text='UP')
  text1.window_create('end', window=button1)
  ```

### messagebox

- ：消息框。
  - 消息框会作为一个独立的窗口进行显示，不必设置父容器。
  - 同时最多显示一个消息框，关闭一个消息框之后，才会显示下一个消息框。
- 例：
  ```py
  from tkinter import messagebox

  # 显示一个消息框，默认只有一个 "确定" 按钮
  # 消息框有 info、warning、error 三种类型，显示的图标不同
  messagebox.showinfo(title='OK', message='xxx')
  messagebox.showwarning(title='warning', message='xxx')
  messagebox.showerror(title='error', message='xxx')

  # 显示一个询问框，有 "确定"、"取消" 两个按钮，被用户点击之后， askokcancel() 会返回 True 或 False
  if messagebox.askokcancel('ask', '确定or取消'):
      messagebox.showinfo(message='已确定')
  else:
      messagebox.showinfo(message='已取消')

  # 显示一个询问框，有 "是"、"否" 两个按钮，被用户点击之后，会返回 True、False
  messagebox.askyesno('ask','是or否')

  # 显示一个询问框，有 "是"、"否"、"取消" 三个按钮，被用户点击之后，会返回 True、False、None
  messagebox.askyesnocancel('ask','是or否or取消')
  ```

## event

- 用户对 widget 进行的鼠标点击、键盘输入等操作，统称为事件（event）。

- 每个 widget 可以用 `bind()` 方法，将某种 event 与某个函数绑定。如果当前 widget 发生这种 event ，则调用一次该函数，并将 event 对象输入给函数。
  - 例：
    ```py
    >>> text1 = tkinter.Text(root)
    >>> text1.pack()
    >>> text1.bind('<Key>', lambda event: print(event))
    <KeyPress event state=Mod1 keysym=a keycode=65 char='a' x=201 y=126>
    ```
    - keysym、keycode 表示按下的键名、键值。
    - x、y 表示此时鼠标的坐标。
  - 每个 widget 可以绑定多种 event 。但同一 widget 的每种 event ，最多绑定一个函数。
    ```py
    >>> text1.bind()      # 调用 bind() 时，不传入参数，则会返回该 widget 绑定的所有事件
    ('<Key>',)
    text1.unbind('<Key>') # 取消绑定一种事件
    >>> text1.bind()
    ()
    ```

- 常见的几种 event ：
  ```py
  <ButtonPress-1>      # 鼠标左键按下
  <ButtonRelease-1>    # 鼠标左键释放
  <Double-Button-1>    # 鼠标左键双击
  # 将上面三个 event 名称中的数字 1 ，改成 2、3，就是指鼠标滚轮、鼠标右键

  <Enter>       # 鼠标移入当前 widget
  <Leave>       # 鼠标离开当前 widget
  <Motion>      # 鼠标在当前 widget 上方移动
  <B1-Motion>   # 鼠标在当前 widget 上方，并且在按住鼠标左键的情况下，移动鼠标
  <FocusIn>     # 当前 widget 得到焦点，比如用户点击了它、按 Tab 切换光标到它
  <FocusOut>    # 当前 widget 失去焦点

  <Key>         # 用户按了键盘的任一键
                # 这里是指 "按住" ，如果用户一直按住，则会反复触发该 event
                # 如果用户按键盘时，被输入法挡住，则 event 对象可能记录不到 keysym

  <Key-Return>  # 按住回车键
  <Key-y>       # 输入小写的 y
  <Key-Y>       # 输入大写的 Y
  <Shift-Y>     # 在按住 Shift 的情况下，输入大写的 Y

  <Configure>   # 窗口的大小改变
  ```
