require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path: ".env.local"});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: process.env.ENDPOINT,
      accounts: [process.env.ACCOUNT_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_KEY
    }
  }
};
