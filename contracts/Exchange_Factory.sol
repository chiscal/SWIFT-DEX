//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Exchange.sol";

contract Factory {
    mapping (address => address) public ExchangeAddresses;
    address[] public addresses;

    //this function is used to create a pair
    function createExchange(address _token) external payable {
        require(_token != address(0), "invalid token address");
        require(ExchangeAddresses[_token] == address(0), "Exchange Exist");

        Exchange ex_change = new Exchange{value: msg.value}(_token);
        ExchangeAddresses[_token] = address(ex_change);
        addresses.push(_token);
    }
    //this function returns the exchange contract address of a given pair
    function getExchange(address _token) external view returns(address) {
        return ExchangeAddresses[_token];
    }

    //returns a list of all pairs
    function Exchange_Addresses() external view returns(address [] memory) {
        return addresses;
    }
    //returns a total of all pairs
    function Exchanges() external view returns(uint) {
        return addresses.length;
    }
}