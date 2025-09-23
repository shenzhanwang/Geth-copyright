# Geth-copyright

## Project Introduction
Geth-copyright is a digital copyright trading system based on Ethereum blockchain technology, developed in Go language. It combines smart contracts to implement the confirmation, management, trading and protection of image digital assets. The system supports ERC721 non-fungible tokens (NFT) for the unique identification of digital content copyright, and ERC20 fungible tokens for transaction settlement within the platform.

## Demo
![Demo Image](pics/admin.gif)
![Demo Image](pics/buyer.gif)

## Core Features

### 1. User Management
- User registration and login
- Session management
- Admin user management interface, allowing transferring Ether and minting tokens to other users. Tokens are used to purchase image assets
- Admin account: admin, password: 1234

### 2. Digital Content Management
- Digital content (image) upload
- Content hash calculation and storage
- Content copyright tokenization (NFT)

### 3. Copyright Trading Auction
- Sellers listing copyright shares for sale
- Buyers placing bids to purchase copyrights
- Auction history query

### 4. Wallet and Token Functions
- Ethereum balance query and transfer
- ERC20 token (CPT) management
  - Token balance query
  - Token transfer
  - Admin token minting
- ERC721 digital copyright NFT query
  - Token owner query
  - Token transaction history query

## Technical Architecture
![Architecture Diagram](pics/%E6%9E%B6%E6%9E%84%E5%9B%BE.png)

### Overall Architecture
- **Frontend**: React.js + Material-UI, providing user-friendly interactive interface
- **Backend**: Go language + Echo framework, handling business logic and API requests
- **Blockchain Layer**: Ethereum Geth v1.11.1 client, interacting with smart contracts
- **Smart Contracts**: ERC20 and ERC721 contracts developed with Solidity v0.8.17
- **Database**: MySQL v8.0, storing off-chain data such as user information and content metadata

### Directory Structure
```
├── copyright/          # Backend Go project directory
│   ├── data/           # Account wallet data storage directory
│   ├── dbs/            # Database operation module
│   ├── eths/           # Ethereum interaction module
│   ├── hdkeystore/     # Keystore module
│   ├── hdwallet/       # Wallet management module
│   ├── routes/         # API routing module
│   ├── static/         # Static files directory
│   ├── utils/          # Utility functions module
│   └── main.go         # Program entry file
├── web-ui/             # Frontend React project directory
│   ├── contracts/      # Solidity smart contracts
│   ├── scripts/        # Deployment and startup scripts
│   └── src/            # React source code
└── copyright.sql       # Database initialization script
```

## Installation Tutorial

### Environment Requirements
- Go 1.24+ 
- Node.js 16+ 
- MySQL 8.0+ 
- Geth client v1.11.1 (Ethereum node)
- Hardhat v2.26.2 (smart contract development environment)

### 1. Clone the Project
```bash
git clone https://gitee.com/your-username/Geth-copyright.git
cd Geth-copyright
```

### 2. Initialize Database
```bash
# Import database initialization script
mysql -u root -p < copyright.sql
```

### 3. Configure Ethereum Network
Start the Hardhat built-in Ethereum test node and listen on port 8545：
```bash
npx hardhat node
```

### 4. Deploy Smart Contracts
```bash
cd web-ui
npm install
npx hardhat run scripts/setup.cjs --network localhost
```
Remember to replace the addresses of both contracts in the Geth-copyright\copyright\eths\eth.go file

### 5. Start Backend Service
```bash
cd ../copyright
# Install dependencies
go mod tidy
# Start service
go run main.go
```

### 6. Start Frontend Service
```bash
cd ../web-ui
# Install dependencies
npm install
# Start development server
npm run dev
```

## User Guide

### 1. Access the System
Open browser and visit http://localhost:5173 

### 2. User Registration and Login
- Register a new user account
- Login to the system with the registered account
- Use admin to transfer some Ether and CPT tokens to new users for uploading or purchasing image assets

### 3. Upload Digital Content
- After login, enter personal center
- Click upload button and select image file to upload
- The system automatically calculates content hash and creates corresponding NFT

### 4. Copyright Trading
- After uploading content, you can list it for sale
- Set copyright share and price
- Other users can place bids to purchase listed content

### 5. Token Management
- Check account balance (Ethereum and CPT tokens)
- Perform token transfer
- Admin can mint tokens (requires admin permission)

## Smart Contracts

### ERC20 Contract (CPT)
- Contract Name: CopyrightToken
- Token Symbol: CPT
- Used for transaction settlement within the platform

### ERC721 Contract
- Contract Name: CopyrightNFT
- Used for unique identification and management of digital content copyright

## API Interfaces
The system provides rich RESTful API interfaces, mainly including:

### User Interfaces
- `POST /register` - User registration
- `POST /login` - User login
- `GET /session` - Session verification
- `GET /users` - Get user list
- `DELETE /users` - Delete user

### Content Interfaces
- `POST /content` - Upload content
- `GET /content` - Get user uploaded content

### Auction Interfaces
- `POST /auction` - List for sale
- `DELETE /auction` - Delete auction
- `GET /auctions` - Get list of purchasable items
- `GET /myauctions` - Get user's listed auctions
- `POST /auction/bid` - Place bid to purchase

### Wallet and Token Interfaces
- `GET /balance` - Get Ethereum balance
- `POST /transfer` - Ethereum transfer
- `POST /token/transfer` - Token transfer
- `POST /token/mint` - Token minting
- `GET /token/balance` - Get token balance
