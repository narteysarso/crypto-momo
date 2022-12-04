function adaptUssdRequest(req = {}) {
    const {
        phoneNumber = "",
        sessionId = "",
        serviceCode = "",
        networkCode ="",
        Operator = "",
        text = ""
    } = req.body;

    return Object.freeze({
        phoneNumber,
        sessionId,
        serviceCode,
        Operator: networkCode || Operator,
        text
    })
}


module.exports = adaptUssdRequest