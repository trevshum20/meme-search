import axios from "axios";
import { useEffect, useState } from "react";
import { getFirebaseToken } from "../firebase";
import "./DeleteButton.css";
import "./MemeGrid.css";

const AllMemes = ({ user }) => {
  const [memes, setMemes] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const MEMES_PER_PAGE = 60;
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
  }, []); // Fetch all memes once on load

  const handleDeleteMeme = async (imageUrl) => {
    try {
      const response = await axios.delete(`${BACKEND_BASE_URL}/api/delete-image`, {
        data: { imageUrl, userEmail: user.email },
      });

      if (response.status === 200) {
        setMemes((prev) => prev.filter((meme) => meme.s3Url !== imageUrl));
      }
    } catch (error) {
      console.error("Error deleting meme:", error);
    }
  };

  // Pagination logic - determine which memes to render
  const startIndex = (currentPage - 1) * MEMES_PER_PAGE;
  const paginatedMemes = memes.slice(startIndex, startIndex + MEMES_PER_PAGE);

  return (
    <div className="container-fluid mt-4">
      <h2 className="text-center mb-4"><b>All Memes</b></h2>

      {memes.length > 0 ? (
        <div>
          <div className="meme-grid">
            {paginatedMemes.map((meme, index) => (
              <div
                key={startIndex + index}
                className="meme-card"
                onMouseEnter={() => setHoveredIndex(startIndex + index)}
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

                  {hoveredIndex === startIndex + index && (
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

          {/* Pagination Controls */}
          <div className="pagination-container mt-4 d-flex justify-content-center">
            <button
              className="btn btn-dark mx-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <b>Previous</b>
            </button>
            <span className="align-self-center">
              Page {currentPage} of {Math.ceil(memes.length / MEMES_PER_PAGE)}
            </span>
            <button
              className="btn btn-dark mx-2"
              disabled={currentPage * MEMES_PER_PAGE >= memes.length}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <b>Next</b>
            </button>
          </div>
          <br></br>
        </div>
      ) : (
        <p className="text-center text-muted">No memes available.</p>
      )}
    </div>
  );
};

export default AllMemes;