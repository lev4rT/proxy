const Pool = require('pg').Pool;

const db = new Pool({
    user: 'postgres',
    password: 'admin',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
});

module.exports = {db};