# ETH

：以太币（Ether），一种数字货币，由以太坊（Ethereum）区块链发行。
- [官方文档](https://ethereum.org/en/developers/docs/)
- 与 BTC 相比，以太坊提供了一种图灵完备的脚本语言，允许用户编写去中心化程序，部署在区块链中。

## EVM

- 以太坊虚拟机 (EVM)：由以太坊所有节点共同维护的一个虚拟机，负责执行操作指令，比如转账、部署合约、调用合约等。
  - 以太坊区块链负责保存 EVM 的当前状态，比如所有账户的余额。而 EVM 会读写区块链的数据。
  - 用户通过发起交易的方式，请求 EVM 执行某些指令。

- EVM 的操作指令是一种堆栈语言，示例：
  ```sh
  POP             # 删除栈顶的一个值
  PUSH1 <uint8>   # 耗费 3 gas ，将 1 字节的数据压入堆栈
  PUSH2 <uint16>  # 耗费 3 gas ，将 2 字节的数据压入堆栈
  PUSH3 <uint24>  # 耗费 3 gas ，将 3 字节的数据压入堆栈

  ADD a b     # 耗费 3 gas ，计算两个数之和
  MUL a b     # 耗费 5 gas ，计算两个数的乘积
  SUB a b     # 耗费 3 gas ，计算两个数之差，即 a - b
  DIV a b     # 耗费 5 gas ，计算两个数的整除

  CALL        # 耗费 0 gas ，调用一个账户 address
  STOP        # 耗费 0 gas ，停止执行
  RETURN      # 耗费 0 gas ，停止执行并返回输出数据
  ```
  - [官方文档](https://www.evm.codes/)

### MPT

- 在存储层，以太坊以区块为单位记录交易。在抽象层，以太坊以 MPT（Merkle Patricia Trie） 数据结构记录全部账户的数据。
  - MPT 称为以太坊世界的状态机（world state），结合了两种树形结构的特点：
    - Merkle tree 哈希树
      - 每个叶子节点记录一个 ETH 账户的数据，比如余额、合约代码。
      - 父节点存放了其下所有子节点组合之后的哈希值。
    - Patricia trie 前缀树
      - 将前缀相同的账户存放在树的同一条路径上，方便查找。
  - 打包一个新区块时，会执行一些交易，修改 MPT 中的一些叶子节点。
  - BTC 需要统计所有历史交易的输入、输出，才能计算出所有账户的 UTXO 即余额。而以太坊需要执行所有历史区块的交易，才能得到最新的 MPT 数据。
  - 目前以太坊 MPT 有几亿个节点，体积很大，因此以太坊客户端不必将整个 MPT 载入内存，而是根据节点路径从磁盘读取子树。

### 智能合约

- 多次让 EVM 执行请求时，可能会重复使用一些指令。可以将这些指令上传到区块链，供以后重复调用，称为智能合约（Smart Contract）。
  - 智能合约像 HTTP API ，但用户调用它时不是发出 HTTP 请求，而是发出以太坊交易请求。
  - 将程序的关键代码片段制作成智能合约，就可以实现去中心化程序（Decentralized Application ，DAPP）。

- 智能合约的工作流程：
  1. 开发人员编写一个智能合约（通常采用 Solidity 语言），编译成 EVM 字节码之后上传到区块链（称为部署）。
  2. 某些用户发出以太坊交易请求，调用智能合约的 public 函数。

- 部署智能合约时，会根据部署者的账户地址、账户 nonce 生成一个全网唯一的合约账户地址。
  - 每个合约账户会在区块链中存储字节码、状态变量等数据。
  - 智能合约部署之后，永久保存在区块链上，对所有人公开可见、可调用。
  - 开发者通常会将源代码公布在社区，包含注释，方便大家阅读。而该源代码编译之后的字节码，与区块链中的一致。

- 部署智能合约之后不能修改代码，不像普通软件可以升级版本。因此部署之前应该仔细测试。
  - 有几种方式间接修改智能合约：
    - 迁移合约：迁移旧合约的数据到新合约，然后通知用户使用新合约地址。
    - 数据分离：将代码、数据分别存储到两个合约，称为逻辑合约（logic contract）、存储合约（storage contract），让用户调用逻辑合约。这样更换逻辑合约时，不需要迁移存储合约。
    - 代理模式：在数据分离的基础上，在存储合约中加入代理代码，成为代理合约。用户访问代理合约时，会间接调用逻辑合约。这样更换逻辑合约时，不需要通知用户。
  - 在函数中执行 `selfdestruct(address);` 可销毁智能合约：将合约账户的全部 ETH 发送到指定账户，然后在区块链中删除合约账户的代码、存储（不影响历史数据）。
    - 如果以后有账户发送 ETH 来调用该智能合约，则不会有反应，ETH 也会丢失。

- Solidity 是一种面向对象的高级语言，静态类型。
- 例：用 Solidity 编写一个智能合约
  ```js
  pragma solidity >= 0.7.0;   // 声明语法版本

  // 定义一个智能合约，名为 Coin
  // 本例定义一种自定义的代币，可调用函数来铸造代币、发送代币
  contract Coin {
      // 定义一些状态变量
      string dapp_name;
      address public deployer;
      // 定义 balances 变量，用于记录各个账户的代币余额。它是 mapping 数据类型，将 address 类型映射到 uint 类型
      mapping (address => uint) public balances;

      // 定义事件消息
      event Sent(address from, address to, uint amount);
      // 定义报错消息
      error InsufficientBalance(uint requested, uint available);

      // 构造函数，用于初始化合约。只会执行一次，就是当合约部署到区块链上时
      constructor() {
          deployer = msg.sender;  // 记录合约的部署者
      }

      // mint() 函数用于铸造 amount 数量的代币，发送给 receiver
      function mint(address receiver, uint amount) public {
          require(msg.sender == deployer);  // 要求合约调用者是合约部署者，否则终止函数，不允许铸造代币
          require(amount < 100);            // 限制一次铸造代币的数量
          balances[receiver] += amount;     // 修改 balances 变量，增加指定账户的代币余额
      }

      // send() 函数用于从合约调用者发送 amount 数量的代币，给 receiver
      function send(address receiver, uint amount) public {
          // 如果合约调用者的余额不足，则终止函数并报错
          if (amount > balances[msg.sender])
              revert InsufficientBalance(amount, balances[msg.sender]);
          balances[msg.sender] -= amount;
          balances[receiver] += amount;
          emit Sent(msg.sender, receiver, amount);
      }
  }
  ```

- 关于变量：
  - 在函数外创建的变量称为状态变量（State variable），用于记录智能合约的状态数据，每次赋值都会存储到区块链，每次读写都需要消耗较多 gas （比基本算术指令贵 100 倍）。
  - 在函数内创建的变量称为内存变量（memory variable），不会存储到区块链，因此使用成本低。
  - 智能合约每次被调用时，都有一些特殊的全局变量可用：
    ```js
    block.number  // 当前的区块号
    msg.data      // 调用者发送的数据
    msg.sender    // 调用者的账户地址
    msg.value     // 调用者发送的 ETH 数量，单位为 wei
    tx.gasprice   // 当前交易的 gas 价格
    ```

- 常用的关键字：
  - contract ：用于定义智能合约，像 Java 的类，包含一些变量、函数。
  - function ：用于定义函数。
    - 函数不一定需要 return 返回值。
  - private ：用于声明函数、变量，表示只能在当前合约内访问。也可写作 internal 关键字。
  - public ：用于声明函数、变量，表示可以被其它合约访问。也可写作 external 关键字。
    - 编译器会自动为 public 类型的状态变量创建一个同名函数，供其它合约调用来获取状态变量的值。例如 `address public deployer;` 对应的函数为：
      ```js
      function deployer() external view returns (address) {
          return deployer;
      }
      ```
      `mapping (address => uint) public balances;` 对应的函数为：
      ```js
      function balances(address account) external view returns (uint) {
          return balances[account];
      }
      ```
  - returns ：放在函数头的末尾，用于声明函数返回值的类型。
  - view ：用于声明函数，表示该函数只用于读取，不会修改智能合约的状态，比如修改状态变量、发射事件、调用其它非 view 函数。
  - event、emit ：用于定义、发送事件。
    - 智能合约可以发送事件，保存到区块链上。而以太坊客户端可以监听区块链上的事件，从而及时知晓智能合约的执行状态，比如记录日志。
  - error ：用于定义报错信息。
  - revert ：用于终止函数，返回报错信息给合约调用者。
    - 通过 revert、require() 终止函数时，不会保存对状态变量的修改。

## 区块

- 一个区块的数据结构分为两部分：
  - header ：存储区块的元数据。
  - body ：存储一些交易信息。

- 区块 header 包含以下字段：
  - slot ：出块周期的编号。
  - proposer_index ：该区块的提议者的 ID 。
  - parent_root ：前一个区块的 header 的哈希值。
  - state_root ：当前 MPT 根节点的哈希值。
  - nonce ：用于 PoW 挖矿。
    - 以太坊转向 PoS 之后弃用每个区块的 difficulty、nonce 字段，总是设置为 0 。

- 目前以太坊每 12 秒生成一个新区块，每个区块平均包含 150 条交易，因此每秒事务数（TPS）为 12 左右。
- 以太坊的原生代币名为 Ether ，简称为 ETH 。
  - 矿工打包区块时，会产生少量的 ETH 作为奖励，
  - ETH 总量没有上限。
  - ETH 数量的最小单位为 Wei ，1 ETH = 10^18 Wei 。

### PoS

- 对于谁有权生成新区块，以太坊早期采用 PoW 共识算法，后来转向了 PoS 共识算法。主要原理：
  - 一个节点通过智能合约质押（staking） 32 个 ETH ，就能成为验证者（validator），负责投票验证新区块是否有效。
    - 如果行为不诚实，或者没有准时验证新区块，则质押的 ETH 减少一部分，作为惩罚。
    - 如果工作称职，则质押的 ETH 少量增加，作为奖励。
  - 至少 128 个验证者组成一个委员会（committee），以太坊网络上至少有 128 个 committee 。
    - 同一 committee 中，每个验证者按质押额度确定投票权重。
      - 假设一个 committee 所有验证者总共质押了 10000 ETH ，则一个质押了 32 ETH 的验证者，拥有 0.32% 的投票权。
  - 每 12 秒称为一个插槽（slot），允许打包一个区块。
    - 每个 slot ，随机选取一个 committee 负责打包区块。其中随机一个验证者担任提议者（proposer），有权打包一个新区块（可能没打包）。其他验证者负责投票验证。
  - 每 32 个 slot 称为一个时期（epoch），有 384 秒。
    - 每个 epoch ，将所有验证者以 committee 为单位分组。
    - 最新的一个 epoch 尚未完成，可能被篡改，不够安全。
    - 当一个 epoch 完成，并获得超过 2/3 的验证者投票认同时，该 epoch 变为合理（justified）状态，又称为 safe 状态。
    - 在 justified epoch 之前的 epoch 处于最终确定（finalized）状态，表示区块几乎不可能被篡改。
  - Slash ：如果发现不诚实的节点，提议者可以在新区块中记录对它的惩罚，罚掉一部分质押额给提议者。
    - 常见的违规行为：提议者在同一 slot 打包超过一个区块、验证者提交多个相互矛盾的投票
  - 如果区块链分叉，则不采用最长链，而是得到验证者投票最多的链。

- 与 PoW 相比，PoS 的优点：
  - 去掉了工作量成本，大幅降低了挖矿消耗的计算机硬件、电能，不过矿工打包新区块的奖励也很少。
  - 大幅降低了挖矿的门槛，避免大公司控制大量矿工算力，导致投票权中心化。不过拥有更多 ETH 的用户，可以控制更多验证者，也会导致投票权中心化。
  - 出块周期固定为 10s ，不像 BTC 会因为挖矿难度波动而改变出块时间。
  - 对 PoS 进行 51% 攻击，需要质押超过 50% 的 ETH ，成本几乎不可能实现，且攻击一次之后就会损失质押的 ETH 。

## 节点

- 一些主机运行以太坊客户端，根据以太坊协议相互通信，组成了以太坊网络。这些主机称为以太坊节点。
  - 每个节点会存储区块链数据的一个副本，但 EVM 在以太网中只存在一个实例。
  - 通常人们使用的是以太坊主网络，但还有测试网络等其它网络。每个网络中存在一条独立的区块链。

- 节点分类：
  - 全节点（Full Node）
    - ：存储了全部区块的完整数据。
    - 能独立验证区块数据，因此能担任矿工、验证者.
  - 轻节点（Light Node）
    - ：存储了全部区块的 header ，需要获取区块 body 时，再从全节点下载。
      - 可根据自己存储的 header ，验证全节点提供的各个区块是否正确。
    - 不能独立验证区块数据，因此不能担任矿工、验证者.
  - 归档节点（Archive Node）
    - ：存储了全部区块的完整数据，以及每个区块时刻的 EVM 状态。

- 启动以太坊客户端时，需要从网络获取最新的 EVM 数据。有多种同步方式：
  - 完全同步（full sync）
    - ：下载全部区块的完整数据，然后从创世区块开始依次执行各个区块的每一笔交易，最终得到最新的 EVM 数据。
    - 该同步方式的安全性最高，但是耗时为几周，占用几十 TB 的磁盘。
  - 快速同步（fast sync）
    - ：下载全部区块的完整数据，然后根据每个区块的 header 验证区块的 body 是否正确。最近的 64 个区块则按 full sync 方式同步。
    - 耗时为几十小时。
  - 快照同步（snap sync）
    - ：下载最近的一个 MPT 快照，下载 MPT 叶子节点的数据并验证，然后在本机生成 MPT 的非叶子节点。
    - 该同步方式由 Geth 团队发明，耗时为几小时，占用几百 GB 的磁盘。
  - 轻同步（light sync）
    - ：下载最近一些区块的完整数据，随机挑一些区块验证其 header、body 。
    - 耗时为几分钟，安全性最低。
    - 目前以太坊网络中支持 light sync 的服务器很少，因为全节点缺乏激励做这事。

- 以太坊客户端主要有两层功能：
  - 执行客户端（execution client）
    - ：ETH v1 原有的客户端，负责保存当前 EVM 的数据、监听网络中广播的新交易并放到 EVM 中执行。
  - 共识客户端（consensus client）
    - ：ETH v2 新增的客户端，担任信标节点，根据 PoS 算法验证执行层的数据是否有效。
    - 一个执行客户端启动时，依赖一个共识客户端。

- 相关概念：
  - <https://etherscan.io/nodetracker> ：查看全球的节点统计。
  - [Geth](https://github.com/ethereum/go-ethereum) ：最流行的一个以太坊执行客户端，采用 Golang 开发。
    - Geth 会监听 HTTP 端口，与其它节点进行 RPC 通信。
  - [Prysm](https://github.com/prysmaticlabs/prysm) ：一个以太坊共识客户端，采用 Golang 开发。

## 账户

- 以太坊的账户地址分为两种：
  - 外部账户（Externally-owned）
    - ：供普通用户使用，由私钥控制。
    - 示例：
      ```sh
      0xcf4ec3c95d568ac6fc8413d163e645d3375639bbec5e90f74aa21d2e8eb38c20  # 私钥
      0xfd5aC7632B2044D8D3F5C7ce08b9d69e8b93493e                          # 公钥
      ```
  - 合约账户（Contract）
    - ：部署一个智能合约时会创建一个合约账户。地址为 40 位长度的十六进制数，没有私钥。
    - 两种账户都能交易代币、使用智能合约。
    - 创建外部账户是免费的，而创建合约账户需要付费。

- 生成外部账户的步骤：
  1. 根据椭圆曲线 secp256k1 生成一对公钥、私钥，长度都为 32 bytes 。
  2. 将私钥表示成 64 位长度的十六进制数。
  3. 计算公钥的 keccak256 哈希值，取最后 20 bytes ，表示成 40 位长度的十六进制数，作为账户地址。

- MPT 中，每个账户会记录以下数据：
  ```sh
  nonce         # 账户已执行的交易次数，从 0 开始递增
  balance       # 账户持有的 ETH 余额，单位为 Wei
  codeHash      # 合约账户的代码哈希值，用于从 EVM 数据库中获取智能合约。外部账户的该字段为空
  storageRoot   # 合约账户的存储哈希值，用于从 EVM 数据库中获取存储数据。外部账户的该字段为空
  ```

## 交易

- 用户想让 EVM 执行指令时，需要广播交易（transaction）请求，然后等待矿工将该指令打包到新区块。
  - 每个交易请求需要消耗 EVM 的一些计算资源，称为 Gas 。
  - 以太坊网络的负载时大时小，因此同样的交易需要消耗的 Gas 数量经常变化。
- 常见的交易类型：
  - 常规交易：在账户之间转账 ETH 。
  - 部署合约
  - 调用合约：发送一些 ETH 和输入参数到合约账户，执行合约代码。
- 用户请求交易时，需要付出一些 ETH 费用。分为两部分：
  - Base Fee（基础费用）
    - ：为了避免请求对 EVM 的负载过大，用户必须根据消耗的 Gas 量燃烧一些 ETH ，即永久销毁。
  - Priority Fee（优先费用）
    - ：付给矿工的小费，可以为 0 。给得越多，越容易被矿工打包。

- 用户请求交易时，需要声明以下信息：
  ```sh
  From          # 从哪个账户发送 ETH
  To            # 发送 ETH 到哪个账户
  value         # 发送的 ETH 数量，单位为 Wei
  data          # 自定义的数据，默认为空。常用于保存调用合约时的输入参数
  signature     # 用户根据私钥创建的签名，用于授权该交易

  gasLimit      # 该交易最多消耗多少单位的 Gas 。常规交易默认为 21000 ，调用合约可能需要更多 Gas 。
  maxFeePerGas  # Gas 最大单价。对于每单位 Gas ，用户最多愿意付出多少 Gwei
  maxPriorityFeePerGas  # 每单位 Gas 中，最多愿意付出多少 Gwei 作为矿工的小费
  gasPrice      # 每单位 Gas 等于多少 Gwei ，1 ETH = 10^9 Gwei
  ```
  - 用户请求交易之前需要估计最多付费：
    ```sh
    maxFeePerGas = (baseFeePerGas + maxPriorityFeePerGas)
    maxFee = maxFeePerGas * gasLimit
    ```
    实际付费为：
    ```sh
    FeePerGas = (baseFeePerGas + PriorityFeePerGas)
    Fee = FeePerGas * gasUsed
    ```
  - 如果实际付费 Fee 少于最多付费 maxFee ，则差额会退款。
  - 如果交易需要消耗的 Gas 超过 gasLimit ，则消耗完 gasLimit 之后交易会执行失败，不会退款。

- 每个交易打包到区块之后，会产生一个回执（Recipt），表示该交易的结果。包含以下信息：
  ```sh
  status    # 交易是否成功。取值 1、0 分别表示成功、失败。比如账户余额不足时会交易失败
  gasUsed   # 实际消耗多少 Gas
  txHash    # 交易的哈希值

  txHash    # 交易的哈希值
  ```

## 扩展方案

- 随着用户增加、社区发展，人们希望以太坊有更多的功能、更好的性能，因此研究了一些扩展方案。
- 以太坊改进提案（Ethereum Improvement Proposals ，EIP）：以太坊社区通过提案来讨论一些改进方案。
  - [全部提案](https://eips.ethereum.org/all)

### ERC20

- ERC20（Ethereum Request for Comments 20）是 2015 年发布的一种基于以太坊的代币标准。
  - 早期的区块链行业，开发者需要研发区块链协议，运行一条独立的区块链，才能发行一种数字货币。而使用 ERC20 ，开发者可以低成本发行很多种代币，依靠以太坊的生态，不需要运行一条独立的区块链。
- 用户部署一个实现以下 API 的智能合约，即可创建一种符合 ERC20 标准的代币（token）。
  ```js
  // 返回代币的名称
  function name() public view returns (string)
  // 返回代币的符号，通常是名称的英文缩写
  function symbol() public view returns (string)
  // 返回代币的小数位数
  function decimals() public view returns (uint8)
  // 返回代币的总供应量
  function totalSupply() public view returns (uint256)
  // 返回 _owner 账户的代币余额
  function balanceOf(address _owner) public view returns (uint256 balance)
  // 从合约调用者转账代币到 _to 账户
  function transfer(address _to, uint256 _value) public returns (bool success)
  // 从 _from 账户转账代币到 _to 账户
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
  // 合约调用者授权给 _spender 账户，允许它从前者账户转走最多 _value 数量的代币
  function approve(address _spender, uint256 _value) public returns (bool success)
  // 返回 _spender 账户从 _owner 账户剩下有权转走的代币数量
  function allowance(address _owner, address _spender) public view returns (uint256 remaining)

  // transfer()、transferFrom() 函数应该触发该事件，包括转账数量为 0 的情况，不包括抛出异常的情况
  event Transfer(address indexed _from, address indexed _to, uint256 _value)
  // approve() 函数执行成功时应该触发该事件
  event Approval(address indexed _owner, address indexed _spender, uint256 _value)
  ```
  - 假设 decimals 为 4 ，则一个账户的 balance 为 100 时，实际上拥有 100/10^4=0.01 个代币。
  - 在 DEX 交易所，用户第一次交易某种 ERC20 代币之前，需要进行一次 approve() 授权，允许 DEX 智能合约转走用户的这种代币，从而进行交易。

### ERC721

- ERC721 是2018 年发布的一种基于以太坊的代币标准，称为不可替换代币（Non-Fungible Token，NFT）。
  - NFT 代币适合代表一些独一无二的事物，比如彩票、门票、版权。
- ERC721 要求用户部署一个实现以下 API 的智能合约。
  ```js
  // 返回某个账户拥有的代币数量
  function balanceOf(address _owner) external view returns (uint256);
  // 返回某个代币的所有者账户
  function ownerOf(uint256 _tokenId) external view returns (address);
  // 转账代币
  function transferFrom(address _from, address _to, uint256 _tokenId) external payable;
  ...
  ```
  - 每个代币有一个全局唯一的 tokenId ，数据类型为 uint256 。
- 相关概念：
  - 2017 年，网络游戏 CryptoKitties 发行了一种 NFT 代币，每个代币绑定一个猫的卡通图像。
    - 该游戏吸引了大量用户买卖 NFT 代币，甚至导致以太坊的网络拥堵。
    - 该游戏是第一个出名的区块链游戏，也推广了 NFT 技术。
  - 2017 年，世界上第一个 NFT 交易所 [OpenSea](https://opensea.io/) 创立，随后成为了最大的一个 NFT 交易所。
    - 用户可在 OpenSea 平台上免费铸造 NFT 代币。不过有些用户将现实世界中不归自己所有的艺术品，铸造为自己的代币，导致抄袭或盗版。

### ETH v2

- 在以太坊早期，开发人员就计划着将以太坊升级到 v2 版本，通过一系列措施解决 TPS 低、交易费高、PoW 浪费能源等问题。
- 以太坊升级到 v2 分为三个阶段：
  1. 2020 年，部署一条采用 PoS 的区块链，称为信标链（Beacon Chain）。
      - 启动信标链的前提条件，是至少 128*128=16384 个账户成为验证者，每个账户至少质押 32 ETH 。
  2. 2022 年，将信标链与主链合并，使得以太坊从 PoW 转向 PoS 。
  3. 创建 n=64 条分片链（Shard Chain），并行生成区块，保存到主链（也是信标链，因为已合并）。
      - 这会将全网的验证者随机分成 n 组，分别处理一条分片链。每条分片链都需要至少 16384 个验证者。
        - 当分片链的区块被打包、排序，并得到超过 2/3 的验证者投票认同之后，就会保存到主链。
        - 单个分片链的验证者较少，容易受到 51% 攻击。因此需要随机分配验证者到分片。
      - 分片链的优点是方便横向扩容，能将 TPS 提高 n 倍。

- 以太坊 v2 的主链、信标链、分片链分别称为执行层（execution layer）、共识层（consensus layer）、数据层（data layer）。

<!-- ### layer2

- 一般将以太坊主区块链称为 layer1 ，基于主链实现的扩展方案称为 layer2
-->


### 跨链

- 跨链（cross-chain）：泛指在不同区块链之间传递交易、代币等数据的技术。
  - 提供跨链服务的工具称为网桥（bridge）。
  - 不同区块链的功能、性能不同，通过跨链可以让用户同时使用多条区块链，组合它们的优势。例如：
    - 通过跨链将以太坊主网上的 ETH 转移到手续费更低的 layer2 链上，使用一段时间之后还可以转移回来。
    - 将一个 DAPP 在多个区块链上分别部署一个实例，多个实例之间通过跨链传递消息，从而相互通信。

- 封装代币（Wrapped token）：用一条区块链上的代币，代表另一条区块链上的代币进行使用，可跨链兑换。
  - ETH 是以太坊的原生代币，不兼容 ERC20 标准，因此不能与 ERC20 代币直接交易。
    - 2017 年，0x Labs 公司发行了一种名为 WETH 的 ERC20 代币，用户将 ETH 发送到智能合约之后，可得到等量的 WETH 。WETH 的兑换机制是去中心化的。
  - 在中心化交易所，用户可以将 BTC 兑换为法币、ETH 等其它类型的资产。而在 DEX 交易所，只支持同一条区块链上的代币交易。
    - 2019 年，Kyber、Ren、BitGo 等商家发行了一种名为 WBTC 的 ERC20 代币，全称为 wrapped BTC ，承诺可 1:1 兑换为 BTC 。用户可以在商家网站将 BTC 兑换为 WBTC ，然后在 DEX 交易所交易各种 ERC20 代币。WBTC 的兑换机制是中心化的。
    - 2020 年，Huobi 交易所发行了一种名为 HBTC 的 ERC20 代币，类似于 WBTC 。

- 当用户需要从源链转移一笔代币到目标链时，常见的跨链方式：
  - 锁定和铸币（Lock and mint）
    - ：锁定用户在源链上的代币，然后在目标链上铸造新代币，交给用户。
  - 销毁和铸币（Burn and Mint）
    - ：销毁用户在源链上的代币，然后在目标链上铸造新代币，交给用户。
  - 原子交换（Atomic Swap）
    - ：将源链上的代币，交换为目标链上的代币，像直接交易。

- 网桥按可信程度分为：
  - 受信任的网桥
    - 由中心化机构（比如 Binance 交易所）提供的网桥服务，用机构名誉保证网桥的安全性，用户在信任机构的前提下使用网桥。
  - 无信任的网桥
    - 由智能合约提供的网桥服务，用算法保证网桥的安全性，用户不需要信任第三方机构即可使用网桥。

### DeFi

- 去中心化金融（Decentralized finance，DeFi）
  - ：泛指基于区块链技术实现去中心化的金融系统，比如 DEX、Lending 。
  - 与中心化金融（CeFi）相比，DeFi 的优势：
    - 由代码自动控制交易过程，速度很快、成本很低。
    - 交易过程在区块链上公开透明。
    - 没有身份审查，没有资产门槛，可供世界各地的人使用。

#### DEX

- 中心化交易所（CEX）
  - ：传统的数字货币交易所，是模仿股票交易所运行的。用户需要将数字货币转账到交易所的区块链账户，用交易所的网站进行交易，然后提现到用户的区块链账户。
  - 缺点：
    - 安全性较低。交易所可能卷款跑路，导致不能提现。交易所也可能被黑客攻击。
    - 不能匿名交易。政府会强制交易所做 KYC 审查，要求用户提供详细的个人信息。
- 去中心化交易所（DEX）
  - ：基于智能合约，实现区块链账户之间的点对点交易。
  - 优点：
    - 很安全。用户用个人钱包即可参与交易，不需要将数字货币交给第三方机构托管。
    - 匿名交易。
  - 缺点：
    - 使用门槛较高。需要用户学习使用个人钱包、理解 DEX 原理。
    - 交易费比 CEX 高一些。比如在 Uniswap 每次交易需要付出 0.3% 的交易费，加上发起 ETH 交易的 gas 费（约几美元）。而 CEX 交易所只需付出 0.1% 的交易费，在交易所内部交易、不通过区块链证明交易，因此不需要付 gas 费。
    - 功能比 CEX 少很多。比如支持交易的数字货币种类少、不能兑换法定货币。
    - 交易量比 CEX 低一个数量级，因此市场流动性较差，做大额交易时可能等不到对手盘。

- [Uniswap](https://uniswap.org/) 交易所于 2018 年创立。2020 年，成为了世界上最大的 DEX 交易所，日均交易量为 2 亿美元。
  - Uniswap 为每种 ERC20 代币准备了一个与 ETH 兑换的智能合约，使得 ETH 与 ERC20 代币可以直接兑换（swap）。
    - ERC20 代币之间要通过 ETH 间接兑换。先将一种 ERC20 代币兑换成 ETH ，然后从 ETH 兑换成其它 ERC20 代币，需要两次兑换。
  - Uniswap 发行了一种名为 UNI 的 ERC20 代币，用户可使用 UNI 参与社区治理，对 Uniswap 的改进提案进行投票。
  - Uniswap 目前部署了 V1、V2 两个版本，在同时运行，基于区块链 24 小时提供服务。
    - 为了安全，部署的智能合约是不可间接升级的。

- 做市商（Market Maker）
  - ：证券市场上一些有资质的机构，有能力按稳定的价格大量买卖某种资产。
  - 做市商在卖资产时的报价，通常比买资产的报价略高，从而盈利。
  - 散户以普通方式买某种资产时，需要有另一个散户愿意卖这种资产，称为对手盘。如果长时间没有等到足够交易额的对手盘，则称市场的流动性差。
    - 散户可用比市场均价略高的价格买入，获得更多对手盘，但这会导致市场均价上升。
    - 有了做市商，散户可以快速跟它达成交易，增加市场的流动性，减少市场价格的波动。

- 自动做市商（Automated Market Maker，AMM）
  - ：基于智能合约，实现自动交易的做市商。
  - 例如对于 ETH、USDT 两种代币的交易对，AMM 会分别持有一定数量的两种代币，根据做市公式确定两种代币的兑换比率。
    - 用户可以发送一些 ETH 到 AMM 智能合约，请求兑换为 USDT 。同理，可以将 USDT 兑换为 ETH 。
    - 假设 AMM 的资金池中，代币 A 的数量为 x ，代币 B 的数量为 y ，则做市公式可简单表示为 `x * y = k` ，要求两种代币的数量的乘积等于某一常数。
  - Uniswap 的 API 示例：
    ```js
    swapExactInputSingle()      // 发送一些代币 A 到 AMM ，请求将固定数量的代币 A 交换为尽量大数量的代币 B
    swapExactOutputSingle()     // 发送一些代币 A 到 AMM ，请求将尽量小数量的代币 A 交换为固定数量的代币 B
    ```
  - 用户下单时可以设置预期成交价、滑点范围、超时时间等条件。不满足条件时不会同意交易，超时之后会取消该挂单。
    - 取消挂单时，用户发送到 AMM 智能合约的代币会被退回。但用户依然损失了 gas 费，因为要广播一个交易来调用智能合约。

- 流动性挖矿（liquidity mining）
  - ：用户可以存入一些代币到 AMM 的资金池，供 AMM 用于市场交易，并可以随时提现。此时用户称为流动性提供者（Liquidity Provider，LP）。
  - 优点：
    - 给用户提供低比例、低风险的收益。例如 Uniswap 的 AMM 会收取 0.3% 的交易费，按比例分配给所有 LP 。
    - 增加 AMM 的持仓，支持更大的交易额，从而增加市场的流动性。

- 滑点（slippage）
  - ：用户下单时的预期成交价，与实际成交价的差额。
  - 市场流动性越差，滑点越大。
  - 假设用户在 AMM 创建一个卖单，将 1 ETH 兑换为 USDT ，预期售价是 1000 USDT 。
    - 如果用户声明声明最多接受 1% 的滑点，则实际成交价最低为 999 USDT 。
    - 如果市场流动性太差，在 1% 滑点范围内没有足够的对手盘，则用户一直不能交易成功。

#### 借贷

- 借贷协议（Lending protocols）
  - ：基于智能合约，实现去中心化借贷。
  - 主要提供两种服务：
    - 借贷：支持用户交押金，换得贷款，从而进行杠杆交易。
    - 流动性收益：支持用户存入一些代币，定期获得利息，像银行存款。

- 杠杆交易（leverage）
  - ：泛指通过借贷，将资金放大几倍，然后用于市场交易。
  - 假设在 ETH 单价为 1000 美元时，某用户用 1 ETH 作为押金交给借贷机构，贷款得到 500 USDT ，然后用 500 USDT 在市场交易得到 0.5 ETH ，这样用户间接持有 1.5 ETH 。
    - 如果 ETH 价格上涨 10% ，则用户用 0.5 ETH 交易得到 550 USDT ，用 500 USDT 偿还贷款、拿回押金之后，持有 1 ETH 和 50 USDT ，因此净赚 50 USDT 。
    - 如果 ETH 价格下跌 10% ，则用户用 0.5 ETH 交易得到 450 USDT ，要倒贴 50 USDT 才能偿还贷款。
    - 借贷机构为了盈利，会在贷款给用户时收取几个百分点的手续费。
    - 强制平仓：借贷机构为了避免亏损，会在 ETH 价格跌幅达到一定阈值时（比如 45% ），没收用户的押金并交易成 USDT ，避免资不抵债。
      - 爆仓：强制平仓时，用户损失了全部押金。有的机构会在市场下跌时，提醒用户增加押金，以免爆仓。
      - 穿仓：机构没有及时在底价之上强制平仓，因此用户的押金资不抵债，导致机构亏损。
      - 数字货币市场本来就容易价格波动，加杠杆会更容易导致用户爆仓，甚至机构穿仓。比如当 ETH 价格下跌时，一些抵押 ETH 的杠杆用户爆仓，机构会自动卖出他们抵押的 ETH ，导致 ETH 价格继续下跌，继而更多人爆仓，造成恶性循环。
  - 用户可以找多个借贷机构，依次多次抵押、贷款，将资产放大 n 倍。当市场价格变化时，收益、亏损也放大了 n 倍。
    - 有的借贷机构允许 1:10、1:20、1:100 等本金贷款比率，用户可一次加 n 倍杠杆。
  - 头寸（Position）：用户持有的资产量，包括现金、证券、商品等。又称为持仓。
  - 敞口（exposure）：用户在交易中可能损失的资产量。
    - 无杠杆时，即使 ETH 价格跌了 99% ，用户也还剩 1% 的本金。
    - n 倍杠杆时，ETH 跌幅接近 100% / n ，用户就会爆仓，损失全部本金。

## 相关历史

- 2013 年，俄罗斯程序员 Vitalik Buterin 等人开始开发以太坊项目。
  - BTC 的最初目的是提供一种去中心化的货币，实现价值存储功能。而以太坊的最初目的是给数字货币增加一种功能：去中心化程序。
- 2015 年，以太坊主网正式上线，第一个版本称为 Frontier 。
  - 引入了难度炸弹（difficulty bomb）：从某个区块开始，指数级增加 PoW 挖矿的难度，从而逼迫矿工从 PoW 挖矿转向 PoS 挖矿。

- 2016 年 6 月，以太坊开始了 The DAO 项目，众筹了大量 ETH ，但是被黑客通过漏洞转走了 360 万个 ETH 。
  - 此时 1 ETH 价格为 $10 左右。
  - 事发后，以太坊社区投票决定硬分叉，将区块链回滚到事发之前的状态，从而回滚交易。
  - 一些社区用户反对该硬分叉，称它违反了区块链的不可篡改特性，因此继续使用原链，称为以太坊经典（ETC）。

- 2017 年 10 月，以太坊实施一次硬分叉升级，代号为拜占庭（Byzantium）。
  - 此时 1 ETH 价格为 $300 左右。
  - 将每个区块的挖矿奖励从 5 ETH 减少到 3 ETH 。
  - 将难度炸弹推迟一年。
- 2018 年 1 月，ETH 成为市值第二大的数字货币，仅次于 BTC 。
- 2019 年 2 月，以太坊实施一次升级，代号为君士坦丁堡（Constantinople）。
  - 将每个区块的挖矿奖励减少到 2 ETH 。
  - 将难度炸弹推迟一年。
- 2020 年 12 月 1 日，以太坊的信标链（Beacon Chain）启动，生成了第一个区块。

- 2021 年 8 月，以太坊实施一次升级，代号为伦敦（London）。
  - 此时 1 ETH 价格为 $2600 左右。
  - EIP1559 提案：之前，用户交易付出的 Gas 会全部交给矿工。之后，用户交易付出的 Gas 分为 Base Fee、Priority Fee 两部分。
    - 当一个新区块的 ETH 奖励少于燃烧的 Base Fee 时，ETH 的流通总量就会变少。
    - baseFeePerGas 是以太坊根据最近的网络负载计算出来的，因此用户只需要考虑 PriorityFeePerGas ，更容易预测交易需要付出的 Gas 。
  - 之前，区块有固定的容量限制。之后，取消区块的容量限制，改为限制 Gas 总量，从而方便打包大体积的请求。
    - 每个区块的所有交易消耗的 Gas 总量称为 Gas Used 。
    - 一般情况下，每个区块期望的 Gas Used 为 15,000,000 ，称为 Gas Target 。最多消耗的量是其 2 倍。
    - 如果上一个区块的 Gas Used 高于 Gas Target ，则增加新区块的 baseFeePerGas ，反之减少 baseFeePerGas 。
  - 将难度炸弹推迟到年底。

- 2022 年 9 月，以太坊实施一次升级，代号为巴黎（Paris）。
  - 将信标链合并（The Merge）到原区块链，以太坊正式从 PoW 转向 PoS 。

<!--
## 相关概念
 -->
