//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./LPUtilities.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@hip-206/HederaResponseCodes.sol";
import "@hip-206/HederaTokenService.sol";
import "./safeMaths/safeInt64.sol";
import "./safeMaths/safeUint64.sol";
import "./safeMaths/safeUint.sol";
import "./Interfaces.sol";

contract Exchange is LPUtils {

    address public token;//the exchange token
    address factory;//the address of the factory deploying this contract
    address LPTokenAddr;//the address of the LP token
    uint private unlocked = 1;
    int64 private MAX_INT = (2 ** 63) - 1;//this is the max int64 value to avoid overflow

    event AddLiquidity(address indexed addr, address indexed _token, uint64 TokenAmt, uint HbarAmt, uint time);
    event RemoveLiquidity(address indexed addr, address indexed _token, uint64 TokenAmt, uint HbarAmt, uint time);
    event Swap(address user, address _tokenaddr, uint64 _token, uint hbarAmt, uint time);

    function createT() private returns(address){
        (address createdTokenAddress) = createToken(string(abi.encodePacked("SWIFT DEX ", rname() , " HBar LP share")), string(abi.encodePacked(rsym(),"HBAR")), 0, 8, address(this));
        return createdTokenAddress;
    }

    constructor(address _token) payable {
        token = _token;
        factory = msg.sender;
        LPTokenAddr = createT();
    }

    //this is a lock modifier to prevent re-entrancy
    modifier lock() {
        require(unlocked == 1, "Transaction in progress");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function rname() view private returns(string memory){
        return IERC20Metadata(token).name();
    }

    function rsym() view private returns(string memory){
        return IERC20Metadata(token).symbol();
    }

    //returns the total supply of the collateral token
    function _tokenSupply() public view returns(uint){
        return IERC20(LPTokenAddr).totalSupply();
    }

    //returns the token balance of this contract
    function getTokenReserve() public view returns(uint) {
        return IERC20(token).balanceOf(address(this));
    }

    //returns the hbar balance of this contract
    function getHbarReserve() public view returns(uint) {
        return address(this).balance;
    }

    //this function calculates the amount of token or hbar to be recieved based on the parameters passed
    function _getAmount(uint _inputAmt, uint _inputReserve, uint _outputReserve) private pure returns(uint) {
        uint feeAmt = _inputAmt * 997;
        uint numerator = feeAmt * _outputReserve;
        uint inputRHaxed = _inputReserve * 1000;
        uint denominator = inputRHaxed + feeAmt;
        return numerator / denominator;
    }

    //this function allows users to add liquidity and gives them a collateral for their liquidity
    function addLiquidity(int64 _amt) external lock payable returns(uint64) {
        require(_amt <= MAX_INT, "Amount Overflow");
        require(_amt >  0, "invalid Amount");
        uint64 liq;
        if (getTokenReserve() == 0) {
            bool result = transfer(token, msg.sender, address(this), _amt);
            require(result == true, "Adding Liquidity Failed");
            uint liquidity = msg.value;
            mint(uint64(liquidity), LPTokenAddr);
            bool res = transfer(LPTokenAddr, address(this), msg.sender, int64(uint64(liquidity)));
            require(res == true, "Transfer Failed");
            liq = uint64(liquidity);
        } else {
            uint hbarReserve = address(this).balance - msg.value;
            uint tokenAmt = (msg.value * getTokenReserve()) / hbarReserve;
            require(uint64(_amt)> uint64(tokenAmt), "less than required");
            bool result = transfer(token, msg.sender, address(this), _amt);
            require(result == true, "Adding Liquidity Failed");
            uint liquidity = (_tokenSupply() * msg.value) / hbarReserve;
            mint(uint64(liquidity), LPTokenAddr);
            bool res = transfer(LPTokenAddr, address(this), msg.sender, int64(uint64(liquidity)));
            require(res == true, "Transfer Failed");
            liq = uint64(liquidity);
        }
        emit AddLiquidity(msg.sender, token, uint64(_amt), msg.value, block.timestamp);
        return liq;
    }
    //this function allows users to redeem liquidity by depositing their collateral
    function removeLiquidity(int64 _amt) external lock returns(uint64, uint64) {
        require(_amt <= MAX_INT, "Amount Overflow");
        require(_amt > 0, "invalid amount");
        uint tokenReserve = getTokenReserve();
        uint swiftSup = _tokenSupply();
        uint hbarRes = address(this).balance;
        uint hbarAmt = (hbarRes * (uint(uint64(_amt)))) / swiftSup;
        int64 tokenAmt =  (int64(uint64(tokenReserve)) * (_amt)) / int64(uint64(swiftSup));
        bool Tx = transfer(LPTokenAddr, msg.sender, address(this), _amt);
        require(Tx == true, "Remove Liquidity Failed");
        burn(uint64(_amt), LPTokenAddr);
        payable(msg.sender).transfer(hbarAmt);
        bool result = transfer(token, address(this), msg.sender, tokenAmt);
        require(result == true, "Remove Liquidity Failed");
        emit RemoveLiquidity(msg.sender, token, uint64(tokenAmt), hbarAmt, block.timestamp);
        return(uint64(hbarAmt), uint64(tokenAmt));
    }

    //this function returns the hbar amount based on the token amount passed in.
    function getHbar(int64 _tokenSold) public view returns(uint) {
        require(_tokenSold > 0, "invalid amount");
        require(_tokenSold <= MAX_INT, "Amount Overflow");
        uint tokenReserve = getTokenReserve();
        return _getAmount(uint(uint64(_tokenSold)), tokenReserve, address(this).balance);
    }

    //this function returns the token amount based of the amount of hbar passed in.
    function getToken(uint _hbarSold) public view returns(uint64) {
        require(_hbarSold > 0, "invalid amount");
        uint tokenReserve = getTokenReserve();
        uint hbarRes = getHbarReserve();
        uint tamt = _getAmount(_hbarSold, hbarRes, tokenReserve);
        return uint64(tamt);
    }

    //this function swaps hbar to token
    function hbarTotoken(int64 _minAmt, address _recipient) private returns(uint) {
        require(_minAmt <= MAX_INT, "Amount Overflow");
        uint tokenReserve = getTokenReserve();
        uint64 tokensBought = uint64(_getAmount(msg.value ,address(this).balance - msg.value, tokenReserve));

        require(tokensBought >= uint64(_minAmt)); 
        bool result = transfer(token, address(this), _recipient, int64(tokensBought));
        require(result == true, "swap failed");
        emit Swap(msg.sender, token, tokensBought, msg.value, block.timestamp);
        return tokensBought;
    }

    function hbarTotokenSwap(int64 _minAmt) public lock payable returns(uint){
        return hbarTotoken(_minAmt, msg.sender);
    }

    //this function swaps token to hbar
    function tokenTohbar(int64 _tokenSold, uint _hbarMin) public lock returns(uint) {
        require(_tokenSold > 0, "invalid Amount");
        require(_tokenSold <= MAX_INT, "Amount Overflow");
        uint hbarAmt = getHbar(_tokenSold);

        require(hbarAmt >= _hbarMin);
        bool result = transfer(token, msg.sender, address(this), _tokenSold);
        require(result == true, "swap failed");
        payable(msg.sender).transfer(hbarAmt);
        return hbarAmt;
    }

    function hbarToTokenTranfer(uint64 _minAmt, address _receiver) public lock payable returns(uint){
        return hbarTotoken(int64(_minAmt), _receiver);
    }

    //this function enables swap between token to token
    function TokenToToken(address _token, int64 _tokenSold, int64 _minAmt) lock external {
        require(_tokenSold <= MAX_INT, "Amount Overflow");
        require(_minAmt <= MAX_INT, "Amount Overflow");
        address ex_address = IFactory(factory).getExchange(_token);
        require(ex_address != address(this) && ex_address != address(0), "token to token swap failed");
        require(_tokenSold > 0,"invalid amount");

        uint hbarAmt = getHbar(_tokenSold);
        bool result = transfer(token, msg.sender, address(this), _tokenSold);//swaps deposited token to hbar
        require(result == true, "swap failed");
        IExchange(ex_address).hbarToTokenTranfer{value: hbarAmt}(uint64(_minAmt), tx.origin);//contract swaps hbar to token on behalf of the user ands sends to users address
    }

    //associate the contract to a token
    function associateContract(address _token) external returns(bool){
        int response = HederaTokenService.associateToken(address(this), _token);
        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Associate Failed");
        }
        return true;
    }
    
    //this function is used to associate accounts with the Liquidty pool token
    function associateAcct(address _acct) external returns(bool) {
        return associate(_acct, LPTokenAddr);
    }

    //this function is used to accounts with the Exchange token pair
    function associateToken(address _acct) external returns(bool) {
        return associate(_acct, token);
    }
}
