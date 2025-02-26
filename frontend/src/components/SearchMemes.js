import axios from "axios";
import { useState } from "react";

const SearchMemes = ({ onMemeDeleted }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`http://localhost:5001/api/search?query=${encodeURIComponent(query)}`);
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
      const response = await axios.delete("http://localhost:5001/api/delete-image", {
        data: { imageUrl },
      });

      if (response.status === 200) {
        setResults((prev) => prev.filter((meme) => meme.imageUrl !== imageUrl));
        onMemeDeleted(); // Trigger refresh of RecentMemes
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
    }
  };

  return (
    <div className="card shadow-sm p-4">
      <h2 className="text-center mb-3">Find Memes</h2>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe a meme using natural language..."
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{ fontSize: "18px", fontWeight: "bolder" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div className="mt-3">
        {results.length > 0 ? (
          <div className="row">
            {results.map((meme, index) => (
              <div key={index} className="col-md-4 col-sm-6 col-12 mb-3">
                <div
                  className="position-relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <a href={meme.imageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={meme.imageUrl} alt="Meme" className="img-fluid rounded shadow-sm card-img-top" style={{ width: "100%", objectFit: "cover" }} />
                  </a>

                  {hoveredIndex === index && (
                    <button className="delete-button" onClick={() => handleDeleteMeme(meme.imageUrl)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <p className="text-center text-muted">No memes found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchMemes;
