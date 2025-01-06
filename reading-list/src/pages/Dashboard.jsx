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

    const updateBookStatus = async (id, newStatus) => {
        try {
            const response = await axios.patch(`http://localhost:5000/api/books/${id}`, { status: newStatus });
            setBooks((prevBooks) =>
                prevBooks.map((book) =>
                    book.id === id ? { ...book, status: response.data.status } : book
                )
            );
        } catch (error) {
            console.error("Error updating book status:", error);
        }
    };

    const removeBook = async (id) => {
        if (window.confirm("Are you sure you want to delete this book?")){
            try {
                await axios.delete(`http://localhost:5000/api/books/${id}`);
                setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
            } catch (error) {
                console.error("Error deleting book: ", error);
            }
        } 
    };

    const groupedBooks = books.reduce((acc, book) => {
        if (!acc[book.status]){
            acc[book.status].push(book);
        }
        acc[book.status].push(book);
        return acc;
    }, { backlog: [], reading: [], completed: [] });

    return (
        <div>
            <h1>My Library</h1>
            <div className="columns">
                {["backlog", "reading", "completed"].map((status) => (
                    <div key={status} className="column">
                        <h2>
                            {status === "backlog" ? "To Be Read" : status.charAt(0).toUpperCase() + status.slice(1)}
                        </h2>
                        {groupedBooks[status].map((book) => (
                            <div key={book.id} className="book-card">
                                {book.thumbnail && (
                                    <img src={book.thumbnail} alt={`${book.title} cover`} className="book-cover" />
                                )}
                                <p>
                                    {book.title} by {book.author}
                                </p>
                                <select
                                    value={book.status}
                                    onChange={(e) => updateBookStatus(book.id, e.target.value)}
                                >
                                    <option value="backlog">To Be Read</option>
                                    <option value="reading">Reading</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <button onClick={() => removeBook(book.id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;