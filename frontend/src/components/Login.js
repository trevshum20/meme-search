
import { onAuthStateChanged } from "firebase/auth";
import React, { useState } from "react";
import { auth, loginWithGoogle, logout } from "../firebase";
import Footer from "./Footer";

const Login = () => {
  const [user, setUser] = useState(null);

  // Track authentication state
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-light">
      {/* Header */}
      <header className="w-100 text-center py-3 bg-primary text-white">
        <h1>Meme Search App</h1>
      </header>
      <br></br>
      <br></br>

      {/* Login Box */}
      <div className="card p-4 shadow-lg text-center" style={{ maxWidth: "400px" }}>
        <img
          src="https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/face-with-tears-of-joy.png"
          alt="Meme Search"
          className="img-fluid rounded mb-3"
          style={{height: "50px", width: "50px"}}
        />
        <h2>Welcome to Meme Search!</h2>
        <p>Find your memes using AI-powered search.</p>

        {user ? (
          <>
            <h4 className="text-success">Hello, {user.displayName}!</h4>
            <button className="btn btn-danger mt-3" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn btn-primary mt-3" onClick={loginWithGoogle}>
            Sign in with Google
          </button>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
