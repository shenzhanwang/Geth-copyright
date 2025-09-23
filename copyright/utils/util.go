package utils

const (
	RECODE_OK        = "0"
	RECODE_DBERR     = "4001"
	RECODE_LOGINERR  = "4002"
	RECODE_PARAMERR  = "4003"
	RECODE_SYSERR    = "4004"
	RECODE_ETHERR    = "4105"
	RECODE_UNKNOWERR = "4106"
	RECODE_REPEATERR = "4107"
)

var recodeText = map[string]string{
	RECODE_OK:        "成功",
	RECODE_DBERR:     "数据库操作错误",
	RECODE_LOGINERR:  "用户登录失败",
	RECODE_PARAMERR:  "参数错误",
	RECODE_SYSERR:    "系统错误",
	RECODE_ETHERR:    "与以太坊交互失败",
	RECODE_UNKNOWERR: "未知错误",
	RECODE_REPEATERR: "不允许出售重复资产，请下架后再试",
}

func RecodeText(code string) string {
	str, ok := recodeText[code]
	if ok {
		return str
	}
	return recodeText[RECODE_UNKNOWERR]
}

type Resp struct {
	Errno  string      `json:"errno"`
	ErrMsg string      `json:"errmsg"`
	Data   interface{} `json:"data"`
}

// PageResult 是一个泛型分页结果结构体，可以存储任意类型的实体列表
// T 是实体类型的类型参数
// 注意：此代码需要 Go 1.18 或更高版本的泛型支持

type PageResult[T any] struct {
	Rows     []T // 可存储任意类型的实体列表
	Total    int // 总记录数
	PageSize int // 每页记录数
	PageNum  int // 当前页码
}
