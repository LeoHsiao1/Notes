# LLM

## 常见技术

- RAG（Retrieval-Augmented Generation，检索增强生成）
  - 指用户输入 prompt 之后，不直接调用 LLM ，而是先去知识库中搜索与 prompt 相关的资料。然后将原始 prompt 与相关资料合并，一起输入 LLM 。
  - 优点：
    - LLM 在训练时只记住了一些公开资料，偏向常识。通过 RAG 可以让 LLM 掌握一些用户提供的专业资料，提升回答的正确率。
    - LLM 在训练之后，记住的资料就不再更新。可以让 AI 调用爬虫工具，查询互联网上的最新资料。
    最新资料
  - 缺点：
    - 检索知识库，存在一些耗时。
    - 检索知识库，可能得到较长文本的资料，导致输入 LLM 的 tokens 成本增加。
      - 因此需要维护知识库，清洗出有用的数据，删除垃圾数据。



## 常见工具

- [vLLM](https://github.com/vllm-project/vllm)
  - ：一个开源的 LLM 部署框架。
  - 命令示例：
    ```sh
    pip install vllm
    vllm serve Qwen/Qwen2.5-32B-Instruct
      # vllm 会从 Hugging Face 下载模型文件，然后运行模型
      # vllm 会启动一个 HTTP 服务器，提供 OpenAI 格式的接口
    ```

- [LiteLLM](https://github.com/BerriAI/litellm)
  - ：一个开源的 LLM 网关。用于反向代理多个 LLM ，允许用户以 OpenAI 格式的接口，统一调用这些 LLM 。
  - 提供两种使用模式：
    - Python SDK
      - 不需要部署 LiteLLM ，只需要在 Python 代码里，通过 litellm 的 SDK 调用 LLM 。如下：
        ```py
        from litellm import completion

        response = completion(
            model="openai/gpt-4o",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        ```
    - Proxy Server
      - 需要将 LiteLLM 作为一个 HTTP 服务器运行，在 config.yaml 文件中配置各个 LLM 服务器的地址、访问密钥。
      - 用户在 Python 代码里，可以通过各个 LLM 的原生 SDK ，调用 LiteLLM 。如下：
        ```py
        import openai

        client = openai.OpenAI(api_key="xxx", base_url="http://127.0.0.1:4000")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        ```

- [Langfuse](https://github.com/langfuse/langfuse)
  - ：一个开源的 Web 服务器，用于观测 LLM 的调用情况，像链路追踪。
  - 用户可以修改 Python 代码，在每次调用 LLM 时，发送一个 HTTP 请求到 Langfuse 服务器，从而记录本次调用 LLM 的日志。
    - Langfuse 属于异步工作，不会增加调用 LLM 的耗时。即使 Langfuse 故障，也不会阻碍调用 LLM 。
  - 用户可能在一个会话中，与 LLM 对话多次。每次调用 LLM ，会被 Langfuse 记录一条 traceing 日志。这些 traceing 会被分组，属于同一个 Session 。
    - traceing 会记录用户输入的 prompt 内容、 RAG 检索的内容、调用 LLM 的用量、回答是什么、各个环节的耗时。
    - traceing 会记录调用 LLM 的 input token、output token 数量及成本。
      - 为了计算成本，用户需要事先声明每种 LLM 的 token 价格。
      - 商业 LLM 的 output token 单价，通常是 input token 的几倍。可以在 prompt 中要求 AI 减少回复的长度，从而减少成本。
  - 用户还可以将一些 prompt 存储在 Langfuse 上，让 Python 代码每次调用 LLM 时，从 Langfuse 获取 prompt 。

- [Langflow](https://github.com/langflow-ai/langflow)
  - ：一个开源的 Web 服务器，用于创建 AI agent ，以可视化 workflow 的方式配置 AI agent 。
  - 常见的 workflow ：接收用户输入的 prompt ，进行条件判断、RAG 检索，然后调用几个 LLM ，得到响应之后发送给用户。

- [LangChain](https://github.com/langchain-ai/langchain)
  - ：一个开源的 AI agent 开发框架。它是 Langflow 的底层框架，以代码的形式配置 AI agent 。

- [Dify](https://github.com/langgenius/dify)
  - ：一个开源的 Web 服务器，用途与 Langflow 相似。






## 性能优化


- 缓存 LLM 的回答
  - 原理：
    - 每次让 LLM 执行 prompt 之后，将 prompt 及其回答，缓存到 redis 等数据库。
    - 每次收到新的 prompt 时，将它转换为向量形式，如果 redis 中缓存了相似的 prompt ，则采用缓存的回答。如果没命中缓存，才实际调用 LLM 。
      - 例如 LangChain 框架提供了 RedisCache ，实现开箱即用的缓存功能。
  - 优点：
    - 如果存在多个相似的 prompt ，则不必重复调用 LLM ，可以降低 LLM 负载、大幅缩短请求耗时。
  - 缺点：
    - 多个相似的 prompt ，得到的回答完全相同。但有时不希望它们完全相同，比如其中的日期需要变化。


