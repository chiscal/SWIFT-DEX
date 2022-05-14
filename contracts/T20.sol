pragma solidity ^0.8.0;
//SPDX-License-Identifier: Unlicense
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20Contract {
    uint public value;
    constructor(uint _val) {
        value = _val;
    }

    // function stuff(uint _val1, uint _val2) external pure returns(uint) {
    //     return _val1 * _val2;
    // }

    // function name(address token) public view returns(string memory) {
    //     return IERC20Metadata(token).name();
    // }

    // function symbol(address token) public view {
    //     IERC20Metadata(token).symbol();
    // }

    // function decimals(address token) public view returns(uint) {
    //     return IERC20Metadata(token).decimals();
    // }

    // function totalSupply(address token) public view returns(uint){
    //     return IERC20(token).totalSupply();
    // }

    // function balanceOf(address token, address account) public view {
    //     IERC20(token).balanceOf(account);
    // }

    function depo(string memory _str) external payable returns(string memory) {
        return _str;
    }
    function bal() external view returns(uint) {
        return address(this).balance;
    }

    function create() external returns(address) {
        testDeploy addr = new testDeploy();
        return address(addr);
    }
}

contract testDeploy {
    function rev(uint _num) external payable returns(uint) {
        return _num;
    }

    function lance() external view returns(uint, address) {
        return (address(this).balance, address(this));
    }
}