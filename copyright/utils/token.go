package utils

import (
	"math/big"
	"time"
)

// token生成器结构
type TokenReader struct {
	f func() int64
}

// 全局结构
var tr *TokenReader

// init自动初始化
func init() {
	tr = NewTokenReader(NextID())
}

// 构造token生成器
func NewTokenReader(f func() int64) *TokenReader {
	return &TokenReader{f}
}

// 闭包函数
func NextID() func() int64 {
	var index int64 = 0
	return func() int64 {
		if index >= 10000 {
			index = 0
		}
		index++
		return index
	}
}

func NewTokenID() int64 {
	value1 := big.NewInt(tr.f())
	value2 := big.NewInt(0)
	value2, _ = value2.SetString(time.Now().Format("20060102150405"), 10)
	return value2.Int64()*10000 + value1.Int64()
}
