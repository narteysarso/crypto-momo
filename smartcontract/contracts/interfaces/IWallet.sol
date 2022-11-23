// SPDX-License-Identifier: MIt

/// @author Nartey Kodjo-Sarso <narteysarso@gmail.com>
pragma solidity ^0.8.15;

interface IWallet {
    function initialize(address, address) external;

    function withdrawToken(
        address _token,
        address _to,
        uint256 _amount
    ) external;
}