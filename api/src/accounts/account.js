const isValidPhonenumber = require("../helpers/is-valid-phonenumber");
const requiredParam = require("../helpers/required-param");
const {InvalidPropertyError} = require("../helpers/errors");

const makeAccount = (
    accountInfo = requiredParam('accountInfo')
) => {

    const validAccount = validateAccount(accountInfo);
    const nomarlizedAccount = normalize(validAccount);

    return Object.freeze(nomarlizedAccount);

    function validateAccount({
        firstname = requiredParam("firstname"),
        lastname = requiredParam("lastname"),
        phonenumber = requiredParam("phonenumber"),
        pin = requiredParam("pin"),
        ...otherInfo
    } = {}){

        validateName("first", firstname);
        validateName("last", lastname);
        validatePhonenumber(phonenumber);
        validatePin(pin);

        return {firstname, lastname, phonenumber, pin, otherInfo};
    }


    function validateName(label, name){
        if(name.length < 2){
            throw new InvalidPropertyError(
                `An account's ${label} name must be at least 2 characters long`
            )
        }
    }


    function validatePin(pin){
        if(pin.length < 4){
            throw new InvalidPropertyError(
                `An account's ${label} name must be at least 4 characters long`
            )
        }
    }

    function validatePhonenumber(phonenumber){
        if(!isValidPhonenumber (phonenumber)){
            throw new InvalidPropertyError(
                `Invalid phone number`
            );
        }
    }


    function normalize ({firstname, lastname, phonenumber, pin, ...otherInfo}) {
        return {
            firstname,
            lastname,
            phonenumber,
            pin,
            ...otherInfo
        }
    }
}

module.exports = makeAccount