import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 hover:opacity-80 transition duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Smart Calendar
          </span>
        </Link>
        <ul className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive("/dashboard") && location.pathname === "/dashboard"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  Calendar
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/meetings/new"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive("/dashboard/meetings/new")
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  New Meeting
                </Link>
              </li>
         
              <li>
                <Link
                  to="/dashboard/profile"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive("/dashboard/profile")
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  Profile
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 border border-gray-700 hover:border-red-500/50"
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
                  className="px-4 py-2 text-gray-300 hover:text-white transition duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300"
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
