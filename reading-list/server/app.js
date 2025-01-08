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
  
//app.use("/api/dashboard", authenticateToken);

app.use((req, res, next) => {
    //console.log(`Request Headers:`, req.headers);
    next();
});

/*
origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
*/
app.use(cors({
    origin: "http://localhost:5173", // Add your frontend origin
    credentials: true,              // Allow cookies and Authorization headers
    allowedHeaders: ["Authorization", "Content-Type"], // Explicitly allow headers
})); 
app.use(express.json()); //Parse JSON request bodies

app.get("/api/dashboard", authenticateToken, async (req, res) => {
    try {
      // Fetch all books for the authenticated user
      const books = await pool.query("SELECT * FROM books WHERE user_id = $1", [req.user.id]);
  
      res.json(books.rows);
    } catch (err) {
      console.error("Error in GET /api/dashboard:", err.message);
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
        console.error(error.message);
        res.status(500).send("Server error");
    }
});

//Login Route
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        //check user exist
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (!user || user.rows.length === 0){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword){
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        console.log("Token: ", validPassword);
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
app.post("/api/dashboard", authenticateToken, async (req, res) => {
    const { title, author, genre, status, thumbnail } = req.body;
    console.log("New book request:", { title, author, genre, status, thumbnail }); //Log incoming book data
    try{
        const newBook = await pool.query(
            "INSERT INTO books (title, author, genre, status, thumbnail, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [title, author, genre, status, thumbnail, req.user.id]
        );

        res.status(201).json(newBook.rows[0]);
    } catch (err) {
        console.error("Error in POST /api/dashboard:", err.message);
        res.status(500).send("Server error");
    }
});

//Route to delete books
app.delete("/api/dashboard/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deleteBook = await pool.query("DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.id]);

        if (deleteBook.rowCount === 0) {
            return res.status(400).json({error: "Book not found" });
        }

        res.json({ message: "Book deleted successfully", book: deleteBook.rows[0] });
    } catch (err) {
        console.error("Error in DELETE /api/dashboard/:id", err.message);
        res.status(500).send("Server error");
    }
});

//Route to update books
app.patch("/api/dashboard/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedBook = await pool.query(
            "UPDATE books SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *",
            [status, id, req.user.id]
        );

        if (updatedBook.rowCount === 0) {
            return res.status(400).json({ error: "Book not found" });
        }

        res.json(updatedBook.rows[0]);
    } catch (err) {
        console.error("Error in PATCH /api/dashboard/:id:", err.message);
        res.status(500).send("Server error");
    }
});

//Route to update reading progress for book
app.patch("/api/dashboard/:id/progress", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    try {
        const updatedBook = await pool.query(
            "UPDATE books SET progress = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
            [progress, id, req.user.id]
        );

        if (updatedBook.rows.length === 0){
            return res.status(404).json({ message: "Book not found or unauthorized"});
        }

        res.json(updatedBook.rows[0]);
    } catch (err) {
        console.error("Error updating progress: ", err.message);
        res.status(500).send("Server error");
    }
});

//Route to update review for book
app.patch("/api/dashboard/:id/review", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { notes, rating } = req.body;

    //validate rating
    if (rating % 0.25 !== 0 || rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating. Must be 0-5 in increments of .25"});
    }

    try {
        const updatedBook = await pool.query(
            "UPDATE books SET notes = $1, rating = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
            [notes, rating, id, req.user.id]
        );

        if (updatedBook.rows.length === 0){
            return res.status(404).json({message: "Book not found or unauthorized"});
        }

        res.json(updatedBook.rows[0]);
    } catch (err) {
        console.error("Error updating review: ", err.message);
        res.status(500).send("Server error");
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));