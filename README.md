# Geth-copyright

## 项目介绍
Geth-copyright 是一个基于以太坊区块链技术的数字版权交易系统，使用 Go 语言开发，结合智能合约实现对图片数字资产的确权、管理、交易和保护。系统支持 ERC721 非同质化代币（NFT）用于数字内容版权的唯一标识，以及 ERC20 同质化代币用于平台内的交易结算。

## 效果演示
![输入图片说明](pics/admin.gif)
![输入图片说明](pics/buyer.gif)

## 核心功能

### 1. 用户管理
- 用户注册与登录
- 会话管理
- 管理员用户管理界面，可以给其他用户转以太币、发放token。token用于购买图片资产
- 管理员账号admin，密码1234

### 2. 数字内容管理
- 数字内容（图片）上传
- 内容哈希计算与存储
- 内容版权 Token 化（NFT）

### 3. 版权交易拍卖
- 卖家挂牌出售版权份额
- 买家出价购买版权
- 拍卖历史记录查询

### 4. 钱包与代币功能
- 以太坊余额查询与转账
- ERC20 代币（CPT）管理
  - 代币余额查询
  - 代币转账
  - 管理员代币发放
- ERC721 数字版权 NFT 查询
  - Token 所有者查询
  - Token 交易明细查询

## 技术架构
![输入图片说明](pics/%E6%9E%B6%E6%9E%84%E5%9B%BE.png)

### 整体架构
- **前端**：React.js + Material-UI，提供用户友好的交互界面
- **后端**：Go语言 + Echo框架，处理业务逻辑和API请求
- **区块链层**：以太坊 Geth v1.11.1 客户端，与智能合约交互
- **智能合约**：Solidity v0.8.17 开发的ERC20和ERC721合约
- **数据库**：MySQL v8.0，存储用户信息、内容元数据等链下数据

### 目录结构
```
├── copyright/          # 后端Go项目目录
│   ├── data/           # 账户钱包数据存储目录
│   ├── dbs/            # 数据库操作模块
│   ├── eths/           # 以太坊交互模块
│   ├── hdkeystore/     # 密钥库模块
│   ├── hdwallet/       # 钱包管理模块
│   ├── routes/         # API路由模块
│   ├── static/         # 静态文件目录
│   ├── utils/          # 工具函数模块
│   └── main.go         # 程序入口文件
├── web-ui/             # 前端React项目目录
│   ├── contracts/      # Solidity智能合约
│   ├── scripts/        # 部署和启动脚本
│   └── src/            # React源代码
└── copyright.sql       # 数据库初始化脚本
```

## 安装教程

### 环境要求
- Go 1.24+ 
- Node.js 16+ 
- MySQL 8.0+ 
- Geth 客户端 v1.11.1（以太坊节点）
- Hardhat v2.26.2（智能合约开发环境）

### 1. 克隆项目
```bash
git clone https://gitee.com/your-username/Geth-copyright.git
cd Geth-copyright
```

### 2. 初始化数据库
```bash
# 导入数据库初始化脚本
mysql -u root -p < copyright.sql
```

### 3. 配置以太坊网络
启动hardhat自带的以太坊测试节点，并监听8545端口：
```bash
npx hardhat node
```

### 4. 部署智能合约
```bash
cd web-ui
npm install
npx hardhat run scripts/setup.cjs --network localhost
```
记得将两个合约的地址替换到Geth-copyright\copyright\eths\eth.go文件中
### 5. 启动后端服务
```bash
cd ../copyright
# 安装依赖
go mod tidy
# 启动服务
go run main.go
```

### 6. 启动前端服务
```bash
cd ../web-ui
# 安装依赖
npm install
# 启动开发服务器
npm run dev
```

## 使用说明

### 1. 访问系统
打开浏览器，访问 http://localhost:5173 

### 2. 用户注册与登录
- 注册新用户账号
- 使用注册的账号登录系统
- 用admin给新用户转一定的以太币和CPT代币，用于上传或购买图片资产

### 3. 上传数字内容
- 登录后，进入个人中心
- 点击上传按钮，选择图片文件进行上传
- 系统自动计算内容哈希并创建对应的NFT

### 4. 版权交易
- 上传内容后，可以将其挂牌出售
- 设置版权份额和价格
- 其他用户可以对挂牌内容进行出价购买

### 5. 代币管理
- 查看账户余额（以太坊和CPT代币）
- 进行代币转账
- 管理员可以发放代币（需要管理员权限）

## 智能合约

### ERC20 合约（CPT）
- 合约名称：CopyrightToken
- 代币符号：CPT
- 用于平台内的交易结算

### ERC721 合约
- 合约名称：CopyrightNFT
- 用于数字内容版权的唯一标识和管理

## API 接口
系统提供了丰富的RESTful API接口，主要包括：

### 用户接口
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /session` - 会话验证
- `GET /users` - 获取用户列表
- `DELETE /users` - 删除用户

### 内容接口
- `POST /content` - 上传内容
- `GET /content` - 获取用户上传的内容

### 拍卖接口
- `POST /auction` - 挂牌出售
- `DELETE /auction` - 删除拍卖
- `GET /auctions` - 获取可购买的商品列表
- `GET /myauctions` - 获取用户上架的拍卖
- `POST /auction/bid` - 出价购买

### 钱包和代币接口
- `GET /balance` - 获取以太坊余额
- `POST /transfer` - 以太坊转账
- `POST /token/transfer` - 代币转账
- `POST /token/mint` - 代币发放
- `GET /token/balance` - 获取代币余额






