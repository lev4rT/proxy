const Pool = require('pg').Pool;

const db = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'api-db',
    port: 5432,
    database: 'postgres',
});

module.exports = {db};