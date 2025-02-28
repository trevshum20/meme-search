import axios from "axios";
import { useEffect, useState } from "react";
import { getFirebaseToken } from "../firebase";
import "./DeleteButton.css";
import "./MemeGrid.css";

const AllMemes = ({user}) => {
  const [memes, setMemes] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;


  useEffect(() => {
    const fetchAllMemes = async () => {
      try {
        const token = await getFirebaseToken();
        const response = await axios.get(
          `${BACKEND_BASE_URL}/api/all-memes?userEmail=${encodeURIComponent(user.email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMemes(response.data);
      } catch (error) {
        console.error("Error fetching all memes:", error);
      }
    };

    fetchAllMemes();
  }, []);

  const handleDeleteMeme = async (imageUrl) => {
    try {
      const response = await axios.delete(
        `${BACKEND_BASE_URL}/api/delete-image`,
        {
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
    <div className="container-fluid mt-4">
      <h2 className="text-center mb-4"><b>All Memes</b></h2>

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
                  className="text-decoration-none"
                >
                  <div className="image-wrapper">
                    <img
                      src={meme.s3Url}
                      alt="Meme"
                      className="card-img-top"
                      style={{ objectFit: "cover" }}
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
        <p className="text-center text-muted">No memes available.</p>
      )}
    </div>
  );
};

export default AllMemes;
