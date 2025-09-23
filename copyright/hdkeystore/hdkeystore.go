package hdkeystore

import (
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"os"
	"path/filepath"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
)

type HDkeyStore struct {
	keysDirPath string       //文件所在路径
	scryptN     int          //生成加密文件的参数N
	scryptP     int          //生成加密文件的参数P
	Key         keystore.Key //keystore对应的key
}

// 给出一个生成HDkeyStore对象的方法,通过privatekey生成
func NewHDkeyStore(path string, privateKey *ecdsa.PrivateKey) *HDkeyStore {
	//获得UUID
	uid, err := uuid.NewRandom()
	if err != nil {
		// 处理错误，这里简化处理
		panic(err)
	}
	key := keystore.Key{
		Id:         uid,
		Address:    crypto.PubkeyToAddress(privateKey.PublicKey), //地址信息
		PrivateKey: privateKey,                                   //私钥信息
	}
	return &HDkeyStore{
		keysDirPath: path,
		scryptN:     keystore.LightScryptN, //固定参数
		scryptP:     keystore.LightScryptP, //固定参数
		Key:         key,
	}
}

// 存储key为keystore文件
func (ks HDkeyStore) StoreKey(filename string, key *keystore.Key, auth string) error {
	//编码key为json
	keyjson, err := keystore.EncryptKey(key, auth, ks.scryptN, ks.scryptP)
	if err != nil {
		return err
	}
	//写入文件
	return WriteKeyFile(filename, keyjson)
}

func WriteKeyFile(file string, content []byte) error {
	// Create the keystore directory with appropriate permissions
	// in case it is not present yet.
	const dirPerm = 0700
	if err := os.MkdirAll(filepath.Dir(file), dirPerm); err != nil {
		return err
	}
	// Atomic write: create a temporary hidden file first
	// then move it into place. TempFile assigns mode 0600.
	f, err := os.CreateTemp(filepath.Dir(file), "."+filepath.Base(file)+".tmp")
	if err != nil {
		return err
	}
	if _, err := f.Write(content); err != nil {
		f.Close()
		os.Remove(f.Name())
		return err
	}
	f.Close()

	return os.Rename(f.Name(), file)
}

func (ks HDkeyStore) JoinPath(filename string) string {
	//如果filename是绝对路径，则直接返回
	if filepath.IsAbs(filename) {
		return filename
	}
	//将路径与文件拼接
	return filepath.Join(ks.keysDirPath, filename)
}

// 解析key
func (ks *HDkeyStore) GetKey(addr common.Address, filename, auth string) (*keystore.Key, error) {
	//读取文件内容

	keyjson, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	//利用以太坊DecryptKey解码json文件
	key, err := keystore.DecryptKey(keyjson, auth)
	if err != nil {
		return nil, err
	}
	// 如果地址不同代表解析失败
	if key.Address != addr {
		return nil, fmt.Errorf("key content mismatch: have account %x, want %x", key.Address, addr)
	}
	ks.Key = *key
	return key, nil
}

func NewHDkeyStoreNoKey(path string) *HDkeyStore {
	return &HDkeyStore{
		keysDirPath: path,
		scryptN:     keystore.LightScryptN,
		scryptP:     keystore.LightScryptP,
		Key:         keystore.Key{},
	}
}
func (ks HDkeyStore) SignTx(address common.Address, tx *types.Transaction, chainID *big.Int) (*types.Transaction, error) {
	// 交易签名
	signedTx, err := types.SignTx(tx, types.HomesteadSigner{}, ks.Key.PrivateKey)
	if err != nil {
		return nil, err
	}
	//验证 签名
	msg, err := signedTx.AsMessage(types.HomesteadSigner{}, chainID)
	if err != nil {
		return nil, err
	}
	sender := msg.From()
	if sender != address {
		return nil, fmt.Errorf("signer mismatch: expected %s, got %s", address.Hex(), sender.Hex())
	}

	return signedTx, nil
}

func (ks HDkeyStore) NewTransactOpts(chainID *big.Int) (*bind.TransactOpts, error) {
	return bind.NewKeyedTransactorWithChainID(ks.Key.PrivateKey, chainID)
}
