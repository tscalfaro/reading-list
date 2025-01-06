import { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
    const [books, setBooks] = useState([]);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/books");
                setBooks(response.data);
            } catch (error) {
                console.error("Error fetching books:", error);
            }
        };

        fetchBooks();
    }, []);

    const removeBook = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/books/${id}`);
            setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
        } catch (error) {
            console.error("Error deleting book: ", error);
        }
    };

    const groupedBooks = books.reduce((acc, book) => {
        acc[book.status] = acc[book.status] || [];
        acc[book.status].push(book);
        return acc;
    }, {});

    return (
        <div>
            <h1>My Reading List</h1>
            {Object.keys(groupedBooks).map((status) => (
                <div key={status}> 
                    <h2>{status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                    <ul>
                        {groupedBooks[status].map((book) => (
                         <li key={book.id}>
                             {book.title} by {book.author}
                            <button onClick={() => removeBook(book.id)}>Remove</button>
                         </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;