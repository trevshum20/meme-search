import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const RecentMemes = () => {
  const [memes, setMemes] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentMemes = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/recent-memes");
        setMemes(response.data);
      } catch (error) {
        console.error("Error fetching recent memes:", error);
      }
    };

    fetchRecentMemes();
  }, []);

  // Function to delete a meme
  const handleDeleteMeme = async (imageUrl) => {
    try {
      const response = await axios.delete("http://localhost:5001/api/delete-image", {
        data: { imageUrl },
      });

      if (response.status === 200) {
        // Remove the deleted meme from the list
        setMemes((prev) => prev.filter((meme) => meme.imageUrl !== imageUrl));
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
    }
  };

  return (
    <div className="card shadow-sm p-4" style={{ height: "100%" }}>
      <h4 className="text-center mb-3">Recent Memes</h4>

      <div className="list-group mb-3">
        {memes.length > 0 ? (
          memes.map((meme, index) => (
            <div
              key={index}
              className="list-group-item border-0 text-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Container to properly position the image and delete button */}
              <div className="image-container">
                <a href={meme.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={meme.imageUrl}
                    alt="Recent Meme"
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: "150px", objectFit: "cover" }}
                  />
                </a>

                {/* Trash button appears when hovering */}
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
        ) : (
          <p className="text-center text-muted">No recent memes.</p>
        )}
      </div>

      <button className="btn btn-outline-primary w-100" onClick={() => navigate("/all-memes")}>
        View All Memes
      </button>
    </div>
  );
};

export default RecentMemes;
