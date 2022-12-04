const ethers = require("ethers");

const parseUnits = (amount, unit) => ethers.utils.parseUnits(amount, unit);

const formatUnits = (amount, unit) => ethers.utils.formatUnits(amount, unit);

module.exports = {
    parseUnits,
    formatUnits
}