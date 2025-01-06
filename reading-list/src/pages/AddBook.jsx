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

    const handleAddBook = (book) => {
        console.log("Selected Book:", book); // Placeholder until database is ready to save selected book
    }

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
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AddBook;