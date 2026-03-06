import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { isValidEmail } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!isValidEmail(formData.email))
      newErrors.email = "Enter a valid email";

    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex 
      bg-gradient-to-br 
      from-gray-100 via-gray-200 to-gray-100 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      {/* 🌙 THEME TOGGLE BUTTON */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl 
        bg-white/80 dark:bg-gray-800/80 
        backdrop-blur-md border border-gray-300 dark:border-gray-600
        shadow-md hover:shadow-lg transition-all duration-300 
        hover:scale-105"
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5 text-gray-700" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
      </button>

      {/* LEFT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 relative">
        <div className="hidden lg:block absolute right-0 top-0 h-full w-px bg-gray-300 dark:bg-gray-700"></div>

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Saral Tech
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manufacturing Intelligence Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl 
            shadow-xl border border-gray-200 dark:border-gray-700">

            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
              Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg border bg-gray-50 
                  dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
                  ${errors.email
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                    }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-gray-50 
                  dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition
                  ${errors.password
                      ? "border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>


              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white 
                bg-indigo-600 hover:bg-indigo-700 
                shadow-md hover:shadow-lg transition duration-200"
              >
                {loading ? <LoadingSpinner size="sm" /> : "Login"}
              </button>

            </form>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
            Saral Tech Dashboard v1.0
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      {/* RIGHT PANEL */}
<div className="hidden lg:flex w-1/2 items-center justify-center 
  bg-gradient-to-br from-gray-50 to-gray-100 
  dark:from-gray-900 dark:to-gray-800 
  border-l border-gray-200 dark:border-gray-700 
  p-12">

  <div className="max-w-md w-full bg-white dark:bg-gray-800 
    rounded-2xl shadow-xl 
    border border-gray-200 dark:border-gray-700 
    p-10 text-center transition-all">

    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
      Need Help Signing In?
    </h2>

    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
      Don’t have an account or facing login issues?
      Our support team is here to help you quickly.
    </p>

    {/* Contact Section */}
    <div className="space-y-6">

      {/* Email */}
      <div className="bg-gray-50 dark:bg-gray-700 
        rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Email Support
        </p>
        <a
          href="mailto:info@saraltech.in"
          className="block text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          info@saraltech.in
        </a>
        <a
          href="mailto:info@aploslogix.in"
          className="block text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          info@aploslogix.in
        </a>
      </div>

      {/* WhatsApp */}
      <div className="bg-gray-50 dark:bg-gray-700 
        rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
          WhatsApp Support
        </p>
        <a
          href="https://wa.me/917081493932"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 dark:text-green-400 font-medium hover:underline"
        >
          +91 1234567890
        </a>
      </div>

      {/* Office Hours */}
      <div className="bg-gray-50 dark:bg-gray-700 
        rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Office Hours
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          9:00 AM – 9:00 PM (IST)
        </p>
      </div>

    </div>

    <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
      We typically respond within business hours.
    </p>

  </div>
</div>
    </div>
  );
};

export default LoginPage;