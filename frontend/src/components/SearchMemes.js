import axios from "axios";
import { useState } from "react";
import { getFirebaseToken } from "../firebase";
import "./DeleteButton.css";
import "./MemeGrid.css";
import "./SearchMemes.css";

const SearchMemes = ({ onMemeDeleted, user }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [numResultsToShow, setNumResultsToShow] = useState(5); // Default to showing 5 results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;


  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      const token = await getFirebaseToken();
      const response = await axios.get(
        `${BACKEND_BASE_URL}/api/search?query=${encodeURIComponent(query)}&userEmail=${encodeURIComponent(user.email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 429) {
        alert("⚠️ You have exceeded the rate limit. Please wait a few minutes before trying again.");
      }
      setResults(response.data);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeme = async (imageUrl) => {
    try {
      const token = await getFirebaseToken();
      const response = await axios.delete(
        `${BACKEND_BASE_URL}/api/delete-image`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { imageUrl, userEmail: user.email },
        }
      );
      if (response.status === 429) {
        alert("⚠️ You have exceeded the rate limit. Please wait a few minutes before trying again.");
      }

      if (response.status === 200) {
        setResults((prev) => prev.filter((meme) => meme.imageUrl !== imageUrl));
        onMemeDeleted(); // Trigger refresh of RecentMemes
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
    }
  };

  // Limit displayed results based on user selection
  const displayedResults = results.slice(0, numResultsToShow);

  return (
    <div className="card shadow-sm p-4">
      <h2 className="text-center mb-3">
        <b>Find Memes</b>
      </h2>

      {/* Search Input */}
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Run search when Enter is pressed
          placeholder="Describe a meme using natural language..."
        />
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading}
          style={{ fontSize: "18px", fontWeight: "bolder" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error Handling */}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      {/* Number of Results Selection */}
      {results.length > 0 && (
        <div className="mb-3 text-center">
          <label className="form-label me-2">Show:</label>
          <select
            className="form-select d-inline w-auto"
            value={numResultsToShow}
            onChange={(e) => setNumResultsToShow(Number(e.target.value))}
          >
            <option value="2">Top 2</option>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
          </select>
        </div>
      )}

      {/* Search Results */}
      <div className="mt-3">
        <div className="meme-grid-search">
          {displayedResults.length > 0
            ? displayedResults.map((meme, index) => (
                <div 
                  key={index}
                  className="meme-card meme-card-search"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="position-relative card card-img shadow-sm">
                    <a
                      href={meme.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="image-wrapper">
                        <img
                          src={meme.imageUrl}
                          alt="Meme"
                          className="card-img-top"
                        />
                      </div>
                    </a>

                    {hoveredIndex === index && (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteMeme(meme.imageUrl)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))
            : !loading && (
                <p className="text-center text-muted">No memes found.</p>
              )}
        </div>
        <div style={{ height: "21px" }}></div>
        {/* "Done" Button: Clears Search */}
        {results.length > 0 && (
          <div className="text-center mt-3">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
            >
              <b>Done</b>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchMemes;
