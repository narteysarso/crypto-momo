// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
require("dotenv").config();

async function main() {

  const Wallet = await hre.ethers.getContractFactory("Wallet");
  const Factory = await hre.ethers.getContractFactory("ProxyFactory");
  const CryptoMomo = await hre.ethers.getContractFactory("CryptoMomo");

  const deployedWallet = await Wallet.deploy();
  const deployedFactory = await Factory.deploy();
  const deployedCryptoMomo = await CryptoMomo.deploy();

  await deployedWallet.deployed();
  await deployedFactory.deployed();
  await deployedCryptoMomo.deployed();

  await (await deployedFactory.initialize(deployedWallet.address, deployedCryptoMomo.address)).wait();
  
  await (await deployedCryptoMomo.initialize(deployedFactory.address)).wait()

  storeContractData(deployedWallet, "Wallet");
  storeContractData(deployedFactory, "ProxyFactory");
  storeContractData(deployedCryptoMomo, "CryptoMomo");
}

const storeContractData = (contract, contractName) => {
  const fs = require("fs");
  const contractDir = `${__dirname}/../abis`;

  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir);
  }

  const contractArtiacts = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
    contractDir + `/${contractName}.json`,
    JSON.stringify({ address: contract.address, ...contractArtiacts }, null, 2)
  );
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

