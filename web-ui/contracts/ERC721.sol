// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @dev ERC721Receiver 接口定义
 * 用于安全转账检查
 */
interface ERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}


/**
 * @title ERC721
 * @dev 手动实现的最小化 ERC-721 合约
 */
contract ERC721 {

    string public name;

    // 记录每个 tokenId 的所有者
    mapping(uint256 => address) private _tokenOwner;

    // 记录每个 tokenId 的被批准地址（单个授权）
    mapping(uint256 => address) private _tokenApprovals;

    // 记录每个地址拥有的 NFT 数量
    mapping(address => uint256) private _ownedTokensCount;

    // 记录操作员（operator）的批量授权
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // 事件：标准 ERC-721 事件
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev 构造函数
     */
    constructor(string memory _name) {
        name = _name;
    }

    /*****************************
     * ERC-721 核心函数实现
     *****************************/

    /**
     * @dev 查询某地址拥有的 NFT 数量
     */
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return _ownedTokensCount[owner];
    } 

    /**
     * @dev 查询指定 tokenId 的所有者
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _tokenOwner[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }

    /**
     * @dev 授权某个地址操作特定 tokenId
     */
    function approve(address to, uint256 tokenId) public {
       _approve(to, tokenId);
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    /**
     * @dev 查询 tokenId 的被批准地址
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "ERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev 批量授权：允许 operator 代表 owner 操作所有 NFT
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev 查询是否已批量授权
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }


    /**
     * @dev 核心转账逻辑
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _transferFrom(from, to, tokenId);
    }


    function _transferFrom(address from, address to, uint256 tokenId) internal virtual {   
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        // 清除授权
        _approve(address(0), tokenId);
        // 更新余额
        _ownedTokensCount[from] -= 1;
        _ownedTokensCount[to] += 1;
        _tokenOwner[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }


    /**
     * @dev 安全转账（带可选数据）
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransferFrom(from, to, tokenId, _data);
    }

    /**
     * @dev 安全转账（无数据）
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        _safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev 内部安全转账逻辑，检查接收方是否为合约
     */
    function _safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) internal {
        _transferFrom(from, to, tokenId);
        // 检查接收方是否为合约地址，如果是则调用onERC721Received
        require(_checkOnERC721Received(from, to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    /**
     * @dev 检查接收方是否为合约并实现了onERC721Received接口
     */
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        // 如果接收方不是合约地址，则不需要检查
        if (to.code.length == 0) {
            return true;
        }

        // 使用低级.call语法调用接收方合约的onERC721Received函数
        // 这样可以安全地处理合约可能不存在该函数的情况
        (bool success, bytes memory data) = to.call(abi.encodeWithSelector(
            ERC721Receiver.onERC721Received.selector, // 引用外部定义的接口
            msg.sender, from, tokenId, _data
        ));
        
        // 检查调用是否成功且返回值正确
        return success && abi.decode(data, (bytes4)) == ERC721Receiver.onERC721Received.selector; // 引用外部定义的接口
    }
    /*****************************
     * 自定义函数
     *****************************/
    struct SplitAsset {
        uint256 weight;
        uint256 orgTokenID;
    }


     // 定义原始tokenid的最新成交单价
     mapping (uint256 => uint256) public _tokenPrice;
     // newtokenid到份额的映射
     mapping (uint256 => SplitAsset) public _tokenSplitAsset;

    /**
     * @dev 自定义NFT登记函数
     */
    function uploadMint(address to, uint256 tokenId) external {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _tokenOwner[tokenId] = to;
        _ownedTokensCount[to] += 1;
        emit Transfer(address(0), to, tokenId);
        // 使用 keccak256 生成新的 tokenId));
        uint256 newTokenID = uint256(keccak256(abi.encode(tokenId, to)));
        SplitAsset memory a = SplitAsset({weight: 100, orgTokenID: tokenId});
       _tokenOwner[newTokenID] = to;
       _tokenSplitAsset[newTokenID] = a;
    }

    /**
     * @dev 自定义“部分转让”函数
     */
    function partTransferFrom(
        address from,
        address to,
        uint256 orgtokenId,
        uint256 weight,
        uint256 price
    ) external {
        uint256 tokenID = uint256(keccak256(abi.encode(orgtokenId, to)));
        uint256 fromTokenID = uint256(keccak256(abi.encode(orgtokenId, from)));
        require(weight <= 100 && weight > 0, "weight must be between 0 and 100");
        require(_tokenSplitAsset[fromTokenID].weight >= weight);
    
        // 份额调整
        _tokenSplitAsset[tokenID].weight += weight;
        _tokenSplitAsset[tokenID].orgTokenID = orgtokenId;
    
        _tokenSplitAsset[fromTokenID].weight -= weight;
    
        // 如果转移方还有份额则更新，否则清零
        if (_tokenSplitAsset[fromTokenID].weight > 0) {
            _tokenOwner[fromTokenID] = from;
        } else {
            _tokenOwner[fromTokenID] = address(0);
            emit Transfer(from, address(0), fromTokenID);
        }
    
        // 设立新的 tokenId 所有权
        _tokenOwner[tokenID] = to;
        emit Transfer(from, to, tokenID);
    
        // 如果用户持有100份，则获得原始tokenid所有权
        if (_tokenSplitAsset[tokenID].weight == 100) {
            address originalOwner = _tokenOwner[orgtokenId];
            _tokenOwner[orgtokenId] = to;
            emit Transfer(originalOwner, to, orgtokenId);
        }
    
        // 保存最后一次的成交单价
        _tokenPrice[orgtokenId] = price;
    }

    /**
     * @dev 查询拆分 token（示例实现）
     */
    function getSplitToken(uint256 orgTokenID, address owner) external pure returns (uint256) {
        return uint256(keccak256(abi.encode(orgTokenID, owner)));
    }

    /*****************************
     * 内部辅助函数
     *****************************/

    /**
     * @dev 判断调用者是否为所有者或被授权
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /**
     * @dev 判断 tokenId 是否存在（简单实现：检查所有者是否为零地址）
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _tokenOwner[tokenId] != address(0);
    }

    /*****************************
     * ERC-165 接口支持
     *****************************/

    /**
     * @dev ERC-165 接口支持
     * ERC721 接口 ID: 0x80ac58cd
     * ERC165 自身接口: 0x01ffc9a7
     */
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return 
            interfaceId == 0x80ac58cd ||    // ERC721
            interfaceId == 0x01ffc9a7;     // ERC165
    }
}