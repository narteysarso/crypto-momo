const { InvalidPropertyError } = require("../helpers/errors");
const getAutoYieldContract = require("../helpers/getAutoYieldContract");

const makeXendFinance = () => {

    return Object.freeze({
        depositXAuto,
        withdrawXAuto,
        balance
    })

    function getXAutoContract(token){
        const xAutoContract = getAutoYieldContract(token);

        if(xAutoContract) throw InvalidPropertyError(`${token} is not valid`)

        return xAutoContract;
    }

    async function depositXAuto({token}) {
       
        await getXAutoContract(token)?.deposit();
    }


    async function balance({token,address}){

        await getXAutoContract(token).balanceOf(address);
    }


    async function withdrawXAuto({token, amount}){

        await getXAutoContract(token).withdraw(amount);
    }

}


module.exports = makeXendFinance