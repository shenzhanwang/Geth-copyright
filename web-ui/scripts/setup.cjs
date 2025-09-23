// We require the Hardhat Runtime Environment explicitly here.
const hre = require("hardhat");

async function main() {
  console.log("===== 开始执行合约部署和转账流程 =====\n");
  
  // 直接使用Hardhat内部第一个账户部署合约
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // 获取并显示账户余额
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // 部署ERC20合约
  console.log("\nDeploying ERC20 contract...");
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy("CopyrightToken", "CPT");
  
  // 等待交易确认并获取合约地址
  const txReceipt = await erc20.deploymentTransaction().wait();
  console.log("ERC20 deployed to:", txReceipt.contractAddress);
  
  // 部署ERC721合约
  console.log("\nDeploying ERC721 contract...");
  const ERC721 = await hre.ethers.getContractFactory("ERC721");
  const erc721 = await ERC721.deploy("CopyrightNFT");
  
  // 等待交易确认并获取合约地址
  const txReceipt721 = await erc721.deploymentTransaction().wait();
  console.log("ERC721 deployed to:", txReceipt721.contractAddress);
  
  // ===== 合约部署完成，开始执行转账操作 =====
  console.log("\n===== 开始执行以太币转账操作 =====");
  
  // 给管理员转账以太币
  const from = deployer.address; // 使用部署合约的账户作为转账发起方
  const to = "0xCE92C80928B5A0cB2d720fA58296519a9ED7e354";
  
  // 解析以太币数量
  const amount = hre.ethers.parseEther("1000");
  
  const signer = await hre.ethers.getSigner(from);
  
  console.log(`转账 ${hre.ethers.formatEther(amount)} ETH 从 ${from} 到 ${to}`);
  
  // 直接发送以太坊交易
  const tx = await signer.sendTransaction({
    to,
    value: amount
  });
  
  await tx.wait();
  
  console.log("✅ 转账成功！");
  console.log("交易哈希:", tx.hash);
  
  console.log("\n===== 合约部署和转账流程全部完成 =====");
}

// 执行脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 操作失败:", error);
    process.exit(1);
  });