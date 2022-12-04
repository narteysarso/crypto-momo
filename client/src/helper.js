import { ethers } from "ethers";
import { CryptoMomoAbi as walletAbi } from "./abis/CryptoMomo";


export const getWalletContract = () => {
    
   const contract = new ethers.Contract(
      walletAbi.address, 
      walletAbi.abi,
      new ethers.providers.Web3Provider(window.ethereum));


   return contract
}

export const getTokenContract = (address, abi) => {
    
   const  contract = new ethers.Contract(address,abi, new ethers.providers.Web3Provider(window.ethereum));

   return contract
}

