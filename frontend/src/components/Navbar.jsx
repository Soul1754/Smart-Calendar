import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { AuthContext } from "../App";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <CalendarIcon className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-blue-600">
            Smart Calendar
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            to="/calendar"
            className="text-gray-700 hover:text-blue-600 transition duration-200"
          >
            Calendar
          </Link>
          <Link
            to="/meetings"
            className="text-gray-700 hover:text-blue-600 transition duration-200"
          >
            Meetings
          </Link>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition duration-200"
            >
              <UserCircleIcon className="h-6 w-6" />
              <span>{user?.name || "Profile"}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
