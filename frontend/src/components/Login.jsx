import React, { useState, useEffect, useContext } from "react";
import { Link, Route, useNavigate } from "react-router-dom";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { authService } from "../services/api";
import { AuthContext } from "../App";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Check if user is already logged in
  const { isAuthenticated, loading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if we're authenticated and not in a loading state
    if (isAuthenticated && !loading) {
      navigate("/", { replace: true });
    }
  }, [navigate, isAuthenticated, loading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await authService.login(formData);

      // Use the login function from AuthContext
      login(data.token, data.user);

      // Redirect to home page
      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    // Redirect to backend OAuth route
    window.location.href = `http://localhost:5001/auth/${provider.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-gray-900 p-10 rounded-2xl shadow-2xl border border-indigo-500/30 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            
              <Link to="/">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Smart Calendar
                </span>
              </Link>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sign in to Smart Calendar
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 bg-gray-800 border-gray-700 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthLogin("Google")}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-700 rounded-xl bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:border-indigo-500/50 transition-all duration-300"
            >
              <span>Google</span>
            </button>
            <button
              onClick={() => handleOAuthLogin("Microsoft")}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-700 rounded-xl bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:border-indigo-500/50 transition-all duration-300"
            >
              <span>Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
