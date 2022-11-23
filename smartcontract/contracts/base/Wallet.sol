// SPDX-License-Identifier: MIT
// @author: Nartey Kodjo-Sarso <narteysarso@gmail.com>
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


error InvalidTokenAddress();
error TransferFailed();
error InvalidWalletAddress();

contract Wallet {
    
    function version() public pure returns (string memory ){
        return "0.0.1";
    }

    function balance(address _token) public view returns (uint256) {
        // return native currency balance if `_token` is address(0)
        if (_token == address(0)) {
            return address(this).balance;
        }

        return IERC20(_token).balanceOf(address(this));
    }

    function withdrawToken(
        address _token,
        address _to,
        uint256 _amount
    ) public {
        if (_token == address(0)) revert InvalidTokenAddress();

        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", _to, _amount)
        );

        if (!success || (data.length != 0 && abi.decode(data, (bool))))
            revert TransferFailed();
    }

    function withdrawNativeToken(
        address _to,
        uint _amount
    ) public {
        if(_to == address(0)) revert InvalidWalletAddress();

        (bool success, ) = _to.call{value: _amount}("");

        if(!success) revert TransferFailed();
    }

    receive() external payable {}

    fallback() external payable {}
}
