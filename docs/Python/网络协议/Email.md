# Email

## ♢ smtplib

：Python 的标准库，提供了 SMTP 客户端的功能。
- [官方文档](https://docs.python.org/3/library/smtplib.html)

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
email["To"] = Header("Leo", "utf-8")                    # 设置邮件显示的接收者，不过实际的接收者取决于给 server.sendmail() 输入的 to_addrs 参数
# email["To"] = Header("Leo", "utf-8")                  # 可以多次执行该语句，在邮件中附加多个接收者
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
- [官方文档](https://docs.python.org/3/library/smtpd.html)

例：
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
- [官方文档](https://docs.python.org/3/library/poplib.html)
- 下载邮件之后，通常还要通过 email 模块解析邮件的内容。
- 邮件可能有多种 Content-Type ，比如附件、嵌套的回复邮件，需要分别解析，比较麻烦。

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

