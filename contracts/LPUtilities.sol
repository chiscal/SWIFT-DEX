//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@hip-206/HederaTokenService.sol";
import "@hip-206/HederaResponseCodes.sol";
import "@hip-206/ExpiryHelper.sol";

abstract contract LPUtils is ExpiryHelper {

    using Bits for uint256;

    // create a fungible Token with no custom fees
    // with authority contract is admin key,
    // treasury contract is supply/pause key.
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 decimals,
        address treasury
    ) internal returns (address createdTokenAddress) {
        // instantiate the list of keys used for token creation
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](2);

        // Admin Key is Treasury
        keys[0] = getSingleKey(
            HederaTokenService.ADMIN_KEY_TYPE,
            KeyHelper.CONTRACT_ID_KEY,
            treasury
        );

        // Supply Key is Treasury
        uint256 supplyPauseKeyType = 0;
        // turn on bits corresponding to supply and pause key types
        supplyPauseKeyType = supplyPauseKeyType.setBit(4);
        supplyPauseKeyType = supplyPauseKeyType.setBit(6);
        keys[1] = getSingleKey(supplyPauseKeyType, KeyHelper.CONTRACT_ID_KEY, treasury);

        // IHederaTokenService.HederaToken memory myToken = IHederaTokenService.HederaToken(
        //     name,
        //     symbol,
        //     treasury,
        //     "",
        //     true,
        //     uint32(initialSupply),
        //     false,
        //     keys,
        //     // solhint-disable-next-line
        //     getSecondExpiry(uint32(block.timestamp + 90 * 24 * 60 * 60)) // 90 days
        // );
        IHederaTokenService.HederaToken memory myToken;
        myToken.name = name;
        myToken.symbol = symbol;
        myToken.treasury = treasury;
        myToken.tokenKeys = keys;
        myToken.expiry = getSecondExpiry(uint32(block.timestamp + 90 * 24 * 60 * 60)); // 90 days

        // call HTS precompiled contract
        (int256 responseCode, address token) = HederaTokenService.createFungibleToken(
            myToken,
            initialSupply,
            decimals
        );

        require(responseCode == HederaResponseCodes.SUCCESS, "Error creating token");
        createdTokenAddress = token;
    }

    //Mints more of the collateral token
    function mint(uint64 _amt, address _token) internal {
        (int responseCode, uint64 newTotalSupply, int64[] memory serialNumbers) = HederaTokenService.mintToken(_token, _amt, new bytes[](0));
        if(responseCode != HederaResponseCodes.SUCCESS) {
            revert("Error minting LP tokens");
        }
    }

    //burns more of the collateral token
    function burn(uint64 _amt, address _token) internal {
        (int responseCode, uint64 newTotalSupply) = HederaTokenService.burnToken(_token, _amt, new int64[](0));
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Error Burning LP tokens");
        }
    }

    //this function is used by the exchange contract to transfer tokens
    function transfer(address _token, address _sender, address _receiver, int64 _amt) internal returns(bool) {
        (int responseCode) = HederaTokenService.transferToken(_token, _sender, _receiver, _amt);
        if(responseCode != HederaResponseCodes.SUCCESS) {
            revert("Token Transfer failed");
        }
        return true;
    }
    //used for associating accounts with collateral token
    function associate(address _account, address _token) public returns(bool) {
        int response = HederaTokenService.associateToken(_account, _token);
        if (response != HederaResponseCodes.SUCCESS) {
            revert ("Associate Failed");
        }
        return true;
    }
}

library Bits {
    uint256 internal constant ONE = uint256(1);

    // Sets the bit at the given 'index' in 'self' to '1'.
    // Returns the modified value.
    function setBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self | (ONE << index);
    }
}