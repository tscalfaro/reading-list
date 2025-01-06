import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-gray-800 p-4 text-white">
            <ul className='flex space-x-4'>
                <li><Link to="/" className='hover:underline'>Dashboard</Link></li>
                <li><Link to="/add-book" className='hover:underline'>Add Book</Link></li>
            </ul>
        </nav>
    )
}

export default Navbar;