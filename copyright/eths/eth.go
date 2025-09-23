package eths

import (
	"context"
	"copyright/dbs"
	"copyright/hdkeystore"
	"copyright/hdwallet"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// ERC721合约地址
var PXA_ADDR = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

// ERC20合约地址
var PXC_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

// Geth客户端全局连接句柄
var ethcli *ethclient.Client

// PXA合约全局实例
var instancePXA *Pxa721

// PXC合约全局实例
var instancePXC *Pxc20

// 管理员相关变量
var adminAddr string
var adminkey string

func init() {
	// 初始化以太坊客户端和智能合约实例
	cli, err := ethclient.Dial("http://localhost:8545")
	if err != nil {
		log.Panic("Failed to ethclient.Dial ", err)
	}
	ethcli = cli
	instance, err := NewPxa721(common.HexToAddress(PXA_ADDR), cli)
	if err != nil {
		log.Panic("Failed to NewPxa721", err)
	}
	instancePXA = instance
	ins, err := NewPxc20(common.HexToAddress(PXC_ADDR), cli)
	if err != nil {
		log.Panic("Failed to NewPxc20", err)
	}
	instancePXC = ins

	// 从数据库初始化管理员地址
	dbAdminAddr, err := GetAdminAddrFromDB()
	if err != nil {
		log.Panicf("从数据库获取管理员地址失败: %v", err)
		os.Exit(1)
	} else {
		adminAddr = dbAdminAddr
		// fmt.Println("成功取得管理员地址", adminAddr)
	}

	// 直接从data目录读取管理员密钥文件并赋值给adminkey
	// 创建HDkeyStore实例
	hdks := hdkeystore.NewHDkeyStoreNoKey("./data")
	// 获取密钥文件的完整路径
	keyFilePath := hdks.JoinPath(dbAdminAddr)
	// 读取密钥文件内容
	keyjson, err := os.ReadFile(keyFilePath)
	if err != nil {
		log.Panic("Failed to read admin key file: ", err)
	}
	// 将密钥文件内容赋值给adminkey
	adminkey = string(keyjson)
	// fmt.Println("成功取得管理员密钥", adminkey)
}

// 上传图片调用
func UploadPic(from, pass, to string, tokenid *big.Int) error {
	//3. 设置签名 -- 需要owner的keystore文件
	w, err := hdwallet.LoadWalletByPass(from, "./data", pass)
	if err != nil {
		fmt.Println("failed to LoadWalletByPass", err)
		return err
	}
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("Failed to get chainId", err)
		return err
	}
	auth, err := w.HdKeyStore.NewTransactOpts(chainId)
	if err != nil {
		fmt.Println("Failed to create TransactOpts", err)
		return err
	}
	if auth == nil {
		fmt.Println("auth object is nil")
		return fmt.Errorf("failed to create valid auth object")
	}
	//4. 调用
	_, err = instancePXA.UploadMint(auth, common.HexToAddress(to), tokenid)
	if err != nil {
		fmt.Println("failed to UploadMint  ", err)
		return err
	}
	return nil
}

// 从数据库获取管理员地址
func GetAdminAddrFromDB() (string, error) {
	var user dbs.User
	found, err := user.QueryByUsername("admin")
	if err != nil {
		return "", fmt.Errorf("查询管理员用户失败: %v", err)
	}
	if !found {
		return "", fmt.Errorf("未找到管理员用户")
	}
	return user.Address, nil
}

// 授权
func SetApprove(from, pass string, tokenid *big.Int) error {

	//3. 设置签名 -- 需要owner的keystore文件
	w, err := hdwallet.LoadWalletByPass(from, "./data", pass)
	if err != nil {
		fmt.Println("failed to LoadWalletByPass", err)
		return err
	}
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("Failed to get chainId", err)
		return err
	}
	auth, _ := w.HdKeyStore.NewTransactOpts(chainId)
	//4. 调用
	_, err = instancePXA.Approve(auth, common.HexToAddress(adminAddr), tokenid)
	if err != nil {
		fmt.Println("failed to Approve  ", err)
		return err
	}
	return nil
}

// 取消授权
func CancelApprove(from, pass string, tokenid *big.Int) error {

	//1. 设置签名 -- 需要owner的keystore文件
	w, err := hdwallet.LoadWalletByPass(from, "./data", pass)
	if err != nil {
		fmt.Println("failed to LoadWalletByPass", err)
		return err
	}
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("Failed to get chainId", err)
		return err
	}
	auth, _ := w.HdKeyStore.NewTransactOpts(chainId)
	//2. 调用 - 通过将授权地址设置为0地址来取消授权
	_, err = instancePXA.Approve(auth, common.HexToAddress("0x0000000000000000000000000000000000000000"), tokenid)
	if err != nil {
		fmt.Println("failed to CancelApprove  ", err)
		return err
	}
	return nil
}

// 取消批量授权
func CancelApprovalForAll(from, pass string, operator string) error {

	//1. 设置签名 -- 需要owner的keystore文件
	w, err := hdwallet.LoadWalletByPass(from, "./data", pass)
	if err != nil {
		fmt.Println("failed to LoadWalletByPass", err)
		return err
	}
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("Failed to get chainId", err)
		return err
	}
	auth, _ := w.HdKeyStore.NewTransactOpts(chainId)
	//2. 调用 - 通过将approved设置为false来取消批量授权
	_, err = instancePXA.SetApprovalForAll(auth, common.HexToAddress(operator), false)
	if err != nil {
		fmt.Println("failed to CancelApprovalForAll  ", err)
		return err
	}
	return nil
}

// 转移erc20
func TransferPXC(from, pass, to string, value *big.Int) error {
	//1. 钱包加载
	w, err := hdwallet.LoadWalletByPass(from, "./data", pass)
	if err != nil {
		fmt.Println("failed to LoadWalletByPass", err)
		return err
	}
	//2. 获取chainId
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("Failed to get chainId", err)
		return err
	}
	//3. 设置签名
	auth, err := w.HdKeyStore.NewTransactOpts(chainId)
	if err != nil {
		fmt.Println("Failed to NewTransactOpts", err)
		return err
	}
	//4. 调用
	_, err = instancePXC.Transfer(auth, common.HexToAddress(to), value)
	if err != nil {
		fmt.Println("failed to Transfer  ", err)
		return err
	}
	return nil
}

// 转移erc721
func PartTransferPXA(from, to string, tokenid, weight, price *big.Int) error {
	//3. 设置签名 -- 需要owner的keystore文件
	keyin := strings.NewReader(adminkey)
	chainID, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("failed to ChainID  ", err)
		return err
	}
	// 修复：正确处理NewTransactorWithChainID可能返回的错误
	auth, err := bind.NewTransactorWithChainID(keyin, "1234", chainID)
	if err != nil {
		fmt.Println("failed to create transactor: ", err)
		return err
	}
	//4. 调用
	_, err = instancePXA.PartTransferFrom(auth, common.HexToAddress(from), common.HexToAddress(to), tokenid, weight, price)
	if err != nil {
		fmt.Println("failed to TransferPXA  ", err)
		return err
	}
	return nil
}

// 获取Token所有者
func GetTokenOwner(tokenID *big.Int) (common.Address, error) {
	// 创建一个call选项，使用默认值
	callOpts := &bind.CallOpts{}
	// 调用合约的OwnerOf方法
	owner, err := instancePXA.OwnerOf(callOpts, tokenID)
	if err != nil {
		fmt.Println("Failed to get token owner", err)
		return common.Address{}, err
	}
	return owner, nil
}

// 代币发放(Mint)
func MintToken(to string, value *big.Int) error {
	// 使用管理员身份创建交易选项
	keyin := strings.NewReader(adminkey)
	chainID, err := ethcli.ChainID(context.Background())
	if err != nil {
		fmt.Println("failed to get chainID: ", err)
		return err
	}
	auth, err := bind.NewTransactorWithChainID(keyin, "1234", chainID)
	if err != nil {
		fmt.Println("failed to create transactor: ", err)
		return err
	}
	// 调用Pxc20合约的Mint方法
	_, err = instancePXC.Mint(auth, common.HexToAddress(to), value)
	if err != nil {
		fmt.Println("failed to mint token: ", err)
		return err
	}
	fmt.Printf("Successfully minted %d tokens to address %s\n", value, to)
	return nil
}

// 查看以太币余额
func BalanceETH(from string) (*big.Int, error) {
	addr := common.HexToAddress(from)
	value, err := ethcli.BalanceAt(context.Background(), addr, nil)
	if err != nil {
		log.Panic("Failed to BalanceAt ", err, from)
		return nil, err
	}
	fmt.Printf("%s's balance is %d\n", from, value)
	return value, nil
}

// 以太币coin转账 - 使用*big.Int避免int64数值溢出
func Transfer(from, pass, toaddr string, value *big.Int) error {
	//1. 钱包加载
	w, _ := hdwallet.LoadWalletByPass(from, "./data", pass)
	//2. 获取nonce
	nonce, _ := ethcli.NonceAt(context.Background(), common.HexToAddress(from), nil)
	chainId, err := ethcli.ChainID(context.Background())
	if err != nil {
		log.Panic("Failed to get chainId", err)
	}
	//3. 创建交易
	gaslimit := uint64(300000)
	gasprice := big.NewInt(21000000000)
	amount := value // 直接使用传入的*big.Int值
	tx := types.NewTransaction(nonce, common.HexToAddress(toaddr), amount, gaslimit,
		gasprice, []byte("Salary"))
	//4. 签名
	stx, err := w.HdKeyStore.SignTx(common.HexToAddress(from), tx, chainId)
	if err != nil {
		log.Panic("Failed to SignTx", err)
	}
	//5. 发送交易
	return ethcli.SendTransaction(context.Background(), stx)
}

// token余额查询
func Tokenbalance(from string) (int64, error) {
	// 构建CallOpts
	fromaddr := common.HexToAddress(from)
	opts := bind.CallOpts{
		From: fromaddr,
	}

	value, err := instancePXC.BalanceOf(&opts, fromaddr)
	if err != nil {
		log.Panic("failed totoken.BalanceOf ", err)
	}
	fmt.Printf("%s's token balance is: %d\n", from, value.Int64())
	return value.Int64(), err
}

func Tokendetail(who string) error {
	// 1. 合约地址处理，这两个变量后面会使用
	cAddress := common.HexToAddress(PXC_ADDR)
	// 2. 计算需要监听的多个事件的哈希值
	topicHashTransfer := crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	topicHashApproval := crypto.Keccak256Hash([]byte("Approval(address,address,uint256)"))

	// 3. 设置过滤条件，在Topics中添加多个事件哈希值
	// 多个事件哈希放在同一个数组中表示逻辑或(OR)关系
	query := ethereum.FilterQuery{
		Addresses: []common.Address{cAddress},
		Topics:    [][]common.Hash{{topicHashTransfer, topicHashApproval}},
	}
	// 3. 查询全部日志
	logs, err := ethcli.FilterLogs(context.Background(), query)
	if err != nil {
		log.Panic("failed to FilterLogs", err)
	}

	for _, v := range logs {
		// 检查日志中是否包含事件哈希主题
		if len(v.Topics) > 0 {
			// 处理Transfer事件
			if v.Topics[0] == topicHashTransfer && len(v.Topics) == 3 {
				fromF := v.Topics[1].Bytes()[len(v.Topics[1].Bytes())-20:]
				to := v.Topics[2].Bytes()[len(v.Topics[2].Bytes())-20:]
				val := big.NewInt(0)
				val.SetBytes(v.Data)
				fromAddr := fmt.Sprintf("0x%x", fromF)
				toAddr := fmt.Sprintf("0x%x", to)
				if strings.ToUpper(fromAddr) == strings.ToUpper(who) || strings.ToUpper(toAddr) == strings.ToUpper(who) {
					direction := '-'
					if strings.ToUpper(toAddr) == strings.ToUpper(who) {
						direction = '+'
					}
					fmt.Printf("[Block %d] Transfer: %s -> %s, value: %c%d\n",
						v.BlockNumber, fromAddr, toAddr, direction, val.Int64())
				}
			} else if v.Topics[0] == topicHashApproval && len(v.Topics) == 3 {
				// 处理Approval事件
				owner := v.Topics[1].Bytes()[len(v.Topics[1].Bytes())-20:]
				approved := v.Topics[2].Bytes()[len(v.Topics[2].Bytes())-20:]
				tokenId := big.NewInt(0)
				tokenId.SetBytes(v.Data)
				ownerAddr := fmt.Sprintf("0x%x", owner)
				if strings.ToUpper(ownerAddr) == strings.ToUpper(who) {
					fmt.Printf("[Block %d] Approval: owner=%s, approved=%s, tokenId=%d\n",
						v.BlockNumber, ownerAddr, fmt.Sprintf("0x%x", approved), tokenId.Int64())
				}
			}
		}
	}
	return nil
}

func PXA721detail(who string) error {
	// 1. 合约地址处理
	cAddress := common.HexToAddress(PXA_ADDR)
	// 2. 计算需要监听的多个事件的哈希值
	topicHashTransfer := crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
	topicHashApproval := crypto.Keccak256Hash([]byte("Approval(address,address,uint256)"))
	topicHashApprovalForAll := crypto.Keccak256Hash([]byte("ApprovalForAll(address,address,bool)"))

	// 3. 设置过滤条件，在Topics中添加多个事件哈希值
	// 多个事件哈希放在同一个数组中表示逻辑或(OR)关系
	query := ethereum.FilterQuery{
		Addresses: []common.Address{cAddress},
		Topics:    [][]common.Hash{{topicHashTransfer, topicHashApproval, topicHashApprovalForAll}},
	}
	// 3. 查询全部日志
	logs, err := ethcli.FilterLogs(context.Background(), query)
	if err != nil {
		log.Panic("failed to FilterLogs", err)
	}

	for _, v := range logs {
		// 检查 Transfer 事件
		if v.Topics[0] == topicHashTransfer && len(v.Topics) == 4 {
			// 正确提取 from 地址（前24个字节是补零，后20个字节是地址）
			if len(v.Topics[1].Bytes()) < 20 {
				fmt.Printf("[警告] Transfer事件的from地址数据不完整\n")
				continue
			}
			fromBytes := v.Topics[1].Bytes()[len(v.Topics[1].Bytes())-20:]
			fromAddr := fmt.Sprintf("0x%x", fromBytes)

			// 正确提取 to 地址
			if len(v.Topics[2].Bytes()) < 20 {
				fmt.Printf("[警告] Transfer事件的to地址数据不完整\n")
				continue
			}
			toBytes := v.Topics[2].Bytes()[len(v.Topics[2].Bytes())-20:]
			toAddr := fmt.Sprintf("0x%x", toBytes)

			// 正确提取 tokenId - tokenId 是 indexed 参数，应该在 Topics[3] 中
			if len(v.Topics) < 4 {
				fmt.Printf("[警告] Transfer事件缺少tokenId主题\n")
				continue
			}
			tokenId := big.NewInt(0)
			tokenId.SetBytes(v.Topics[3].Bytes()) // 从 Topics[3] 提取 tokenId

			// 转换地址为大写进行比较
			fromAddrUpper := strings.ToUpper(fromAddr)
			toAddrUpper := strings.ToUpper(toAddr)
			whoUpper := strings.ToUpper(who)

			// 检查地址匹配
			if fromAddrUpper == whoUpper || toAddrUpper == whoUpper {
				fmt.Printf("[Block %d] Transfer 事件: 发送方=%s, 接收方=%s, tokenId=%d\n",
					v.BlockNumber, fromAddr, toAddr, tokenId.Int64())
			}

			// 检查 Approval 事件
		} else if v.Topics[0] == topicHashApproval && len(v.Topics) == 4 {
			// 正确提取 owner 地址
			if len(v.Topics[1].Bytes()) < 20 {
				fmt.Printf("[警告] Approval事件的owner地址数据不完整\n")
				continue
			}
			ownerBytes := v.Topics[1].Bytes()[len(v.Topics[1].Bytes())-20:]
			ownerAddr := fmt.Sprintf("0x%x", ownerBytes)

			// 正确提取 approved 地址
			if len(v.Topics[2].Bytes()) < 20 {
				fmt.Printf("[警告] Approval事件的approved地址数据不完整\n")
				continue
			}
			approvedBytes := v.Topics[2].Bytes()[len(v.Topics[2].Bytes())-20:]
			approvedAddr := fmt.Sprintf("0x%x", approvedBytes)

			// 正确提取 tokenId - tokenId 是 indexed 参数，应该在 Topics[3] 中
			if len(v.Topics) < 4 {
				fmt.Printf("[警告] Approval事件缺少tokenId主题\n")
				continue
			}
			tokenId := big.NewInt(0)
			tokenId.SetBytes(v.Topics[3].Bytes()) // 从 Topics[3] 提取 tokenId

			// 转换地址为大写进行比较
			ownerAddrUpper := strings.ToUpper(ownerAddr)
			whoUpper := strings.ToUpper(who)

			// 检查地址匹配
			if ownerAddrUpper == whoUpper {
				fmt.Printf("[Block %d] Approval 事件: 所有者=%s, 授权方=%s, tokenId=%d\n",
					v.BlockNumber, ownerAddr, approvedAddr, tokenId.Int64())
			}

			// 检查 ApprovalForAll 事件
		} else if v.Topics[0] == topicHashApprovalForAll && len(v.Topics) == 3 {
			// 正确提取 owner 地址
			if len(v.Topics[1].Bytes()) < 20 {
				fmt.Printf("[警告] ApprovalForAll事件的owner地址数据不完整\n")
				continue
			}
			ownerBytes := v.Topics[1].Bytes()[len(v.Topics[1].Bytes())-20:]
			ownerAddr := fmt.Sprintf("0x%x", ownerBytes)

			// 正确提取 operator 地址
			if len(v.Topics[2].Bytes()) < 20 {
				fmt.Printf("[警告] ApprovalForAll事件的operator地址数据不完整\n")
				continue
			}
			operatorBytes := v.Topics[2].Bytes()[len(v.Topics[2].Bytes())-20:]
			operatorAddr := fmt.Sprintf("0x%x", operatorBytes)

			// 正确提取 approved 布尔值
			approved := false
			if len(v.Data) > 0 {
				approved = v.Data[len(v.Data)-1] == 1
			}

			// 转换地址为大写进行比较
			ownerAddrUpper := strings.ToUpper(ownerAddr)
			whoUpper := strings.ToUpper(who)

			// 检查地址匹配
			if ownerAddrUpper == whoUpper {
				fmt.Printf("[Block %d] ApprovalForAll 事件: 所有者=%s, 操作员=%s, 是否授权=%v\n",
					v.BlockNumber, ownerAddr, operatorAddr, approved)
			}
		}
	}
	return nil
}
