import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, logout } from "../firebase";

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="navbar navbar-expand-sm navbar-light bg-light shadow-sm p-3">
      <div className="container-fluid">
        {/* App Title as Link */}
        <Link to="/" className="navbar-brand text-dark fw-bold">
          <h3><b>Smart Meme Index</b></h3>
        </Link>

        {/* Navbar Toggler (Hamburger) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Navigation Links */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link text-primary">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/all-memes" className="nav-link text-primary">
                All Memes
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link text-primary">
                About
              </Link>
            </li>
            <li className="nav-item">
              <a
                href="https://trevorshumway.com"
                className="nav-link text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                trevorshumway.com
              </a>
            </li>
            {/* Show Logout Button When Logged In */}
            {user && (
              <li className="nav-item">
                <button className="btn btn-outline-danger ms-3" onClick={logout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
