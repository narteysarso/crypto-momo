// SPDX-License-Identifier: MIT

/// @author Nartey Kodjo-Sarso <narteysarso@gmail.com>
pragma solidity >=0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./ProxyFactory.sol";

contract Proxy is Initializable {
    address public factoryAddress;
    /// @dev that this contract has not data stored in it
    /// keccak("MASTER_COPY_ADDRESS") => 0x542716ccde0a3fd74601ae4bfa898139e782bb572a8d2efa9b3bd9b79d5a240c
    bytes32 constant MASTER_COPY_ADDRESS =
        0x542716ccde0a3fd74601ae4bfa898139e782bb572a8d2efa9b3bd9b79d5a240c;

    /// @dev Allows you
    function initialize(address _mastercopy, address _factoryAddress) initializer public {
        require(_mastercopy != address(0), "Invalid mastercopy address");
        factoryAddress = _factoryAddress;
        assembly {
            sstore(MASTER_COPY_ADDRESS, _mastercopy)
        }
    }

        /**
        
        */
    function _delegatecall() internal {
        /// @notice this can be made more flexible by using openzeppelin roles contract
        require(ProxyFactory(factoryAddress).callerAddress() == msg.sender, "Invalid caller");
        
        assembly {
            // Create new stack slot reserved for _mastercopy variable
            // Assign 32 word with address _mastercopy (left-padded with zeros)
            let _mastercopy := and(
                sload(MASTER_COPY_ADDRESS),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            )

            /// @dev delegate call params: delegate(gas, address, argOffset_of_calldata, calldatasize, return_data_Offset, return_data_size)
            /// @dev calldata represents the current execution context in memory
            /// @dev returndatasize - returns the data size of the output of the previous call in memory
            calldatacopy(0x0, 0x0, calldatasize())
            let success := delegatecall(
                gas(),
                _mastercopy,
                0,
                calldatasize(),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            if eq(success, 0) {
                revert(0, returndatasize())
            }

            return(0, returndatasize())
        }
    }

    /// @dev Fallback function only forwards calls to `mastercopy`
    fallback() external payable {
        _delegatecall();
    }
}
