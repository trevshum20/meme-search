import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import About from "./components/About";
import AllMemes from "./components/AllMemes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Login from "./components/Login";
import MemeDashboard from "./components/MemeDashboard";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Mark loading as complete
    });

    return () => unsubscribe();
  }, []);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1 container-fluid px-4 mt-4">
          {user ? (
            <Routes>
              <Route path="/" element={<MemeDashboard />} />
              <Route path="/all-memes" element={<AllMemes />} />
              <Route path="/about" element={<About />} /> 
            </Routes>
          ) : (
            <Login />
          )}
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
