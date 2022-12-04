require("dotenv").config({ path: ".env.local" });

const UssdMenu = require('ussd-builder');
const { TOKENS, TOKENKEY, AUTO_YIELD_ABI } = require("../constants");
const { parseUnits, formatUnits } = require("../helpers/utils");

const Africatalking = require("africastalking")({
    username: "sandbox",
    apiKey: process.env.AFRICASTALKING_API_KEY,
});

const makeMenu = ({ walletList, accountList, xendList } = {}) => {
    const sms = Africatalking.SMS

    let menu = new UssdMenu();

    const authenticate = (message, nextState, failState) => {
        return ({
            run: () => {
                menu.con(message || 'Enter your pin:')
            },
            next: {
                // using regex to match user input to next state
                '*\\d{4,}': async () => {

                    const authenticated = await accountList.authenticate({ phonenumber: menu.args.phoneNumber, pin: menu.val });

                    if (!authenticated) return failState;

                    return nextState;
                }
            }
        })
    }

    menu.startState({
        run: () => {
            // use menu.con() to send response without terminating session      
            menu.con('Welcome. Choose option:' +
                '\n1. Create or Claim Account' +
                '\n2. Get Wallet address' +
                '\n3. Check balance' +
                '\n4. Send Crypto' +
                '\n5. Savings(Xend.fi)' +
                '\n6. Buy Crypto'
            );
        },

        next: {
            '1': async () => {
                const result = await accountList.findByPhonenumber({ phonenumber: menu.args.phoneNumber });
                if (result) return "createOrClaimAccount.authenticate";

                return "createOrClaimAccount.firstname"
            },
            '2': 'getAccountWalletAddress',
            '3': 'getTokenBalance.selectToken',
            '4': 'sendCrypto.selectToken',
            '5': 'savings.tokens'
        }
    });

    menu.state("savings.tokens", {
        run: () => {
            menu.con('Select Token:' +
                '\n1. USDT' +
                '\n2. USDC'

            );
        },
        next: {
            "*[1-2]": "savings.list"
        }
    })

    menu.state("savings.list", {
        run: () => {
            menu.con('Saving options:' +
                '\n1. Check Balance' +
                '\n2. Deposit' +
                '\n3. Withdraw'
            );
        },
        next: {
            // using regex to match user input to next state
            '1': 'savings.balance',
            '2': 'savings.deposit',
            '3': 'savings.withdraw'
        }
    });

    menu.state("savings.balance", {
        run: async () => {
            const [, , selectNumber,] = menu.args.text.split("*");
            const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];

            const address = await walletList.getWalletAddress({ phonenumber: menu.args.phoneNumber });
            const balance = await xendList.balance(tokenKey, address);

            menu.end(`Savings balance is ${balance} ${tokenKey}`)
        }
    });

    menu.state("savings.deposit", {
        run: () => {
            menu.con('Enter amount');
        },
        next: {
            // using regex to match user input to next state
            '*\\d': 'savings.enterAmount'
        }
    });

    menu.state('savings.authenticate', authenticate("", "savings.save", "savings.authenticateFailed"));
    menu.state('savings.authenticateFailed', authenticate("Incorrect pin. Try again", "savings.save", "savings.authenticateFailed"));

    menu.state("savings.save", {
        run: async () => {
            const [, , selectNumber, , _amount] = menu.args.text.split("*");
            const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];
            const token = TOKENS[tokenKey];

            if (!token) menu.end("Incorrect token specified");

            const amount = parseUnits(_amount, token.decimals)

            const balance = await walletList.balanceOf({ phonenumber: menu.args.phoneNumber, token: token.address });

            const recipientAddress = AUTO_YIELD_ABI[tokenKey].address;

            if (!recipientAddress) menu.end("Wrong token selected");
            if (!balance.gt(amount)) menu.end(`Insufficient balance for ${tokenKey}`);

            menu.end("Deposit is processing");

            await walletList.approveAddress({
                phonenumber: menu.args.phoneNumber.trim(),
                recipientAddress,
                token: token.address.trim(),
                amount
            });

            await xendList.deposit({ token: tokenKey, amount });

        }
    })


    menu.state('sendCrypto.selectToken', {
        run: () => {
            menu.con(
                'Select Token:\n' + TOKENKEY.reduce((acc, val, idx) => acc + `${idx + 1}: ${val} \n`, "")
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\d': 'sendCrypto.enterAmount'
        }
    });

    menu.state('sendCrypto.enterAmount', {
        run: () => {
            menu.con('Enter amount:');
        },
        next: {
            // using regex to match user input to next state
            '*\\d+': 'sendCrypto.recipientNumber'
        }
    });

    menu.state('sendCrypto.recipientNumber', {
        run: () => {
            menu.con(
                'Enter recipient full phonenumber (no spaces)'
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\+\\d{1,3}\\d{9}': 'sendCrypto.repeatNumber'
        }
    });

    menu.state('sendCrypto.repeatNumber', {
        run: () => {
            menu.con(
                'Enter repeat phonenumber'
            );
        },
        next: {
            // using regex to match user input to next state
            '*\\+\\d{1,3}\\d{9}': async () => {
                const [, , , phonenumber] = menu.args.text.split("*");
                if (menu.val != phonenumber) return 'sendCrypto.repeatNumber';

                return 'sendCrypto.authenticate';
            }
        }
    });

    menu.state('sendCrypto.authenticate', authenticate("", "sendCrypto.amount", "sendCrypto.authenticateFailed"));
    menu.state('sendCrypto.authenticateFailed', authenticate("Incorrect pin. Try again", "sendCrypto.amount", "sendCrypto.authenticateFailed"));

    menu.state('sendCrypto.amount', {
        run: async () => {
            const [, selectNumber, _amount, recipientPhonenumber] = menu.args.text.split("*");
            const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];
            const token = TOKENS[tokenKey];

            if (!token) menu.end("Incorrect token specified");

            if (recipientPhonenumber === menu.args.phoneNumber) menu.end("Invalid recipient phone number")

            const amount = parseUnits(_amount, token.decimals)

            const balance = await walletList.balanceOf({ phonenumber: menu.args.phoneNumber, token: token.address });

            if (!balance.gt(amount)) menu.end(`Insufficient balance for ${tokenKey}`);

            menu.end("Transfer is processing");

            await walletList.transferTokensToAccount({
                fromPhonenumber: menu.args.phoneNumber.trim(),
                toPhonenumber: recipientPhonenumber.trim(),
                token: token.address.trim(),
                amount
            });
        }
    });

    menu.state('getTokenBalance.selectToken', {
        run: () => {
            menu.con(
                'Select Token:\n' + TOKENKEY.reduce((acc, val, idx) => acc + `${idx + 1}: ${val} \n`, "")
            );
        },
        next: {
            '*\\d': 'getTokenBalance.balance'
        }
    });


    menu.state('getTokenBalance.autheticate', authenticate("", "getTokenBalance.balance", "getTokenBalance.autheticateFailed"));

    menu.state('getTokenBalance.autheticateFailed', authenticate("Incorrect pin. Try again", "getTokenBalance.balance", "getTokenBalance.autheticateFailed"));

    menu.state('getTokenBalance.balance', {
        run: async () => {
            const [, selectNumber,] = menu.args.text.split("*");
            const tokenKey = TOKENKEY[parseInt(selectNumber) - 1];

            const token = TOKENS[tokenKey];

            if (!token) menu.end("Incorrect token specified");

            const balance = await walletList.balanceOf({ phonenumber: menu.args.phoneNumber, token: token.address });

            const amount = formatUnits(balance, token.decimals);

            menu.end(`Balance is ${amount} ${tokenKey}`);

        }
    });

    menu.state('getAccountWalletAddress', {
        run: async () => {
            const result = await walletList.getWalletAddress({ phonenumber: menu.args.phoneNumber });
            menu.end(`Account wallet address is ${result}`);

        }
    });

    menu.state('createOrClaimAccount.firstname', {
        run: () => {
            menu.con('Enter your firstname:')
        },
        next: {
            // using regex to match user input to next state
            '*[a-zA-Z_0-9\-]{2,}': 'createOrClaimAccount.lastname'
        }
    });

    menu.state('createOrClaimAccount.lastname', {
        run: () => {
            menu.con('Enter your lastname:')

        },
        next: {
            // using regex to match user input to next state
            '*[a-zA-Z_0-9\-]{2,}': 'createOrClaimAccount.enterPin'
        }
    });

    menu.state('createOrClaimAccount.enterPin', {
        run: () => {
            menu.con('Enter your pin (at least 4 characters):')

        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': 'createOrClaimAccount.confirmPin'
        }
    });

    menu.state('createOrClaimAccount.confirmPin', {
        run: () => {
            menu.con('Enter your pin again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': () => {
                [, , , pin] = menu.args.text.split("*");
                console.log(pin, menu.val, pin !== menu.val)
                if (pin !== menu.val) return "createOrClaimAccount.pinsDontMatch";

                return "createOrClaimAccount.register";
            }
        }
    });

    menu.state('createOrClaimAccount.pinsDontMatch', {
        run: () => {
            menu.con('Pins do not match. Confirm pin again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': () => {
                [, , , pin,] = menu.args.text.split("*");
                if (pin !== menu.val) return "createOrClaimAccount.pinsDontMatch";

                return "createOrClaimAccount.register";
            }
        }
    });

    menu.state('createOrClaimAccount.authenticate', {
        run: () => {
            menu.con('Enter your pin:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': async () => {

                const authenticated = await accountList.authenticate({ phonenumber: menu.args.phoneNumber, pin: menu.val });

                if (!authenticated) return "createOrClaimAccount.authenticationFailed";

                return "createOrClaimAccount.createWalletOnly";
            }
        }
    });

    menu.state('createOrClaimAccount.authenticationFailed', {
        run: () => {
            menu.con('Invalid Pin. Try again:')
        },
        next: {
            // using regex to match user input to next state
            '*\\d{4,}': async () => {

                const authenticated = await accountList.authenticate({ phonenumber: menu.args.phoneNumber, pin: menu.val });

                if (!authenticated) return "createOrClaimAccount.authenticationFailed";

                return "createOrClaimAccount.createWalletOnly";
            }
        }
    });

    menu.state('createOrClaimAccount.register', {
        run: async () => {
            menu.end('Account is registered successfully.');
            [, firstname, lastname, pin,] = menu.args.text.split("*");
            console.log("inserting to database")
            const dbRes = await accountList.add({ pin, firstname, lastname, phonenumber: menu.args.phoneNumber });
            console.log(dbRes);
            console.log("inserting to blockchain")
            const walletRes = await walletList.createOrClaimWallet({ phonenumber: menu.args.phoneNumber });
            console.log(walletRes);
        }
    });

    menu.state('createOrClaimAccount.createWalletOnly', {
        run: async () => {
            menu.end('Account is registered successfully.');

            const walletRes = await walletList.createOrClaimWallet({ phonenumber: menu.args.phoneNumber });

        }
    });

    menu.state('buyAirtime', {
        run: () => {
            menu.con('Enter amount:');
        },
        next: {
            // using regex to match user input to next state
            '*\\d+': 'buyAirtime.amount'
        }
    });

    // nesting states
    menu.state('buyAirtime.amount', {
        run: () => {
            // use menu.val to access user input value
            var amount = Number(menu.val);
            buyAirtime(menu.args.phoneNumber, amount).then((res) => {
                menu.end('Airtime bought successfully.');
            });
        }
    });

    return menu;

}

module.exports = makeMenu