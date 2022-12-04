const getSigner = require("./signer");
const walletAbi = require("../abis/CryptoMomo.json");
const ethers = require("ethers");

const getWalletContract = () => {
    
   const  contract = new ethers.Contract(walletAbi.address, walletAbi.abi);

   const signer = getSigner();

   const contractWithSigner = contract.connect(signer);

   return contractWithSigner;
}

module.exports = getWalletContract;