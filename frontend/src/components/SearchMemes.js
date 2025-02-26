import axios from "axios";
import { useState } from "react";

const SearchMemes = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Search Memes</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe a meme..."
        style={{ padding: "10px", width: "300px" }}
      />
      <button onClick={handleSearch} disabled={loading} style={{ marginLeft: "10px", padding: "10px" }}>
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {results.length > 0 ? (
          results.map((meme, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              <img src={meme.imageUrl} alt="Meme" style={{ width: "300px", borderRadius: "10px" }} />
              <p>{meme.description}</p>
            </div>
          ))
        ) : (
          !loading && <p>No memes found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchMemes;
