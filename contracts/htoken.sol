//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@hip-206/HederaTokenService.sol";
import "@hip-206/HederaResponseCodes.sol";
import "@hip-206/IHederaTokenService.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@hip-206/ExpiryHelper.sol";
import "./abs.sol";

contract Factory {
    function tdep(address _adr) external payable returns(address){
        HTOKEN addr = new HTOKEN{value: msg.value}(_adr);
        return address(addr);
    }
}
contract HTOKEN is TokenCreate {
    // create a fungible Token with no custom fees
    // with authority contract is admin key,
    // treasury contract is supply/pause key
    uint public hbarbal = address(this).balance;
    string public testval = "this is value";
    address public token;
    uint public balance;
    address testt;
    address public valuedaddrs;

    function rname() view public returns(string memory){
        return IERC20Metadata(testt).name();
    }

    function rsym() view public returns(string memory){
        return IERC20Metadata(testt).symbol();
    }

    function tsup() view public returns(uint) {
        return IERC20(testt).totalSupply();
    }

    function createT() private returns(address){
        (address createdTokenAddress) = createToken(string(abi.encodePacked("SWIFT DEX ", rname() , " HBar Collateral")), string(abi.encodePacked(rsym()," HBAR")), 0, 8, address(this));
        token = createdTokenAddress;
        balance = address(this).balance;
        return createdTokenAddress;
    }

    constructor(address _t) payable {
        testt = _t;
        valuedaddrs = createT();
    }

    // function host() external payable returns(address, uint) {
    //     (address addr, uint bal) = createT();
    //     return(addr, bal);
    // }

    function getbal() external view returns(uint) {
        return tsup();
    }
}