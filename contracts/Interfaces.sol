//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IExchange {
    function hbarToTokenTranfer(uint64 _minAmt, address _receiver) external payable;
}

interface IFactory {
    function getExchange(address _token) external view returns(address);
}