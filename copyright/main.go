package main

import (
	"copyright/routes"

	"github.com/labstack/echo/v4/middleware"

	"github.com/labstack/echo/v4"
)

var Pecho *echo.Echo //echo框架对象全局定义
// 静态文件处理
func staticFile() {
	Pecho.Static("/contents", "static/contents")
}

func main() {
	//创建echo对象
	Pecho = echo.New()
	//添加CORS中间件允许跨域请求
	Pecho.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{echo.GET, echo.POST, echo.DELETE},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderCookie},
		AllowCredentials: true,
	}))
	//安装日志中间件
	Pecho.Use(middleware.Logger())
	//安装恢复中间件
	Pecho.Use(middleware.Recover())
	//在传输时使用压缩中间件
	Pecho.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
	}))

	staticFile()

	Pecho.GET("/ping", routes.Ping)
	Pecho.POST("/register", routes.Register)
	Pecho.POST("/login", routes.Login)
	Pecho.GET("/session", routes.Session)

	Pecho.GET("/users", routes.ListUsers)
	Pecho.DELETE("/users", routes.DeleteUser)

	Pecho.POST("/content", routes.Upload)     // 上传图片
	Pecho.GET("/content", routes.GetContents) //查看登录用户所有图片

	Pecho.POST("/auction", routes.Auction)                  //卖家挂牌出售
	Pecho.DELETE("/auction", routes.DeleteAuction)          //删除拍卖商品
	Pecho.GET("/auctions", routes.GetAuctions)              //查看当前用户可买的商品列表
	Pecho.GET("/myauctions", routes.GetMyAuctions)          //查看当前用户上架的拍卖列表
	Pecho.POST("/auction/bid", routes.BidAuction)           //用户购买一个商品
	Pecho.GET("/auction/history", routes.GetAuctionHistory) //查询用户拍卖历史记录（分页）
	Pecho.GET("/pxa721/detail", routes.GetPXA721Detail)     //查询Token交易明细
	Pecho.GET("/token/owner", routes.GetTokenOwner)         //查询Token所有者

	Pecho.GET("/balance", routes.GetBalance) //获取以太坊余额
	Pecho.POST("/transfer", routes.Transfer) //以太坊转账

	Pecho.POST("/token/transfer", routes.TransferPXC)   //PXC代币转账
	Pecho.POST("/token/mint", routes.MintToken)         //代币发放
	Pecho.GET("/token/balance", routes.GetTokenBalance) //查询Token余额
	Pecho.GET("/token/detail", routes.GetTokenDetail)   //查询Token交易明细
	Pecho.Logger.Fatal(Pecho.Start(":9527"))
}
