require("dotenv").config({path: ".env.local"});
const { connect, resultsToObjects } = require("@tableland/sdk");

const tableland = async ({signer}) => {

    let connection = null;
    let tablename = null;

    const tableNamePrefix = process.env.TABLELAND_TABLENAME;

    if (connection) {
        return connection;
    }

    connection = await connect({ signer, network: process.env.TABLELAND_NETWORK, chain: process.env.TABLELAND_CHAIN });

    const { name: _tablename } = await getTable(connection, tableNamePrefix);

    if (!_tablename) {
        throw Error("Table does not exists");
    }

    tablename = _tablename;

    async function getTable(connection, tablename){
        const tables = await connection.list();

        const tableExists = Object.values(tables).filter(({ name }) =>
            name.includes(tablename)
        );

        // Create a table if not exists
        if (!tableExists.length) {
            // using text because int(24) and bigint(64) are not sufficient for uint256
            console.log('creating table')
            const resp = await connection.create(
                `
                id text,
                firstname text, 
                lastname text, 
                phonenumber text,
                pin text,
                UNIQUE(phonenumber),
                PRIMARY KEY(id)
                `,
                {
                    prefix: tablename
                }
                
            );

            console.log('Table Created');

            return resp;
        }

        return tableExists[0];
    };

    const insert = async ({ accountId, firstname, lastname, phonenumber, pinHash }) => {
        return await connection.write(
            `INSERT INTO ${tablename} VALUES ('${accountId}','${firstname}','${lastname}','${phonenumber}','${pinHash}')`
        )
    }

    const find = async ({ query = "" }) => {
        const readRes = await connection.read(
            `SELECT * FROM ${tablename} ${query}`
        );
        const result = resultsToObjects(readRes);
        return result;
    }

    const findAll = async ({offset = 0, limit = 50}) => {
        const readRes = await connection.read(
            `SELECT * FROM ${tablename} LIMIT ${limit}`
        );
        const result = resultsToObjects(readRes);
        return result;
    }

    const findById = async ({ id }) => {
        const results = await find({ query: `where id = '${id}' ` })
        return results[0];
    }

    const findByPhonenumber = async ({ phonenumber }) => {
        const results = await find({ query: `WHERE phonenumber = '${phonenumber}' ` });
        return results[0];
    }

    const update = async ({ id, ...updateInfo }) => {

        const values = Object.keys(updateInfo).reduce((accumulator, key) => {
            return accumulator += `${key}=${updateInfo[key]},`
        }, "");

        const results = await connection.write(
            `UPDATE ${tablename} SET ${values} WHERE id = ${id}`
        );

        return results;
    }

    const remove = async ({ id }) => {
        const results = await connection.write(
            `DELETE FROM ${tablename} WHERE id = ${id}`
        );
        return results;
    }

    const getConnection = () => connection;

    return Object.freeze({
        getConnection,
        insert,
        findById,
        findByPhonenumber,
        find,
        findAll,
        update,
        remove
    })
}

module.exports = tableland;