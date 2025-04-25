import React, { useState, useEffect, createContext, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { authService } from "./services/api";

// Components
import Layout from "./components/Layout";
import Home from "./components/Home";
import Calendar from "./components/Calendar";
import Meetings from "./components/Meetings";
import NewMeeting from "./components/NewMeeting";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";
import RequireAuth from "./components/RequireAuth";

// Create auth context
export const AuthContext = createContext();

// Auth provider component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");

    if (token) {
      // Verify token and get current user data
      const verifyAuth = async () => {
        try {
          const { user: userData } = await authService.getCurrentUser();
          setIsAuthenticated(true);
          setUser(userData);
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } finally {
          setLoading(false);
        }
      };

      verifyAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Login function - wrapped in useCallback to prevent recreation on every render
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  // Logout function - also wrapped in useCallback for consistency
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  // Token handler for OAuth redirects
  const TokenHandler = () => {
    const location = useLocation();
    const { login } = React.useContext(AuthContext);

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (token) {
        // Get user data from token
        const userData = JSON.parse(atob(token.split(".")[1]));
        // Check if token payload contains Google OAuth information
        const hasGoogleCalendar = userData.googleAccessToken ? true : false;
        login(token, {
          id: userData.id,
          email: userData.email,
          hasGoogleCalendar,
        });
        window.history.replaceState({}, document.title, "/");
      }
    }, [location, login]);

    return null;
  };

  // Using the imported RequireAuth component from above

  return (
    <AuthProvider>
      <BrowserRouter>
        <TokenHandler />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="meetings/new" element={<NewMeeting />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
