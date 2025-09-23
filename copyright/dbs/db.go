package dbs

import (
	"copyright/utils"
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

type User struct {
	Email    string `json:"email"`
	Password string `json:"identity_id"`
	UserName string `json:"username"`
	Address  string `json:"address"`
}

type Content struct {
	Title       string `json:"title"`        //原图片名称
	ContentPath string `json:"content"`      //图片保存路径
	ContentHash string `json:"content_hash"` //图片hash
	Address     string `json:"address"`      //图片上传用户地址
	TokenID     string `json:"token_id"`     //图片tokenid
}

type Auction struct {
	ContentPath string `json:"content"`  //图片路径
	Address     string `json:"address"`  //图片归属地址
	UserName    string `json:"username"` //图片归属账号
	TokenID     string `json:"token_id"` //图片tokenid
	Weight      int    `json:"weight"`   //拍卖百分比
	Price       int    `json:"price"`    //百分比单价
}

type AuctionHis struct {
	Buyer     string `json:"buyer"`      //拍卖者
	Address   string `json:"address"`    //图片归属账户
	TokenID   string `json:"token_id"`   //图片tokenid
	Weight    int64  `json:"weight"`     //拍卖百分比
	Price     int64  `json:"price"`      //百分比单价
	CreatedAt string `json:"created_at"` //创建时间
	Content   string `json:"content"`    //内容路径
}

type EquityRegistration struct {
	Address     string `json:"address"`    //图片归属账户
	TokenID     string `json:"token_id"`   //图片tokenid
	Weight      int64  `json:"weight"`     //拍卖百分比
	CreatedAt   string `json:"created_at"` //创建时间
	ContentPath string `json:"content"`    //图片保存路径
}

// 数据库连接的全局变量
var DBConn *sql.DB

// init函数是本包被其他文件引用时自动执行，并且整个工程只会执行一次
func init() {
	DBConn = InitDB("root:1234@tcp(localhost:3306)/copyright?charset=utf8", "mysql")
}

// 初始化数据库连接
func InitDB(connstr, Driver string) *sql.DB {
	db, err := sql.Open(Driver, connstr)
	if err != nil {
		panic(err.Error())
	}

	if err != nil {
		panic(err.Error()) // proper error handling instead of panic in your app
	}
	return db
}

func (u User) Add() error {
	_, err := DBConn.Exec("insert into t_user(email, username, password, address) values(?,?,?,?)",
		u.Email, u.UserName, u.Password, u.Address)
	if err != nil {
		fmt.Println("failed to insert t_user ", err)
		return err
	}
	return err
}

func (u *User) Query() (bool, error) {
	rows, err := DBConn.Query("select email,address from t_user where username=? and password=?",
		u.UserName, u.Password)
	if err != nil {
		fmt.Println("failed to select t_user ", err)
		return false, err
	}
	//有结果集
	if rows.Next() {
		err = rows.Scan(&u.Email, &u.Address)
		if err != nil {
			fmt.Println("failed to scan select t_user ", err)
			return false, err
		}
		return true, nil
	}
	return false, err
}

// 根据用户名查询用户信息
func (u *User) QueryByUsername(username string) (bool, error) {
	rows, err := DBConn.Query("select email, address from t_user where username=?", username)
	if err != nil {
		fmt.Println("failed to select t_user by username", err)
		return false, err
	}
	defer rows.Close()

	// 有结果集
	if rows.Next() {
		err = rows.Scan(&u.Email, &u.Address)
		if err != nil {
			fmt.Println("failed to scan select t_user by username", err)
			return false, err
		}
		return true, nil
	}
	return false, err
}

func (u *User) ListUsers(pageNum, pageSize int) (*utils.PageResult[User], error) {
	// 参数校验
	if pageNum <= 0 {
		pageNum = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	// 查询总记录数
	var total int
	countRow := DBConn.QueryRow("SELECT COUNT(*) FROM t_user")
	if err := countRow.Scan(&total); err != nil {
		fmt.Println("failed to get total count: ", err)
		return nil, err
	}

	// 计算分页参数
	offset := (pageNum - 1) * pageSize

	// 执行分页查询
	users := []User{}
	rows, err := DBConn.Query("SELECT email, username, address FROM t_user LIMIT ? OFFSET ?", pageSize, offset)
	if err != nil {
		fmt.Println("failed to select t_user: ", err)
		return nil, err
	}
	defer rows.Close() // 确保资源释放

	var user User
	// 遍历结果集
	for rows.Next() {
		err = rows.Scan(&user.Email, &user.UserName, &user.Address)
		if err != nil {
			fmt.Println("failed to scan t_user: ", err)
			return nil, err
		}
		users = append(users, user)
	}

	// 检查遍历过程中的错误
	if err = rows.Err(); err != nil {
		fmt.Println("error occurred during rows iteration: ", err)
		return nil, err
	}

	// 创建并返回分页结果
	pageResult := &utils.PageResult[User]{
		Rows:     users,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}

	return pageResult, nil
}

// DeleteByAddress 通过地址删除用户
func (u *User) DeleteByAddress(address string) error {
	// 执行删除操作
	result, err := DBConn.Exec("DELETE FROM t_user WHERE address = ?", address)
	if err != nil {
		fmt.Println("failed to delete user by address: ", err)
		return err
	}

	// 检查是否有记录被删除
	_, err = result.RowsAffected()
	if err != nil {
		fmt.Println("failed to get affected rows: ", err)
		return err
	}

	return nil
}

func (c *Content) AddContent() error {
	fmt.Printf("%+v\n", c)
	_, err := DBConn.Exec("insert into t_content(title,content,content_hash,address,token_id) values(?,?,?,?,?)",
		c.Title, c.ContentPath, c.ContentHash, c.Address, c.TokenID)
	if err != nil {
		fmt.Println("failed to insert t_content ", err)
		return err
	}

	return err
}

// QueryByTokenID方法用于根据token_id查询商品信息
func (c *Content) QueryByTokenID(tokenID string) error {
	// 执行查询，只查询title、content、content_hash字段
	rows, err := DBConn.Query("select title, content, content_hash from t_content where token_id = ? limit 1", tokenID)
	if err != nil {
		fmt.Println("failed to query t_content by token_id", err)
		return err
	}
	defer rows.Close()

	// 处理查询结果
	if rows.Next() {
		err = rows.Scan(&c.Title, &c.ContentPath, &c.ContentHash)
		if err != nil {
			fmt.Println("failed to scan t_content", err)
			return err
		}
	}

	// 检查遍历过程中的错误
	if err = rows.Err(); err != nil {
		fmt.Println("error during rows iteration", err)
		return err
	}

	return nil
}

func QueryContents(address string) ([]Content, error) {
	s := []Content{}
	// 1.查询
	rows, err := DBConn.Query("select title,content,content_hash,token_id from t_content where address =?", address)
	if err != nil {
		fmt.Println("failed to Query t_content ", err)
		return s, err
	}

	// 2.处理结果集
	for rows.Next() {
		var c Content
		err = rows.Scan(&c.Title, &c.ContentPath, &c.ContentHash, &c.TokenID)
		if err != nil {
			fmt.Println("failed to scan select t_content ", err)
			return s, err
		}
		s = append(s, c)
	}
	return s, nil
}

// Add方法用于向数据库中插入新的股权注册记录
func (er *EquityRegistration) AddEquityRegistration() error {
	_, err := DBConn.Exec("insert into t_equity_registration(address, token_id, weight) values(?,?,?)",
		er.Address, er.TokenID, er.Weight)
	if err != nil {
		fmt.Println("failed to insert t_equity_registration ", err)
		return err
	}
	return nil
}

// QueryEquityByAddress方法用于查询给定地址的股权列表，对weight求和并关联t_content表获取ContentPath
func (er *EquityRegistration) QueryEquityByAddress(address string) ([]EquityRegistration, error) {
	// 执行SQL查询，关联t_equity_registration和t_content表，对weight求和
	sqlQuery := `SELECT 
		er.token_id, 
		SUM(er.weight) as total_weight, 
		tc.content as content_path 
	FROM t_equity_registration er 
	LEFT JOIN t_content tc ON er.token_id = tc.token_id 
	WHERE er.address = ? 
	GROUP BY er.token_id, tc.content`

	rows, err := DBConn.Query(sqlQuery, address)
	if err != nil {
		fmt.Println("failed to query equity by address", err)
		return nil, err
	}
	defer rows.Close()

	// 存储查询结果
	result := []EquityRegistration{}
	for rows.Next() {
		var tokenID string
		var totalWeight int64
		var contentPath sql.NullString

		err := rows.Scan(&tokenID, &totalWeight, &contentPath)
		if err != nil {
			fmt.Println("failed to scan equity data", err)
			return nil, err
		}

		// 创建EquityRegistration对象
		equity := EquityRegistration{
			Address: address,
			TokenID: tokenID,
			Weight:  totalWeight,
		}

		// 检查contentPath是否有效并赋值
		if contentPath.Valid {
			equity.ContentPath = contentPath.String
		} else {
			equity.ContentPath = ""
		}

		result = append(result, equity)
	}

	// 检查遍历过程中的错误
	if err = rows.Err(); err != nil {
		fmt.Println("error during rows iteration", err)
		return nil, err
	}

	return result, nil
}

func (a Auction) Add() error {
	fmt.Println(a)
	_, err := DBConn.Exec("insert into t_auction(token_id,weight,price,address) values(?,?,?,?)",
		a.TokenID, a.Weight, a.Price, a.Address)
	if err != nil {
		fmt.Println("failed to insert t_auction ", err)
		return err
	}
	return err
}

// Update方法用于执行份额扣减功能
func (a Auction) UpdateWeight(deductWeight int64) error {
	_, err := DBConn.Exec("update t_auction set weight = weight - ? where token_id = ? and address = ?",
		deductWeight, a.TokenID, a.Address)
	if err != nil {
		fmt.Println("failed to update t_auction weight", err)
		return err
	}
	return nil
}

// QueryMyAuctions方法用于查询指定地址的拍卖记录，按创建时间降序排序
func (a Auction) QueryMyAuctions() ([]Auction, error) {
	auctions := []Auction{}
	// 执行查询，修正表名为t_auction，按created_at降序排序
	rows, err := DBConn.Query("select distinct a.content, b.address, b.price, b.weight, b.token_id from t_auction b, t_content a where b.address = ? and b.token_id = a.token_id and b.weight>0 order by b.created_at desc", a.Address)
	if err != nil {
		fmt.Println("failed to query t_auction by address", err)
		return auctions, err
	}
	defer rows.Close()

	var auction Auction
	// 处理结果集
	for rows.Next() {
		err = rows.Scan(&auction.ContentPath, &auction.Address, &auction.Price, &auction.Weight, &auction.TokenID)
		if err != nil {
			fmt.Println("failed to scan t_auction", err)
			return auctions, err
		}
		auctions = append(auctions, auction)
	}
	// 检查遍历过程中的错误
	if err = rows.Err(); err != nil {
		fmt.Println("error during rows iteration", err)
		return auctions, err
	}
	return auctions, nil
}

// Delete方法用于删除指定地址和token_id的拍卖商品
func (a Auction) DeleteAuction() error {
	_, err := DBConn.Exec("delete from t_auction where address = ? and token_id = ?", a.Address, a.TokenID)
	if err != nil {
		fmt.Println("failed to delete t_auction", err)
		return err
	}
	return nil
}

// CountByAddressAndTokenID方法用于统计指定地址和token_id的拍卖记录数量
func (a Auction) CountByAddressAndTokenID() (int64, error) {
	var count int64
	// 执行查询，统计符合条件的记录数量
	err := DBConn.QueryRow("select count(*) from t_auction where address = ? and token_id = ?", a.Address, a.TokenID).Scan(&count)
	if err != nil {
		fmt.Println("failed to count t_auction by address and token_id", err)
		return 0, err
	}
	return count, nil
}

func QueryAuctions(address string) ([]Auction, error) {
	s := []Auction{}
	// 1.查询
	rows, err := DBConn.Query("select a.content,b.address,c.username,b.price,b.weight,a.token_id from t_content a,t_auction b,t_user c where a.token_id=b.token_id and b.address = c.address  and b.address <> ?  and b.weight > 0", address)
	if err != nil {
		fmt.Println("failed to Query t_auction ", err)
		return s, err
	}

	var a Auction
	// 2.处理结果集
	//a.content,a.address,b.price,b.weight,a.token_id
	for rows.Next() {
		err = rows.Scan(&a.ContentPath, &a.Address, &a.UserName, &a.Price, &a.Weight, &a.TokenID)
		if err != nil {
			fmt.Println("failed to scan select t_aution & t_content ", err)
			return s, err
		}
		s = append(s, a)
	}
	return s, nil
}

func (ah AuctionHis) Add() error {
	_, err := DBConn.Exec("insert into t_auction_his(buyer,address,token_id,weight,price) values(?,?,?,?,?)",
		ah.Buyer, ah.Address, ah.TokenID, ah.Weight, ah.Price)
	if err != nil {
		fmt.Println("failed to insert t_auction_his ", err)
		return err
	}
	return nil
}

// QueryAuctionHis方法用于查询指定买家的拍卖历史记录，包含相关内容信息，按创建时间降序排序
func (ah AuctionHis) QueryAuctionHis(pageNum, pageSize int) (*utils.PageResult[AuctionHis], error) {
	// 参数校验
	if pageNum <= 0 {
		pageNum = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	// 查询总记录数
	var total int
	countSQL := `SELECT COUNT(*) FROM t_auction_his his 
		LEFT JOIN ( 
			SELECT distinct token_id,content 
			FROM t_content tc 
		) tc on tc.token_id = his.token_id 
		WHERE his.buyer = ?`
	countRow := DBConn.QueryRow(countSQL, ah.Buyer)
	if err := countRow.Scan(&total); err != nil {
		fmt.Println("failed to get total count of auction history: ", err)
		return nil, err
	}

	// 计算分页参数
	offset := (pageNum - 1) * pageSize

	// 使用用户要求的LEFT JOIN查询，从t_auction_his表和t_content表获取数据，并添加分页
	sqlQuery := `SELECT 
		 his.buyer, 
		 his.address, 
		 his.token_id, 
		 his.weight, 
		 his.price, 
		 his.created_at, 
		 tc.content 
	 FROM t_auction_his his 
	 LEFT JOIN ( 
		 SELECT distinct token_id,content 
		 FROM t_content tc 
	 ) tc on tc.token_id = his.token_id 
	 WHERE his.buyer = ? 
	 ORDER BY his.created_at DESC 
	 LIMIT ? OFFSET ?`

	rows, err := DBConn.Query(sqlQuery, ah.Buyer, pageSize, offset)
	if err != nil {
		fmt.Println("failed to query t_auction_his with join ", err)
		return nil, err
	}
	defer rows.Close()

	// 存储查询结果
	result := make([]AuctionHis, 0)
	for rows.Next() {
		var a AuctionHis
		// 扫描所有查询结果列，包括新增的created_at和content字段
		err := rows.Scan(&a.Buyer, &a.Address, &a.TokenID, &a.Weight, &a.Price, &a.CreatedAt, &a.Content)
		if err != nil {
			fmt.Println("failed to scan joined auction history data ", err)
			return nil, err
		}
		result = append(result, a)
	}

	// 检查遍历行时是否有错误
	if err = rows.Err(); err != nil {
		fmt.Println("error during rows iteration ", err)
		return nil, err
	}

	// 构建分页结果对象
	pageResult := &utils.PageResult[AuctionHis]{
		Rows:     result,
		Total:    total,
		PageSize: pageSize,
		PageNum:  pageNum,
	}

	return pageResult, nil
}
