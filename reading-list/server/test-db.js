const pool = require("./db");

pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Database connected successfully:", res.rows[0]);
    }
    pool.end();
});