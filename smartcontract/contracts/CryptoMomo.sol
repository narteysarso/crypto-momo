// SPDX-License-Identifier: MIT

// @author Nartey Kodjo-Sarso <narteysarso@gmail>
pragma solidity >=0.8.15;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import "./interfaces/IWallet.sol";
import "./proxies/Proxy.sol";
import "./proxies/ProxyFactory.sol";

error WalletAlreadyCreated();
error WalletCreationFailed();
error WalletDoesNotExists();
error TransferFailed();

contract CryptoMomo is
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    EIP712Upgradeable
{
    using ECDSAUpgradeable for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    address factoryAddress;

    bytes32 private constant _TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)"
        );

    mapping(address => uint256) private _nonces;

    modifier isValidAccount(string calldata phonenumberOrUUID) {
        address wallet = addressOfPhonenumber(phonenumberOrUUID);
        if (!_checkContract(wallet)) {
            revert WalletDoesNotExists();
        }
        _;
    }

    function initialize(address _factoryAddress) public initializer {
        __Pausable_init();
        __Ownable_init();
        __EIP712_init("CryptoMomoForwarder", "0.0.1");
        factoryAddress = _factoryAddress;
    }

    function createOrClaimWallet(
        string calldata phonenumberOrUUID
    ) external onlyOwner whenNotPaused returns (address wallet) {
        address constantAddress = addressOfPhonenumber(phonenumberOrUUID);
        if (_checkContract(constantAddress)) revert WalletAlreadyCreated();

        wallet = ProxyFactory(factoryAddress).newWallet(phonenumberOrUUID);
    }

    /**
     * @param phonenumberOrUUID unique phonenumber or uuid
     */
    function addressOfPhonenumber(
        string calldata phonenumberOrUUID
    ) public view whenNotPaused returns (address) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                factoryAddress,
                                keccak256(abi.encodePacked(phonenumberOrUUID)),
                                keccak256(type(Proxy).creationCode)
                            )
                        )
                    )
                )
            );
    }

    /**
     * Checks if an `addr` is a smartcontract or not
     * @param addr address to check
     * @return bool true if addr is a smartcontract false others
     */
    function _checkContract(address addr) internal view returns (bool) {
        bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        bytes32 codehash;
        assembly {
            codehash := extcodehash(addr)
        }
        return (codehash != 0x0 && codehash != accountHash);
    }

    function balanceOf(
        string calldata phonenumberOrUUID,
        address token
    ) external view onlyOwner isValidAccount(phonenumberOrUUID) returns (uint) {
        address wallet = addressOfPhonenumber(phonenumberOrUUID);

        uint amount = IWallet(wallet).balance(token);

        return amount;
    }

    function approveAddress(
        string calldata phonenumberOrUUID,
        address recipient,
        address token,
        uint amount
    ) external onlyOwner isValidAccount(phonenumberOrUUID) returns (bool) {
        address wallet = addressOfPhonenumber(phonenumberOrUUID);

        return IWallet(wallet).approve(token, recipient, amount);
    }

    function approvePhonenumber(
        string calldata phonenumberOrUUID,
        string calldata recipientPhonenumberOrUUID,
        address token,
        uint amount
    )
        external
        onlyOwner
        isValidAccount(phonenumberOrUUID)
        isValidAccount(recipientPhonenumberOrUUID)
        returns (bool)
    {
        address wallet = addressOfPhonenumber(phonenumberOrUUID);
        address recipient = addressOfPhonenumber(recipientPhonenumberOrUUID);

        return IWallet(wallet).approve(token, recipient, amount);
    }

    function safeTransferToAccount(
        string calldata fromPhonenumberOrUUID,
        string calldata toPhonenumberOrUUID,
        address token,
        uint256 amount
    )
        external
        onlyOwner
        whenNotPaused
        isValidAccount(fromPhonenumberOrUUID)
        returns (bool)
    {
        address toWallet = addressOfPhonenumber(toPhonenumberOrUUID);
        address fromWallet = addressOfPhonenumber(fromPhonenumberOrUUID);

        if (!_checkContract(toWallet)) {
            toWallet = ProxyFactory(factoryAddress).newWallet(
                toPhonenumberOrUUID
            );
        }

        bool success = IWallet(fromWallet).withdrawToken(
            token,
            toWallet,
            amount
        );

        if (!success) revert TransferFailed();

        return success;
    }

    function transferToAddress(
        string calldata fromPhonenumberOrUUID,
        address _to,
        address token,
        uint256 amount
    )
        external
        onlyOwner
        whenNotPaused
        isValidAccount(fromPhonenumberOrUUID)
        returns (bool)
    {
        address fromWallet = addressOfPhonenumber(fromPhonenumberOrUUID);

        bool success = IWallet(fromWallet).withdrawToken(token, _to, amount);

        if (!success) revert TransferFailed();

        return success;
    }

    // Handle Meta transactions
    function _verifySignature(
        ForwardRequest memory req,
        bytes memory signature
    ) internal view returns (address) {
        address signer = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    _TYPEHASH,
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    keccak256(req.data)
                )
            )
        ).recover(signature);

        return signer;
    }

    function verify(
        ForwardRequest memory _req,
        bytes memory _signature
    ) public view returns (bool) {
        address signer = _verifySignature(_req, _signature);

        if (_req.from != signer) return false;

        return true;
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function execute(
        ForwardRequest memory _req,
        bytes memory _signature
    ) public payable returns (bool, bytes memory) {
        require(
            verify(_req, _signature),
            "PaysliceForwarder: signature does not match request"
        );

        _nonces[_req.from] = _req.nonce + 1;

        (bool success, bytes memory returndata) = _req.to.call{
            gas: _req.gas,
            value: _req.value
        }(abi.encodePacked(_req.data, _req.from));

        // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.limo/blog/ethereum-gas-dangers/
        if (gasleft() <= _req.gas / 63) {
            // We explicitly trigger invalid opcode to consume all gas and bubble-up the effects, since
            // neither revert or assert consume all gas since Solidity 0.8.0
            // https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require
            /// @solidity memory-safe-assembly
            assembly {
                invalid()
            }
        }

        return (success, returndata);
    }
}
