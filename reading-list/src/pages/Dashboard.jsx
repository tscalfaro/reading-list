import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import PropTypes from "prop-types";

const Dashboard = () => {
    const [books, setBooks] = useState({ backlog: [], reading: [], completed: [] });
    const [modalState, setModalState] = useState({
        isOpen: false,
        bookId: null,
    });
    const [currentReview, setCurrentReview] = useState({ notes: "", rating: 0});
    const [searchQuery, setSearchQuery] = useState("");
    const [genreFilter, setGenreFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    //Debugging log
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

            const bookToUpdate = Object.values(books).flat().find((book) => book.id === bookId);

            if(!bookToUpdate){
                console.error("Book not found");
                return;
            }

            const payload = {
                status: newStatus,
                progress: 0,
            };

            const response = await axios.patch(`http://localhost:5000/api/dashboard/${bookId}`,  
                payload,
                {
                    headers: { Authorization: `Bearer ${token}`},
                }
            );
            const updatedBook = response.data;
            setBooks((prevBooks) => groupedBooks([...prevBooks.backlog, ...prevBooks.reading, ...prevBooks.completed].map((book) =>
                book.id === updatedBook.id ? { ...book, ...updatedBook} : book
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

    const filterBooks = (books) => {
        const searchLower = searchQuery.toLowerCase();
        return books
            .filter(
                (book) =>
                (searchQuery === "" ||
                    book.title.toLowerCase().includes(searchLower) ||
                    book.author.toLowerCase().includes(searchLower)) &&
                    (genreFilter === "" || book.genre === genreFilter) &&
                    (statusFilter === "" || book.status === statusFilter)
            );
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
                `http://localhost:5000/api/dashboard/${bookId}`,
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
        setModalState((prevState) => ({
            isOpen: !prevState.isOpen,
            bookId,
        }));
    };

    const submitReview = async (bookId, review) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token not found in localStorage");
                return;
            }

            const response = await axios.patch(
                `http://localhost:5000/api/dashboard/${bookId}`,
                { notes: review.notes, rating: review.rating },
                { headers: { Authorization: `Bearer ${token}`}}
            );

            const updatedBook = response.data;

            setBooks((prevBooks) => ({
                ...prevBooks,
                completed: prevBooks.completed.map((book) =>
                    book.id === updatedBook.id ? updatedBook : book
                ),
            }));

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
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                >
                    <option value="">All Genres</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Non-fiction">Non-fiction</option>
                    <option value="Mystery">Mystery</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="backlog">To Be Read</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div className="columns-container">
                {["backlog", "reading", "completed"].map((status) => (
                    <div key={status} className="column">
                        <h2>
                            {status === "backlog"
                                ? "To Be Read"
                                : status.charAt(0).toUpperCase() + status.slice(1)
                            }
                        </h2>
                        {filterBooks(books[status] || []).map((book) => (
                            <div key={book.id} className="book-card">
                                {book.thumbnail && (
                                    <img
                                        src={book.thumbnail}
                                        alt={`${book.title} cover`}
                                        className="book-cover"
                                    />
                                )}
                                <p>{book.title}</p>
                                <p>{book.author}</p>
                                {status === "reading" && (
                                    <div className="progress-bar-container">
                                        <label htmlFor={`progress-${book.id}`}>Progress:</label>
                                        <input
                                            type="range"
                                            id={`progress-${book.id}`}
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={book.progress || 0}
                                            onChange={(e) => handleProgressChange(book.id, e.target.value)}
                                        />
                                        <span>{book.progress || 0}%</span>
                                    </div>
                                )}

                                {status === "completed" && (
                                    <div className="star-rating-container">
                                        <StarDisplay rating={book.rating || 0} />
                                        <div>
                                            {book.notes ? (
                                                <p>{book.notes}</p>
                                            ) : (
                                                <p style={{ fontStyle: "italic"}}>Add a Review</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="button-group">
                                    
                                    <button
                                        className="book-button"
                                        onClick={() => removeBook(book.id)}
                                    >
                                        Remove
                                    </button>
                                    {status === "completed" && (
                                        <button
                                        className="book-button"
                                        onClick={() => toggleReviewModal(book.id) }
                                        >
                                            Edit Review
                                        </button>
                                    )}
                                    <select
                                        value={book.status}
                                        onChange={(e) => updateBookStatus(book.id, e.target.value)}
                                    >
                                        <option value="reading">Reading</option>
                                        <option value="backlog">To Be Read</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                {status === "completed" && modalState.bookId === book.id && modalState.isOpen && (
                                        <div className="modal">
                                            <div className="modal-content">
                                                <h2>Edit Review</h2>
                                                <div className="star-rating-container">
                                                    <StarRating 
                                                    rating={currentReview.rating || 0} 
                                                    setRating={(newRating) => {
                                                        setBooks((prevBooks) =>
                                                            groupedBooks(
                                                                [...prevBooks.backlog, ...prevBooks.reading, ...prevBooks.completed].map((b) =>
                                                                    b.id === modalState.bookId ? { ...b, rating: newRating } : b
                                                                )
                                                            )
                                                        );
                                                        setCurrentReview((prevReview) => ({
                                                            ...prevReview,
                                                            rating: newRating,
                                                        }));
                                                    }}
                                                    />
                                                </div>
                                                <textarea 
                                                    placeholder="Write your review here..."
                                                    value={currentReview.notes}
                                                    onChange = {(e) => setCurrentReview((prevReview) => ({
                                                        ...prevReview,
                                                        notes: e.target.value,
                                                        
                                                    }))}
                                                    
                                                ></textarea>
                                                <div className="button-group">
                                                    <button onClick={() => {
                                                        submitReview(book.id, currentReview);
                                                        toggleReviewModal(book.id)
                                                        
                                                        }}>Submit</button>
                                                    <button onClick={() => toggleReviewModal(book.id)}>Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ))}   
                </div>
             ))}
            </div>
        </div>
    );
};

/**
 *                   */
export default Dashboard;