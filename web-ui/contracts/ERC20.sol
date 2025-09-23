// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowed;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    address private owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value); 

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        owner = msg.sender;
    }

    function mint(address to, uint256 value) public {
        // require(msg.sender == owner, "Only owner can mint");
        _totalSupply += value;
        _balances[to] += value;
        emit Transfer(address(0), to, value);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(_balances[msg.sender] >= value, "Insufficient balance");

        _balances[msg.sender] -= value;
        _balances[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        require(spender != address(0), "Cannot approve to zero address");
        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address ownerAddr, address spender) public view returns (uint256) {
        return _allowed[ownerAddr][spender];
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= value, "Insufficient balance");
        require(_allowed[from][msg.sender] >= value, "Insufficient allowance");

        _balances[from] -= value;
        _balances[to] += value;
        _allowed[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}