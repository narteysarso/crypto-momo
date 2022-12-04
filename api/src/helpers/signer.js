const ethers = require("ethers");
require("dotenv").config({path: ".env.local"});

const getSigner = () => {
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY);

    const provider = new ethers.providers.AlchemyProvider(
        "maticmum",
        process.env.PROVIDER_KEY
    );

    const signer = wallet.connect(provider);

    return signer;
}

module.exports = getSigner;