const express = require("express");
const pool = require("./db");
const cors = require ("cors");

const app = express();

//Middleware
app.use(cors({ origin: "http://localhost:5137" })); //Allow only requests from Vite frontend while developing
app.use(express.json()); //Parse JSON request bodies

//Route to get all books
app.get("/api/books", async (req, res) => {
    try{
        const books = await pool.query("SELECT * FROM books");
        res.join(books.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

app.post("/api/books", async (req, res) => {
    const { title, author, genre, status } = req.body;

    try{
        console.log("New book request:", { title, author, genre, status }); //Log incoming book data
        const newBook = await pool.query(
            "INSERT INTO books (title, author, genre, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, author, genre, status]
        );
        res.json(newBook.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));