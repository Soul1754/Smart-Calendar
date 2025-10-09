import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { authService } from "../services/api";
import { AuthContext } from "../App";
import gsap from "gsap";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, isAuthenticated, loading]);

  useEffect(() => {
    // Entrance animation
    gsap.from(".register-card", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out",
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Send registration data to backend using the API service
      const data = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Login the user automatically after successful registration
      login(data.token, data.user);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = (provider) => {
    // Redirect to backend OAuth route
    window.location.href = `http://localhost:5001/auth/${provider.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="register-card max-w-md w-full space-y-8 bg-gray-800/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-700/50 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Smart Calendar
            </span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in
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
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-900/50 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>
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
                className="appearance-none relative block w-full px-4 py-3 bg-gray-900/50 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-900/50 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 bg-gray-900/50 border border-gray-700 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
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
              <span className="px-2 bg-gray-800/50 text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthRegister("Google")}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-700 rounded-xl bg-gray-900/50 text-sm font-medium text-gray-300 hover:bg-gray-900 hover:border-indigo-500/50 transition-all duration-300"
            >
              <span>Google</span>
            </button>
            <button
              onClick={() => handleOAuthRegister("Microsoft")}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-700 rounded-xl bg-gray-900/50 text-sm font-medium text-gray-300 hover:bg-gray-900 hover:border-indigo-500/50 transition-all duration-300"
            >
              <span>Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
