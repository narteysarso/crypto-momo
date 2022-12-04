const crypto = require("crypto");
const bcrypt = require('bcrypt');
require("dotenv").config({path: ".env.local"});

const getSigner = require('../helpers/signer');

function makeAccountLists({database}){

    const signer = getSigner();

    return Object.freeze({
        add,
        authenticate,
        findByPhonenumber,
        findById,
        findAll,
        remove,
        update
    });


    async function add({accountId, pin, ...accountInfo}){
        const db = await database({signer});
        
        if(!accountId){
            accountInfo.accountId = crypto.randomUUID();
        }
        
        const pinHash = await bcrypt.hash(pin, parseInt(process.env.SALT_ROUND));
        
        accountInfo.pinHash = pinHash;

        const result = await db.insert(accountInfo);

        return result;
    }

    async function findById({accountId}){
        const db = await database({signer});
        
        const result = await db.findById({id: accountId});

        return result;
    }

    async function findByPhonenumber({phonenumber}){
        const db = await database({signer});
        
        const result = await db.findByPhonenumber({phonenumber});

        return result;
    }

    async function findAll({offset, limit}){
        const db = await database({signer});
        
        const result = await db.findAll({offset,limit});

        return result;
    }

    async function remove({accountId}){
        const db = await database({signer});
        
        const result = await db.remove(accountId);

        return result;
    }


    async function update({accountId, ... accountInfo}){
        const db = await database({signer});
        
        const result = await db.update(accountId, accountInfo);

        return result;
    }

    async function authenticate({phonenumber, pin}){
        const account = await findByPhonenumber({phonenumber});

        if(!account) throw Error("Account not found");

        const validity = await bcrypt.compare(pin, account.pin);

        return validity;
    }

}

module.exports = makeAccountLists