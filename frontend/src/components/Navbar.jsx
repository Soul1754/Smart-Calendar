import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold hover:text-blue-200 transition duration-200"
        >
          Smart Calendar
        </Link>
        <ul className="flex space-x-6">
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/calendar"
                  className="hover:text-blue-200 transition duration-200"
                >
                  Calendar
                </Link>
              </li>
              <li>
                <Link
                  to="/meetings/new"
                  className="hover:text-blue-200 transition duration-200"
                >
                  New Meeting
                </Link>
              </li>
              <li>
                <Link
                  to="/chatbot"
                  className="hover:text-blue-200 transition duration-200"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="hover:text-blue-200 transition duration-200"
                >
                  Profile
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="hover:text-blue-200 transition duration-200 bg-transparent border-none cursor-pointer font-normal p-0"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  className="hover:text-blue-200 transition duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-blue-200 transition duration-200"
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
