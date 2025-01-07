import { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
    const [books, setBooks] = useState({ backlog: [], reading: [], completed: [] });

    useEffect(() => {
        console.log("Updated books state:", books);
    }, [books]);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("Token not found in localStorage");
                    return;
                  }

                const response = await axios.get("http://localhost:5000/api/dashboard", {
                    headers: { Authorization: `Bearer ${token}`},
                });
                console.log("API response for books:", response.data);
                const grouped = response.data.reduce(
                    (acc, book) => {
                        acc[book.status] = acc[book.status] || [];
                        acc[book.status].push(book);
                        return acc;
                    },
                    { backlog: [], reading: [], completed: [] }
                );
                console.log("Grouped books ", grouped);
                setBooks(grouped);
                console.log("Grouped books:", groupedBooks(response.data));
            } catch (error) {
                console.error("Error fetching books:", error);
            }
        };

        fetchBooks();
    }, []);

    const updateBookStatus = async (bookId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token not found in localStorage");
                return;
              }

            const response = await axios.patch(`http://localhost:5000/api/dashboard/${bookId}`,  
                {status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}`},
                }
            );
            const updatedBook = response.data;
            setBooks((prevBooks) => groupedBooks([...prevBooks.backlog, ...prevBooks.reading, ...prevBooks.completed].map((book) =>
                book.id === updatedBook.id ? updatedBook : book
            )));
        } catch (error) {
            console.error("Error updating book status:", error);
        }
    };

    const removeBook = async (bookId) => {
        if (window.confirm("Are you sure you want to delete this book?")){
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("Token not found in localStorage");
                    return;
                }
                await axios.delete(`http://localhost:5000/api/dashboard/${bookId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setBooks((prevBooks) =>
                    groupedBooks([...prevBooks.backlog, ...prevBooks.reading, ...prevBooks.completed].filter((book) => book.id !== bookId))
                  );
            } catch (error) {
                console.error("Error deleting book: ", error);
            }
        } 
    };

    const groupedBooks = (allBooks) => {
        return allBooks.reduce(
          (acc, book) => {
            acc[book.status] = acc[book.status] || [];
            acc[book.status].push(book);
            return acc;
          },
          { backlog: [], reading: [], completed: [] }
        );
      };

    
    return (
        <div className="dashboard">
            <div className="columns-container">
                <div className="column">
                    <h2>To Be Read</h2>
                    {books.backlog?.map((book) => (
                    <div key={book.id}>
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <button onClick={() => updateBookStatus(book.id, "reading")}>Start Reading</button>
                        <button onClick={() => removeBook(book.id)}>Remove</button>
                    </div>
                    ))}
                </div>
                <div className="column">
                    <h2>Reading</h2>
                    {console.log("Books in reading:", books.reading)}
                    {books.reading?.map((book) => (
                    <div key={book.id}>
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <button onClick={() => updateBookStatus(book.id, "completed")}>Mark as Completed</button>
                        <button onClick={() => removeBook(book.id)}>Remove</button>
                    </div>
                    ))}
                </div>
                <div className="column">
                    <h2>Completed</h2>
                    {books.completed?.map((book) => (
                    <div key={book.id}>
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <button onClick={() => updateBookStatus(book.id, "backlog")}>Move to Backlog</button>
                        <button onClick={() => removeBook(book.id)}>Remove</button>
                    </div>
                    ))}
                </div>
            </div>
            
        </div>
    );
};

export default Dashboard;