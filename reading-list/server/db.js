const { Pool } = require("pg");

const pool = new Pool({
    user: "reading_user",
    host: "localhost",
    database: "reading_list",
    password: "password123",
    port: 5432,
});

module.exports = pool;