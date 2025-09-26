import axios from "axios";
import React, { useEffect, useState } from "react";
import "./TikTokSearch.css"; // Import component-specific CSS
import TikTokVideo from "./TikTokVideo";
import { Link } from "react-router-dom";

const TikTokSearch = ({ user }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

  const handleSearch = async () => {
    if (!query.trim()) return;

    const numTopK = Number(topK);
    if (isNaN(numTopK) || numTopK < 2 || numTopK > 20) {
      setError("Please choose a number between 2 and 20.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await axios.get(
        `${BACKEND_BASE_URL}/api/search/tiktok?query=${encodeURIComponent(query)}&topK=${topK}&userEmail=${encodeURIComponent(user.email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 429) {
        alert("⚠️ You have exceeded the rate limit. Please wait a few minutes before trying again.");
      }
      
      setResults(response.data);
    } catch (err) {
      setError("Error fetching TikTok search results");
      console.error("TikTok search error:", err);
    }
    setLoading(false);
  };

  const handleReset = () => {
    window.location.reload(); // Refreshes the page to fully reset state
  };

  useEffect(() => {
    if (results.length > 0) {
      setTimeout(() => {
        const iframes = document.querySelectorAll(".tiktok-embed iframe");
        iframes.forEach((iframe) => {
          const src = iframe.src;
          iframe.src = "";
          iframe.src = src;
        });
      }, 1000);
    }
  }, [results]);

  return (
    <div className="container mt-4">
      <div className="ts-add-link">
        <Link to="/add" className="btn btn-sm btn-outline-primary">
          + Add TikTok
        </Link>
      </div>
      <h2 className="text-center mb-3 fw-bold"><b>TikTok Search</b></h2>
      <div className="search-container">
        <input
          type="text"
          className="form-control search-bar"
          placeholder="Search TikTok videos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={results.length > 0}
        />
        {results.length === 0 && (
          <div className="topk-container">
            <label htmlFor="topK" className="topk-label">Num Results:</label>
            <input
              type="number"
              id="topK"
              className="form-control topk-input"
              min="2"
              max="20"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
          </div>
        )}
        {results.length === 0 && (
          <button className="btn btn-primary search-button" onClick={handleSearch} disabled={loading}>
            <b>{loading ? "Searching..." : "Search"}</b>
          </button>
        )}
        {results.length > 0 && (
          <div className="done-button-container">
            <button className="btn btn-secondary done-button" onClick={handleReset}><b>Done</b></button>
          </div>
        )}
      </div>
      {error && <p className="text-danger text-center mt-3">{error}</p>}
      <div className="tiktok-results-container">
        {results.length > 0 ? (
          results.map((video, index) => <TikTokVideo key={index} video={video} />)
        ) : (
          <p className="text-center">No results found.</p>
        )}
      </div>
      {results.length > 0 && (
        <div className="done-button-container">
          <button className="btn btn-secondary done-button" onClick={handleReset}><b>Done</b></button>
        </div>
      )}
    </div>
  );
};

export default TikTokSearch;