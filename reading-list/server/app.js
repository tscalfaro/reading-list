const express = require("express");
const pool = require("./db");
const cors = require ("cors");
const bcrypt = require ("bcrypt");
const jwt = require ("jsonwebtoken");

const JWT_SECRET = "this_is_my_secret1!"; 

const app = express();

//Middleware
//app.use(cors()); //Allow all requests while debugging
const allowedOrigins = ["http://localhost:5173"];

const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Expect "Bearer <token>"
  
    if (!token) {
      return res.status(401).json({ error: "Access denied" });
    }
  
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified; // Attach user info to the request
      next();
    } catch (err) {
      res.status(403).json({ error: "Invalid token" });
    }
  };
  

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

//Register Route
app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
            [username, email, hashedPassword]
        );

        res.status(201).json({ user: newUser.rows[0] });
    } catch (error) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

//Login Route
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        //check user exist
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("Query result:", user.rows);
        if (!user || user.rows.length === 0){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword){
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        //Generate a jwt for session
        const token = jwt.sign(
            { id: user.rows[0].id, username: user.rows[0].username },
            JWT_SECRET,
            { expiresIn: "4h" } //Default token expiration 4 hours
        );

        res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username }})
    } catch (err) {
        console.error("Error in POST /api/login:", err.message);
        res.status(500).send("Server error");
    }
});

//Route to add new book
app.post("/api/books", async (req, res) => {
    const { title, author, genre, status, thumbnail } = req.body;
    console.log("New book request:", { title, author, genre, status, thumbnail }); //Log incoming book data
    try{
        const newBook = await pool.query(
            "INSERT INTO books (title, author, genre, status, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, author, genre, status, thumbnail]
        );
        console.log("Book added to DB:", newBook.rows[0]); //Log incoming book data
        res.json(newBook.rows[0]);
    } catch (err) {
        console.error("Error in POST /api/books:", err.message);
        res.status(500).send("Server error");
    }
});

//Route to delete books
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

//Route to update books
app.patch("/api/books/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedBook = await pool.query(
            "UPDATE books SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (updatedBook.rowCount === 0) {
            return res.status(400).json({ error: "Book not found" });
        }

        res.json(updatedBook.rows[0]);
    } catch (err) {
        console.error("Error in PATCH /api/books/:id:", err.message);
        res.status(500).send("Server error");
    }
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));