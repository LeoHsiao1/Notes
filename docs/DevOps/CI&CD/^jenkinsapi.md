# ♢ jenkinsapi

第三方库，用于调用Jenkins的API。
- 安装：pip install jenkinsapi

## 用法

创建客户端：
```python
from jenkinsapi.jenkins import Jenkins

jk = Jenkins("10.0.0.1", username=None, password=None)
```

查询job：
```python
job_names = jk.keys()             # 返回job的名字列表
jk.get_jobs()                     # 返回一个可迭代对象，每次迭代返回一个二元组（job名字，job对象）
jk.get_jobs_info()                # 返回一个可迭代对象，每次迭代返回一个二元组（job的URL，job名字）

job = jk.get_job("test1")         # 根据名字，获取指定的job对象，如果不存在则抛出异常
jk.delete_job("test1")            # 删除一个job
```

job的配置：
```python
xml = job.get_config()            # 导出job的XML配置
job = jk.create_job(jobname, xml) # 创建一个job
job.update_config(xml)            # 修改job的XML配置
```

job的构建：
```python
jk.build_job("test_job", params={"tag":"v1.0.0"}) # 构建一个job（按需要发送参数）

b = job.get_build(20)    # 返回指定编号的build对象
b = job.get_last_build() # 返回最后一次构建的build对象
job.get_last_build()

b.job.name               # 返回这次构建所属job的名字
b.get_number()           # 返回这次构建的编号
b.get_timestamp()        # 返回开始构建的时间
b.get_params()           # 返回一个字典，包含这次构建的所有参数

b.is_running()           # 如果这次构建正在运行，则返回True
b.get_status()           # 如果项目运行成功，则返回'SUCCESS'，否则返回'FAILURE'
b.get_console()          # 返回这次构建的控制台stdout
b.stop()                 # 停止构建，如果成功停止则返回True
```
