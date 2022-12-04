const { InvalidPropertyError, RequiredParameterError, UniqueContantError } = require("../helpers/errors");
const makeAccount = require("./account");
const makeHttpError = require("../helpers/http-error");

function makeAccountEndpointHandler({ accountList }) {
    return async function handle(httpRequest) {
        switch (httpRequest.method) {
            case 'POST':
                return postAccount(httpRequest);

            case 'GET':
                return getAccounts(httpRequest);

            default:
                return makeHttpError({
                    statusCode: 405,
                    errorMessage: `${httpRequest.method} method not allowed.`
                })
        }
    }

    async function getAccounts(httpRequest){
        const {id, phonenumber} = httpRequest.pathParams || {};
        const {offset, limit} = httpRequest.queryParams || {};

        const result = id ? await accountList.findById({accountId: id}) : phonenumber ? await accountList.findByPhonenumber({phonenumber}) : await accountList.findAll({offset, limit});

        return {
            headers: {
                "Content-Type": "application/json"
            },
            statusCode: 200,
            data: JSON.stringify(result)
        }
    }

    async function postAccount(httpRequest) {

        let accountInfo = httpRequest.body;
        if (!accountInfo) return makeHttpError({
            statusCode: 400,
            errorMessage: "Bad request. No POST body"
        })

        if (typeof httpRequest.body === 'string') {
            try {
                accountInfo = JSON.parse(accountInfo);
            } catch (error) {
                return makeHttpError({
                    statusCode: 400,
                    errorMessage: "Bad request. POST body must be valid JSON"
                })
            }
        }

        try {
            const account = makeAccount(accountInfo);
            const result = await accountList.add(account);

            //TODO: create wallet

            return {
                headers: {
                    "Content-Type": "application/json"
                },
                statusCode: 201,
                data: JSON.stringify(result)
            }
        } catch (error) {
            return makeHttpError ({
                errorMessage: error.message,
                statusCode:
                    error instanceof UniqueContantError ?
                        409 : error instanceof InvalidPropertyError || error instanceof RequiredParameterError
                            ? 400 : 500
            })
        }

    }

    async function putAccount(httpRequest) {

        let accountInfo = httpRequest.body;
        if (!accountInfo) return makeHttpError({
            statusCode: 400,
            errorMessage: "Bad request. No POST body"
        })

        if (typeof httpRequest.body === 'string') {
            try {
                accountInfo = JSON.parse(accountInfo);
            } catch (error) {
                return makeHttpError({
                    statusCode: 400,
                    errorMessage: "Bad request. PUT body must be valid JSON"
                })
            }
        }

        try {
            const account = makeAccount(accountInfo);
            const result = await accountList.update(account);

            return {
                headers: {
                    "Content-Type": "application/json"
                },
                statusCode: 201,
                data: JSON.stringify(result)
            }
        } catch (error) {
            return makeHttpError ({
                errorMessage: error.message,
                statusCode:
                    error instanceof UniqueContantError ?
                        409 : error instanceof InvalidPropertyError || error instanceof RequiredParameterError
                            ? 400 : 500
            })
        }

    }
}

module.exports = makeAccountEndpointHandler