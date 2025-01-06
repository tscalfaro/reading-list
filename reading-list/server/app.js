const express = require("express");
const pool = require("./db");
const cors = require ("cors");

const app = express();

//Middleware
//app.use(cors()); //Allow all requests while debugging
const allowedOrigins = ["http://localhost:5173"];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
}));
app.use(express.json()); //Parse JSON request bodies

//Route to get all books
app.get("/api/books", async (req, res) => {
    try{
        const books = await pool.query("SELECT * FROM books");
        res.json(books.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

app.post("/api/books", async (req, res) => {
    const { title, author, genre, status } = req.body;
    console.log("New book request:", { title, author, genre, status }); //Log incoming book data
    try{
        const newBook = await pool.query(
            "INSERT INTO books (title, author, genre, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, author, genre, status]
        );
        console.log("Book added to DB:", newBook.rows[0]); //Log incoming book data
        res.json(newBook.rows[0]);
    } catch (err) {
        console.error("Error in POST /api/books:", err.message);
        res.status(500).send("Server error");
    }
});

app.delete("/api/books/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deleteBook = await pool.query("DELETE FROM books WHERE id = $1 RETURNING *", [id]);

        if (deleteBook.rowCount === 0) {
            return res.status(400).json({error: "Book not found" });
        }

        res.json({ message: "Book deleted successfully", book: deleteBook.rows[0] });
    } catch (err) {
        console.error("Error in DELETE /api/books/:id", err.message);
        res.status(500).send("Server error");
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));