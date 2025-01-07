import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem("token");

    const handleLogout = () => {
        localStorage.removeItem("token");
        alert("You have been logged out.");
        navigate("/login");
    };

    return (
        <nav className="navbar bg-gray-800 text-white p-4">
            <div className='navbar-container max-w-screen-xl mx-auto flex justify-between items-center'>
                <ul className='navbar-links flex space-x-4'>
                    {!isLoggedIn ? (
                        <>
                            <li>
                                <Link to="/login" className='hover:underline'>Login</Link>
                            </li>
                            <li>
                                <Link to="/register" className='hover:underline'>Register</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/dashboard" className='hover:underline'>Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/add-book" className='hover:underline'>Add Book</Link>
                            </li>
                            <li>
                                <button onClick={handleLogout} className='hover:underline'>Logout</button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;