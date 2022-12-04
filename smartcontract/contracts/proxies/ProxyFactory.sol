// SPDX-License-Identifier: MIT

/// @author Nartey Kodjo-Sarso <narteysarso@gmail.com>
pragma solidity >=0.8.15;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./Proxy.sol";
import "../interfaces/IWallet.sol";

error ZeroAddress();
error InvalidPhoneNumberOrUUID();
///@dev  Proxy factory
contract ProxyFactory is Initializable,PausableUpgradeable, OwnableUpgradeable {
    address mastercopy;
    address public callerAddress;

    address[] public allWallets;

    event WalletCreated(address indexed wallet, string phoneNumber, uint index);
    event MastercopyUpdated(address indexed oldMastercopy, address indexed newMastercopy);

     function initialize(address _mastercopy, address _callerAddress) initializer public {
        __Pausable_init();
        __Ownable_init();
        mastercopy = _mastercopy;
        callerAddress = _callerAddress;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function updateMastercopy (address _mastercopy) external onlyOwner {
        if(_mastercopy != address(0)) revert ZeroAddress();

        address old = mastercopy;

        mastercopy = _mastercopy;

        emit MastercopyUpdated(old, _mastercopy);
    }

    function newWallet(string memory phoneNumberOrUuid) external whenNotPaused returns (address wallet) {
        require(msg.sender == callerAddress);
        if(bytes(phoneNumberOrUuid).length < 12) revert InvalidPhoneNumberOrUUID();
        bytes memory bytecode = type(Proxy).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(phoneNumberOrUuid));

        assembly{
            wallet := create2(0, add(bytecode, 32), mload(bytecode), salt )
        }

        IWallet(wallet).initialize(mastercopy, address(this));
        allWallets.push(wallet);

        emit WalletCreated(wallet, phoneNumberOrUuid, allWallets.length);
    }
    
    
}