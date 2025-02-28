import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirebaseToken } from "../firebase";
import "./DeleteButton.css";
import "./MemeGrid.css";
import "./RecentMemes.css";

const RecentMemes = ({ refreshTrigger, user }) => {
  const [memes, setMemes] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navigate = useNavigate();
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

  const fetchRecentMemes = async () => {
    try {
      const token = await getFirebaseToken();
      const response = await axios.get(
        `${BACKEND_BASE_URL}/api/recent-memes?userEmail=${encodeURIComponent(user.email)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`>>> Images: `, response.data);
      setMemes(response.data.reverse());
    } catch (error) {
      console.error("Error fetching recent memes:", error);
    }
  };

  useEffect(() => {
    fetchRecentMemes();
  }, [refreshTrigger]); // Refetch when trigger updates

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

      if (response.status === 200) {
        setMemes((prev) => prev.filter((meme) => meme.s3Url !== imageUrl));
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
    }
  };

  return (
    <div>
      <br></br>
      <br></br>
      <h2 className="text-center mb-3">
        <b>Recent Memes</b>
      </h2>
      <div className="recent-memes-container">
        {memes.length > 0 ? (
          <div className="meme-grid">
            {memes.map((meme, index) => (
              <div
                key={index}
                className="meme-card"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="position-relative card card-img shadow-sm">
                  <a
                    href={meme.s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="image-wrapper">
                      <img
                        src={meme.s3Url}
                        alt="Recent Meme"
                        className="card-img-top"
                      />
                    </div>
                  </a>

                  {hoveredIndex === index && (
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteMeme(meme.s3Url)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted">No recent memes.</p>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <button
          className="btn btn-outline-primary w-100 fw-bold"
          onClick={() => navigate("/all-memes")}
          style={{ maxWidth: "300px" }}
        >
          <b>View All Memes</b>
        </button>
      </div>
      <br></br>
    </div>
  );
};

export default RecentMemes;
