package routes

import (
	"copyright/dbs"
	"copyright/eths"
	"copyright/utils"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
)

var session *sessions.CookieStore

func init() {
	session = sessions.NewCookieStore([]byte("secret"))
}

// resp数据响应
func ResponseData(c echo.Context, resp *utils.Resp) {
	resp.ErrMsg = utils.RecodeText(resp.Errno)
	c.JSON(http.StatusOK, resp)
}

func Ping(c echo.Context) error {
	return c.String(http.StatusOK, "Pong!")
}

// 注册
func Register(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 1. 解析请求数据
	user := dbs.User{}
	err := c.Bind(&user)
	if err != nil {
		fmt.Println("Failed to bind user", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	fmt.Println(user)
	// 2. 创建账户地址
	addr, err := eths.NewAcc(user.Password)
	if err != nil {
		fmt.Println("Failed to eths.NewAcc", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	user.Address = addr
	// 3. 保存到数据库
	err = user.Add()
	if err != nil {
		fmt.Println("Failed to user.Add()", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	resp.Data = addr
	return nil
}

// 获取以太坊余额接口 GET /balance?address=0x...
func GetBalance(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取查询参数中的地址
	address := c.QueryParam("address")
	if address == "" {
		// 如果没有提供地址参数，尝试从session中获取当前用户的地址
		sess, err := session.Get(c.Request(), "session")
		if err != nil {
			fmt.Println("Failed to get session", err)
			resp.Errno = utils.RECODE_LOGINERR
			return err
		}
		userAddress, ok := sess.Values["address"].(string)
		if !ok || userAddress == "" {
			fmt.Println("Failed to get address from session")
			resp.Errno = utils.RECODE_PARAMERR
			return errors.New("address parameter is required")
		}
		address = userAddress
	}
	// 调用balanceETH函数获取余额
	balance, err := eths.BalanceETH(address)
	if err != nil {
		fmt.Println("Failed to get balance", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"address": address,
		"balance": balance.String(), // 转换为字符串返回，避免JSON序列化问题
	}
	return nil
}

// 以太坊转账接口 POST /transfer
func Transfer(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取session中的用户信息
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("Failed to get session", err)
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if !ok || address == "" {
		fmt.Println("Failed to get address from session")
		resp.Errno = utils.RECODE_LOGINERR
		return errors.New("please login first")
	}
	password, _ := sess.Values["password"].(string)
	// 解析请求参数 - 使用string类型避免int64数值溢出
	txData := struct {
		To    string `json:"to"`
		Value string `json:"value"`
	}{}
	err = c.Bind(&txData)
	if err != nil {
		fmt.Println("Failed to bind transfer data", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	if txData.To == "" || txData.Value == "" {
		fmt.Println("Invalid transfer parameters")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid transfer parameters")
	}
	// 将string转换为*big.Int
	valueBig := new(big.Int)
	valueBig, ok = valueBig.SetString(txData.Value, 10)
	if !ok || valueBig.Cmp(big.NewInt(0)) <= 0 {
		fmt.Println("Invalid transfer value format or value is not positive")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid transfer value")
	}
	// 调用Transfer函数进行转账 - 直接传递*big.Int避免数值溢出
	err = eths.Transfer(address, password, txData.To, valueBig)
	if err != nil {
		fmt.Println("Failed to transfer ETH", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"from":  address,
		"to":    txData.To,
		"value": txData.Value,
	}
	return nil
}

// PXC代币转账接口 POST /transfer/pxc
func TransferPXC(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取session中的用户信息
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("Failed to get session", err)
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if !ok || address == "" {
		fmt.Println("Failed to get address from session")
		resp.Errno = utils.RECODE_LOGINERR
		return errors.New("please login first")
	}
	password, _ := sess.Values["password"].(string)
	// 解析请求参数 - 使用string类型避免int64数值溢出
	txData := struct {
		To    string `json:"to"`
		Value string `json:"value"`
	}{}
	err = c.Bind(&txData)
	if err != nil {
		fmt.Println("Failed to bind transfer data", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	if txData.To == "" || txData.Value == "" {
		fmt.Println("Invalid transfer parameters")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid transfer parameters")
	}
	// 将string转换为*big.Int
	valueBig, ok := new(big.Int).SetString(txData.Value, 10)
	if !ok || valueBig.Cmp(big.NewInt(0)) <= 0 {
		fmt.Println("Invalid transfer value format or value is not positive")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid transfer value")
	}
	// 调用TransferPXC函数进行PXC代币转账
	err = eths.TransferPXC(address, password, txData.To, valueBig)
	if err != nil {
		fmt.Println("Failed to transfer PXC", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"from":  address,
		"to":    txData.To,
		"value": txData.Value,
	}
	return nil
}

// 查询Token余额接口 GET /token/balance?address=0x...
func GetTokenBalance(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取查询参数中的地址
	address := c.QueryParam("address")
	if address == "" {
		// 如果没有提供地址参数，尝试从session中获取当前用户的地址
		sess, err := session.Get(c.Request(), "session")
		if err != nil {
			fmt.Println("Failed to get session", err)
			resp.Errno = utils.RECODE_LOGINERR
			return err
		}
		userAddress, ok := sess.Values["address"].(string)
		if !ok || userAddress == "" {
			fmt.Println("Failed to get address from session")
			resp.Errno = utils.RECODE_PARAMERR
			return errors.New("address parameter is required")
		}
		address = userAddress
	}
	// 调用Tokenbalance函数获取Token余额
	balance, err := eths.Tokenbalance(address)
	if err != nil {
		fmt.Println("Failed to get token balance", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"address": address,
		"balance": balance,
	}
	return nil
}

// 查询Token交易明细接口 GET /token/detail?address=0x...
func GetTokenDetail(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取查询参数中的地址
	address := c.QueryParam("address")
	if address == "" {
		// 如果没有提供地址参数，尝试从session中获取当前用户的地址
		sess, err := session.Get(c.Request(), "session")
		if err != nil {
			fmt.Println("Failed to get session", err)
			resp.Errno = utils.RECODE_LOGINERR
			return err
		}
		userAddress, ok := sess.Values["address"].(string)
		if !ok || userAddress == "" {
			fmt.Println("Failed to get address from session")
			resp.Errno = utils.RECODE_PARAMERR
			return errors.New("address parameter is required")
		}
		address = userAddress
	}
	// 调用Tokendetail函数获取Token交易明细
	err := eths.Tokendetail(address)
	if err != nil {
		fmt.Println("Failed to get token detail", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"address": address,
		"message": "token transaction details have been printed to console",
	}
	return nil
}

func GetPXA721Detail(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 获取查询参数中的地址
	address := c.QueryParam("address")
	if address == "" {
		// 如果没有提供地址参数，尝试从session中获取当前用户的地址
		sess, err := session.Get(c.Request(), "session")
		if err != nil {
			fmt.Println("Failed to get session", err)
			resp.Errno = utils.RECODE_LOGINERR
			return err
		}
		userAddress, ok := sess.Values["address"].(string)
		if !ok || userAddress == "" {
			fmt.Println("Failed to get address from session")
			resp.Errno = utils.RECODE_PARAMERR
			return errors.New("address parameter is required")
		}
		address = userAddress
	}

	err := eths.PXA721detail(address)
	if err != nil {
		fmt.Println("Failed to get token detail", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	// 设置响应数据
	resp.Data = map[string]interface{}{
		"address": address,
		"message": "token transaction details have been printed to console",
	}
	return nil
}

// 登陆 POST /login {username,identity_id}
func Login(c echo.Context) error {
	//组织响应消息
	resp := utils.Resp{
		Errno: "0",
	}
	defer ResponseData(c, &resp)
	// 1. 解析请求数据
	user := dbs.User{}
	err := c.Bind(&user)
	if err != nil {
		fmt.Println("Failed to bind user", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	fmt.Println(user)
	// 2. 查询数据库
	ok, err := user.Query()
	if err != nil {
		fmt.Println("Failed to  user.Query()", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	if !ok {
		fmt.Println("Failed to  user or password err", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	// 3. session处理
	sess, _ := session.Get(c.Request(), "session")
	sess.Options = &sessions.Options{
		Path:     "/",
		HttpOnly: true,
	}
	sess.Values["address"] = user.Address
	sess.Values["password"] = user.Password
	sess.Save(c.Request(), c.Response())

	resp.Data = user.Address

	return nil
}

// GET /session
func Session(c echo.Context) error {
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//处理session
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address := sess.Values["address"]
	if address == "" {
		fmt.Println("failed to get session, user is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	fmt.Println(address)
	return nil
}

func ListUsers(c echo.Context) error {
	// 1. 响应消息提前初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	// 2. 解析请求参数
	pageNumStr := c.QueryParam("pageNum")
	pageSizeStr := c.QueryParam("pageSize")

	// 3. 将字符串参数转换为整数
	pageNum, _ := strconv.Atoi(pageNumStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	// 4. 创建User对象并调用数据库方法
	var user dbs.User
	pageResult, err := user.ListUsers(pageNum, pageSize)
	if err != nil {
		fmt.Println("Failed to ListUsers", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	resp.Data = pageResult
	return nil
}

func DeleteUser(c echo.Context) error {
	// 1. 响应消息提前初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	// 2. 解析请求参数
	address := c.QueryParam("address")
	// 3. 删除私钥文件
	filePath := "./data/" + address
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		fmt.Printf("Error: Account %s does not exist\n", address)
		return err
	}
	// 4. 删除文件
	if err := os.Remove(filePath); err != nil {
		fmt.Printf("Error: Failed to delete account %s: %v\n", address, err)
		return err
	}

	// 4. 创建User对象并调用数据库方法
	var user dbs.User
	err := user.DeleteByAddress(address)
	if err != nil {
		fmt.Println("Failed to DeleteUser", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	return nil
}

// 上传图片功能
// upload POST: /content
func Upload(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)

	// 2.1解析数据
	content := &dbs.Content{}

	h, err := c.FormFile("fileName")
	if err != nil {
		fmt.Println("failed to FormFile ", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	src, err := h.Open()
	if err != nil {
		fmt.Println("failed to open file ", err)
		resp.Errno = utils.RECODE_SYSERR
		return err
	}
	defer src.Close()
	// 2.2 获得tokenid
	tokenid := utils.NewTokenID()
	content.TokenID = fmt.Sprintf("%d", tokenid)
	filename := fmt.Sprintf("static/contents/%s.jpg", content.TokenID)
	content.ContentPath = fmt.Sprintf("/contents/%s.jpg", content.TokenID)
	dst, err := os.Create(filename)
	if err != nil {
		fmt.Println("failed to create file ", err, content.ContentPath)
		resp.Errno = utils.RECODE_SYSERR
		return err
	}
	defer dst.Close()
	// 2.3 计算hash
	cData := make([]byte, h.Size)
	n, err := src.Read(cData)
	if err != nil || h.Size != int64(n) {
		resp.Errno = utils.RECODE_SYSERR
		return err
	}
	hash := eths.KeccakHash(cData)
	content.ContentHash = fmt.Sprintf("%x", hash)

	dst.Write(cData)
	content.Title = h.Filename

	//3. 从session获取账户地址
	sess, _ := session.Get(c.Request(), "session")
	content.Address, _ = sess.Values["address"].(string)

	pass, ok := sess.Values["password"].(string)
	if !ok || content.Address == "" || pass == "" {
		resp.Errno = utils.RECODE_LOGINERR
		return errors.New("no session")
	}

	//4. 操作mysql-新增数据
	err = content.AddContent()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	// 登记股权
	equityRegistration := &dbs.EquityRegistration{
		Address: content.Address,
		TokenID: content.TokenID,
		Weight:  100,
	}
	err = equityRegistration.AddEquityRegistration()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	//5. 操作以太坊
	err = eths.UploadPic(content.Address, pass, content.Address, big.NewInt(tokenid))
	if err != nil {
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	return nil
}

const PAGE_MAX_PIC = 5

// 查看用户所有图片
func GetContents(c echo.Context) error {
	// 1. 响应消息提前初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	// 2. 从session获得用户地址
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	// 3. 查询数据库
	equityRegistration := &dbs.EquityRegistration{}
	contents, err := equityRegistration.QueryEquityByAddress(address)
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	// 4. 组织响应数据内容
	mapResp := make(map[string]interface{})
	mapResp["contents"] = contents
	resp.Data = mapResp
	return nil
}

// 卖家把自己名下一定份额的版权挂到页面上出售
func Auction(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)

	//2. 解析数据
	auction := &dbs.Auction{}
	if err := c.Bind(auction); err != nil {
		fmt.Println(auction)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	fmt.Println("Auction:", auction)

	//3. session获取
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	addr := sess.Values["address"].(string)
	pass, ok := sess.Values["password"].(string)
	auction.Address = addr
	if addr == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}

	// 校验数据，如果当前用户存在正在出售的此商品，则不允许重复出售
	checkAuction := dbs.Auction{
		Address: addr,
		TokenID: auction.TokenID,
	}
	count, err := checkAuction.CountByAddressAndTokenID()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	if count > 0 {
		resp.Errno = utils.RECODE_REPEATERR
		return err
	}
	// 挂牌出售
	auction.Add()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	//5. 操作eth
	value := big.NewInt(0)
	value, _ = value.SetString(auction.TokenID, 10)
	err = eths.SetApprove(auction.Address, pass, value)
	if err != nil {
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	return nil
}

// 查看当前用户可买的商品列表
func GetAuctions(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.处理session
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	fmt.Println("GetAuctions:", address)
	//3.查询数据库
	auctions, err := dbs.QueryAuctions(address)
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	resp.Data = auctions

	return nil
}

// 用户竞拍购买一个商品
func BidAuction(c echo.Context) error {
	//1. 组织响应数据
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2. 获取参数
	ah := &dbs.AuctionHis{}
	if err := c.Bind(ah); err != nil {
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	//3. session?
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, _ := sess.Values["address"].(string)
	pass, ok := sess.Values["password"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	ah.Buyer = address

	//4. 数据库操作
	err = ah.Add()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	//4. 数据库操作-卖家份额扣减
	auction := dbs.Auction{
		TokenID: ah.TokenID,
		Address: ah.Address,
	}
	err = auction.UpdateWeight(ah.Weight)
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	//4. 数据库操作-卖家库存扣减
	equityRegistration := dbs.EquityRegistration{
		TokenID: ah.TokenID,
		Address: ah.Address,
		Weight:  -ah.Weight,
	}
	err = equityRegistration.AddEquityRegistration()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	// 买家增加库存，没有则新增一条数据
	equityRegistration.Weight = ah.Weight
	equityRegistration.Address = address
	err = equityRegistration.AddEquityRegistration()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	//5. eth 交割
	err = eths.TransferPXC(address, pass, ah.Address, big.NewInt(ah.Weight*ah.Price))
	if err != nil {
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	//func PartTransferPXA(from, to string, tokenid, weight, price *big.Int)
	value := big.NewInt(0)
	value, _ = value.SetString(ah.TokenID, 10)
	err = eths.PartTransferPXA(ah.Address, address, value, big.NewInt(ah.Weight), big.NewInt(ah.Price))
	if err != nil {
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	return nil
}

// 查询当前用户的拍卖列表 GET /myauctions
func GetMyAuctions(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.处理session
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	fmt.Println("GetMyAuctions:", address)
	//3.查询数据库
	auction := dbs.Auction{}
	auction.Address = address
	auctions, err := auction.QueryMyAuctions()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	resp.Data = auctions

	return nil
}

// 删除拍卖商品 DELETE /auction
func DeleteAuction(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.处理session
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	pass, ok := sess.Values["password"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	//3.获取请求参数
	tokenID := c.QueryParam("token_id")
	if tokenID == "" {
		fmt.Println("token_id is required")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("token_id is required")
	}
	//4.调用数据库方法
	action := dbs.Auction{Address: address}
	action.TokenID = tokenID
	err = action.DeleteAuction()
	if err != nil {
		resp.Errno = utils.RECODE_DBERR
		return err
	}
	// 取消授权
	tokenIDBig, ok := new(big.Int).SetString(tokenID, 10)
	if !ok {
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid tokenID format")
	}
	err = eths.CancelApprove(address, pass, tokenIDBig)
	if err != nil {
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	return nil
}

// 查询用户拍卖历史记录 GET /auction/history
func GetAuctionHistory(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.处理session
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	fmt.Println("GetAuctionHistory:", address)

	//3.获取分页参数
	pageNumStr := c.QueryParam("pageNum")
	pageSizeStr := c.QueryParam("pageSize")

	// 默认值
	pageNum := 1
	pageSize := 10

	// 转换页码
	if pageNumStr != "" {
		if num, err := strconv.Atoi(pageNumStr); err == nil && num > 0 {
			pageNum = num
		}
	}

	// 转换每页数量
	if pageSizeStr != "" {
		if num, err := strconv.Atoi(pageSizeStr); err == nil && num > 0 {
			pageSize = num
		}
	}

	//4.调用数据库分页查询方法
	actionHis := dbs.AuctionHis{Buyer: address}
	pageResult, err := actionHis.QueryAuctionHis(pageNum, pageSize)
	if err != nil {
		fmt.Println("failed to query auction history with pagination:", err)
		resp.Errno = utils.RECODE_DBERR
		return err
	}

	//5. 组织响应数据
	resp.Data = pageResult

	return nil
}

// 查询Token所有者 GET /token/owner
func GetTokenOwner(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.获取请求参数
	tokenIDStr := c.QueryParam("token_id")
	if tokenIDStr == "" {
		fmt.Println("token_id is required")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("token_id is required")
	}
	//3.转换tokenID为big.Int
	tokenID, ok := new(big.Int).SetString(tokenIDStr, 10)
	if !ok {
		fmt.Println("invalid tokenID format")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid tokenID format")
	}
	//4.调用以太坊合约查询所有者
	owner, err := eths.GetTokenOwner(tokenID)
	if err != nil {
		fmt.Println("failed to get token owner:", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	//5.组织响应数据
	resp.Data = map[string]string{
		"token_id": tokenIDStr,
		"owner":    owner.String(),
	}
	return nil
}

// 代币发放 POST /token/mint
func MintToken(c echo.Context) error {
	//1. 响应数据结构初始化
	var resp utils.Resp
	resp.Errno = utils.RECODE_OK
	defer ResponseData(c, &resp)
	//2.处理session，确保是管理员操作
	sess, err := session.Get(c.Request(), "session")
	if err != nil {
		fmt.Println("failed to get session")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	address, ok := sess.Values["address"].(string)
	if address == "" || !ok {
		fmt.Println("failed to get session,address is nil")
		resp.Errno = utils.RECODE_LOGINERR
		return err
	}
	//3.获取请求体参数
	type MintRequest struct {
		To    string `json:"to"`
		Value string `json:"value"`
	}
	var req MintRequest
	err = c.Bind(&req)
	if err != nil {
		fmt.Println("failed to bind request body", err)
		resp.Errno = utils.RECODE_PARAMERR
		return err
	}
	if req.To == "" || req.Value == "" {
		fmt.Println("to address and value are required")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("to address and value are required")
	}
	//4.转换value为big.Int
	value, ok := new(big.Int).SetString(req.Value, 10)
	if !ok {
		fmt.Println("invalid value format")
		resp.Errno = utils.RECODE_PARAMERR
		return errors.New("invalid value format")
	}
	to := req.To
	//5.调用代币发放函数
	err = eths.MintToken(to, value)
	if err != nil {
		fmt.Println("failed to mint token:", err)
		resp.Errno = utils.RECODE_ETHERR
		return err
	}
	//6.组织响应数据
	resp.Data = map[string]interface{}{
		"to":    to,
		"value": value.String(),
	}
	return nil
}
