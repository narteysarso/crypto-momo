const makeMenu = require("./ussd");
const makeWalletList = require("../wallets/wallet-list");
const makeAccountLists = require("../accounts/account-list");
const tableland = require("../db/tableland");

const walletList = makeWalletList();
const accountList = makeAccountLists({database: tableland});

const ussdMenu = makeMenu({walletList, accountList});

module.exports = {
    ussdMenu
}