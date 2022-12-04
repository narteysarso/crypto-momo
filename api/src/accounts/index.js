const tableland = require("../db/tableland");
const makeAccountLists = require("./account-list");
const makeAccountEndpointHandler = require("./account-endpoint");

const accountList = makeAccountLists({database: tableland});
const accountEndpoint = makeAccountEndpointHandler({accountList});

module.exports = accountEndpoint;
