import React, { useEffect, useRef, useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

gsap.registerPlugin(ScrollTrigger);

const NavbarModern = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const navbar = navRef.current;

    // Shrink and add backdrop on scroll
    ScrollTrigger.create({
      trigger: document.body,
      start: "top -50",
      end: 99999,
      onEnter: () => {
        gsap.to(navbar, {
          padding: "0.75rem 0",
          backgroundColor: "rgba(10, 14, 39, 0.95)",
          backdropFilter: "blur(16px)",
          duration: 0.3,
          ease: "power2.out",
        });
      },
      onLeaveBack: () => {
        gsap.to(navbar, {
          padding: "1.25rem 0",
          backgroundColor: "rgba(10, 14, 39, 0.3)",
          backdropFilter: "blur(8px)",
          duration: 0.3,
          ease: "power2.out",
        });
      },
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
          isActive
            ? "text-white bg-gradient-to-r from-indigo-600 to-purple-600"
            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/30 transition-all duration-300"
      style={{
        backgroundColor: "rgba(10, 14, 39, 0.3)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold flex items-center gap-2 group"
          >
            <SparklesIcon className="h-7 w-7 text-indigo-400 group-hover:text-purple-400 transition-colors" />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SmartCal
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/calendar">Calendar</NavLink>
                <NavLink to="/meetings/new">New Meeting</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            {isAuthenticated ? (
              <>
                <NavLink to="/calendar">Calendar</NavLink>
                <NavLink to="/meetings/new">New Meeting</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarModern;
