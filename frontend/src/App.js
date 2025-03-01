import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import About from "./components/About";
import AllMemes from "./components/AllMemes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Login from "./components/Login";
import MemeDashboard from "./components/MemeDashboard";
import { auth, getFirebaseToken } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [isWhitelisted, setIsWhitelisted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // Track error type
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await getFirebaseToken();
          const response = await axios.post(
            `${BACKEND_BASE_URL}/auth/check`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setIsWhitelisted(response.data.isWhitelisted);
          setErrorType(null); // Reset error if successful
        } catch (error) {
          console.log("ERROR!");
          if (error.response) {
            if (error.response.status === 429) {
              setErrorType("rate-limit");
            } else if (error.response.status === 401) {
              setErrorType("whitelist");
            } else {
              setErrorType("unknown");
            }
          } else {
            setErrorType("unknown");
          }

          console.error("🚨 Error checking whitelist:", error);
          setIsWhitelisted(false);
        }
      } else {
        setIsWhitelisted(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🚀 Fix: Show loading until auth + whitelist status is confirmed
  if (loading || isWhitelisted === null) {
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
        <Header isWhitelisted={isWhitelisted} />
        <main className="flex-grow-1 container-fluid px-4 mt-4">
          {user ? (
            <Routes>
              {/* ✅ Everyone who is logged in can access About */}
              <Route path="/about" element={<About />} />

              {/* ✅ Only whitelisted users can access these routes */}
              {isWhitelisted ? (
                <>
                  <Route path="/" element={<MemeDashboard user={user} />} />
                  <Route path="/all-memes" element={<AllMemes user={user} isWhitelisted={isWhitelisted} />} />
                </>
              ) : (
                // 🚨 Show different messages based on error type
                <Route
                  path="*"
                  element={
                    <div className="text-center">
                      <h1 className="text-danger"><b>Access Issue :/</b></h1>
                      <br></br>
                      {errorType === "rate-limit" ? (
                        <p><b>You've made too many requests in a short time. Please wait a few minutes before trying again.</b></p>
                      ) : errorType === "whitelist" ? (
                        <p><b>This app has not been fully shared yet with your Google account. Please contact the app owner for access.</b></p>
                      ) : (
                        <p><b>This app has not been fully shared yet with your Google account. Please contact the app owner for access.</b></p>
                      )}
                      <button className="btn btn-danger mt-3" onClick={() => auth.signOut()}>
                        <b>Logout</b>
                      </button>
                    </div>
                  }
                />
              )}
            </Routes>
          ) : (
            // 🚀 If not logged in, show the login page
            <Login setUser={setUser} setIsWhitelisted={setIsWhitelisted} />
          )}
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
