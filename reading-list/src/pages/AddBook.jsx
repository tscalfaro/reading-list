import { useState } from "react";
import axios from "axios";

const AddBook = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const searchBooks = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(
                `https://www.googleapis.com/books/v1/volumes`,
                {
                    params: {
                        q: query,
                        key: "AIzaSyCCJy55Zo8Q-yQe6CHhblzyQwmMViIG-YA"
                    },
                }
            );
            setResults(response.data.items || []);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    const handleAddBook = async (book) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token not found in localStorage");
                return;
            }
            const payload = {
                title: book.volumeInfo.title,
                author: book.volumeInfo.authors?.join(", "),
                genre: book.volumeInfo.categories?.[0] || "Unknown",
                status: "backlog",
                thumbnail: book.volumeInfo.imageLinks?.thumbnail || "",
            };
    
            console.log("Token:", token); // Debug token
            console.log("Payload to be sent:", payload); // Debug payload

            const response = await axios.post("http://localhost:5000/api/dashboard", payload, {
                headers: { Authorization: `Bearer ${token}` },
            }
            );
            console.log("Response from server:", response.data); // Debug response
            alert(`Book added: ${response.data.title}`);
        } catch (error) {
            console.error("Error adding book: ", error);
            alert("Failed to add book.")
        }
    };

    return (
        <div>
            <h1>Add a Book</h1>
            <form onSubmit={searchBooks}>
                <input
                    type="text"
                    placeholder="Search for a book..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
            <ul>
                {results.map((book) => (
                    <li key={book.id}>
                        {book.volumeInfo.title} by {book.volumeInfo.authors?.join(", ")}
                        <button onClick={() => handleAddBook(book)}>Add</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AddBook;