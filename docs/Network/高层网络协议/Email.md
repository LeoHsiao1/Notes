# Email

## 电子邮件

- 用户使用邮件客户端，就可以从邮件服务器接收、发送电子邮件（Email）。
- 电子邮件地址一般由邮箱名和邮件服务器的域名组成，中间用@隔开。比如：123456@qq.com
- 邮件服务器的主要配置内容：
  - 域：可以将一个邮件服务器分成多个独立的虚拟服务器，每个虚拟服务器都是一个域。
  - 用户：需要配置账号、密码，用于登录邮件服务器。
    - 每个用户会被分配一个唯一的电子邮件地址。
  - 用户组：将多个用户分为一组，给组地址（也是一个电子邮件地址）发邮件，该组的所有用户都会收到。

## 邮件协议

常见的邮件协议如下，它们都属于应用层协议。
- 简单邮件传输协议（Simple Mail Transfer Protocol ，SMTP）：用于发送邮件到邮件服务器，只能发送纯 ASCII 码文本。
  - 采用 C/S 工作模式，默认使用 TCP 25 端口。
  - MIME 是 SMTP 协议的一个扩展，使它能够发送非 ASCII 码的内容（包括汉字、二进制文件、音视频文件）。
- 邮局协议（Post Office Protocol ，POP）：用于从邮件服务器拉取邮件。
  - 采用 C/S 工作模式，默认使用 TCP 110 端口。
  - 目前通常使用 POP3 版本。
- 因特网邮件访问协议（Internet Mail Access Protocal ，IMAP）：用于从邮件服务器拉取邮件。
  - 比 POP 协议的功能更强，允许用户在下载邮件之前查看邮件的首部、检索邮件的内容、将客户端邮箱的状态同步到服务器。
  - 采用 C/S 工作模式，默认使用 TCP 143 端口。
  - 目前通常使用 IMAP4 版本。

一般的邮件收发流程：
1. 发送方的用户启动邮箱软件（此时是作为 SMTP 客户端），将邮件发送到 SMTP 服务器。
2. SMTP 服务器将邮件转发到 POP 服务器或 IMAP 服务器。
3. 接收方的用户启动邮箱软件，通过 POP 或 IMAP 协议从服务器拉取邮件。

 
## ♢ smtplib

：Python 的标准库，提供了 SMTP 客户端的功能。

例：
```py
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication


# 连接到 SMTP 服务器
# server = smtplib.SMTP(host="localhost", port=25)      # 连接到 SMTP 服务器
server = smtplib.SMTP_SSL(host="smtp.163.com", port=994, timeout=3)  # 基于 SSL 协议连接到 SMTP 服务器
server.set_debuglevel(1)                                # 显示与 SMTP 服务器的详细通信过程，便于调试
server.login("1234567@163.com", "******")               # 登录

# 创建邮件
email = MIMEMultipart()
email["From"] = Header("python smtplib", "utf-8")       # 发送者
email["To"] = Header("Leo", "utf-8")                    # 接收者
email["Subject"] = Header("这是一封测试邮件", "utf-8")   # 标题
content = "Python 邮件发送测试..."
email.attach(MIMEText(content, "plain", "utf-8"))       # 添加一段邮件内容（可以添加多段）
# 将内容类型设置为"html"，就可以发送 HTML 格式的文本

# 上传附件（可照这样 attach 多个附件）
with open("1.jpg", "rb") as f:
    attachment = MIMEApplication(f.read())
    attachment.add_header("Content-Disposition", "attachment", filename="1.jpg")
    email.attach(attachment)

# 发送邮件
try:
    sender = "1234567@163.com"         # 发送方，填一个有效的邮箱地址
    receiver = "1234567@163.com"       # 接收方，是一个邮箱地址，或者是一个包含多个邮箱地址的 list
    server.sendmail(sender, receiver, email.as_string())
finally:
    server.quit()                      # 关闭连接
```
 
## ♢ smtpd

：Python 的标准库，可用于运行一个简单的 SMTP 服务器。

```py
import asyncore
import smtpd


class CustomSMTPServer(smtpd.SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data, **kwargs): # 重载处理邮件的方法
        print("\n\n# Received email")
        print("From: ", mailfrom, peer)
        print("To: ", rcpttos)
        print("raw_data: ", data)

server = CustomSMTPServer(("127.0.0.1", 25), None)    # 创建 SMTP 服务器，设置监听的 IP 和端口
asyncore.loop()                                       # 异步循环运行
```

## ♢ poplib

：Python 的标准库，提供了 POP 客户端的功能。

例：
```py
server = poplib.POP3_SSL(host="pop.163.com", port=995, timeout=3)   # 连接到 POP 服务器
server.user("1234567@163.com")
server.pass_("******")

res, _list, octets = server.list()      # 获取服务器上的邮件列表（只是每个邮件的序号加邮件大小）
res, raw_data, octets = server.retr(i)  # 下载服务器上的第 n 条邮件（raw_data 是 bytes 类型）
server.dele(n)                          # 删除服务器上的第 n 条邮件
server.quit()                           # 断开连接
```

下载邮件之后，通常还要通过 email 模块解析邮件的内容。
- 邮件可能有多种 Content-Type ，比如附件、嵌套的回复邮件，需要分别解析，比较麻烦。
