const { ethers } = require("ethers");
const { AUTO_YIELD_ABI } = require("../constants");
const getSigner = require("./signer");


module.exports = (token) => {

    if (!AUTO_YIELD_ABI[token]) return null;

    const contract = new ethers.Contract(AUTO_YIELD_ABI[token].address, AUTO_YIELD_ABI[token].abi);

    const signer = getSigner();

    const contractWithSigner = contract.connect(signer);

    return contractWithSigner;
}