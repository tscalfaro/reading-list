import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import PropTypes from "prop-types";

const Dashboard = () => {
    const [books, setBooks] = useState({ backlog: [], reading: [], completed: [] });
    const [isReviewModalOpen, setIsReviewModalOpen] = useState({});
    const [currentReview, setCurrentReview] = useState({ notes: "", rating: 0});

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

    const handleProgressChange = async (bookId, newProgress) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token not found in localStorage");
            }

            const response = await axios.patch(
                `http://localhost:5000/api/dashboard/${bookId}/progress`,
                { progress: newProgress },
                { headers: { Authorization: `Bearer ${token}`} }
            );

            const updatedBook = response.data;
            setBooks((prevBooks) =>
                groupedBooks(
                    [...prevBooks.backlog, ...prevBooks.reading, ...prevBooks.completed].map((book) =>
                        book.id === updatedBook.id ? updatedBook : book
                    )
                )
            );
        } catch (err){
            console.error("Error updating progress: ", err)
        }
    };

    const toggleReviewModal = (bookId) => {
        const book = books.completed.find((book) => book.id === bookId);

        if (!isReviewModalOpen[bookId]){
            //Open modal with current raiting and notes
            setCurrentReview({
                notes: book?.notes || "",
                rating: book?.rating || 0,
            });
        } else {
            //Close modal
            setCurrentReview({ notes: "", rating: 0});
        }

        setIsReviewModalOpen((prev) => ({
            ...prev,
            [bookId]: !prev[bookId],
        }));
    };

    const submitReview = async (bookId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token not found in localStorage");
                return;
            }

            const response = await axios.patch(
                `http://localhost:5000/api/dashboard/${bookId}/review`,
                currentReview,
                { headers: { Authorization: `Bearer ${token}`}}
            );

            const updatedBook = response.data;

            setBooks((prevBooks) => ({
                ...prevBooks,
                completed: prevBooks.completed.map((book) =>
                    book.id === updatedBook.id ? updatedBook : book
                ),
            }));

            toggleReviewModal(bookId);
        } catch (err) {
            console.error("Error submitting review: ", err);
        }
    };
    
    const StarRating = ({rating, setRating}) => {
        const [hoverRating, setHoverRating] = useState(null);

        const handleMouseMove = (e, index) => {
            const rect = e.target.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const fractionalPart = offsetX / rect.width;
            const newRating = Math.min(index + fractionalPart, 5);
            setHoverRating(parseFloat((Math.round(newRating * 4) / 4).toFixed(2)));
        };

        const handleMouseLeave = () => {
            setHoverRating(null);
        };

        const handleClick = (index) => {
            setRating(index);
        };

        return (
            <div className="star-rating" onMouseLeave={handleMouseLeave}>
                {Array.from({ length: 5 }, (_, index) => {
                    const filledStars = hoverRating !== null ? hoverRating : rating;
                    const fullFill = Math.min(1, Math.max(0, filledStars - index));
                    console.log(`Star ${index + 1}: Full Fill = ${fullFill}`);
                    return (
                        <div
                            key={index}
                            className="star-container"
                            onMouseMove={(e) => handleMouseMove(e, index)}
                            onClick={() => handleClick(index + fullFill)}
                            style={{ cursor: "pointer", width: "30px", height: "30px", position: "relative" }}
                        >
                            <FaStar
                                size={30}
                                color="#DDD"
                                style={{ position: "absolute"}}
                            />
                            <FaStar
                                size={30}
                                color="#FFD700"
                                style = {{
                                    position: "absolute",
                                    clipPath: `polygon(0 0, ${fullFill * 100}% 0, ${fullFill * 100}% 100%, 0% 100%)`,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const StarDisplay = ({ rating }) => {
        return (
            <div className="star-display">
                {Array.from({ length: 5 }, (_, index) => {
                    const fullFill = Math.min(1, Math.max(0, rating - index));

                    return (
                        <div
                            key={index}
                            className="star-container"
                            style={{
                                position: "relative",
                                width: "20px",
                                height: "20px",
                                display: "inline-block",
                            }}
                        >
                            <FaStar size={20} color="#DDD" style={{ position: "absolute"}} />
                            <FaStar
                                size={20}
                                color="#FFD700"
                                style={{
                                    position: "absolute",
                                    clipPath: `polygon(0 0, ${fullFill * 100}% 0, ${fullFill * 100}% 100%, 0% 100%)`,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    StarRating.propTypes = {
        rating: PropTypes.number.isRequired,
        setRating: PropTypes.func.isRequired,
    };

    return (
        <div className="dashboard">
            <div className="columns-container">
                <div className="column">
                    <h2>To Be Read ({books.backlog?.length || 0})</h2>
                    {books.backlog?.map((book) => (
                    <div key={book.id} className="book-card">
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <div className="button-group">
                            <button className="book-button" onClick={() => {
                                updateBookStatus(book.id, "reading");
                                handleProgressChange(book.id, 0);
                                }
                            }>Start Reading</button>
                            <button className="book-button" onClick={() => removeBook(book.id)}>Remove</button>
                        </div>
                    </div>
                    ))}
                </div>
                <div className="column">
                    <h2>Reading ({books.reading?.length || 0})</h2>
                    {books.reading?.map((book) => (
                    <div key={book.id} className="book-card">
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <p>Progress: {book.progress || 0}% </p>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={book.progress || 0}
                            onChange={(e) => handleProgressChange(book.id, e.target.value)}
                        />
                        <div className="button-group">
                            <button className="book-button" onClick={() => updateBookStatus(book.id, "completed")}>Mark as Completed</button>
                            <button className="book-button" onClick={() => removeBook(book.id)}>Remove</button>
                        </div>
                    </div>
                    ))}
                </div>
                <div className="column">
                    <h2>Completed ({books.completed?.length || 0})</h2>
                    {books.completed?.map((book) => (
                    <div key={book.id} className="book-card">
                        {book.thumbnail && <img src={book.thumbnail} alt={`${book.title} cover`}/> } 
                        <p>{book.title}</p>
                        <p>{book.author}</p>
                        <StarDisplay rating={book.rating || 0} />
                        <p>Notes: {book.notes || "Add notes"}</p>
                        <button className="book-button" onClick={() => toggleReviewModal(book.id)}>Add/Edit Review</button>

                        {isReviewModalOpen[book.id] && (
                            <div className="review-modal">
                                <textarea
                                    placeholder="Write your review here..."
                                    value={currentReview.notes}
                                    onChange={(e) => setCurrentReview({...currentReview, notes: e.target.value})}
                                />
                                <label>
                                    Rating:
                                    <StarRating
                                        rating={currentReview.rating}
                                        setRating={(newRating) =>
                                            setCurrentReview({ ...currentReview, rating: newRating })
                                        }
                                    />
                                </label>
                                <button className="book-button" onClick={() => submitReview(book.id)}>Submit</button>
                                <button className="book-button" onClick={() => toggleReviewModal(book.id)}>Cancel</button>
                            </div>
                        )}
                        <div className="button-group">
                            <button className="book-button" onClick={() => updateBookStatus(book.id, "backlog")}>Move to Backlog</button>
                            <button className="book-button" onClick={() => removeBook(book.id)}>Remove</button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
            
        </div>
    );
};

export default Dashboard;