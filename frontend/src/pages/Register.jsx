import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";


export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    confirmPassword: "",
    // role is automatically 'student'
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");


    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }


    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await api.post("/api/users/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "student",
      });

      setSuccess("Registration successful! Please login.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect to server");

    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SECTION */}
      <div className="w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex flex-col justify-center">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
          <span className="text-2xl">💼</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">
          AI Job Recommendation System
        </h1>

        <p className="text-blue-100 mb-6 max-w-md">
          Join our AI-powered job recommendation platform built for students and admins.
        </p>

        <ul className="space-y-3 mb-8">
          <li>✔ Personalized job recommendations</li>
          <li>✔ AI-powered career matching</li>
          <li>✔ Track application progress</li>
          <li>✔ Connect with top employers</li>
        </ul>

        <div className="bg-white/10 p-4 rounded-xl w-72">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
            alt="career"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-2">Create Account</h2>
          <p className="text-gray-500 mb-6">
            Join our AI-powered job recommendation platform
          </p>

          <label className="text-sm font-medium">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="w-full border rounded px-3 py-2 mt-1 mb-3"
          />

          <label className="text-sm font-medium">Email Address</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="student@example.com"
            className="w-full border rounded px-3 py-2 mt-1 mb-3"
          />

          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            className="w-full border rounded px-3 py-2 mt-1 mb-3"
          />

          <label className="text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className="w-full border rounded px-3 py-2 mt-1 mb-3"
          />

          {/* Role selection removed - Defaults to student in API call */}


          {error && (
            <p className="text-red-600 text-sm mb-2">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm mb-2">{success}</p>

          )}

          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Create Account →
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/users/google`;
            }}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition font-medium"
          >
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold">
              Login here
            </Link>
          </p>

          <p className="text-xs text-gray-400 text-center mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}