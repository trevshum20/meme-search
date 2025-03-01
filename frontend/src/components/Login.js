import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, getFirebaseToken, loginWithGoogle, logout } from "../firebase";
import Footer from "./Footer";

const Login = ({ setUser, setIsWhitelisted }) => {
  const [loading, setLoading] = useState(true);
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;


  useEffect(() => {
    // Listen for authentication changes
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
          if (response.status === 429) {
            alert("⚠️ You have exceeded the rate limit. Please wait a few minutes before trying again.");
          }
          setIsWhitelisted(response.data.isWhitelisted); // Pass status up
        } catch (error) {
          console.error("Error checking whitelist:", error);
          setIsWhitelisted(false);
        }
      } else {
        setIsWhitelisted(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setIsWhitelisted]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-light">
      {/* Header */}
      <header className="w-100 text-center py-3 bg-primary text-white">
        <h1>Meme Search App</h1>
      </header>
      <br />

      {/* Login Box */}
      <div className="card p-4 shadow-lg text-center" style={{ maxWidth: "400px" }}>
        <img
          src="https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/face-with-tears-of-joy.png"
          alt="Meme Search"
          className="img-fluid rounded mb-3"
          style={{ height: "50px", width: "50px" }}
        />
        <h2>Welcome to Meme Search!</h2>
        <p>Find your memes using AI-powered search.</p>

        {auth.currentUser ? (
          <>
            <h4 className="text-success">Hello, {auth.currentUser.displayName}!</h4>
            <button className="btn btn-danger mt-3" onClick={logout}>
              <b>Logout</b>
            </button>
          </>
        ) : (
          <button className="btn btn-primary mt-3" onClick={loginWithGoogle}>
            <b>Sign in with Google</b>
          </button>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
