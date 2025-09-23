package eths

import (
	"fmt"

	"copyright/hdwallet"

	"github.com/ethereum/go-ethereum/crypto"
)

func NewAcc(pass string) (string, error) {
	w, err := hdwallet.NewWallet("./data")
	if err != nil {
		fmt.Println("failed to NewWallet", err)
	}
	err = w.StoreKey(pass)
	if err != nil {
		fmt.Println("failed to StoreKey", err)
	}
	return w.Address.Hex(), nil
}

func KeccakHash(data []byte) []byte {
	return crypto.Keccak256(data)
}
