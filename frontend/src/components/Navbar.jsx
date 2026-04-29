import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import api from "../api/axios";


export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [initials, setInitials] = useState("JD");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    const name = localStorage.getItem("userName") || "";
    if (name) {
      const parts = name.trim().split(" ");
      const chars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
      const computed = chars.join("") || "JD";
      setInitials(computed);
    } else {
      setInitials("JD");
    }
  }, [location.pathname]);




  const linkStyle = (path) =>
    location.pathname === path
      ? "text-blue-600 font-semibold"
      : "text-gray-600 hover:text-blue-600";

  return (
    <header className="bg-white shadow px-8 py-4 flex justify-between items-center">
      {/* LOGO */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center">
          💼
        </div>
        <span className="font-bold text-lg">AI Job Matcher</span>
      </div>

      {/* CENTER NAV (ONLY WHEN LOGGED IN) */}
      {isLoggedIn && (
        <nav className="flex gap-8 text-sm">
          <Link to="/dashboard" className={linkStyle("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/upload" className={linkStyle("/upload")}>
            Upload Resume
          </Link>
          <Link to="/jobs" className={linkStyle("/jobs")}>
            Jobs
          </Link>

          <Link to="/about" className={linkStyle("/about")}>
            About Us
          </Link>
 
        </nav>
      )}

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {!isLoggedIn && (
          <>
            <Link to="/about" className="text-sm text-gray-600 hover:text-blue-600">
              About Us
            </Link>
            <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">
              Login
            </Link>

            <Link
              to="/register"
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}


        {isLoggedIn && (
          <>
            <span className="text-xl cursor-pointer">🔔</span>

            {/* PROFILE AVATAR + DROPDOWN */}
            <div className="relative">
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer select-none"
              >
                {initials}
              </div>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    👤 My Profile
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    ℹ️ About Us
                  </Link>
                  <div className="border-t my-1" />
                  <button
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      try { await api.post("/api/users/logout"); } catch {}
                      localStorage.clear();
                      sessionStorage.clear(); // Clear upload resume state

                      setIsLoggedIn(false);
                      setShowMenu(false);
                      navigate("/");
                    }}
                  >
                    🚪 Logout

                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
