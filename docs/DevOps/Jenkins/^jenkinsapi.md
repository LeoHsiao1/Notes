# ♢ jenkinsapi

：Python 的第三方库，用于通过 HTTP 协议调用 Jenkins 的 API 。
- 安装：pip install jenkinsapi

## 例

创建客户端：
```python
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("http://10.0.0.1:8080", username=None, password=None)
```

查询 job ：
```python
job_names = jk.keys()             # 返回一个包含所有 job 名字的列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job 名字，job 对象）

job = jk.get_job("test1")         # 根据名字，获取指定的 job 对象，如果不存在则抛出异常
job.url                           # 返回 job 的 URL
jk.delete_job("test1")            # 删除一个 job
```

job 的配置：
```python
xml = job.get_config()            # 导出 job 的 XML 配置
job = jk.create_job(jobname, xml) # 创建一个 job
job.update_config(xml)            # 修改 job 的 XML 配置
```

job 的构建：
```python
jk.build_job("test_job", params={"tag":"v1.0.0"}) # 构建一个 job（按需要发送参数）

b = job.get_build(20)        # 返回指定编号的 build 对象
b = job.get_last_build()     # 返回最后一次构建的 build 对象
job.get_next_build_number()  # 返回下一次构建的编号（如果为 1 则说明还没有构建）

b.job.name                   # 返回这次构建所属 job 的名字
b.get_number()               # 返回这次构建的编号
b.get_params()               # 返回一个字典，包含这次构建的所有参数
b.stop()                     # 停止构建，如果成功停止则返回 True
b.is_running()               # 如果这次构建正在运行，则返回 True
b.get_status()               # 返回这次构建的结果，可能是 SUCCESS、FAILURE、ABORTED 等状态，如果仍在构建则返回 None
b.get_console()              # 返回这次构建的控制台 stdout
b.get_timestamp().strftime("%Y/%m/%d-%H:%M:%S")  # 返回开始构建的时间
b.get_duration().total_seconds()                 # 返回这次构建的耗时，如果仍在构建则返回 0
```
